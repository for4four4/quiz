import "server-only";

// Простой in-memory rate-limit (фиксированное окно). Достаточно для одного
// инстанса; при переходе на несколько сервисов заменить на Redis (роадмап).
type Bucket = { count: number; reset: number };
const store: Map<string, Bucket> = ((globalThis as { _qvRL?: Map<string, Bucket> })._qvRL ??= new Map());

// периодическая чистка, чтобы Map не рос бесконечно
if (!(globalThis as { _qvRLTimer?: boolean })._qvRLTimer) {
  (globalThis as { _qvRLTimer?: boolean })._qvRLTimer = true;
  setInterval(() => {
    const now = Date.now();
    for (const [k, b] of store) if (b.reset < now) store.delete(k);
  }, 60_000).unref?.();
}

/** Вернёт ok=false, если по ключу превышен лимит за окно windowMs. */
export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const b = store.get(key);
  if (!b || b.reset < now) {
    store.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  b.count++;
  if (b.count > limit) return { ok: false, retryAfter: Math.ceil((b.reset - now) / 1000) };
  return { ok: true, retryAfter: 0 };
}

/** Клиентский IP из доверенного заголовка. За нашим прокси — первый хоп XFF. */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") || "";
  return (xff.split(",")[0] || req.headers.get("x-real-ip") || "0.0.0.0").trim();
}
