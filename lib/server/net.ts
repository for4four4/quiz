import "server-only";
import { lookup } from "node:dns/promises";

// Защита от SSRF: разрешаем только публичные https-адреса, блокируем приватные,
// loopback, link-local и метаданные облака (169.254.169.254). Применяется при
// сохранении интеграций и перед каждым исходящим запросом на пользовательский URL.

function ipv4IsPrivate(ip: string): boolean {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;
  const [a, b] = p;
  if (a === 0 || a === 10 || a === 127) return true;              // 0/8, 10/8, loopback
  if (a === 169 && b === 254) return true;                         // link-local + metadata
  if (a === 172 && b >= 16 && b <= 31) return true;                // 172.16/12
  if (a === 192 && b === 168) return true;                         // 192.168/16
  if (a === 100 && b >= 64 && b <= 127) return true;               // CGNAT 100.64/10
  if (a >= 224) return true;                                       // multicast/reserved
  return false;
}

function ipIsPrivate(ip: string): boolean {
  const v = ip.toLowerCase();
  if (v === "::1" || v === "::" ) return true;
  if (v.startsWith("fe80") || v.startsWith("fc") || v.startsWith("fd")) return true; // link-local, ULA
  if (v.startsWith("::ffff:")) return ipv4IsPrivate(v.slice(7));   // IPv4-mapped
  if (v.includes(".")) return ipv4IsPrivate(v);
  return false;
}

/** Синхронная проверка формата URL (без DNS) — для валидации при сохранении. */
export function isPublicHttpsUrl(raw: string): boolean {
  let u: URL;
  try { u = new URL(raw); } catch { return false; }
  if (u.protocol !== "https:") return false;
  const host = u.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return false;
  // литеральный IP в хосте
  if (/^[\d.]+$/.test(host) || host.includes(":")) return !ipIsPrivate(host.replace(/^\[|\]$/g, ""));
  return true;
}

/** Полная асинхронная проверка (формат + резолв DNS в непубличный адрес). Бросает Error. */
export async function assertSafeUrl(raw: string): Promise<void> {
  if (!isPublicHttpsUrl(raw)) throw new Error("Небезопасный или недопустимый URL (нужен публичный https)");
  const host = new URL(raw).hostname.replace(/^\[|\]$/g, "");
  if (/^[\d.]+$/.test(host) || host.includes(":")) return; // литеральный IP уже проверен
  let addrs: { address: string }[] = [];
  try { addrs = await lookup(host, { all: true }); } catch { throw new Error("Не удалось разрешить хост"); }
  if (!addrs.length || addrs.some((a) => ipIsPrivate(a.address))) {
    throw new Error("Хост разрешается в приватный адрес");
  }
}
