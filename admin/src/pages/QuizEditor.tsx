import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { api, ApiError } from '../api';
import type { QuizFull } from '../types';
import { Button, Field, inputCls, Spinner, StatusChip, useToast } from '../ui';

type Tab = 'questions' | 'brief' | 'settings' | 'publish';

const tabs: { id: Tab; label: string }[] = [
  { id: 'questions', label: 'Вопросы' },
  { id: 'brief', label: 'Бриф для ИИ' },
  { id: 'settings', label: 'Настройки' },
  { id: 'publish', label: 'Публикация' },
];

export function QuizEditorPage() {
  const { id = '' } = useParams();
  const [quiz, setQuiz] = useState<QuizFull | null>(null);
  const [tab, setTab] = useState<Tab>('questions');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    api.quiz(id).then(setQuiz).catch(() => toast('Квиз не найден', 'err'));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const patch = async (fields: Record<string, unknown>, okMessage = 'Сохранено') => {
    if (!quiz) return;
    setSaving(true);
    try {
      await api.patchQuiz(quiz.id, fields);
      setQuiz({ ...quiz, ...fields } as QuizFull);
      toast(okMessage);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Не удалось сохранить', 'err');
    } finally {
      setSaving(false);
    }
  };

  if (!quiz) {
    return <div className="flex justify-center py-24 text-brand-500"><Spinner className="h-8 w-8" /></div>;
  }

  const published = quiz.status === 'published';

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-slate-400 hover:text-brand-600">
        ← Все квизы
      </Link>

      {/* Шапка */}
      <div className="anim-rise mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <input
            className="w-full max-w-xl truncate rounded-lg border border-transparent bg-transparent px-2 py-1 text-xl font-extrabold outline-none transition-colors hover:border-slate-200 focus:border-brand-400 sm:text-2xl"
            value={quiz.title}
            onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
            onBlur={(e) => { if (e.target.value.trim()) patch({ title: e.target.value.trim() }, 'Название сохранено'); }}
            aria-label="Название квиза"
          />
          <div className="mt-1.5 flex items-center gap-2 px-2">
            <StatusChip status={quiz.status} />
            <span className="text-xs font-bold text-slate-400">
              {quiz.mode === 'adaptive' ? '🧠 Адаптивный ИИ-режим' : '📋 Статичный режим'}
            </span>
          </div>
        </div>
        <Button
          disabled={saving}
          variant={published ? 'outline' : 'primary'}
          className="w-full sm:w-auto"
          onClick={() => patch({ status: published ? 'draft' : 'published' }, published ? 'Квиз снят с публикации' : '🎉 Квиз опубликован!')}
        >
          {published ? 'Снять с публикации' : '🚀 Опубликовать'}
        </Button>
      </div>

      {/* Табы */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 text-sm font-bold">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`shrink-0 cursor-pointer rounded-lg px-4 py-2 transition-all ${tab === t.id ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-800'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'questions' && <QuestionsTab quiz={quiz} onSwitchMode={(mode) => patch({ mode }, 'Режим переключён')} />}
      {tab === 'brief' && <BriefTab quiz={quiz} saving={saving} onSave={(bc) => patch({ business_context: bc }, 'Бриф сохранён')} />}
      {tab === 'settings' && <SettingsTab quiz={quiz} saving={saving} onSave={(s) => patch({ settings: s })} />}
      {tab === 'publish' && <PublishTab quiz={quiz} onSlug={(slug) => patch({ slug }, 'Ссылка обновлена')} />}
    </div>
  );
}

/* ================= Вопросы ================= */

function QuestionsTab({ quiz, onSwitchMode }: { quiz: QuizFull; onSwitchMode: (m: 'static' | 'adaptive') => void }) {
  return (
    <div className="anim-rise flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-brand-200 bg-brand-50/60 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-extrabold">{quiz.mode === 'adaptive' ? 'Адаптивный ИИ-режим включён' : 'Статичный режим'}</div>
          <p className="mt-0.5 text-sm text-slate-500">
            {quiz.mode === 'adaptive'
              ? 'ИИ генерирует следующий вопрос по ответам посетителя. Вопросы ниже — запасной сценарий, если ИИ недоступен.'
              : 'Вопросы показываются по порядку. Включите ИИ-режим, чтобы квиз подстраивался под ответы.'}
          </p>
        </div>
        <Button variant="outline" onClick={() => onSwitchMode(quiz.mode === 'adaptive' ? 'static' : 'adaptive')}>
          {quiz.mode === 'adaptive' ? 'Переключить на статичный' : '🧠 Включить ИИ-режим'}
        </Button>
      </div>

      {quiz.questions.map((q, i) => (
        <div key={q.id} className={`anim-rise-${Math.min(i, 3)} rounded-2xl border border-slate-200 bg-white p-5`}>
          <div className="mb-2 flex items-center gap-2.5">
            <span className="grid h-7 w-7 flex-none place-items-center rounded-lg bg-brand-50 text-xs font-extrabold text-brand-700">{i + 1}</span>
            <h3 className="font-extrabold leading-snug">{q.title}</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {q.options.map((o) => (
              <span key={o.label} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600">{o.label}</span>
            ))}
          </div>
          {q.branch_rules?.why && (
            <p className="mt-3 text-xs text-slate-400"><span className="font-bold text-slate-500">Зачем:</span> {q.branch_rules.why}</p>
          )}
        </div>
      ))}
    </div>
  );
}

