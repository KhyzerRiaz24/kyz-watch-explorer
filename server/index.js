import 'dotenv/config';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createStore } from './store.js';
import { createApp, errorHandler } from './app.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const production = process.env.NODE_ENV === 'production';
const store = createStore(resolve(root, process.env.DATABASE_PATH || 'data/kyz.sqlite'));
const app = createApp({
  store,
  adminToken: process.env.ADMIN_TOKEN,
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_MODEL,
  production,
  trustProxy: process.env.TRUST_PROXY === '1',
});
let vite;
if (production) {
  app.use(express.static(resolve(root, 'dist'), { index: false, maxAge: '1h' }));
  app.get('/{*path}', (_req, res) => res.sendFile(resolve(root, 'dist/index.html')));
} else {
  const { createServer } = await import('vite');
  vite = await createServer({ root, server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
}
app.use(errorHandler);
const port = Number(process.env.PORT || 4177);
const host = process.env.HOST || '127.0.0.1';
const server = app.listen(port, host, () =>
  console.log(`KYZ Watch Explorer: http://${host}:${port}`),
);
server.on('error', async (error) => {
  console.error(`Unable to start the server (${error.code}). Check the configured port.`);
  await vite?.close();
  store.close();
  process.exitCode = 1;
});
let closing = false;
async function shutdown() {
  if (closing) return;
  closing = true;
  const forceExit = setTimeout(() => process.exit(1), 10000).unref();
  // Release development WebSocket clients before waiting for HTTP connections.
  await vite?.close();
  server.close(() => {
    store.close();
    clearTimeout(forceExit);
    process.exit(0);
  });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
