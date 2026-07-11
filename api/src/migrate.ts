import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';

// Простой раннер миграций: выполняет db/migrations/*.sql по порядку,
// уже применённые пропускает (таблица _migrations).
const dir = join(dirname(fileURLToPath(import.meta.url)), '../../db/migrations');

await pool.query('CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT now())');
const applied = new Set((await pool.query('SELECT name FROM _migrations')).rows.map((r) => r.name));

for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
  if (applied.has(file)) continue;
  console.log(`Применяю ${file}…`);
  await pool.query('BEGIN');
  try {
    await pool.query(readFileSync(join(dir, file), 'utf8'));
    await pool.query('INSERT INTO _migrations(name) VALUES ($1)', [file]);
    await pool.query('COMMIT');
  } catch (e) {
    await pool.query('ROLLBACK');
    throw e;
  }
}
console.log('Миграции применены.');
await pool.end();