/* ================= Бриф ================= */

function BriefTab({ quiz, saving, onSave }: {
  quiz: QuizFull; saving: boolean;
  onSave: (bc: QuizFull['business_context']) => void;
}) {
  const [bc, setBc] = useState(quiz.business_context);
  const [goalsText, setGoalsText] = useState((quiz.business_context.qualification_goals ?? []).join('\n'));

  return (
    <div className="anim-rise flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6">
      <p className="-mb-1 text-sm text-slate-500">
        В адаптивном режиме ИИ опирается на этот бриф: он определяет, какие вопросы задавать и как оценивать лиды.
      </p>
      <Field label="Описание бизнеса">
        <textarea className={`${inputCls} min-h-28 resize-y`} value={bc.business_description ?? ''}
          onChange={(e) => setBc({ ...bc, business_description: e.target.value })} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Цель квиза">
          <input className={inputCls} value={bc.goal ?? ''} onChange={(e) => setBc({ ...bc, goal: e.target.value })} />
        </Field>
        <Field label="География">
          <input className={inputCls} value={bc.geo ?? ''} onChange={(e) => setBc({ ...bc, geo: e.target.value })} />
        </Field>
      </div>
      <Field label="Хороший лид — это…">
        <input className={inputCls} value={bc.ideal_lead ?? ''} onChange={(e) => setBc({ ...bc, ideal_lead: e.target.value })} />
      </Field>
      <Field label="Цели квалификации" hint="По одной на строку. Что квиз должен выяснить у посетителя">
        <textarea className={`${inputCls} min-h-28 resize-y`} value={goalsText}
          onChange={(e) => setGoalsText(e.target.value)} />
      </Field>
      <Button disabled={saving}
        onClick={() => onSave({ ...bc, qualification_goals: goalsText.split('\n').map((s) => s.trim()).filter(Boolean) })}>
        {saving ? <Spinner /> : 'Сохранить бриф'}
      </Button>
    </div>
  );
}

/* ================= Настройки ================= */

