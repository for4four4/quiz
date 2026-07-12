/**
 * Стили виджета. Живут в Shadow DOM — не конфликтуют с CSS сайта-хозяина.
 * Дизайн-токены и раскладка перенесены из хэндоффа (тема «Индиго» по умолчанию).
 *
 * Темизация — 6 параметров через CSS-переменные (из quizzes.design):
 *   --kv-primary, --kv-grad, --kv-bg, --kv-surface, --kv-text, --kv-radius.
 * Производные (muted / border / tint) вычисляются через color-mix от базовых —
 * поэтому макет «переживает» смену темы (тёмный фон, нулевой радиус и т.п.).
 */
export const css = `
:host { all: initial; }
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.kv-root {
  
  --kv-primary: oklch(0.53 0.20 274);
  --kv-grad: oklch(0.60 0.19 300);
  --kv-bg: oklch(0.992 0.006 95);
  --kv-surface: oklch(1 0 0);
  --kv-text: oklch(0.24 0.03 275);
  --kv-radius: 16px;
  --kv-cta-text: #ffffff;

  --kv-muted: color-mix(in oklab, var(--kv-text), transparent 44%);
  --kv-faint: color-mix(in oklab, var(--kv-text), transparent 90%);
  --kv-border: color-mix(in oklab, var(--kv-text), transparent 86%);
  --kv-tint: color-mix(in oklab, var(--kv-primary), var(--kv-surface) 88%);
  --kv-tint2: color-mix(in oklab, var(--kv-primary), var(--kv-surface) 78%);
  --kv-gradient: linear-gradient(120deg, var(--kv-primary), var(--kv-grad));
  --kv-danger: oklch(0.62 0.20 25);

  --kv-body: 'Manrope', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  font-family: var(--kv-body);
  color: var(--kv-text);
  font-size: 16px; line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

.kv-root { --r-sm: calc(var(--kv-radius) * 0.4); --r-md: calc(var(--kv-radius) * 0.65);
  --r-lg: calc(var(--kv-radius) * 0.75); --r-xl: calc(var(--kv-radius) * 1.4); }

@keyframes kv-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes kv-dot { 0%,60%,100% { transform: translateY(0); opacity: .4; } 30% { transform: translateY(-4px); opacity: 1; } }
@keyframes kv-pulse { 0%,100% { opacity: .5; } 50% { opacity: 1; } }
@keyframes kv-conf { 0% { transform: translateY(-10px) rotate(0); opacity: 0; } 10% { opacity: 1; } 100% { transform: translateY(320px) rotate(320deg); opacity: 0; } }
@keyframes kv-shimmer { 0% { background-position: -240px 0; } 100% { background-position: 240px 0; } }
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; }
}

.kv-card {
  position: relative; display: flex; flex-direction: column;
  width: 100%; max-width: 560px; margin: 0 auto;
  min-height: 460px; max-height: 100%; overflow: hidden;
  background: var(--kv-surface); color: var(--kv-text);
  border: 1px solid var(--kv-border);
  border-radius: var(--r-xl);
  box-shadow: 0 30px 60px -24px rgba(20,20,50,.25), 0 2px 8px rgba(20,20,50,.06);
}
.kv-card.kv-sheet { border: none; border-radius: var(--r-xl) var(--r-xl) 0 0; box-shadow: none; }

.kv-header { display: flex; align-items: center; gap: 12px; padding: 16px 18px 6px; }
.kv-back {
  display: flex; align-items: center; justify-content: center; flex: none;
  width: 34px; height: 34px; border-radius: var(--r-md);
  border: 1.5px solid var(--kv-border); background: transparent; color: var(--kv-muted);
  cursor: pointer; transition: all .15s ease;
}
.kv-back:hover { border-color: var(--kv-primary); color: var(--kv-primary); }
.kv-progress-col { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.kv-step-label { font: 600 12px/1 var(--kv-body); color: var(--kv-muted); letter-spacing: .01em; }
.kv-bar { height: 5px; border-radius: 3px; background: var(--kv-border); overflow: hidden; }
.kv-bar-fill { height: 100%; border-radius: 3px; background: var(--kv-gradient); transition: width .4s cubic-bezier(.4,0,.2,1); }

.kv-body { flex: 1; min-height: 0; overflow-y: auto; padding: 20px 22px 8px; display: flex; flex-direction: column; }
.kv-pane { display: flex; flex-direction: column; gap: 14px; flex: 1; animation: kv-fade .32s ease both; }

.kv-eyebrow { font: 700 11px/1 var(--kv-body); letter-spacing: .14em; text-transform: uppercase; color: var(--kv-primary); }
.kv-cover-title { font: 800 29px/1.08 var(--kv-body); letter-spacing: -.02em; color: var(--kv-text); text-wrap: balance; }
.kv-sub { font: 500 15px/1.5 var(--kv-body); color: var(--kv-muted); text-wrap: pretty; }
.kv-chip-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 2px; }
.kv-chip {
  display: inline-flex; align-items: center; padding: 7px 12px; border-radius: 999px;
  background: var(--kv-tint); color: color-mix(in oklab, var(--kv-primary), black 12%);
  border: 1px solid color-mix(in oklab, var(--kv-primary), transparent 78%);
  font: 600 12.5px/1 var(--kv-body);
}
.kv-spacer { flex: 1; min-height: 8px; }

.kv-hero { position: relative; margin: -20px -22px 4px; }
.kv-hero img { width: 100%; height: 190px; object-fit: cover; display: block; }
.kv-hero-chip {
  position: absolute; left: 14px; bottom: 12px;
  display: inline-flex; align-items: center; padding: 6px 12px; border-radius: 999px;
  background: color-mix(in oklab, var(--kv-text), transparent 20%); color: #fff;
  font: 700 12px/1 var(--kv-body); backdrop-filter: blur(4px);
}
.kv-cover-photo .kv-cover-title { font-size: 24px; }

.kv-cover-minimal { justify-content: center; align-items: flex-start; gap: 20px; }
.kv-mini-mark { width: 40px; height: 40px; border-radius: var(--r-md); background: var(--kv-gradient); }
.kv-cover-minimal .kv-cover-title { font-size: 34px; line-height: 1.05; }

.kv-cover-gradient {
  margin: -20px -22px 0; padding: 26px 22px; border-radius: var(--r-xl) var(--r-xl) 0 0;
  background: var(--kv-gradient); color: #fff; flex: 1;
}
.kv-cover-gradient .kv-eyebrow { color: rgba(255,255,255,.7); background: none; -webkit-text-fill-color: rgba(255,255,255,.7); }
.kv-cover-gradient .kv-eyebrow::before { background: rgba(255,255,255,.7); }
.kv-cover-gradient .kv-cover-title { color: #fff; }
.kv-cover-gradient .kv-sub { color: rgba(255,255,255,.8); }
.kv-cover-gradient .kv-cta { background: #fff; color: var(--kv-primary); box-shadow: 0 8px 22px rgba(0,0,0,.18); }

.kv-cover-banner { flex-direction: row; align-items: center; gap: 14px; }
.kv-banner-icon {
  display: grid; place-items: center; flex: none; width: 46px; height: 46px; border-radius: var(--r-md);
  background: var(--kv-tint); color: var(--kv-primary);
}
.kv-cover-banner .kv-banner-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.kv-cover-banner .kv-cover-title { font-size: 18px; line-height: 1.2; }
.kv-cover-banner .kv-sub { font-size: 13px; margin: 0; }
.kv-cover-banner .kv-cta { width: auto; flex: none; margin: 0; padding: 13px 20px; }
@media (max-width: 460px) {
  .kv-cover-banner { flex-direction: column; align-items: stretch; }
  .kv-cover-banner .kv-cta { width: 100%; }
}

.kv-cta {
  width: 100%; padding: 15px 20px; border: none; border-radius: var(--r-lg);
  background: var(--kv-gradient); color: var(--kv-cta-text); cursor: pointer;
  font: 700 16px/1 var(--kv-body); margin-top: 4px;
  box-shadow: 0 8px 22px color-mix(in oklab, var(--kv-primary), transparent 68%);
  transition: all .18s ease;
}
.kv-cta:hover { filter: brightness(1.05); transform: translateY(-1px); box-shadow: 0 12px 28px color-mix(in oklab, var(--kv-primary), transparent 58%); }
.kv-cta:disabled { opacity: .5; cursor: not-allowed; transform: none; box-shadow: none; }
.kv-cta-ghost { width: 100%; padding: 12px; margin-top: 2px; border: none; background: transparent; color: var(--kv-muted); cursor: pointer; font: 600 14px/1 var(--kv-body); }

.kv-q-title { font: 800 23px/1.15 var(--kv-body); letter-spacing: -.01em; color: var(--kv-text); text-wrap: balance; }
.kv-q-hint { font: 500 13.5px/1.4 var(--kv-body); color: var(--kv-muted); margin-top: -6px; }
.kv-opts { display: flex; flex-direction: column; gap: 10px; margin-top: 4px; }
.kv-opt {
  display: flex; align-items: center; gap: 12px; width: 100%; text-align: left;
  padding: 12px 14px; min-height: 52px;
  border: 1.5px solid var(--kv-border); border-radius: var(--r-lg);
  background: var(--kv-surface); color: var(--kv-text); cursor: pointer;
  font: 600 15px/1.3 var(--kv-body); transition: all .16s ease;
}
.kv-opt:hover { border-color: var(--kv-primary); background: var(--kv-tint); transform: translateY(-1px); }
.kv-opt.on { border-color: var(--kv-primary); background: var(--kv-tint); }
.kv-badge {
  display: inline-flex; align-items: center; justify-content: center; flex: none;
  width: 30px; height: 30px; border-radius: 50%;
  background: var(--kv-tint); color: var(--kv-primary); border: 1.5px solid var(--kv-border);
  font: 700 14px/1 var(--kv-body); transition: all .18s ease;
}
.kv-opt.on .kv-badge { background: var(--kv-primary); color: var(--kv-cta-text); border-color: var(--kv-primary); }
.kv-badge.kv-check { border-radius: var(--r-sm); background: transparent; color: transparent; }
.kv-opt.on .kv-badge.kv-check { background: var(--kv-primary); color: var(--kv-cta-text); }
.kv-opt-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.kv-opt-label { font: 600 15px/1.25 var(--kv-body); color: var(--kv-text); }
.kv-opt-meta { font: 500 12.5px/1.2 var(--kv-body); color: var(--kv-muted); }

.kv-img-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 4px; }
.kv-img-opt {
  position: relative; display: flex; flex-direction: column; padding: 0; overflow: hidden;
  border: 2px solid var(--kv-border); border-radius: calc(var(--kv-radius) * 0.85);
  background: var(--kv-surface); cursor: pointer; text-align: left; transition: all .16s ease;
}
.kv-img-opt:hover { border-color: var(--kv-primary); transform: translateY(-2px); }
.kv-img-opt.on { border-color: var(--kv-primary); box-shadow: 0 0 0 4px var(--kv-tint); }
.kv-img-opt img { width: 100%; aspect-ratio: 4/3; object-fit: cover; display: block; }
.kv-img-cap { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 9px 11px; background: var(--kv-surface); }
.kv-img-opt.on .kv-img-cap { background: var(--kv-tint); }
.kv-img-cap-text { font: 700 13.5px/1.1 var(--kv-body); color: var(--kv-text); }
.kv-tick { display: inline-flex; align-items: center; justify-content: center; flex: none; width: 20px; height: 20px; border-radius: 50%; border: 1.5px solid var(--kv-border); color: transparent; }
.kv-img-opt.on .kv-tick { border-color: var(--kv-primary); background: var(--kv-primary); color: var(--kv-cta-text); }

.kv-slider-wrap { display: flex; flex-direction: column; gap: 14px; margin-top: 12px; padding: 4px 2px; }
.kv-slider-row { display: flex; align-items: baseline; justify-content: center; gap: 6px; }
.kv-slider-val { font: 800 46px/1 var(--kv-body); color: var(--kv-primary); letter-spacing: -.02em; }
.kv-slider-unit { font: 600 18px/1 var(--kv-body); color: var(--kv-muted); }
.kv-range { width: 100%; accent-color: var(--kv-primary); height: 6px; cursor: pointer; }
.kv-slider-minmax { display: flex; justify-content: space-between; font: 500 12px/1 var(--kv-body); color: var(--kv-muted); }

.kv-textarea {
  width: 100%; margin-top: 6px; padding: 14px; border-radius: var(--r-md);
  border: 1.5px solid var(--kv-border); background: var(--kv-surface); color: var(--kv-text);
  font: 500 15px/1.5 var(--kv-body); resize: none; outline: none; min-height: 104px;
  transition: border-color .15s ease;
}
.kv-textarea:focus { border-color: var(--kv-primary); }

.kv-ai { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; flex: 1; text-align: center; padding: 30px 10px; animation: kv-fade .3s ease both; }
.kv-ai-avatar { display: flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 50%; background: var(--kv-tint); color: var(--kv-primary); animation: kv-pulse 1.8s ease-in-out infinite; }
.kv-ai-bubble { display: inline-flex; align-items: center; gap: 6px; padding: 13px 18px; border-radius: 999px; background: var(--kv-tint2); min-width: 62px; justify-content: center; }
.kv-ai-bubble span { width: 8px; height: 8px; border-radius: 50%; background: var(--kv-primary); animation: kv-dot 1.2s ease-in-out infinite; }
.kv-ai-bubble span:nth-child(2) { animation-delay: .2s; }
.kv-ai-bubble span:nth-child(3) { animation-delay: .4s; }
.kv-ai-caption { font: 600 15px/1.35 var(--kv-body); color: var(--kv-muted); max-width: 240px; }

.kv-bonus {
  display: flex; align-items: center; gap: 9px; padding: 11px 13px; border-radius: var(--r-md);
  background: var(--kv-tint); color: color-mix(in oklab, var(--kv-primary), black 14%);
  font: 600 13.5px/1.3 var(--kv-body);
  border: 1px dashed color-mix(in oklab, var(--kv-primary), transparent 60%);
}
.kv-bonus svg { flex: none; }
.kv-field { display: flex; flex-direction: column; gap: 6px; }
.kv-label { font: 600 13px/1 var(--kv-body); color: var(--kv-text); }
.kv-label-opt { color: var(--kv-muted); font-weight: 500; }
.kv-input {
  width: 100%; padding: 12px 14px; border-radius: var(--r-md);
  border: 1.5px solid var(--kv-border); background: var(--kv-surface); color: var(--kv-text);
  font: 500 15px/1.3 var(--kv-body); outline: none; transition: border-color .15s ease;
}
.kv-input:focus { border-color: var(--kv-primary); }
.kv-input.kv-err { border-color: var(--kv-danger); }
.kv-err-text { font: 500 12px/1.2 var(--kv-body); color: var(--kv-danger); }
.kv-consent {
  display: flex; align-items: flex-start; gap: 10px; width: 100%; text-align: left;
  padding: 10px 12px; margin-top: 2px; border-radius: var(--r-md); cursor: pointer;
  background: transparent; border: 1.5px solid var(--kv-border); transition: all .15s ease;
}
.kv-consent.on { background: var(--kv-tint); border-color: color-mix(in oklab, var(--kv-primary), transparent 55%); }
.kv-consent.kv-err { border-color: var(--kv-danger); background: color-mix(in oklab, var(--kv-danger), transparent 92%); }
.kv-consent-box {
  display: inline-flex; align-items: center; justify-content: center; flex: none;
  width: 22px; height: 22px; border-radius: var(--r-sm); border: 1.5px solid var(--kv-border);
  background: transparent; color: var(--kv-cta-text); transition: all .15s ease;
}
.kv-consent.on .kv-consent-box { background: var(--kv-primary); border-color: var(--kv-primary); }
.kv-consent-text { font: 500 13px/1.45 var(--kv-body); color: var(--kv-text); }
.kv-link { color: var(--kv-primary); text-decoration: underline; text-underline-offset: 2px; }

.kv-confetti { position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 2; }
.kv-confetti i { position: absolute; top: -12px; display: block; }
.kv-result-badge {
  display: inline-flex; align-items: center; gap: 6px; align-self: flex-start; padding: 6px 11px;
  border-radius: 999px; background: var(--kv-tint); color: var(--kv-primary);
  font: 700 11px/1 var(--kv-body); letter-spacing: .08em; text-transform: uppercase;
}
.kv-result-title { font: 800 26px/1.15 var(--kv-body); letter-spacing: -.01em; color: var(--kv-text); text-wrap: balance; }
.kv-result-body { font: 500 15px/1.55 var(--kv-body); color: var(--kv-muted); text-wrap: pretty; }

.kv-skel { background: linear-gradient(90deg, var(--kv-faint), var(--kv-border), var(--kv-faint)); background-size: 480px 100%; border-radius: var(--r-sm); animation: kv-shimmer 1.3s linear infinite; }
.kv-skel-title { height: 26px; width: 80%; margin-bottom: 4px; }
.kv-skel-line { height: 14px; width: 100%; }
.kv-skel-short { height: 14px; width: 60%; margin-bottom: 12px; }
.kv-skel-opt { height: 52px; width: 100%; }
.kv-loading-note { font: 600 13px/1 var(--kv-body); color: var(--kv-muted); text-align: center; margin-top: 14px; }
.kv-sys { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; flex: 1; text-align: center; padding: 30px 18px; animation: kv-fade .3s ease both; }
.kv-sys-icon { display: flex; align-items: center; justify-content: center; width: 60px; height: 60px; border-radius: 50%; background: var(--kv-faint); color: var(--kv-muted); margin-bottom: 2px; }
.kv-sys-title { font: 700 19px/1.25 var(--kv-body); color: var(--kv-text); }
.kv-sys-text { font: 500 14px/1.5 var(--kv-body); color: var(--kv-muted); max-width: 260px; }
.kv-sys-btn { width: auto; padding: 13px 24px; }

.kv-footer { display: flex; align-items: center; justify-content: center; gap: 5px; padding: 12px; border-top: 1px solid var(--kv-border); }
.kv-footer-made { font: 500 11.5px/1 var(--kv-body); color: var(--kv-muted); }
.kv-footer-brand { display: inline-flex; align-items: center; gap: 4px; font: 700 11.5px/1 var(--kv-body); color: var(--kv-text); text-decoration: none; }
.kv-footer-mark { width: 12px; height: 12px; border-radius: 3px; background: var(--kv-gradient); display: inline-block; transform: rotate(45deg); }

.kv-overlay {
  position: fixed; inset: 0; z-index: 2147483000;
  background: rgba(20,20,50,.55); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center; padding: 20px; animation: kv-fade .25s ease both;
}
.kv-modal { position: relative; width: 100%; max-width: 560px; max-height: 92vh; display: flex; }
.kv-close {
  position: absolute; top: 14px; right: 14px; z-index: 3; width: 36px; height: 36px; border-radius: 50%;
  border: 0; cursor: pointer; background: var(--kv-tint); color: var(--kv-muted);
  display: grid; place-items: center; font-size: 16px; line-height: 1; transition: all .2s ease;
}
.kv-close:hover { color: var(--kv-text); transform: rotate(90deg); }
.kv-launcher {
  position: fixed; right: 22px; bottom: 22px; z-index: 2147482999; border: 0; cursor: pointer;
  font-family: var(--kv-body); display: flex; align-items: center; gap: 10px;
  background: var(--kv-gradient); color: var(--kv-cta-text); font: 700 15px/1 var(--kv-body);
  border-radius: 999px; padding: 15px 24px; box-shadow: 0 12px 34px rgba(20,20,50,.35); transition: transform .15s ease;
}
.kv-launcher:hover { transform: translateY(-2px); }

@media (max-width: 560px) {
  .kv-cover-title { font-size: 25px; }
  .kv-q-title { font-size: 21px; }
  .kv-result-title { font-size: 23px; }
  .kv-overlay { padding: 0; align-items: stretch; }
  .kv-modal { max-width: none; max-height: none; }
  .kv-modal .kv-card {
    max-width: none; flex: 1; border: none; border-radius: 0; min-height: 100%;
    box-shadow: none; padding-bottom: env(safe-area-inset-bottom);
  }
  .kv-launcher { right: 14px; bottom: calc(14px + env(safe-area-inset-bottom)); padding: 13px 19px; }
}
`;
