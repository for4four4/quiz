import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import type { QuizListItem } from '../types';
import { Button, Empty, Spinner, StatusChip } from '../ui';

const modeLabels = { adaptive: '🧠 Адаптивный ИИ', static: '📋 Статичный' } as const;

export function DashboardPage() {
  const [quizzes, setQuizzes] = useState<QuizListItem[] | null>(null);

  useEffect(() => {
    api.quizzes().then(setQuizzes).catch(() => setQuizzes([]));
  }, []);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Мои квизы</h1>
          <p className="mt-0.5 text-sm text-slate-500">Создавайте, публикуйте и следите за конверсией</p>
        </div>
        <Link to="/new">
          <Button>✨ Создать квиз с ИИ</Button>
        </Link>
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

      <div className="grid gap-4 sm:grid-cols-2">
        {quizzes?.map((quiz, i) => (
          <Link
            key={quiz.id}
            to={`/quizzes/${quiz.id}`}
            className={`anim-rise-${Math.min(i, 3)} group rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl hover:shadow-brand-600/10`}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h3 className="line-clamp-2 font-extrabold leading-snug text-slate-900 group-hover:text-brand-700">
                {quiz.title}
              </h3>
              <StatusChip status={quiz.status} />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400">
              <span className="rounded-full bg-slate-100 px-2.5 py-1">{modeLabels[quiz.mode]}</span>
              <span>обновлён {new Date(quiz.updated_at).toLocaleDateString('ru-RU')}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
