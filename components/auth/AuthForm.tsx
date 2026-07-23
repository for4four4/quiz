"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { routes } from "@/lib/nav";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Введите почту и пароль");
      return;
    }
    if (mode === "register" && password.length < 8) {
      setError("Пароль — минимум 8 символов");
      return;
    }
    if (mode === "register" && !agree) {
      setError("Нужно принять оферту и согласие на обработку данных");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/auth?action=${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, name, company }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || "Не удалось войти");
      router.push(routes.cabinet);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
      setBusy(false);
    }
  }

  return (
    <main style={page}>
      <div style={card}>
        <Link href={routes.home} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 24 }}>
          <span style={logoDot}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="3" width="16" height="3.2" rx="1.6" fill="#fff" opacity="0.55" />
              <rect x="2" y="8.4" width="16" height="3.2" rx="1.6" fill="#fff" opacity="0.8" />
              <rect x="2" y="13.8" width="9" height="3.2" rx="1.6" fill="#fff" />
              <path d="M13.5 15.4l1.6 1.6 3-3.4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </span>
          <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.02em", color: "#111827" }}>
            <span style={{ color: "#28559c" }}>Ква</span>лифай
          </span>
        </Link>

        <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 4px" }}>
          {mode === "login" ? "Вход в кабинет" : "Регистрация"}
        </h1>
        <p style={{ fontSize: 13.5, color: "#6b7280", margin: "0 0 22px" }}>
          {mode === "login" ? "Рады видеть снова" : "Создайте аккаунт за минуту"}
        </p>

        <div style={tabs}>
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(""); }}
              style={{ ...tab, ...(mode === m ? tabActive : {}) }}
            >
              {m === "login" ? "Войти" : "Регистрация"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18 }}>
          {mode === "register" && (
            <>
              <Field label="Имя" value={name} onChange={setName} placeholder="Как вас зовут" />
              <Field label="Компания" value={company} onChange={setCompany} placeholder="Необязательно" />
            </>
          )}
          <Field label="Почта" value={email} onChange={setEmail} placeholder="you@company.ru" type="email" />
          <Field label="Пароль" value={password} onChange={setPassword} placeholder="••••••••" type="password" />

          {mode === "register" && (
            <label style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 11.5, color: "#6b7280", lineHeight: 1.5, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                style={{ width: 16, height: 16, marginTop: 1, accentColor: "#28559c", flexShrink: 0, cursor: "pointer" }}
              />
              <span>
                Принимаю{" "}
                <Link href={`${routes.dokumenty}#oferta`} style={{ color: "#28559c" }}>оферту</Link>{" "}
                и даю{" "}
                <Link href={`${routes.dokumenty}#consent`} style={{ color: "#28559c" }}>согласие на обработку персональных данных</Link>.
              </span>
            </label>
          )}

          {error && <div style={{ color: "#b91c1c", fontSize: 13 }}>{error}</div>}

          <button type="submit" disabled={busy} style={{ ...primaryBtn, opacity: busy ? 0.7 : 1 }}>
            {busy ? "Секунду…" : mode === "login" ? "Войти" : "Создать аккаунт"}
          </button>
        </form>

        {mode === "login" && (
          <p style={{ fontSize: 11.5, color: "#9ca3af", textAlign: "center", marginTop: 16 }}>
            Продолжая, вы соглашаетесь с{" "}
            <Link href={`${routes.dokumenty}#oferta`} style={{ color: "#6b7280" }}>офертой</Link> и{" "}
            <Link href={`${routes.dokumenty}#policy`} style={{ color: "#6b7280" }}>политикой конфиденциальности</Link>.
          </p>
        )}
      </div>
    </main>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={type === "password" ? "current-password" : type === "email" ? "email" : "off"}
        style={input}
      />
    </label>
  );
}

const page: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
  background: "#E8EDF6",
  fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial, sans-serif",
};
const card: CSSProperties = {
  width: "100%",
  maxWidth: 400,
  background: "#fff",
  borderRadius: 20,
  boxShadow: "0 12px 40px rgba(17,24,39,.12)",
  padding: 32,
  boxSizing: "border-box",
};
const logoDot: CSSProperties = {
  width: 34, height: 34, borderRadius: 9999, background: "#28559c",
  display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
};
const tabs: CSSProperties = { display: "flex", gap: 4, background: "#F5F5F5", borderRadius: 9999, padding: 4 };
const tab: CSSProperties = {
  flex: 1, textAlign: "center", borderRadius: 9999, padding: "9px 0", fontSize: 13, fontWeight: 500,
  cursor: "pointer", background: "transparent", color: "#6b7280", border: "none", fontFamily: "inherit",
};
const tabActive: CSSProperties = { background: "#111827", color: "#fff" };
const input: CSSProperties = {
  width: "100%", boxSizing: "border-box", border: "1px solid #e5e7eb", borderRadius: 12,
  padding: "11px 14px", fontSize: 14, fontFamily: "inherit", color: "#111827", outlineColor: "#28559c",
};
const primaryBtn: CSSProperties = {
  marginTop: 6, background: "#28559c", color: "#fff", border: "none", borderRadius: 12,
  padding: "13px 16px", fontSize: 14.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
};
