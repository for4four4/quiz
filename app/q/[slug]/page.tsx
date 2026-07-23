import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QuizRuntime from "@/components/quiz/QuizRuntime";
import { loadQuizBySlug } from "@/lib/server/publicQuiz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const quiz = await loadQuizBySlug(slug);
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
  const quiz = await loadQuizBySlug(slug);
  if (!quiz) notFound();
  return <QuizRuntime quiz={quiz} />;
}
