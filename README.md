# Квалифай — qvalify.ru

Платформа квизов с ИИ-генерацией, аналитикой и встроенной CRM. Квизы, которые
превращают посетителей сайта в заявки.

Новая версия проекта на **Next.js (App Router) + React + TypeScript + Tailwind CSS v4**,
собранная по дизайн-хэндоффу Claude Design.

## Стек

- [Next.js 15](https://nextjs.org/) — App Router, серверный рендеринг для SEO
- React 19 + TypeScript
- Tailwind CSS v4 (токены дизайна в `app/globals.css`)

## Запуск

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # продакшн-сборка
npm start        # запуск собранного приложения
```

## Структура

```
app/
  layout.tsx        — корневой layout, SEO-метаданные
  page.tsx          — Главная (лендинг)
  globals.css       — дизайн-токены, keyframes, qv-* утилиты
components/
  site/             — общие блоки (Nav, Footer, Logo, primitives, Container)
  landing/          — секции лендинга (Hero, WhySection, AiSection, …)
  util/             — клиентские хелперы (Reveal, MoscowClock)
lib/
  nav.ts            — маршруты и ссылки навигации
public/uploads/     — SVG-иконки интеграций
```

## Дизайн-система

- Фон: `#E8EDF6`, тёмная секция: `#0F1F3C`, акцент: `#28559c`
- Текст: `#111827`, приглушённый: `#4b5563 / #6b7280 / #9ca3af`
- Скругления: карточки `20px`, пилюли `9999px`
- Шрифт: системный стек (`-apple-system, …`)

## Статус

Фронтенд — все 9 экранов дизайна:

- [x] Главная — hero с анимированным фоном и демо-квизом + секции/CTA/футер
- [x] Тарифы — тумблер оплаты, карточки, таблица сравнения, FAQ
- [x] Примеры квизов — фильтр по нишам + сетка карточек
- [x] Новости — главная новость + лента
- [x] Отзывы — статистика + сетка отзывов
- [x] Документы — оглавление + оферта/политика/согласие
- [x] Кабинет клиента — Дашборд / Квизы / Заявки (CRM) / Интеграции / Настройки
- [x] Редактор квиза — Слайды / Кнопка / Показ
- [x] Админ-панель — Клиенты / Тарифы / Поддержка

Бэкенд (Next.js Route Handlers + PostgreSQL + Polza.ai):

- [x] Схема БД (`db/schema.sql`), пул подключений, авто-миграция
- [x] Аутентификация (JWT в httpOnly-cookie): `POST /api/auth?action=register|login|logout`, `GET /api/auth`
- [x] ИИ-генерация квиза на Polza.ai: `POST /api/ai/generate`
- [x] CRUD квизов: `/api/quizzes`, `/api/quizzes/[id]`
- [x] Публичный квиз: `GET /api/public/quiz/[slug]`
- [x] Приём заявки (скоринг + обобщение ИИ + диспатч в интеграции): `POST /api/public/lead`
- [x] Интеграции: Telegram / VK / MAX / вебхуки (`lib/server/integrations.ts`)
- [x] Виджет для встраивания: `public/embed.js`
- [ ] Подключение экранов кабинета/редактора к живым данным (сейчас на демо-данных)
- [ ] amoCRM / Битрикс24 / Яндекс.Метрика / коллтрекинг

## Бэкенд: запуск и ключи

Бэкенд реализован на Route Handlers в `app/api/*`, логика — в `lib/server/*`.
Для работы нужны PostgreSQL и ключи (Polza.ai для ИИ, токены мессенджеров) —
все они задаются через `.env` (в репозиторий не коммитятся, см. `.env.example`).

```bash
cp .env.example .env         # заполнить DATABASE_URL, JWT_SECRET, POLZA_API_KEY …
psql "$DATABASE_URL" -f db/schema.sql   # или схема применится сама при первом запросе
npm run dev
```

Схема БД создаётся идемпотентно при первом обращении к API (`ensureSchema`).
