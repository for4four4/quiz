import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { fetchMeta, fetchResult, sendAnswer, sendLead, startSession } from './api';
import { formatPhone, isValidEmail, phoneDigits } from './phone';
import type { HistoryEntry, QuizDesign, QuizMeta, ResultResponse } from './types';

/** Применяем тему квиза (6 параметров) к ближайшему .kv-root в Shadow DOM. */
function applyThemeVars(el: HTMLElement | null, design: QuizDesign | undefined) {
  const root = el?.closest('.kv-root') as HTMLElement | null;
  if (!root || !design) return;
  const map: Record<string, string | number | undefined> = {
    '--kv-primary': design.primary, '--kv-grad': design.grad, '--kv-bg': design.bg,
    '--kv-surface': design.surface, '--kv-text': design.text,
    '--kv-radius': design.radius != null ? `${design.radius}px` : undefined,
  };
  for (const [k, v] of Object.entries(map)) if (v != null && v !== '') root.style.setProperty(k, String(v));
}

type Screen = 'loading' | 'cover' | 'question' | 'ai' | 'contact' | 'result' | 'unavailable' | 'error';

const MIN_AI_MS = 1900; // «печатающаяся» пауза: скрывает задержку LLM, создаёт ощущение диалога
const LETTERS = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З'];

function collectUtm(): Record<string, string> {
  const utm: Record<string, string> = {};
  try {
    new URLSearchParams(location.search).forEach((v, k) => { if (k.startsWith('utm_')) utm[k] = v; });
  } catch { /* нет location — не критично */ }
  return utm;
}

/* ---------- Иконки (stroke 2px, как в дизайне) ---------- */
const IArrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
);
const ICheck = ({ s = 14 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
);
const ISpark = ({ s = 22 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M5 12H3M21 12h-2M6.3 6.3 4.9 4.9M19.1 19.1l-1.4-1.4M17.7 6.3l1.4-1.4M4.9 19.1l1.4-1.4" /><circle cx="12" cy="12" r="3.4" /></svg>
);
const IGift = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>
);
const ISad = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><path d="M9 9h.01M15 9h.01M8.5 15.5a4 4 0 0 1 7 0" /></svg>
);
const IOffline = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l22 22M16.7 16.7A11 11 0 0 1 12 18M5 12.5A6 6 0 0 1 9 11M8.5 8.5A11 11 0 0 1 20 12M2 8.8A16 16 0 0 1 7 6.4M12 21h.01" /></svg>
);

/** Лёгкое конфетти (CSS-полоски, без зависимостей). */
function Confetti({ primary }: { primary: string }) {
  const palette = [primary, 'oklch(0.82 0.17 85)', 'oklch(0.7 0.16 20)', 'oklch(0.6 0.19 300)'];
  return (
    <div class="kv-confetti">
      {Array.from({ length: 16 }).map((_, i) => (
        <i key={i} style={{
          left: `${6 + i * 6}%`, width: `${5 + (i % 3) * 2}px`, height: `${8 + (i % 2) * 4}px`,
          background: palette[i % palette.length], borderRadius: i % 2 ? '1px' : '50%', opacity: 0,
          animation: `kv-conf ${1.6 + (i % 4) * 0.25}s ease-in ${i * 0.06}s 1 forwards`,
        }} />
      ))}
    </div>
  );
}

