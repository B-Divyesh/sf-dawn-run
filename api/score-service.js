import { createHash } from 'node:crypto';
import { replayText, verifyReplay } from './game-core.js';

const DAY_MS = 86_400_000;
const RETENTION_SECONDS = 7 * 24 * 60 * 60;

export function createRateLimiter(limit = 10, windowMs = 60_000) {
  const attempts = new Map();
  return (client, now = Date.now()) => {
    const recent = (attempts.get(client) || []).filter(value => now - value < windowMs);
    recent.push(now);
    attempts.set(client, recent);
    return recent.length > limit;
  };
}

export function validDate(date, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return false;
  const requested = Date.parse(`${date}T00:00:00.000Z`);
  const current = Date.parse(`${now.toISOString().slice(0, 10)}T00:00:00.000Z`);
  return Number.isFinite(requested) && requested <= current && requested >= current - 6 * DAY_MS;
}

export function cleanNickname(value) {
  return typeof value === 'string' ? value.replace(/[^a-zA-Z0-9 _-]/g, '').trim().slice(0, 16) : '';
}

export function publicEntry(item, rank) {
  return {
    rank,
    nickname: item.nickname,
    score: item.score,
    result: item.result,
    tool: item.tool,
    durationSeconds: item.durationSeconds,
    replay: item.replay,
    verified: true,
    createdAt: item.createdAt,
  };
}

function ranked(items) {
  return [...items]
    .sort((a, b) => b.score - a.score || a.createdAt.localeCompare(b.createdAt))
    .slice(0, 20)
    .map((item, index) => publicEntry(item, index + 1));
}

export async function listScores(repository, date, demo, now = new Date()) {
  if (!validDate(date, now)) return { status: 400, body: { message: 'Choose a UTC date from the last seven days.' } };
  if (demo) return { status: 200, body: { message: 'Sample standings loaded. Demo data is not stored.', entries: sampleEntries(date) } };
  const entries = await repository.list(date);
  return { status: 200, body: { message: entries.length ? 'Today’s verified scores are ready.' : 'No verified scores yet today.', entries: ranked(entries) } };
}

export async function submitScore(repository, body, now = new Date()) {
  if (!body || typeof body !== 'object') return { status: 400, body: { message: 'Send one completed Dawn Run result.' } };
  const nickname = cleanNickname(body.nickname);
  if (nickname.length < 2) return { status: 400, body: { message: 'Nickname must contain 2–16 letters or numbers.' } };
  if (!validDate(body.date, now)) return { status: 400, body: { message: 'Only runs from the last seven UTC days can be published.' } };
  if (!Number.isInteger(body.durationSeconds) || body.durationSeconds < 0 || body.durationSeconds > 3600) return { status: 400, body: { message: 'Reported time is outside the accepted range.' } };
  const checked = verifyReplay({ date: body.date, seed: body.seed, tool: body.tool, result: body.result, score: body.score, actions: body.actions });
  if (!checked.valid) return { status: 422, body: { message: checked.error || 'The replay could not be verified.' } };
  const createdAt = now.toISOString();
  const id = createHash('sha256').update(`${body.date}:${nickname.toLowerCase()}`).digest('hex').slice(0, 32);
  checked.game.startedAt = 1;
  checked.game.finishedAt = body.durationSeconds * 1000 + 1;
  const item = {
    id,
    date: body.date,
    nickname,
    score: checked.score,
    result: body.result,
    tool: body.tool,
    durationSeconds: body.durationSeconds,
    replay: replayText(checked.game, body.seed),
    actions: body.actions.join('.'),
    verified: true,
    createdAt,
    expiresAt: new Date(now.valueOf() + RETENTION_SECONDS * 1000).toISOString(),
    ttl: RETENTION_SECONDS,
  };
  if (body.demo === true) {
    return { status: 200, body: { message: 'Sample replay verified. Demo data was not published.', published: false, entry: publicEntry(item, 1), entries: ranked([item, ...sampleEntries(body.date)]) } };
  }
  const saved = await repository.upsertBest(item);
  const entries = await repository.list(body.date);
  return { status: 201, body: { message: saved.id === item.id && saved.score > item.score ? 'Your earlier higher score remains published.' : 'Your replay was verified and published for seven days.', published: true, entry: publicEntry(saved), entries: ranked(entries) } };
}

function sampleEntries(date) {
  return [
    { id: 'sample-1', date, nickname: 'PineFox', score: 1390, result: 'escaped', tool: 'Hook', durationSeconds: 354, replay: 'Sample verified replay', createdAt: `${date}T06:10:00.000Z` },
    { id: 'sample-2', date, nickname: 'SunMoth', score: 1325, result: 'escaped', tool: 'Decoy', durationSeconds: 382, replay: 'Sample verified replay', createdAt: `${date}T06:24:00.000Z` },
  ];
}
