/**
 * Отправка сообщений через MAX (мессенджер VK) — Bot API на botapi.max.ru.
 * Бот создаётся у @MasterBot, токен передаётся в query, получатель — chat_id.
 */
export interface MaxConfig {
  access_token: string;
  chat_id: string;
  notify_segments?: string[];
}

export async function sendMaxMessage(cfg: MaxConfig, text: string): Promise<unknown> {
  const url = `https://botapi.max.ru/messages?access_token=${encodeURIComponent(cfg.access_token)}&chat_id=${encodeURIComponent(cfg.chat_id)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  const data = (await res.json().catch(() => ({}))) as { message?: string; code?: string };
  if (!res.ok) throw new Error(data.message || `MAX API ответил ${res.status}`);
  return data;
}
