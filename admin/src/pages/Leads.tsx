import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Lead, QuizListItem, TranscriptItem } from '../types';
import { Drawer, Empty, ScoreRing, SegmentBadge, Spinner, inputCls } from '../ui';

const fraudLabels: Record<string, string> = {
  invalid_phone: 'невалидный телефон',
  disposable_email: 'одноразовый email',
  too_fast: 'прошёл слишком быстро',
  gibberish_answers: 'бессмысленные ответы',
  repeat_ip: 'повтор IP',
};

export function LeadsPage() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [quizId, setQuizId] = useState('');
  const [includeJunk, setIncludeJunk] = useState(false);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [transcript, setTranscript] = useState<TranscriptItem[] | null>(null);

  useEffect(() => {
    api.quizzes().then(setQuizzes).catch(() => {});
  }, []);

  useEffect(() => {
    setLeads(null);
    api.leads({ quizId: quizId || undefined, includeJunk })
      .then(setLeads)
      .catch(() => setLeads([]));
  }, [quizId, includeJunk]);

  const openLead = (lead: Lead) => {
    setSelected(lead);
    setTranscript(null);
    api.transcript(lead.id).then((r) => setTranscript(r.transcript)).catch(() => setTranscript([]));
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Лиды</h1>
          <p className="mt-0.5 text-sm text-slate-500">Каждая заявка — со скорингом и резюме от ИИ</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select className={`${inputCls} w-auto cursor-pointer`} value={quizId} onChange={(e) => setQuizId(e.target.value)}>
            <option value="">Все квизы</option>
            {quizzes.map((q) => <option key={q.id} value={q.id}>{q.title}</option>)}
          </select>
          <label className="flex cursor-pointer select-none items-center gap-2 text-sm font-bold text-slate-500">
            <input type="checkbox" className="h-4 w-4 cursor-pointer accent-brand-600"
              checked={includeJunk} onChange={(e) => setIncludeJunk(e.target.checked)} />
            показать отсеянные
          </label>
        </div>
      </div>

      {leads === null && (
        <div className="flex justify-center py-24 text-brand-500"><Spinner className="h-8 w-8" /></div>
      )}

      {leads?.length === 0 && (
        <Empty icon="🎯" title="Лидов пока нет"
          text="Опубликуйте квиз и разместите его на сайте — заявки появятся здесь со скорингом и резюме для продаж." />
      )}

      {!!leads?.length && (
        <div className="flex flex-col gap-3">
          {leads.map((lead, i) => (
            <button key={lead.id} onClick={() => openLead(lead)}
              className={`anim-rise-${Math.min(i, 3)} group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg hover:shadow-brand-600/8 ${!lead.billable ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-4">
                <ScoreRing score={lead.score} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-extrabold">{lead.name || 'Без имени'}</span>
                    <SegmentBadge segment={lead.segment} />
                    {!lead.billable && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-400">не тарифицируется</span>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-slate-500">
                    {lead.phone && <span>{lead.phone}</span>}
                    {lead.email && <span className="truncate">{lead.email}</span>}
                    <span className="text-slate-400">{new Date(lead.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {lead.summary && (
                    <p className="mt-1.5 line-clamp-2 text-sm text-slate-600">{lead.summary}</p>
                  )}
                </div>
                <span className="hidden text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-brand-500 sm:block">→</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Карточка лида */}
      <Drawer open={!!selected} onClose={() => setSelected(null)} title="Карточка лида">
        {selected && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <ScoreRing score={selected.score} />
              <div>
                <div className="text-lg font-extrabold">{selected.name || 'Без имени'}</div>
                <SegmentBadge segment={selected.segment} />
              </div>
            </div>

            <div className="grid gap-2 rounded-2xl bg-slate-50 p-4 text-sm">
              {selected.phone && (
                <a href={`tel:${selected.phone.replace(/[^\d+]/g, '')}`} className="font-bold text-brand-600 hover:underline">📞 {selected.phone}</a>
              )}
              {selected.email && (
                <a href={`mailto:${selected.email}`} className="font-bold text-brand-600 hover:underline">✉️ {selected.email}</a>
              )}
              <span className="text-slate-400">{new Date(selected.created_at).toLocaleString('ru-RU')}</span>
            </div>

            {selected.first_line && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="mb-1 text-xs font-bold uppercase tracking-widest text-emerald-500">С чего начать звонок</div>
                <p className="text-sm font-bold text-emerald-900">«{selected.first_line}»</p>
              </div>
            )}

            {selected.summary && (
              <div>
                <div className="mb-1.5 text-xs font-bold uppercase tracking-widest text-slate-400">Резюме для менеджера</div>
                <p className="text-sm leading-relaxed text-slate-700">{selected.summary}</p>
              </div>
            )}

            {selected.fraud_flags?.length > 0 && (
              <div>
                <div className="mb-1.5 text-xs font-bold uppercase tracking-widest text-slate-400">Флаги антифрода</div>
                <div className="flex flex-wrap gap-1.5">
                  {selected.fraud_flags.map((f) => (
                    <span key={f} className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">
                      {fraudLabels[f] ?? f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Диалог с квизом</div>
              {transcript === null && <div className="flex justify-center py-6 text-brand-500"><Spinner /></div>}
              {transcript?.length === 0 && <p className="text-sm text-slate-400">Транскрипт пуст</p>}
              <div className="flex flex-col gap-3">
                {transcript?.map((t, i) => (
                  <div key={i} className="rounded-2xl border border-slate-100 p-3.5">
                    <p className="mb-1.5 text-xs font-bold text-slate-400">{t.q}</p>
                    <p className="text-sm font-bold text-slate-800">
                      {Array.isArray(t.a) ? t.a.join(', ') : String(t.a)}
                    </p>
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
