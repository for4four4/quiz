"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { routes } from "@/lib/nav";

type Tab = "clients" | "plans" | "support";

const statusStyles = {
  active: { stBg: "rgba(22,101,52,0.1)", stColor: "#166534", status: "Активен" },
  trial: { stBg: "rgba(40,85,156,0.1)", stColor: "#28559c", status: "Триал" },
  overdue: { stBg: "rgba(224,52,47,0.1)", stColor: "#e0342f", status: "Просрочен" },
} as const;

const allClients = [
  { company: "Кухни-СПб", email: "german@kuhni-spb.ru", initials: "КС", avBg: "#28559c", plan: "Про · 300", usage: "212 / 318", paidTill: "12 авг", since: "апр 2026", ...statusStyles.active },
  { company: "РемонтПрофи", email: "alina@remontprofi.ru", initials: "РП", avBg: "#0F1F3C", plan: "Бизнес · 1000", usage: "640 / 1000", paidTill: "3 авг", since: "май 2026", ...statusStyles.active },
  { company: "Дента-Люкс", email: "sergey@dentalux.ru", initials: "ДЛ", avBg: "#4084f4", plan: "Старт · 100", usage: "44 / 118", paidTill: "28 июл", since: "май 2026", ...statusStyles.active },
  { company: "Автошкола Драйв", email: "olga@drive-ekb.ru", initials: "АД", avBg: "#1e437d", plan: "Про · 300", usage: "96 / 300", paidTill: "21 июл", since: "июн 2026", ...statusStyles.active },
  { company: "FitLife", email: "dmitry@fitlife-nsk.ru", initials: "FL", avBg: "#28559c", plan: "Старт · 100", usage: "12 / 100", paidTill: "—", since: "июл 2026", ...statusStyles.trial },
  { company: "Юрист-Групп", email: "elena@urist-group.ru", initials: "ЮГ", avBg: "#0F1F3C", plan: "Про · 300", usage: "287 / 300", paidTill: "9 июл", since: "апр 2026", ...statusStyles.overdue },
  { company: "Мебель-Арт", email: "igor@mebel-art.ru", initials: "МА", avBg: "#4084f4", plan: "Старт · 100", usage: "3 / 100", paidTill: "—", since: "июл 2026", ...statusStyles.trial },
];

const rawTickets = [
  { id: 341, subject: "Не приходят заявки в Telegram", company: "Дента-Люкс", when: "14 мин назад", st: "open", initials: "СВ", message: "Добрый день! Вчера подключили бота, но уведомления о новых заявках в Телеграм не приходят. В кабинете заявки видны. Что проверить?" },
  { id: 340, subject: "Вопрос про перенос лимита", company: "Кухни-СПб", when: "2 ч назад", st: "answered", initials: "ГК", message: "Подскажите, остаток заявок с июня переносится сам или нужно писать в поддержку?" },
  { id: 338, subject: "Оплата не прошла, тариф не продлился", company: "Юрист-Групп", when: "5 ч назад", st: "open", initials: "ЕК", message: "Оплатили продление картой, деньги списались, но тариф показывает «Просрочен». Помогите разобраться." },
  { id: 335, subject: "Как встроить квиз в Тильду?", company: "FitLife", when: "вчера", st: "open", initials: "ДН", message: "Собрали первый квиз, сайт на Тильде. Куда вставлять код со селектором?" },
];
const ticketStatus: Record<string, { stBg: string; stColor: string; status: string }> = {
  open: { stBg: "rgba(224,52,47,0.1)", stColor: "#e0342f", status: "Открыт" },
  answered: { stBg: "rgba(40,85,156,0.1)", stColor: "#28559c", status: "Отвечен" },
  closed: { stBg: "rgba(22,101,52,0.1)", stColor: "#166534", status: "Закрыт" },
};

function Icon({ paths }: { paths: string[] }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}
const navDef: { id: Tab; label: string; paths: string[]; badge?: string }[] = [
  { id: "clients", label: "Клиенты", paths: ["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M23 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"] },
  { id: "plans", label: "Тарифы", paths: ["M12 1v22", "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"] },
  { id: "support", label: "Поддержка", paths: ["M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"], badge: "3" },
];

const fmt = (n: number) => n.toLocaleString("ru-RU");
const planCounts: Record<string, number> = { start: 8, pro: 16, biz: 5 };
const planNames: Record<string, string> = { start: "Старт", pro: "Про", biz: "Бизнес" };

