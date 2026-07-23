"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { routes } from "@/lib/nav";
import { api, type AdminUser, type SiteSettings } from "@/lib/client/api";

type Tab = "clients" | "settings" | "plans" | "support";

const PLAN_NAMES: Record<string, string> = { free: "Free", start: "Старт", pro: "Про", biz: "Бизнес" };

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
  { id: "clients", label: "Пользователи", paths: ["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M23 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"] },
  { id: "settings", label: "Настройки сайта", paths: ["M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"] },
  { id: "plans", label: "Тарифы", paths: ["M12 1v22", "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"] },
  { id: "support", label: "Поддержка", paths: ["M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"] },
];

const fmt = (n: number) => n.toLocaleString("ru-RU");
const planCounts: Record<string, number> = { start: 8, pro: 16, biz: 5 };
const planNames: Record<string, string> = { start: "Старт", pro: "Про", biz: "Бизнес" };

export function AdminApp() {
  const [tab, setTab] = useState<Tab>("clients");
  const [filter, setFilter] = useState("");

  // Реальные пользователи
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const loadUsers = () => { setLoadingUsers(true); api.adminUsers().then(({ users }) => setUsers(users)).catch(() => {}).finally(() => setLoadingUsers(false)); };
  useEffect(() => { loadUsers(); }, []);

  const [prices, setPrices] = useState<Record<string, number>>({ start: 1900, pro: 3900, biz: 7900 });
  const [limits, setLimits] = useState<Record<string, number>>({ start: 100, pro: 300, biz: 1000 });
  const [enabled, setEnabled] = useState<Record<string, boolean>>({ start: true, pro: true, biz: true });
  const [saved, setSaved] = useState(false);
  const [activeTicket, setActiveTicket] = useState(0);
  const [draft, setDraft] = useState("");
  const [replies, setReplies] = useState<Record<number, string>>({ 1: "Добрый день! Да, перенос лимита работает автоматически — остаток уже виден у вас в кабинете." });
  const [closed, setClosed] = useState<Record<number, boolean>>({});

  const q = filter.trim().toLowerCase();
  const shownUsers = q ? users.filter((u) => (u.email + " " + u.name + " " + u.company).toLowerCase().includes(q)) : users;
  const paidCount = users.filter((u) => u.plan && u.plan !== "free").length;
  const totalLeads = users.reduce((s, u) => s + Number(u.leads || 0), 0);
  const totalQuizzes = users.reduce((s, u) => s + Number(u.quizzes || 0), 0);

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
              <div><h1 style={h1}>Пользователи</h1><div style={sub}>{users.length} всего · {paidCount} на платных тарифах</div></div>
              <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Поиск по почте, имени, компании" style={{ border: "1px solid #e5e7eb", borderRadius: 9999, padding: "9px 16px", fontSize: 13, fontFamily: "inherit", width: 280, maxWidth: "100%", outlineColor: "#28559c" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginBottom: 20 }}>
              <Kpi label="Пользователей" value={fmt(users.length)} note={`${paidCount} на платных`} noteColor="#166534" />
              <Kpi label="Квизов" value={fmt(totalQuizzes)} note="создано всего" noteColor="#6b7280" />
              <Kpi label="Заявок через платформу" value={fmt(totalLeads)} note="за всё время" noteColor="#6b7280" />
              <Kpi label="Free" value={fmt(users.length - paidCount)} note="без оплаты" noteColor="#6b7280" />
            </div>
            <div style={{ background: "#ffffff", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <div style={{ minWidth: 860 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 0.9fr 0.9fr 0.8fr 96px", gap: 16, padding: "14px 24px", borderBottom: "1px solid #f0f0f0", fontSize: 11.5, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    <div>Пользователь</div><div>Тариф</div><div>Заявок / лимит</div><div>Действует до</div><div>Регистрация</div><div>Действие</div>
                  </div>
                  {loadingUsers ? (
                    <div style={{ padding: "28px 24px", color: "#9ca3af", fontSize: 13 }}>Загрузка…</div>
                  ) : shownUsers.length === 0 ? (
                    <div style={{ padding: "28px 24px", color: "#9ca3af", fontSize: 13 }}>Пользователи не найдены</div>
                  ) : shownUsers.map((u) => {
                    const expired = u.valid_until && new Date(u.valid_until) < new Date();
                    return (
                      <div key={u.id} style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 0.9fr 0.9fr 0.8fr 96px", gap: 16, alignItems: "center", padding: "14px 24px", borderBottom: "1px solid #f7f7f7", fontSize: 13 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 9999, background: "#28559c", color: "#ffffff", fontSize: 11.5, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{(u.name || u.email).slice(0, 2).toUpperCase()}</div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name || u.company || "—"} {u.role === "admin" && <span style={{ fontSize: 10, color: "#28559c" }}>· admin</span>}</div>
                            <div style={{ fontSize: 11.5, color: "#9ca3af", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</div>
                          </div>
                        </div>
                        <div style={{ whiteSpace: "nowrap" }}><span style={{ fontSize: 11.5, fontWeight: 600, padding: "3px 10px", borderRadius: 9999, background: u.plan === "free" ? "rgba(17,24,39,0.07)" : "rgba(40,85,156,0.1)", color: u.plan === "free" ? "#6b7280" : "#28559c" }}>{PLAN_NAMES[u.plan] || u.plan}</span></div>
                        <div style={{ color: "#6b7280", whiteSpace: "nowrap" }}>{fmt(Number(u.leads || 0))} / {fmt(u.lead_limit)}</div>
                        <div style={{ color: expired ? "#e0342f" : "#6b7280", whiteSpace: "nowrap" }}>{u.valid_until ? new Date(u.valid_until).toLocaleDateString("ru-RU") : "—"}</div>
                        <div style={{ color: "#6b7280", whiteSpace: "nowrap" }}>{new Date(u.created_at).toLocaleDateString("ru-RU")}</div>
                        <div onClick={() => setEditUser(u)} style={{ cursor: "pointer", fontSize: 12.5, fontWeight: 500, color: "#28559c", textAlign: "center", border: "1px solid #e5e7eb", borderRadius: 9999, padding: "6px 0" }}>Изменить</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "settings" && <SettingsSection />}

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
      {editUser && <EditUserModal user={editUser} onClose={() => setEditUser(null)} onSaved={() => { setEditUser(null); loadUsers(); }} />}
    </div>
  );
}

/* ── Изменение тарифа/лимита/срока пользователя ─────────── */
function EditUserModal({ user, onClose, onSaved }: { user: AdminUser; onClose: () => void; onSaved: () => void }) {
  const [plan, setPlan] = useState(user.plan);
  const [leadLimit, setLeadLimit] = useState(String(user.lead_limit));
  const [validUntil, setValidUntil] = useState(user.valid_until ? user.valid_until.slice(0, 10) : "");
  const [role, setRole] = useState(user.role);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const save = async () => {
    setBusy(true); setErr("");
    try {
      await api.adminUpdateUser(user.id, { plan, leadLimit: Number(leadLimit) || 0, validUntil: validUntil || null, role });
      onSaved();
    } catch (e) { setErr(e instanceof Error ? e.message : "Ошибка"); setBusy(false); }
  };

  const lbl: CSSProperties = { fontSize: 12, color: "#6b7280", marginBottom: 5, display: "block" };
  const field: CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid #e5e7eb", borderRadius: 10, padding: "9px 12px", fontSize: 13.5, fontFamily: "inherit", outlineColor: "#28559c" };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 80 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 18, padding: 26, width: 420, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto", boxSizing: "border-box" }}>
        <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 2 }}>Пользователь</div>
        <div style={{ fontSize: 12.5, color: "#9ca3af", marginBottom: 18 }}>{user.email}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div><label style={lbl}>Тариф</label>
            <select value={plan} onChange={(e) => setPlan(e.target.value)} style={{ ...field, cursor: "pointer" }}>
              {["free", "start", "pro", "biz"].map((p) => <option key={p} value={p}>{PLAN_NAMES[p]}</option>)}
            </select>
          </div>
          <div><label style={lbl}>Лимит заявок</label><input type="number" value={leadLimit} onChange={(e) => setLeadLimit(e.target.value)} style={field} /></div>
          <div><label style={lbl}>Действует до (пусто = бессрочно)</label><input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} style={field} /></div>
          <div><label style={lbl}>Роль</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} style={{ ...field, cursor: "pointer" }}>
              <option value="user">Пользователь</option><option value="admin">Администратор</option>
            </select>
          </div>
          {err && <div style={{ color: "#b91c1c", fontSize: 12.5 }}>{err}</div>}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <div onClick={onClose} style={{ flex: 1, textAlign: "center", border: "1px solid #e5e7eb", borderRadius: 10, padding: "11px 0", fontSize: 13.5, fontWeight: 500, cursor: "pointer" }}>Отмена</div>
            <div onClick={busy ? undefined : save} style={{ flex: 1, textAlign: "center", background: "#28559c", color: "#fff", borderRadius: 10, padding: "11px 0", fontSize: 13.5, fontWeight: 600, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>{busy ? "Сохраняем…" : "Сохранить"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Настройки сайта: аналитика и верификация ───────────── */
function SettingsSection() {
  const [s, setS] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { api.adminSettings().then(({ settings }) => setS(settings)).catch(() => {}).finally(() => setLoading(false)); }, []);

  const upd = (k: keyof SiteSettings, v: string) => { setS((p) => ({ ...p, [k]: v })); setSaved(false); };
  const save = async () => { setBusy(true); try { const { settings } = await api.adminSaveSettings(s); setS(settings); setSaved(true); } catch { /* ignore */ } finally { setBusy(false); } };

  const lbl: CSSProperties = { fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" };
  const hint: CSSProperties = { fontSize: 11.5, color: "#9ca3af", marginTop: 5, lineHeight: 1.5 };
  const field: CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 13px", fontSize: 13.5, fontFamily: "inherit", outlineColor: "#28559c" };

  if (loading) return <div style={{ color: "#9ca3af", fontSize: 13 }}>Загрузка…</div>;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <div><h1 style={h1}>Настройки сайта</h1><div style={sub}>Аналитика и верификация — применяются ко всему сайту</div></div>
        <div onClick={busy ? undefined : save} style={{ cursor: "pointer", background: saved ? "#166534" : "#28559c", color: "#fff", fontSize: 13, fontWeight: 500, borderRadius: 9999, padding: "10px 22px", opacity: busy ? 0.6 : 1 }}>{busy ? "Сохраняем…" : saved ? "✓ Сохранено" : "Сохранить"}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16, maxWidth: 900 }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Аналитика</div>
          <div><label style={lbl}>ID счётчика Яндекс.Метрики</label><input value={s.metrikaId || ""} onChange={(e) => upd("metrikaId", e.target.value)} placeholder="12345678" style={field} /><div style={hint}>Только номер счётчика. Подключается после согласия на cookie.</div></div>
          <div><label style={lbl}>Google Analytics (Measurement ID)</label><input value={s.gaId || ""} onChange={(e) => upd("gaId", e.target.value)} placeholder="G-XXXXXXXXXX" style={field} /><div style={hint}>Идентификатор вида G-XXXX. Подключается после согласия на cookie.</div></div>
        </div>
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Верификация сайта</div>
          <div><label style={lbl}>Яндекс.Вебмастер (мета-тег)</label><input value={s.yandexVerify || ""} onChange={(e) => upd("yandexVerify", e.target.value)} placeholder="содержимое content=… из yandex-verification" style={field} /><div style={hint}>Вставьте значение content мета-тега yandex-verification.</div></div>
          <div><label style={lbl}>Google Search Console (мета-тег)</label><input value={s.googleVerify || ""} onChange={(e) => upd("googleVerify", e.target.value)} placeholder="содержимое content=… из google-site-verification" style={field} /><div style={hint}>Вставьте значение content мета-тега google-site-verification.</div></div>
        </div>
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
