/**
 * Стили виджета. Живут в Shadow DOM — не конфликтуют с CSS сайта-хозяина.
 * Темизация — через CSS-переменные, значения приходят из quizzes.design.
 */
export const css = `
:host { all: initial; }
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.kv-root {
  --kv-primary: #6366f1;
  --kv-primary2: #a855f7;
  --kv-bg: #ffffff;
  --kv-text: #0f172a;
  --kv-muted: #64748b;
  --kv-line: #e2e8f0;
  --kv-soft: #f1f5f9;
  --kv-radius: 20px;
  --kv-font: 'Manrope', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --kv-grad: linear-gradient(135deg, var(--kv-primary), var(--kv-primary2));
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
  box-shadow: 0 24px 70px rgba(49, 46, 129, .18), 0 4px 14px rgba(15, 23, 42, .08);
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  padding: 30px;
  overflow: hidden;
  min-height: 440px;
  display: flex;
  flex-direction: column;
}
.kv-card::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 6px;
  background: var(--kv-grad);
  z-index: 2;
}
/* мягкая градиентная дымка в верхнем углу карточки */
.kv-card::after {
  content: '';
  position: absolute;
  right: -140px; top: -140px;
  width: 340px; height: 340px;
  background: radial-gradient(circle, color-mix(in srgb, var(--kv-primary2) 22%, transparent), transparent 65%);
  pointer-events: none;
}

/* ---------- Анимации ---------- */
@keyframes kv-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
@keyframes kv-pop { 0% { transform: scale(.9); opacity: 0; } 60% { transform: scale(1.04); } 100% { transform: scale(1); opacity: 1; } }
@keyframes kv-bounce { 0%, 80%, 100% { transform: translateY(0); opacity: .4; } 40% { transform: translateY(-7px); opacity: 1; } }
@keyframes kv-pulse { 0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, .5); } 70% { box-shadow: 0 0 0 18px rgba(99, 102, 241, 0); } 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); } }
@keyframes kv-float { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(10px, -14px) scale(1.08); } }
@keyframes kv-shine { 0% { transform: translateX(-130%) skewX(-18deg); } 100% { transform: translateX(240%) skewX(-18deg); } }
.kv-anim { animation: kv-in .4s cubic-bezier(.2, .8, .3, 1) both; position: relative; z-index: 1; }
@media (prefers-reduced-motion: reduce) {
  .kv-anim, .kv-blob, .kv-launcher, .kv-btn::after { animation: none !important; }
  * { transition-duration: 0s !important; }
}

/* ---------- Обложка ---------- */
.kv-cover { display: flex; flex-direction: column; justify-content: center; flex: 1; text-align: left; }
.kv-blob {
  position: absolute; right: -80px; top: -60px; width: 260px; height: 260px;
  background: radial-gradient(circle at 30% 30%, var(--kv-primary2), var(--kv-primary));
  filter: blur(52px); opacity: .3; border-radius: 50%;
  animation: kv-float 7s ease-in-out infinite; pointer-events: none;
}
.kv-eyebrow {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase;
  background: var(--kv-grad); -webkit-background-clip: text; background-clip: text; color: transparent;
  margin-bottom: 16px;
}
.kv-eyebrow::before { content: ''; width: 26px; height: 3px; background: var(--kv-grad); border-radius: 3px; }
.kv-cover h1 { font-size: 28px; line-height: 1.22; font-weight: 800; margin-bottom: 12px; letter-spacing: -.01em; }
.kv-cover p { color: var(--kv-muted); margin-bottom: 24px; font-size: 15.5px; }
.kv-meta-row { display: flex; gap: 10px; margin-bottom: 28px; flex-wrap: wrap; }
.kv-chip {
  display: inline-flex; align-items: center; gap: 8px;
  background: var(--kv-soft);
  border: 1px solid color-mix(in srgb, var(--kv-primary) 14%, transparent);
  border-radius: 100px; padding: 8px 15px;
  font-size: 13px; font-weight: 700; color: var(--kv-text);
}
.kv-chip svg { width: 15px; height: 15px; color: var(--kv-primary); flex: none; }

/* ---------- Кнопки ---------- */
.kv-btn {
  appearance: none; border: 0; cursor: pointer; position: relative; overflow: hidden;
  font-family: inherit; font-size: 16px; font-weight: 800; letter-spacing: .01em;
  color: #fff; background: var(--kv-grad);
  border-radius: calc(var(--kv-radius) - 4px);
  padding: 16px 28px; width: 100%;
  transition: transform .15s ease, box-shadow .2s ease, filter .2s ease;
  box-shadow: 0 10px 26px color-mix(in srgb, var(--kv-primary) 40%, transparent);
}
.kv-btn::after {
  content: ''; position: absolute; top: 0; bottom: 0; width: 44%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.35), transparent);
  animation: kv-shine 3.2s ease-in-out infinite;
}
.kv-btn:hover { transform: translateY(-2px); filter: brightness(1.07); box-shadow: 0 14px 34px color-mix(in srgb, var(--kv-primary) 50%, transparent); }
.kv-btn:active { transform: translateY(0) scale(.98); }
.kv-btn:disabled { opacity: .5; cursor: not-allowed; transform: none; box-shadow: none; }
.kv-btn:disabled::after { animation: none; }
.kv-btn-ghost {
  appearance: none; cursor: pointer; font-family: inherit;
  background: none; border: 0; color: var(--kv-muted); font-size: 14px; font-weight: 700;
  display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 12px;
  transition: background .15s ease, color .15s ease, transform .15s ease;
}
.kv-btn-ghost:hover { background: var(--kv-soft); color: var(--kv-text); transform: translateX(-2px); }

/* ---------- Шапка вопроса ---------- */
.kv-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; min-height: 36px; }
.kv-step { font-size: 13px; font-weight: 800; color: var(--kv-muted); font-variant-numeric: tabular-nums; }
.kv-step b { background: var(--kv-grad); -webkit-background-clip: text; background-clip: text; color: transparent; font-size: 16px; }
.kv-progress { height: 8px; background: var(--kv-soft); border-radius: 100px; overflow: hidden; margin-bottom: 28px; }
.kv-progress i {
  display: block; height: 100%; border-radius: 100px;
  background: var(--kv-grad);
  box-shadow: 0 0 12px color-mix(in srgb, var(--kv-primary) 65%, transparent);
  transition: width .5s cubic-bezier(.2, .8, .3, 1);
}

/* ---------- Вопрос и варианты ---------- */
.kv-q { flex: 1; display: flex; flex-direction: column; }
.kv-q h2 { font-size: 22px; font-weight: 800; line-height: 1.3; margin-bottom: 22px; letter-spacing: -.01em; }
.kv-opts { display: grid; gap: 11px; margin-bottom: 18px; }
.kv-opt {
  appearance: none; cursor: pointer; text-align: left; font-family: inherit;
  position: relative; display: flex; align-items: center; gap: 13px;
  font-size: 15px; font-weight: 700; color: var(--kv-text);
  background: var(--kv-bg);
  border: 2px solid var(--kv-line);
  border-radius: calc(var(--kv-radius) - 6px); padding: 14px 16px;
  transition: border-color .16s ease, background .16s ease, transform .16s ease, box-shadow .16s ease;
}
.kv-opt:hover {
  border-color: var(--kv-primary); transform: translateX(4px);
  box-shadow: 0 6px 18px color-mix(in srgb, var(--kv-primary) 18%, transparent);
}
.kv-opt:active { transform: scale(.98); }
.kv-opt.on {
  border-color: var(--kv-primary);
  background: linear-gradient(135deg,
    color-mix(in srgb, var(--kv-primary) 10%, var(--kv-bg)),
    color-mix(in srgb, var(--kv-primary2) 10%, var(--kv-bg)));
  box-shadow: 0 6px 18px color-mix(in srgb, var(--kv-primary) 22%, transparent);
}
/* буквенный бейдж варианта (A, B, C…) */
.kv-key {
  flex: none; width: 28px; height: 28px; border-radius: 9px;
  display: grid; place-items: center;
  font-size: 13px; font-weight: 800; color: var(--kv-primary);
  background: color-mix(in srgb, var(--kv-primary) 10%, var(--kv-bg));
  border: 1.5px solid color-mix(in srgb, var(--kv-primary) 30%, transparent);
  transition: all .16s ease;
}
.kv-opt.on .kv-key { background: var(--kv-grad); border-color: transparent; color: #fff; }
.kv-opt .kv-check {
  margin-left: auto; width: 22px; height: 22px; flex: none;
  color: var(--kv-primary); opacity: 0; transform: scale(.5);
  transition: opacity .18s ease, transform .18s cubic-bezier(.2, .8, .3, 1);
}
.kv-opt.on .kv-check { opacity: 1; transform: scale(1); }

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
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--kv-primary) 16%, transparent);
}
.kv-input::placeholder, .kv-textarea::placeholder { color: #94a3b8; }

/* слайдер */
.kv-slider-val {
  font-size: 34px; font-weight: 800; text-align: center; margin-bottom: 16px;
  background: var(--kv-grad); -webkit-background-clip: text; background-clip: text; color: transparent;
  font-variant-numeric: tabular-nums;
}
.kv-range { width: 100%; accent-color: var(--kv-primary); height: 34px; cursor: pointer; margin-bottom: 16px; }

/* ---------- «Печатает…» ---------- */
.kv-typing { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; color: var(--kv-muted); font-size: 14px; font-weight: 700; }
.kv-typing-dots { display: flex; gap: 8px; }
.kv-typing-dots i {
  width: 11px; height: 11px; border-radius: 50%;
  background: var(--kv-grad); animation: kv-bounce 1.1s infinite;
}
.kv-typing-dots i:nth-child(2) { animation-delay: .15s; }
.kv-typing-dots i:nth-child(3) { animation-delay: .3s; }

/* ---------- Контакты ---------- */
.kv-contact h2 { font-size: 23px; font-weight: 800; line-height: 1.25; margin-bottom: 8px; letter-spacing: -.01em; }
.kv-contact .kv-sub { color: var(--kv-muted); font-size: 15px; margin-bottom: 18px; }
.kv-bonus {
  position: relative; display: flex; align-items: center; gap: 11px;
  background: linear-gradient(135deg,
    color-mix(in srgb, var(--kv-primary) 9%, var(--kv-bg)),
    color-mix(in srgb, var(--kv-primary2) 12%, var(--kv-bg)));
  border: 1.5px dashed color-mix(in srgb, var(--kv-primary) 45%, transparent);
  border-radius: calc(var(--kv-radius) - 6px);
  padding: 13px 15px; margin-bottom: 18px; font-size: 14px; font-weight: 700;
}
.kv-bonus svg { width: 21px; height: 21px; color: var(--kv-primary); flex: none; }
.kv-fields { display: grid; gap: 12px; margin-bottom: 14px; }
.kv-consent { display: flex; gap: 10px; align-items: flex-start; font-size: 12.5px; color: var(--kv-muted); margin-bottom: 16px; cursor: pointer; user-select: none; }
.kv-consent input { margin-top: 2px; accent-color: var(--kv-primary); width: 16px; height: 16px; flex: none; cursor: pointer; }
.kv-consent a { color: var(--kv-primary); }
.kv-error { color: #dc2626; font-size: 13.5px; font-weight: 700; margin-bottom: 12px; }

/* ---------- Результат ---------- */
.kv-result { flex: 1; display: flex; flex-direction: column; justify-content: center; text-align: center; }
.kv-result-icon {
  width: 72px; height: 72px; margin: 0 auto 20px; border-radius: 24px;
  background: var(--kv-grad);
  display: grid; place-items: center; color: #fff;
  box-shadow: 0 14px 34px color-mix(in srgb, var(--kv-primary) 45%, transparent);
  animation: kv-pop .5s cubic-bezier(.2, .8, .3, 1) both;
}
.kv-result-icon svg { width: 34px; height: 34px; }
.kv-result h2 { font-size: 23px; font-weight: 800; margin-bottom: 12px; letter-spacing: -.01em; }
.kv-result p { color: var(--kv-muted); font-size: 15px; margin-bottom: 24px; white-space: pre-line; }

/* ---------- Подвал ---------- */
.kv-brand { text-align: center; margin-top: 20px; position: relative; z-index: 1; }
.kv-brand a { font-size: 11.5px; font-weight: 600; color: #94a3b8; text-decoration: none; }
.kv-brand a:hover { color: var(--kv-primary); }

/* ---------- Попап ---------- */
.kv-overlay {
  position: fixed; inset: 0; z-index: 2147483000;
  background: rgba(15, 23, 42, .6);
  -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
  animation: kv-in .25s ease both;
}
.kv-modal { position: relative; width: 100%; max-width: 560px; max-height: 92vh; overflow: auto; border-radius: var(--kv-radius); }
.kv-close {
  position: absolute; top: 14px; right: 14px; z-index: 3;
  width: 36px; height: 36px; border-radius: 50%; border: 0; cursor: pointer;
  background: var(--kv-soft); color: var(--kv-muted);
  display: grid; place-items: center; font-size: 16px; line-height: 1;
  transition: background .15s ease, color .15s ease, transform .2s ease;
}
.kv-close:hover { background: var(--kv-line); color: var(--kv-text); transform: rotate(90deg); }

.kv-launcher {
  position: fixed; right: 22px; bottom: 22px; z-index: 2147482999;
  border: 0; cursor: pointer; font-family: var(--kv-font);
  display: flex; align-items: center; gap: 10px;
  background: var(--kv-grad);
  color: #fff; font-size: 15px; font-weight: 800;
  border-radius: 100px; padding: 15px 24px;
  box-shadow: 0 12px 34px rgba(15, 23, 42, .35);
  animation: kv-pulse 2.4s infinite;
  transition: transform .15s ease;
}
.kv-launcher:hover { transform: translateY(-3px) scale(1.03); }
.kv-launcher svg { width: 20px; height: 20px; }

/* ---------- Мобильная вёрстка ---------- */
@media (max-width: 560px) {
  .kv-card { padding: 24px 18px; min-height: 400px; border-radius: 18px; }
  .kv-cover h1 { font-size: 23px; }
  .kv-q h2 { font-size: 19px; }
  .kv-contact h2 { font-size: 20px; }
  .kv-opt { padding: 13px 14px; font-size: 14.5px; gap: 11px; }
  .kv-key { width: 26px; height: 26px; }
  .kv-btn { padding: 15px 20px; }
  .kv-overlay { padding: 0; align-items: stretch; }
  .kv-modal {
    max-width: none; max-height: none; height: 100%;
    border-radius: 0; display: flex; flex-direction: column;
  }
  .kv-modal .kv-card {
    max-width: none; flex: 1; border-radius: 0; min-height: 100%;
    padding-bottom: calc(24px + env(safe-area-inset-bottom));
  }
  .kv-launcher { right: 14px; bottom: calc(14px + env(safe-area-inset-bottom)); padding: 13px 19px; }
}
`;
