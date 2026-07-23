"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { routes } from "@/lib/nav";
import { api, type Integration, type Lead, type Me, type Quiz, type Stats } from "@/lib/client/api";
import { columns, integDefs, integList, navDef, heat as heatMap } from "./data";

const INTEG_KINDS = ["amocrm", "bitrix24", "telegram", "max", "vk", "webhook", "metrika", "calltracking"];
const STATUS_ORDER = ["new", "work", "done", "rejected"];
const GOAL_OPTS = ["Заявки и лиды", "Расчёт стоимости", "Подбор товара", "Опрос клиентов"];
const BONUS_OPTS = ["Скидка", "Подарок", "Консультация", "Без бонуса"];
const TONE_OPTS = ["Дружелюбный", "Деловой", "Экспертный"];

const SPARK = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#28559c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
  </svg>
);

function NavIcon({ d }: { d: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const widgetTitles: Record<string, string> = {
  bars: "Заявки по дням",
  funnel: "Воронка шагов",
  sources: "Источники заявок",
  hot: "Горячие лиды",
  cr: "Конверсия в заявку",
};
const wTypeDefs: [string, string, string, string][] = [
  ["bars", "▥", "Заявки по дням", "Столбчатый график за период"],
  ["funnel", "▼", "Воронка шагов", "Где люди выходят из квиза"],
  ["cr", "%", "Конверсия в заявку", "Крупная цифра с динамикой"],
  ["sources", "⇆", "Источники заявок", "Блок, кнопка или ссылка"],
  ["hot", "🔥", "Горячие лиды", "Топ по ИИ-скорингу"],
];

type Tab = "dash" | "quizzes" | "leads" | "integ" | "settings";

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const time = d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return `сегодня, ${time}`;
  if (d.toDateString() === yest.toDateString()) return `вчера, ${time}`;
  return `${d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}, ${time}`;
}

function initialsOf(me: Me | null): string {
  const base = (me?.name || me?.email || "").trim();
  const parts = base.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "К";
}

function heatOf(h: Lead["heat"]) {
  return heatMap[h] || heatMap.cold;
}

export function CabinetApp() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<Tab>("dash");
  const [menuOpen, setMenuOpen] = useState(false);

  const [widgets, setWidgets] = useState<{ t: string; q: number }[]>([
    { t: "bars", q: 0 },
    { t: "funnel", q: 1 },
  ]);
  const [wOpen, setWOpen] = useState(false);
  const [wQuiz, setWQuiz] = useState(0);
  const [wType, setWType] = useState(0);

  const [crmQuiz, setCrmQuiz] = useState<string | null>(null);
  const [crmTab, setCrmTab] = useState<"board" | "anal">("board");
  const [leadId, setLeadId] = useState<string | null>(null);
  const [leadTab, setLeadTab] = useState<"overview" | "answers" | "actions">("overview");

  const [igIdx, setIgIdx] = useState<number | null>(null);
  const [igVals, setIgVals] = useState<Record<string, string>>({});
  const [igTg, setIgTg] = useState(true);
  const [igTested, setIgTested] = useState(false);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiPhase, setAiPhase] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [aiBusiness, setAiBusiness] = useState(
    "Студия кухонь на заказ в Санкт-Петербурге. Средний чек 350 тысяч, срок изготовления 30 дней, бесплатный замер."
  );
  const [aiGoal, setAiGoal] = useState(0);
  const [aiBonus, setAiBonus] = useState(0);
  const [aiTone, setAiTone] = useState(0);
  const [aiQn, setAiQn] = useState(5);
  const [aiCalc, setAiCalc] = useState(true);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiStage, setAiStage] = useState("");
  const [aiError, setAiError] = useState("");
  const [aiQuiz, setAiQuiz] = useState<Quiz | null>(null);
  const aiTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    const [q, l, ig, st] = await Promise.all([api.quizzes(), api.leads(), api.integrations(), api.stats().catch(() => null)]);
    setQuizzes(q.quizzes);
    setLeads(l.leads);
    setIntegrations(ig.integrations);
    setStats(st);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { user } = await api.me();
        if (!user) {
          router.replace(routes.vhod);
          return;
        }
        setMe(user);
        await loadData();
      } catch {
        router.replace(routes.vhod);
        return;
      } finally {
        setLoading(false);
      }
    })();
  }, [router, loadData]);

  useEffect(() => () => { if (aiTimer.current) clearInterval(aiTimer.current); }, []);

  const runAiFlow = async () => {
    const stages = ["Изучаем нишу и аудиторию…", "Пишем вопросы и варианты…", "Собираем калькулятор и обложку…"];
    setAiPhase("busy");
    setAiError("");
    setAiProgress(8);
    setAiStage(stages[0]);
    let i = 0;
    aiTimer.current = setInterval(() => {
      i = Math.min(i + 1, stages.length - 1);
      setAiStage(stages[i]);
      setAiProgress((p) => Math.min(92, p + 12));
    }, 1200);
    try {
      const { quiz: gen } = await api.generate({
        business: aiBusiness,
        goal: GOAL_OPTS[aiGoal],
        questions: aiQn,
        bonus: BONUS_OPTS[aiBonus],
        tone: TONE_OPTS[aiTone],
        calc: aiCalc,
      });
      const { quiz: saved } = await api.createQuiz({
        name: gen.name,
        steps: gen.steps,
        design: { cover: gen.cover, contactForm: gen.contactForm, calculator: gen.calculator },
      });
      if (aiTimer.current) clearInterval(aiTimer.current);
      setAiProgress(100);
      setAiQuiz(saved);
      setAiPhase("done");
      await loadData();
    } catch (e) {
      if (aiTimer.current) clearInterval(aiTimer.current);
      setAiError(e instanceof Error ? e.message : "Не удалось сгенерировать квиз");
      setAiPhase("error");
    }
  };
  const closeAi = () => {
    if (aiTimer.current) clearInterval(aiTimer.current);
    setAiOpen(false);
    setAiPhase("idle");
    setAiQuiz(null);
  };

  const publishToggle = async (q: Quiz) => {
    const status = q.status === "active" ? "draft" : "active";
    await api.updateQuiz(q.id, { status });
    await loadData();
  };
  const removeQuiz = async (q: Quiz) => {
    if (typeof window !== "undefined" && !window.confirm(`Удалить квиз «${q.name}»? Заявки тоже удалятся.`)) return;
    await api.deleteQuiz(q.id);
    await loadData();
  };
  const changeLeadStatus = async (id: string, status: string) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    try {
      await api.setLeadStatus(id, status);
    } catch {
      await loadData();
    }
  };

  const onLogout = async () => {
    try { await api.logout(); } catch { /* ignore */ }
    router.replace(routes.vhod);
    router.refresh();
  };

  const saveIntegration = async () => {
    if (igIdx === null) return;
    const def = integDefs[igIdx];
    const config: Record<string, string> = {};
    def.fields.forEach((f) => {
      const v = igVals[`${igIdx}_${f.id}`];
      if (v) config[f.id] = v;
    });
    config.forwardAnswers = igTg ? "1" : "0";
    await api.saveIntegration(INTEG_KINDS[igIdx], config);
    await loadData();
    setIgIdx(null);
  };
  const disconnectIntegration = async (idx: number) => {
    await api.deleteIntegration(INTEG_KINDS[idx]);
    await loadData();
    setIgIdx(null);
  };

  const connected: Record<number, boolean> = {};
  integrations.forEach((it) => {
    const idx = INTEG_KINDS.indexOf(it.kind);
    if (idx >= 0 && it.enabled) connected[idx] = true;
  });

  const ld = leadId ? leads.find((l) => l.id === leadId) ?? null : null;
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#EFEFEF", color: "#6b7280", fontSize: 14, fontFamily: "-apple-system,Segoe UI,Arial,sans-serif" }}>
        Загружаем кабинет…
      </div>
    );
  }

  return (
    <div className="kc-shell" style={{ display: "flex", minHeight: "100vh", background: "#EFEFEF", color: "#111827" }}>
      {/* Mobile topbar */}
      <div className="kc-topbar" style={{ display: "none", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 50, background: "#ffffff", borderBottom: "1px solid #e9e9e9", padding: "12px 16px" }}>
        <div onClick={() => setMenuOpen((v) => !v)} style={{ width: 38, height: 38, borderRadius: 11, background: "#F5F5F5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LogoDot size={30} />
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.02em" }}><span style={{ color: "#28559c" }}>Ква</span>лифай</div>
        </div>
      </div>

      {menuOpen && <div className="kc-scrim" onClick={() => setMenuOpen(false)} style={{ display: "none", position: "fixed", inset: 0, background: "rgba(17,24,39,0.4)", zIndex: 65 }} />}

      {/* Sidebar */}
      <div className={`kc-side ${menuOpen ? "kc-open" : ""}`} style={{ width: 248, flexShrink: 0, background: "#ffffff", borderRight: "1px solid #e9e9e9", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 20px 16px" }}>
          <LogoDot size={36} />
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.02em" }}><span style={{ color: "#28559c" }}>Ква</span>лифай</div>
        </div>
        <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
          {navDef.map(([id, label, d]) => {
            const active = tab === id;
            const badge = id === "leads" && leads.length ? String(leads.filter((l) => l.status === "new").length || leads.length) : null;
            return (
              <div key={id} onClick={() => { setTab(id as Tab); setMenuOpen(false); }} className="kc-navitem" style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", borderRadius: 12, fontSize: 13.5, fontWeight: 500, cursor: "pointer", background: active ? "rgba(40,85,156,0.09)" : "transparent", color: active ? "#28559c" : "#374151", transition: "background .2s" }}>
                <span style={{ display: "flex", width: 18, height: 18, alignItems: "center", justifyContent: "center" }}><NavIcon d={d} /></span>
                <span className="kc-label">{label}</span>
                {badge && <span className="kc-label" style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, background: "#28559c", color: "#ffffff", borderRadius: 9999, padding: "2px 8px" }}>{badge}</span>}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="kc-usage" style={{ background: "#F5F5F5", borderRadius: 16, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8 }}>
              <span style={{ fontWeight: 600 }}>Тариф {planLabel(me?.plan)}</span>
              <span style={{ color: "#6b7280" }}>{leads.length} из {me?.leadLimit ?? 0}</span>
            </div>
            <div style={{ height: 6, background: "#e5e7eb", borderRadius: 9999, overflow: "hidden" }}>
              <div style={{ width: `${usagePct(leads.length, me?.leadLimit)}%`, height: "100%", background: "#28559c", borderRadius: 9999 }} />
            </div>
            <div style={{ fontSize: 11.5, color: "#6b7280", marginTop: 8 }}>{Math.max(0, (me?.leadLimit ?? 0) - leads.length)} заявок в остатке</div>
          </div>
          <div className="kc-profile" style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 4px" }}>
            <div style={{ width: 32, height: 32, borderRadius: 9999, background: "#28559c", color: "#ffffff", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{initialsOf(me)}</div>
            <div className="kc-label" style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{me?.name || "Профиль"}</div>
              <div style={{ fontSize: 11.5, color: "#9ca3af", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{me?.email}</div>
            </div>
            <div onClick={onLogout} title="Выйти" style={{ width: 28, height: 28, borderRadius: 9999, background: "#F5F5F5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="kc-main" style={{ flex: 1, minWidth: 0, padding: "28px 32px", boxSizing: "border-box" }}>
        {tab === "dash" && (
          <Dashboard
            kpis={buildKpis(stats, leads)}
            stats={stats}
            leads={leads}
            widgets={widgets}
            onOpenWidget={() => setWOpen(true)}
            onNewQuiz={() => setTab("quizzes")}
            onRemove={(i) => setWidgets((w) => w.filter((_, j) => j !== i))}
            quizNames={["Все квизы", ...quizzes.map((q) => q.name)]}
          />
        )}
        {tab === "quizzes" && (
          <QuizzesSection
            quizzes={quizzes}
            leads={leads}
            onAi={() => { setAiOpen(true); setAiPhase("idle"); }}
            onPublishToggle={publishToggle}
            onRemove={removeQuiz}
            onReload={loadData}
          />
        )}
        {tab === "leads" && (
          <LeadsSection
            quizzes={quizzes}
            leads={leads}
            stats={stats}
            crmQuiz={crmQuiz}
            setCrmQuiz={setCrmQuiz}
            crmTab={crmTab}
            setCrmTab={setCrmTab}
            openLead={(id) => { setLeadId(id); setLeadTab("overview"); }}
          />
        )}
        {tab === "integ" && <IntegSection connected={connected} onOpen={(idx) => { setIgIdx(idx); setIgTested(false); }} />}
        {tab === "settings" && <SettingsSection me={me} leads={leads} onLogout={onLogout} />}
      </div>

      {/* Lead modal */}
      {ld && (
        <div onClick={() => setLeadId(null)} style={{ position: "fixed", inset: 0, background: "rgba(17,24,39,0.45)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(12px,4vw,32px)", boxSizing: "border-box" }}>
          <div onClick={stop} style={{ width: 560, maxWidth: "100%", maxHeight: "90vh", background: "#ffffff", borderRadius: 20, overflow: "hidden", boxSizing: "border-box", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(17,24,39,0.28)" }}>
            <div style={{ padding: "22px clamp(18px,4vw,26px) 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em" }}>{ld.name || "Без имени"}</div>
                  <div style={{ fontSize: 13, color: "#6b7280", marginTop: 3 }}>{ld.phone} · {formatWhen(ld.created_at)}</div>
                </div>
                <div onClick={() => setLeadId(null)} style={closeBtn}>✕</div>
              </div>
              <div style={{ display: "flex", gap: 4, background: "#F5F5F5", borderRadius: 9999, padding: 4, marginTop: 18 }}>
                {([["overview", "Обзор"], ["answers", "Ответы"], ["actions", "Действия"]] as const).map(([key, label]) => (
                  <div key={key} onClick={() => setLeadTab(key)} style={{ flex: 1, textAlign: "center", borderRadius: 9999, padding: "8px 0", fontSize: 12.5, fontWeight: 500, cursor: "pointer", background: leadTab === key ? "#111827" : "transparent", color: leadTab === key ? "#ffffff" : "#6b7280", transition: "background .2s,color .2s" }}>{label}</div>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "20px clamp(18px,4vw,26px)", display: "flex", flexDirection: "column", gap: 18 }}>
              {leadTab === "overview" && (
                <>
                  <div style={{ background: heatOf(ld.heat).heatBg, borderRadius: 16, padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: heatOf(ld.heat).heatColor }}>{heatOf(ld.heat).heat} лид</span>
                      <span style={{ fontSize: 18, fontWeight: 700, color: heatOf(ld.heat).heatColor }}>{ld.score}<span style={{ fontSize: 11, fontWeight: 500, opacity: 0.7 }}>/100</span></span>
                    </div>
                    <div style={{ height: 6, background: "rgba(255,255,255,0.6)", borderRadius: 9999, overflow: "hidden" }}><div style={{ height: "100%", background: heatOf(ld.heat).heatColor, borderRadius: 9999, width: `${ld.score}%` }} /></div>
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>{SPARK}Обобщение ИИ</div>
                    <div style={{ fontSize: 13, lineHeight: 1.65, color: "#374151", background: "#F8F9FB", borderRadius: 14, padding: "14px 16px" }}>
                      {ld.summary || "Обобщение появится, когда подключён ИИ (POLZA_API_KEY). Заявка со скорингом уже сохранена."}
                    </div>
                  </div>
                  <div style={{ fontSize: 12.5, color: "#6b7280" }}>Квиз: <b style={{ color: "#111827" }}>{ld.quiz_name}</b> · источник: {ld.source}{ld.ip ? ` · IP ${ld.ip}` : ""}</div>
                  {ld.utm && Object.keys(ld.utm).length > 0 && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Скрытые поля (UTM / источник)</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {Object.entries(ld.utm).map(([k, v]) => (
                          <div key={k} style={{ display: "flex", gap: 10, fontSize: 12, border: "1px solid #f0f0f0", borderRadius: 10, padding: "8px 12px" }}>
                            <span style={{ color: "#9ca3af", flexShrink: 0, fontFamily: "ui-monospace,Menlo,monospace" }}>{k}</span>
                            <span style={{ color: "#111827", wordBreak: "break-all" }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              {leadTab === "answers" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {ld.answers.length === 0 && <div style={{ fontSize: 12.5, color: "#9ca3af" }}>Ответы не переданы.</div>}
                  {ld.answers.map((a, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12.5, border: "1px solid #f0f0f0", borderRadius: 12, padding: "11px 14px" }}>
                      <span style={{ color: "#6b7280", flex: 1 }}>{a.q}</span>
                      <b style={{ textAlign: "right" }}>{a.a}</b>
                    </div>
                  ))}
                </div>
              )}
              {leadTab === "actions" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontSize: 12.5, color: "#6b7280", marginBottom: 6 }}>Статус заявки</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {STATUS_ORDER.map((st, i) => (
                      <div key={st} onClick={() => changeLeadStatus(ld.id, st)} style={{ textAlign: "center", borderRadius: 12, padding: "11px 0", fontSize: 12.5, fontWeight: 500, cursor: "pointer", border: `1.5px solid ${ld.status === st ? columns[i].dot : "#e5e7eb"}`, background: ld.status === st ? "rgba(40,85,156,0.06)" : "#fff", color: ld.status === st ? "#111827" : "#374151" }}>
                        {columns[i].label}
                      </div>
                    ))}
                  </div>
                  <a href={`tel:${ld.phone}`} style={{ marginTop: 8, textAlign: "center", background: "#28559c", color: "#fff", borderRadius: 9999, padding: "11px 0", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>Позвонить {ld.phone}</a>
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "16px clamp(18px,4vw,26px)", borderTop: "1px solid #f3f4f6" }}>
              <div onClick={() => changeLeadStatus(ld.id, "work")} style={{ flex: 1, minWidth: 140, textAlign: "center", background: ld.status === "work" ? "#1e437d" : "#28559c", color: "#ffffff", borderRadius: 9999, padding: "11px 0", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>{ld.status === "work" ? "В работе" : "Взять в работу"}</div>
              <div onClick={() => changeLeadStatus(ld.id, "done")} style={{ flex: 1, minWidth: 140, textAlign: "center", border: "1px solid #e5e7eb", borderRadius: 9999, padding: "11px 0", fontSize: 13, fontWeight: 500, cursor: "pointer", boxSizing: "border-box" }}>Успешная</div>
            </div>
          </div>
        </div>
      )}

      {/* Integration modal */}
      {igIdx !== null && (
        <IntegModal
          idx={igIdx}
          vals={igVals}
          setVals={setIgVals}
          tg={igTg}
          setTg={setIgTg}
          tested={igTested}
          setTested={setIgTested}
          connected={!!connected[igIdx]}
          onSave={saveIntegration}
          onDisconnect={() => disconnectIntegration(igIdx)}
          onClose={() => setIgIdx(null)}
          stop={stop}
        />
      )}

      {/* Widget modal */}
      {wOpen && (
        <div onClick={() => setWOpen(false)} style={overlay(50)}>
          <div onClick={stop} style={{ ...modalBox, width: 480 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>Добавить виджет</div>
              <div onClick={() => setWOpen(false)} style={closeBtnSm}>✕</div>
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>Квиз</div>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 18 }}>
              {["Все квизы", ...quizzes.map((q) => q.name)].map((label, i) => (
                <Chip key={label + i} active={wQuiz === i} onClick={() => setWQuiz(i)}>{label}</Chip>
              ))}
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>Что показывать</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {wTypeDefs.map(([, icon, label, desc], i) => (
                <div key={label} onClick={() => setWType(i)} style={{ border: `1.5px solid ${wType === i ? "#28559c" : "#ececec"}`, borderRadius: 14, padding: "12px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transition: "border-color .2s" }}>
                  <span style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(40,85,156,0.08)", color: "#28559c", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>{icon}</span>
                  <span style={{ flex: 1 }}>
                    <span style={{ display: "block", fontSize: 13, fontWeight: 600 }}>{label}</span>
                    <span style={{ display: "block", fontSize: 11.5, color: "#6b7280", marginTop: 1 }}>{desc}</span>
                  </span>
                </div>
              ))}
            </div>
            <div onClick={() => { const ids = ["bars", "funnel", "cr", "sources", "hot"]; setWidgets((w) => [...w, { t: ids[wType], q: wQuiz }]); setWOpen(false); }} style={{ background: "#28559c", color: "#ffffff", borderRadius: 9999, padding: "12px 0", fontSize: 13.5, fontWeight: 500, textAlign: "center", cursor: "pointer", marginTop: 18 }}>Добавить на дашборд</div>
          </div>
        </div>
      )}

      {/* AI modal */}
      {aiOpen && (
        <div onClick={closeAi} style={overlay(50)}>
          <div onClick={stop} style={{ ...modalBox, width: 560, padding: 28 }}>
            {aiPhase === "idle" && (
              <AiIdle
                onClose={closeAi}
                business={aiBusiness} setBusiness={setAiBusiness}
                aiGoal={aiGoal} setAiGoal={setAiGoal}
                aiBonus={aiBonus} setAiBonus={setAiBonus}
                aiTone={aiTone} setAiTone={setAiTone}
                aiQn={aiQn} setAiQn={setAiQn}
                aiCalc={aiCalc} setAiCalc={setAiCalc}
                onRun={runAiFlow}
              />
            )}
            {aiPhase === "busy" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, padding: "36px 12px", textAlign: "center" }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#28559c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" /></svg>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{aiStage}</div>
                <div style={{ width: "100%", maxWidth: 320, height: 6, background: "#f3f4f6", borderRadius: 9999, overflow: "hidden" }}><div style={{ height: "100%", background: "#28559c", borderRadius: 9999, transition: "width .5s", width: `${aiProgress}%` }} /></div>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>Обычно занимает меньше минуты</div>
              </div>
            )}
            {aiPhase === "done" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "28px 12px", textAlign: "center" }}>
                <div style={{ width: 52, height: 52, borderRadius: 9999, background: "rgba(22,101,52,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>Квиз «{aiQuiz?.name}» готов</div>
                <div style={{ fontSize: 12.5, color: "#6b7280", lineHeight: 1.6 }}>Обложка, {aiQuiz?.steps.length ?? aiQn} вопросов и форма контактов. Сохранён в черновики.</div>
                <div style={{ display: "flex", gap: 10, width: "100%", maxWidth: 360 }}>
                  <Link href={aiQuiz ? `${routes.editor}?id=${aiQuiz.id}` : routes.editor} style={{ flex: 1, textAlign: "center", background: "#28559c", color: "#ffffff", borderRadius: 9999, padding: "11px 0", fontSize: 13, fontWeight: 500 }}>Открыть в редакторе</Link>
                  <div onClick={closeAi} style={{ flex: 1, textAlign: "center", border: "1px solid #e5e7eb", borderRadius: 9999, padding: "11px 0", fontSize: 13, fontWeight: 500, cursor: "pointer", boxSizing: "border-box" }}>Позже</div>
                </div>
              </div>
            )}
            {aiPhase === "error" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "28px 12px", textAlign: "center" }}>
                <div style={{ width: 52, height: 52, borderRadius: 9999, background: "rgba(153,27,27,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>⚠️</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>Не получилось сгенерировать</div>
                <div style={{ fontSize: 12.5, color: "#6b7280", lineHeight: 1.6 }}>{aiError}<br />Проверьте, что задан POLZA_API_KEY.</div>
                <div style={{ display: "flex", gap: 10, width: "100%", maxWidth: 360 }}>
                  <div onClick={() => setAiPhase("idle")} style={{ flex: 1, textAlign: "center", background: "#28559c", color: "#ffffff", borderRadius: 9999, padding: "11px 0", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Назад</div>
                  <div onClick={closeAi} style={{ flex: 1, textAlign: "center", border: "1px solid #e5e7eb", borderRadius: 9999, padding: "11px 0", fontSize: 13, fontWeight: 500, cursor: "pointer", boxSizing: "border-box" }}>Закрыть</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- helpers for real data ---------- */

function planLabel(plan?: string): string {
  return { free: "Бесплатный", start: "Старт", pro: "Про", biz: "Бизнес" }[plan || "free"] || "Бесплатный";
}
function usagePct(used: number, limit?: number): number {
  if (!limit) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}
function fmtNum(n: number): string {
  return n.toLocaleString("ru-RU");
}
function buildKpis(stats: Stats | null, leads: Lead[]) {
  const t = stats?.totals;
  const opens = t?.open ?? 0;
  const leadN = t?.lead ?? leads.length;
  const hot = leads.filter((l) => l.heat === "hot").length;
  const conv = opens ? (Math.round((leadN / opens) * 1000) / 10).toLocaleString("ru-RU") + "%" : "—";
  const days = stats?.days ?? 7;
  return [
    { label: "Показы квиза", value: fmtNum(opens), delta: `за ${days} дней`, deltaColor: "#6b7280" },
    { label: "Начали квиз", value: fmtNum(t?.start ?? 0), delta: "дошли до 1-го вопроса", deltaColor: "#166534" },
    { label: "Заявки", value: fmtNum(leadN), delta: `${hot} горячих`, deltaColor: "#c2410c" },
    { label: "Конверсия в заявку", value: conv, delta: "заявка / показ", deltaColor: "#166534" },
  ];
}

/* ---------- Sections ---------- */

function Dashboard({ kpis, stats, leads, widgets, onOpenWidget, onNewQuiz, onRemove, quizNames }: { kpis: { label: string; value: string; delta: string; deltaColor: string }[]; stats: Stats | null; leads: Lead[]; widgets: { t: string; q: number }[]; onOpenWidget: () => void; onNewQuiz: () => void; onRemove: (i: number) => void; quizNames: string[] }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <div>
          <h1 style={h1}>Дашборд</h1>
          <div style={subtitle}>Все проекты · последние 7 дней</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={pill}>7 дней ▾</div>
          <div onClick={onOpenWidget} style={{ ...pill, color: "#28559c" }}>+ Виджет</div>
          <div onClick={onNewQuiz} style={{ background: "#28559c", color: "#ffffff", borderRadius: 9999, padding: "9px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>+ Новый квиз</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 24 }}>
        {kpis.map((k) => (
          <div key={k.label} style={{ background: "#ffffff", borderRadius: 20, padding: "20px 22px" }}>
            <div style={{ fontSize: 12.5, color: "#6b7280" }}>{k.label}</div>
            <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", margin: "8px 0 6px" }}>{k.value}</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: k.deltaColor }}>{k.delta}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16 }}>
        {widgets.map((w, i) => (
          <div key={i} style={{ background: "#ffffff", borderRadius: 20, padding: 22, minWidth: 0, position: "relative" }}>
            <div onClick={() => onRemove(i)} style={{ position: "absolute", top: 14, right: 14, width: 24, height: 24, borderRadius: 9999, background: "#F5F5F5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 11, color: "#9ca3af" }}>✕</div>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{widgetTitles[w.t]}</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{quizNames[w.q] ?? "Все квизы"}</div>
            </div>
            <WidgetBody type={w.t} stats={stats} leads={leads} />
          </div>
        ))}
      </div>
    </div>
  );
}

function WidgetEmpty() {
  return <div style={{ fontSize: 12.5, color: "#c4c8cf", padding: "18px 0", textAlign: "center" }}>Пока нет данных за период</div>;
}

function WidgetBody({ type, stats, leads }: { type: string; stats: Stats | null; leads: Lead[] }) {
  if (type === "bars") {
    const data = stats?.bars ?? [];
    const max = Math.max(1, ...data.map((b) => b.v));
    if (!data.some((b) => b.v > 0)) return <WidgetEmpty />;
    return (
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 140 }}>
        {data.map((b, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
            <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>{b.v}</div>
            <div style={{ width: "100%", maxWidth: 44, borderRadius: "8px 8px 4px 4px", background: i === data.length - 1 ? "#28559c" : "rgba(40,85,156,0.35)", height: `${Math.round((b.v / max) * 100)}%`, minHeight: b.v ? 6 : 0 }} />
            <div style={{ fontSize: 11, color: "#9ca3af" }}>{b.d}</div>
          </div>
        ))}
      </div>
    );
  }
  if (type === "funnel") {
    const t = stats?.totals;
    const open = t?.open ?? 0;
    if (!t || open === 0) return <WidgetEmpty />;
    const rows = [
      { label: "Открыли квиз", n: t.open },
      { label: "Начали (1-й вопрос)", n: t.start },
      { label: "Дошли до контактов", n: t.contact },
      { label: "Оставили заявку", n: t.lead },
    ];
    const conv = open ? Math.round((t.lead / open) * 1000) / 10 : 0;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map((f) => {
          const w = Math.round((f.n / open) * 100);
          return (
            <div key={f.label}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}><span style={{ color: "#374151" }}>{f.label}</span><span style={{ color: "#6b7280", fontWeight: 600 }}>{fmtNum(f.n)}</span></div>
              <div style={{ height: 8, background: "#f3f4f6", borderRadius: 9999, overflow: "hidden" }}><div style={{ height: "100%", borderRadius: 9999, background: "#28559c", opacity: Math.max(0.35, w / 100), width: `${w}%` }} /></div>
            </div>
          );
        })}
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>Конверсия в заявку — <b style={{ color: "#166534" }}>{conv.toLocaleString("ru-RU")}%</b></div>
      </div>
    );
  }
  if (type === "sources") {
    const src = stats?.sources ?? [];
    if (src.length === 0) return <WidgetEmpty />;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 12.5 }}>
        {src.map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#6b7280" }}>{k}</span><b>{v}</b></div>
        ))}
      </div>
    );
  }
  if (type === "hot") {
    const hot = stats?.hot ?? [];
    if (hot.length === 0) return <WidgetEmpty />;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {hot.map((h, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5 }}>
            <span style={{ fontWeight: 500 }}>{h.name}</span>
            <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 9999, background: "rgba(194,65,12,0.10)", color: "#c2410c" }}>🔥 {h.score}</span>
          </div>
        ))}
      </div>
    );
  }
  // cr
  const t = stats?.totals;
  const open = t?.open ?? 0;
  const conv = open ? Math.round((t!.lead / open) * 1000) / 10 : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 38, fontWeight: 600, letterSpacing: "-0.03em" }}>{open ? conv.toLocaleString("ru-RU") + "%" : "—"}</div>
      <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>{fmtNum(t?.lead ?? leads.length)} заявок · {fmtNum(open)} показов</div>
    </div>
  );
}

function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div style={{ background: "#ffffff", borderRadius: 20, padding: "48px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ width: 54, height: 54, borderRadius: 16, background: "rgba(40,85,156,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>{SPARK}</div>
      <div style={{ fontSize: 16, fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: 13, color: "#6b7280", maxWidth: 420, lineHeight: 1.5 }}>{text}</div>
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}

function QuizzesSection({ quizzes, leads, onAi, onPublishToggle, onRemove, onReload }: { quizzes: Quiz[]; leads: Lead[]; onAi: () => void; onPublishToggle: (q: Quiz) => void; onRemove: (q: Quiz) => void; onReload: () => void }) {
  const active = quizzes.filter((q) => q.status === "active").length;
  const [installQuiz, setInstallQuiz] = useState<Quiz | null>(null);
  const [abQuiz, setAbQuiz] = useState<Quiz | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <div>
          <h1 style={h1}>Квизы</h1>
          <div style={subtitle}>{active} активных · {quizzes.length - active} черновиков</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div onClick={onAi} style={{ ...pill, display: "flex", alignItems: "center", gap: 7 }}>{SPARK}Сгенерировать ИИ</div>
          <Link href={routes.editor} style={{ background: "#28559c", color: "#fff", borderRadius: 9999, padding: "9px 18px", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>+ Новый квиз</Link>
        </div>
      </div>
      {quizzes.length === 0 ? (
        <EmptyState
          title="Пока нет квизов"
          text="Соберите квиз вручную в редакторе или сгенерируйте его ИИ за минуту — Квалифай подготовит обложку, вопросы и форму контактов."
          action={
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
              <div onClick={onAi} style={{ background: "#28559c", color: "#fff", borderRadius: 9999, padding: "11px 22px", fontSize: 13.5, fontWeight: 500, cursor: "pointer", display: "inline-flex", gap: 7, alignItems: "center" }}>{SPARK}Сгенерировать ИИ</div>
              <Link href={routes.editor} style={{ border: "1px solid #e5e7eb", borderRadius: 9999, padding: "11px 22px", fontSize: 13.5, fontWeight: 500, textDecoration: "none", color: "#374151" }}>Собрать вручную</Link>
            </div>
          }
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
          {quizzes.map((q) => {
            const leadCount = leads.filter((l) => l.quiz_id === q.id).length;
            const isActive = q.status === "active";
            const abOn = !!(q.design as { doc?: { ab?: { enabled?: boolean } } }).doc?.ab?.enabled;
            return (
              <div key={q.id} style={{ background: "#ffffff", borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 14, position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 9999, background: isActive ? "rgba(22,101,52,0.10)" : "rgba(17,24,39,0.07)", color: isActive ? "#166534" : "#6b7280" }}>
                      <span style={{ width: 6, height: 6, borderRadius: 9999, background: isActive ? "#22c55e" : "#9ca3af" }} />
                      {isActive ? "Активен" : "Черновик"}
                    </span>
                    {abOn && <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 9999, background: "rgba(40,85,156,0.10)", color: "#28559c" }}>A/B</span>}
                  </div>
                  {/* Меню действий (⋯) — второстепенные операции убраны из основного ряда */}
                  <div style={{ position: "relative" }}>
                    <button onClick={() => setMenuFor(menuFor === q.id ? null : q.id)} title="Ещё" aria-label="Действия" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 9999, border: "none", background: menuFor === q.id ? "#eef1f6" : "transparent", color: "#6b7280", cursor: "pointer", flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="12" cy="19" r="1.7" /></svg>
                    </button>
                    {menuFor === q.id && (
                      <div style={{ position: "absolute", top: 36, right: 0, zIndex: 30, width: 210, background: "#fff", borderRadius: 14, boxShadow: "0 12px 40px rgba(17,24,39,0.16)", border: "1px solid #f0f0f0", padding: 6, display: "flex", flexDirection: "column", gap: 1 }}>
                        {isActive && <MenuItem icon="↗" label="Открыть квиз" onClick={() => { setMenuFor(null); window.open(`/q/${q.slug}`, "_blank"); }} />}
                        {isActive && <MenuItem icon={INSTALL_ICON} label="Установка на сайт" onClick={() => { setMenuFor(null); setInstallQuiz(q); }} />}
                        {isActive && <MenuItem icon="⚗" label={abOn ? "A/B-тест · включён" : "A/B-тест"} accent={abOn} onClick={() => { setMenuFor(null); setAbQuiz(q); }} />}
                        <MenuItem icon={isActive ? PAUSE_ICON : PLAY_ICON} label={isActive ? "Снять с публикации" : "Опубликовать"} onClick={() => { setMenuFor(null); onPublishToggle(q); }} />
                        <div style={{ height: 1, background: "#f0f0f0", margin: "4px 6px" }} />
                        <MenuItem icon="🗑" label="Удалить квиз" danger onClick={() => { setMenuFor(null); onRemove(q); }} />
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>{q.name}</div>
                  <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 4 }}>{isActive ? `/q/${q.slug}` : "Черновик · не опубликован"}</div>
                </div>
                <div style={{ display: "flex", gap: 18, fontSize: 12.5, color: "#6b7280", borderTop: "1px solid #f3f4f6", paddingTop: 14 }}>
                  <span><b style={{ color: "#111827", fontWeight: 600 }}>{q.steps.length}</b> вопр.</span>
                  <span><b style={{ color: "#111827", fontWeight: 600 }}>{leadCount}</b> заявок</span>
                </div>
                {/* Один понятный ряд: слева — редактор, справа — главное действие */}
                <div style={{ display: "flex", gap: 8 }}>
                  <Link href={`${routes.editor}?id=${q.id}`} style={{ flex: 1, textAlign: "center", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 0", fontSize: 13, fontWeight: 500, color: "#111827", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                    Редактор
                  </Link>
                  {isActive ? (
                    <div onClick={() => setInstallQuiz(q)} style={{ flex: 1, textAlign: "center", background: "#28559c", color: "#fff", borderRadius: 10, padding: "10px 0", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      {INSTALL_ICON_WHITE}
                      Установить
                    </div>
                  ) : (
                    <div onClick={() => onPublishToggle(q)} style={{ flex: 1, textAlign: "center", background: "#28559c", color: "#fff", borderRadius: 10, padding: "10px 0", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Опубликовать</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Клик вне меню действий — закрыть */}
      {menuFor && <div onClick={() => setMenuFor(null)} style={{ position: "fixed", inset: 0, zIndex: 20 }} />}
      {installQuiz && <InstallModal quiz={installQuiz} onClose={() => setInstallQuiz(null)} />}
      {abQuiz && <AbModal quiz={abQuiz} quizzes={quizzes} onClose={() => setAbQuiz(null)} onSaved={() => { setAbQuiz(null); onReload(); }} />}
    </div>
  );
}

/* ── Пункт меню действий над квизом ──────────────────────── */
function MenuItem({ icon, label, onClick, danger, accent }: { icon: ReactNode; label: string; onClick: () => void; danger?: boolean; accent?: boolean }) {
  const color = danger ? "#b91c1c" : accent ? "#28559c" : "#374151";
  return (
    <div
      onClick={onClick}
      onMouseOver={(e) => (e.currentTarget.style.background = danger ? "rgba(185,28,28,0.06)" : "#f5f7fa")}
      onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
      style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 9, fontSize: 13, fontWeight: 500, color, cursor: "pointer", transition: "background .12s" }}
    >
      <span style={{ width: 18, display: "inline-flex", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{icon}</span>
      {label}
    </div>
  );
}

const INSTALL_ICON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 18l6-6-6-6" /><path d="M8 6l-6 6 6 6" /></svg>
);
const INSTALL_ICON_WHITE = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 18l6-6-6-6" /><path d="M8 6l-6 6 6 6" /></svg>
);
const PAUSE_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
);
const PLAY_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5v14l11-7z" /></svg>
);

/* ── A/B-тест: вариант B и доля трафика ──────────────────── */
function AbModal({ quiz, quizzes, onClose, onSaved }: { quiz: Quiz; quizzes: Quiz[]; onClose: () => void; onSaved: () => void }) {
  const design = quiz.design as { doc?: { ab?: { b?: string; split?: number; enabled?: boolean } } };
  const ab0 = design.doc?.ab || {};
  const candidates = quizzes.filter((q) => q.id !== quiz.id && q.status === "active");
  const [enabled, setEnabled] = useState(!!ab0.enabled);
  const [bSlug, setBSlug] = useState(ab0.b || candidates[0]?.slug || "");
  const [split, setSplit] = useState(ab0.split ?? 50);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const newDesign = { ...(quiz.design as Record<string, unknown>), doc: { ...(design.doc as Record<string, unknown>), ab: { b: bSlug, split, enabled: enabled && !!bSlug } } };
      await api.updateQuiz(quiz.id, { design: newDesign as Quiz["design"] });
      onSaved();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ошибка");
      setSaving(false);
    }
  };

  return (
    <div onClick={onClose} style={overlay(70)}>
      <div onClick={(e) => e.stopPropagation()} style={{ ...modalBox, width: 480, padding: 26 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ fontSize: 17, fontWeight: 600 }}>A/B-тест · «{quiz.name}»</div>
          <div onClick={onClose} style={closeBtnSm}>✕</div>
        </div>
        <div style={{ fontSize: 12.5, color: "#6b7280", marginBottom: 18, lineHeight: 1.55 }}>
          Часть посетителей увидит другой квиз (вариант B). Показы и заявки каждого варианта считаются отдельно —
          сравнивайте конверсию в «Заявках» и на дашборде.
        </div>

        {candidates.length === 0 ? (
          <div style={{ fontSize: 13, color: "#9ca3af", background: "#F8F9FB", borderRadius: 12, padding: "14px 16px" }}>
            Нужен второй опубликованный квиз — создайте вариант B (можно скопировать этот квиз и изменить обложку/вопросы), опубликуйте его и вернитесь сюда.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Тест включён</span>
              <span onClick={() => setEnabled((v) => !v)} style={{ width: 34, height: 20, borderRadius: 9999, background: enabled ? "#28559c" : "#d1d5db", position: "relative", cursor: "pointer", display: "inline-block" }}>
                <span style={{ position: "absolute", top: 2, left: enabled ? 16 : 2, width: 16, height: 16, borderRadius: 9999, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left .2s" }} />
              </span>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Вариант B (другой квиз)</div>
              <select value={bSlug} onChange={(e) => setBSlug(e.target.value)} style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e5e7eb", borderRadius: 10, padding: "9px 12px", fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>
                {candidates.map((q) => <option key={q.id} value={q.slug}>{q.name}</option>)}
              </select>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
                <span>Доля трафика на вариант B</span><b style={{ color: "#111827" }}>{split}%</b>
              </div>
              <input type="range" min={5} max={95} step={5} value={split} onChange={(e) => setSplit(+e.target.value)} style={{ width: "100%", accentColor: "#28559c" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9ca3af", marginTop: 2 }}><span>A: {100 - split}%</span><span>B: {split}%</span></div>
            </div>
            <div onClick={save} style={{ background: "#28559c", color: "#fff", borderRadius: 9999, padding: "12px 0", fontSize: 13.5, fontWeight: 500, textAlign: "center", cursor: "pointer", opacity: saving ? 0.6 : 1 }}>{saving ? "Сохраняем…" : "Сохранить"}</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Установка квиза на сайт: скрипт, ссылка, QR ─────────── */
function InstallModal({ quiz, onClose }: { quiz: Quiz; onClose: () => void }) {
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState("");
  const origin = typeof window !== "undefined" ? window.location.origin : "https://qvalify.ru";
  const link = `${origin}/q/${quiz.slug}`;
  const scriptPopup = `<script src="${origin}/embed.min.js" data-quiz="${quiz.slug}" defer></script>`;
  const scriptInline = `<div id="quiz-${quiz.slug}"></div>\n<script src="${origin}/embed.min.js" data-quiz="${quiz.slug}" data-selector="#quiz-${quiz.slug}" defer></script>`;

  useEffect(() => {
    import("qrcode").then((QRCode) => QRCode.toDataURL(link, { width: 240, margin: 1, color: { dark: "#0F1F3C" } })).then(setQr).catch(() => {});
  }, [link]);

  const copy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(""), 1600); }).catch(() => {});
  };
  const codeBox: CSSProperties = { background: "#0F1F3C", color: "#c9d6ea", borderRadius: 12, padding: "12px 14px", fontSize: 11.5, fontFamily: "ui-monospace,Menlo,monospace", whiteSpace: "pre-wrap", wordBreak: "break-all", lineHeight: 1.55 };
  const copyBtn = (key: string, text: string) => (
    <div onClick={() => copy(text, key)} style={{ marginTop: 8, textAlign: "center", background: copied === key ? "#166534" : "#28559c", color: "#fff", borderRadius: 9999, padding: "9px 0", fontSize: 12.5, fontWeight: 500, cursor: "pointer", transition: "background .2s" }}>{copied === key ? "✓ Скопировано" : "Копировать код"}</div>
  );

  return (
    <div onClick={onClose} style={overlay(70)}>
      <div onClick={(e) => e.stopPropagation()} style={{ ...modalBox, width: 620, padding: 26 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ fontSize: 17, fontWeight: 600 }}>Установка «{quiz.name}» на сайт</div>
          <div onClick={onClose} style={closeBtnSm}>✕</div>
        </div>
        <div style={{ fontSize: 12.5, color: "#6b7280", marginBottom: 18 }}>Скрипт лёгкий и подхватывает изменения автоматически: сохранили квиз в редакторе — на сайте уже новая версия. Ничего переустанавливать не нужно.</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 18 }} className="qv-anal-grid">
          <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>1 · Плавающая кнопка + попап</div>
              <div style={{ fontSize: 11.5, color: "#6b7280", marginBottom: 6 }}>Вставьте перед закрывающим <code>&lt;/body&gt;</code> — появится кнопка квиза (вид и позиция настраиваются в редакторе).</div>
              <div style={codeBox}>{scriptPopup}</div>
              {copyBtn("popup", scriptPopup)}
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>2 · Встроенный блок на странице</div>
              <div style={{ fontSize: 11.5, color: "#6b7280", marginBottom: 6 }}>Вставьте туда, где квиз должен появиться прямо в контенте.</div>
              <div style={codeBox}>{scriptInline}</div>
              {copyBtn("inline", scriptInline)}
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>3 · Прямая ссылка</div>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0, border: "1px solid #e5e7eb", borderRadius: 10, padding: "9px 12px", fontSize: 12, fontFamily: "ui-monospace,Menlo,monospace", color: "#28559c", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{link}</div>
                <div onClick={() => copy(link, "link")} style={{ flexShrink: 0, border: "1px solid #e5e7eb", borderRadius: 9999, padding: "8px 16px", fontSize: 12, fontWeight: 500, cursor: "pointer", color: copied === "link" ? "#166534" : "#374151" }}>{copied === "link" ? "✓" : "Копировать"}</div>
              </div>
            </div>
            <DomainField quiz={quiz} origin={origin} />
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>QR-код квиза</div>
            {qr
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={qr} alt="QR" style={{ width: 180, height: 180, borderRadius: 12, border: "1px solid #f0f0f0" }} />
              : <div style={{ width: 180, height: 180, borderRadius: 12, background: "#F5F5F5", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 12 }}>Генерируем…</div>}
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 8, lineHeight: 1.5 }}>Для офлайна: визитки, упаковка, вывеска</div>
            {qr && <a href={qr} download={`qvalify-${quiz.slug}.png`} style={{ display: "inline-block", marginTop: 8, border: "1px solid #e5e7eb", borderRadius: 9999, padding: "7px 16px", fontSize: 12, fontWeight: 500, color: "#374151" }}>Скачать PNG</a>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Свой домен к квизу (CNAME) ──────────────────────────── */
function DomainField({ quiz, origin }: { quiz: Quiz; origin: string }) {
  const [domain, setDomain] = useState(quiz.domain || "");
  const [saved, setSaved] = useState(quiz.domain || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const targetHost = (() => { try { return new URL(origin).host; } catch { return "qvalify.ru"; } })();

  const save = async (value: string) => {
    setBusy(true); setMsg("");
    try {
      const res = await api.setDomain(quiz.id, value.trim());
      setSaved(res.domain);
      setDomain(res.domain);
      setMsg(res.domain ? "Домен привязан" : "Домен отключён");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>4 · Свой домен (например, quiz.вашсайт.ру)</div>
      <div style={{ fontSize: 11.5, color: "#6b7280", marginBottom: 8, lineHeight: 1.5 }}>
        Квиз откроется на вашем домене как отдельная посадочная страница. У регистратора добавьте CNAME-запись
        поддомена на <b style={{ color: "#111827" }}>{targetHost}</b>, затем впишите домен ниже.
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="quiz.вашсайт.ру"
          style={{ flex: 1, minWidth: 0, border: "1px solid #e5e7eb", borderRadius: 10, padding: "9px 12px", fontSize: 12.5, fontFamily: "ui-monospace,Menlo,monospace", color: "#111827", boxSizing: "border-box" }}
        />
        <div onClick={busy ? undefined : () => save(domain)} style={{ flexShrink: 0, borderRadius: 9999, padding: "9px 18px", fontSize: 12.5, fontWeight: 500, cursor: busy ? "default" : "pointer", background: "#28559c", color: "#fff", opacity: busy ? 0.6 : 1 }}>{busy ? "…" : saved ? "Обновить" : "Привязать"}</div>
      </div>
      {msg && <div style={{ fontSize: 11.5, color: msg.includes("Ошибка") || msg.includes("занят") || msg.includes("екоррект") ? "#b91c1c" : "#166534", marginTop: 6 }}>{msg}</div>}
      {saved && (
        <div style={{ fontSize: 11.5, color: "#6b7280", marginTop: 6 }}>
          Активен: <a href={`https://${saved}`} target="_blank" rel="noreferrer" style={{ color: "#28559c" }}>{saved}</a>
          <span onClick={() => { setDomain(""); save(""); }} style={{ marginLeft: 10, color: "#b91c1c", cursor: "pointer" }}>Отключить</span>
        </div>
      )}
    </div>
  );
}

function shortLabel(q: string | undefined, i: number): string {
  const t = (q || "").trim();
  if (!t) return `Вопрос ${i + 1}`;
  return t.length > 22 ? t.slice(0, 22) + "…" : t;
}
function buildDropSteps(pq: Stats["perQuiz"][string] | undefined, quiz: Quiz | undefined) {
  const open = pq?.open ?? 0;
  const rows: { label: string; n: number }[] = [{ label: "Обложка", n: open }];
  (quiz?.steps ?? []).forEach((s, i) => rows.push({ label: shortLabel(s.question, i), n: pq?.steps?.[i] ?? 0 }));
  rows.push({ label: "Контакты", n: pq?.contact ?? 0 });
  rows.push({ label: "Заявка", n: pq?.lead ?? 0 });
  const base = Math.max(1, open);
  return rows.map((r, i) => {
    const prev = i > 0 ? rows[i - 1].n : r.n;
    const drop = i > 0 && prev > 0 ? Math.round((1 - r.n / prev) * 100) : 0;
    return { label: r.label, n: r.n, drop, w: `${Math.round((r.n / base) * 100)}%`, op: Math.max(0.3, r.n / base), dropColor: drop >= 25 ? "#c2410c" : i === rows.length - 1 ? "#166534" : "#6b7280" };
  });
}

function LeadsSection({ quizzes, leads, stats, crmQuiz, setCrmQuiz, crmTab, setCrmTab, openLead }: { quizzes: Quiz[]; leads: Lead[]; stats: Stats | null; crmQuiz: string | null; setCrmQuiz: (v: string | null) => void; crmTab: "board" | "anal"; setCrmTab: (v: "board" | "anal") => void; openLead: (id: string) => void }) {
  const quizzesWithLeads = quizzes.filter((q) => leads.some((l) => l.quiz_id === q.id));

  if (crmQuiz === null) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
          <div><h1 style={h1}>Заявки</h1><div style={subtitle}>Встроенная CRM · {leads.length} заявок</div></div>
          {leads.length > 0 && <a href="/api/leads/export" style={{ ...pill, textDecoration: "none", color: "#111827", display: "inline-flex", alignItems: "center", gap: 7 }}>⬇ Экспорт CSV</a>}
        </div>
        {quizzesWithLeads.length === 0 ? (
          <EmptyState title="Заявок пока нет" text="Опубликуйте квиз и поделитесь ссылкой — заявки клиентов появятся здесь автоматически, со скорингом и обобщением ИИ." />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 16 }}>
            {quizzesWithLeads.map((q) => {
              const qLeads = leads.filter((l) => l.quiz_id === q.id);
              const cnt = (st: string) => qLeads.filter((l) => l.status === st).length;
              const hot = qLeads.filter((l) => l.heat === "hot").length;
              return (
                <div key={q.id} onClick={() => { setCrmQuiz(q.id); setCrmTab("board"); }} className="qv-lift" style={{ background: "#ffffff", borderRadius: 20, padding: 22, cursor: "pointer", display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>{q.name}</div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11.5, fontWeight: 600, padding: "4px 10px", borderRadius: 9999, background: "rgba(40,85,156,0.10)", color: "#28559c" }}>{cnt("new")} новых</span>
                    <span style={{ fontSize: 11.5, fontWeight: 600, padding: "4px 10px", borderRadius: 9999, background: "rgba(17,24,39,0.07)", color: "#111827" }}>{cnt("work")} в работе</span>
                    <span style={{ fontSize: 11.5, fontWeight: 600, padding: "4px 10px", borderRadius: 9999, background: "rgba(22,101,52,0.10)", color: "#166534" }}>{cnt("done")} успешных</span>
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 12.5, color: "#6b7280", borderTop: "1px solid #f3f4f6", paddingTop: 12 }}>
                    <span>🔥 <b style={{ color: "#111827" }}>{hot}</b> горячих</span>
                    <span>всего — <b style={{ color: "#111827" }}>{qLeads.length}</b></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const quiz = quizzes.find((q) => q.id === crmQuiz);
  const qLeads = leads.filter((l) => l.quiz_id === crmQuiz);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <div onClick={() => setCrmQuiz(null)} style={{ width: 34, height: 34, borderRadius: 9999, background: "#ffffff", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          </div>
          <div>
            <h1 style={{ ...h1, fontSize: 20 }}>{quiz?.name}</h1>
            <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 2 }}>{qLeads.length} заявок</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {qLeads.length > 0 && <a href={`/api/leads/export?quiz=${crmQuiz}`} style={{ ...pill, textDecoration: "none", color: "#111827", display: "inline-flex", alignItems: "center", gap: 7 }}>⬇ CSV</a>}
          <div style={{ display: "flex", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 9999, padding: 3 }}>
            {(["board", "anal"] as const).map((t) => (
              <div key={t} onClick={() => setCrmTab(t)} style={{ borderRadius: 9999, padding: "7px 18px", fontSize: 12.5, fontWeight: 500, cursor: "pointer", background: crmTab === t ? "#111827" : "transparent", color: crmTab === t ? "#ffffff" : "#374151", transition: "background .2s" }}>{t === "board" ? "Канбан" : "Аналитика шагов"}</div>
            ))}
          </div>
        </div>
      </div>

      {crmTab === "board" ? (
        <div style={{ overflowX: "auto", paddingBottom: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(240px,1fr))", gap: 14, minWidth: 1000 }}>
            {columns.map((col, ci) => {
              const cards = qLeads.filter((l) => STATUS_ORDER.indexOf(l.status) === ci);
              return (
                <div key={col.label} style={{ background: "rgba(255,255,255,0.6)", borderRadius: 16, padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 6px" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: col.dot }} />
                    <span style={{ fontSize: 12.5, fontWeight: 600 }}>{col.label}</span>
                    <span style={{ fontSize: 11.5, color: "#9ca3af", marginLeft: "auto" }}>{cards.length}</span>
                  </div>
                  {cards.map((c) => (
                    <div key={c.id} onClick={() => openLead(c.id)} className="qv-kanban-card" style={{ background: "#ffffff", borderRadius: 14, padding: 14, cursor: "pointer", boxShadow: "0 1px 4px rgba(17,24,39,0.05)", display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name || "Без имени"}</div>
                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 9999, background: heatOf(c.heat).heatBg, color: heatOf(c.heat).heatColor, whiteSpace: "nowrap", flexShrink: 0 }}>{heatOf(c.heat).heat}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{c.phone}</div>
                      {c.summary && (
                        <div style={{ fontSize: 11.5, lineHeight: 1.5, color: "#374151", background: "#F8F9FB", borderRadius: 10, padding: "8px 10px", display: "flex", gap: 6 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#28559c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" /></svg>
                          <span>{c.summary.split(".")[0]}.</span>
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>{formatWhen(c.created_at)}</div>
                    </div>
                  ))}
                  {cards.length === 0 && <div style={{ fontSize: 11.5, color: "#c4c8cf", textAlign: "center", padding: "10px 0" }}>Пусто</div>}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, alignItems: "start" }} className="qv-anal-grid">
          <div style={{ background: "#ffffff", borderRadius: 20, padding: 22, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Где выходят люди</div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 18 }}>{(stats?.perQuiz[crmQuiz!]?.open ?? 0)} открытий за {stats?.days ?? 7} дней</div>
            {(stats?.perQuiz[crmQuiz!]?.open ?? 0) === 0 ? (
              <div style={{ fontSize: 12.5, color: "#9ca3af", padding: "8px 0" }}>Данные воронки появятся, когда по опубликованному квизу пройдут посетители.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {buildDropSteps(stats?.perQuiz[crmQuiz!], quiz).map((d, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12.5, marginBottom: 5 }}>
                      <span style={{ fontWeight: 500 }}>{d.label}</span>
                      <span style={{ color: "#6b7280", whiteSpace: "nowrap" }}>{d.n}{i > 0 && <> · <b style={{ color: d.dropColor }}>−{d.drop}%</b></>}</span>
                    </div>
                    <div style={{ height: 10, background: "#f3f4f6", borderRadius: 9999, overflow: "hidden", display: "flex" }}><div style={{ height: "100%", background: "#28559c", opacity: d.op, borderRadius: 9999, width: d.w }} /></div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
            <div style={{ background: "#ffffff", borderRadius: 20, padding: 22 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>По этому квизу</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12.5 }}>
                {[["Всего заявок", String(qLeads.length)], ["Горячих", String(qLeads.filter((l) => l.heat === "hot").length)], ["Средний скоринг", String(Math.round(qLeads.reduce((s, l) => s + l.score, 0) / (qLeads.length || 1)))], ["Успешных", String(qLeads.filter((l) => l.status === "done").length)]].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#6b7280" }}>{k}</span><b>{v}</b></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IntegSection({ connected, onOpen }: { connected: Record<number, boolean>; onOpen: (idx: number) => void }) {
  return (
    <div>
      <div style={{ marginBottom: 24 }}><h1 style={h1}>Интеграции</h1><div style={subtitle}>Куда отправлять заявки</div></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
        {integList.map((it, idx) => {
          const on = !!connected[idx];
          return (
            <div key={it.name} style={{ background: "#ffffff", borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "#F5F5F5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#28559c", overflow: "hidden" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {it.img ? <img src={it.img} alt="" style={{ width: 22, height: 22 }} /> : it.abbr}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{it.name}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{it.desc}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #f3f4f6", paddingTop: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 500, color: on ? "#166534" : "#9ca3af" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: on ? "#16a34a" : "#d1d5db" }} />{on ? "Подключено" : "Не подключено"}
                </div>
                <div onClick={() => onOpen(idx)} style={{ border: "1px solid #e5e7eb", borderRadius: 9999, padding: "6px 14px", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>{on ? "Настроить" : "Подключить"}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SettingsSection({ me, leads, onLogout }: { me: Me | null; leads: Lead[]; onLogout: () => void }) {
  return (
    <div>
      <div style={{ marginBottom: 24 }}><h1 style={h1}>Настройки</h1><div style={subtitle}>Аккаунт и тариф</div></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16, maxWidth: 920 }}>
        <div style={{ background: "#ffffff", borderRadius: 20, padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Профиль</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
            {[["Имя", me?.name || "—"], ["Почта", me?.email || "—"], ["Компания", me?.company || "—"]].map(([l, v]) => (
              <div key={l}>
                <div style={{ color: "#9ca3af", fontSize: 12, marginBottom: 5 }}>{l}</div>
                <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "10px 14px" }}>{v}</div>
              </div>
            ))}
          </div>
          <div onClick={onLogout} style={{ marginTop: 18, textAlign: "center", border: "1px solid #e5e7eb", borderRadius: 9999, padding: "10px 0", fontSize: 12.5, fontWeight: 500, cursor: "pointer", color: "#991b1b" }}>Выйти из аккаунта</div>
        </div>
        <div style={{ background: "#ffffff", borderRadius: 20, padding: 24, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Тариф</div>
          <div style={{ background: "#28559c", color: "#ffffff", borderRadius: 16, padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{planLabel(me?.plan)} · {me?.leadLimit ?? 0} заявок</div>
              <div style={{ fontSize: 12, background: "#ffffff", color: "#28559c", borderRadius: 9999, padding: "3px 10px", fontWeight: 600 }}>Активен</div>
            </div>
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.75)", marginTop: 8 }}>Лимит заявок в месяц по тарифу</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "14px 4px 0", color: "#6b7280" }}><span>Использовано заявок</span><b style={{ color: "#111827" }}>{leads.length} из {me?.leadLimit ?? 0}</b></div>
          <div style={{ marginTop: "auto", paddingTop: 18, display: "flex", gap: 8 }}>
            <Link href={routes.tarify} style={{ flex: 1, textAlign: "center", border: "1px solid #e5e7eb", borderRadius: 9999, padding: "9px 0", fontSize: 12.5, fontWeight: 500 }}>Сменить тариф</Link>
          </div>
        </div>
        <ProtectionCard />
      </div>
    </div>
  );
}

/* Защита от фрода: дубли + чёрный список IP */
function ProtectionCard() {
  const [dedupeHours, setDedupeHours] = useState(0);
  const [blacklist, setBlacklist] = useState("");
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    api.getSettings().then(({ settings }) => {
      setDedupeHours(settings.dedupeHours || 0);
      setBlacklist((settings.ipBlacklist || []).join("\n"));
    }).catch(() => {}).finally(() => setLoaded(true));
  }, []);
  const save = async () => {
    try {
      await api.saveSettings({ dedupeHours, ipBlacklist: blacklist.split(/[\n,;\s]+/).map((x) => x.trim()).filter(Boolean) });
      setSaved(true); setTimeout(() => setSaved(false), 1600);
    } catch (e) { alert(e instanceof Error ? e.message : "Ошибка"); }
  };
  return (
    <div style={{ background: "#ffffff", borderRadius: 20, padding: 24, gridColumn: "1 / -1", maxWidth: 920 }}>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Защита от фрода</div>
      <div style={{ fontSize: 12.5, color: "#6b7280", marginBottom: 16 }}>Отсекает повторные и мусорные заявки — экономит бюджет на рекламе.</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Защита от дублей</div>
          <div style={{ fontSize: 11.5, color: "#9ca3af", marginBottom: 8 }}>Не принимать повторную заявку с того же телефона в течение N часов (0 — выключено).</div>
          <input type="number" min={0} max={720} value={dedupeHours} onChange={(e) => setDedupeHours(Math.max(0, Math.min(720, Math.round(Number(e.target.value) || 0))))} style={{ width: 120, boxSizing: "border-box", border: "1px solid #e5e7eb", borderRadius: 10, padding: "9px 12px", fontSize: 13 }} />
          <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 8 }}>часов</span>
        </div>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Чёрный список IP</div>
          <div style={{ fontSize: 11.5, color: "#9ca3af", marginBottom: 8 }}>Заявки с этих IP отклоняются. По одному в строке.</div>
          <textarea value={blacklist} onChange={(e) => setBlacklist(e.target.value)} rows={4} placeholder="203.0.113.5&#10;198.51.100.22" style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e5e7eb", borderRadius: 10, padding: "9px 12px", fontSize: 12.5, fontFamily: "ui-monospace,Menlo,monospace", resize: "vertical" }} />
        </div>
      </div>
      <div onClick={save} style={{ marginTop: 16, display: "inline-block", background: saved ? "#166534" : "#28559c", color: "#fff", borderRadius: 9999, padding: "9px 24px", fontSize: 13, fontWeight: 500, cursor: loaded ? "pointer" : "default", opacity: loaded ? 1 : 0.6, transition: "background .2s" }}>{saved ? "✓ Сохранено" : "Сохранить защиту"}</div>
    </div>
  );
}

/* ---------- Modals ---------- */

function IntegModal({ idx, vals, setVals, tg, setTg, tested, setTested, connected, onSave, onDisconnect, onClose, stop }: {
  idx: number; vals: Record<string, string>; setVals: (f: (v: Record<string, string>) => Record<string, string>) => void;
  tg: boolean; setTg: (v: boolean) => void; tested: boolean; setTested: (v: boolean) => void;
  connected: boolean; onSave: () => void; onDisconnect: () => void; onClose: () => void; stop: (e: React.MouseEvent) => void;
}) {
  const def = integDefs[idx];
  return (
    <div onClick={onClose} style={overlay(55)}>
      <div onClick={stop} style={{ ...modalBox, width: 520, padding: 26 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: "#F5F5F5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#28559c" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {def.img ? <img src={def.img} alt="" style={{ width: 21, height: 21 }} /> : def.abbr}
            </div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{def.name}</div>
          </div>
          <div onClick={onClose} style={closeBtnSm}>✕</div>
        </div>
        <div style={{ fontSize: 12.5, color: "#6b7280", marginBottom: 18 }}>{def.desc}</div>
        <div style={{ background: "#F8F9FB", borderRadius: 14, padding: "14px 16px", marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Как подключить</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {def.steps.map((text, i) => (
              <div key={i} style={{ display: "flex", gap: 9, fontSize: 12, lineHeight: 1.55, color: "#374151" }}>
                <span style={{ width: 17, height: 17, borderRadius: 9999, background: "#28559c", color: "#ffffff", fontSize: 10, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {def.fields.map((f) => {
            const key = `${idx}_${f.id}`;
            return (
              <div key={f.id}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 5 }}>{f.label}</div>
                <input type="text" value={vals[key] || ""} placeholder={f.ph} onChange={(e) => setVals((v) => ({ ...v, [key]: e.target.value }))} style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e5e7eb", borderRadius: 12, padding: "10px 13px", fontSize: 13, fontFamily: "inherit", color: "#111827", outlineColor: "#28559c" }} />
                {f.hint && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{f.hint}</div>}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#F5F5F5", borderRadius: 12, padding: "11px 14px", marginTop: 14 }}>
          <span style={{ fontSize: 12.5, color: "#374151", flex: 1 }}>Передавать ответы квиза вместе с контактом</span>
          <Toggle on={tg} onClick={() => setTg(!tg)} />
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <div onClick={onSave} style={{ flex: 1, background: "#28559c", color: "#ffffff", borderRadius: 9999, padding: "12px 0", fontSize: 13.5, fontWeight: 500, textAlign: "center", cursor: "pointer" }}>{connected ? "Сохранить" : "Подключить"}</div>
          {connected ? (
            <div onClick={onDisconnect} style={{ flex: 1, border: "1px solid rgba(153,27,27,0.3)", color: "#991b1b", borderRadius: 9999, padding: "12px 0", fontSize: 13.5, fontWeight: 500, textAlign: "center", cursor: "pointer", boxSizing: "border-box" }}>Отключить</div>
          ) : (
            <div onClick={() => setTested(true)} style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 9999, padding: "12px 0", fontSize: 13.5, fontWeight: 500, textAlign: "center", cursor: "pointer", boxSizing: "border-box", color: tested ? "#166534" : "#374151" }}>{tested ? "✓ Готово" : "Тест"}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function AiIdle({ onClose, business, setBusiness, aiGoal, setAiGoal, aiBonus, setAiBonus, aiTone, setAiTone, aiQn, setAiQn, aiCalc, setAiCalc, onRun }: {
  onClose: () => void;
  business: string; setBusiness: (v: string) => void;
  aiGoal: number; setAiGoal: (v: number) => void;
  aiBonus: number; setAiBonus: (v: number) => void;
  aiTone: number; setAiTone: (v: number) => void;
  aiQn: number; setAiQn: (v: number) => void;
  aiCalc: boolean; setAiCalc: (v: boolean) => void;
  onRun: () => void;
}) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em" }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#28559c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" /></svg>
            Сгенерировать квиз ИИ
          </div>
          <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 5 }}>Черновик за минуту — потом доведёте в редакторе</div>
        </div>
        <div onClick={onClose} style={closeBtn}>✕</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 7 }}>Опишите ваш бизнес и что продаёте</div>
          <textarea value={business} onChange={(e) => setBusiness(e.target.value)} rows={3} style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e5e7eb", borderRadius: 12, padding: "12px 14px", fontSize: 13.5, lineHeight: 1.5, color: "#111827", fontFamily: "inherit", resize: "vertical", outlineColor: "#28559c" }} />
        </div>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>Цель квиза</div>
          <ChipRow items={GOAL_OPTS} active={aiGoal} onPick={setAiGoal} />
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 8 }}><span style={{ fontWeight: 600 }}>Количество вопросов</span><b style={{ color: "#28559c" }}>{aiQn}</b></div>
          <input type="range" min={3} max={10} value={aiQn} onChange={(e) => setAiQn(+e.target.value)} style={{ width: "100%", accentColor: "#28559c" }} />
        </div>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>Бонус за прохождение</div>
          <ChipRow items={BONUS_OPTS} active={aiBonus} onPick={setAiBonus} />
        </div>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>Тон текстов</div>
          <ChipRow items={TONE_OPTS} active={aiTone} onPick={setAiTone} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#F5F5F5", borderRadius: 12, padding: "12px 14px" }}>
          <span style={{ fontSize: 12.5, color: "#374151", flex: 1 }}>Добавить калькулятор стоимости по ответам</span>
          <Toggle on={aiCalc} onClick={() => setAiCalc(!aiCalc)} />
        </div>
        <div onClick={onRun} style={{ background: "#28559c", color: "#ffffff", borderRadius: 9999, padding: "13px 0", fontSize: 14, fontWeight: 500, textAlign: "center", cursor: "pointer" }}>Сгенерировать квиз</div>
        <div style={{ fontSize: 11.5, color: "#9ca3af", textAlign: "center", marginTop: -6 }}>Генерация не тратит лимит заявок</div>
      </div>
    </>
  );
}

/* ---------- Small shared bits ---------- */

function LogoDot({ size }: { size: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 9999, background: "#28559c", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 20 20" fill="none">
        <rect x="2" y="3" width="16" height="3.2" rx="1.6" fill="#fff" opacity="0.55" />
        <rect x="2" y="8.4" width="16" height="3.2" rx="1.6" fill="#fff" opacity="0.8" />
        <rect x="2" y="13.8" width="9" height="3.2" rx="1.6" fill="#fff" />
        <path d="M13.5 15.4l1.6 1.6 3-3.4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <div onClick={onClick} style={{ border: `1px solid ${active ? "#28559c" : "#e5e7eb"}`, background: active ? "rgba(40,85,156,0.08)" : "#ffffff", color: active ? "#28559c" : "#374151", borderRadius: 9999, padding: "8px 15px", fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}>
      {children}
    </div>
  );
}

function ChipRow({ items, active, onPick }: { items: string[]; active: number; onPick: (i: number) => void }) {
  return (
    <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
      {items.map((label, i) => (
        <Chip key={label} active={active === i} onClick={() => onPick(i)}>{label}</Chip>
      ))}
    </div>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <span onClick={onClick} style={{ width: 34, height: 20, borderRadius: 9999, background: on ? "#28559c" : "#d1d5db", position: "relative", transition: "background .2s", cursor: "pointer", flexShrink: 0 }}>
      <span style={{ position: "absolute", top: 2, left: on ? 16 : 2, width: 16, height: 16, borderRadius: 9999, background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left .2s" }} />
    </span>
  );
}

const h1: CSSProperties = { margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" };
const subtitle: CSSProperties = { fontSize: 13, color: "#6b7280", marginTop: 4 };
const pill: CSSProperties = { background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 9999, padding: "9px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer" };
const closeBtn: CSSProperties = { width: 30, height: 30, borderRadius: 9999, background: "#F5F5F5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 13, color: "#6b7280", flexShrink: 0 };
const closeBtnSm: CSSProperties = { width: 28, height: 28, borderRadius: 9999, background: "#F5F5F5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 12, color: "#6b7280" };
const overlay = (z: number): CSSProperties => ({ position: "fixed", inset: 0, background: "rgba(17,24,39,0.45)", zIndex: z, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 });
const modalBox: CSSProperties = { background: "#ffffff", borderRadius: 20, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto", boxSizing: "border-box", padding: 26, boxShadow: "0 24px 80px rgba(17,24,39,0.25)" };
