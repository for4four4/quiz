"use client";

import Link from "next/link";
import { useState } from "react";
import { routes } from "@/lib/nav";

type Quiz = {
  cat: string;
  title: string;
  niche: string;
  conv: string;
  qn: string;
  dur: string;
  prog: string;
  question: string;
  o1: string;
  o2: string;
};

const all: Quiz[] = [
  { cat: "Мебель", title: "Расчёт стоимости кухни", niche: "Кухни на заказ", conv: "11,4%", qn: "5", dur: "1,5 мин", prog: "40%", question: "Какая кухня вам нужна?", o1: "Прямая", o2: "Угловая" },
  { cat: "Ремонт", title: "Смета на ремонт квартиры", niche: "Ремонт", conv: "9,8%", qn: "7", dur: "2 мин", prog: "55%", question: "Какой ремонт планируете?", o1: "Косметический", o2: "Под ключ" },
  { cat: "Медицина", title: "Подбор плана лечения", niche: "Стоматология", conv: "8,2%", qn: "6", dur: "1,5 мин", prog: "33%", question: "Что вас беспокоит?", o1: "Хочу выровнять зубы", o2: "Нужна имплантация" },
  { cat: "Обучение", title: "Подбор курса вождения", niche: "Автошкола", conv: "12,1%", qn: "4", dur: "1 мин", prog: "50%", question: "Какие права нужны?", o1: "Категория A", o2: "Категория B" },
  { cat: "Спорт", title: "Программа тренировок", niche: "Фитнес-клуб", conv: "10,6%", qn: "5", dur: "1,5 мин", prog: "60%", question: "Ваша цель?", o1: "Набор массы", o2: "Похудение" },
  { cat: "Услуги", title: "Оценка перспектив дела", niche: "Юристы", conv: "7,9%", qn: "6", dur: "2 мин", prog: "45%", question: "Какой у вас вопрос?", o1: "Семейное право", o2: "Споры с застройщиком" },
];

const categories = ["Все", "Мебель", "Ремонт", "Медицина", "Обучение", "Спорт", "Услуги"];

export function ExamplesGrid() {
  const [cat, setCat] = useState("Все");
  const quizzes = cat === "Все" ? all : all.filter((q) => q.cat === cat);

  return (
    <>
      {/* Category chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 36 }}>
        {categories.map((label) => {
          const act = cat === label;
          return (
            <button
              key={label}
              onClick={() => setCat(label)}
              style={{
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 13.5,
                fontWeight: 500,
                borderRadius: 9999,
                padding: "9px 18px",
                border: `1px solid ${act ? "#28559c" : "#e5e7eb"}`,
                background: act ? "#28559c" : "#ffffff",
                color: act ? "#ffffff" : "#111827",
                transition: "all .25s",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(min(340px,100%),1fr))",
          gap: 24,
          marginTop: 40,
        }}
      >
        {quizzes.map((q) => (
          <div
            key={q.title}
            className="qv-card"
            style={{
              background: "#ffffff",
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 8px 28px rgba(13,32,68,0.08)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Quiz preview */}
            <div style={{ background: "linear-gradient(135deg,#0F1F3C,#28559c)", padding: "22px 22px 0" }}>
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "14px 14px 0 0",
                  padding: "18px 18px 14px",
                  boxShadow: "0 -8px 30px rgba(0,0,0,0.2)",
                }}
              >
                <div style={{ height: 4, background: "#eceef2", borderRadius: 9999, overflow: "hidden", marginBottom: 14 }}>
                  <div style={{ height: "100%", width: q.prog, background: "#28559c", borderRadius: 9999 }} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}>{q.question}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 12 }}>
                  <div style={{ border: "1px solid #e5e7eb", borderRadius: 9, padding: "9px 12px", fontSize: 12, color: "#4b5563" }}>
                    {q.o1}
                  </div>
                  <div
                    style={{
                      border: "1px solid #28559c",
                      background: "rgba(40,85,156,0.06)",
                      borderRadius: 9,
                      padding: "9px 12px",
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{q.o2}</span>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#28559c" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Meta */}
            <div style={{ padding: "20px 22px 22px", display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em" }}>{q.title}</div>
                <div
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: "#28559c",
                    background: "rgba(40,85,156,0.08)",
                    borderRadius: 9999,
                    padding: "4px 11px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {q.niche}
                </div>
              </div>
              <div style={{ display: "flex", gap: 22, fontSize: 12.5, color: "#6b7280" }}>
                <Stat value={q.conv} label="конверсия" />
                <Stat value={q.qn} label="вопросов" />
                <Stat value={q.dur} label="прохождение" />
              </div>
              <Link
                href={routes.editor}
                className="qv-grp"
                style={{
                  marginTop: "auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  border: "1.5px solid #e5e7eb",
                  borderRadius: 9999,
                  padding: "10px 0",
                  fontSize: 13.5,
                  fontWeight: 500,
                }}
              >
                <span className="qv-roll" style={{ height: 20 }}>
                  <span className="qv-roll-col" style={{ lineHeight: "20px" }}>
                    <span>Собрать похожий</span>
                    <span style={{ color: "#28559c" }}>Собрать похожий</span>
                  </span>
                </span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <span style={{ display: "block", fontSize: 16, fontWeight: 600, color: "#111827" }}>{value}</span>
      {label}
    </div>
  );
}
