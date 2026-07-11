import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clearToken } from '../api';

const nav = [
  { to: '/', label: 'Квизы', icon: '⚡' },
  { to: '/leads', label: 'Лиды', icon: '🎯' },
];

function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-fuchsia-500 text-lg font-black text-white shadow-lg shadow-brand-600/40">
        К
      </span>
      <span className={`text-lg font-extrabold tracking-tight ${light ? 'text-white' : 'text-slate-900'}`}>
        Квалифай
      </span>
    </Link>
  );
}

function NavItems({ onClick }: { onClick?: () => void }) {
  return (
    <>
      {nav.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          onClick={onClick}
          className={({ isActive }) =>
            `relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-150 ${
              isActive
                ? 'bg-white/10 text-white shadow-inner'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-brand-400 to-fuchsia-400" />
              )}
              <span className="text-base">{item.icon}</span>
              {item.label}
            </>
          )}
        </NavLink>
      ))}
    </>
  );
}

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const logout = () => { clearToken(); navigate('/auth'); };

  return (
    <div className="min-h-dvh lg:flex">
      {/* Сайдбар — десктоп (тёмный) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col overflow-hidden bg-slate-950 px-4 py-6 lg:flex">
        {/* градиентные свечения внутри сайдбара */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-brand-600/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -right-16 h-64 w-64 rounded-full bg-fuchsia-600/15 blur-3xl" />
        <div className="relative z-10 flex h-full flex-col">
          <div className="px-2"><Logo light /></div>
          <nav className="mt-9 flex flex-col gap-1.5">
            <NavItems />
          </nav>
          <div className="mt-auto">
            <div className="mb-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs font-extrabold text-white">Бесплатный тариф</div>
              <p className="mt-0.5 text-[11px] leading-snug text-slate-400">1 квиз · 20 лидов в месяц</p>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <span className="block h-full w-1/5 rounded-full bg-gradient-to-r from-brand-400 to-fuchsia-400" />
              </div>
            </div>
            <button onClick={logout}
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 transition-colors hover:bg-white/5 hover:text-white">
              <span>↩</span> Выйти
            </button>
          </div>
        </div>
      </aside>

      {/* Шапка — мобильные (тёмная) */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-slate-950/90 px-4 py-3 backdrop-blur-lg lg:hidden">
        <Logo light />
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Меню"
          className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl text-xl text-white transition-colors hover:bg-white/10"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* Мобильное меню */}
      {menuOpen && (
        <div className="fixed inset-0 z-20 bg-slate-950/50 backdrop-blur-sm lg:hidden" onClick={() => setMenuOpen(false)}>
          <nav className="anim-rise mx-3 mt-[68px] flex flex-col gap-1.5 rounded-2xl border border-white/10 bg-slate-950 p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <NavItems onClick={() => setMenuOpen(false)} />
            <button onClick={logout}
              className="flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold text-slate-500 hover:bg-white/5 hover:text-white">
              <span>↩</span> Выйти
            </button>
          </nav>
        </div>
      )}

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:ml-64 lg:px-10 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}
