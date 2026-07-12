/**
 * Уведомления в Telegram о горячих лидах (неделя 3 спеки).
 * Дешёвая замена CRM-интеграции: владелец создаёт бота у @BotFather,
 * узнаёт chat_id и получает лид в мессенджер сразу после скоринга.
 *
 * Весь HTTP к Bot API — только здесь, чтобы не размазывать fetch по коду.
 */

export interface TelegramConfig {
  bot_token: string;
  chat_id: string;
  notify_segments?: string[]; // какие сегменты слать, по умолчанию ['hot']
}

const API = 'https://api.telegram.org';

async function call(token: string, method: string, body: Record<string, unknown>) {
  const res = await fetch(`${API}/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; description?: string };
  if (!res.ok || !data.ok) {
    throw new Error(data.description || `Telegram API ответил ${res.status}`);
  }
  return data;
}

export function sendTelegramMessage(cfg: TelegramConfig, text: string): Promise<unknown> {
  return call(cfg.bot_token, 'sendMessage', {
    chat_id: cfg.chat_id,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  });
}

const SEGMENT_TITLE: Record<string, string> = {
  hot: '🔥 Горячий лид', warm: '🌤 Тёплый лид', cold: '❄️ Холодный лид', junk: '🗑 Отсеянный лид',
};

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Готовое сообщение о лиде для отправки в чат. */
export function formatLeadMessage(lead: {
  quizTitle: string;
  name: string | null; phone: string | null; email: string | null;
  score: number | null; segment: string | null;
  summary: string | null; first_line: string | null;
}): string {
  const lines: string[] = [];
  lines.push(`<b>${SEGMENT_TITLE[lead.segment ?? ''] ?? 'Новый лид'} · ${lead.score ?? '—'}/100</b>`);
  lines.push(`Квиз: ${esc(lead.quizTitle)}`);
  lines.push('');
  if (lead.name) lines.push(`👤 <b>${esc(lead.name)}</b>`);
  if (lead.phone) lines.push(`📞 ${esc(lead.phone)}`);
  if (lead.email) lines.push(`✉️ ${esc(lead.email)}`);
  if (lead.summary) { lines.push(''); lines.push(esc(lead.summary)); }
  if (lead.first_line) { lines.push(''); lines.push(`💬 <i>С чего начать: ${esc(lead.first_line)}</i>`); }
  return lines.join('\n');
}
