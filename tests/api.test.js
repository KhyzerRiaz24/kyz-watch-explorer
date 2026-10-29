import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { createApp, errorHandler } from '../server/app.js';
import { createStore } from '../server/store.js';

let store, server, base, adminToken;
test.beforeEach(async () => {
  store = createStore();
  adminToken = randomBytes(32).toString('hex');
  const app = createApp({ store, adminToken, rateLimits: false, production: true });
  app.use(errorHandler);
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
});
test.afterEach(async () => {
  await new Promise((resolve) => server.close(resolve));
  store.close();
});
const auth = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` });
test('catalogue is read from the database and returns numeric USD prices', async () => {
  const response = await fetch(`${base}/api/watches`);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.watches.length, 10);
  assert.ok(data.watches.every((w) => typeof w.price === 'number' && w.currency === 'USD'));
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-powered-by'), null);
});
test('history is per watch and explicitly identifies synthetic data', async () => {
  const a = await (await fetch(`${base}/api/watches/daytona/history`)).json();
  const b = await (await fetch(`${base}/api/watches/nautilus/history`)).json();
  assert.equal(a.points.length, 12);
  assert.equal(a.synthetic, true);
  assert.notDeepEqual(a.points, b.points);
  assert.match(a.source, /not recorded market prices/);
});
test('unknown IDs return 404, including invalid and SQL-like input', async () => {
  for (const id of ['missing', "' OR 1=1 --"])
    assert.equal((await fetch(`${base}/api/watches/${encodeURIComponent(id)}`)).status, 404);
});
test('admin CRUD requires authorisation and persists changes in the catalogue', async () => {
  const original = store.get('daytona');
  assert.equal(
    (
      await fetch(`${base}/api/admin/watches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(original),
      })
    ).status,
    401,
  );
  const createdResponse = await fetch(`${base}/api/admin/watches`, {
    method: 'POST',
    headers: auth(),
    body: JSON.stringify({ ...original, name: 'Integration test reference', price: 12500 }),
  });
  assert.equal(createdResponse.status, 201);
  const created = await createdResponse.json();
  assert.notEqual(created.id, original.id);
  assert.equal(store.get(created.id).price, 12500);
  const edited = await fetch(`${base}/api/admin/watches/${created.id}`, {
    method: 'PUT',
    headers: auth(),
    body: JSON.stringify({ ...created, price: 13500 }),
  });
  assert.equal(edited.status, 200);
  assert.equal(store.get(created.id).price, 13500);
  assert.equal(
    (await fetch(`${base}/api/admin/watches/${created.id}`, { method: 'DELETE', headers: auth() }))
      .status,
    204,
  );
  assert.equal(store.get(created.id), null);
});
test('invalid input and insecure image schemes cannot create a watch', async () => {
  for (const invalid of [
    { price: -1 },
    { price: '1000' },
    { image: 'javascript:alert(1)' },
    { features: [null] },
    { name: '' },
    { style: 'Unknown' },
  ]) {
    const response = await fetch(`${base}/api/admin/watches`, {
      method: 'POST',
      headers: auth(),
      body: JSON.stringify({ ...store.get('daytona'), ...invalid }),
    });
    assert.equal(response.status, 400);
    assert.equal(store.all().length, 10);
  }
});
test('analytics accurately calculate the seeded catalogue and reflect edits', async () => {
  let data = await (await fetch(`${base}/api/insights`)).json();
  assert.equal(data.count, 10);
  assert.equal(data.median, 80000);
  assert.equal(data.min, 14300);
  assert.equal(data.average, 108130);
  store.remove('grand-complications');
  data = await (await fetch(`${base}/api/insights`)).json();
  assert.equal(data.count, 9);
  assert.equal(data.max, 195000);
});
test('chat validation rejects malformed input and enforces matching', async () => {
  for (const message of ['', 'a'.repeat(1001), null])
    assert.equal(
      (
        await fetch(`${base}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message }),
        })
      ).status,
      400,
    );
  const response = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Rolex under 100' }),
  });
  const data = await response.json();
  assert.equal(data.recommendations.length, 0);
  assert.match(data.reply, /no watches/i);
});
test('malformed and oversized JSON requests fail safely', async () => {
  const invalid = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{bad',
  });
  assert.equal(invalid.status, 400);
  assert.doesNotMatch(await invalid.text(), /stack|server\//);
  const huge = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'x'.repeat(30000) }),
  });
  assert.equal(huge.status, 413);
});
test('security headers restrict embedding and executable content', async () => {
  const r = await fetch(`${base}/api/health`);
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  assert.match(r.headers.get('content-security-policy'), /script-src 'self'/);
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
});

test('failed studio access and chat requests are rate limited', async () => {
  const guarded = createApp({ store, adminToken, rateLimits: true });
  guarded.use(errorHandler);
  const listener = guarded.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const address = `http://127.0.0.1:${listener.address().port}`;
  try {
    for (let i = 0; i < 25; i++)
      assert.equal((await fetch(`${address}/api/admin/session`)).status, 401);
    assert.equal((await fetch(`${address}/api/admin/session`)).status, 429);
    for (let i = 0; i < 20; i++)
      assert.equal(
        (
          await fetch(`${address}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Hello' }),
          })
        ).status,
        200,
      );
    assert.equal(
      (
        await fetch(`${address}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Hello' }),
        })
      ).status,
      429,
    );
  } finally {
    await new Promise((resolve) => listener.close(resolve));
  }
});

test('an unconfigured editor is disabled and no configuration response exposes credentials', async () => {
  const unconfigured = createApp({ store, rateLimits: false });
  const listener = unconfigured.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const address = `http://127.0.0.1:${listener.address().port}`;
  try {
    assert.equal((await fetch(`${address}/api/admin/session`)).status, 503);
    const publicConfig = await (await fetch(`${base}/api/config`)).text();
    assert.ok(!publicConfig.includes(adminToken));
    assert.doesNotMatch(publicConfig, /apiKey|ADMIN_TOKEN/);
  } finally {
    await new Promise((resolve) => listener.close(resolve));
  }
});
