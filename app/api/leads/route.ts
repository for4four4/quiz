import { NextResponse } from "next/server";
import { ensureSchema, query } from "@/lib/server/db";
import { requireSession } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LeadRow = {
  id: string;
  quiz_id: string;
  quiz_name: string;
  name: string;
  phone: string;
  email: string;
  answers: unknown;
  source: string;
  score: number;
  heat: string;
  summary: string;
  status: string;
  created_at: string;
};

// GET /api/leads[?quiz=<id>] — заявки по всем квизам пользователя (или одному)
export async function GET(req: Request) {
  try {
    const s = await requireSession();
    await ensureSchema();
    const quizId = new URL(req.url).searchParams.get("quiz");
    const rows = await query<LeadRow>(
      `SELECT l.id, l.quiz_id, q.name AS quiz_name, l.name, l.phone, l.email,
              l.answers, l.source, l.score, l.heat, l.summary, l.status, l.created_at
         FROM leads l
         JOIN quizzes q ON q.id = l.quiz_id
        WHERE q.user_id = $1 ${quizId ? "AND l.quiz_id = $2" : ""}
        ORDER BY l.created_at DESC`,
      quizId ? [s.uid, quizId] : [s.uid]
    );
    return NextResponse.json({ leads: rows });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}
