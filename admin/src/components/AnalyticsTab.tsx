import { useEffect, useState } from 'react';
import { api, ApiError } from '../api';
import type { Analytics, FunnelAnalysis } from '../types';
import { Button, Icon, icons, Spinner, useToast } from '../ui';

function Stat({ value, label, accent }: { value: string | number; label: string; accent?: boolean }) {
  return (
    <div className="rounded-[16px] border border-line bg-surface p-5">
      <div className={`text-[28px] font-extrabold leading-none ${accent ? 'text-danger' : 'text-ink'}`}>{value}</div>
      <div className="mt-2 text-[13px] font-bold text-muted">{label}</div>
    </div>
  );
}

const severityStyle: Record<string, string> = {
  high: 'bg-red-50 text-danger', med: 'bg-[oklch(0.96_0.05_70)] text-[oklch(0.52_0.14_65)]', low: 'bg-line-2 text-muted',
};
const severityLabel: Record<string, string> = { high: 'важно', med: 'средне', low: 'мелочь' };

export function AnalyticsTab({ quizId }: { quizId: string }) {
  const [data, setData] = useState<Analytics | null>(null);
  const [days, setDays] = useState(30);
  const [ai, setAi] = useState<FunnelAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setData(null);
    api.analytics(quizId, days).then(setData).catch(() => setData(null));
  }, [quizId, days]);

  const analyze = async () => {
    setAnalyzing(true);
    try { setAi(await api.analyze(quizId)); }
    catch (err) { toast(err instanceof ApiError ? err.message : 'Не удалось проанализировать', 'err'); }
    finally { setAnalyzing(false); }
  };

  if (!data) return <div className="flex justify-center py-24 text-primary"><Spinner className="h-8 w-8" /></div>;

  const top = data.funnel[0]?.count || 1;
  const empty = data.totals.views === 0 && data.totals.starts === 0;

  return (
    <div className="anim-fade flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-[11px] bg-canvas p-1 text-sm font-bold">
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => setDays(d)}
              className={`cursor-pointer rounded-[8px] px-3.5 py-1.5 transition-all ${days === d ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink-2'}`}>
              {d} дней
            </button>
          ))}
        </div>
      </div>

      {empty ? (
        <div className="rounded-[16px] border border-dashed border-line bg-surface px-6 py-14 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-[16px] bg-primary-tint text-primary"><Icon path={icons.chart} size={24} /></div>
          <h3 className="mb-1 text-lg font-extrabold">Пока нет данных</h3>
          <p className="mx-auto max-w-sm text-sm text-muted">Опубликуйте квиз и разместите его на сайте — воронка и конверсия появятся здесь, как только пойдут посетители.</p>
        </div>
      ) : (
        <>
          {/* Сводка */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat value={data.conversion + '%'} label="конверсия старт → лид" />
            <Stat value={data.view_to_lead + '%'} label="просмотр → лид" />
            <Stat value={data.avg_score ?? '—'} label="средний скоринг" />
            <Stat value={data.hot_leads} label="горячих лидов" accent />
          </div>

          {/* Воронка */}
          <div className="rounded-[16px] border border-line bg-surface p-6">
            <h3 className="mb-4 text-sm font-extrabold">Воронка по шагам</h3>
            <div className="flex flex-col gap-2.5">
              {data.funnel.map((f, i) => {
                const pct = Math.round((f.count / top) * 100);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-40 flex-none truncate text-[13px] font-bold text-ink-2" title={f.label}>{f.label}</div>
                    <div className="relative h-8 flex-1 overflow-hidden rounded-[8px] bg-canvas">
                      <div className="flex h-full items-center rounded-[8px] grad px-3 text-[12px] font-extrabold text-white transition-all"
                        style={{ width: `${Math.max(pct, 6)}%` }}>{f.count}</div>
                    </div>
                    <div className="w-16 flex-none text-right text-[12px] font-bold">
                      {i > 0 && f.drop_rate > 0 ? <span className="text-danger">−{f.drop_rate}%</span> : <span className="text-muted">—</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Источники */}
          {data.top_utm.length > 0 && (
            <div className="rounded-[16px] border border-line bg-surface p-6">
              <h3 className="mb-4 text-sm font-extrabold">Источники трафика</h3>
              <div className="flex flex-col gap-1">
                <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-line-2 pb-2 text-[11px] font-extrabold uppercase tracking-widest text-muted">
                  <span>UTM-источник</span><span className="text-right">Сессий</span><span className="text-right">Лидов</span>
                </div>
                {data.top_utm.map((u) => (
                  <div key={u.source} className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-line-2 py-2.5 text-sm last:border-0">
                    <span className="truncate font-bold text-ink">{u.source}</span>
                    <span className="w-16 text-right text-ink-2">{u.sessions}</span>
                    <span className="w-16 text-right font-bold text-primary">{u.leads}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ИИ-аналитик */}
      <div className="rounded-[16px] border border-primary-tint-2 bg-primary-tint/40 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-[11px] grad text-white"><Icon path={icons.spark} size={18} /></span>
            <div>
              <div className="font-extrabold">Советы ИИ</div>
              <p className="text-[13px] text-muted">Проанализирует воронку и предложит, что улучшить.</p>
            </div>
          </div>
          <Button disabled={analyzing || empty} onClick={analyze}>
            {analyzing ? <><Spinner /> Анализирую…</> : 'Проанализировать воронку'}
          </Button>
        </div>

        {ai && (
          <div className="mt-5 flex flex-col gap-3">
            {ai.insights.map((it, i) => (
              <div key={i} className="rounded-[12px] border border-line bg-surface p-4">
                <div className="mb-1 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${severityStyle[it.severity]}`}>{severityLabel[it.severity]}</span>
                  <span className="font-extrabold text-ink">{it.finding}</span>
                </div>
                <p className="text-[13px] text-muted">{it.evidence}</p>
              </div>
            ))}
            {ai.experiments.length > 0 && (
              <div className="rounded-[12px] border border-line bg-surface p-4">
                <div className="mb-2 text-[11px] font-extrabold uppercase tracking-widest text-primary">Что протестировать</div>
                <div className="flex flex-col gap-3">
                  {ai.experiments.map((e, i) => (
                    <div key={i}>
                      <div className="text-sm font-bold text-ink">{e.hypothesis}</div>
                      <p className="mt-0.5 text-[13px] text-muted">{e.change}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
