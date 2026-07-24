import "server-only";

// Кеш для быстрой отдачи квизов (и другого горячего чтения).
// Сейчас — in-memory; при переходе на несколько сервисов заменяется на Redis
// (тот же async-интерфейс, поэтому вызовы менять не придётся — только этот файл).
//
// Redis-заготовка: при заданном REDIS_URL здесь появится клиент ioredis,
// а cacheGet/cacheSet/cacheDel будут ходить в него. Логика вызовов не меняется.

type Entry = { v: unknown; exp: number };
const store: Map<string, Entry> = ((globalThis as { _qvCache?: Map<string, Entry> })._qvCache ??= new Map());

// периодическая чистка протухших ключей
if (!(globalThis as { _qvCacheTimer?: boolean })._qvCacheTimer) {
  (globalThis as { _qvCacheTimer?: boolean })._qvCacheTimer = true;
  setInterval(() => {
    const now = Date.now();
    for (const [k, e] of store) if (e.exp < now) store.delete(k);
  }, 60_000).unref?.();
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const e = store.get(key);
  if (!e) return null;
  if (e.exp < Date.now()) { store.delete(key); return null; }
  return e.v as T;
}

export async function cacheSet(key: string, value: unknown, ttlMs: number): Promise<void> {
  store.set(key, { v: value, exp: Date.now() + ttlMs });
}

export async function cacheDel(...keys: string[]): Promise<void> {
  for (const k of keys) store.delete(k);
}
