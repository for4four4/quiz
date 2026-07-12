import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { api, clearToken } from '../api';
import { BrandMark, Button, Icon, icons } from '../ui';

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5 px-1">
      <BrandMark size={22} />
      <span className="text-[17px] font-extrabold tracking-tight text-ink">Квалифай</span>
    </Link>
  );
}

function NavItems({ leadCount, onClick }: { leadCount: number; onClick?: () => void }) {
  const items = [
    { to: '/', label: 'Мои квизы', icon: icons.grid, end: true, badge: 0 },
    { to: '/leads', label: 'Лиды', icon: icons.inbox, end: false, badge: leadCount },
  ];
  return (
    <>
      {items.map((it) => (
        <NavLink key={it.to} to={it.to} end={it.end} onClick={onClick}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-[11px] px-3.5 py-2.5 text-sm font-bold transition-all ${
              isActive ? 'bg-primary-tint text-primary' : 'text-ink-2 hover:bg-line-2'
            }`}>
          <Icon path={it.icon} size={18} />
          <span className="flex-1">{it.label}</span>
          {it.badge > 0 && (
            <span className="rounded-full bg-primary-tint-2 px-2 py-0.5 text-[11px] font-extrabold text-primary">{it.badge}</span>
          )}
        </NavLink>
      ))}
    </>
  );
}

function UserCard() {
  return (
    <div className="flex items-center gap-3 border-t border-line px-1 pt-4">
      <span className="grid h-9 w-9 flex-none place-items-center rounded-full grad text-xs font-extrabold text-white">АК</span>
      <div className="min-w-0">
        <div className="truncate text-sm font-extrabold text-ink">Мой проект</div>
        <div className="text-xs text-muted">Тариф Free</div>
      </div>
    </div>
  );
}

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [leadCount, setLeadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    api.leads().then((l) => setLeadCount(l.length)).catch(() => {});
  }, []);

  return (
    <div className="min-h-dvh lg:flex">
      {/* Сайдбар — десктоп */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[244px] flex-col border-r border-line bg-surface px-4 py-6 lg:flex">
        <Brand />
        <nav className="mt-8 flex flex-col gap-1">
          <NavItems leadCount={leadCount} />
        </nav>
        <Link to="/new" className="mt-4">
          <Button className="w-full">
            <Icon path={icons.plus} size={16} /> Создать квиз
          </Button>
        </Link>
        <div className="mt-auto"><UserCard /></div>
      </aside>

      {/* Шапка — мобильные */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface/90 px-4 py-3 backdrop-blur-lg lg:hidden">
        <Brand />
        <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Меню"
          className="grid h-10 w-10 cursor-pointer place-items-center rounded-[11px] text-xl transition-colors hover:bg-line-2">
          {menuOpen ? '✕' : '☰'}
        </button>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-20 bg-ink/30 backdrop-blur-sm lg:hidden" onClick={() => setMenuOpen(false)}>
          <nav className="anim-rise mx-3 mt-[68px] flex flex-col gap-1 rounded-[16px] border border-line bg-surface p-3 shadow-card"
            onClick={(e) => e.stopPropagation()}>
            <NavItems leadCount={leadCount} onClick={() => setMenuOpen(false)} />
            <Link to="/new" onClick={() => setMenuOpen(false)} className="mt-1">
              <Button className="w-full"><Icon path={icons.plus} size={16} /> Создать квиз</Button>
            </Link>
            <button onClick={() => { clearToken(); navigate('/auth'); }}
              className="mt-1 flex items-center gap-3 rounded-[11px] px-3.5 py-2.5 text-left text-sm font-bold text-muted hover:bg-line-2">
              <Icon path={icons.logout} size={18} /> Выйти
            </button>
          </nav>
        </div>
      )}

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:ml-[244px] lg:px-10 lg:py-9">
        <Outlet />
      </main>
    </div>
  );
}
