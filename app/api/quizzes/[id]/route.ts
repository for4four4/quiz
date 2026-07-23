import { NextResponse } from "next/server";
import { ensureSchema, query } from "@/lib/server/db";
import { requireSession } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type QuizRow = { id: number; slug: string; name: string; status: string; steps: unknown; design: unknown; domain: string | null };

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const s = await requireSession();
    const { id } = await params;
    await ensureSchema();
    const [row] = await query<QuizRow>("SELECT id,slug,name,status,steps,design,domain FROM quizzes WHERE id=$1 AND user_id=$2", [id, s.uid]);
    if (!row) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    return NextResponse.json({ quiz: row });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const s = await requireSession();
    const { id } = await params;
    await ensureSchema();
    const b = (await req.json()) as { name?: string; status?: string; steps?: unknown; design?: unknown };
    const [row] = await query<QuizRow>(
      `UPDATE quizzes SET
         name = COALESCE($3, name),
         status = COALESCE($4, status),
         steps = COALESCE($5, steps),
         design = COALESCE($6, design),
         updated_at = now()
       WHERE id=$1 AND user_id=$2
       RETURNING id,slug,name,status,steps,design,domain`,
      [id, s.uid, b.name ?? null, b.status ?? null, b.steps ? JSON.stringify(b.steps) : null, b.design ? JSON.stringify(b.design) : null]
    );
    if (!row) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    return NextResponse.json({ quiz: row });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const s = await requireSession();
    const { id } = await params;
    await ensureSchema();
    await query("DELETE FROM quizzes WHERE id=$1 AND user_id=$2", [id, s.uid]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}
