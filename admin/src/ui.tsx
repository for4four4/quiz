import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Segment } from './types';

/* ---------- Кнопки ---------- */

export function Button({ children, onClick, disabled, variant = 'primary', type = 'button', className = '' }: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'ghost' | 'danger' | 'outline';
  type?: 'button' | 'submit';
  className?: string;
}) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[.98]';
  const variants = {
    primary: 'btn-shine bg-gradient-to-br from-brand-600 via-violet-600 to-fuchsia-600 text-white shadow-lg shadow-brand-600/30 hover:shadow-xl hover:shadow-brand-600/40 hover:-translate-y-px',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    outline: 'border border-slate-300 text-slate-700 bg-white/80 backdrop-blur hover:border-brand-400 hover:text-brand-700',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

/* ---------- Поля ---------- */

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

export const inputCls =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15';

/* ---------- Бейджи ---------- */

const segmentStyles: Record<Segment, string> = {
  hot: 'bg-gradient-to-r from-orange-500 to-red-500 text-white',
  warm: 'bg-amber-100 text-amber-800',
  cold: 'bg-sky-100 text-sky-800',
  junk: 'bg-slate-200 text-slate-500',
};
const segmentLabels: Record<Segment, string> = {
  hot: '🔥 Горячий', warm: 'Тёплый', cold: 'Холодный', junk: 'Junk',
};

export function SegmentBadge({ segment }: { segment: Segment | null }) {
  if (!segment) {
    return <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-400">Оценивается…</span>;
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${segmentStyles[segment]}`}>
      {segmentLabels[segment]}
    </span>
  );
}

export function ScoreRing({ score }: { score: number | null }) {
  if (score == null) return <span className="text-xs text-slate-400">—</span>;
  const color = score >= 70 ? 'text-emerald-600' : score >= 40 ? 'text-amber-600' : 'text-slate-500';
  const r = 14, c = 2 * Math.PI * r;
  return (
    <span className="relative inline-flex h-9 w-9 items-center justify-center" title={`Скоринг: ${score}/100`}>
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r={r} fill="none" strokeWidth="3.5" className="stroke-slate-200" />
        <circle cx="18" cy="18" r={r} fill="none" strokeWidth="3.5" strokeLinecap="round"
          strokeDasharray={`${(score / 100) * c} ${c}`} className={`${color.replace('text-', 'stroke-')}`} />
      </svg>
      <span className={`text-[11px] font-extrabold ${color}`}>{score}</span>
    </span>
  );
}

export function StatusChip({ status }: { status: 'draft' | 'published' | 'archived' }) {
  const map = {
    draft: ['Черновик', 'bg-slate-100 text-slate-600'],
    published: ['Опубликован', 'bg-emerald-100 text-emerald-700'],
    archived: ['В архиве', 'bg-slate-100 text-slate-400'],
  } as const;
  const [label, cls] = map[status];
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}>
    {status === 'published' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
    {label}
  </span>;
}

/* ---------- Спиннер и «ИИ думает» ---------- */

export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="think-dot h-2 w-2 rounded-full bg-brand-500" />
      <span className="think-dot h-2 w-2 rounded-full bg-brand-500" />
      <span className="think-dot h-2 w-2 rounded-full bg-brand-500" />
    </span>
  );
}

/* ---------- Тосты ---------- */

interface Toast { id: number; text: string; kind: 'ok' | 'err' }
const ToastCtx = createContext<(text: string, kind?: 'ok' | 'err') => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((text: string, kind: 'ok' | 'err' = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4">
        {toasts.map((t) => (
          <div key={t.id}
            className={`anim-rise pointer-events-auto rounded-xl px-4 py-3 text-sm font-bold text-white shadow-xl ${t.kind === 'ok' ? 'bg-slate-900' : 'bg-red-600'}`}>
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------- Модалка/дровер ---------- */

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
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="anim-rise flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-extrabold">{title}</h3>
          <button onClick={onClose} aria-label="Закрыть"
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

/* ---------- Пустое состояние ---------- */

export function Empty({ icon, title, text, action }: {
  icon: ReactNode; title: string; text: string; action?: ReactNode;
}) {
  return (
    <div className="anim-rise flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-2xl">{icon}</div>
      <h3 className="mb-1 text-lg font-extrabold">{title}</h3>
      <p className="mb-5 max-w-sm text-sm text-slate-500">{text}</p>
      {action}
    </div>
  );
}
