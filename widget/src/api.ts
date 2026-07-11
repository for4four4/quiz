import type { QuizMeta, ResultResponse, StartResponse, StepResponse } from './types';

let base = '';
export function setApiBase(url: string) {
  base = url.replace(/\/$/, '');
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function fetchMeta(quizId: string): Promise<QuizMeta> {
  return fetch(`${base}/api/w/${quizId}`).then((r) => {
    if (!r.ok) throw new Error('Квиз не найден');
    return r.json() as Promise<QuizMeta>;
  });
}

export function startSession(quizId: string, utm: Record<string, string>): Promise<StartResponse> {
  return post(`/api/w/${quizId}/start`, { utm });
}

export function sendAnswer(
  quizId: string,
  payload: { sessionId: string; question: string; answer: string | string[] | number; step: number },
): Promise<StepResponse> {
  return post(`/api/w/${quizId}/answer`, payload);
}

export function sendLead(
  quizId: string,
  payload: { sessionId: string; name?: string; phone?: string; email?: string; consent: true },
): Promise<{ leadId: string }> {
  return post(`/api/w/${quizId}/lead`, payload);
}

export function fetchResult(quizId: string, sessionId: string): Promise<ResultResponse> {
  return post(`/api/w/${quizId}/result`, { sessionId });
}
