import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { api, ApiError } from '../api';
import type { CardStyle, QuizDesign, QuizFull } from '../types';
import { WidgetPreview } from '../components/WidgetPreview';
import { AnalyticsTab } from '../components/AnalyticsTab';
import { QuestionsEditor } from '../components/QuestionsEditor';
import { Button, Field, Icon, icons, inputCls, Spinner, StatusChip, useToast } from '../ui';

type Tab = 'questions' | 'brief' | 'design' | 'analytics' | 'settings' | 'publish';
const tabs: { id: Tab; label: string }[] = [
  { id: 'questions', label: 'Вопросы' },
  { id: 'brief', label: 'Бриф для ИИ' },
  { id: 'design', label: 'Дизайн' },
  { id: 'analytics', label: 'Аналитика' },
  { id: 'settings', label: 'Настройки' },
  { id: 'publish', label: 'Публикация' },
];

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

      {tab === 'questions' && (
        <QuestionsEditor quiz={quiz} mode={quiz.mode}
          onSwitchMode={(m) => patch({ mode: m }, 'Режим переключён')}
          onSaved={(questions) => setQuiz({ ...quiz, questions })} />
      )}
      {tab === 'brief' && <BriefTab quiz={quiz} saving={saving} onSave={(bc) => patch({ business_context: bc }, 'Бриф сохранён')} />}
      {tab === 'design' && <DesignTab quiz={quiz} saving={saving} onSave={(d) => patch({ design: d }, 'Дизайн сохранён')} />}
      {tab === 'analytics' && <AnalyticsTab quizId={quiz.id} />}
      {tab === 'settings' && <SettingsTab quiz={quiz} saving={saving} onSave={(s) => patch({ settings: s })} />}
      {tab === 'publish' && <PublishTab quiz={quiz} onSlug={(slug) => patch({ slug }, 'Ссылка обновлена')} />}
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

/* ================= Дизайн ================= */
const themePresets: { name: string; design: QuizDesign }[] = [
  { name: 'Индиго', design: { primary: 'oklch(0.53 0.20 274)', grad: 'oklch(0.60 0.19 300)', surface: '#ffffff', text: 'oklch(0.24 0.03 275)' } },
  { name: 'Изумруд', design: { primary: 'oklch(0.55 0.15 162)', grad: 'oklch(0.64 0.14 180)', surface: '#ffffff', text: 'oklch(0.24 0.03 200)' } },
  { name: 'Закат', design: { primary: 'oklch(0.62 0.19 35)', grad: 'oklch(0.70 0.16 60)', surface: '#ffffff', text: 'oklch(0.26 0.04 40)' } },
  { name: 'Океан', design: { primary: 'oklch(0.55 0.13 232)', grad: 'oklch(0.63 0.12 205)', surface: '#ffffff', text: 'oklch(0.24 0.03 235)' } },
  { name: 'Ягода', design: { primary: 'oklch(0.55 0.22 350)', grad: 'oklch(0.60 0.20 320)', surface: '#ffffff', text: 'oklch(0.25 0.04 345)' } },
  { name: 'Графит', design: { primary: 'oklch(0.72 0.14 162)', grad: 'oklch(0.78 0.13 180)', surface: 'oklch(0.25 0.02 265)', text: 'oklch(0.96 0.01 260)' } },
];

const cardStyles: { id: CardStyle; name: string; desc: string }[] = [
  { id: 'classic', name: 'Классический', desc: 'заголовок, чипы, CTA — универсально' },
  { id: 'photo', name: 'С фото', desc: 'картинка объекта сверху — доверие' },
  { id: 'minimal', name: 'Минимал', desc: 'крупный заголовок, максимум воздуха' },
  { id: 'gradient', name: 'Градиентная обложка', desc: 'яркий акцент — привлекает взгляд' },
  { id: 'banner', name: 'Компакт-баннер', desc: 'горизонтальный — в узкие блоки' },
];

/** Мини-схема стиля карточки для селектора. */
function StyleThumb({ id, active }: { id: CardStyle; active: boolean }) {
  const bar = (w: string, h = 6, c = 'bg-line') => <span className={`block rounded-full ${c}`} style={{ width: w, height: h }} />;
  const accent = active ? 'bg-primary' : 'bg-primary-tint-2';
  const frame = `flex flex-col gap-1.5 rounded-[8px] border p-2.5 ${active ? 'border-primary' : 'border-line'}`;
  if (id === 'photo') return <div className={frame}><span className="h-8 rounded-[5px] bg-primary-tint" />{bar('70%', 6, 'bg-line')}{bar('90%', 4)}<span className={`mt-0.5 h-3 rounded-[4px] ${accent}`} /></div>;
  if (id === 'minimal') return <div className={`${frame} justify-center`}><span className={`h-3 w-3 rounded-[3px] ${accent}`} />{bar('80%', 7, 'bg-line')}{bar('50%', 7, 'bg-line')}<span className={`mt-1 h-3 rounded-[4px] ${accent}`} /></div>;
  if (id === 'gradient') return <div className={`${frame} grad`}>{bar('40%', 4, 'bg-white/50')}{bar('75%', 7, 'bg-white/80')}{bar('90%', 4, 'bg-white/50')}<span className="mt-0.5 h-3 rounded-[4px] bg-white" /></div>;
  if (id === 'banner') return <div className={`${frame} !flex-row items-center`}><span className={`h-6 w-6 flex-none rounded-[5px] ${accent}`} /><span className="flex flex-1 flex-col gap-1">{bar('90%', 5, 'bg-line')}{bar('60%', 4)}</span><span className={`h-4 w-8 flex-none rounded-[4px] ${accent}`} /></div>;
  return <div className={frame}>{bar('40%', 4, 'bg-primary-tint-2')}{bar('80%', 7, 'bg-line')}{bar('90%', 4)}<span className="flex gap-1">{bar('24%', 5, 'bg-primary-tint')}{bar('24%', 5, 'bg-primary-tint')}</span><span className={`mt-0.5 h-3 rounded-[4px] ${accent}`} /></div>;
}

