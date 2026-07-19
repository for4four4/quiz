// Тонкие клиентские хелперы поверх Route Handlers (кабинет/редактор).

export type Me = {
  id: string;
  email: string;
  name: string;
  company: string;
  plan: string;
  leadLimit: number;
};

export type QuizStep = { question?: string; options?: string[] };
export type QuizDesign = {
  cover?: { title?: string; subtitle?: string; benefits?: string[] };
  contactForm?: { title?: string; bonus?: string };
  calculator?: { label?: string } | null;
  accent?: string;
  bg?: string;
};
export type Quiz = {
  id: string;
  slug: string;
  name: string;
  status: string;
  steps: QuizStep[];
  design: QuizDesign;
};

export type Lead = {
  id: string;
  quiz_id: string;
  quiz_name: string;
  name: string;
  phone: string;
  email: string;
  answers: { q: string; a: string; t?: string }[];
  source: string;
  score: number;
  heat: "hot" | "warm" | "cold";
  summary: string;
  status: string;
  created_at: string;
};

export type Integration = {
  id: string;
  kind: string;
  config: Record<string, string>;
  enabled: boolean;
};

async function j<T>(res: Response): Promise<T> {
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error((data as { error?: string }).error || "Ошибка запроса");
  return data;
}

export const api = {
  me: () => fetch("/api/auth").then((r) => j<{ user: Me | null }>(r)),
  logout: () => fetch("/api/auth?action=logout", { method: "POST" }).then((r) => j(r)),

  quizzes: () => fetch("/api/quizzes").then((r) => j<{ quizzes: Quiz[] }>(r)),
  quiz: (id: string) => fetch(`/api/quizzes/${id}`).then((r) => j<{ quiz: Quiz }>(r)),
  createQuiz: (body: { name: string; steps?: QuizStep[]; design?: QuizDesign }) =>
    fetch("/api/quizzes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => j<{ quiz: Quiz }>(r)),
  updateQuiz: (id: string, body: Partial<Pick<Quiz, "name" | "status" | "steps" | "design">>) =>
    fetch(`/api/quizzes/${id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => j<{ quiz: Quiz }>(r)),
  deleteQuiz: (id: string) => fetch(`/api/quizzes/${id}`, { method: "DELETE" }).then((r) => j(r)),

  leads: () => fetch("/api/leads").then((r) => j<{ leads: Lead[] }>(r)),
  setLeadStatus: (id: string, status: string) =>
    fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    }).then((r) => j(r)),

  integrations: () => fetch("/api/integrations").then((r) => j<{ integrations: Integration[] }>(r)),
  saveIntegration: (kind: string, config: Record<string, string>, enabled = true) =>
    fetch("/api/integrations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind, config, enabled }),
    }).then((r) => j<{ integration: Integration }>(r)),
  deleteIntegration: (kind: string) =>
    fetch(`/api/integrations?kind=${encodeURIComponent(kind)}`, { method: "DELETE" }).then((r) => j(r)),

  generate: (body: {
    business: string;
    goal: string;
    questions: number;
    bonus: string;
    tone: string;
    calc: boolean;
  }) =>
    fetch("/api/ai/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) =>
      j<{
        quiz: {
          name: string;
          cover: { title: string; subtitle: string; benefits: string[] };
          steps: { question: string; options: string[] }[];
          calculator?: { label: string } | null;
          contactForm: { title: string; fields: string[]; bonus: string };
        };
      }>(r)
    ),
};
