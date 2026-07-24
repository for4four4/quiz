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
  domain?: string | null;
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
  ip?: string;
  utm?: Record<string, string>;
};

export type Integration = {
  id: string;
  kind: string;
  config: Record<string, string>;
  enabled: boolean;
};

export type AccountSettings = {
  dedupeHours?: number;
  ipBlacklist?: string[];
  emailNotify?: string;
};

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  company: string;
  plan: string;
  lead_limit: number;
  role: string;
  valid_until: string | null;
  created_at: string;
  leads: number;
  quizzes: number;
};

export type SiteSettings = {
  metrikaId?: string;
  gaId?: string;
  yandexVerify?: string;
  googleVerify?: string;
};

export type NewsTag = "feature" | "integ" | "platform";
export type NewsItem = { date: string; tag: NewsTag; title: string; text: string };
export type SiteContent = {
  news: { featured: { date: string; title: string; text: string }; items: NewsItem[] };
};

export type PerQuizStat = { open: number; start: number; contact: number; lead: number; steps: Record<string, number> };
export type Stats = {
  days: number;
  totals: { open: number; start: number; contact: number; lead: number };
  bars: { d: string; v: number }[];
  sources: [string, number][];
  hot: { name: string; score: number; heat: string }[];
  perQuiz: Record<string, PerQuizStat>;
};

async function j<T>(res: Response): Promise<T> {
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error((data as { error?: string }).error || "Ошибка запроса");
  return data;
}

export const api = {
  me: () => fetch("/api/auth").then((r) => j<{ user: Me | null }>(r)),
  logout: () => fetch("/api/auth?action=logout", { method: "POST" }).then((r) => j(r)),

  getSettings: () => fetch("/api/settings").then((r) => j<{ settings: AccountSettings }>(r)),
  saveSettings: (settings: AccountSettings) =>
    fetch("/api/settings", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(settings) }).then((r) => j<{ settings: AccountSettings }>(r)),

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
  setDomain: (id: string, domain: string) =>
    fetch(`/api/quizzes/${id}/domain`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ domain }),
    }).then((r) => j<{ domain: string }>(r)),

  stats: () => fetch("/api/stats").then((r) => j<Stats>(r)),

  leads: () => fetch("/api/leads").then((r) => j<{ leads: Lead[] }>(r)),
  setLeadStatus: (id: string, status: string) =>
    fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    }).then((r) => j(r)),

  upload: async (file: File): Promise<{ url: string }> => {
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/upload", { method: "POST", body: fd });
    return j<{ url: string }>(r);
  },

  integrations: () => fetch("/api/integrations").then((r) => j<{ integrations: Integration[] }>(r)),
  saveIntegration: (kind: string, config: Record<string, string>, enabled = true) =>
    fetch("/api/integrations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind, config, enabled }),
    }).then((r) => j<{ integration: Integration }>(r)),
  deleteIntegration: (kind: string) =>
    fetch(`/api/integrations?kind=${encodeURIComponent(kind)}`, { method: "DELETE" }).then((r) => j(r)),

  // Админка
  adminUsers: () => fetch("/api/admin/users").then((r) => j<{ users: AdminUser[] }>(r)),
  adminUpdateUser: (id: string, patch: { plan?: string; leadLimit?: number; validUntil?: string | null; role?: string }) =>
    fetch(`/api/admin/users/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(patch) }).then((r) => j(r)),
  adminSettings: () => fetch("/api/admin/settings").then((r) => j<{ settings: SiteSettings }>(r)),
  adminSaveSettings: (settings: SiteSettings) =>
    fetch("/api/admin/settings", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(settings) }).then((r) => j<{ settings: SiteSettings }>(r)),
  adminContent: () => fetch("/api/admin/content").then((r) => j<{ content: SiteContent }>(r)),
  adminSaveContent: (content: SiteContent) =>
    fetch("/api/admin/content", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(content) }).then((r) => j<{ content: SiteContent }>(r)),

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
