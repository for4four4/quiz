import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Lead, QuizListItem, TranscriptItem } from '../types';
import { Drawer, Empty, Icon, icons, inputCls, ScoreRing, SegmentBadge, Spinner } from '../ui';

const fraudLabels: Record<string, string> = {
  invalid_phone: 'невалидный телефон', disposable_email: 'одноразовый email',
  too_fast: 'прошёл слишком быстро', gibberish_answers: 'бессмысленные ответы', repeat_ip: 'повтор IP',
};

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'только что';
  if (m < 60) return `${m} мин назад`;
  if (m < 1440) return `${Math.floor(m / 60)} ч назад`;
  if (m < 2880) return 'вчера';
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export function LeadsPage() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [quizId, setQuizId] = useState('');
  const [includeJunk, setIncludeJunk] = useState(false);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [transcript, setTranscript] = useState<TranscriptItem[] | null>(null);

  useEffect(() => { api.quizzes().then(setQuizzes).catch(() => {}); }, []);
  useEffect(() => {
    setLeads(null);
    api.leads({ quizId: quizId || undefined, includeJunk }).then(setLeads).catch(() => setLeads([]));
  }, [quizId, includeJunk]);

  const openLead = (lead: Lead) => {
    setSelected(lead); setTranscript(null);
    api.transcript(lead.id).then((r) => setTranscript(r.transcript)).catch(() => setTranscript([]));
  };

  const hot = leads?.filter((l) => l.segment === 'hot').length ?? 0;

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-6">
        <h1 className="text-[28px] font-extrabold tracking-tight">Лиды</h1>
        <p className="mt-1 text-[15px] text-muted">
          {leads ? `${leads.length} заявок · ${hot} горячих за 30 дней` : 'Каждая заявка — со скорингом и резюме от ИИ'}
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <select className={`${inputCls} w-auto cursor-pointer appearance-none pr-9 font-bold`} value={quizId} onChange={(e) => setQuizId(e.target.value)}>
            <option value="">Все квизы</option>
            {quizzes.map((q) => <option key={q.id} value={q.id}>{q.title}</option>)}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"><Icon path={icons.chevron} size={16} /></span>
        </div>
        <label className="flex cursor-pointer select-none items-center gap-2 rounded-[11px] border border-line bg-surface px-4 py-2.5 text-sm font-bold text-ink-2">
          <input type="checkbox" className="h-4 w-4 cursor-pointer accent-[oklch(0.53_0.2_274)]" checked={includeJunk} onChange={(e) => setIncludeJunk(e.target.checked)} />
          Показать отсеянные
        </label>
      </div>

      {leads === null && <div className="flex justify-center py-24 text-primary"><Spinner className="h-8 w-8" /></div>}
      {leads?.length === 0 && (
        <Empty icon={<Icon path={icons.inbox} size={24} />} title="Лидов пока нет"
          text="Опубликуйте квиз и разместите его на сайте — заявки появятся здесь со скорингом и резюме для продаж." />
      )}

      {!!leads?.length && (
        <div className="overflow-hidden rounded-[16px] border border-line bg-surface">
          <div className="hidden grid-cols-[auto_1fr_2fr_auto] gap-4 border-b border-line px-5 py-3 text-[11px] font-extrabold uppercase tracking-widest text-muted sm:grid">
            <span>Скоринг</span><span>Контакт</span><span>Резюме</span><span className="text-right">Когда</span>
          </div>
          {leads.map((lead) => (
            <button key={lead.id} onClick={() => openLead(lead)}
              className={`grid w-full grid-cols-[auto_1fr] items-center gap-4 border-b border-line-2 px-5 py-4 text-left transition-colors last:border-0 hover:bg-canvas sm:grid-cols-[auto_1fr_2fr_auto] ${!lead.billable ? 'opacity-70' : ''}`}>
              <div className="flex items-center gap-3">
                <ScoreRing score={lead.score} segment={lead.segment} />
                <SegmentBadge segment={lead.segment} />
              </div>
              <div className="min-w-0">
                <div className="truncate font-extrabold text-ink">{lead.name || 'Без имени'}</div>
                <div className="truncate text-[13px] text-muted">{lead.phone || lead.email || '—'}</div>
              </div>
              <p className="hidden truncate text-sm text-ink-2 sm:block">{lead.summary || <span className="text-faint">оценивается…</span>}</p>
              <span className="hidden whitespace-nowrap text-right text-[13px] text-muted sm:block">{timeAgo(lead.created_at)}</span>
            </button>
          ))}
        </div>
      )}

      <Drawer open={!!selected} onClose={() => setSelected(null)} title="Карточка лида">
        {selected && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <ScoreRing score={selected.score} segment={selected.segment} />
              <div>
                <div className="text-lg font-extrabold">{selected.name || 'Без имени'}</div>
                <SegmentBadge segment={selected.segment} />
              </div>
            </div>

            <div className="grid gap-2 rounded-[16px] bg-canvas p-4 text-sm">
              {selected.phone && <a href={`tel:${selected.phone.replace(/[^\d+]/g, '')}`} className="font-bold text-primary hover:underline">{selected.phone}</a>}
              {selected.email && <a href={`mailto:${selected.email}`} className="font-bold text-primary hover:underline">{selected.email}</a>}
              <span className="text-muted">{new Date(selected.created_at).toLocaleString('ru-RU')}</span>
            </div>

            {selected.first_line && (
              <div className="rounded-[16px] bg-primary-tint p-4">
                <div className="mb-1 text-[11px] font-extrabold uppercase tracking-widest text-primary">С чего начать звонок</div>
                <p className="text-sm font-bold text-ink">«{selected.first_line}»</p>
              </div>
            )}
            {selected.summary && (
              <div>
                <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-widest text-muted">Резюме для менеджера</div>
                <p className="text-sm leading-relaxed text-ink-2">{selected.summary}</p>
              </div>
            )}
            {selected.fraud_flags?.length > 0 && (
              <div>
                <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-widest text-muted">Флаги антифрода</div>
                <div className="flex flex-wrap gap-1.5">
                  {selected.fraud_flags.map((f) => <span key={f} className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-danger">{fraudLabels[f] ?? f}</span>)}
                </div>
              </div>
            )}
            <div>
              <div className="mb-2 text-[11px] font-extrabold uppercase tracking-widest text-muted">Диалог с квизом</div>
              {transcript === null && <div className="flex justify-center py-6 text-primary"><Spinner /></div>}
              {transcript?.length === 0 && <p className="text-sm text-muted">Транскрипт пуст</p>}
              <div className="flex flex-col gap-3">
                {transcript?.map((t, i) => (
                  <div key={i} className="rounded-[16px] border border-line-2 p-3.5">
                    <p className="mb-1.5 text-[13px] font-bold text-muted">{t.q}</p>
                    <p className="text-sm font-bold text-ink">{Array.isArray(t.a) ? t.a.join(', ') : String(t.a)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
