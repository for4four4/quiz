import { NextResponse } from "next/server";
import { ensureSchema, query } from "@/lib/server/db";
import { requireSession } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type QuizRow = { id: number; slug: string; name: string; status: string; steps: unknown; design: unknown };

// Транслитерация кириллицы в латиницу — чистые ASCII-URL (/q/kuhni-...).
const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
  и: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[а-яё]/g, (ch) => TRANSLIT[ch] ?? "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40) || "quiz";
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

// GET /api/quizzes — список квизов текущего пользователя
export async function GET() {
  try {
    const s = await requireSession();
    await ensureSchema();
    const rows = await query<QuizRow>(
      "SELECT id,slug,name,status,steps,design FROM quizzes WHERE user_id=$1 ORDER BY updated_at DESC",
      [s.uid]
    );
    return NextResponse.json({ quizzes: rows });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}

// POST /api/quizzes — создать квиз
export async function POST(req: Request) {
  try {
    const s = await requireSession();
    await ensureSchema();
    const { name, steps, design } = (await req.json()) as { name?: string; steps?: unknown; design?: unknown };
    const [row] = await query<QuizRow>(
      "INSERT INTO quizzes (user_id,slug,name,steps,design) VALUES ($1,$2,$3,$4,$5) RETURNING id,slug,name,status,steps,design",
      [s.uid, slugify(name || "Новый квиз"), name || "Новый квиз", JSON.stringify(steps || []), JSON.stringify(design || {})]
    );
    return NextResponse.json({ quiz: row });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}
