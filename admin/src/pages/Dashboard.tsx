import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import type { Lead, QuizListItem } from '../types';
import { Button, Empty, Spinner, StatusChip } from '../ui';

const modeLabels = { adaptive: '🧠 Адаптивный ИИ', static: '📋 Статичный' } as const;

const cardGradients = [
  'from-brand-500/90 to-violet-600/90',
  'from-sky-500/90 to-brand-600/90',
  'from-fuchsia-500/90 to-rose-500/90',
  'from-emerald-500/90 to-teal-600/90',
];
const cardEmoji = ['⚡', '🏠', '🎯', '💬', '📦', '🚀'];

function StatTile({ value, label, accent, delay }: { value: string; label: string; accent: string; delay: number }) {
  return (
    <div className={`anim-rise-${delay} relative min-w-0 overflow-hidden rounded-2xl bg-white/10 p-3 backdrop-blur transition-transform hover:-translate-y-0.5 sm:p-4`}>
      <div className={`pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full ${accent} opacity-40 blur-2xl`} />
      <div className="text-2xl font-extrabold text-white sm:text-3xl">{value}</div>
      <div className="mt-0.5 text-[11px] font-bold leading-tight text-white/70 sm:text-xs">{label}</div>
    </div>
  );
}

export function DashboardPage() {
  const [quizzes, setQuizzes] = useState<QuizListItem[] | null>(null);
  const [leads, setLeads] = useState<Lead[] | null>(null);

  useEffect(() => {
    api.quizzes().then(setQuizzes).catch(() => setQuizzes([]));
    api.leads().then(setLeads).catch(() => setLeads([]));
  }, []);

  const hot = leads?.filter((l) => l.segment === 'hot').length ?? 0;
  const published = quizzes?.filter((q) => q.status === 'published').length ?? 0;

  return (
    <div className="mx-auto max-w-5xl">
      {/* Хиро-блок со статистикой */}
      <div className="hero-gradient anim-rise relative mb-8 overflow-hidden rounded-3xl p-6 shadow-2xl shadow-brand-900/25 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white sm:text-3xl">Мои квизы</h1>
              <p className="mt-1 text-sm font-medium text-white/70">
                Опишите бизнес — ИИ соберёт квиз, оценит каждый лид и напишет резюме для продаж
              </p>
            </div>
            <Link to="/new">
              <button className="btn-shine cursor-pointer rounded-xl bg-white px-6 py-3 text-sm font-extrabold text-brand-700 shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-2xl active:scale-[.98]">
                ✨ Создать квиз с ИИ
              </button>
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:max-w-md">
            <StatTile value={String(quizzes?.length ?? '—')} label="квизов" accent="bg-sky-300" delay={1} />
            <StatTile value={String(published)} label="опубликовано" accent="bg-emerald-300" delay={2} />
            <StatTile value={hot > 0 ? `🔥 ${hot}` : String(leads?.length ?? '—')} label={hot > 0 ? 'горячих лидов' : 'лидов'} accent="bg-amber-300" delay={3} />
          </div>
        </div>
      </div>

      {quizzes === null && (
        <div className="flex justify-center py-24 text-brand-500"><Spinner className="h-8 w-8" /></div>
      )}

      {quizzes?.length === 0 && (
        <Empty
          icon="⚡"
          title="Пока нет ни одного квиза"
          text="Опишите свой бизнес — ИИ соберёт квиз с умными вопросами примерно за 15 секунд."
          action={<Link to="/new"><Button>✨ Создать первый квиз</Button></Link>}
        />
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        {quizzes?.map((quiz, i) => (
          <Link
            key={quiz.id}
            to={`/quizzes/${quiz.id}`}
            className={`anim-rise-${Math.min(i, 3)} group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-900/5 transition-all duration-200 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-brand-600/15 hover:ring-brand-300`}
          >
            {/* градиентная шапка карточки */}
            <div className={`relative flex h-24 items-center justify-center bg-gradient-to-br ${cardGradients[i % cardGradients.length]}`}>
              <span className="text-4xl drop-shadow-lg transition-transform duration-200 group-hover:scale-125 group-hover:-rotate-6">
                {cardEmoji[i % cardEmoji.length]}
              </span>
              <div className="absolute right-3 top-3"><StatusChip status={quiz.status} /></div>
              {/* декоративные окружности */}
              <div className="pointer-events-none absolute -left-8 -bottom-10 h-24 w-24 rounded-full border-4 border-white/15" />
              <div className="pointer-events-none absolute right-10 -bottom-6 h-14 w-14 rounded-full border-4 border-white/10" />
            </div>
            <div className="p-5">
              <h3 className="line-clamp-2 font-extrabold leading-snug text-slate-900 group-hover:text-brand-700">
                {quiz.title}
              </h3>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-400">
                <span className="rounded-full bg-slate-100 px-2.5 py-1">{modeLabels[quiz.mode]}</span>
                <span className="flex items-center gap-1.5">
                  {new Date(quiz.updated_at).toLocaleDateString('ru-RU')}
                  <span className="text-slate-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-brand-500">→</span>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
