import { useState } from 'react';
import { api, ApiError } from '../api';
import type { QuestionDraft, QuestionType, QuizFull } from '../types';
import { Button, Icon, icons, inputCls, Spinner, Toggle, useToast } from '../ui';
import { ImageInput } from './ImageInput';

const typeOptions: { id: QuestionType; label: string; hasOptions: boolean; hasImg?: boolean }[] = [
  { id: 'single', label: 'Один вариант', hasOptions: true },
  { id: 'multi', label: 'Несколько', hasOptions: true },
  { id: 'image', label: 'С картинками', hasOptions: true, hasImg: true },
  { id: 'slider', label: 'Слайдер', hasOptions: false },
  { id: 'text', label: 'Свободный текст', hasOptions: false },
];
const typeMeta = (t: string) => typeOptions.find((x) => x.id === t) ?? typeOptions[0];

function toDraft(q: QuizFull['questions'][number]): QuestionDraft {
  return {
    type: (['single', 'multi', 'image', 'slider', 'text'].includes(q.type) ? q.type : 'single') as QuestionType,
    title: q.title,
    options: q.options ?? [],
    required: q.required ?? true,
    branch_rules: q.branch_rules ?? {},
  };
}

export function QuestionsEditor({ quiz, mode, onSwitchMode, onSaved }: {
  quiz: QuizFull;
  mode: 'static' | 'adaptive';
  onSwitchMode: (m: 'static' | 'adaptive') => void;
  onSaved: (questions: QuizFull['questions']) => void;
}) {
  const [items, setItems] = useState<QuestionDraft[]>(quiz.questions.map(toDraft));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const toast = useToast();

  const mutate = (fn: (draft: QuestionDraft[]) => void) => {
    const next = items.map((q) => ({ ...q, options: q.options.map((o) => ({ ...o })) }));
    fn(next);
    setItems(next);
    setDirty(true);
  };

  const addQuestion = () => mutate((d) => d.push({ type: 'single', title: '', options: [{ label: '' }, { label: '' }], required: true, branch_rules: {} }));
  const removeQuestion = (i: number) => mutate((d) => d.splice(i, 1));
  const setField = <K extends keyof QuestionDraft>(i: number, key: K, val: QuestionDraft[K]) => mutate((d) => { d[i][key] = val; });
  const setType = (i: number, type: QuestionType) => mutate((d) => {
    d[i].type = type;
    const meta = typeMeta(type);
    if (meta.hasOptions && d[i].options.length === 0) d[i].options = [{ label: '' }, { label: '' }];
    if (!meta.hasOptions) d[i].options = [];
  });
  const setOption = (i: number, oi: number, patch: { label?: string; img?: string }) => mutate((d) => { d[i].options[oi] = { ...d[i].options[oi], ...patch }; });
  const addOption = (i: number) => mutate((d) => { if (d[i].options.length < 8) d[i].options.push({ label: '' }); });
  const removeOption = (i: number, oi: number) => mutate((d) => { if (d[i].options.length > 1) d[i].options.splice(oi, 1); });

  const drop = () => {
    if (dragIdx === null || overIdx === null || dragIdx === overIdx) { setDragIdx(null); setOverIdx(null); return; }
    mutate((d) => { const [m] = d.splice(dragIdx, 1); d.splice(overIdx, 0, m); });
    setDragIdx(null); setOverIdx(null);
  };

  const save = async () => {
    // Валидация: непустые заголовки, у вариативных — минимум 2 непустых варианта
    for (const [i, qd] of items.entries()) {
      if (!qd.title.trim()) return toast(`Вопрос ${i + 1}: заполните текст`, 'err');
      if (typeMeta(qd.type).hasOptions && qd.options.filter((o) => o.label.trim()).length < 2)
        return toast(`Вопрос ${i + 1}: нужно минимум 2 варианта`, 'err');
    }
    setSaving(true);
    try {
      const clean: QuestionDraft[] = items.map((qd) => ({
        ...qd, title: qd.title.trim(),
        options: typeMeta(qd.type).hasOptions ? qd.options.filter((o) => o.label.trim()).map((o) => ({ label: o.label.trim(), ...(o.img?.trim() ? { img: o.img.trim() } : {}) })) : [],
      }));
      const res = await api.saveQuestions(quiz.id, clean);
      onSaved(res.questions);
      setItems(res.questions.map(toDraft));
      setDirty(false);
      toast('Вопросы сохранены');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Не удалось сохранить', 'err');
    } finally { setSaving(false); }
  };

  const ai = mode === 'adaptive';
  return (
    <div className="anim-fade flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4 rounded-[16px] border border-primary-tint-2 bg-primary-tint/50 p-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold">Режим ИИ</span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${ai ? 'bg-primary-tint-2 text-primary' : 'bg-line-2 text-muted'}`}>{ai ? 'включён' : 'выключен'}</span>
          </div>
          <p className="mt-1 text-sm text-muted">
            {ai ? 'ИИ адаптирует вопросы под ответы. Список ниже — запасной сценарий, если ИИ недоступен.'
                : 'Вопросы показываются по порядку. Включите ИИ, чтобы квиз подстраивался под ответы.'}
          </p>
        </div>
        <Toggle on={ai} onChange={(v) => onSwitchMode(v ? 'adaptive' : 'static')} />
      </div>

      {items.map((qd, i) => {
        const meta = typeMeta(qd.type);
        return (
          <div key={i}
            draggable
            onDragStart={() => setDragIdx(i)}
            onDragEnter={() => setOverIdx(i)}
            onDragEnd={drop}
            onDragOver={(e) => e.preventDefault()}
            className={`rounded-[16px] border bg-surface p-4 transition-all ${overIdx === i && dragIdx !== null && dragIdx !== i ? 'border-primary ring-2 ring-primary-tint-2' : 'border-line'} ${dragIdx === i ? 'opacity-50' : ''}`}>
            <div className="flex items-center gap-3">
              <span className="cursor-grab text-faint hover:text-muted active:cursor-grabbing" title="Перетащите" aria-hidden>⠿</span>
              <span className="grid h-7 w-7 flex-none place-items-center rounded-[9px] bg-primary-tint text-xs font-extrabold text-primary">{i + 1}</span>
              <input className={`${inputCls} flex-1`} placeholder="Текст вопроса" value={qd.title} onChange={(e) => setField(i, 'title', e.target.value)} />
              <button onClick={() => removeQuestion(i)} className="grid h-9 w-9 flex-none place-items-center rounded-[10px] text-muted transition-colors hover:bg-red-50 hover:text-danger" aria-label="Удалить вопрос">✕</button>
            </div>

            {/* тип */}
            <div className="mt-3 flex flex-wrap gap-1.5 pl-[52px]">
              {typeOptions.map((t) => (
                <button key={t.id} onClick={() => setType(i, t.id)}
                  className={`cursor-pointer rounded-full border px-3 py-1 text-[12px] font-bold transition-all ${qd.type === t.id ? 'border-primary bg-primary-tint text-primary' : 'border-line text-muted hover:border-faint'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* варианты */}
            {meta.hasOptions && (
              <div className="mt-3 flex flex-col gap-2 pl-[52px]">
                {qd.options.map((o, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    {meta.hasImg && (
                      <span className="h-9 w-9 flex-none overflow-hidden rounded-[9px] border border-line bg-canvas">
                        {o.img?.trim() ? <img src={o.img} alt="" className="h-full w-full object-cover" /> : null}
                      </span>
                    )}
                    <div className="min-w-0 flex-1"><input className={inputCls} placeholder={`Вариант ${oi + 1}`} value={o.label} onChange={(e) => setOption(i, oi, { label: e.target.value })} /></div>
                    {meta.hasImg && (
                      <div className="w-56 flex-none"><ImageInput compact value={o.img} onChange={(url) => setOption(i, oi, { img: url })} /></div>
                    )}
                    <button onClick={() => removeOption(i, oi)} className="grid h-8 w-8 flex-none place-items-center rounded-[9px] text-faint transition-colors hover:bg-line-2 hover:text-muted" aria-label="Убрать вариант">✕</button>
                  </div>
                ))}
                {qd.options.length < 8 && (
                  <button onClick={() => addOption(i)} className="self-start rounded-[9px] px-2 py-1 text-[13px] font-bold text-primary hover:bg-primary-tint">+ вариант</button>
                )}
              </div>
            )}

            {qd.branch_rules?.why && (
              <p className="mt-3 pl-[52px] text-[13px] text-muted"><span className="font-bold text-ink-2">Зачем:</span> {qd.branch_rules.why}</p>
            )}
          </div>
        );
      })}

      <button onClick={addQuestion} className="rounded-[16px] border border-dashed border-line py-4 text-sm font-bold text-muted transition-colors hover:border-primary hover:text-primary">
        <Icon path={icons.plus} size={16} /> Добавить вопрос
      </button>

      {dirty && (
        <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-[16px] border border-line bg-surface/90 p-3 shadow-card backdrop-blur">
          <span className="pl-2 text-[13px] font-bold text-muted">Есть несохранённые изменения</span>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => { setItems(quiz.questions.map(toDraft)); setDirty(false); }}>Отменить</Button>
            <Button disabled={saving} onClick={save}>{saving ? <Spinner /> : 'Сохранить вопросы'}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
