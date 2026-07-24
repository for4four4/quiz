import "server-only";
import { ensureSchema, query } from "./db";

// Редактируемый через админку контент сайта. Пока — новости; далее тарифы/тексты.
export type NewsTag = "feature" | "integ" | "platform";
export type NewsItem = { date: string; tag: NewsTag; title: string; text: string };
export type VolumePack = { n: number; p: number };
export type FreeFeature = { ok: boolean; text: string };
export type SiteContent = {
  news: {
    featured: { date: string; title: string; text: string };
    items: NewsItem[];
  };
  pricing: {
    startBase: number;              // цена тарифа «Старт», ₽/мес
    volumes: VolumePack[];          // пакеты заявок тарифа «Про»
    freeFeatures: FreeFeature[];    // список «Бесплатный» (ok=есть/нет)
    startFeatures: string[];        // список «Старт»
    proFeatures: string[];          // список «Про»
  };
};

// Значения по умолчанию = текущий контент (используются, пока админ не задал своё).
export const DEFAULT_CONTENT: SiteContent = {
  news: {
    featured: {
      date: "15 июля 2026",
      title: "Запускаем Квалифай: открыт приём первых клиентов",
      text: "Платформа вышла из закрытого тестирования. Первый квиз — бесплатно на любом тарифе: соберите его руками или доверьте ИИ, встройте на сайт и получите первые заявки. Подключаем клиентов в порядке очереди — регистрация уже открыта.",
    },
    items: [
      { date: "10 июля 2026", tag: "feature", title: "ИИ-генерация квизов вышла из беты", text: "Опишите бизнес одной фразой — ИИ соберёт обложку, вопросы с ветвлением, калькулятор стоимости и форму контактов. Каждый сгенерированный блок редактируется как обычный." },
      { date: "2 июля 2026", tag: "integ", title: "Интеграция с MAX", text: "Заявки из квизов теперь приходят в MAX: подключите бота в разделе «Интеграции» — уведомления о новых лидах будут падать в чат мгновенно." },
      { date: "24 июня 2026", tag: "feature", title: "Перенос неиспользованных заявок", text: "Остаток лимита заявок больше не сгорает в конце месяца — он автоматически переносится на следующий. Правило работает на всех платных тарифах." },
      { date: "15 июня 2026", tag: "platform", title: "Встроенная CRM в кабинете", text: "Лиды по каждому квизу, статусы, ответы и источники — теперь в личном кабинете. Внешнюю CRM можно подключить позже, ничего не потеряется." },
      { date: "3 июня 2026", tag: "feature", title: "Свободный редактор обложки", text: "Первый экран квиза стал полностью свободным: двигайте заголовок, описание и преимущества, задавайте размеры, цвета, шрифты и бордеры без кода." },
    ],
  },
  pricing: {
    startBase: 590,
    volumes: [
      { n: 100, p: 1290 }, { n: 300, p: 2790 }, { n: 500, p: 3990 },
      { n: 1000, p: 5990 }, { n: 3000, p: 8490 }, { n: 5000, p: 11490 },
    ],
    freeFeatures: [
      { ok: true, text: "Безлимит квизов и проектов" },
      { ok: true, text: "Полный редактор и ИИ-генерация" },
      { ok: true, text: "Вся аналитика: Метрика, свой код" },
      { ok: true, text: "Встроенная CRM для заявок" },
      { ok: false, text: "Бейдж «Сделано в Квалифай»" },
    ],
    startFeatures: [
      "Всё из Бесплатного",
      "Все интеграции: CRM, мессенджеры, вебхуки",
      "Коллтрекинг на каждый шаг",
      "Без бейджа Квалифай",
      "Экспорт заявок в CSV",
    ],
    proFeatures: [
      "Всё из Старта",
      "Команда: приглашения в проект без лимита",
      "Свой домен и загрузка видео",
      "A/B-тесты и динамический контент",
      "Приоритетная поддержка",
    ],
  },
};

const TAGS: NewsTag[] = ["feature", "integ", "platform"];
type Cache = { at: number; data: SiteContent };
const g = globalThis as { _qvContent?: Cache };

const s = (v: unknown, max = 4000) => (typeof v === "string" ? v.slice(0, max) : "");

const num = (v: unknown, def: number, max = 10_000_000) => {
  const x = Math.round(Number(v));
  return Number.isFinite(x) && x >= 0 ? Math.min(max, x) : def;
};
const strList = (v: unknown, def: string[]) => (Array.isArray(v) ? v.map((x) => s(x, 200)).filter(Boolean).slice(0, 30) : def);

function clean(raw: unknown): SiteContent {
  const d = (raw && typeof raw === "object" ? raw : {}) as { news?: unknown; pricing?: unknown };
  const n = (d.news && typeof d.news === "object" ? d.news : {}) as { featured?: unknown; items?: unknown };
  const f = (n.featured && typeof n.featured === "object" ? n.featured : {}) as Record<string, unknown>;
  const items = Array.isArray(n.items) ? n.items : DEFAULT_CONTENT.news.items;

  const pr = (d.pricing && typeof d.pricing === "object" ? d.pricing : {}) as Record<string, unknown>;
  const dp = DEFAULT_CONTENT.pricing;
  const volumes = Array.isArray(pr.volumes) && pr.volumes.length
    ? pr.volumes.slice(0, 12).map((v) => { const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>; return { n: num(o.n, 100), p: num(o.p, 0) }; })
    : dp.volumes;
  const freeFeatures = Array.isArray(pr.freeFeatures) && pr.freeFeatures.length
    ? pr.freeFeatures.slice(0, 30).map((v) => { const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>; return { ok: !!o.ok, text: s(o.text, 200) }; }).filter((x) => x.text)
    : dp.freeFeatures;

  return {
    news: {
      featured: {
        date: s(f.date, 60) || DEFAULT_CONTENT.news.featured.date,
        title: s(f.title, 300) || DEFAULT_CONTENT.news.featured.title,
        text: s(f.text) || DEFAULT_CONTENT.news.featured.text,
      },
      items: items.slice(0, 100).map((it) => {
        const o = (it && typeof it === "object" ? it : {}) as Record<string, unknown>;
        const tag = TAGS.includes(o.tag as NewsTag) ? (o.tag as NewsTag) : "feature";
        return { date: s(o.date, 60), tag, title: s(o.title, 300), text: s(o.text) };
      }).filter((x) => x.title || x.text),
    },
    pricing: {
      startBase: num(pr.startBase, dp.startBase),
      volumes,
      freeFeatures,
      startFeatures: strList(pr.startFeatures, dp.startFeatures),
      proFeatures: strList(pr.proFeatures, dp.proFeatures),
    },
  };
}

/** Контент сайта с 60-сек кешем; при пустой БД — дефолты. */
export async function getSiteContent(): Promise<SiteContent> {
  if (g._qvContent && Date.now() - g._qvContent.at < 60_000) return g._qvContent.data;
  try {
    await ensureSchema();
    const [row] = await query<{ data: unknown }>("SELECT data FROM site_content WHERE id=1");
    const empty = !row?.data || Object.keys(row.data as object).length === 0;
    const data = empty ? DEFAULT_CONTENT : clean(row.data);
    g._qvContent = { at: Date.now(), data };
    return data;
  } catch {
    return g._qvContent?.data || DEFAULT_CONTENT;
  }
}

export async function saveSiteContent(raw: unknown): Promise<SiteContent> {
  await ensureSchema();
  const data = clean(raw);
  await query("UPDATE site_content SET data=$1 WHERE id=1", [JSON.stringify(data)]);
  g._qvContent = { at: Date.now(), data };
  return data;
}
