import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore } from '../server/store.js';
test('database changes survive a restart and seed never overwrites user edits', () => {
  const folder = mkdtempSync(join(tmpdir(), 'kyz-store-'));
  const filename = join(folder, 'catalogue.sqlite');
  try {
    let store = createStore(filename);
    const original = store.get('daytona');
    store.save({ ...original, price: 12345 });
    store.remove('nautilus');
    store.close();
    store = createStore(filename);
    assert.equal(store.get('daytona').price, 12345);
    assert.equal(store.get('nautilus'), null);
    assert.equal(store.history('nautilus').length, 0);
    store.close();
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});
test('a deliberately emptied catalogue stays empty after restart', () => {
  const folder = mkdtempSync(join(tmpdir(), 'kyz-empty-'));
  const file = join(folder, 'data.sqlite');
  try {
    let s = createStore(file);
    s.all().forEach((w) => s.remove(w.id));
    s.close();
    s = createStore(file);
    assert.equal(s.all().length, 0);
    assert.equal(s.analytics().count, 0);
    assert.equal(s.analytics().median, null);
    s.close();
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});
