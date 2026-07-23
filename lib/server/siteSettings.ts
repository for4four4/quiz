import "server-only";
import { ensureSchema, query } from "./db";

// Глобальные настройки сайта (аналитика/верификация; позже — контент-CMS).
export type SiteSettings = {
  metrikaId?: string;      // номер счётчика Яндекс.Метрики (только цифры)
  gaId?: string;           // Google Analytics (G-XXXXXXX)
  yandexVerify?: string;   // содержимое meta yandex-verification
  googleVerify?: string;   // содержимое meta google-site-verification
};

type Cache = { at: number; data: SiteSettings };
const g = globalThis as { _qvSite?: Cache };

function clean(raw: unknown): SiteSettings {
  const d = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const s = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  return {
    metrikaId: s(d.metrikaId, 20).replace(/[^0-9]/g, ""),
    gaId: s(d.gaId, 30),
    yandexVerify: s(d.yandexVerify),
    googleVerify: s(d.googleVerify),
  };
}

/** Читает настройки сайта с 60-сек кешем (не бьёт БД на каждый рендер). */
export async function getSiteSettings(): Promise<SiteSettings> {
  if (g._qvSite && Date.now() - g._qvSite.at < 60_000) return g._qvSite.data;
  try {
    await ensureSchema();
    const [row] = await query<{ data: unknown }>("SELECT data FROM site_settings WHERE id=1");
    const data = clean(row?.data);
    g._qvSite = { at: Date.now(), data };
    return data;
  } catch {
    return g._qvSite?.data || {};
  }
}

/** Сохраняет настройки (перезапись) и сбрасывает кеш. */
export async function saveSiteSettings(raw: unknown): Promise<SiteSettings> {
  await ensureSchema();
  const data = clean(raw);
  await query("UPDATE site_settings SET data=$1 WHERE id=1", [JSON.stringify(data)]);
  g._qvSite = { at: Date.now(), data };
  return data;
}
