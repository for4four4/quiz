import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { api, ApiError } from '../api';
import type { QuizFull } from '../types';
import { Button, Field, Icon, icons, inputCls, Spinner, StatusChip, Toggle, useToast } from '../ui';

type Tab = 'questions' | 'brief' | 'settings' | 'publish';
const tabs: { id: Tab; label: string }[] = [
  { id: 'questions', label: 'Вопросы' },
  { id: 'brief', label: 'Бриф для ИИ' },
  { id: 'settings', label: 'Настройки' },
  { id: 'publish', label: 'Публикация' },
];
const typeLabels: Record<string, string> = { single: 'один', multi: 'неск.', slider: 'слайдер', text: 'текст', image: 'картинки' };

export function QuizEditorPage() {
  const { id = '' } = useParams();
  const [quiz, setQuiz] = useState<QuizFull | null>(null);
  const [tab, setTab] = useState<Tab>('questions');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => { api.quiz(id).then(setQuiz).catch(() => toast('Квиз не найден', 'err')); }, [id]); // eslint-disable-line

  const patch = async (fields: Record<string, unknown>, ok = 'Сохранено') => {
    if (!quiz) return;
    setSaving(true);
    try { await api.patchQuiz(quiz.id, fields); setQuiz({ ...quiz, ...fields } as QuizFull); toast(ok); }
    catch (err) { toast(err instanceof ApiError ? err.message : 'Не удалось сохранить', 'err'); }
    finally { setSaving(false); }
  };

  if (!quiz) return <div className="flex justify-center py-24 text-primary"><Spinner className="h-8 w-8" /></div>;
  const published = quiz.status === 'published';

  return (
    <div className="mx-auto max-w-3xl">
      {/* Шапка */}
      <div className="anim-rise mb-6 flex flex-col gap-4 lg:flex-row lg:items-start">
        <Link to="/" className="hidden h-9 w-9 flex-none place-items-center rounded-[11px] border border-line text-muted transition-colors hover:border-primary hover:text-primary lg:grid">
          <Icon path={icons.back} size={18} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <input
              className="min-w-0 flex-1 truncate rounded-[8px] border border-transparent bg-transparent px-1 py-0.5 text-2xl font-extrabold tracking-tight outline-none transition-colors hover:border-line focus:border-primary"
              value={quiz.title} onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
              onBlur={(e) => { if (e.target.value.trim()) patch({ title: e.target.value.trim() }, 'Название сохранено'); }}
              aria-label="Название квиза" />
            <Icon path={icons.pencil} size={16} />
          </div>
          <div className="mt-1.5 px-1"><StatusChip status={quiz.status} /></div>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => window.open(`/q/${quiz.slug || quiz.id}`, '_blank')}>
            <Icon path={icons.external} size={16} /> Открыть виджет
          </Button>
          <Button disabled={saving} variant={published ? 'secondary' : 'primary'}
            onClick={() => patch({ status: published ? 'draft' : 'published' }, published ? 'Снят с публикации' : '🎉 Опубликован!')}>
            {published ? 'Снять с публикации' : 'Опубликовать'}
          </Button>
        </div>
      </div>

      {/* Табы (андерлайн) */}
      <div className="mb-6 flex gap-6 overflow-x-auto border-b border-line">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`shrink-0 cursor-pointer border-b-2 pb-3 text-sm font-bold transition-colors ${
              tab === t.id ? 'border-primary text-ink' : 'border-transparent text-muted hover:text-ink-2'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'questions' && <QuestionsTab quiz={quiz} onSwitchMode={(m) => patch({ mode: m }, 'Режим переключён')} />}
      {tab === 'brief' && <BriefTab quiz={quiz} saving={saving} onSave={(bc) => patch({ business_context: bc }, 'Бриф сохранён')} />}
      {tab === 'settings' && <SettingsTab quiz={quiz} saving={saving} onSave={(s) => patch({ settings: s })} />}
      {tab === 'publish' && <PublishTab quiz={quiz} onSlug={(slug) => patch({ slug }, 'Ссылка обновлена')} />}
    </div>
  );
}

/* ================= Вопросы ================= */
function QuestionsTab({ quiz, onSwitchMode }: { quiz: QuizFull; onSwitchMode: (m: 'static' | 'adaptive') => void }) {
  const ai = quiz.mode === 'adaptive';
  return (
    <div className="anim-fade flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4 rounded-[16px] border border-primary-tint-2 bg-primary-tint/50 p-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold">Режим ИИ</span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${ai ? 'bg-primary-tint-2 text-primary' : 'bg-line-2 text-muted'}`}>
              {ai ? 'включён' : 'выключен'}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            ИИ адаптирует вопросы под ответы посетителя и оценивает лиды. Выключите, чтобы показывать фиксированный список вопросов.
          </p>
        </div>
        <Toggle on={ai} onChange={(v) => onSwitchMode(v ? 'adaptive' : 'static')} />
      </div>

      {quiz.questions.map((q, i) => (
        <div key={q.id} className="flex items-center gap-4 rounded-[16px] border border-line bg-surface p-4">
          <span className="grid h-8 w-8 flex-none place-items-center rounded-[10px] bg-primary-tint text-sm font-extrabold text-primary">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <h3 className="font-extrabold leading-snug">{q.title}</h3>
            <p className="mt-0.5 text-[13px] text-muted">
              {q.options.length ? q.options.map((o) => o.label).join(' · ') : { slider: 'диапазон', text: 'свободный текст' }[q.type] ?? '—'}
            </p>
          </div>
          <span className="rounded-full bg-primary-tint px-2.5 py-1 text-[11px] font-bold text-primary">{typeLabels[q.type] ?? q.type}</span>
          <button className="grid h-9 w-9 flex-none place-items-center rounded-[10px] border border-line text-muted transition-colors hover:border-primary hover:text-primary" aria-label="Изменить">
            <Icon path={icons.pencil} size={15} />
          </button>
        </div>
      ))}

      <button className="rounded-[16px] border border-dashed border-line py-4 text-sm font-bold text-muted transition-colors hover:border-primary hover:text-primary">
        + Добавить вопрос
      </button>
    </div>
  );
}

