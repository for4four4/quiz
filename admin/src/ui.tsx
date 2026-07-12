import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Segment } from './types';

/* ---------- Иконки (stroke 2px, viewBox 24) ---------- */
export function Icon({ path, size = 20, sw = 2 }: { path: string; size?: number; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {path.split('|').map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}
export const icons = {
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  inbox: 'M4 13h4l2 3h4l2-3h4|M4 13V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7',
  plus: 'M12 5v14M5 12h14',
  check: 'M20 6 9 17l-5-5',
  back: 'M15 18l-6-6 6-6',
  pencil: 'M12 20h9|M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  copy: 'M9 9h10v10H9zM5 15V5h10',
  external: 'M14 4h6v6|M20 4l-9 9|M20 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5',
  info: 'M12 8h.01M11 12h1v4h1',
  spark: 'M12 3v4M12 17v4M5 12H3M21 12h-2|M6.3 6.3 4.9 4.9M19.1 19.1l-1.4-1.4M17.7 6.3l1.4-1.4M4.9 19.1l1.4-1.4',
  chevron: 'M6 9l6 6 6-6',
  refresh: 'M3 12a9 9 0 0 1 15-6.7L21 8|M21 3v5h-5|M21 12a9 9 0 0 1-15 6.7L3 16|M3 21v-5h5',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4|M16 17l5-5-5-5|M21 12H9',
};

/* ---------- Кнопки ---------- */
export function Button({ children, onClick, disabled, variant = 'primary', type = 'button', className = '' }: {
  children: ReactNode; onClick?: () => void; disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; type?: 'button' | 'submit'; className?: string;
}) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-[11px] px-5 py-2.5 text-sm font-bold transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[.98]';
  const variants = {
    primary: 'grad text-white shadow-btn hover:-translate-y-px hover:brightness-105',
    secondary: 'border border-line bg-surface text-ink-2 hover:border-primary hover:text-primary',
    ghost: 'text-primary hover:bg-primary-tint',
    danger: 'bg-red-50 text-danger hover:bg-red-100',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

/* ---------- Поля ---------- */
export function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-bold text-ink">{label}{required && <span className="text-primary"> *</span>}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export const inputCls =
  'w-full rounded-[11px] border border-line bg-surface px-3.5 py-2.5 text-[15px] font-medium text-ink placeholder:text-faint outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-primary-tint-2';

/* ---------- Бейджи ---------- */
const segmentStyles: Record<Segment, string> = {
  hot: 'text-[oklch(0.53_0.2_30)] bg-[oklch(0.95_0.05_30)]',
  warm: 'text-[oklch(0.52_0.14_65)] bg-[oklch(0.96_0.05_70)]',
  cold: 'text-[oklch(0.5_0.13_250)] bg-[oklch(0.95_0.03_240)]',
  junk: 'text-muted bg-[#eef0f3]',
};
const segmentLabels: Record<Segment, string> = { hot: 'HOT', warm: 'WARM', cold: 'COLD', junk: 'JUNK' };

export function SegmentBadge({ segment }: { segment: Segment | null }) {
  if (!segment) return <span className="rounded-full bg-line-2 px-2.5 py-1 text-[10px] font-extrabold tracking-wider text-muted">…</span>;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-wider ${segmentStyles[segment]}`}>
      {segmentLabels[segment]}
    </span>
  );
}

/** Скоринг-кольцо: conic-gradient по сегменту, число внутри. */
export function ScoreRing({ score, segment }: { score: number | null; segment: Segment | null }) {
  const ringColor = score == null ? 'var(--color-faint)'
    : segment === 'hot' ? 'oklch(0.62 0.2 25)'
    : segment === 'warm' ? 'oklch(0.72 0.15 70)'
    : segment === 'cold' ? 'oklch(0.6 0.13 250)'
    : score >= 70 ? 'var(--color-success)' : score >= 40 ? 'var(--color-warning)' : 'var(--color-faint)';
  const deg = (score ?? 0) * 3.6;
  return (
    <span className="relative grid h-[46px] w-[46px] flex-none place-items-center rounded-full"
      style={{ background: `conic-gradient(${ringColor} ${deg}deg, var(--color-line) 0)` }}>
      <span className="grid h-[37px] w-[37px] place-items-center rounded-full bg-surface text-[13px] font-extrabold text-ink">
        {score ?? '—'}
      </span>
    </span>
  );
}

export function StatusChip({ status }: { status: 'draft' | 'published' | 'archived' }) {
  const map = {
    published: ['Опубликован', 'text-success bg-[oklch(0.95_0.04_150)]', true],
    draft: ['Черновик', 'text-muted bg-line-2', false],
    archived: ['В архиве', 'text-muted bg-line-2', false],
  } as const;
  const [label, cls, dot] = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-success" />}{label}
    </span>
  );
}

export function ModeChip({ mode }: { mode: 'static' | 'adaptive' }) {
  return (
    <span className="rounded-full bg-primary-tint px-2.5 py-1 text-xs font-bold text-primary">
      {mode === 'adaptive' ? 'Режим ИИ' : 'Статичный'}
    </span>
  );
}

/* ---------- Тумблер ---------- */
export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} role="switch" aria-checked={on}
      className={`relative h-7 w-12 flex-none cursor-pointer rounded-full transition-colors ${on ? 'grad' : 'bg-faint'}`}>
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-6' : 'left-1'}`} />
    </button>
  );
}

/* ---------- Спиннер ---------- */
export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

/* ---------- Тосты (тёмные, снизу по центру) ---------- */
interface Toast { id: number; text: string; kind: 'ok' | 'err' }
const ToastCtx = createContext<(text: string, kind?: 'ok' | 'err') => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((text: string, kind: 'ok' | 'err' = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-5 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2">
        {toasts.map((t) => (
          <div key={t.id}
            className={`anim-rise pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold text-white shadow-pop ${t.kind === 'ok' ? 'bg-ink' : 'bg-danger'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${t.kind === 'ok' ? 'bg-success' : 'bg-white'}`} />{t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------- Дровер справа ---------- */
export function Drawer({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="anim-fade flex h-full w-full max-w-lg flex-col bg-surface shadow-pop">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="text-base font-extrabold">{title}</h3>
          <button onClick={onClose} aria-label="Закрыть"
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-full text-muted transition-colors hover:bg-line-2 hover:text-ink">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

/* ---------- Пустое состояние ---------- */
export function Empty({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="anim-rise flex flex-col items-center rounded-[22px] border border-dashed border-line bg-surface px-6 py-16 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-[16px] bg-primary-tint text-primary">{icon}</div>
      <h3 className="mb-1 text-lg font-extrabold">{title}</h3>
      <p className="mb-5 max-w-sm text-sm text-muted">{text}</p>
      {action}
    </div>
  );
}

/* ---------- Логотип ---------- */
export function BrandMark({ size = 20 }: { size?: number }) {
  return <span className="inline-block flex-none grad" style={{ width: size, height: size, borderRadius: size * 0.28, transform: 'rotate(45deg)' }} />;
}
