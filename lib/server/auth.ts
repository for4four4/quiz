import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { assertConfigured, env } from "./env";

const COOKIE = "qv_session";

export type Session = { uid: number; email: string };

export function signSession(s: Session): string {
  return jwt.sign(s, assertConfigured("JWT_SECRET", env.jwtSecret), { expiresIn: "30d" });
}

export async function setSessionCookie(s: Session): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, signSession(s), {
    httpOnly: true,
    // Secure-cookie только под HTTPS: иначе куку не отдаст плейн-HTTP
    // (локальный docker / сервер без TLS) и вход бы не работал.
    secure: env.publicOrigin.startsWith("https://"),
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

/** Returns the current session or null. */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token || !env.jwtSecret) return null;
  try {
    return jwt.verify(token, env.jwtSecret) as Session;
  } catch {
    return null;
  }
}

/** Throws if not authenticated — use at the top of protected route handlers. */
export async function requireSession(): Promise<Session> {
  const s = await getSession();
  if (!s) throw new Response("Не авторизован", { status: 401 });
  return s;
}
