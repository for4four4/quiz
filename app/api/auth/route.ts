import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { ensureSchema, query } from "@/lib/server/db";
import { clearSessionCookie, getSession, setSessionCookie } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UserRow = { id: number; email: string; name: string; company: string; password: string; plan: string; lead_limit: number };

// Salted SHA-256 (кодовая база без нативных зависимостей; при желании заменить на argon2/bcrypt).
function hashPassword(password: string, salt = randomBytes(16).toString("hex")): string {
  const hash = createHash("sha256").update(salt + password).digest("hex");
  return `${salt}:${hash}`;
}
function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  return !!salt && createHash("sha256").update(salt + password).digest("hex") === hash;
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

  await ensureSchema();
  const { email, password, name, company } = (await req.json()) as {
    email?: string; password?: string; name?: string; company?: string;
  };
  if (!email || !password) return NextResponse.json({ error: "Нужны почта и пароль" }, { status: 400 });

  if (action === "register") {
    const [exists] = await query<UserRow>("SELECT id FROM users WHERE email=$1", [email]);
    if (exists) return NextResponse.json({ error: "Почта уже занята" }, { status: 409 });
    const [u] = await query<UserRow>(
      "INSERT INTO users (email,name,company,password) VALUES ($1,$2,$3,$4) RETURNING id,email",
      [email, name || "", company || "", hashPassword(password)]
    );
    await setSessionCookie({ uid: u.id, email: u.email });
    return NextResponse.json({ ok: true });
  }

  // login
  const [u] = await query<UserRow>("SELECT id,email,password FROM users WHERE email=$1", [email]);
  if (!u || !verifyPassword(password, u.password)) {
    return NextResponse.json({ error: "Неверная почта или пароль" }, { status: 401 });
  }
  await setSessionCookie({ uid: u.id, email: u.email });
  return NextResponse.json({ ok: true });
}
