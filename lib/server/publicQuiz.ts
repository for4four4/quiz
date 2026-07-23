import "server-only";
import { ensureSchema, query } from "@/lib/server/db";
import type { PublicQuiz } from "@/components/quiz/QuizRuntime";
import { migrateToDoc, type QuizDoc } from "@/lib/quiz/doc";
import { pickAbVariant } from "@/lib/server/ab";

type Row = { slug: string; name: string; steps: unknown; design: unknown; metrika: string | null };

type DesignShape = {
  doc?: QuizDoc;
  accent?: string;
  bg?: string;
  cover?: { title?: string; subtitle?: string; benefits?: string[] };
  contactForm?: { title?: string; bonus?: string };
};

function shape(row: Row): PublicQuiz {
  const design = (row.design && typeof row.design === "object" ? row.design : {}) as DesignShape;
  const simpleSteps = Array.isArray(row.steps) ? (row.steps as { question?: string; options?: string[] }[]) : [];
  const doc: QuizDoc = design.doc && Array.isArray(design.doc.steps) && design.doc.steps.length
    ? design.doc
    : migrateToDoc(simpleSteps, design);
  return { slug: row.slug, name: row.name, doc, metrikaCounter: row.metrika || undefined };
}

const METRIKA_SUBQUERY = `(SELECT i.config->>'counter' FROM integrations i
    WHERE i.user_id = q.user_id AND i.kind='metrika' AND i.enabled=true
      AND COALESCE(i.config->>'counter','') <> '' LIMIT 1) AS metrika`;

/** Загрузка публичного квиза по слагу (с учётом A/B-варианта). */
export async function loadQuizBySlug(slug: string): Promise<PublicQuiz | null> {
  try {
    await ensureSchema();
    const picked = await pickAbVariant(slug);
    if (!picked) return null;
    const [row] = await query<Row>(
      `SELECT q.slug, q.name, q.steps, q.design, ${METRIKA_SUBQUERY}
         FROM quizzes q WHERE q.slug=$1 AND q.status='active'`,
      [picked.slug]
    );
    return row ? shape(row) : null;
  } catch {
    return null;
  }
}

/** Загрузка публичного квиза по привязанному домену (Host из запроса). */
export async function loadQuizByDomain(host: string): Promise<PublicQuiz | null> {
  const domain = normalizeHost(host);
  if (!domain) return null;
  try {
    await ensureSchema();
    const [row] = await query<Row>(
      `SELECT q.slug, q.name, q.steps, q.design, ${METRIKA_SUBQUERY}
         FROM quizzes q WHERE lower(q.domain)=$1 AND q.status='active' LIMIT 1`,
      [domain]
    );
    return row ? shape(row) : null;
  } catch {
    return null;
  }
}

/** Нормализация Host: без порта, без www., в нижнем регистре. */
export function normalizeHost(host: string): string {
  return (host || "").toLowerCase().split(":")[0].replace(/^www\./, "").trim();
}
