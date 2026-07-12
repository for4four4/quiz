import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import type { Lead, QuizListItem } from '../types';
import { Button, Empty, Icon, icons, ModeChip, Spinner, StatusChip } from '../ui';

function StatCard({ value, label, danger, delay }: { value: string | number; label: string; danger?: boolean; delay: number }) {
  return (
    <div className={`anim-rise-${delay} rounded-[16px] border border-line bg-surface p-5`}>
      <div className={`text-[32px] font-extrabold leading-none ${danger ? 'text-danger' : 'text-ink'}`}>{value}</div>
      <div className="mt-2 text-[13px] font-bold text-muted">{label}</div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return 'сегодня';
  if (days === 1) return 'вчера';
  if (days < 5) return `${days} дня назад`;
  if (days < 30) return `${days} дней назад`;
  return new Date(iso).toLocaleDateString('ru-RU');
}

export function DashboardPage() {
  const [quizzes, setQuizzes] = useState<QuizListItem[] | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    api.quizzes().then(setQuizzes).catch(() => setQuizzes([]));
    api.leads({ includeJunk: true }).then(setLeads).catch(() => {});
  }, []);

  const published = quizzes?.filter((q) => q.status === 'published').length ?? 0;
  const hot = leads.filter((l) => l.segment === 'hot').length;

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight">Мои квизы</h1>
          <p className="mt-1 text-[15px] text-muted">Управляйте квизами и следите за потоком лидов</p>
        </div>
        <Link to="/new"><Button><Icon path={icons.plus} size={16} /> Создать квиз</Button></Link>
      </div>

      {/* Статистика */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard value={quizzes?.length ?? '—'} label="квизов" delay={1} />
        <StatCard value={published} label="опубликовано" delay={1} />
        <StatCard value={leads.length} label="лидов" delay={2} />
        <StatCard value={hot} label="горячих" danger delay={3} />
      </div>

      {quizzes === null && <div className="flex justify-center py-24 text-primary"><Spinner className="h-8 w-8" /></div>}

      {quizzes?.length === 0 && (
        <Empty icon={<Icon path={icons.grid} size={24} />} title="Пока нет ни одного квиза"
          text="Опишите свой бизнес — ИИ соберёт квиз с умными вопросами примерно за 15 секунд."
          action={<Link to="/new"><Button>Создать первый квиз</Button></Link>} />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {quizzes?.map((quiz, i) => {
          const qLeads = leads.filter((l) => l.quiz_id === quiz.id);
          const qHot = qLeads.filter((l) => l.segment === 'hot').length;
          return (
            <Link key={quiz.id} to={`/quizzes/${quiz.id}`}
              className={`anim-rise-${Math.min(i + 1, 3)} group rounded-[16px] border border-line bg-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-tint-2 hover:shadow-card`}>
              <div className="mb-3 flex items-start justify-between gap-3">
                <StatusChip status={quiz.status} />
                <ModeChip mode={quiz.mode} />
              </div>
              <h3 className="text-lg font-extrabold leading-snug text-ink group-hover:text-primary">{quiz.title}</h3>
              <p className="mt-1 text-[13px] text-muted">
                {quiz.mode === 'adaptive' ? 'ИИ' : 'Статичный'} · обновлён {timeAgo(quiz.updated_at)}
              </p>
              <div className="mt-4 flex items-center gap-5 border-t border-line-2 pt-4 text-sm">
                <span><b className="font-extrabold text-ink">{qLeads.length}</b> <span className="text-muted">лидов</span></span>
                <span><b className="font-extrabold text-danger">{qHot}</b> <span className="text-muted">горячих</span></span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
