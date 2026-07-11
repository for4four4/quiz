import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clearToken } from '../api';

const nav = [
  { to: '/', label: 'Квизы', icon: '⚡' },
  { to: '/leads', label: 'Лиды', icon: '🎯' },
];

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-violet-600 text-lg font-black text-white shadow-lg shadow-brand-600/30">
        К
      </span>
      <span className="text-lg font-extrabold tracking-tight">Квалифай</span>
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
            `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
              isActive
                ? 'bg-brand-50 text-brand-700 shadow-sm'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`
          }
        >
          <span className="text-base">{item.icon}</span>
          {item.label}
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
      {/* Сайдбар — десктоп */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-slate-200 bg-white px-4 py-6 lg:flex">
        <div className="px-2"><Logo /></div>
        <nav className="mt-8 flex flex-col gap-1">
          <NavItems />
        </nav>
        <div className="mt-auto">
          <button onClick={logout}
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
            <span>↩</span> Выйти
          </button>
        </div>
      </aside>

      {/* Шапка — мобильные */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/85 px-4 py-3 backdrop-blur-lg lg:hidden">
        <Logo />
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Меню"
          className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl text-xl transition-colors hover:bg-slate-100"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* Мобильное меню */}
      {menuOpen && (
        <div className="fixed inset-0 z-20 bg-slate-900/30 backdrop-blur-sm lg:hidden" onClick={() => setMenuOpen(false)}>
          <nav className="anim-rise mx-3 mt-[68px] flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <NavItems onClick={() => setMenuOpen(false)} />
            <button onClick={logout}
              className="flex cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-bold text-slate-400 hover:bg-slate-100">
              <span>↩</span> Выйти
            </button>
          </nav>
        </div>
      )}

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:ml-60 lg:px-10 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}
