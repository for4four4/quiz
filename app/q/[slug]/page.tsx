import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ensureSchema, query } from "@/lib/server/db";
import QuizRuntime, { type PublicQuiz } from "@/components/quiz/QuizRuntime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = { slug: string; name: string; steps: unknown; design: unknown };

async function loadQuiz(slug: string): Promise<PublicQuiz | null> {
  try {
    await ensureSchema();
    const [row] = await query<Row>(
      "SELECT slug,name,steps,design FROM quizzes WHERE slug=$1 AND status='active'",
      [slug]
    );
    if (!row) return null;
    return {
      slug: row.slug,
      name: row.name,
      steps: Array.isArray(row.steps) ? (row.steps as PublicQuiz["steps"]) : [],
      design: (row.design && typeof row.design === "object" ? row.design : {}) as PublicQuiz["design"],
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
