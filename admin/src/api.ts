import type { Analytics, FunnelAnalysis, GeneratedQuiz, Lead, Question, QuestionDraft, QuizFull, QuizListItem, TranscriptItem } from './types';

const TOKEN_KEY = 'kvalify_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (res.status === 401) {
    clearToken();
    if (location.pathname !== '/auth') location.assign('/auth');
    throw new ApiError('Нужна авторизация', 401);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError((data as { error?: string }).error ?? `Ошибка ${res.status}`, res.status);
  return data as T;
}

export const api = {
  register: (email: string, password: string) =>
    request<{ token: string }>('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),
  login: (email: string, password: string) =>
    request<{ token: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  quizzes: () => request<QuizListItem[]>('/api/quizzes'),
  quiz: (id: string) => request<QuizFull>(`/api/quizzes/${id}`),
  generateQuiz: (brief: { business_description: string; goal: string; geo: string; ideal_lead: string }) =>
    request<{ quizId: string; generated: GeneratedQuiz }>('/api/quizzes/generate', {
      method: 'POST', body: JSON.stringify(brief),
    }),
  patchQuiz: (id: string, patch: Record<string, unknown>) =>
    request<{ id: string }>(`/api/quizzes/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  saveQuestions: (id: string, questions: QuestionDraft[]) =>
    request<{ questions: Question[] }>(`/api/quizzes/${id}/questions`, { method: 'PUT', body: JSON.stringify({ questions }) }),

  leads: (opts: { quizId?: string; includeJunk?: boolean } = {}) => {
    const params = new URLSearchParams();
    if (opts.quizId) params.set('quizId', opts.quizId);
    if (opts.includeJunk) params.set('includeJunk', 'true');
    const qs = params.toString();
    return request<Lead[]>(`/api/leads${qs ? `?${qs}` : ''}`);
  },
  transcript: (leadId: string) =>
    request<{ transcript: TranscriptItem[] }>(`/api/leads/${leadId}/transcript`),

  analytics: (quizId: string, days = 30) =>
    request<Analytics>(`/api/quizzes/${quizId}/analytics?days=${days}`),
  analyze: (quizId: string) =>
    request<FunnelAnalysis>(`/api/quizzes/${quizId}/analyze`, { method: 'POST' }),

  integrations: () => request<IntegrationInfo[]>('/api/integrations'),
  saveIntegration: (type: string, body: Record<string, unknown>) =>
    request<{ ok: true }>(`/api/integrations/${type}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteIntegration: (type: string) =>
    request<{ ok: true }>(`/api/integrations/${type}`, { method: 'DELETE' }),
  testIntegration: (type: string, body: Record<string, unknown>) =>
    request<{ ok: true }>(`/api/integrations/${type}/test`, { method: 'POST', body: JSON.stringify(body) }),
};

export interface IntegrationInfo {
  type: string;
  enabled: boolean;
  config: { notify_segments?: string[]; has_secret?: boolean } & Record<string, unknown>;
}