function DesignTab({ quiz, saving, onSave }: { quiz: QuizFull; saving: boolean; onSave: (d: QuizDesign) => void }) {
  const [d, setD] = useState<QuizDesign>({ card_style: 'classic', ...quiz.design });
  const set = (patch: Partial<QuizDesign>) => setD({ ...d, ...patch });
  const activePreset = themePresets.find((p) => p.design.primary === d.primary)?.name;

  return (
    <div className="anim-fade grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-6">
        {/* Тема */}
        <div className="rounded-[16px] border border-line bg-surface p-5">
          <div className="mb-1 text-sm font-extrabold">Тема оформления</div>
          <p className="mb-4 text-[13px] text-muted">Цвета и градиент кнопок. По умолчанию — фирменная «Индиго».</p>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
            {themePresets.map((p) => {
              const on = activePreset === p.name;
              return (
                <button key={p.name} onClick={() => set(p.design)}
                  className={`flex flex-col items-center gap-1.5 rounded-[11px] border p-2 transition-all ${on ? 'border-primary bg-primary-tint' : 'border-line hover:border-faint'}`}>
                  <span className="h-8 w-8 rounded-full" style={{ background: `linear-gradient(120deg, ${p.design.primary}, ${p.design.grad})` }} />
                  <span className="text-[11px] font-bold">{p.name}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <ColorInput label="Основной" value={d.primary} onChange={(v) => set({ primary: v })} />
            <ColorInput label="Градиент" value={d.grad} onChange={(v) => set({ grad: v })} />
            <ColorInput label="Фон" value={d.surface} onChange={(v) => set({ surface: v })} />
            <ColorInput label="Текст" value={d.text} onChange={(v) => set({ text: v })} />
          </div>
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-[13px] font-bold">
              <span>Скругление углов</span><span className="text-muted">{d.radius ?? 16}px</span>
            </div>
            <input type="range" min={0} max={28} step={2} value={d.radius ?? 16}
              onChange={(e) => set({ radius: Number(e.target.value) })}
              className="w-full accent-[oklch(0.53_0.2_274)]" />
          </div>
        </div>

        {/* Стиль карточки */}
        <div className="rounded-[16px] border border-line bg-surface p-5">
          <div className="mb-1 text-sm font-extrabold">Стиль карточки</div>
          <p className="mb-4 text-[13px] text-muted">Компоновка обложки. Применится ко всем режимам встраивания.</p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {cardStyles.map((cs) => {
              const on = (d.card_style || 'classic') === cs.id;
              return (
                <button key={cs.id} onClick={() => set({ card_style: cs.id })}
                  className={`flex items-center gap-3 rounded-[11px] border p-3 text-left transition-all ${on ? 'border-primary bg-primary-tint/40' : 'border-line hover:border-faint'}`}>
                  <span className="w-16 flex-none"><StyleThumb id={cs.id} active={on} /></span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-ink">{cs.name}</span>
                    <span className="block text-[12px] text-muted">{cs.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>
          {d.card_style === 'photo' && (
            <div className="mt-4">
              <Field label="Ссылка на фото объекта" hint="Прямая ссылка на изображение (JPG/PNG), которое покажется на обложке">
                <input className={inputCls} placeholder="https://…/photo.jpg" value={d.hero_image ?? ''} onChange={(e) => set({ hero_image: e.target.value })} />
              </Field>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setD({ card_style: 'classic', ...themePresets[0].design })}>Сбросить</Button>
          <Button disabled={saving} onClick={() => onSave(d)}>{saving ? <Spinner /> : 'Сохранить дизайн'}</Button>
        </div>
      </div>

      {/* Живое превью */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <div className="mb-3 text-center text-[11px] font-extrabold uppercase tracking-widest text-muted">Превью</div>
        <div className="flex justify-center rounded-[22px] border border-line bg-canvas p-5">
          <WidgetPreview quiz={quiz} design={d} />
        </div>
      </div>
    </div>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  // Нативный color-input отдаёт hex; oklch из пресета показываем свотчем, но для правки нужен hex.
  const isHex = (value ?? '').startsWith('#');
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-bold text-ink-2">{label}</span>
      <span className="flex items-center gap-2 rounded-[11px] border border-line bg-surface px-2 py-1.5">
        <span className="relative h-7 w-7 flex-none overflow-hidden rounded-[7px] border border-line" style={{ background: value || '#fff' }}>
          <input type="color" value={isHex ? value : '#6366f1'} onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label={label} />
        </span>
        <input className="min-w-0 flex-1 bg-transparent text-[12px] font-bold text-muted outline-none"
          value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder="#6366f1" />
      </span>
    </label>
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
