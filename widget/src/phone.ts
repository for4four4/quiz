/** Маска телефона РФ: +7 (XXX) XXX-XX-XX. Ведущие 7/8 отбрасываются, максимум 10 цифр. */
export function formatPhone(raw: string): string {
  let d = (raw || '').replace(/\D/g, '');
  if (d[0] === '7' || d[0] === '8') d = d.slice(1);
  d = d.slice(0, 10);
  let out = '+7';
  if (d.length) out += ' (' + d.slice(0, 3);
  if (d.length >= 3) out += ')';
  if (d.length > 3) out += ' ' + d.slice(3, 6);
  if (d.length > 6) out += '-' + d.slice(6, 8);
  if (d.length > 8) out += '-' + d.slice(8, 10);
  return out;
}

/** Возвращает 10 значащих цифр номера (без кода страны). */
export function phoneDigits(v: string): string {
  let d = (v || '').replace(/\D/g, '');
  if (d[0] === '7' || d[0] === '8') d = d.slice(1);
  return d.slice(0, 10);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((email || '').trim());
}
