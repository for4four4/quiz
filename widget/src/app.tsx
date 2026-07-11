import { useEffect, useRef, useState } from 'preact/hooks';
import { fetchMeta, fetchResult, sendAnswer, sendLead, startSession } from './api';
import { formatPhone, isValidEmail, isValidPhone } from './phone';
import type { HistoryEntry, QuizMeta, ResultResponse } from './types';

type Screen = 'loading' | 'cover' | 'question' | 'typing' | 'contact' | 'sending' | 'result' | 'error';

const MIN_TYPING_MS = 650; // «печатающаяся» пауза: скрывает задержку LLM, создаёт ощущение диалога

function collectUtm(): Record<string, string> {
  const utm: Record<string, string> = {};
  try {
    new URLSearchParams(location.search).forEach((v, k) => {
      if (k.startsWith('utm_')) utm[k] = v;
    });
  } catch { /* SSR/страница без location — не критично */ }
  return utm;
}

const IconClock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
    <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
  </svg>
);
const IconList = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
    <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
  </svg>
);
const IconGift = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7s-2-4-5-4-3 4 0 4h5zM12 7s2-4 5-4 3 4 0 4h-5z" />
  </svg>
);
const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);
const IconBack = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

/** Лёгкое конфетти на экране результата (~1 КБ, без зависимостей). */
function burstConfetti(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = (canvas.width = canvas.offsetWidth);
  const H = (canvas.height = canvas.offsetHeight);
  const colors = ['#6366f1', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899'];
  const parts = Array.from({ length: 90 }, () => ({
    x: W / 2, y: H * 0.35,
    vx: (Math.random() - 0.5) * 11, vy: Math.random() * -10 - 3,
    s: Math.random() * 6 + 3, r: Math.random() * Math.PI,
    c: colors[(Math.random() * colors.length) | 0], life: 1,
  }));
  let frame = 0;
  const tick = () => {
    ctx.clearRect(0, 0, W, H);
    let alive = false;
    for (const p of parts) {
      p.vy += 0.28; p.x += p.vx; p.y += p.vy; p.r += 0.1; p.life -= 0.011;
      if (p.life <= 0 || p.y > H + 20) continue;
      alive = true;
      ctx.save();
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
      ctx.restore();
    }
    if (alive && frame++ < 260) requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, W, H);
  };
  requestAnimationFrame(tick);
}

export function QuizApp({ quizId, onClose }: { quizId: string; onClose?: () => void }) {
  const [screen, setScreen] = useState<Screen>('loading');
  const [meta, setMeta] = useState<QuizMeta | null>(null);
  const [sessionId, setSessionId] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [idx, setIdx] = useState(0);
  const [result, setResult] = useState<ResultResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMeta(quizId)
      .then((m) => { setMeta(m); setScreen('cover'); })
      .catch(() => { setError('Квиз недоступен'); setScreen('error'); });
  }, [quizId]);

  const start = async () => {
    setScreen('typing');
    try {
      const res = await startSession(quizId, collectUtm());
      setSessionId(res.sessionId);
      if (res.question) {
        setHistory([{ question: res.question, answer: null }]);
        setIdx(0);
        setScreen('question');
      } else {
        setScreen('contact');
      }
    } catch {
      setError('Не удалось начать квиз. Попробуйте обновить страницу.');
      setScreen('error');
    }
  };

  const submitAnswer = async (value: string | string[] | number) => {
    const entry = history[idx];
    // Ответ не изменился и следующий вопрос уже известен — просто шаг вперёд без сети
    if (idx < history.length - 1 && JSON.stringify(entry.answer) === JSON.stringify(value)) {
      setIdx(idx + 1);
      return;
    }
    const newHistory = history.slice(0, idx + 1);
    newHistory[idx] = { ...entry, answer: value };
    setHistory(newHistory);
    setScreen('typing');
    const startedAt = Date.now();
    try {
      const res = await sendAnswer(quizId, {
        sessionId, question: entry.question.title, answer: value, step: idx,
      });
      const wait = MIN_TYPING_MS - (Date.now() - startedAt);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      if (res.action === 'ask') {
        setHistory([...newHistory, { question: res.question, answer: null }]);
        setIdx(idx + 1);
        setScreen('question');
      } else {
        setScreen('contact');
      }
    } catch {
      // Посетитель никогда не видит ошибку: ведём его к форме контактов
      setScreen('contact');
    }
  };

  const goBack = () => {
    if (idx > 0) { setIdx(idx - 1); setScreen('question'); }
  };

  const submitLead = async (fields: { name?: string; phone?: string; email?: string }) => {
    setScreen('sending');
    try {
      await sendLead(quizId, { sessionId, ...fields, consent: true });
    } catch { /* лид мог сохраниться частично — результат всё равно показываем */ }
    try {
      setResult(await fetchResult(quizId, sessionId));
    } catch {
      setResult({
        headline: 'Спасибо! Заявка принята',
        body: 'Мы свяжемся с вами в ближайшее время с персональным предложением.',
      });
    }
    setScreen('result');
  };

  return (
    <div class="kv-card">
      {onClose && <button class="kv-close" onClick={onClose} aria-label="Закрыть">✕</button>}
      {screen === 'loading' && <TypingScreen label="Загружаем квиз…" />}
      {screen === 'error' && <ErrorScreen text={error} />}
      {screen === 'cover' && meta && <Cover meta={meta} onStart={start} />}
      {screen === 'typing' && <TypingScreen label="Подбираем следующий вопрос…" />}
      {screen === 'sending' && <TypingScreen label="Готовим персональный результат…" />}
      {screen === 'question' && history[idx] && (
        <QuestionScreen
          key={idx}
          entry={history[idx]}
          index={idx}
          total={Math.max(meta?.settings.max_questions ?? 7, history.length)}
          onAnswer={submitAnswer}
          onBack={idx > 0 ? goBack : undefined}
        />
      )}
      {screen === 'contact' && meta && <ContactScreen meta={meta} onSubmit={submitLead} />}
      {screen === 'result' && result && <ResultScreen result={result} meta={meta} onClose={onClose} />}
      <div class="kv-brand">
        <a href="https://kvalify.ru?utm_source=widget" target="_blank" rel="noopener">Сделано на Квалифай</a>
      </div>
    </div>
  );
}