export function QuizApp({ quizId, onClose }: { quizId: string; onClose?: () => void }) {
  const [screen, setScreen] = useState<Screen>('loading');
  const [meta, setMeta] = useState<QuizMeta | null>(null);
  const [sessionId, setSessionId] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [idx, setIdx] = useState(0);
  const [result, setResult] = useState<ResultResponse | null>(null);
  const [aiCaption, setAiCaption] = useState('Подбираем следующий вопрос под ваши ответы');

  const maxQuestions = meta?.settings.max_questions ?? 5;
  const cardRef = useRef<HTMLDivElement>(null);

  const load = () => {
    setScreen('loading');
    fetchMeta(quizId)
      .then((m) => { setMeta(m); applyThemeVars(cardRef.current, m.design); setScreen('cover'); })
      .catch(() => setScreen('unavailable'));
  };
  useEffect(load, [quizId]);

  const start = async () => {
    setAiCaption('Подбираем первый вопрос');
    setScreen('ai');
    const t0 = Date.now();
    try {
      const res = await startSession(quizId, collectUtm());
      setSessionId(res.sessionId);
      const wait = MIN_AI_MS - (Date.now() - t0);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      if (res.question) {
        setHistory([{ question: res.question, answer: null }]);
        setIdx(0);
        setScreen('question');
      } else {
        setScreen('contact');
      }
    } catch {
      setScreen('error');
    }
  };

  const submitAnswer = async (value: string | string[] | number) => {
    const entry = history[idx];
    // ответ не изменился и следующий вопрос уже известен — шаг вперёд без сети
    if (idx < history.length - 1 && JSON.stringify(entry.answer) === JSON.stringify(value)) {
      setIdx(idx + 1); setScreen('question'); return;
    }
    const newHistory = history.slice(0, idx + 1);
    newHistory[idx] = { ...entry, answer: value };
    setHistory(newHistory);
    setAiCaption('Подбираем следующий вопрос под ваши ответы');
    setScreen('ai');
    const t0 = Date.now();
    try {
      const res = await sendAnswer(quizId, { sessionId, question: entry.question.title, answer: value, step: idx });
      const wait = MIN_AI_MS - (Date.now() - t0);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      if (res.action === 'ask') {
        setHistory([...newHistory, { question: res.question, answer: null }]);
        setIdx(idx + 1); setScreen('question');
      } else {
        setScreen('contact');
      }
    } catch {
      setScreen('contact'); // посетитель никогда не видит ошибку
    }
  };

  const goBack = () => { if (idx > 0) { setIdx(idx - 1); setScreen('question'); } };

  const submitLead = async (fields: { name?: string; phone?: string; email?: string }) => {
    setAiCaption('Готовим ваш персональный результат');
    setScreen('ai');
    const t0 = Date.now();
    try { await sendLead(quizId, { sessionId, ...fields, consent: true }); } catch { /* могло сохраниться частично */ }
    try { setResult(await fetchResult(quizId, sessionId)); }
    catch {
      setResult({ headline: 'Спасибо! Заявка принята', body: 'Мы свяжемся с вами в ближайшее время с персональным предложением.' });
    }
    const wait = MIN_AI_MS - (Date.now() - t0);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    setScreen('result');
  };

  const restart = () => { setHistory([]); setIdx(0); setResult(null); setScreen('cover'); };

  const showHeader = screen === 'question' || screen === 'ai' || screen === 'contact';
  const stepNum = screen === 'contact' ? maxQuestions : idx + 1;
  const progressPct = screen === 'cover' ? 0
    : screen === 'result' ? 100
    : Math.round((Math.min(stepNum, maxQuestions) / (maxQuestions + 1)) * 100);

  return (
    <div class="kv-card" ref={cardRef}>
      {onClose && <button class="kv-close" onClick={onClose} aria-label="Закрыть">✕</button>}

      {showHeader && (
        <div class="kv-header">
          <button class="kv-back" onClick={screen === 'question' && idx > 0 ? goBack : undefined}
            aria-label="Назад" style={{ visibility: screen === 'question' && idx > 0 ? 'visible' : 'hidden' }}>
            <IArrow />
          </button>
          <div class="kv-progress-col">
            {screen === 'question' && <div class="kv-step-label">Шаг {Math.min(stepNum, maxQuestions)} из {maxQuestions}</div>}
            <div class="kv-bar"><div class="kv-bar-fill" style={{ width: `${progressPct}%` }} /></div>
          </div>
        </div>
      )}

      <div class="kv-body">
        {screen === 'loading' && <LoadingScreen />}
        {screen === 'cover' && meta && <Cover meta={meta} onStart={start} />}
        {screen === 'question' && history[idx] && (
          <QuestionScreen key={idx} entry={history[idx]} onAnswer={submitAnswer} />
        )}
        {screen === 'ai' && <AiScreen caption={aiCaption} />}
        {screen === 'contact' && meta && <ContactScreen meta={meta} onSubmit={submitLead} />}
        {screen === 'result' && result && <ResultScreen result={result} meta={meta} onRestart={restart} />}
        {screen === 'unavailable' && (
          <SystemScreen icon={<ISad />} title="Квиз пока недоступен"
            text="Владелец сайта приостановил приём заявок. Загляните чуть позже." />
        )}
        {screen === 'error' && (
          <SystemScreen icon={<IOffline />} title="Не удалось загрузить"
            text="Проверьте соединение с интернетом — квиз откроется, как только связь восстановится."
            onRetry={load} />
        )}
      </div>

      <div class="kv-footer">
        <span class="kv-footer-made">Сделано на</span>
        <a class="kv-footer-brand" href="https://kvalify.ru?utm_source=widget" target="_blank" rel="noopener">
          <span class="kv-footer-mark" />Квалифай
        </a>
      </div>
    </div>
  );
}

