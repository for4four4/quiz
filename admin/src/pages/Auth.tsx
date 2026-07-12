import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError, setToken } from '../api';
import { BrandMark, Button, Field, Icon, icons, inputCls, Spinner } from '../ui';

const points = [
  'Квиз собирается из текста за 15 секунд',
  'Каждый лид оценён и с резюме для продаж',
  'Мусорные заявки не тарифицируются',
];

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
      const res = mode === 'register' ? await api.register(email, password) : await api.login(email, password);
      setToken(res.token);
      navigate(mode === 'register' ? '/new' : '/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Что-то пошло не так, попробуйте ещё раз');
    } finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/* Промо-зона */}
      <div className="relative flex flex-col justify-between overflow-hidden px-8 py-10 text-white lg:w-[46%] lg:px-14 lg:py-12"
        style={{ background: 'linear-gradient(150deg, oklch(0.42 0.19 274), oklch(0.5 0.2 290) 55%, oklch(0.46 0.2 300))' }}>
        <div className="flex items-center gap-2.5">
          <BrandMark size={24} />
          <span className="text-xl font-extrabold tracking-tight">Квалифай</span>
        </div>
        <div className="relative z-10 my-10 max-w-md">
          <div className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/60">Умные квизы на ИИ</div>
          <h1 className="mb-4 text-3xl font-extrabold leading-[1.1] lg:text-[40px]">
            Опишите бизнес — ИИ соберёт квиз и оценит каждый лид
          </h1>
          <p className="mb-8 text-[15px] leading-relaxed text-white/75">
            Никакой ручной сборки воронок. ИИ подбирает вопросы под ответы посетителя, ставит оценку 0–100 и пишет резюме для отдела продаж. За мусорные заявки вы не платите.
          </p>
          <div className="flex flex-col gap-3">
            {points.map((p) => (
              <div key={p} className="flex items-center gap-3 text-[15px] font-bold">
                <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-white/15"><Icon path={icons.check} size={13} sw={3} /></span>
                {p}
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-8 border-t border-white/15 pt-6 text-sm text-white/70">
          <div><b className="block text-2xl font-extrabold text-white">3×</b>конверсия против форм</div>
          <div><b className="block text-2xl font-extrabold text-white">−40%</b>мусорных заявок</div>
        </div>
      </div>

      {/* Форма */}
      <div className="flex flex-1 items-center justify-center bg-canvas px-4 py-10 lg:px-8">
        <form onSubmit={submit} className="anim-rise w-full max-w-sm rounded-[22px] border border-line bg-surface p-7 shadow-card sm:p-8">
          <div className="mb-6 grid grid-cols-2 rounded-[11px] bg-canvas p-1 text-sm font-bold">
            {(['login', 'register'] as const).map((m) => (
              <button key={m} type="button" onClick={() => { setMode(m); setError(''); }}
                className={`cursor-pointer rounded-[8px] py-2 transition-all ${mode === m ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink-2'}`}>
                {m === 'login' ? 'Вход' : 'Регистрация'}
              </button>
            ))}
          </div>
          <h2 className="mb-6 text-2xl font-extrabold">{mode === 'register' ? 'Создайте аккаунт' : 'С возвращением'}</h2>

          <div className="flex flex-col gap-4">
            <Field label="E-mail">
              <input className={inputCls} type="email" required autoComplete="email"
                placeholder="you@company.ru" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Пароль" hint={mode === 'register' ? 'Минимум 8 символов' : undefined}>
              <input className={inputCls} type="password" required minLength={8}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
          </div>

          {error && <p className="mt-4 rounded-[11px] bg-red-50 px-4 py-3 text-sm font-bold text-danger">{error}</p>}

          <Button type="submit" disabled={busy} className="mt-6 w-full py-3">
            {busy ? <Spinner /> : mode === 'register' ? 'Начать бесплатно' : 'Войти'}
          </Button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line" />или<span className="h-px flex-1 bg-line" />
          </div>
          <Button type="button" variant="secondary" className="w-full py-3" onClick={() => setError('Вход через Яндекс ID появится позже')}>
            Продолжить с Яндекс ID
          </Button>
        </form>
      </div>
    </div>
  );
}