function Cover({ meta, onStart }: { meta: QuizMeta; onStart: () => void }) {
  const offer = meta.settings.offer_page;
  const count = meta.questionsCount || meta.settings.max_questions;
  return (
    <div class="kv-cover kv-anim">
      <div class="kv-blob" />
      <span class="kv-eyebrow">Квиз</span>
      <h1>{meta.title}</h1>
      {offer?.subheadline && <p>{offer.subheadline}</p>}
      <div class="kv-meta-row">
        <span class="kv-chip"><IconList />{count} {plural(count, 'вопрос', 'вопроса', 'вопросов')}</span>
        <span class="kv-chip"><IconClock />~1 минута</span>
        {offer?.bonus && <span class="kv-chip"><IconGift />{offer.bonus}</span>}
      </div>
      <button class="kv-btn" onClick={onStart}>Пройти квиз</button>
    </div>
  );
}

function QuestionScreen({ entry, index, total, onAnswer, onBack }: {
  entry: HistoryEntry;
  index: number;
  total: number;
  onAnswer: (v: string | string[] | number) => void;
  onBack?: () => void;
}) {
  const q = entry.question;
  const [picked, setPicked] = useState<string | null>(
    typeof entry.answer === 'string' && q.type === 'single' ? entry.answer : null,
  );
  const [multi, setMulti] = useState<string[]>(Array.isArray(entry.answer) ? entry.answer : []);
  const [text, setText] = useState(typeof entry.answer === 'string' && q.type === 'text' ? entry.answer : '');
  const [slider, setSlider] = useState<number>(
    typeof entry.answer === 'number' ? entry.answer : Math.floor((q.options.length - 1) / 2),
  );
  const progress = Math.round(((index + 1) / (total + 1)) * 100);

  const pickSingle = (opt: string) => {
    if (picked) return; // защита от двойного клика
    setPicked(opt);
    setTimeout(() => onAnswer(opt), 260); // микропауза: видно выбор до перехода
  };

  return (
    <div class="kv-q kv-anim">
      <div class="kv-head">
        {onBack
          ? <button class="kv-btn-ghost" onClick={onBack}><IconBack />Назад</button>
          : <span />}
        <span class="kv-step"><b>{index + 1}</b> / {total}</span>
      </div>
      <div class="kv-progress"><i style={{ width: `${progress}%` }} /></div>
      <h2>{q.title}</h2>

      {q.type === 'single' && (
        <div class="kv-opts">
          {q.options.map((opt, i) => (
            <button key={opt} class={`kv-opt${picked === opt ? ' on' : ''}`} onClick={() => pickSingle(opt)}>
              <span class="kv-key">{String.fromCharCode(65 + i)}</span>
              {opt}
              <span class="kv-check"><IconCheck /></span>
            </button>
          ))}
        </div>
      )}

      {q.type === 'multi' && (
        <>
          <div class="kv-opts">
            {q.options.map((opt, i) => {
              const on = multi.includes(opt);
              return (
                <button
                  key={opt}
                  class={`kv-opt kv-multi${on ? ' on' : ''}`}
                  onClick={() => setMulti(on ? multi.filter((o) => o !== opt) : [...multi, opt])}
                >
                  <span class="kv-key">{String.fromCharCode(65 + i)}</span>
                  {opt}
                  <span class="kv-check"><IconCheck /></span>
                </button>
              );
            })}
          </div>
          <button class="kv-btn" disabled={multi.length === 0} onClick={() => onAnswer(multi)}>Далее</button>
        </>
      )}

      {q.type === 'text' && (
        <>
          <textarea
            class="kv-textarea"
            placeholder="Напишите ответ…"
            value={text}
            onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
          />
          <div style={{ height: '14px' }} />
          <button class="kv-btn" disabled={!text.trim()} onClick={() => onAnswer(text.trim())}>Далее</button>
        </>
      )}

      {q.type === 'slider' && (
        <>
          <div class="kv-slider-val">{q.options[slider] ?? slider}</div>
          <input
            type="range"
            class="kv-range"
            min={0}
            max={Math.max(q.options.length - 1, 10)}
            value={slider}
            onInput={(e) => setSlider(Number((e.target as HTMLInputElement).value))}
          />
          <button class="kv-btn" onClick={() => onAnswer(q.options[slider] ?? slider)}>Далее</button>
        </>
      )}
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
  const [err, setErr] = useState('');
  const privacyUrl = meta.design?.privacy_url || 'https://kvalify.ru/privacy';

  const submit = () => {
    if (fields.includes('phone') && !isValidPhone(phone)) return setErr('Проверьте номер телефона');
    if (fields.includes('email') && email && !isValidEmail(email)) return setErr('Проверьте email');
    if (fields.includes('email') && !fields.includes('phone') && !email) return setErr('Укажите email');
    if (!consent) return setErr('Нужно согласие на обработку данных');
    setErr('');
    onSubmit({
      name: name.trim() || undefined,
      phone: phone || undefined,
      email: email.trim() || undefined,
    });
  };

  return (
    <div class="kv-contact kv-anim">
      <h2>{offer?.headline ?? 'Куда отправить результат?'}</h2>
      <p class="kv-sub">{offer?.subheadline ?? 'Оставьте контакты — пришлём персональное предложение.'}</p>
      {offer?.bonus && <div class="kv-bonus"><IconGift />{offer.bonus}</div>}
      <div class="kv-fields">
        {fields.includes('name') && (
          <input class="kv-input" placeholder="Ваше имя" autocomplete="name" value={name}
            onInput={(e) => setName((e.target as HTMLInputElement).value)} />
        )}
        {fields.includes('phone') && (
          <input class="kv-input" placeholder="+7 (___) ___-__-__" type="tel" inputMode="tel" autocomplete="tel"
            value={phone}
            onInput={(e) => {
              const el = e.target as HTMLInputElement;
              const v = formatPhone(el.value);
              setPhone(v); el.value = v;
            }} />
        )}
        {fields.includes('email') && (
          <input class="kv-input" placeholder="Email" type="email" inputMode="email" autocomplete="email"
            value={email} onInput={(e) => setEmail((e.target as HTMLInputElement).value)} />
        )}
      </div>
      {err && <div class="kv-error">{err}</div>}
      <label class="kv-consent">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent((e.target as HTMLInputElement).checked)} />
        <span>
          Согласен(на) на <a href={privacyUrl} target="_blank" rel="noopener">обработку персональных данных</a> (152-ФЗ)
        </span>
      </label>
      <button class="kv-btn" onClick={submit}>{(meta.settings as { cta_text?: string }).cta_text ?? 'Получить результат'}</button>
    </div>
  );
}

function ResultScreen({ result, meta, onClose }: {
  result: ResultResponse;
  meta: QuizMeta | null;
  onClose?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvasRef.current) burstConfetti(canvasRef.current);
  }, []);
  const redirect = (meta?.settings as { redirect_url?: string } | undefined)?.redirect_url;
  return (
    <div class="kv-result kv-anim">
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
      <div class="kv-result-icon"><IconCheck /></div>
      <h2>{result.headline}</h2>
      <p>{result.body}</p>
      {redirect
        ? <a class="kv-btn" style={{ textDecoration: 'none', textAlign: 'center', display: 'block' }} href={redirect}>Перейти</a>
        : onClose && <button class="kv-btn" onClick={onClose}>Закрыть</button>}
    </div>
  );
}

function TypingScreen({ label }: { label: string }) {
  return (
    <div class="kv-typing kv-anim">
      <div class="kv-typing-dots"><i /><i /><i /></div>
      {label}
    </div>
  );
}

function ErrorScreen({ text }: { text: string }) {
  return <div class="kv-typing">{text}</div>;
}

function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}
