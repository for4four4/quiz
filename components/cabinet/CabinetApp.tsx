"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { routes } from "@/lib/nav";
import {
  bars,
  columns,
  crmLeads,
  crmQuizzes,
  dropSteps,
  funnel,
  integDefs,
  integList,
  kpis,
  navDef,
  quizzes,
} from "./data";

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
const qNames = ["Все квизы", "Подбор кухни", "Шкафы-купе", "Ремонт под ключ"];
const wTypeDefs: [string, string, string, string][] = [
  ["bars", "▥", "Заявки по дням", "Столбчатый график за период"],
  ["funnel", "▼", "Воронка шагов", "Где люди выходят из квиза"],
  ["cr", "%", "Конверсия в заявку", "Крупная цифра с динамикой"],
  ["sources", "⇆", "Источники заявок", "Блок, кнопка или ссылка"],
  ["hot", "🔥", "Горячие лиды", "Топ по ИИ-скорингу"],
];

type Tab = "dash" | "quizzes" | "leads" | "integ" | "settings";

export function CabinetApp() {
  const [tab, setTab] = useState<Tab>("dash");
  const [menuOpen, setMenuOpen] = useState(false);

  const [widgets, setWidgets] = useState<{ t: string; q: number }[]>([
    { t: "bars", q: 0 },
    { t: "funnel", q: 1 },
  ]);
  const [wOpen, setWOpen] = useState(false);
  const [wQuiz, setWQuiz] = useState(0);
  const [wType, setWType] = useState(0);

  const [crmQuiz, setCrmQuiz] = useState<number | null>(null);
  const [crmTab, setCrmTab] = useState<"board" | "anal">("board");
  const [lead, setLead] = useState<number | null>(null);
  const [leadTab, setLeadTab] = useState<"overview" | "answers" | "actions">("overview");

  const [igIdx, setIgIdx] = useState<number | null>(null);
  const [igVals, setIgVals] = useState<Record<string, string>>({});
  const [igTg, setIgTg] = useState(true);
  const [igTested, setIgTested] = useState(false);
  const [connected, setConnected] = useState<Record<number, boolean>>({ 0: true, 1: true, 2: true, 6: true });

  const [aiOpen, setAiOpen] = useState(false);
  const [aiPhase, setAiPhase] = useState<"idle" | "busy" | "done">("idle");
  const [aiGoal, setAiGoal] = useState(1);
  const [aiBonus, setAiBonus] = useState(0);
  const [aiTone, setAiTone] = useState(0);
  const [aiQn, setAiQn] = useState(5);
  const [aiCalc, setAiCalc] = useState(true);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiStage, setAiStage] = useState("");
  const aiTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (aiTimer.current) clearInterval(aiTimer.current); }, []);

  const runAiFlow = () => {
    const stages = ["Изучаем нишу и аудиторию…", "Пишем вопросы и варианты…", "Собираем калькулятор и обложку…"];
    setAiPhase("busy");
    setAiProgress(8);
    setAiStage(stages[0]);
    let i = 0;
    aiTimer.current = setInterval(() => {
      i++;
      if (i >= 3) {
        if (aiTimer.current) clearInterval(aiTimer.current);
        setAiPhase("done");
        return;
      }
      setAiStage(stages[i]);
      setAiProgress(8 + i * 38);
    }, 1400);
  };
  const closeAi = () => {
    if (aiTimer.current) clearInterval(aiTimer.current);
    setAiOpen(false);
    setAiPhase("idle");
  };

  const ld = lead ? crmLeads.find((l) => l.id === lead) ?? null : null;
  const stop = (e: React.MouseEvent) => e.stopPropagation();

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
          {navDef.map(([id, label, d, badge]) => {
            const active = tab === id;
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
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8 }}><span style={{ fontWeight: 600 }}>Тариф Про · 300</span><span style={{ color: "#6b7280" }}>212 из 318</span></div>
            <div style={{ height: 6, background: "#e5e7eb", borderRadius: 9999, overflow: "hidden" }}><div style={{ width: "67%", height: "100%", background: "#28559c", borderRadius: 9999 }} /></div>
            <div style={{ fontSize: 11.5, color: "#6b7280", marginTop: 8 }}>18 заявок перенесено с июня</div>
          </div>
          <div className="kc-profile" style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 4px" }}>
            <div style={{ width: 32, height: 32, borderRadius: 9999, background: "#28559c", color: "#ffffff", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>ГК</div>
            <div className="kc-label" style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Герман</div>
              <div style={{ fontSize: 11.5, color: "#9ca3af" }}>german@kuhni-spb.ru</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="kc-main" style={{ flex: 1, minWidth: 0, padding: "28px 32px", boxSizing: "border-box" }}>
        {tab === "dash" && (
          <Dashboard
            widgets={widgets}
            onOpenWidget={() => setWOpen(true)}
            onNewQuiz={() => setTab("quizzes")}
            onRemove={(i) => setWidgets((w) => w.filter((_, j) => j !== i))}
          />
        )}
        {tab === "quizzes" && <QuizzesSection onAi={() => { setAiOpen(true); setAiPhase("idle"); }} />}
        {tab === "leads" && (
          <LeadsSection
            crmQuiz={crmQuiz}
            setCrmQuiz={setCrmQuiz}
            crmTab={crmTab}
            setCrmTab={setCrmTab}
            openLead={(id) => { setLead(id); setLeadTab("overview"); }}
          />
        )}
        {tab === "integ" && (
          <IntegSection connected={connected} onOpen={(idx) => { setIgIdx(idx); setIgTested(false); }} />
        )}
        {tab === "settings" && <SettingsSection />}
      </div>

      {/* Lead modal */}
      {ld && (
        <div onClick={() => setLead(null)} style={{ position: "fixed", inset: 0, background: "rgba(17,24,39,0.45)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(12px,4vw,32px)", boxSizing: "border-box" }}>
          <div onClick={stop} style={{ width: 560, maxWidth: "100%", maxHeight: "90vh", background: "#ffffff", borderRadius: 20, overflow: "hidden", boxSizing: "border-box", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(17,24,39,0.28)" }}>
            <div style={{ padding: "22px clamp(18px,4vw,26px) 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em" }}>{ld.name}</div>
                  <div style={{ fontSize: 13, color: "#6b7280", marginTop: 3 }}>{ld.phone} · {ld.when}</div>
                </div>
                <div onClick={() => setLead(null)} style={closeBtn}>✕</div>
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
                  <div style={{ background: ld.heatBg, borderRadius: 16, padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: ld.heatColor }}>{ld.heat} лид</span>
                      <span style={{ fontSize: 18, fontWeight: 700, color: ld.heatColor }}>{ld.score}<span style={{ fontSize: 11, fontWeight: 500, opacity: 0.7 }}>/100</span></span>
                    </div>
                    <div style={{ height: 6, background: "rgba(255,255,255,0.6)", borderRadius: 9999, overflow: "hidden" }}><div style={{ height: "100%", background: ld.heatColor, borderRadius: 9999, width: `${ld.score}%` }} /></div>
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>{SPARK}Обобщение ИИ</div>
                    <div style={{ fontSize: 13, lineHeight: 1.65, color: "#374151", background: "#F8F9FB", borderRadius: 14, padding: "14px 16px" }}>{ld.summary}</div>
                  </div>
                </>
              )}
              {leadTab === "answers" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {ld.answers.map((a, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12.5, border: "1px solid #f0f0f0", borderRadius: 12, padding: "11px 14px" }}>
                      <span style={{ color: "#6b7280", flex: 1 }}>{a.q}</span>
                      <b style={{ textAlign: "right" }}>{a.a}</b>
                      <span style={{ fontSize: 10.5, color: "#9ca3af", background: "#F5F5F5", borderRadius: 9999, padding: "2px 8px", whiteSpace: "nowrap" }}>{a.t}</span>
                    </div>
                  ))}
                </div>
              )}
              {leadTab === "actions" && (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {ld.timeline.map((t, i) => (
                    <div key={i} style={{ display: "flex", gap: 12 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.hot ? "#28559c" : "#d1d5db", marginTop: 5 }} />
                        <span style={{ width: 1.5, flex: 1, background: "#eceef2" }} />
                      </div>
                      <div style={{ paddingBottom: 14, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 500 }}>{t.e}</div>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{t.meta}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "16px clamp(18px,4vw,26px)", borderTop: "1px solid #f3f4f6" }}>
              <div style={{ flex: 1, minWidth: 140, textAlign: "center", background: "#28559c", color: "#ffffff", borderRadius: 9999, padding: "11px 0", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Взять в работу</div>
              <div style={{ flex: 1, minWidth: 140, textAlign: "center", border: "1px solid #e5e7eb", borderRadius: 9999, padding: "11px 0", fontSize: 13, fontWeight: 500, cursor: "pointer", boxSizing: "border-box" }}>В amoCRM</div>
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
          onSave={() => { setConnected((c) => ({ ...c, [igIdx]: true })); setIgIdx(null); }}
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
              {qNames.map((label, i) => (
                <Chip key={label} active={wQuiz === i} onClick={() => setWQuiz(i)}>{label}</Chip>
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
                <div style={{ fontSize: 16, fontWeight: 600 }}>Квиз «Подбор кухни под ваш бюджет» готов</div>
                <div style={{ fontSize: 12.5, color: "#6b7280", lineHeight: 1.6 }}>Обложка, {aiQn} вопросов с ветвлением, калькулятор стоимости и форма контактов со скидкой. Сохранён в черновики.</div>
                <div style={{ display: "flex", gap: 10, width: "100%", maxWidth: 360 }}>
                  <Link href={routes.editor} style={{ flex: 1, textAlign: "center", background: "#28559c", color: "#ffffff", borderRadius: 9999, padding: "11px 0", fontSize: 13, fontWeight: 500 }}>Открыть в редакторе</Link>
                  <div onClick={closeAi} style={{ flex: 1, textAlign: "center", border: "1px solid #e5e7eb", borderRadius: 9999, padding: "11px 0", fontSize: 13, fontWeight: 500, cursor: "pointer", boxSizing: "border-box" }}>Позже</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Sections ---------- */

function Dashboard({ widgets, onOpenWidget, onNewQuiz, onRemove }: { widgets: { t: string; q: number }[]; onOpenWidget: () => void; onNewQuiz: () => void; onRemove: (i: number) => void }) {
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
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{qNames[w.q]}</div>
            </div>
            <WidgetBody type={w.t} />
          </div>
        ))}
      </div>
    </div>
  );
}

function WidgetBody({ type }: { type: string }) {
  if (type === "bars") {
    return (
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 140 }}>
        {bars.map((b) => (
          <div key={b.d} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
            <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>{b.v}</div>
            <div style={{ width: "100%", maxWidth: 44, borderRadius: "8px 8px 4px 4px", background: b.color, height: b.h }} />
            <div style={{ fontSize: 11, color: "#9ca3af" }}>{b.d}</div>
          </div>
        ))}
      </div>
    );
  }
  if (type === "funnel") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {funnel.map((f) => (
          <div key={f.label}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}><span style={{ color: "#374151" }}>{f.label}</span><span style={{ color: "#6b7280", fontWeight: 600 }}>{f.n}</span></div>
            <div style={{ height: 8, background: "#f3f4f6", borderRadius: 9999, overflow: "hidden" }}><div style={{ height: "100%", borderRadius: 9999, background: "#28559c", opacity: f.op, width: f.w }} /></div>
          </div>
        ))}
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>Конверсия в заявку — <b style={{ color: "#166534" }}>24%</b></div>
      </div>
    );
  }
  if (type === "sources") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 12.5 }}>
        {[["Встроенный блок", "29"], ["Плавающая кнопка", "17"], ["Прямая ссылка", "6"]].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#6b7280" }}>{k}</span><b>{v}</b></div>
        ))}
      </div>
    );
  }
  if (type === "hot") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[["Анна Соколова", "🔥 87", "rgba(194,65,12,0.10)", "#c2410c"], ["Ольга Черных", "🔥 78", "rgba(194,65,12,0.10)", "#c2410c"], ["Дмитрий Ефимов", "61", "rgba(40,85,156,0.10)", "#28559c"]].map(([n, s, bg, col]) => (
          <div key={n} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5 }}>
            <span style={{ fontWeight: 500 }}>{n}</span>
            <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 9999, background: bg, color: col }}>{s}</span>
          </div>
        ))}
      </div>
    );
  }
  // cr
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 38, fontWeight: 600, letterSpacing: "-0.03em" }}>6,2%</div>
      <div style={{ fontSize: 12, color: "#166534", fontWeight: 500 }}>+0,8 п.п. к прошлой неделе</div>
    </div>
  );
}

