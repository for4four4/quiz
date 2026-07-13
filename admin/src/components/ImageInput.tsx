import { useRef, useState } from 'react';
import { ApiError, uploadImage } from '../api';
import { inputCls, Spinner, useToast } from '../ui';

/**
 * Поле картинки: загрузка файлом ИЛИ вставка ссылки. Показывает превью.
 * `compact` — узкий вариант для строки варианта в редакторе вопросов.
 */
export function ImageInput({ value, onChange, compact }: {
  value?: string;
  onChange: (url: string) => void;
  compact?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try { onChange(await uploadImage(file)); }
    catch (err) { toast(err instanceof ApiError ? err.message : 'Не удалось загрузить', 'err'); }
    finally { setBusy(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const trigger = (
    <button type="button" onClick={() => fileRef.current?.click()} disabled={busy}
      className="grid flex-none place-items-center rounded-[9px] border border-line bg-surface text-muted transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
      style={{ width: compact ? 36 : 40, height: compact ? 36 : 40 }} aria-label="Загрузить фото" title="Загрузить фото">
      {busy ? <Spinner className="h-4 w-4" /> : (
        <svg width={compact ? 16 : 18} height={compact ? 16 : 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 16V4M12 4l-4 4M12 4l4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </svg>
      )}
    </button>
  );

  return (
    <div className="flex items-center gap-2">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      {compact ? (
        <>
          {trigger}
          <input className={inputCls} placeholder="или ссылка на фото" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
        </>
      ) : (
        <>
          <span className="h-16 w-16 flex-none overflow-hidden rounded-[11px] border border-line bg-canvas">
            {value?.trim() ? <img src={value} alt="" className="h-full w-full object-cover" /> : null}
          </span>
          <div className="flex-1">
            <input className={inputCls} placeholder="Ссылка на фото или загрузите файл" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
            <div className="mt-1.5 flex items-center gap-2">
              <button type="button" onClick={() => fileRef.current?.click()} disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-[9px] px-2.5 py-1 text-[13px] font-bold text-primary transition-colors hover:bg-primary-tint disabled:opacity-50">
                {busy ? <Spinner className="h-3.5 w-3.5" /> : '↑'} Загрузить файл
              </button>
              {value && <button type="button" onClick={() => onChange('')} className="rounded-[9px] px-2 py-1 text-[13px] font-bold text-muted hover:text-danger">Убрать</button>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
