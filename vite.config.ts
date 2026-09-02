import { defineConfig } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { listScores, submitScore } from './api/score-service.js';

type StoredScore = { id: string; date: string; score: number; durationSeconds: number } & Record<string, unknown>;

function scoreApi() {
  const scores: StoredScore[] = [];
  const repository = {
    async list(date: string) { return scores.filter(item => item.date === date); },
    async upsertBest(item: StoredScore) {
      const index = scores.findIndex(existing => existing.id === item.id && existing.date === item.date);
      if (index >= 0 && scores[index].score > item.score) return scores[index];
      if (index >= 0) scores[index] = item; else scores.push(item);
      return item;
    },
  };
  const handler = async (request: IncomingMessage, response: ServerResponse) => {
    const url = new URL(request.url || '/api/scores', 'http://127.0.0.1');
    let result;
    if (request.method === 'GET') result = await listScores(repository, url.searchParams.get('date') || '', url.searchParams.get('demo') === '1');
    else if (request.method === 'POST') {
      const chunks: Uint8Array[] = [];
      for await (const chunk of request) chunks.push(chunk);
      try { result = await submitScore(repository, JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { result = { status: 400, body: { message: 'Send valid JSON.' } }; }
    } else result = { status: 405, body: { message: 'Method not allowed.' } };
    response.statusCode = result.status;
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Cache-Control', 'no-store');
    response.end(JSON.stringify(result.body));
  };
  return {
    name: 'dawn-run-score-api',
    configureServer(server: { middlewares: { use: (path: string, handler: typeof handler) => void } }) { server.middlewares.use('/api/scores', handler); },
    configurePreviewServer(server: { middlewares: { use: (path: string, handler: typeof handler) => void } }) { server.middlewares.use('/api/scores', handler); },
  };
}

export default defineConfig({
  plugins: [scoreApi()],
  build: { target: 'es2022', sourcemap: false },
  server: { host: '127.0.0.1' }
});