function SettingsTab({ quiz, saving, onSave }: {
  quiz: QuizFull; saving: boolean;
  onSave: (s: QuizFull['settings']) => void;
}) {
  const [s, setS] = useState(quiz.settings);
  const offer = s.offer_page ?? { headline: '', subheadline: '', bonus: '' };
  const fields = s.contact_fields ?? ['name', 'phone'];

  const toggleField = (f: string) => {
    const next = fields.includes(f) ? fields.filter((x) => x !== f) : [...fields, f];
    if (next.length === 0) return;
    setS({ ...s, contact_fields: next });
  };

  return (
    <div className="anim-rise flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Максимум вопросов">
          <input className={inputCls} type="number" min={1} max={15} value={s.max_questions ?? 7}
            onChange={(e) => setS({ ...s, max_questions: Number(e.target.value) })} />
        </Field>
        <Field label="Текст кнопки CTA">
          <input className={inputCls} value={s.cta_text ?? ''} placeholder="Получить расчёт"
            onChange={(e) => setS({ ...s, cta_text: e.target.value })} />
        </Field>
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-bold text-slate-700">Поля формы контактов</span>
        <div className="flex flex-wrap gap-2">
          {[['name', 'Имя'], ['phone', 'Телефон'], ['email', 'Email']].map(([f, label]) => (
            <button key={f} onClick={() => toggleField(f)}
              className={`cursor-pointer rounded-full border-2 px-4 py-1.5 text-sm font-bold transition-all ${
                fields.includes(f)
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-slate-200 text-slate-400 hover:border-slate-300'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-100 pt-5">
        <div className="mb-3 text-sm font-extrabold text-slate-700">Экран перед формой контактов</div>
        <div className="flex flex-col gap-4">
          <Field label="Заголовок">
            <input className={inputCls} value={offer.headline}
              onChange={(e) => setS({ ...s, offer_page: { ...offer, headline: e.target.value } })} />
          </Field>
          <Field label="Подзаголовок">
            <input className={inputCls} value={offer.subheadline}
              onChange={(e) => setS({ ...s, offer_page: { ...offer, subheadline: e.target.value } })} />
          </Field>
          <Field label="Бонус за контакт" hint="Например: «Скидка 5% на договор» или «PDF с примерами работ»">
            <input className={inputCls} value={offer.bonus ?? ''}
              onChange={(e) => setS({ ...s, offer_page: { ...offer, bonus: e.target.value } })} />
          </Field>
        </div>
      </div>

      <Button disabled={saving} onClick={() => onSave(s)}>
        {saving ? <Spinner /> : 'Сохранить настройки'}
      </Button>
    </div>
  );
}

/* ================= Публикация ================= */

function CopyBlock({ label, code }: { label: string; code: string }) {
  const toast = useToast();
  const copy = () => {
    navigator.clipboard.writeText(code).then(
      () => toast('Скопировано в буфер обмена'),
      () => toast('Не удалось скопировать', 'err'),
    );
  };
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-bold text-slate-700">{label}</span>
        <button onClick={copy} className="cursor-pointer rounded-lg px-2.5 py-1 text-xs font-bold text-brand-600 transition-colors hover:bg-brand-50">
          ⧉ Копировать
        </button>
      </div>
      <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs leading-relaxed text-slate-200">{code}</pre>
    </div>
  );
}

function PublishTab({ quiz, onSlug }: { quiz: QuizFull; onSlug: (slug: string) => void }) {
  const [slug, setSlug] = useState(quiz.slug ?? '');
  const [qr, setQr] = useState('');
  const origin = window.location.origin;
  const pageUrl = `${origin}/q/${quiz.slug || quiz.id}`;

  useEffect(() => {
    QRCode.toDataURL(pageUrl, { width: 480, margin: 1, color: { dark: '#1e1b4b' } })
      .then(setQr).catch(() => setQr(''));
  }, [pageUrl]);

  const embed = useMemo(() => ({
    inline: `<div id="kvalify-quiz"></div>\n<script src="${origin}/widget/kvalify-widget.js"\n        data-quiz-id="${quiz.id}"\n        data-mode="inline" data-target="#kvalify-quiz" defer></script>`,
    popup: `<script src="${origin}/widget/kvalify-widget.js"\n        data-quiz-id="${quiz.id}"\n        data-mode="popup" data-button-text="Пройти квиз" defer></script>`,
    button: `<button data-kvalify-open>Подобрать решение</button>\n<script src="${origin}/widget/kvalify-widget.js"\n        data-quiz-id="${quiz.id}" data-mode="button" defer></script>`,
  }), [origin, quiz.id]);

  return (
    <div className="anim-rise flex flex-col gap-6">
      {quiz.status !== 'published' && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
          ⚠️ Квиз пока в черновике — посетители увидят его только после публикации.
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 font-extrabold">Прямая ссылка и QR</h3>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
            <Field label="Слаг (адрес страницы)" hint="Латиница, цифры и дефис. Пусто — используется ID">
              <div className="flex gap-2">
                <input className={inputCls} placeholder="moy-kviz" value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())} />
                <Button variant="outline" onClick={() => slug && onSlug(slug)}>OK</Button>
              </div>
            </Field>
            <a href={pageUrl} target="_blank" rel="noopener noreferrer"
              className="mt-3 block truncate rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-brand-600 transition-colors hover:bg-brand-50">
              {pageUrl} ↗
            </a>
          </div>
          {qr && (
            <a href={qr} download={`kvalify-qr-${quiz.slug || quiz.id}.png`}
              title="Скачать QR-код"
              className="mx-auto block w-36 flex-none overflow-hidden rounded-2xl border border-slate-200 transition-transform hover:scale-105 sm:mx-0">
              <img src={qr} alt="QR-код квиза" className="block w-full" />
            </a>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="font-extrabold">Код для вставки на сайт</h3>
        <CopyBlock label="Встроенный блок" code={embed.inline} />
        <CopyBlock label="Попап с плавающей кнопкой" code={embed.popup} />
        <CopyBlock label="Открытие по своей кнопке" code={embed.button} />
      </div>
    </div>
  );
}