function QuizzesSection({ onAi }: { onAi: () => void }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <div>
          <h1 style={h1}>Квизы</h1>
          <div style={subtitle}>3 активных · 1 черновик</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div onClick={onAi} style={{ ...pill, display: "flex", alignItems: "center", gap: 7 }}>{SPARK}Сгенерировать ИИ</div>
          <div style={{ background: "#28559c", color: "#ffffff", borderRadius: 9999, padding: "9px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>+ Новый квиз</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
        {quizzes.map((q) => (
          <div key={q.name} style={{ background: "#ffffff", borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 9999, background: q.stBg, color: q.stColor }}>{q.st}</div>
              <div style={{ color: "#9ca3af", fontSize: 16, cursor: "pointer", letterSpacing: 2 }}>···</div>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>{q.name}</div>
              <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 4 }}>{q.where}</div>
            </div>
            <div style={{ display: "flex", gap: 18, fontSize: 12.5, color: "#6b7280", borderTop: "1px solid #f3f4f6", paddingTop: 14 }}>
              <span><b style={{ color: "#111827", fontWeight: 600 }}>{q.views}</b> показов</span>
              <span><b style={{ color: "#111827", fontWeight: 600 }}>{q.leads}</b> заявок</span>
              <span><b style={{ color: "#166534", fontWeight: 600 }}>{q.cr}</b> CR</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Link href={routes.editor} style={{ flex: 1, textAlign: "center", border: "1px solid #e5e7eb", borderRadius: 9999, padding: "8px 0", fontSize: 12.5, fontWeight: 500 }}>Редактор</Link>
              <div style={{ flex: 1, textAlign: "center", border: "1px solid #e5e7eb", borderRadius: 9999, padding: "8px 0", fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}>Статистика</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeadsSection({ crmQuiz, setCrmQuiz, crmTab, setCrmTab, openLead }: { crmQuiz: number | null; setCrmQuiz: (v: number | null) => void; crmTab: "board" | "anal"; setCrmTab: (v: "board" | "anal") => void; openLead: (id: number) => void }) {
  if (crmQuiz === null) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
          <div><h1 style={h1}>Заявки</h1><div style={subtitle}>Встроенная CRM · выберите квиз</div></div>
          <div style={pill}>Экспорт CSV</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 16 }}>
          {crmQuizzes.map((q, i) => (
            <div key={q.name} onClick={() => { setCrmQuiz(i); setCrmTab("board"); }} className="qv-lift" style={{ background: "#ffffff", borderRadius: 20, padding: 22, cursor: "pointer", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>{q.name}</div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, padding: "4px 10px", borderRadius: 9999, background: "rgba(40,85,156,0.10)", color: "#28559c" }}>{q.new} новых</span>
                <span style={{ fontSize: 11.5, fontWeight: 600, padding: "4px 10px", borderRadius: 9999, background: "rgba(17,24,39,0.07)", color: "#111827" }}>{q.work} в работе</span>
                <span style={{ fontSize: 11.5, fontWeight: 600, padding: "4px 10px", borderRadius: 9999, background: "rgba(22,101,52,0.10)", color: "#166534" }}>{q.done} успешных</span>
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 12.5, color: "#6b7280", borderTop: "1px solid #f3f4f6", paddingTop: 12 }}>
                <span>🔥 <b style={{ color: "#111827" }}>{q.hot}</b> горячих</span>
                <span>дошли до конца — <b style={{ color: "#111827" }}>{q.finish}</b></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <div onClick={() => setCrmQuiz(null)} style={{ width: 34, height: 34, borderRadius: 9999, background: "#ffffff", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          </div>
          <div>
            <h1 style={{ ...h1, fontSize: 20 }}>{["Подбор кухни", "Шкафы-купе", "Ремонт под ключ"][crmQuiz]}</h1>
            <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 2 }}>52 заявки в июле · конверсия 7,1%</div>
          </div>
        </div>
        <div style={{ display: "flex", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 9999, padding: 3 }}>
          {(["board", "anal"] as const).map((t) => (
            <div key={t} onClick={() => setCrmTab(t)} style={{ borderRadius: 9999, padding: "7px 18px", fontSize: 12.5, fontWeight: 500, cursor: "pointer", background: crmTab === t ? "#111827" : "transparent", color: crmTab === t ? "#ffffff" : "#374151", transition: "background .2s" }}>{t === "board" ? "Канбан" : "Аналитика шагов"}</div>
          ))}
        </div>
      </div>

      {crmTab === "board" ? (
        <div style={{ overflowX: "auto", paddingBottom: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(240px,1fr))", gap: 14, minWidth: 1000 }}>
            {columns.map((col, ci) => {
              const cards = crmLeads.filter((l) => l.col === ci);
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
                        <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 9999, background: c.heatBg, color: c.heatColor, whiteSpace: "nowrap", flexShrink: 0 }}>{c.heat}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{c.phone}</div>
                      <div style={{ fontSize: 11.5, lineHeight: 1.5, color: "#374151", background: "#F8F9FB", borderRadius: 10, padding: "8px 10px", display: "flex", gap: 6 }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#28559c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" /></svg>
                        <span>{c.summary.split(".")[0]}.</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>{c.when}</div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, alignItems: "start" }} className="qv-anal-grid">
          <div style={{ background: "#ffffff", borderRadius: 20, padding: 22, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Где выходят люди</div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 18 }}>1 391 открытие за 7 дней</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {dropSteps.map((d) => (
                <div key={d.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12.5, marginBottom: 5 }}>
                    <span style={{ fontWeight: 500 }}>{d.label}</span>
                    <span style={{ color: "#6b7280", whiteSpace: "nowrap" }}>{d.n} · <b style={{ color: d.dropColor }}>−{d.drop}</b>{d.time && <> · ⌀ {d.time}</>}</span>
                  </div>
                  <div style={{ height: 10, background: "#f3f4f6", borderRadius: 9999, overflow: "hidden", display: "flex" }}><div style={{ height: "100%", background: "#28559c", opacity: d.op, borderRadius: 9999, width: d.w }} /></div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 18, fontSize: 12.5, lineHeight: 1.6, color: "#374151", background: "#F8F9FB", borderRadius: 12, padding: "12px 14px", display: "flex", gap: 8 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#28559c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 3 }}><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" /></svg>
              <span><b>Вывод ИИ:</b> главный отвал — шаг «Бюджет» (−31%). Люди задерживаются на нём 34 сек — вероятно, вариантов мало или диапазоны неудачные. Попробуйте добавить вариант «Пока не знаю».</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
            <div style={{ background: "#ffffff", borderRadius: 20, padding: 22 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>События за 7 дней</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12.5 }}>
                {[["Клики «Начать расчёт»", "1 391"], ["Средняя глубина", "4,1 из 6 шагов"], ["Среднее время в квизе", "1 мин 48 сек"], ["Возвраты на шаг назад", "217"], ["Досмотр обложки (скролл)", "84%"]].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#6b7280" }}>{k}</span><b>{v}</b></div>
                ))}
              </div>
            </div>
            <div style={{ background: "#ffffff", borderRadius: 20, padding: 22 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Источники заявок</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12.5 }}>
                {[["Встроенный блок", "29"], ["Плавающая кнопка", "17"], ["Прямая ссылка", "6"]].map(([k, v]) => (
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

function SettingsSection() {
  return (
    <div>
      <div style={{ marginBottom: 24 }}><h1 style={h1}>Настройки</h1><div style={subtitle}>Аккаунт и тариф</div></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16, maxWidth: 920 }}>
        <div style={{ background: "#ffffff", borderRadius: 20, padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Профиль</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
            {[["Имя", "Герман"], ["Почта", "german@kuhni-spb.ru"], ["Компания", "Кухни СПб"]].map(([l, v]) => (
              <div key={l}>
                <div style={{ color: "#9ca3af", fontSize: 12, marginBottom: 5 }}>{l}</div>
                <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "10px 14px" }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: "#ffffff", borderRadius: 20, padding: 24, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Тариф</div>
          <div style={{ background: "#28559c", color: "#ffffff", borderRadius: 16, padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Про · 300 заявок</div>
              <div style={{ fontSize: 12, background: "#ffffff", color: "#28559c", borderRadius: 9999, padding: "3px 10px", fontWeight: 600 }}>Активен</div>
            </div>
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.75)", marginTop: 8 }}>2 790 ₽/мес · следующее списание 1 августа</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "14px 4px 0", color: "#6b7280" }}><span>Остаток заявок</span><b style={{ color: "#111827" }}>106 из 318</b></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "8px 4px 0", color: "#6b7280" }}><span>Перенесено с июня</span><b style={{ color: "#166534" }}>18</b></div>
          <div style={{ marginTop: "auto", paddingTop: 18, display: "flex", gap: 8 }}>
            <Link href={routes.tarify} style={{ flex: 1, textAlign: "center", border: "1px solid #e5e7eb", borderRadius: 9999, padding: "9px 0", fontSize: 12.5, fontWeight: 500 }}>Сменить тариф</Link>
            <div style={{ flex: 1, textAlign: "center", border: "1px solid #e5e7eb", borderRadius: 9999, padding: "9px 0", fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}>История оплат</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Modals ---------- */

function IntegModal({ idx, vals, setVals, tg, setTg, tested, setTested, connected, onSave, onClose, stop }: {
  idx: number; vals: Record<string, string>; setVals: (f: (v: Record<string, string>) => Record<string, string>) => void;
  tg: boolean; setTg: (v: boolean) => void; tested: boolean; setTested: (v: boolean) => void;
  connected: boolean; onSave: () => void; onClose: () => void; stop: (e: React.MouseEvent) => void;
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
          <div onClick={() => setTested(true)} style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 9999, padding: "12px 0", fontSize: 13.5, fontWeight: 500, textAlign: "center", cursor: "pointer", boxSizing: "border-box", color: tested ? "#166534" : "#374151" }}>{tested ? "✓ Тест прошёл" : "Тест"}</div>
        </div>
      </div>
    </div>
  );
}

function AiIdle({ onClose, aiGoal, setAiGoal, aiBonus, setAiBonus, aiTone, setAiTone, aiQn, setAiQn, aiCalc, setAiCalc, onRun }: {
  onClose: () => void;
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
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "12px 14px", fontSize: 13.5, lineHeight: 1.5, color: "#111827", minHeight: 56 }}>Студия кухонь на заказ в Санкт-Петербурге. Средний чек 350 тысяч, срок изготовления 30 дней, бесплатный замер.</div>
        </div>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>Цель квиза</div>
          <ChipRow items={["Заявки и лиды", "Расчёт стоимости", "Подбор товара", "Опрос клиентов"]} active={aiGoal} onPick={setAiGoal} />
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 8 }}><span style={{ fontWeight: 600 }}>Количество вопросов</span><b style={{ color: "#28559c" }}>{aiQn}</b></div>
          <input type="range" min={3} max={10} value={aiQn} onChange={(e) => setAiQn(+e.target.value)} style={{ width: "100%", accentColor: "#28559c" }} />
        </div>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>Бонус за прохождение</div>
          <ChipRow items={["Скидка", "Подарок", "Консультация", "Без бонуса"]} active={aiBonus} onPick={setAiBonus} />
        </div>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>Тон текстов</div>
          <ChipRow items={["Дружелюбный", "Деловой", "Экспертный"]} active={aiTone} onPick={setAiTone} />
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
