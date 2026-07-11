# Квалифай — MVP сервиса умных ИИ-квизов

Спринт 1: бэкенд-скелет с ИИ-ядром. LLM подключён через агрегатор **Polza.ai** (OpenAI-совместимый API, работает из РФ без прокси).

## Что уже есть

- **Схема Postgres** — users/workspaces, quizzes/questions, sessions с транскриптом в JSONB, leads со скорингом и `billable`, очередь `jobs`.
- **Модуль LLM** (`api/src/llm/`) — один клиент под Polza.ai через `fetch` на `/chat/completions`, структурный вывод через `response_format: json_schema (strict)` + плагин `response-healing`. Смена агрегатора = правка одного файла.
- **Промпты 1–4 из спеки** (`llm/prompts.ts`) с JSON-схемами: генерация квиза (Sonnet), адаптивный вопрос (Haiku), скоринг лида, персональный результат.
- **API**:
  - `POST /api/auth/register`, `POST /api/auth/login`
  - `POST /api/quizzes/generate` — онбординг «создать квиз с ИИ» (промпт 1): сохраняет квиз, бриф в `business_context`, вопросы-скелет
  - `GET/PATCH /api/quizzes...`, `GET /api/leads` (junk скрыт по умолчанию), транскрипт лида
  - Публичный API виджета: `POST /api/w/:quizId/start | /answer | /lead | /result`
- **Адаптивный режим** — промпт 2 с таймаутом 4с и фолбэком на заранее сгенерированный вопрос из скелета (риск №2 из спеки); `goals_status` сохраняется в сессию между вызовами.
- **Антифрод** — программные проверки (телефон РФ, одноразовые email-домены, прохождение < 8с, «клавиатурный мусор», повтор IP) → `fraud_flags` → контекст для LLM-скоринга; `segment=junk` ⇒ `billable=false`.
- **Воркер** (`worker.ts`) — очередь в Postgres, `FOR UPDATE SKIP LOCKED`, 3 попытки с паузами.

## Запуск локально

```bash
# 1. Postgres
docker compose up -d db

# 2. Бэкенд
cd api
cp .env.example .env          # вписать POLZA_API_KEY (ключ — в консоли polza.ai/dashboard)
npm install
npm run migrate               # применить db/migrations
npm run dev                   # API на :8080
npm run worker                # в соседнем терминале — воркер скоринга
```

Модели заданы в `.env` (`LLM_MODEL_FAST` / `LLM_MODEL_SMART`) в формате `провайдер/модель` — актуальные ID сверить с каталогом polza.ai/models.

## Быстрая проверка руками

```bash
# Регистрация → токен
curl -s localhost:8080/api/auth/register -H 'content-type: application/json' \
  -d '{"email":"test@example.com","password":"password123"}'

# Генерация квиза (промпт 1, ~15 сек)
curl -s localhost:8080/api/quizzes/generate -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' -d '{
    "business_description": "Строим каркасные дома под ключ в Подмосковье, средний чек 4-7 млн, срок 3-5 месяцев",
    "goal": "Заявки на расчёт стоимости дома",
    "geo": "Москва и область",
    "ideal_lead": "Есть участок, бюджет от 3 млн, планирует стройку в этом году"
  }'

# Опубликовать квиз, затем пройти его как посетитель:
# PATCH /api/quizzes/:id {"status":"published"} →
# POST /api/w/:id/start → /answer (цикл) → /lead → /result
```

## Дальше по плану

1. **Виджет** (`widget/`) — лёгкий Preact-бандл < 50 КБ: один вопрос на экран, «печатающаяся» пауза в адаптивном режиме, маска телефона, чекбокс 152-ФЗ.
2. **Админка** (`admin/`) — React + Vite + Tailwind: онбординг-бриф, редактор, лиды с бейджами, публикация.
3. Неделя 3: Telegram-уведомления о горячих лидах, экран аналитики.