function Cover({ meta, onStart }: { meta: QuizMeta; onStart: () => void }) {
  const offer = meta.settings.offer_page;
  const count = meta.questionsCount || meta.settings.max_questions;
  const sub = meta.settings.cover_subtitle;
  const style = meta.design?.card_style || 'classic';
  const chips = [
    `${count} ${plural(count, 'вопрос', 'вопроса', 'вопросов')}`,
    '≈ 1 минута',
    ...(offer?.bonus ? [`Бонус: ${offer.bonus}`] : []),
  ];
  const chipRow = <div class="kv-chip-row">{chips.map((c) => <span key={c} class="kv-chip">{c}</span>)}</div>;

  // «Минимал» — крупный заголовок и максимум воздуха
  if (style === 'minimal') {
    return (
      <div class="kv-pane kv-cover-minimal">
        <div class="kv-mini-mark" />
        <h1 class="kv-cover-title">{meta.title}</h1>
        <div class="kv-spacer" />
        <button class="kv-cta" onClick={onStart}>Начать →</button>
      </div>
    );
  }

  // «Компакт-баннер» — горизонтальный, для узких блоков
  if (style === 'banner') {
    return (
      <div class="kv-pane kv-cover-banner">
        <span class="kv-banner-icon"><ISpark s={22} /></span>
        <div class="kv-banner-body">
          <h1 class="kv-cover-title">{meta.title}</h1>
          <p class="kv-sub">{count} {plural(count, 'вопрос', 'вопроса', 'вопросов')} · ≈ 1 минута{offer?.bonus ? ` · ${offer.bonus}` : ''}</p>
        </div>
        <button class="kv-cta" onClick={onStart}>Пройти квиз</button>
      </div>
    );
  }

  // «Градиентная обложка» — весь экран в градиенте
  if (style === 'gradient') {
    return (
      <div class="kv-pane kv-cover-gradient">
        {meta.settings.eyebrow && <div class="kv-eyebrow">{meta.settings.eyebrow}</div>}
        <h1 class="kv-cover-title">{meta.title}</h1>
        {sub && <p class="kv-sub">{sub}</p>}
        {chipRow}
        <div class="kv-spacer" />
        <button class="kv-cta" onClick={onStart}>Пройти квиз</button>
      </div>
    );
  }

  // «С фото» — картинка объекта сверху
  if (style === 'photo' && meta.design?.hero_image) {
    return (
      <div class="kv-pane kv-cover-photo">
        <div class="kv-hero">
          <img src={meta.design.hero_image} alt="" />
          <span class="kv-hero-chip">≈ 1 минута · {count} {plural(count, 'вопрос', 'вопроса', 'вопросов')}</span>
        </div>
        <h1 class="kv-cover-title">{meta.title}</h1>
        {sub && <p class="kv-sub">{sub}</p>}
        <div class="kv-spacer" />
        <button class="kv-cta" onClick={onStart}>Пройти квиз</button>
      </div>
    );
  }

  // «Классический» (по умолчанию)
  return (
    <div class="kv-pane">
      {meta.settings.eyebrow && <div class="kv-eyebrow">{meta.settings.eyebrow}</div>}
      <h1 class="kv-cover-title">{meta.title}</h1>
      {sub && <p class="kv-sub">{sub}</p>}
      {chipRow}
      <div class="kv-spacer" />
      <button class="kv-cta" onClick={onStart}>Пройти квиз</button>
    </div>
  );
}

