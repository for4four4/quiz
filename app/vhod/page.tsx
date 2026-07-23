"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/site/Logo";
import { api } from "@/lib/api";
import { routes } from "@/lib/nav";

export default function VhodPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "register") await api.register({ email, password, name, company });
      else await api.login({ email, password });
      router.push(routes.cabinet);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось войти");
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#E8EDF6", display: "flex", flexDirection: "column" }}>
      <div style={{ maxWidth: 1440, margin: "0 auto", width: "100%", boxSizing: "border-box", padding: 24 }}>
        <Logo />
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 20px 64px" }}>
        <div style={{ width: 420, maxWidth: "100%", background: "#ffffff", borderRadius: 20, boxShadow: "0 12px 40px rgba(13,32,68,0.1)", padding: "clamp(28px,5vw,40px)", boxSizing: "border-box" }}>
          <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em" }}>
            {mode === "login" ? "Вход в кабинет" : "Регистрация"}
          </h1>
          <p style={{ margin: "0 0 24px", fontSize: 14, color: "#6b7280" }}>
            {mode === "login" ? "Рады видеть снова" : "Первый квиз — бесплатно, без карты"}
          </p>

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "register" && (
              <>
                <Field label="Имя" value={name} onChange={setName} placeholder="Как к вам обращаться" />
                <Field label="Компания" value={company} onChange={setCompany} placeholder="Название бизнеса" />
              </>
            )}
            <Field label="Почта" type="email" value={email} onChange={setEmail} placeholder="you@company.ru" required />
            <Field label="Пароль" type="password" value={password} onChange={setPassword} placeholder="Минимум 6 символов" required />

            {error && (
              <div style={{ fontSize: 13, color: "#991b1b", background: "rgba(153,27,27,0.06)", borderRadius: 10, padding: "9px 12px" }}>{error}</div>
            )}

            <button
              type="submit"
              disabled={busy}
              style={{ marginTop: 4, background: "#28559c", color: "#ffffff", border: "none", borderRadius: 9999, padding: "13px 0", fontSize: 15, fontWeight: 500, cursor: busy ? "default" : "pointer", fontFamily: "inherit", opacity: busy ? 0.7 : 1 }}
            >
              {busy ? "Секунду…" : mode === "login" ? "Войти" : "Создать аккаунт"}
            </button>
          </form>

          <div style={{ marginTop: 20, fontSize: 13.5, color: "#6b7280", textAlign: "center" }}>
            {mode === "login" ? "Нет аккаунта? " : "Уже есть аккаунт? "}
            <button
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
              style={{ border: "none", background: "none", color: "#28559c", fontWeight: 600, cursor: "pointer", fontSize: 13.5, fontFamily: "inherit", padding: 0 }}
            >
              {mode === "login" ? "Зарегистрироваться" : "Войти"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", required }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>{label}</div>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e5e7eb", borderRadius: 12, padding: "11px 14px", fontSize: 14, fontFamily: "inherit", outlineColor: "#28559c" }}
      />
    </label>
  );
}
