import { NextResponse } from "next/server";
import { ensureSchema, query } from "@/lib/server/db";
import { requireSession } from "@/lib/server/auth";
import { invalidateQuiz } from "@/lib/server/publicQuiz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Нормализация домена: нижний регистр, без схемы/пути/порта и www.
function normalizeDomain(raw: string): string {
  let d = (raw || "").trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "").replace(/\/.*$/, "").split(":")[0].replace(/^www\./, "");
  return d;
}

const DOMAIN_RE = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

// PUT /api/quizzes/:id/domain — привязать/сбросить свой домен к квизу
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const s = await requireSession();
    const { id } = await params;
    await ensureSchema();
    const body = (await req.json()) as { domain?: string };
    const domain = normalizeDomain(body.domain || "");

    if (domain && !DOMAIN_RE.test(domain)) {
      return NextResponse.json({ error: "Некорректный домен. Пример: quiz.mysite.ru" }, { status: 400 });
    }

    // Домен уже занят другим квизом?
    if (domain) {
      const [taken] = await query<{ id: number }>(
        "SELECT id FROM quizzes WHERE lower(domain)=$1 AND id<>$2 LIMIT 1",
        [domain, id]
      );
      if (taken) return NextResponse.json({ error: "Этот домен уже привязан к другому квизу" }, { status: 409 });
    }

    const [row] = await query<{ id: number; domain: string | null }>(
      "UPDATE quizzes SET domain=$3, updated_at=now() WHERE id=$1 AND user_id=$2 RETURNING id, domain",
      [id, s.uid, domain || null]
    );
    if (!row) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    await invalidateQuiz(null, domain); // сброс кеша по домену
    return NextResponse.json({ domain: row.domain || "" });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}
