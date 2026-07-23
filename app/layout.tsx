import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CookieBanner } from "@/components/site/CookieBanner";
import { SiteAnalytics } from "@/components/site/SiteAnalytics";
import { getSiteSettings } from "@/lib/server/siteSettings";

const SITE_URL = "https://qvalify.ru";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// Динамический рендер, чтобы мета-верификация и счётчики из админки применялись
// без пересборки. Нагрузку на БД гасит 60-сек кеш в getSiteSettings().
// (На этапе масштабирования вернём кеширование/ISR — см. роадмап.)
export const dynamic = "force-dynamic";

// Метаданные + мета-теги верификации (Яндекс/Google) из настроек сайта (админка)
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  const other: Record<string, string> = {};
  if (s.yandexVerify) other["yandex-verification"] = s.yandexVerify;
  if (s.googleVerify) other["google-site-verification"] = s.googleVerify;
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: "Квалифай — конструктор квизов с ИИ-генерацией",
      template: "%s — Квалифай",
    },
    description:
      "Квалифай — платформа квизов с ИИ-генерацией, аналитикой и встроенной CRM. Квизы, которые превращают посетителей сайта в заявки.",
    keywords: ["квиз", "конструктор квизов", "квиз для сайта", "лидогенерация", "ИИ квиз", "Квалифай", "qvalify"],
    openGraph: {
      type: "website",
      locale: "ru_RU",
      url: SITE_URL,
      siteName: "Квалифай",
      title: "Квалифай — конструктор квизов с ИИ-генерацией",
      description: "Квизы, которые превращают посетителей сайта в заявки — с аналитикой и CRM внутри.",
    },
    alternates: { canonical: "/" },
    ...(Object.keys(other).length ? { other } : {}),
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await getSiteSettings();
  return (
    <html lang="ru">
      <body>
        {children}
        <CookieBanner />
        <SiteAnalytics metrikaId={s.metrikaId} gaId={s.gaId} />
      </body>
    </html>
  );
}
