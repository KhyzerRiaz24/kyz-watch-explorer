import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';

const catalogue = JSON.parse(
  readFileSync(new URL('../shared/catalogue.json', import.meta.url), 'utf8'),
);

export function createStore(filename = ':memory:') {
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS watches (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, brand TEXT NOT NULL, style TEXT NOT NULL,
      price REAL NOT NULL CHECK(price > 0), data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS price_history (
      watch_id TEXT NOT NULL REFERENCES watches(id) ON DELETE CASCADE,
      date TEXT NOT NULL, price REAL NOT NULL CHECK(price > 0), PRIMARY KEY(watch_id, date)
    );
    PRAGMA user_version = 1;`);
  const upsert = db.prepare(
    'INSERT INTO watches(id, name, brand, style, price, data) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, brand=excluded.brand, style=excluded.style, price=excluded.price, data=excluded.data',
  );
  const save = (watch) => {
    upsert.run(watch.id, watch.name, watch.brand, watch.style, watch.price, JSON.stringify(watch));
    return watch;
  };
  if (!db.prepare("SELECT value FROM metadata WHERE key = 'seeded'").get()) {
    db.exec('BEGIN');
    try {
      const insertPrice = db.prepare('INSERT INTO price_history VALUES (?, ?, ?)');
      catalogue.forEach((watch, index) => {
        save(watch);
        for (let month = 0; month < 12; month++) {
          // Explicitly synthetic: distinct reproducible paths, all anchored to the demo snapshot.
          const factor =
            1 -
            (11 - month) * (0.004 + index * 0.0015) +
            (month === 11 ? 0 : Math.sin(month + index) * 0.018);
          insertPrice.run(
            watch.id,
            `2025-${String(month + 1).padStart(2, '0')}-01`,
            Math.round((watch.price * factor) / 10) * 10,
          );
        }
      });
      db.prepare('INSERT INTO metadata VALUES (?, ?)').run('seeded', '1');
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
  const all = () =>
    db
      .prepare('SELECT data FROM watches ORDER BY name')
      .all()
      .map((row) => JSON.parse(row.data));
  return {
    db,
    all,
    save,
    get: (id) => {
      const row = db.prepare('SELECT data FROM watches WHERE id = ?').get(id);
      return row ? JSON.parse(row.data) : null;
    },
    remove: (id) => Number(db.prepare('DELETE FROM watches WHERE id = ?').run(id).changes),
    history: (id) =>
      db.prepare('SELECT date, price FROM price_history WHERE watch_id = ? ORDER BY date').all(id),
    analytics: () => {
      const total = db
        .prepare(
          'SELECT COUNT(*) AS count, MIN(price) AS min, MAX(price) AS max, AVG(price) AS average FROM watches',
        )
        .get();
      const median = db
        .prepare(
          'SELECT AVG(price) AS value FROM (SELECT price FROM watches ORDER BY price LIMIT (2 - (SELECT COUNT(*) FROM watches) % 2) OFFSET (SELECT (COUNT(*) - 1) / 2 FROM watches))',
        )
        .get().value;
      const brands = db
        .prepare(
          'SELECT brand, COUNT(*) AS count, AVG(price) AS average, MIN(price) AS min, MAX(price) AS max FROM watches GROUP BY brand ORDER BY average',
        )
        .all();
      const styles = db
        .prepare(
          'SELECT style, COUNT(*) AS count FROM watches GROUP BY style ORDER BY count DESC, style',
        )
        .all();
      return {
        ...total,
        median,
        brands,
        styles,
        currency: 'USD',
        source: 'Illustrative catalogue snapshot; not live market data',
        seriesPeriod: 'January–December 2025 (synthetic)',
      };
    },
    close: () => db.close(),
  };
}
