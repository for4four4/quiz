import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api';
import type { GeneratedQuiz } from '../types';
import { Link } from 'react-router-dom';
import { BrandMark, Button, Field, Icon, icons, inputCls, Spinner } from '../ui';

/** Полноэкранная оболочка онбординга (без сайдбара, как в дизайне). */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="flex items-center justify-between px-6 py-5 lg:px-10">
        <Link to="/" className="flex items-center gap-2.5"><BrandMark size={22} /><span className="text-[17px] font-extrabold tracking-tight">Квалифай</span></Link>
        <Link to="/" className="text-sm font-bold text-muted hover:text-ink">Закрыть</Link>
      </header>
      <div className="px-4 pb-16 sm:px-6">{children}</div>
    </div>
  );
}

const genSteps = [
  'Изучаю ваш бизнес…',
  'Определяю целевого клиента…',
  'Придумываю вопросы под цели…',
  'Настраиваю адаптивную логику…',
  'Пишу правила квалификации…',
  'Собираю форму и результат…',
];

const typeLabels: Record<string, string> = { single: 'один', multi: 'неск.', slider: 'слайдер', text: 'текст', image: 'картинки' };

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
  const timer = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => () => clearInterval(timer.current), []);

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(''); setStepIdx(0);
    timer.current = setInterval(() => setStepIdx((i) => Math.min(i + 1, genSteps.length - 1)), 1350);
    try {
      const res = await api.generateQuiz({ business_description: business, goal, geo: geo || 'Россия', ideal_lead: idealLead });
      setPreview(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось сгенерировать квиз. Попробуйте ещё раз.');
    } finally { clearInterval(timer.current); setBusy(false); }
  };

  /* ---------- Экран генерации ---------- */
  if (busy) {
    return (
      <Shell>
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center py-16 text-center">
        {/* пульсирующее ядро + орбита */}
        <div className="relative mb-8 grid h-40 w-40 place-items-center">
          <div className="absolute inset-0 rounded-full border border-dashed border-primary-tint-2 orbit">
            <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-primary" />
          </div>
          <div className="grid h-16 w-16 place-items-center rounded-[18px] grad text-white shadow-btn pulse-core">
            <Icon path={icons.spark} size={26} />
          </div>
        </div>
        <h1 className="mb-2 text-2xl font-extrabold">Собираю ваш квиз</h1>
        <p key={stepIdx} className="anim-fade mb-5 text-[15px] font-bold text-primary">{genSteps[stepIdx]}</p>
        <div className="relative mb-8 h-1.5 w-56 overflow-hidden rounded-full bg-line gen-bar" />
        <div className="w-full max-w-sm rounded-[16px] border border-line bg-surface p-2 text-left shadow-card">
          {genSteps.map((s, i) => (
            <div key={s} className="flex items-center gap-3 rounded-[11px] px-3 py-2.5">
              {i < stepIdx
                ? <span className="grid h-5 w-5 flex-none place-items-center rounded-full bg-success text-white"><Icon path={icons.check} size={12} sw={3} /></span>
                : i === stepIdx
                  ? <Spinner className="h-5 w-5 flex-none text-primary" />
                  : <span className="h-5 w-5 flex-none rounded-full border-2 border-line" />}
              <span className={`text-sm font-bold ${i <= stepIdx ? 'text-ink' : 'text-faint'}`}>{s}</span>
            </div>
          ))}
        </div>
      </div>
      </Shell>
    );
  }

  /* ---------- Превью ---------- */
  if (preview) {
    const { generated, quizId } = preview;
    return (
      <Shell>
      <div className="mx-auto max-w-2xl">
        <div className="anim-rise rounded-[22px] border border-line bg-surface p-6 shadow-card sm:p-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[oklch(0.95_0.04_150)] px-2.5 py-1 text-xs font-bold text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />Квиз готов
          </span>
          <h1 className="mt-3 text-[26px] font-extrabold tracking-tight">{generated.quiz_title}</h1>
          <p className="mt-1 text-[15px] text-muted">
            ИИ собрал {generated.questions.length} вопросов, форму контактов и правила оценки лидов. Проверьте и отправляйте в редактор.
          </p>

          <div className="mt-6 mb-2 text-[11px] font-extrabold uppercase tracking-widest text-muted">Вопросы</div>
          <div className="flex flex-col gap-3">
            {generated.questions.map((q, i) => (
              <div key={i} className="rounded-[16px] border border-line bg-canvas/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-6 w-6 flex-none place-items-center rounded-[8px] bg-primary-tint text-[11px] font-extrabold text-primary">{i + 1}</span>
                    <h3 className="font-extrabold leading-snug">{q.title}</h3>
                  </div>
                  <span className="rounded-full bg-primary-tint px-2.5 py-1 text-[11px] font-bold text-primary">{typeLabels[q.type] ?? q.type}</span>
                </div>
                <p className="mt-1.5 pl-8 text-[13px] text-muted">{q.options.join(' · ')}</p>
                <p className="mt-1.5 flex items-center gap-1.5 pl-8 text-[13px] font-bold text-primary">
                  <Icon path={icons.info} size={14} />{q.why}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[16px] bg-canvas p-4">
              <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-widest text-muted">Оффер формы контактов</div>
              <div className="text-sm font-bold text-ink">{generated.offer_page.headline}</div>
              <p className="mt-1 text-[13px] text-muted">{generated.offer_page.subheadline}{generated.offer_page.bonus ? ` · Бонус: ${generated.offer_page.bonus}` : ''}</p>
            </div>
            <div className="rounded-[16px] bg-canvas p-4">
              <div className="mb-2 text-[11px] font-extrabold uppercase tracking-widest text-muted">Правила квалификации</div>
              <div className="flex flex-wrap gap-1.5">
                {generated.qualification_goals.map((g) => (
                  <span key={g} className="rounded-full bg-primary-tint px-2.5 py-1 text-[12px] font-bold text-primary">{g}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col justify-end gap-3 sm:flex-row">
            <Button variant="secondary" onClick={() => setPreview(null)}>
              <Icon path={icons.refresh} size={16} /> Сгенерировать заново
            </Button>
            <Button onClick={() => navigate(`/quizzes/${quizId}`)}>В редактор</Button>
          </div>
        </div>
      </div>
      </Shell>
    );
  }

  /* ---------- Бриф ---------- */
  return (
    <Shell>
    <div className="mx-auto flex max-w-2xl items-center">
      <form onSubmit={generate} className="anim-rise w-full rounded-[22px] border border-line bg-surface p-6 shadow-card sm:p-9">
        <span className="inline-block rounded-full bg-primary-tint px-3 py-1 text-xs font-bold text-primary">Шаг 1 из 2 · создание квиза</span>
        <h1 className="mt-4 text-[28px] font-extrabold leading-tight tracking-tight">Расскажите про бизнес<br />— остальное сделает ИИ</h1>
        <p className="mt-2 mb-6 text-[15px] text-muted">
          Чем подробнее опишете, тем точнее ИИ подберёт вопросы и правила оценки лидов. Отредактировать можно будет в любой момент.
        </p>

        <div className="flex flex-col gap-5">
          <Field label="Опишите бизнес" required>
            <textarea className={`${inputCls} min-h-28 resize-y`} required minLength={20}
              placeholder="Например: ремонт квартир и домов под ключ в Москве и области. Своя бригада, работаем по договору с гарантией 3 года. Средний чек 900 000 ₽."
              value={business} onChange={(e) => setBusiness(e.target.value)} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Цель квиза">
              <input className={inputCls} required placeholder="Заявки на бесплатный замер" value={goal} onChange={(e) => setGoal(e.target.value)} />
            </Field>
            <Field label="География">
              <input className={inputCls} placeholder="Москва и область" value={geo} onChange={(e) => setGeo(e.target.value)} />
            </Field>
          </div>
          <Field label="Хороший лид — это…" hint="По этим критериям ИИ будет оценивать каждую заявку">
            <input className={inputCls} required placeholder="Ремонт квартиры от 40 м², бюджет от 600 000 ₽, старт в течение 1–2 месяцев"
              value={idealLead} onChange={(e) => setIdealLead(e.target.value)} />
          </Field>
        </div>

        {error && <p className="mt-4 rounded-[11px] bg-red-50 px-4 py-3 text-sm font-bold text-danger">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => navigate('/')}>Отмена</Button>
          <Button type="submit"><Icon path={icons.spark} size={16} /> Сгенерировать квиз</Button>
        </div>
      </form>
    </div>
    </Shell>
  );
}
