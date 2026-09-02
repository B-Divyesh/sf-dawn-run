import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { applyAction, createGame, roomFor, scoreGame, seedForDate, selectTool } from '../api/game-core.js';
import { createRateLimiter, listScores, submitScore } from '../api/score-service.js';
import { createApp, createRepository } from '../api/server.js';

const date = '2026-09-02';
const seed = seedForDate(date);
const pointKey = point => `${point.x},${point.y}`;
const directions = [{ token: 'R', dx: 1, dy: 0 }, { token: 'D', dx: 0, dy: 1 }, { token: 'L', dx: -1, dy: 0 }, { token: 'U', dx: 0, dy: -1 }];

function path(game, target) {
  const room = roomFor(seed, game.room);
  const blocked = new Set([...room.walls, ...room.hazards].map(pointKey));
  blocked.delete(pointKey(target));
  const queue = [{ ...game.player, path: [] }];
  const seen = new Set([pointKey(game.player)]);
  while (queue.length) {
    const current = queue.shift();
    if (current.x === target.x && current.y === target.y) return current.path;
    for (const direction of directions) {
      const next = { x: current.x + direction.dx, y: current.y + direction.dy };
      if (next.x < 0 || next.x >= 9 || next.y < 0 || next.y >= 7 || blocked.has(pointKey(next)) || seen.has(pointKey(next))) continue;
      seen.add(pointKey(next)); queue.push({ ...next, path: [...current.path, direction.token] });
    }
  }
  throw new Error('No path');
}

function completedPayload() {
  const game = selectTool(createGame(date), 'Lantern', 1);
  while (game.phase !== 'end') {
    if (game.phase === 'cashout') { applyAction(game, 'CHASE', seed, 1); continue; }
    const room = roomFor(seed, game.room);
    const target = room.beacons.find(point => !game.collected.includes(`${game.room}:${pointKey(point)}`)) || room.exit;
    for (const action of path(game, target)) { applyAction(game, action, seed, 1); if (game.phase !== 'play') break; }
  }
  return { nickname: 'Verifier', date, seed, tool: 'Lantern', result: game.finished, score: scoreGame(game), durationSeconds: 360, actions: game.log };
}

function memoryRepository() {
  const items = [];
  return {
    items,
    async list(requestedDate) { return items.filter(item => item.date === requestedDate); },
    async upsertBest(item) { const index = items.findIndex(existing => existing.id === item.id); if (index >= 0 && items[index].score > item.score) return items[index]; if (index >= 0) items[index] = item; else items.push(item); return item; },
  };
}

test('score service verifies and publishes a deterministic completed replay', async () => {
  const repository = memoryRepository();
  const result = await submitScore(repository, completedPayload(), new Date('2026-09-02T12:00:00Z'));
  assert.equal(result.status, 201); assert.equal(repository.items.length, 1); assert.equal(result.body.entry.verified, true); assert.match(result.body.entry.replay, /time=360s/);
  const listed = await listScores(repository, date, false, new Date('2026-09-02T12:00:00Z'));
  assert.equal(listed.body.entries[0].nickname, 'Verifier'); assert.equal(listed.body.entries[0].rank, 1);
});

test('@claim:replay-tamper score service rejects an altered score', async () => {
  const repository = memoryRepository(); const tampered = completedPayload(); tampered.score++;
  const rejected = await submitScore(repository, tampered, new Date('2026-09-02T12:00:00Z')); assert.equal(rejected.status, 422); assert.equal(repository.items.length, 0);
});

test('@claim:demo-submission score service verifies but never stores demo submissions', async () => {
  const repository = memoryRepository(); const demo = await submitScore(repository, { ...completedPayload(), demo: true }, new Date('2026-09-02T12:00:00Z'));
  assert.equal(demo.status, 200); assert.equal(demo.body.published, false); assert.equal(repository.items.length, 0);
});

test('score service enforces pseudonym and seven-day retention policy', async () => {
  const repository = memoryRepository(); const payload = completedPayload();
  assert.equal((await submitScore(repository, { ...payload, nickname: '!' }, new Date('2026-09-02T12:00:00Z'))).status, 400);
  assert.equal((await listScores(repository, '2026-08-20', false, new Date('2026-09-02T12:00:00Z'))).status, 400);
});

test('score request allowance rejects the eleventh request and resets after one minute', () => {
  const limited = createRateLimiter(10, 60_000);
  for (let request = 0; request < 10; request++) assert.equal(limited('198.51.100.2', 1_000 + request), false);
  assert.equal(limited('198.51.100.2', 2_000), true);
  assert.equal(limited('198.51.100.2', 62_000), false);
});

test('Hono API publishes to SQLite, returns no-store, and blocks foreign origins', async () => {
  const repository = createRepository(':memory:');
  const app = createApp(repository);
  const payload = completedPayload();
  const published = await app.request('/api/scores', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://dawn-run.sociobot.in', 'x-forwarded-for': '198.51.100.8' }, body: JSON.stringify(payload) });
  assert.equal(published.status, 201); assert.equal(published.headers.get('cache-control'), 'no-store');
  const listed = await app.request(`/api/scores?date=${date}`, { headers: { 'x-forwarded-for': '198.51.100.9' } });
  assert.equal(listed.status, 200); assert.equal((await listed.json()).entries[0].nickname, 'Verifier');
  const blocked = await app.request(`/api/scores?date=${date}`, { headers: { origin: 'https://example.com', 'x-forwarded-for': '198.51.100.10' } });
  assert.equal(blocked.status, 403);
  repository.close();
});

test('SQLite snapshot under the data mount restores after a process restart', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'dawn-run-'));
  const active = join(directory, 'active.sqlite');
  const snapshot = join(directory, 'data', 'scores.sqlite');
  const first = createRepository(active, snapshot);
  await submitScore(first, completedPayload(), new Date('2026-09-02T12:00:00Z'));
  first.close();
  rmSync(active, { force: true });
  const restored = createRepository(active, snapshot);
  assert.equal((await restored.list(date))[0].nickname, 'Verifier');
  restored.close();
  rmSync(directory, { recursive: true, force: true });
});

test('@claim:score-retention SQLite removes a published row after seven days', async () => {
  const repository = createRepository(':memory:');
  await repository.upsertBest({ id: 'expired', date, nickname: 'OldWalker', score: 100, result: 'escaped', tool: 'Hook', durationSeconds: 400, replay: 'expired replay', actions: 'R', createdAt: '2026-08-25T00:00:00.000Z', expiresAt: '2026-09-01T00:00:00.000Z' });
  assert.deepEqual(await repository.list(date), []); repository.close();
});
