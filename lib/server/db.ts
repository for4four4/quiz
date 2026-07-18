import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Pool } from "pg";
import { env } from "./env";

// A single lazily-created pool, reused across hot reloads in dev.
const globalForPg = globalThis as unknown as { _qvPool?: Pool; _qvSchema?: boolean };

export function pool(): Pool {
  if (!globalForPg._qvPool) {
    if (!env.databaseUrl) throw new Error("DATABASE_URL не задан");
    globalForPg._qvPool = new Pool({ connectionString: env.databaseUrl, max: 10 });
  }
  return globalForPg._qvPool;
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const res = await pool().query(text, params);
  return res.rows as T[];
}

/** Idempotently create tables from db/schema.sql on first use. */
export async function ensureSchema(): Promise<void> {
  if (globalForPg._qvSchema) return;
  const sql = readFileSync(join(process.cwd(), "db", "schema.sql"), "utf8");
  await pool().query(sql);
  globalForPg._qvSchema = true;
}