export function AdminApp() {
  const [tab, setTab] = useState<Tab>("clients");
  const [filter, setFilter] = useState("Все");
  const [prices, setPrices] = useState<Record<string, number>>({ start: 1900, pro: 3900, biz: 7900 });
  const [limits, setLimits] = useState<Record<string, number>>({ start: 100, pro: 300, biz: 1000 });
  const [enabled, setEnabled] = useState<Record<string, boolean>>({ start: true, pro: true, biz: true });
  const [saved, setSaved] = useState(false);
  const [activeTicket, setActiveTicket] = useState(0);
  const [draft, setDraft] = useState("");
  const [replies, setReplies] = useState<Record<number, string>>({ 1: "Добрый день! Да, перенос лимита работает автоматически — остаток уже виден у вас в кабинете." });
  const [closed, setClosed] = useState<Record<number, boolean>>({});

  const fmap: Record<string, string> = { Активные: "Активен", Триал: "Триал", Просроченные: "Просрочен" };
  const clients = filter === "Все" ? allClients : allClients.filter((c) => c.status === fmap[filter]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#EFEFEF", color: "#111827" }}>
      {/* Sidebar */}
      <div style={{ width: 248, flexShrink: 0, background: "#0F1F3C", color: "#ffffff", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 20px 16px" }}>
          <div style={{ width: 36, height: 36, borderRadius: 9999, background: "#28559c", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="2" y="3" width="16" height="3.2" rx="1.6" fill="#fff" opacity="0.55" /><rect x="2" y="8.4" width="16" height="3.2" rx="1.6" fill="#fff" opacity="0.8" /><rect x="2" y="13.8" width="9" height="3.2" rx="1.6" fill="#fff" /><path d="M13.5 15.4l1.6 1.6 3-3.4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.02em" }}><span style={{ color: "#8fb4ea" }}>Ква</span>лифай</div>
            <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.08em", color: "rgba(255,255,255,0.45)", textTransform: "uppercase" }}>Админ-панель</div>
          </div>
        </div>
        <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
          {navDef.map((n) => {
            const active = tab === n.id;
            return (
              <div key={n.id} onClick={() => setTab(n.id)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", borderRadius: 12, fontSize: 13.5, fontWeight: 500, cursor: "pointer", background: active ? "rgba(255,255,255,0.12)" : "transparent", color: active ? "#ffffff" : "rgba(255,255,255,0.6)", transition: "background .2s" }}>
                <span style={{ display: "flex", width: 18, height: 18, alignItems: "center", justifyContent: "center" }}><Icon paths={n.paths} /></span>
                <span>{n.label}</span>
                {n.badge && <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, background: "#e0342f", color: "#ffffff", borderRadius: 9999, padding: "2px 8px" }}>{n.badge}</span>}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <Link href={routes.home} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, color: "rgba(255,255,255,0.55)", padding: "0 6px" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>На сайт
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 4px" }}>
            <div style={{ width: 32, height: 32, borderRadius: 9999, background: "#28559c", color: "#ffffff", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>ВЛ</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Владелец</div>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.45)" }}>admin@qvalify.ru</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0, padding: "28px 32px", boxSizing: "border-box" }}>
        {tab === "clients" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
              <div><h1 style={h1}>Клиенты</h1><div style={sub}>37 компаний · 29 на платных тарифах</div></div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {["Все", "Активные", "Триал", "Просроченные"].map((label) => {
                  const active = filter === label;
                  return (
                    <div key={label} onClick={() => setFilter(label)} style={{ cursor: "pointer", fontSize: 12.5, fontWeight: 500, borderRadius: 9999, padding: "8px 16px", border: `1px solid ${active ? "#111827" : "#e5e7eb"}`, background: active ? "#111827" : "#ffffff", color: active ? "#ffffff" : "#111827", transition: "all .2s" }}>{label}</div>
                  );
                })}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginBottom: 20 }}>
              <Kpi label="MRR" value="96 300 ₽" note="+18% к июню" noteColor="#166534" />
              <Kpi label="Новых за июль" value="9" note="из них 6 — с платным тарифом" noteColor="#166534" />
              <Kpi label="Заявок через платформу" value="2 418" note="за 30 дней" noteColor="#6b7280" />
              <Kpi label="Отток" value="1" note="компания за месяц" noteColor="#e0342f" />
            </div>
            <div style={{ background: "#ffffff", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <div style={{ minWidth: 840 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 0.9fr 0.9fr 0.9fr 104px", gap: 16, padding: "14px 24px", borderBottom: "1px solid #f0f0f0", fontSize: 11.5, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    <div>Компания</div><div>Тариф</div><div>Заявок / лимит</div><div>Оплата до</div><div>Регистрация</div><div>Статус</div>
                  </div>
                  {clients.map((c) => (
                    <div key={c.email} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 0.9fr 0.9fr 0.9fr 104px", gap: 16, alignItems: "center", padding: "14px 24px", borderBottom: "1px solid #f7f7f7", fontSize: 13 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 9999, background: c.avBg, color: "#ffffff", fontSize: 11.5, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{c.initials}</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.company}</div>
                          <div style={{ fontSize: 11.5, color: "#9ca3af", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.email}</div>
                        </div>
                      </div>
                      <div style={{ whiteSpace: "nowrap" }}>{c.plan}</div>
                      <div style={{ color: "#6b7280", whiteSpace: "nowrap" }}>{c.usage}</div>
                      <div style={{ color: "#6b7280", whiteSpace: "nowrap" }}>{c.paidTill}</div>
                      <div style={{ color: "#6b7280", whiteSpace: "nowrap" }}>{c.since}</div>
                      <div style={{ fontSize: 11.5, fontWeight: 600, padding: "4px 10px", borderRadius: 9999, whiteSpace: "nowrap", textAlign: "center", background: c.stBg, color: c.stColor }}>{c.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "plans" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
              <div><h1 style={h1}>Тарифы</h1><div style={sub}>Цены и лимиты применяются к новым оплатам</div></div>
              <div onClick={() => setSaved(true)} style={{ cursor: "pointer", background: "#28559c", color: "#ffffff", fontSize: 13, fontWeight: 500, borderRadius: 9999, padding: "10px 22px" }}>{saved ? "✓ Сохранено" : "Сохранить изменения"}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16, maxWidth: 1100 }}>
              {(["start", "pro", "biz"] as const).map((id) => (
                <div key={id} style={{ background: "#ffffff", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 16, border: `1.5px solid ${enabled[id] ? "#e5e7eb" : "#f3d4d3"}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{planNames[id]}</div>
                    <div onClick={() => { setEnabled((e) => ({ ...e, [id]: !e[id] })); setSaved(false); }} style={{ cursor: "pointer", width: 38, height: 22, borderRadius: 9999, background: enabled[id] ? "#28559c" : "#d1d5db", position: "relative", transition: "background .2s", flexShrink: 0 }}>
                      <span style={{ position: "absolute", top: 3, left: enabled[id] ? 19 : 3, width: 16, height: 16, borderRadius: "50%", background: "#ffffff", transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,0.25)" }} />
                    </div>
                  </div>
                  <Stepper label="Цена в месяц" value={`${fmt(prices[id])} ₽`} onDown={() => { setPrices((p) => ({ ...p, [id]: Math.max(0, p[id] - 100) })); setSaved(false); }} onUp={() => { setPrices((p) => ({ ...p, [id]: p[id] + 100 })); setSaved(false); }} />
                  <Stepper label="Лимит заявок" value={fmt(limits[id])} onDown={() => { setLimits((l) => ({ ...l, [id]: Math.max(50, l[id] - 50) })); setSaved(false); }} onUp={() => { setLimits((l) => ({ ...l, [id]: l[id] + 50 })); setSaved(false); }} />
                  <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 14, display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "#6b7280" }}>
                    <span>Клиентов на тарифе</span><span style={{ fontWeight: 600, color: "#111827" }}>{planCounts[id]}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ maxWidth: 1100, background: "rgba(40,85,156,0.06)", borderRadius: 12, padding: "14px 18px", fontSize: 13, color: "#28559c", marginTop: 16 }}>Изменения не затрагивают действующие оплаченные периоды — клиенты увидят новые цены при продлении.</div>
          </div>
        )}

        {tab === "support" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
              <div><h1 style={h1}>Поддержка</h1><div style={sub}>3 открытых тикета · среднее время ответа 26 мин</div></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(300px,380px) 1fr", gap: 16, alignItems: "start" }} className="qv-anal-grid">
              <div style={{ background: "#ffffff", borderRadius: 16, overflow: "hidden" }}>
                {rawTickets.map((t, i) => {
                  const isClosed = closed[i];
                  const answered = !!replies[i];
                  const badge = isClosed ? ticketStatus.closed : answered ? ticketStatus.answered : ticketStatus[t.st];
                  const active = activeTicket === i;
                  return (
                    <div key={t.id} onClick={() => { setActiveTicket(i); setDraft(""); }} style={{ cursor: "pointer", padding: "16px 20px", borderBottom: "1px solid #f5f5f5", borderLeft: `3px solid ${active ? "#28559c" : "transparent"}`, background: active ? "rgba(40,85,156,0.05)" : "#ffffff", transition: "background .15s" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.subject}</div>
                        <div style={{ fontSize: 11.5, fontWeight: 600, padding: "3px 9px", borderRadius: 9999, whiteSpace: "nowrap", background: badge.stBg, color: badge.stColor }}>{badge.status}</div>
                      </div>
                      <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 5 }}>{t.company} · {t.when}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ background: "#ffffff", borderRadius: 16, padding: 24, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", borderBottom: "1px solid #f0f0f0", paddingBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{rawTickets[activeTicket].subject}</div>
                    <div style={{ fontSize: 12.5, color: "#9ca3af", marginTop: 4 }}>{rawTickets[activeTicket].company} · тикет #{rawTickets[activeTicket].id}</div>
                  </div>
                  <div onClick={() => setClosed((c) => ({ ...c, [activeTicket]: true }))} style={{ cursor: "pointer", fontSize: 12.5, fontWeight: 500, border: "1px solid #e5e7eb", borderRadius: 9999, padding: "8px 16px" }}>{closed[activeTicket] ? "✓ Закрыт" : "Закрыть тикет"}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "20px 0" }}>
                  <div style={{ display: "flex", gap: 12, maxWidth: 560 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 9999, background: "#e5e7eb", color: "#4b5563", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{rawTickets[activeTicket].initials}</div>
                    <div style={{ background: "#f5f6f8", borderRadius: "4px 14px 14px 14px", padding: "12px 16px", fontSize: 13.5, lineHeight: 1.6 }}>{rawTickets[activeTicket].message}</div>
                  </div>
                  {replies[activeTicket] && (
                    <div style={{ display: "flex", gap: 12, maxWidth: 560, marginLeft: "auto", flexDirection: "row-reverse" }}>
                      <div style={{ width: 30, height: 30, borderRadius: 9999, background: "#28559c", color: "#ffffff", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>ВЛ</div>
                      <div style={{ background: "rgba(40,85,156,0.08)", borderRadius: "14px 4px 14px 14px", padding: "12px 16px", fontSize: 13.5, lineHeight: 1.6 }}>{replies[activeTicket]}</div>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 10, borderTop: "1px solid #f0f0f0", paddingTop: 16 }}>
                  <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ответ клиенту…" style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 12, padding: "11px 16px", fontSize: 13.5, fontFamily: "inherit", outline: "none", boxSizing: "border-box", minWidth: 0 }} />
                  <div onClick={() => { if (draft.trim()) { setReplies((r) => ({ ...r, [activeTicket]: draft.trim() })); setDraft(""); } }} style={{ cursor: "pointer", background: "#28559c", color: "#ffffff", borderRadius: 12, padding: "11px 20px", fontSize: 13.5, fontWeight: 500, whiteSpace: "nowrap" }}>Отправить</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, note, noteColor }: { label: string; value: string; note: string; noteColor: string }) {
  return (
    <div style={{ background: "#ffffff", borderRadius: 16, padding: 20 }}>
      <div style={{ fontSize: 12.5, color: "#6b7280" }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 6 }}>{value}</div>
      <div style={{ fontSize: 12, color: noteColor, marginTop: 4 }}>{note}</div>
    </div>
  );
}

function Stepper({ label, value, onDown, onUp }: { label: string; value: string; onDown: () => void; onUp: () => void }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div onClick={onDown} style={stepBtn}>−</div>
        <div style={{ flex: 1, textAlign: "center", fontSize: 19, fontWeight: 600, letterSpacing: "-0.01em" }}>{value}</div>
        <div onClick={onUp} style={stepBtn}>+</div>
      </div>
    </div>
  );
}

const h1: CSSProperties = { margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" };
const sub: CSSProperties = { fontSize: 13, color: "#6b7280", marginTop: 4 };
const stepBtn: CSSProperties = { cursor: "pointer", width: 30, height: 30, borderRadius: 9, border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, color: "#6b7280", userSelect: "none" };
