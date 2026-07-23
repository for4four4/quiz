import { NextResponse } from "next/server";
import { ensureSchema, query } from "@/lib/server/db";
import { requireSession } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LeadRow = {
  id: number; quiz_id: number; quiz_name: string; name: string; phone: string; email: string;
  answers: unknown; source: string; score: number; heat: string; summary: string; status: string; created_at: string;
};

// GET /api/leads — все заявки по квизам текущего пользователя (для CRM в кабинете)
export async function GET() {
  try {
    const s = await requireSession();
    await ensureSchema();
    const rows = await query<LeadRow>(
      `SELECT l.id, l.quiz_id, q.name AS quiz_name, l.name, l.phone, l.email, l.answers,
              l.source, l.score, l.heat, l.summary, l.status, l.created_at
       FROM leads l JOIN quizzes q ON q.id = l.quiz_id
       WHERE q.user_id = $1
       ORDER BY l.created_at DESC`,
      [s.uid]
    );
    return NextResponse.json({ leads: rows });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}