/* ================= Бриф ================= */
function BriefTab({ quiz, saving, onSave }: { quiz: QuizFull; saving: boolean; onSave: (bc: QuizFull['business_context']) => void }) {
  const [bc, setBc] = useState(quiz.business_context);
  const [goals, setGoals] = useState((quiz.business_context.qualification_goals ?? []).join('\n'));
  return (
    <div className="anim-fade flex flex-col gap-5 rounded-[16px] border border-line bg-surface p-6">
      <p className="-mb-1 text-sm text-muted">В адаптивном режиме ИИ опирается на этот бриф: он определяет, какие вопросы задавать и как оценивать лиды.</p>
      <Field label="Описание бизнеса">
        <textarea className={`${inputCls} min-h-28 resize-y`} value={bc.business_description ?? ''} onChange={(e) => setBc({ ...bc, business_description: e.target.value })} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Цель квиза"><input className={inputCls} value={bc.goal ?? ''} onChange={(e) => setBc({ ...bc, goal: e.target.value })} /></Field>
        <Field label="География"><input className={inputCls} value={bc.geo ?? ''} onChange={(e) => setBc({ ...bc, geo: e.target.value })} /></Field>
      </div>
      <Field label="Хороший лид — это…"><input className={inputCls} value={bc.ideal_lead ?? ''} onChange={(e) => setBc({ ...bc, ideal_lead: e.target.value })} /></Field>
      <Field label="Цели квалификации" hint="По одной на строку — что квиз должен выяснить у посетителя">
        <textarea className={`${inputCls} min-h-28 resize-y`} value={goals} onChange={(e) => setGoals(e.target.value)} />
      </Field>
      <div className="flex justify-end">
        <Button disabled={saving} onClick={() => onSave({ ...bc, qualification_goals: goals.split('\n').map((s) => s.trim()).filter(Boolean) })}>
          {saving ? <Spinner /> : 'Сохранить бриф'}
        </Button>
      </div>
    </div>
  );
}

