import { sendTelegramMessage, type TelegramConfig } from './telegram.js';
import { sendVkMessage, type VkConfig } from './vk.js';
import { sendMaxMessage, type MaxConfig } from './max.js';

/**
 * Единая точка отправки уведомлений о лидах в мессенджеры.
 * Каналы: Telegram, VK (сообщество), MAX. Текст сообщения — общий (plain text),
 * чтобы одинаково рендериться во всех трёх.
 */
export type ChannelType = 'telegram' | 'vk' | 'max';

export function sendNotification(type: ChannelType, config: Record<string, unknown>, text: string): Promise<unknown> {
  if (type === 'telegram') return sendTelegramMessage(config as unknown as TelegramConfig, text);
  if (type === 'vk') return sendVkMessage(config as unknown as VkConfig, text);
  if (type === 'max') return sendMaxMessage(config as unknown as MaxConfig, text);
  throw new Error(`Неизвестный канал уведомлений: ${type}`);
}

const SEGMENT_TITLE: Record<string, string> = {
  hot: '🔥 Горячий лид', warm: '🌤 Тёплый лид', cold: '❄️ Холодный лид', junk: '🗑 Отсеянный лид',
};

/** Готовое сообщение о лиде (без разметки — читается в любом мессенджере). */
export function formatLeadMessage(lead: {
  quizTitle: string;
  name: string | null; phone: string | null; email: string | null;
  score: number | null; segment: string | null;
  summary: string | null; first_line: string | null;
}): string {
  const lines: string[] = [];
  lines.push(`${SEGMENT_TITLE[lead.segment ?? ''] ?? 'Новый лид'} · ${lead.score ?? '—'}/100`);
  lines.push(`Квиз: ${lead.quizTitle}`);
  lines.push('');
  if (lead.name) lines.push(`👤 ${lead.name}`);
  if (lead.phone) lines.push(`📞 ${lead.phone}`);
  if (lead.email) lines.push(`✉️ ${lead.email}`);
  if (lead.summary) { lines.push(''); lines.push(lead.summary); }
  if (lead.first_line) { lines.push(''); lines.push(`💬 С чего начать: ${lead.first_line}`); }
  return lines.join('\n');
}