function QuestionScreen({ entry, onAnswer }: {
  entry: HistoryEntry;
  onAnswer: (v: string | string[] | number) => void;
}) {
  const q = entry.question;
  const [multi, setMulti] = useState<string[]>(Array.isArray(entry.answer) ? entry.answer : []);
  const [text, setText] = useState(typeof entry.answer === 'string' && q.type === 'text' ? entry.answer : '');
  const [slider, setSlider] = useState<number>(typeof entry.answer === 'number' ? entry.answer : 50);
  const [picked, setPicked] = useState<string | null>(null);

  const hint = q.type === 'multi' ? 'Можно выбрать несколько'
    : q.type === 'text' ? 'Пара слов — по желанию'
    : q.type === 'slider' ? 'Двигайте ползунок'
    : q.type === 'image' ? 'Выберите картинку'
    : 'Выберите один вариант';

  const pickSingle = (label: string) => {
    if (picked) return;
    setPicked(label);
    setTimeout(() => onAnswer(label), 200);
  };

  return (
    <div class="kv-pane">
      <h2 class="kv-q-title">{q.title}</h2>
      <div class="kv-q-hint">{hint}</div>

      {q.type === 'single' && (
        <div class="kv-opts">
          {q.options.map((opt, i) => (
            <button key={opt.label} class={`kv-opt${picked === opt.label ? ' on' : ''}`} onClick={() => pickSingle(opt.label)}>
              <span class="kv-badge">{LETTERS[i] ?? i + 1}</span>
              <span class="kv-opt-text"><span class="kv-opt-label">{opt.label}</span></span>
            </button>
          ))}
        </div>
      )}

      {q.type === 'image' && (
        <div class="kv-img-grid">
          {q.options.map((opt) => {
            const on = picked === opt.label;
            return (
              <button key={opt.label} class={`kv-img-opt${on ? ' on' : ''}`} onClick={() => pickSingle(opt.label)}>
                {opt.img
                  ? <img src={opt.img} alt={opt.label} loading="lazy" />
                  : <span style={{ aspectRatio: '4/3', display: 'grid', placeItems: 'center', background: 'var(--kv-tint)', color: 'var(--kv-muted)', fontSize: '12px' }}>нет фото</span>}
                <span class="kv-img-cap">
                  <span class="kv-img-cap-text">{opt.label}</span>
                  <span class="kv-tick">{on && <ICheck s={12} />}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {q.type === 'multi' && (
        <>
          <div class="kv-opts">
            {q.options.map((opt) => {
              const on = multi.includes(opt.label);
              return (
                <button key={opt.label} class={`kv-opt${on ? ' on' : ''}`}
                  onClick={() => setMulti(on ? multi.filter((o) => o !== opt.label) : [...multi, opt.label])}>
                  <span class="kv-badge kv-check">{on && <ICheck />}</span>
                  <span class="kv-opt-text"><span class="kv-opt-label">{opt.label}</span></span>
                </button>
              );
            })}
          </div>
          <button class="kv-cta" disabled={multi.length === 0} onClick={() => onAnswer(multi)}>Далее</button>
        </>
      )}

      {q.type === 'slider' && (
        <>
          <div class="kv-slider-wrap">
            <div class="kv-slider-row"><span class="kv-slider-val">{slider}</span></div>
            <input type="range" class="kv-range" min={0} max={100} step={5} value={slider}
              onInput={(e) => setSlider(Number((e.target as HTMLInputElement).value))} />
            <div class="kv-slider-minmax"><span>0</span><span>100+</span></div>
          </div>
          <button class="kv-cta" onClick={() => onAnswer(slider)}>Далее</button>
        </>
      )}

      {q.type === 'text' && (
        <>
          <textarea class="kv-textarea" placeholder="Например: заехать до Нового года, гипоаллергенные материалы, тёплый пол…" value={text}
            onInput={(e) => setText((e.target as HTMLTextAreaElement).value)} rows={4} />
          <button class="kv-cta" onClick={() => onAnswer(text.trim() || '—')}>Показать результат</button>
        </>
      )}
    </div>
  );
}

function AiScreen({ caption }: { caption: string }) {
  return (
    <div class="kv-ai">
      <div class="kv-ai-avatar"><ISpark /></div>
      <div class="kv-ai-bubble"><span /><span /><span /></div>
      <div class="kv-ai-caption">{caption}</div>
    </div>
  );
}

function ContactScreen({ meta, onSubmit }: {
  meta: QuizMeta;
  onSubmit: (f: { name?: string; phone?: string; email?: string }) => void;
}) {
  const offer = meta.settings.offer_page;
  const fields = meta.settings.contact_fields ?? ['name', 'phone'];
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [tried, setTried] = useState(false);
  const privacyUrl = meta.design?.privacy_url || 'https://kvalify.ru/privacy';

  const eName = tried && fields.includes('name') && name.trim().length < 2 ? 'Введите имя' : '';
  const ePhone = tried && fields.includes('phone') && phoneDigits(phone).length < 10 ? 'Введите телефон полностью' : '';
  const eEmail = tried && fields.includes('email') && !fields.includes('phone') && !isValidEmail(email) ? 'Введите e-mail' : '';
  const eConsent = tried && !consent ? 'Нужно согласие на обработку данных' : '';

  const submit = () => {
    setTried(true);
    const ok = (!fields.includes('name') || name.trim().length >= 2)
      && (!fields.includes('phone') || phoneDigits(phone).length >= 10)
      && (!fields.includes('email') || fields.includes('phone') || isValidEmail(email))
      && consent;
    if (ok) onSubmit({ name: name.trim() || undefined, phone: phone || undefined, email: email.trim() || undefined });
  };

  return (
    <div class="kv-pane">
      <h2 class="kv-q-title">{offer?.headline ?? 'Готово! Куда отправить результат?'}</h2>
      <p class="kv-sub">{offer?.subheadline ?? 'Оставьте контакты — пришлём персональное предложение.'}</p>
      {offer?.bonus && <div class="kv-bonus"><IGift /><span>{offer.bonus}</span></div>}

      {fields.includes('name') && (
        <div class="kv-field">
          <label class="kv-label">Имя</label>
          <input class={`kv-input${eName ? ' kv-err' : ''}`} placeholder="Как к вам обращаться"
            autocomplete="name" value={name} onInput={(e) => setName((e.target as HTMLInputElement).value)} />
          {eName && <div class="kv-err-text">{eName}</div>}
        </div>
      )}
      {fields.includes('phone') && (
        <div class="kv-field">
          <label class="kv-label">Телефон</label>
          <input class={`kv-input${ePhone ? ' kv-err' : ''}`} type="tel" inputMode="tel" autocomplete="tel"
            placeholder="+7 (___) ___-__-__" value={phone}
            onInput={(e) => { const el = e.target as HTMLInputElement; const v = formatPhone(el.value); setPhone(v); el.value = v; }} />
          {ePhone && <div class="kv-err-text">{ePhone}</div>}
        </div>
      )}
      {fields.includes('email') && (
        <div class="kv-field">
          <label class="kv-label">E-mail {!fields.includes('phone') ? '' : <span class="kv-label-opt">— по желанию</span>}</label>
          <input class={`kv-input${eEmail ? ' kv-err' : ''}`} type="email" inputMode="email" autocomplete="email"
            placeholder="you@mail.ru" value={email} onInput={(e) => setEmail((e.target as HTMLInputElement).value)} />
          {eEmail && <div class="kv-err-text">{eEmail}</div>}
        </div>
      )}

      <button class={`kv-consent${consent ? ' on' : ''}${eConsent ? ' kv-err' : ''}`} role="checkbox"
        aria-checked={consent} onClick={() => setConsent(!consent)}>
        <span class="kv-consent-box">{consent && <ICheck s={13} />}</span>
        <span class="kv-consent-text">
          Соглашаюсь на обработку персональных данных согласно{' '}
          <a class="kv-link" href={privacyUrl} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()}>политике конфиденциальности</a>
        </span>
      </button>
      {eConsent && <div class="kv-err-text">{eConsent}</div>}

      <button class="kv-cta" onClick={submit}>{(meta.settings as { cta_text?: string }).cta_text ?? 'Получить результат'}</button>
    </div>
  );
}

function ResultScreen({ result, meta, onRestart }: {
  result: ResultResponse; meta: QuizMeta | null; onRestart: () => void;
}) {
  const primary = useMemo(() => meta?.design?.primary || 'oklch(0.53 0.20 274)', [meta]);
  const redirect = (meta?.settings as { redirect_url?: string } | undefined)?.redirect_url;
  return (
    <>
      <Confetti primary={primary} />
      <div class="kv-pane">
        <div class="kv-result-badge"><ISpark s={14} /><span>Ваш профиль</span></div>
        <h2 class="kv-result-title">{result.headline}</h2>
        <p class="kv-result-body">{result.body}</p>
        <div class="kv-spacer" />
        {redirect
          ? <a class="kv-cta" style={{ textAlign: 'center', textDecoration: 'none', display: 'block' }} href={redirect}>Перейти</a>
          : <button class="kv-cta" onClick={onRestart}>{(meta?.settings as { cta_text?: string })?.cta_text ?? 'Отлично'}</button>}
        <button class="kv-cta-ghost" onClick={onRestart}>Пройти заново</button>
      </div>
    </>
  );
}

function LoadingScreen() {
  return (
    <div class="kv-pane">
      <div class="kv-skel kv-skel-title" />
      <div class="kv-skel kv-skel-line" />
      <div class="kv-skel kv-skel-short" />
      <div class="kv-skel kv-skel-opt" />
      <div class="kv-skel kv-skel-opt" />
      <div class="kv-skel kv-skel-opt" />
      <div class="kv-loading-note">Загружаем квиз…</div>
    </div>
  );
}

function SystemScreen({ icon, title, text, onRetry }: {
  icon: preact.ComponentChildren; title: string; text: string; onRetry?: () => void;
}) {
  return (
    <div class="kv-sys">
      <div class="kv-sys-icon">{icon}</div>
      <div class="kv-sys-title">{title}</div>
      <div class="kv-sys-text">{text}</div>
      {onRetry && <button class="kv-cta kv-sys-btn" onClick={onRetry}>Попробовать снова</button>}
    </div>
  );
}

function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}
