import { copyFileSync, existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { createRateLimiter, listScores, submitScore } from './score-service.js';

export function createRepository(databasePath, persistPath) {
  if (databasePath !== ':memory:') {
    mkdirSync(dirname(databasePath), { recursive: true });
    if (persistPath && existsSync(persistPath)) copyFileSync(persistPath, databasePath);
  }
  const database = new Database(databasePath);
  database.pragma('journal_mode = DELETE');
  database.pragma('busy_timeout = 5000');
  database.exec(`CREATE TABLE IF NOT EXISTS scores (
    id TEXT NOT NULL,
    date TEXT NOT NULL,
    nickname TEXT NOT NULL,
    score INTEGER NOT NULL,
    result TEXT NOT NULL,
    tool TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL,
    replay TEXT NOT NULL,
    actions TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    PRIMARY KEY (id, date)
  ); CREATE INDEX IF NOT EXISTS scores_date_rank ON scores(date, score DESC, duration_seconds ASC);`);
  const persist = () => {
    if (!persistPath || databasePath === ':memory:') return;
    mkdirSync(dirname(persistPath), { recursive: true });
    const nextPath = `${persistPath}.next`;
    rmSync(nextPath, { force: true });
    copyFileSync(databasePath, nextPath);
    renameSync(nextPath, persistPath);
  };
  persist();
  const rowToItem = row => row ? ({ id: row.id, date: row.date, nickname: row.nickname, score: row.score, result: row.result, tool: row.tool, durationSeconds: row.duration_seconds, replay: row.replay, actions: row.actions, verified: true, createdAt: row.created_at, expiresAt: row.expires_at }) : undefined;
  return {
    async list(date) {
      const removed = database.prepare('DELETE FROM scores WHERE expires_at <= ?').run(new Date().toISOString());
      if (removed.changes) persist();
      return database.prepare('SELECT * FROM scores WHERE date = ? ORDER BY score DESC, duration_seconds ASC LIMIT 20').all(date).map(rowToItem);
    },
    async upsertBest(item) {
      const existing = rowToItem(database.prepare('SELECT * FROM scores WHERE id = ? AND date = ?').get(item.id, item.date));
      if (existing && existing.score > item.score) return existing;
      database.prepare(`INSERT INTO scores (id,date,nickname,score,result,tool,duration_seconds,replay,actions,created_at,expires_at)
        VALUES (@id,@date,@nickname,@score,@result,@tool,@durationSeconds,@replay,@actions,@createdAt,@expiresAt)
        ON CONFLICT(id,date) DO UPDATE SET nickname=excluded.nickname,score=excluded.score,result=excluded.result,tool=excluded.tool,duration_seconds=excluded.duration_seconds,replay=excluded.replay,actions=excluded.actions,created_at=excluded.created_at,expires_at=excluded.expires_at`).run(item);
      persist();
      return item;
    },
    close() { persist(); database.close(); },
  };
}

export function createApp(repository) {
  const app = new Hono();
  const limited = createRateLimiter();
  app.use('/api/*', async (context, next) => {
    context.header('Cache-Control', 'no-store');
    context.header('X-Content-Type-Options', 'nosniff');
    const origin = context.req.header('origin');
    const allowed = !origin || origin === 'https://dawn-run.sociobot.in' || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);
    if (!allowed) return context.json({ message: 'Cross-origin score requests are not allowed.' }, 403);
    const client = context.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (limited(client)) { context.header('Retry-After', '60'); return context.json({ message: 'Too many score requests. Wait one minute and try again.' }, 429); }
    await next();
  });
  app.get('/', context => context.json({ ok: true, service: 'sf-dawn-run-api' }));
  app.get('/health', context => context.json({ ok: true, service: 'sf-dawn-run-api' }));
  app.get('/api/scores', async context => {
    const result = await listScores(repository, context.req.query('date') || '', context.req.query('demo') === '1');
    return context.json(result.body, result.status);
  });
  app.post('/api/scores', bodyLimit({ maxSize: 50 * 1024, onError: context => context.json({ message: 'The replay is too large.' }, 413) }), async context => {
    let body;
    try { body = await context.req.json(); }
    catch { return context.json({ message: 'Send valid JSON.' }, 400); }
    const result = await submitScore(repository, body);
    return context.json(result.body, result.status);
  });
  app.notFound(context => context.json({ message: 'Score route not found.' }, 404));
  app.onError((error, context) => { console.error('score request failed', error); return context.json({ message: 'Verified scores are temporarily unavailable. Your local run is safe.' }, 503); });
  return app;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const databasePath = process.env.DATABASE_PATH || '/tmp/dawn-run.sqlite';
  const persistPath = process.env.PERSIST_PATH || '/data/dawn-run-scores-v3.sqlite';
  const port = Number(process.env.PORT || 8080);
  serve({ fetch: createApp(createRepository(databasePath, persistPath)).fetch, port }, info => console.log(`sf-dawn-run-api listening on ${info.port}`));
}
