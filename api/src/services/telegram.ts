/**
 * Отправка сообщений в Telegram. Бот создаётся у @BotFather, получатель — chat_id.
 * Форматирование лида — общее, в notify.ts (plain text для всех каналов).
 */
export interface TelegramConfig {
  bot_token: string;
  chat_id: string;
  notify_segments?: string[]; // какие сегменты слать, по умолчанию ['hot']
}

export async function sendTelegramMessage(cfg: TelegramConfig, text: string): Promise<unknown> {
  const res = await fetch(`https://api.telegram.org/bot${cfg.bot_token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: cfg.chat_id, text, disable_web_page_preview: true }),
  });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; description?: string };
  if (!res.ok || !data.ok) throw new Error(data.description || `Telegram API ответил ${res.status}`);
  return data;
}
