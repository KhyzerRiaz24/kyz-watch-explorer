import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { timingSafeEqual, randomUUID, createHash } from 'node:crypto';
import { answer } from './advisor.js';
import { validateWatch } from './validation.js';

const hash = (value) => createHash('sha256').update(value).digest();
export function createApp({
  store,
  adminToken = '',
  apiKey = '',
  model = '',
  production = false,
  trustProxy = false,
  rateLimits = true,
  fetchImpl,
} = {}) {
  const app = express();
  app.disable('x-powered-by');
  if (trustProxy) app.set('trust proxy', 1);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", ...(production ? [] : ["'unsafe-inline'"])],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'https:', 'data:'],
          connectSrc: ["'self'", ...(production ? [] : ['ws:', 'wss:'])],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: production ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.get('/api/health', (_req, res) => {
    store.db.prepare('SELECT 1').get();
    res.json({ status: 'ok', version: '1.0.0' });
  });
  if (rateLimits)
    app.use(
      '/api',
      rateLimit({
        windowMs: 60000,
        limit: 240,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        message: { error: 'Too many requests. Please try again shortly.' },
      }),
    );
  app.use('/api', express.json({ limit: '24kb' }));
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.get('/api/config', (_req, res) =>
    res.json({
      aiEnabled: Boolean(apiKey && model),
      adminEnabled: Boolean(adminToken),
      currency: 'USD',
    }),
  );
  app.get('/api/watches', (_req, res) =>
    res.json({
      watches: store.all(),
      source: 'Original student-project demonstration catalogue',
      currency: 'USD',
    }),
  );
  app.get('/api/watches/:id/history', (req, res) => {
    if (!store.get(req.params.id)) return res.status(404).json({ error: 'Watch not found.' });
    res.json({
      points: store.history(req.params.id),
      synthetic: true,
      source: 'Reproducible synthetic example; not recorded market prices',
      period: 'January–December 2025',
      currency: 'USD',
    });
  });
  app.get('/api/watches/:id', (req, res) => {
    const watch = store.get(req.params.id);
    return watch ? res.json(watch) : res.status(404).json({ error: 'Watch not found.' });
  });
  app.get('/api/insights', (_req, res) => res.json(store.analytics()));
  const chatLimiter = rateLimit({
    windowMs: 600000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'You’ve reached the assistant’s limit. Please try again in 10 minutes.' },
  });
  app.post('/api/chat', ...(rateLimits ? [chatLimiter] : []), async (req, res) => {
    if (
      typeof req.body?.message !== 'string' ||
      !req.body.message.trim() ||
      req.body.message.length > 1000
    )
      return res.status(400).json({ error: 'Enter a question between 1 and 1,000 characters.' });
    const result = await answer(req.body.message.trim(), store.all(), { apiKey, model, fetchImpl });
    res.json(result);
  });
  const adminLimiter = rateLimit({
    windowMs: 900000,
    limit: 25,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: { error: 'Too many unsuccessful sign-in attempts. Try again in 15 minutes.' },
  });
  app.use('/api/admin', ...(rateLimits ? [adminLimiter] : []), (req, res, next) => {
    if (!adminToken)
      return res.status(503).json({
        error:
          'The studio is disabled. Run npm run setup on the server to configure a private access key.',
      });
    const candidate = req.get('authorization')?.replace(/^Bearer /, '') ?? '';
    if (!timingSafeEqual(hash(candidate), hash(adminToken)))
      return res.status(401).json({ error: 'That access key is incorrect.' });
    next();
  });
  app.get('/api/admin/session', (_req, res) => res.json({ authenticated: true }));
  app.post('/api/admin/watches', (req, res) => {
    try {
      const watch = validateWatch(req.body, randomUUID());
      store.save(watch);
      return res.status(201).json(watch);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });
  app.put('/api/admin/watches/:id', (req, res) => {
    if (!store.get(req.params.id)) return res.status(404).json({ error: 'Watch not found.' });
    try {
      const watch = validateWatch(req.body, req.params.id);
      store.save(watch);
      return res.json(watch);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });
  app.delete('/api/admin/watches/:id', (req, res) =>
    store.remove(req.params.id)
      ? res.status(204).end()
      : res.status(404).json({ error: 'Watch not found.' }),
  );
  app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found.' }));
  return app;
}

// Registered after Vite/static handling so errors are returned without stack traces.
export function errorHandler(error, _req, res, _next) {
  const status = error.type === 'entity.too.large' ? 413 : error instanceof SyntaxError ? 400 : 500;
  res.status(status).json({
    error:
      status === 413
        ? 'Request is too large.'
        : status === 400
          ? 'Invalid JSON request.'
          : 'Something went wrong. Please try again.',
  });
}
