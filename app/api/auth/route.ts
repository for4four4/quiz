import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { ensureSchema, query } from "@/lib/server/db";
import { clearSessionCookie, getSession, setSessionCookie } from "@/lib/server/auth";
import { rateLimit, clientIp } from "@/lib/server/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UserRow = { id: number; email: string; name: string; company: string; password: string; plan: string; lead_limit: number };

// bcrypt (аудит H4). Старые хеши формата "salt:sha256hex" проверяем и
// прозрачно перехешируем в bcrypt при первом успешном входе.
function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}
function isLegacy(stored: string): boolean {
  return /^[0-9a-f]{32}:[0-9a-f]{64}$/i.test(stored);
}
function verifyPassword(password: string, stored: string): boolean {
  if (isLegacy(stored)) {
    const [salt, hash] = stored.split(":");
    return !!salt && createHash("sha256").update(salt + password).digest("hex") === hash;
  }
  try { return bcrypt.compareSync(password, stored); } catch { return false; }
}

// GET /api/auth — текущий пользователь
export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ user: null });
  await ensureSchema();
  const [u] = await query<UserRow>("SELECT id,email,name,company,plan,lead_limit FROM users WHERE id=$1", [s.uid]);
  return NextResponse.json({ user: u ? { id: u.id, email: u.email, name: u.name, company: u.company, plan: u.plan, leadLimit: u.lead_limit } : null });
}

// POST /api/auth?action=register|login|logout
export async function POST(req: Request) {
  const action = new URL(req.url).searchParams.get("action");
  if (action === "logout") {
    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  }

  // Анти-брутфорс/анти-стаффинг (аудит H3/M2): лимит попыток входа/регистрации по IP
  const ip = clientIp(req);
  const rl = rateLimit(`auth:${ip}`, 15, 5 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Слишком много попыток, попробуйте позже" }, { status: 429 });

  await ensureSchema();
  const body = (await req.json()) as { email?: string; password?: string; name?: string; company?: string };
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  if (!email || !password) return NextResponse.json({ error: "Нужны почта и пароль" }, { status: 400 });

  if (action === "register") {
    if (password.length < 8) return NextResponse.json({ error: "Пароль не короче 8 символов" }, { status: 400 });
    const [exists] = await query<UserRow>("SELECT id FROM users WHERE lower(email)=$1", [email]);
    if (exists) return NextResponse.json({ error: "Почта уже занята" }, { status: 409 });
    const [u] = await query<UserRow>(
      "INSERT INTO users (email,name,company,password) VALUES ($1,$2,$3,$4) RETURNING id,email",
      [email, body.name || "", body.company || "", hashPassword(password)]
    );
    await setSessionCookie({ uid: u.id, email: u.email });
    return NextResponse.json({ ok: true });
  }

  // login
  const [u] = await query<UserRow>("SELECT id,email,password FROM users WHERE lower(email)=$1", [email]);
  if (!u || !verifyPassword(password, u.password)) {
    return NextResponse.json({ error: "Неверная почта или пароль" }, { status: 401 });
  }
  // Прозрачный перехеш старого SHA-256 в bcrypt (аудит H4)
  if (isLegacy(u.password)) {
    try { await query("UPDATE users SET password=$2 WHERE id=$1", [u.id, hashPassword(password)]); } catch { /* ignore */ }
  }
  await setSessionCookie({ uid: u.id, email: u.email });
  return NextResponse.json({ ok: true });
}