/* ================= Настройки ================= */
function SettingsTab({ quiz, saving, onSave }: { quiz: QuizFull; saving: boolean; onSave: (s: QuizFull['settings']) => void }) {
  const [s, setS] = useState(quiz.settings);
  const offer = s.offer_page ?? { headline: '', subheadline: '', bonus: '' };
  const fields = s.contact_fields ?? ['name', 'phone'];
  const toggle = (f: string) => {
    const next = fields.includes(f) ? fields.filter((x) => x !== f) : [...fields, f];
    if (next.length) setS({ ...s, contact_fields: next });
  };
  return (
    <div className="anim-fade flex flex-col gap-5 rounded-[16px] border border-line bg-surface p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Максимум вопросов"><input className={inputCls} type="number" min={1} max={15} value={s.max_questions ?? 7} onChange={(e) => setS({ ...s, max_questions: Number(e.target.value) })} /></Field>
        <Field label="Текст кнопки"><input className={inputCls} placeholder="Получить расчёт" value={s.cta_text ?? ''} onChange={(e) => setS({ ...s, cta_text: e.target.value })} /></Field>
      </div>
      <div>
        <span className="mb-1.5 block text-[13px] font-bold text-ink">Поля формы контактов</span>
        <div className="flex flex-wrap gap-2">
          {[['name', 'Имя'], ['phone', 'Телефон'], ['email', 'E-mail']].map(([f, label]) => (
            <button key={f} onClick={() => toggle(f)}
              className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm font-bold transition-all ${
                fields.includes(f) ? 'border-primary bg-primary-tint text-primary' : 'border-line text-muted hover:border-faint'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="border-t border-line-2 pt-5">
        <div className="mb-3 text-sm font-extrabold">Экран перед формой контактов</div>
        <div className="flex flex-col gap-4">
          <Field label="Заголовок"><input className={inputCls} value={offer.headline} onChange={(e) => setS({ ...s, offer_page: { ...offer, headline: e.target.value } })} /></Field>
          <Field label="Подзаголовок"><input className={inputCls} value={offer.subheadline} onChange={(e) => setS({ ...s, offer_page: { ...offer, subheadline: e.target.value } })} /></Field>
          <Field label="Бонус за контакт" hint="Например: «Смета в PDF» или «Бесплатный выезд замерщика»">
            <input className={inputCls} value={offer.bonus ?? ''} onChange={(e) => setS({ ...s, offer_page: { ...offer, bonus: e.target.value } })} />
          </Field>
        </div>
      </div>
      <div className="flex justify-end"><Button disabled={saving} onClick={() => onSave(s)}>{saving ? <Spinner /> : 'Сохранить настройки'}</Button></div>
    </div>
  );
}

/* ================= Публикация ================= */
function PublishTab({ quiz, onSlug }: { quiz: QuizFull; onSlug: (slug: string) => void }) {
  const [slug, setSlug] = useState(quiz.slug ?? '');
  const [qr, setQr] = useState('');
  const [snippet, setSnippet] = useState<'html' | 'react' | 'popup'>('html');
  const toast = useToast();
  const origin = window.location.origin;
  const id = quiz.slug || quiz.id;
  const pageUrl = `${origin}/q/${id}`;

  useEffect(() => { QRCode.toDataURL(pageUrl, { width: 480, margin: 1, color: { dark: '#181822' } }).then(setQr).catch(() => setQr('')); }, [pageUrl]);

  const snippets: Record<typeof snippet, string> = {
    html: `<script src="${origin}/widget/kvalify-widget.js"\n  data-quiz-id="${quiz.id}"\n  data-mode="inline" data-target="#quiz" defer></script>\n<div id="quiz"></div>`,
    react: `import { useEffect } from 'react';\n\nexport function Quiz() {\n  useEffect(() => {\n    const s = document.createElement('script');\n    s.src = '${origin}/widget/kvalify-widget.js';\n    s.dataset.quizId = '${quiz.id}';\n    s.dataset.mode = 'inline';\n    s.dataset.target = '#quiz';\n    document.body.appendChild(s);\n  }, []);\n  return <div id="quiz" />;\n}`,
    popup: `<button data-kvalify-open>Пройти квиз</button>\n<script src="${origin}/widget/kvalify-widget.js"\n  data-quiz-id="${quiz.id}" data-mode="button" defer></script>`,
  };
  const copy = (text: string) => navigator.clipboard.writeText(text).then(() => toast('Скопировано'), () => toast('Не удалось скопировать', 'err'));

  return (
    <div className="anim-fade flex flex-col gap-6 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-5">
        {quiz.status !== 'published' && (
          <div className="rounded-[11px] border border-[oklch(0.85_0.09_70)] bg-[oklch(0.97_0.04_75)] px-4 py-3 text-sm font-bold text-[oklch(0.5_0.13_65)]">
            Квиз в черновике — посетители увидят его после публикации.
          </div>
        )}
        <Field label="Адрес квиза (слаг)">
          <div className="flex items-center gap-2">
            <div className={`${inputCls} flex items-center gap-0.5`}>
              <span className="text-muted">kvalify.ru/q/</span>
              <input className="min-w-0 flex-1 bg-transparent font-bold outline-none" placeholder="moy-kviz"
                value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} />
            </div>
            <Button variant="secondary" onClick={() => slug && onSlug(slug)}>OK</Button>
          </div>
        </Field>

        <div>
          <div className="mb-1.5 text-[13px] font-bold text-ink">Прямая ссылка</div>
          <div className="flex items-center gap-2">
            <a href={pageUrl} target="_blank" rel="noopener noreferrer" className={`${inputCls} truncate text-primary`}>{pageUrl}</a>
            <Button variant="secondary" onClick={() => copy(pageUrl)}><Icon path={icons.copy} size={15} /> Копировать</Button>
          </div>
        </div>

        <div>
          <div className="mb-2 text-[13px] font-bold text-ink">Код для вставки</div>
          <div className="mb-2 flex gap-1 rounded-[11px] bg-canvas p-1 text-sm font-bold">
            {(['html', 'react', 'popup'] as const).map((s) => (
              <button key={s} onClick={() => setSnippet(s)}
                className={`cursor-pointer rounded-[8px] px-3 py-1.5 transition-all ${snippet === s ? 'bg-ink text-white' : 'text-muted hover:text-ink-2'}`}>
                {s === 'popup' ? 'Кнопка' : s.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="relative">
            <button onClick={() => copy(snippets[snippet])}
              className="absolute right-3 top-3 cursor-pointer rounded-[8px] bg-white/10 px-2.5 py-1 text-xs font-bold text-white/80 hover:bg-white/20">Копировать</button>
            <pre className="overflow-x-auto rounded-[16px] bg-ink p-4 pt-11 text-xs leading-relaxed text-[#cdd0e0]">{snippets[snippet]}</pre>
          </div>
        </div>
      </div>

      {/* QR */}
      <div className="flex-none rounded-[16px] border border-line bg-surface p-5 text-center lg:w-64">
        <div className="mb-3 text-[11px] font-extrabold uppercase tracking-widest text-muted">QR-код</div>
        {qr && <img src={qr} alt="QR-код квиза" className="mx-auto w-40 rounded-[11px]" />}
        <p className="mt-3 text-[13px] text-muted">Для печатных материалов и офлайн-точек</p>
        {qr && <a href={qr} download={`kvalify-qr-${id}.png`} className="mt-3 inline-block"><Button variant="secondary">Скачать PNG</Button></a>}
      </div>
    </div>
  );
}
