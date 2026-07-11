import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError, setToken } from '../api';
import { Button, Field, inputCls, Spinner } from '../ui';

const perks = [
  ['⚡', 'Квиз за 60 секунд', 'Опишите бизнес — ИИ соберёт квиз сам'],
  ['🧠', 'Умные вопросы', 'Следующий вопрос подстраивается под ответы'],
  ['🎯', 'Скоринг лидов', 'Каждая заявка с оценкой 0–100 и резюме для продаж'],
  ['🛡️', 'Антифрод', 'Мусорные заявки не тарифицируются'],
] as const;

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const res = mode === 'register'
        ? await api.register(email, password)
        : await api.login(email, password);
      setToken(res.token);
      navigate(mode === 'register' ? '/new' : '/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Что-то пошло не так, попробуйте ещё раз');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/* Промо-панель */}
      <div className="hero-gradient relative flex flex-col justify-center overflow-hidden px-8 py-10 text-white lg:w-[46%] lg:px-14">
        <div className="relative z-10 mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:mb-12">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 text-xl font-black backdrop-blur">К</span>
            <span className="text-xl font-extrabold tracking-tight">Квалифай</span>
          </div>
          <h1 className="mb-3 text-3xl font-extrabold leading-tight lg:text-5xl">
            Квиз, который{' '}
            <span className="relative inline-block">
              думает
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 120 10" fill="none" preserveAspectRatio="none">
                <path d="M2 7c25-6 70-6 116-2" stroke="rgba(255,255,255,.6)" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <p className="mb-8 text-sm text-white/75 lg:text-base">
            Опишите бизнес — ИИ соберёт квиз, задаст умные вопросы и оценит каждый лид.
          </p>
          <div className="hidden gap-4 lg:grid">
            {perks.map(([icon, title, text], i) => (
              <div key={title} className={`anim-rise-${i} flex items-start gap-3.5 rounded-2xl bg-white/10 p-4 backdrop-blur transition-transform hover:translate-x-1`}>
                <span className="text-2xl">{icon}</span>
                <div>
                  <div className="text-sm font-extrabold">{title}</div>
                  <div className="text-xs text-white/70">{text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Форма */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-10 lg:px-8">
        {/* плавающие блобы на фоне формы */}
        <div className="blob pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="blob-2 pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-fuchsia-400/15 blur-3xl" />
        <form onSubmit={submit}
          className="anim-rise glass relative z-10 w-full max-w-sm rounded-3xl p-7 shadow-2xl shadow-brand-900/10 ring-1 ring-slate-900/5 sm:p-8">
          <h2 className="mb-1 text-2xl font-extrabold">
            {mode === 'register' ? 'Создать аккаунт' : 'С возвращением!'}
          </h2>
          <p className="mb-7 text-sm text-slate-500">
            {mode === 'register'
              ? 'Первый квиз будет готов через пару минут.'
              : 'Войдите, чтобы посмотреть новые лиды.'}
          </p>

          <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-900/5 p-1 text-sm font-bold">
            {(['register', 'login'] as const).map((m) => (
              <button key={m} type="button" onClick={() => { setMode(m); setError(''); }}
                className={`cursor-pointer rounded-lg py-2 transition-all ${mode === m ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-700'}`}>
                {m === 'register' ? 'Регистрация' : 'Вход'}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <Field label="Email">
              <input className={inputCls} type="email" required autoComplete="email"
                placeholder="you@company.ru" value={email}
                onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Пароль" hint={mode === 'register' ? 'Минимум 8 символов' : undefined}>
              <input className={inputCls} type="password" required minLength={8}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)} />
            </Field>
          </div>

          {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p>}

          <Button type="submit" disabled={busy} className="mt-6 w-full py-3">
            {busy ? <Spinner /> : mode === 'register' ? 'Начать бесплатно' : 'Войти'}
          </Button>

          {mode === 'register' && (
            <p className="mt-4 text-center text-xs text-slate-400">
              Бесплатный тариф: 1 квиз и 20 лидов в месяц. Без карты.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
