import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CookieBanner } from "@/components/site/CookieBanner";

const SITE_URL = "https://qvalify.ru";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Квалифай — конструктор квизов с ИИ-генерацией",
    template: "%s — Квалифай",
  },
  description:
    "Квалифай — платформа квизов с ИИ-генерацией, аналитикой и встроенной CRM. Квизы, которые превращают посетителей сайта в заявки.",
  keywords: [
    "квиз",
    "конструктор квизов",
    "квиз для сайта",
    "лидогенерация",
    "ИИ квиз",
    "Квалифай",
    "qvalify",
  ],
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: SITE_URL,
    siteName: "Квалифай",
    title: "Квалифай — конструктор квизов с ИИ-генерацией",
    description:
      "Квизы, которые превращают посетителей сайта в заявки — с аналитикой и CRM внутри.",
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
