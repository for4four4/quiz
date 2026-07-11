/**
 * Стили виджета. Живут в Shadow DOM — не конфликтуют с CSS сайта-хозяина.
 * Темизация — через CSS-переменные, значения приходят из quizzes.design.
 */
export const css = `
:host { all: initial; }
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.kv-root {
  --kv-primary: #6366f1;
  --kv-primary2: #8b5cf6;
  --kv-bg: #ffffff;
  --kv-text: #0f172a;
  --kv-muted: #64748b;
  --kv-line: #e2e8f0;
  --kv-soft: #f1f5f9;
  --kv-radius: 18px;
  --kv-font: 'Manrope', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-family: var(--kv-font);
  color: var(--kv-text);
  font-size: 16px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

/* ---------- Карточка ---------- */
.kv-card {
  position: relative;
  background: var(--kv-bg);
  border-radius: var(--kv-radius);
  box-shadow: 0 10px 40px rgba(15, 23, 42, .12), 0 2px 8px rgba(15, 23, 42, .06);
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  padding: 28px;
  overflow: hidden;
  min-height: 420px;
  display: flex;
  flex-direction: column;
}
.kv-card::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 5px;
  background: linear-gradient(90deg, var(--kv-primary), var(--kv-primary2));
}

/* ---------- Анимации ---------- */
@keyframes kv-in { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes kv-pop { 0% { transform: scale(.94); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
@keyframes kv-bounce { 0%, 80%, 100% { transform: translateY(0); opacity: .4; } 40% { transform: translateY(-6px); opacity: 1; } }
@keyframes kv-pulse { 0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, .45); } 70% { box-shadow: 0 0 0 16px rgba(99, 102, 241, 0); } 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); } }
@keyframes kv-float { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(8px, -10px) scale(1.06); } }
.kv-anim { animation: kv-in .35s cubic-bezier(.2, .8, .3, 1) both; }
@media (prefers-reduced-motion: reduce) {
  .kv-anim, .kv-blob, .kv-launcher { animation: none !important; }
  * { transition-duration: 0s !important; }
}

/* ---------- Обложка ---------- */
.kv-cover { display: flex; flex-direction: column; justify-content: center; flex: 1; text-align: left; position: relative; z-index: 1; }
.kv-blob {
  position: absolute; right: -70px; top: -70px; width: 220px; height: 220px;
  background: radial-gradient(circle at 30% 30%, var(--kv-primary2), var(--kv-primary));
  filter: blur(46px); opacity: .25; border-radius: 50%;
  animation: kv-float 7s ease-in-out infinite; pointer-events: none;
}
.kv-eyebrow {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
  color: var(--kv-primary); margin-bottom: 14px;
}
.kv-eyebrow::before { content: ''; width: 22px; height: 2px; background: var(--kv-primary); border-radius: 2px; }
.kv-cover h1 { font-size: 26px; line-height: 1.25; font-weight: 800; margin-bottom: 12px; }
.kv-cover p { color: var(--kv-muted); margin-bottom: 24px; font-size: 15px; }
.kv-meta-row { display: flex; gap: 14px; margin-bottom: 26px; flex-wrap: wrap; }
.kv-chip {
  display: inline-flex; align-items: center; gap: 7px;
  background: var(--kv-soft); border-radius: 100px; padding: 7px 14px;
  font-size: 13px; font-weight: 600; color: var(--kv-text);
}
.kv-chip svg { width: 15px; height: 15px; color: var(--kv-primary); flex: none; }

/* ---------- Кнопки ---------- */
.kv-btn {
  appearance: none; border: 0; cursor: pointer;
  font-family: inherit; font-size: 16px; font-weight: 700;
  color: #fff; background: linear-gradient(135deg, var(--kv-primary), var(--kv-primary2));
  border-radius: calc(var(--kv-radius) - 4px);
  padding: 15px 28px; width: 100%;
  transition: transform .15s ease, box-shadow .2s ease, filter .2s ease;
  box-shadow: 0 8px 20px color-mix(in srgb, var(--kv-primary) 35%, transparent);
}
.kv-btn:hover { transform: translateY(-2px); filter: brightness(1.06); }
.kv-btn:active { transform: translateY(0) scale(.98); }
.kv-btn:disabled { opacity: .5; cursor: not-allowed; transform: none; box-shadow: none; }
.kv-btn-ghost {
  appearance: none; cursor: pointer; font-family: inherit;
  background: none; border: 0; color: var(--kv-muted); font-size: 14px; font-weight: 600;
  display: inline-flex; align-items: center; gap: 6px; padding: 8px 10px; border-radius: 10px;
  transition: background .15s ease, color .15s ease;
}
.kv-btn-ghost:hover { background: var(--kv-soft); color: var(--kv-text); }

/* ---------- Шапка вопроса ---------- */
.kv-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; min-height: 36px; }
.kv-step { font-size: 13px; font-weight: 700; color: var(--kv-muted); font-variant-numeric: tabular-nums; }
.kv-step b { color: var(--kv-primary); }
.kv-progress { height: 6px; background: var(--kv-soft); border-radius: 100px; overflow: hidden; margin-bottom: 26px; }
.kv-progress i {
  display: block; height: 100%; border-radius: 100px;
  background: linear-gradient(90deg, var(--kv-primary), var(--kv-primary2));
  transition: width .45s cubic-bezier(.2, .8, .3, 1);
}

/* ---------- Вопрос и варианты ---------- */
.kv-q { flex: 1; display: flex; flex-direction: column; }
.kv-q h2 { font-size: 21px; font-weight: 800; line-height: 1.3; margin-bottom: 20px; }
.kv-opts { display: grid; gap: 10px; margin-bottom: 18px; }
.kv-opt {
  appearance: none; cursor: pointer; text-align: left; font-family: inherit;
  display: flex; align-items: center; gap: 12px;
  font-size: 15px; font-weight: 600; color: var(--kv-text);
  background: var(--kv-bg); border: 2px solid var(--kv-line);
  border-radius: calc(var(--kv-radius) - 6px); padding: 14px 16px;
  transition: border-color .15s ease, background .15s ease, transform .15s ease, box-shadow .15s ease;
}
.kv-opt:hover { border-color: var(--kv-primary); transform: translateX(3px); box-shadow: 0 4px 14px rgba(15, 23, 42, .07); }
.kv-opt:active { transform: scale(.98); }
.kv-opt.on {
  border-color: var(--kv-primary);
  background: color-mix(in srgb, var(--kv-primary) 8%, var(--kv-bg));
}
.kv-opt .kv-dot {
  flex: none; width: 22px; height: 22px; border-radius: 50%;
  border: 2px solid var(--kv-line); display: grid; place-items: center;
  transition: border-color .15s ease, background .15s ease;
}
.kv-opt.kv-multi .kv-dot { border-radius: 7px; }
.kv-opt.on .kv-dot { border-color: var(--kv-primary); background: var(--kv-primary); }
.kv-opt.on .kv-dot::after { content: ''; width: 8px; height: 8px; border-radius: inherit; background: #fff; }

.kv-textarea, .kv-input {
  font-family: inherit; font-size: 16px; color: var(--kv-text);
  width: 100%; border: 2px solid var(--kv-line);
  border-radius: calc(var(--kv-radius) - 6px);
  padding: 14px 16px; background: var(--kv-bg);
  transition: border-color .15s ease, box-shadow .15s ease; outline: none;
}
.kv-textarea { min-height: 110px; resize: vertical; }
.kv-textarea:focus, .kv-input:focus {
  border-color: var(--kv-primary);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--kv-primary) 15%, transparent);
}
.kv-input::placeholder, .kv-textarea::placeholder { color: #94a3b8; }

/* слайдер */
.kv-slider-val { font-size: 30px; font-weight: 800; color: var(--kv-primary); text-align: center; margin-bottom: 14px; font-variant-numeric: tabular-nums; }
.kv-range { width: 100%; accent-color: var(--kv-primary); height: 34px; cursor: pointer; margin-bottom: 16px; }

/* ---------- «Печатает…» ---------- */
.kv-typing { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; color: var(--kv-muted); font-size: 14px; font-weight: 600; }
.kv-typing-dots { display: flex; gap: 7px; }
.kv-typing-dots i {
  width: 10px; height: 10px; border-radius: 50%;
  background: var(--kv-primary); animation: kv-bounce 1.1s infinite;
}
.kv-typing-dots i:nth-child(2) { animation-delay: .15s; }
.kv-typing-dots i:nth-child(3) { animation-delay: .3s; }

/* ---------- Контакты ---------- */
.kv-contact h2 { font-size: 22px; font-weight: 800; line-height: 1.25; margin-bottom: 8px; }
.kv-contact .kv-sub { color: var(--kv-muted); font-size: 15px; margin-bottom: 18px; }
.kv-bonus {
  display: flex; align-items: center; gap: 10px;
  background: color-mix(in srgb, var(--kv-primary) 9%, var(--kv-bg));
  border: 1px dashed color-mix(in srgb, var(--kv-primary) 45%, transparent);
  border-radius: calc(var(--kv-radius) - 6px);
  padding: 12px 14px; margin-bottom: 18px; font-size: 14px; font-weight: 600;
}
.kv-bonus svg { width: 20px; height: 20px; color: var(--kv-primary); flex: none; }
.kv-fields { display: grid; gap: 12px; margin-bottom: 14px; }
.kv-consent { display: flex; gap: 10px; align-items: flex-start; font-size: 12.5px; color: var(--kv-muted); margin-bottom: 16px; cursor: pointer; user-select: none; }
.kv-consent input { margin-top: 2px; accent-color: var(--kv-primary); width: 16px; height: 16px; flex: none; cursor: pointer; }
.kv-consent a { color: var(--kv-primary); }
.kv-error { color: #dc2626; font-size: 13.5px; font-weight: 600; margin-bottom: 12px; }

/* ---------- Результат ---------- */
.kv-result { flex: 1; display: flex; flex-direction: column; justify-content: center; text-align: center; position: relative; z-index: 1; }
.kv-result-icon {
  width: 64px; height: 64px; margin: 0 auto 18px; border-radius: 50%;
  background: linear-gradient(135deg, var(--kv-primary), var(--kv-primary2));
  display: grid; place-items: center; color: #fff;
  animation: kv-pop .4s cubic-bezier(.2, .8, .3, 1) both;
}
.kv-result-icon svg { width: 30px; height: 30px; }
.kv-result h2 { font-size: 22px; font-weight: 800; margin-bottom: 12px; }
.kv-result p { color: var(--kv-muted); font-size: 15px; margin-bottom: 24px; white-space: pre-line; }

/* ---------- Подвал ---------- */
.kv-brand { text-align: center; margin-top: 18px; }
.kv-brand a { font-size: 11.5px; color: #94a3b8; text-decoration: none; }
.kv-brand a:hover { color: var(--kv-primary); }

/* ---------- Попап ---------- */
.kv-overlay {
  position: fixed; inset: 0; z-index: 2147483000;
  background: rgba(15, 23, 42, .55);
  -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
  animation: kv-in .25s ease both;
}
.kv-modal { position: relative; width: 100%; max-width: 560px; max-height: 92vh; overflow: auto; border-radius: var(--kv-radius); }
.kv-close {
  position: absolute; top: 12px; right: 12px; z-index: 3;
  width: 34px; height: 34px; border-radius: 50%; border: 0; cursor: pointer;
  background: var(--kv-soft); color: var(--kv-muted);
  display: grid; place-items: center; font-size: 16px; line-height: 1;
  transition: background .15s ease, color .15s ease, transform .15s ease;
}
.kv-close:hover { background: var(--kv-line); color: var(--kv-text); transform: rotate(90deg); }

.kv-launcher {
  position: fixed; right: 22px; bottom: 22px; z-index: 2147482999;
  border: 0; cursor: pointer; font-family: var(--kv-font);
  display: flex; align-items: center; gap: 10px;
  background: linear-gradient(135deg, var(--kv-primary), var(--kv-primary2));
  color: #fff; font-size: 15px; font-weight: 700;
  border-radius: 100px; padding: 14px 22px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, .3);
  animation: kv-pulse 2.4s infinite;
  transition: transform .15s ease;
}
.kv-launcher:hover { transform: translateY(-3px); }
.kv-launcher svg { width: 20px; height: 20px; }

/* ---------- Мобильная вёрстка ---------- */
@media (max-width: 560px) {
  .kv-card { padding: 22px 18px; min-height: 380px; border-radius: 16px; }
  .kv-cover h1 { font-size: 22px; }
  .kv-q h2 { font-size: 18.5px; }
  .kv-contact h2 { font-size: 19px; }
  .kv-opt { padding: 13px 14px; font-size: 14.5px; }
  .kv-btn { padding: 14px 20px; }
  .kv-overlay { padding: 0; align-items: stretch; }
  .kv-modal {
    max-width: none; max-height: none; height: 100%;
    border-radius: 0; display: flex; flex-direction: column;
  }
  .kv-modal .kv-card {
    max-width: none; flex: 1; border-radius: 0; min-height: 100%;
    padding-bottom: calc(22px + env(safe-area-inset-bottom));
  }
  .kv-launcher { right: 14px; bottom: calc(14px + env(safe-area-inset-bottom)); padding: 13px 18px; }
}
`;
