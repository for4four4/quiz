import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api';
import type { GeneratedQuiz } from '../types';
import { Button, Field, inputCls, ThinkingDots } from '../ui';

const thinkingSteps = [
  'ИИ изучает ваш бизнес…',
  'Придумывает вовлекающий первый вопрос…',
  'Подбирает вопросы под цели квалификации…',
  'Формулирует оффер для формы контактов…',
  'Почти готово — собираем квиз…',
];

const typeLabels: Record<string, string> = {
  single: 'один вариант', multi: 'несколько', slider: 'слайдер', text: 'свободный ответ',
};

export function NewQuizPage() {
  const [business, setBusiness] = useState('');
  const [goal, setGoal] = useState('');
  const [geo, setGeo] = useState('');
  const [idealLead, setIdealLead] = useState('');
  const [busy, setBusy] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<{ quizId: string; generated: GeneratedQuiz } | null>(null);
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => () => clearInterval(timerRef.current), []);

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(''); setStepIdx(0);
    timerRef.current = setInterval(() => {
      setStepIdx((i) => Math.min(i + 1, thinkingSteps.length - 1));
    }, 3200);
    try {
      const res = await api.generateQuiz({
        business_description: business,
        goal,
        geo: geo || 'Россия',
        ideal_lead: idealLead,
      });
      setPreview(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось сгенерировать квиз. Попробуйте ещё раз.');
    } finally {
      clearInterval(timerRef.current);
      setBusy(false);
    }
  };

  /* ---------- Экран генерации ---------- */
  if (busy) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center py-24 text-center">
        <div className="anim-rise mb-8 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-brand-600 to-violet-600 text-4xl shadow-2xl shadow-brand-600/30">
          🧠
        </div>
        <ThinkingDots />
        <p key={stepIdx} className="anim-rise mt-5 text-lg font-extrabold">{thinkingSteps[stepIdx]}</p>
        <p className="mt-2 text-sm text-slate-400">Обычно занимает 10–20 секунд</p>
      </div>
    );
  }

  /* ---------- Превью сгенерированного квиза ---------- */
  if (preview) {
    const { generated, quizId } = preview;
    return (
      <div className="mx-auto max-w-2xl">
        <div className="anim-rise mb-6 rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 p-6 text-white shadow-xl shadow-brand-600/20">
          <div className="mb-1 text-xs font-bold uppercase tracking-widest text-white/60">Квиз готов ✨</div>
          <h1 className="text-xl font-extrabold sm:text-2xl">{generated.quiz_title}</h1>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full bg-white/15 px-3 py-1">{generated.questions.length} вопросов</span>
            <span className="rounded-full bg-white/15 px-3 py-1">{generated.qualification_goals.length} целей квалификации</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {generated.questions.map((q, i) => (
            <div key={i} className={`anim-rise-${Math.min(i, 3)} rounded-2xl border border-slate-200 bg-white p-5`}>
              <div className="mb-2 flex items-center gap-2.5">
                <span className="grid h-7 w-7 flex-none place-items-center rounded-lg bg-brand-50 text-xs font-extrabold text-brand-700">{i + 1}</span>
                <h3 className="font-extrabold leading-snug">{q.title}</h3>
              </div>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {q.options.map((opt) => (
                  <span key={opt} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600">{opt}</span>
                ))}
              </div>
              <p className="text-xs text-slate-400">
                <span className="font-bold text-slate-500">Зачем:</span> {q.why}
                <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 font-bold">{typeLabels[q.type] ?? q.type}</span>
              </p>
            </div>
          ))}

          <div className="rounded-2xl border border-dashed border-brand-300 bg-brand-50/50 p-5">
            <div className="mb-1 text-xs font-bold uppercase tracking-widest text-brand-400">Форма контактов</div>
            <h3 className="font-extrabold">{generated.offer_page.headline}</h3>
            <p className="mt-1 text-sm text-slate-500">{generated.offer_page.subheadline}</p>
            {generated.offer_page.bonus && (
              <p className="mt-2 inline-block rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-700">🎁 {generated.offer_page.bonus}</p>
            )}
          </div>
        </div>

        <div className="sticky bottom-4 mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-xl backdrop-blur sm:flex-row">
          <Button className="flex-1" onClick={() => navigate(`/quizzes/${quizId}`)}>
            Открыть в редакторе →
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => setPreview(null)}>
            ↺ Сгенерировать заново
          </Button>
        </div>
      </div>
    );
  }

  /* ---------- Бриф ---------- */
  return (
    <div className="mx-auto max-w-2xl">
      <div className="anim-rise mb-7">
        <h1 className="text-2xl font-extrabold">Создать квиз с ИИ</h1>
        <p className="mt-1 text-sm text-slate-500">
          Расскажите о бизнесе своими словами — как рассказали бы знакомому. Чем конкретнее, тем точнее вопросы.
        </p>
      </div>

      <form onSubmit={generate} className="anim-rise-1 flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Field label="Опишите ваш бизнес и что вы продаёте" hint="Ниша, средний чек, сроки, что важно клиентам — всё, что придёт в голову">
          <textarea
            className={`${inputCls} min-h-32 resize-y`}
            required minLength={20}
            placeholder="Например: строим каркасные дома под ключ в Подмосковье, средний чек 4–7 млн, срок 3–5 месяцев…"
            value={business}
            onChange={(e) => setBusiness(e.target.value)}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Цель квиза">
            <input className={inputCls} required placeholder="Заявки на расчёт стоимости"
              value={goal} onChange={(e) => setGoal(e.target.value)} />
          </Field>
          <Field label="География">
            <input className={inputCls} placeholder="Москва и область"
              value={geo} onChange={(e) => setGeo(e.target.value)} />
          </Field>
        </div>
        <Field label="Хороший лид для вас — это…" hint="По этим критериям ИИ будет оценивать каждую заявку">
          <input className={inputCls} required placeholder="Есть участок, бюджет от 3 млн, стройка в этом году"
            value={idealLead} onChange={(e) => setIdealLead(e.target.value)} />
        </Field>

        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p>}

        <Button type="submit" className="py-3.5 text-base">✨ Сгенерировать квиз</Button>
      </form>
    </div>
  );
}
