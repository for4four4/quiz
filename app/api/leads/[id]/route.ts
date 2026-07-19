import { NextResponse } from "next/server";
import { ensureSchema, query } from "@/lib/server/db";
import { requireSession } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = new Set(["new", "work", "done", "rejected"]);

// PATCH /api/leads/[id] — сменить статус заявки (канбан CRM)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const s = await requireSession();
    const { id } = await params;
    await ensureSchema();
    const { status } = (await req.json()) as { status?: string };
    if (!status || !STATUSES.has(status)) {
      return NextResponse.json({ error: "Некорректный статус" }, { status: 400 });
    }
    // Обновляем только если заявка принадлежит квизу текущего пользователя
    const rows = await query<{ id: string }>(
      `UPDATE leads l SET status = $3
         FROM quizzes q
        WHERE l.id = $1 AND l.quiz_id = q.id AND q.user_id = $2
        RETURNING l.id`,
      [id, s.uid, status]
    );
    if (!rows.length) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}
