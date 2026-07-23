import { NextResponse } from "next/server";
import { ensureSchema, query } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = {
  id: number; email: string; name: string; company: string; plan: string;
  lead_limit: number; role: string; valid_until: string | null; created_at: string;
  leads: number; quizzes: number;
};

// GET /api/admin/users — список пользователей с тарифом, лимитом, сроком и статистикой
export async function GET() {
  try {
    await requireAdmin();
    await ensureSchema();
    const rows = await query<Row>(
      `SELECT u.id, u.email, u.name, u.company, u.plan, u.lead_limit, u.role, u.valid_until, u.created_at,
              (SELECT count(*) FROM quizzes q WHERE q.user_id = u.id) AS quizzes,
              (SELECT count(*) FROM leads l JOIN quizzes q ON q.id = l.quiz_id WHERE q.user_id = u.id) AS leads
         FROM users u ORDER BY u.created_at DESC LIMIT 500`
    );
    return NextResponse.json({ users: rows });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}
