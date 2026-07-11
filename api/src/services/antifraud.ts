/**
 * Дешёвые программные проверки до вызова LLM-скоринга (раздел 5 спеки).
 * Результат кладём в leads.fraud_flags и передаём модели как контекст.
 */

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com',
  'temp-mail.org', 'yopmail.com', 'sharklasers.com', 'trashmail.com',
  'dispostable.com', 'getnada.com', 'fakeinbox.com', 'maildrop.cc',
]);

export interface FraudCheckInput {
  phone: string | null;
  email: string | null;
  startedAt: Date;
  finishedAt: Date;
  transcript: { q?: string; a?: unknown }[];
  duplicateIpCount: number;     // сколько лидов с этого IP за 24ч
}

export function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('8')) digits = '7' + digits.slice(1);
  return digits;
}

export function isValidRuPhone(raw: string): boolean {
  const d = normalizePhone(raw);
  // РФ-мобильные и городские: 7 + 10 цифр, код начинается с 3/4/8/9
  return /^7[3489]\d{9}$/.test(d);
}

/** Похоже ли на «клавиатурный мусор»: мало гласных, повторы, короткие бессмыслицы. */
export function looksLikeGibberish(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (t.length < 2) return true;
  if (/(.)\1{4,}/.test(t)) return true;                       // ааааа, !!!!!
  const letters = t.replace(/[^a-zа-яё]/gi, '');
  if (letters.length >= 5) {
    const vowels = (letters.match(/[аеёиоуыэюяaeiouy]/gi) ?? []).length;
    if (vowels / letters.length < 0.15) return true;          // фвпрлдж
  }
  return false;
}

export function runFraudChecks(input: FraudCheckInput): string[] {
  const flags: string[] = [];

  if (input.phone && !isValidRuPhone(input.phone)) flags.push('invalid_phone');

  if (input.email) {
    const domain = input.email.split('@')[1]?.toLowerCase() ?? '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.email)) flags.push('invalid_email');
    else if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) flags.push('disposable_email');
  }

  const durationSec = (input.finishedAt.getTime() - input.startedAt.getTime()) / 1000;
  if (durationSec < 8) flags.push('too_fast');

  const textAnswers = input.transcript
    .map((t) => t.a)
    .filter((a): a is string => typeof a === 'string');
  if (textAnswers.length > 0 && textAnswers.every(looksLikeGibberish)) {
    flags.push('gibberish_answers');
  }

  if (input.duplicateIpCount >= 3) flags.push('repeat_ip');

  return flags;
}
