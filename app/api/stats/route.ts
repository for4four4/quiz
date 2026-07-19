import { NextResponse } from "next/server";
import { ensureSchema, query } from "@/lib/server/db";
import { requireSession } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DOW = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

// GET /api/stats[?days=7] — агрегаты воронки и аналитики для кабинета
export async function GET(req: Request) {
  try {
    const s = await requireSession();
    await ensureSchema();
    const daysParam = Number(new URL(req.url).searchParams.get("days"));
    const days = Number.isFinite(daysParam) && daysParam > 0 && daysParam <= 90 ? Math.floor(daysParam) : 7;

    const quizzes = await query<{ id: string; name: string; status: string }>(
      "SELECT id,name,status FROM quizzes WHERE user_id=$1",
      [s.uid]
    );
    const ids = quizzes.map((q) => q.id);

    const empty = {
      totals: { open: 0, start: 0, contact: 0, lead: 0 },
      bars: buildBars([]),
      sources: [] as [string, number][],
      hot: [] as { name: string; score: number; heat: string }[],
      perQuiz: {} as Record<string, PerQuiz>,
    };
    if (ids.length === 0) return NextResponse.json({ days, ...empty });

    const [evByQuizType, evStep, leadRows] = await Promise.all([
      query<{ quiz_id: string; type: string; n: string }>(
        `SELECT quiz_id, type, count(*)::int n FROM events
          WHERE quiz_id = ANY($1) AND created_at >= now() - make_interval(days => $2)
          GROUP BY quiz_id, type`,
        [ids, days]
      ),
      query<{ quiz_id: string; step: number; n: string }>(
        `SELECT quiz_id, step, count(*)::int n FROM events
          WHERE quiz_id = ANY($1) AND type='step' AND step IS NOT NULL
            AND created_at >= now() - make_interval(days => $2)
          GROUP BY quiz_id, step`,
        [ids, days]
      ),
      query<{ id: string; quiz_id: string; name: string; phone: string; source: string; score: number; heat: string; created_at: string }>(
        `SELECT l.id, l.quiz_id, l.name, l.phone, l.source, l.score, l.heat, l.created_at
           FROM leads l WHERE l.quiz_id = ANY($1)
            AND l.created_at >= now() - make_interval(days => $2)`,
        [ids, days]
      ),
    ]);

    // Инициализируем перквизовую разбивку
    const perQuiz: Record<string, PerQuiz> = {};
    for (const id of ids) perQuiz[id] = { open: 0, start: 0, contact: 0, lead: 0, steps: {} };

    for (const r of evByQuizType) {
      const p = perQuiz[r.quiz_id];
      if (!p) continue;
      const n = Number(r.n);
      if (r.type === "open") p.open += n;
      else if (r.type === "contact") p.contact += n;
      else if (r.type === "lead") p.lead += n;
    }
    for (const r of evStep) {
      const p = perQuiz[r.quiz_id];
      if (!p) continue;
      p.steps[r.step] = Number(r.n);
      if (r.step === 0) p.start += Number(r.n);
    }

    // Заявки как надёжный источник для "lead", источников и горячих
    const leadByQuiz: Record<string, number> = {};
    const sourcesMap: Record<string, number> = {};
    for (const l of leadRows) {
      leadByQuiz[l.quiz_id] = (leadByQuiz[l.quiz_id] || 0) + 1;
      sourcesMap[l.source || "прямая ссылка"] = (sourcesMap[l.source || "прямая ссылка"] || 0) + 1;
    }
    // Если события lead не писались (старые данные) — берём из таблицы leads
    for (const id of ids) {
      if (!perQuiz[id].lead && leadByQuiz[id]) perQuiz[id].lead = leadByQuiz[id];
    }

    const totals = { open: 0, start: 0, contact: 0, lead: 0 };
    for (const id of ids) {
      totals.open += perQuiz[id].open;
      totals.start += perQuiz[id].start;
      totals.contact += perQuiz[id].contact;
      totals.lead += perQuiz[id].lead;
    }
    if (!totals.lead) totals.lead = leadRows.length;

    const sources = Object.entries(sourcesMap).sort((a, b) => b[1] - a[1]) as [string, number][];
    const hot = leadRows
      .filter((l) => l.heat === "hot")
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((l) => ({ name: l.name || "Без имени", score: l.score, heat: l.heat }));

    return NextResponse.json({
      days,
      totals,
      bars: buildBars(leadRows.map((l) => l.created_at)),
      sources,
      hot,
      perQuiz,
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}

type PerQuiz = { open: number; start: number; contact: number; lead: number; steps: Record<number, number> };

// Заявки по дням за последнюю неделю (7 столбцов, с нулями)
function buildBars(dates: string[]): { d: string; v: number }[] {
  const buckets: { key: string; d: string; v: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    buckets.push({ key: day.toDateString(), d: DOW[day.getDay()], v: 0 });
  }
  const index = new Map(buckets.map((b, i) => [b.key, i]));
  for (const iso of dates) {
    const key = new Date(iso).toDateString();
    const i = index.get(key);
    if (i !== undefined) buckets[i].v += 1;
  }
  return buckets.map((b) => ({ d: b.d, v: b.v }));
}
