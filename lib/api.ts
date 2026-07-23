"use client";

// Тонкий клиент над /api/* для использования из клиентских компонентов.

async function jsonFetch<T>(url: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...opts,
    headers: { "content-type": "application/json", ...(opts.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Ошибка ${res.status}`);
  return data as T;
}

export type ApiUser = { id: number; email: string; name: string; company: string; plan: string; leadLimit: number };
export type ApiQuiz = { id: number; slug: string; name: string; status: string; steps: unknown; design: unknown };
export type ApiLead = {
  id: number; quiz_id: number; quiz_name: string; name: string; phone: string; email: string;
  answers: { q: string; a: string; t?: string }[]; source: string; score: number; heat: string;
  summary: string; status: string; created_at: string;
};

export const api = {
  me: () => jsonFetch<{ user: ApiUser | null }>("/api/auth"),
  register: (b: { email: string; password: string; name?: string; company?: string }) =>
    jsonFetch<{ ok: boolean }>("/api/auth?action=register", { method: "POST", body: JSON.stringify(b) }),
  login: (b: { email: string; password: string }) =>
    jsonFetch<{ ok: boolean }>("/api/auth?action=login", { method: "POST", body: JSON.stringify(b) }),
  logout: () => jsonFetch<{ ok: boolean }>("/api/auth?action=logout", { method: "POST" }),

  quizzes: () => jsonFetch<{ quizzes: ApiQuiz[] }>("/api/quizzes"),
  createQuiz: (b: { name: string; steps?: unknown; design?: unknown }) =>
    jsonFetch<{ quiz: ApiQuiz }>("/api/quizzes", { method: "POST", body: JSON.stringify(b) }),
  updateQuiz: (id: number, b: Partial<{ name: string; status: string; steps: unknown; design: unknown }>) =>
    jsonFetch<{ quiz: ApiQuiz }>(`/api/quizzes/${id}`, { method: "PUT", body: JSON.stringify(b) }),

  leads: () => jsonFetch<{ leads: ApiLead[] }>("/api/leads"),

  generate: (b: { business: string; goal?: string; questions?: number; bonus?: string; tone?: string; calc?: boolean }) =>
    jsonFetch<{ quiz: unknown }>("/api/ai/generate", { method: "POST", body: JSON.stringify(b) }),
};
