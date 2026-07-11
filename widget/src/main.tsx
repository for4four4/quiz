import { render } from 'preact';
import { useState } from 'preact/hooks';
import { setApiBase } from './api';
import { QuizApp } from './app';
import { css } from './styles';
import type { QuizDesign } from './types';

/**
 * Точка входа виджета. Подключение на сайт клиента:
 *
 *   <script src="https://кв-домен/widget/kvalify-widget.js"
 *           data-quiz-id="UUID"
 *           data-api="https://кв-домен"      (по умолчанию — origin скрипта)
 *           data-mode="popup"                 popup | inline | button
 *           data-target="#quiz"               куда встраивать при inline
 *           data-button-text="Пройти квиз"    текст плавающей кнопки
 *           defer></script>
 *
 * Программный API: window.Kvalify.open(), window.Kvalify.mount(el, quizId)
 */

function applyTheme(el: HTMLElement, design: QuizDesign | undefined) {
  if (!design) return;
  const map: Record<string, string | undefined> = {
    '--kv-primary': design.primary,
    '--kv-primary2': design.primary_dark ?? design.primary,
    '--kv-bg': design.bg,
    '--kv-text': design.text,
    '--kv-radius': design.radius,
    '--kv-font': design.font,
  };
  for (const [k, v] of Object.entries(map)) if (v) el.style.setProperty(k, v);
}

/** Хост с Shadow DOM: стили виджета не конфликтуют с CSS сайта. */
function createShadowHost(parent: HTMLElement): HTMLElement {
  const host = document.createElement('div');
  parent.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = css;
  shadow.appendChild(style);
  const root = document.createElement('div');
  root.className = 'kv-root';
  shadow.appendChild(root);
  return root;
}

function IconChat() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.9 8.9 0 0 1-3.5-.7L3 21l1.8-4.4A8.1 8.1 0 0 1 3 11.5a8.4 8.4 0 0 1 9-8.4 8.4 8.4 0 0 1 9 8.4z" />
    </svg>
  );
}

/** Режим popup: плавающая кнопка → модальное окно с квизом. */
function PopupRoot({ quizId, buttonText, design }: { quizId: string; buttonText: string; design?: QuizDesign }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {!open && (
        <button class="kv-launcher" onClick={() => setOpen(true)}>
          <IconChat />{buttonText}
        </button>
      )}
      {open && (
        <div class="kv-overlay" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div class="kv-modal">
            <QuizApp quizId={quizId} onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}

interface MountOptions { design?: QuizDesign }

const api = {
  /** Встроить квиз в элемент страницы. */
  mount(target: HTMLElement, quizId: string, opts: MountOptions = {}) {
    const root = createShadowHost(target);
    applyTheme(root, opts.design);
    render(<QuizApp quizId={quizId} />, root);
  },
  /** Открыть квиз попапом поверх страницы. */
  open(quizId: string, opts: MountOptions & { buttonText?: string } = {}) {
    const root = createShadowHost(document.body);
    applyTheme(root, opts.design);
    render(
      <div class="kv-overlay">
        <div class="kv-modal">
          <QuizApp quizId={quizId} onClose={() => { render(null, root); root.parentElement?.remove(); }} />
        </div>
      </div>,
      root,
    );
  },
};

declare global { interface Window { Kvalify: typeof api } }
window.Kvalify = api;

// Автоинициализация по data-атрибутам тега <script>
const script = document.currentScript as HTMLScriptElement | null;
if (script?.dataset.quizId) {
  const quizId = script.dataset.quizId;
  const mode = script.dataset.mode ?? 'inline';
  const apiBase = script.dataset.api ?? new URL(script.src, location.href).origin;
  setApiBase(apiBase);

  const boot = () => {
    if (mode === 'popup') {
      const root = createShadowHost(document.body);
      render(
        <PopupRoot quizId={quizId} buttonText={script.dataset.buttonText ?? 'Пройти квиз'} />,
        root,
      );
    } else if (mode === 'button') {
      // Открытие по клику на любой элемент с data-kvalify-open
      document.addEventListener('click', (e) => {
        const el = (e.target as HTMLElement).closest('[data-kvalify-open]');
        if (el) { e.preventDefault(); api.open(quizId); }
      });
    } else {
      const target = script.dataset.target
        ? document.querySelector<HTMLElement>(script.dataset.target)
        : script.parentElement;
      if (target) api.mount(target, quizId);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
} else if (script) {
  setApiBase(new URL(script.src, location.href).origin);
}
