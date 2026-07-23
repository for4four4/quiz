import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QuizRuntime from "@/components/quiz/QuizRuntime";
import { loadQuizByDomain } from "@/lib/server/publicQuiz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Рендер квиза на подключённом домене клиента.
// Сюда переписывает запросы middleware, когда Host не совпадает с основным.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ host: string }>;
}): Promise<Metadata> {
  const { host } = await params;
  const quiz = await loadQuizByDomain(decodeURIComponent(host));
  return { title: quiz?.name || "Квиз", robots: { index: false } };
}

export default async function DomainQuizPage({
  params,
}: {
  params: Promise<{ host: string }>;
}) {
  const { host } = await params;
  const quiz = await loadQuizByDomain(decodeURIComponent(host));
  if (!quiz) notFound();
  return <QuizRuntime quiz={quiz} />;
}
