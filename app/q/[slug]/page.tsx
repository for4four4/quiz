import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ensureSchema, query } from "@/lib/server/db";
import QuizRuntime, { type PublicQuiz } from "@/components/quiz/QuizRuntime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = { slug: string; name: string; steps: unknown; design: unknown; metrika: string | null };

async function loadQuiz(slug: string): Promise<PublicQuiz | null> {
  try {
    await ensureSchema();
    const [row] = await query<Row>(
      `SELECT q.slug, q.name, q.steps, q.design,
              (SELECT i.config->>'counter' FROM integrations i
                WHERE i.user_id = q.user_id AND i.kind='metrika' AND i.enabled=true
                  AND COALESCE(i.config->>'counter','') <> '' LIMIT 1) AS metrika
         FROM quizzes q WHERE q.slug=$1 AND q.status='active'`,
      [slug]
    );
    if (!row) return null;
    return {
      slug: row.slug,
      name: row.name,
      steps: Array.isArray(row.steps) ? (row.steps as PublicQuiz["steps"]) : [],
      design: (row.design && typeof row.design === "object" ? row.design : {}) as PublicQuiz["design"],
      metrikaCounter: row.metrika || undefined,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const quiz = await loadQuiz(slug);
  return {
    title: quiz?.name || "Квиз",
    robots: { index: false },
    alternates: { canonical: `/q/${slug}` },
  };
}

export default async function PublicQuizPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const quiz = await loadQuiz(slug);
  if (!quiz) notFound();
  return <QuizRuntime quiz={quiz} />;
}
