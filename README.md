# Квалифай — сервис умных ИИ-квизов

«Квиз, который думает»: владелец бизнеса описывает бизнес текстом → ИИ собирает квиз → квиз встраивается на сайт одним `<script>` → адаптивные вопросы генерируются на лету → каждый лид приходит со скорингом 0–100, сегментом (hot/warm/cold/junk) и резюме для отдела продаж. Junk-заявки не тарифицируются.

Полная спецификация — [`docs/spec-mvp-ai-quiz.md`](docs/spec-mvp-ai-quiz.md).

## Состав проекта

| Папка | Что это | Стек |
|---|---|---|
| `api/` | Бэкенд: REST API + воркер скоринга | Node.js 22, Fastify 5, TypeScript |
| `widget/` | Виджет для сайтов клиентов (бандл ~38 КБ, gzip ~14 КБ) | Preact + Vite, Shadow DOM |
| `admin/` | Админка: онбординг, редактор, лиды, публикация | React + Vite + Tailwind CSS 4 |
| `db/migrations/` | Миграции PostgreSQL (голый SQL) | PostgreSQL 16+ |
| `docs/` | Спецификация MVP | — |

LLM подключён через агрегатор **Polza.ai** (OpenAI-совместимый API, работает из РФ): промпты 1–4 из спеки со structured output, смена провайдера — правка одного файла `api/src/llm/client.ts`.

## Что уже работает

- **Онбординг «создать квиз с ИИ»** — бриф → готовый квиз за ~15 секунд (промпт 1, Sonnet).
- **Адаптивный режим** — следующий вопрос генерируется по ответам (промпт 2, Haiku), таймаут 4 с и фолбэк на заранее сгенерированный «скелет»: посетитель никогда не видит ошибку.
- **Виджет**: обложка, один вопрос на экран, прогресс-бар, кнопка «назад», «печатающаяся» пауза, маска телефона +7, чекбокс согласия 152-ФЗ, конфетти на результате. Режимы: встроенный / попап с плавающей кнопкой / открытие по своей кнопке.
- **Скоринг лидов** — фоновый воркер: программный антифрод + промпт 3 → score, сегмент, резюме и «первая фраза для звонка»; junk ⇒ `billable=false`.
- **Персональный результат** для посетителя (промпт 4) с фолбэком на нейтральное «спасибо».
- **Админка**: регистрация/логин, список квизов, редактор (вопросы, бриф для ИИ, дизайн, настройки, публикация), embed-коды, прямая ссылка `/q/:slug`, QR-код, экран «Лиды» с бейджами, транскриптом и фильтром junk.
- **Уведомления в мессенджеры**: экран «Интеграции» — боты Telegram (@BotFather), ВКонтакте (токен сообщества + peer_id) и MAX (@MasterBot). Воркер шлёт лид во все включённые каналы, чей набор сегментов подходит, сразу после скоринга. Токены хранятся в БД (таблица `integrations`), env-переменных не требуют.
- **Аналитика**: вкладка «Аналитика» в редакторе — воронка по шагам из таблицы `events` (просмотр → старт → каждый вопрос → заявка с процентом отвала), конверсия, средний скоринг, топ UTM-источников. Кнопка «Проанализировать воронку» запускает ИИ-аналитика (промпт 5) — инсайты со степенью важности и гипотезы для A/B-тестов.
- **Редактор вопросов**: вкладка «Вопросы» — инлайн-правка текста и вариантов, смена типа (один/несколько/картинки/слайдер/текст), сортировка перетаскиванием, добавление и удаление. Тип «С картинками» — превью и ссылка на фото у каждого варианта. Сохранение через `PUT /api/quizzes/:id/questions`.
- **Загрузка картинок**: `POST /api/uploads` (JPG/PNG/WEBP/GIF, до 5 МБ) → файл в `UPLOAD_DIR`, раздаётся на `/uploads/*`. В редакторе — кнопка «Загрузить файл» у вариантов «с картинками» и у фото обложки (стиль «С фото»).
- **SEO-галерея «квиз для {ниша}»**: серверный рендер `/kviz-dlya` и `/kviz-dlya/:slug` (10 ниш) с мета-тегами и CTA в онбординг с предзаполненным брифом (`/new?niche=slug`).

---

## Быстрый старт локально

```bash
# 1. Postgres
docker compose up -d db

# 2. API
cd api
cp .env.example .env        # вписать POLZA_API_KEY (ключ — в polza.ai/dashboard)
npm install
npm run migrate
npm run dev                 # API на :8080
npm run worker              # в соседнем терминале — воркер скоринга

# 3. Админка (dev-сервер проксирует /api на :8080)
cd ../admin && npm install && npm run dev   # http://localhost:5173

# 4. Виджет (по необходимости)
cd ../widget && npm install && npm run build   # dist/kvalify-widget.js
```

---

## Установка на сервер Ubuntu

Инструкция под **Ubuntu 25/26 + Node.js 22**, домен **qvalify.ru**, папка проекта **`/var/www/quiz`**. Проект целиком на Node.js — **PHP не требуется**. Все команды — от root (или через `sudo`).

> Замените в командах `qvalify.ru` на свой домен и `СЛОЖНЫЙ_ПАРОЛЬ` на настоящий пароль БД. Предполагается, что DNS домена уже указывает A-записью на IP сервера.

### 1. Пакеты

```bash
apt update
apt install -y git nginx postgresql postgresql-contrib
node -v        # ожидаем v22.x; если нет:
# apt install -y curl && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt install -y nodejs
```

### 2. База данных

```bash
sudo -u postgres psql <<'SQL'
CREATE USER kvalify WITH PASSWORD 'СЛОЖНЫЙ_ПАРОЛЬ';
CREATE DATABASE kvalify OWNER kvalify;
SQL
```

### 3. Код и зависимости

```bash
# Клонируем прямо в папку сайта
mkdir -p /var/www && cd /var/www
git clone https://github.com/for4four4/quiz.git quiz
cd quiz

# API
cd api
cp .env.example .env
nano .env          # заполнить (см. таблицу ниже)
npm ci
npm run migrate    # применит db/migrations/*.sql
npm run build      # tsc → dist/

# Виджет и админка (собираются один раз, дальше раздаёт nginx)
cd ../widget && npm ci && npm run build
cd ../admin  && npm ci && npm run build

# Папка для загруженных картинок
mkdir -p /var/www/quiz/uploads
chown -R www-data:www-data /var/www/quiz
```

Переменные `api/.env` (минимум — первые пять):

| Переменная | Значение |
|---|---|
| `JWT_SECRET` | Случайная строка: `openssl rand -hex 32` |
| `DATABASE_URL` | `postgres://kvalify:СЛОЖНЫЙ_ПАРОЛЬ@localhost:5432/kvalify` |
| `POLZA_API_KEY` | Ключ из polza.ai/dashboard |
| `PUBLIC_ORIGIN` | `https://qvalify.ru` |
| `UPLOAD_DIR` | `/var/www/quiz/uploads` |
| `PORT` | `8080` (по умолчанию) |
| `POLZA_BASE_URL` | `https://polza.ai/api/v1` |
| `LLM_MODEL_FAST` / `LLM_MODEL_SMART` | ID моделей из каталога polza.ai/models |

### 4. systemd: API и воркер

```bash
cat > /etc/systemd/system/qvalify-api.service <<'EOF'
[Unit]
Description=Qvalify API
After=network.target postgresql.service
[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/quiz/api
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=3
[Install]
WantedBy=multi-user.target
EOF

cat > /etc/systemd/system/qvalify-worker.service <<'EOF'
[Unit]
Description=Qvalify scoring worker
After=network.target postgresql.service
[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/quiz/api
ExecStart=/usr/bin/node dist/worker.js
Restart=always
RestartSec=5
[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now qvalify-api qvalify-worker
systemctl status qvalify-api --no-pager   # active (running)
```

### 5. nginx

Один домен раздаёт всё: админку (SPA), API, страницы квизов, SEO-галерею, загруженные картинки и виджет.

```bash
cat > /etc/nginx/sites-available/qvalify <<'EOF'
server {
    listen 80;
    server_name qvalify.ru;

    # Админка (SPA)
    root /var/www/quiz/admin/dist;
    index index.html;
    location / {
        try_files $uri /index.html;
    }

    # API (генерация квиза может занимать до ~20 с)
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        client_max_body_size 6m;      # загрузка картинок до 5 МБ
    }

    # Страница квиза /q/... и SEO-галерея /kviz-dlya... (рендерит API)
    location /q/         { proxy_pass http://127.0.0.1:8080; proxy_set_header Host $host; }
    location /kviz-dlya  { proxy_pass http://127.0.0.1:8080; proxy_set_header Host $host; }

    # Загруженные картинки — отдаёт nginx напрямую
    location /uploads/ {
        alias /var/www/quiz/uploads/;
        add_header Cache-Control "public, max-age=2592000";
    }

    # Виджет — статика с кэшем и открытым CORS (грузится с чужих сайтов)
    location /widget/ {
        alias /var/www/quiz/widget/dist/;
        add_header Cache-Control "public, max-age=3600";
        add_header Access-Control-Allow-Origin "*";
    }
}
EOF

ln -sf /etc/nginx/sites-available/qvalify /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

### 6. SSL (Let's Encrypt)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d qvalify.ru
```

Certbot сам перепишет конфиг на HTTPS и настроит автопродление.

### 7. Проверка

```bash
curl -s https://qvalify.ru/api/health     # {"ok":true}
curl -s https://qvalify.ru/kviz-dlya | head -c 40   # HTML галереи
```

Дальше — в браузере: `https://qvalify.ru` → регистрация → «Создать квиз с ИИ» → опубликовать → вкладка «Публикация» даст embed-код, ссылку `/q/...` и QR. SEO-галерея ниш — на `https://qvalify.ru/kviz-dlya`.

### Обновление версии

```bash
cd /var/www/quiz && git pull
cd api && npm ci && npm run migrate && npm run build
cd ../widget && npm ci && npm run build
cd ../admin  && npm ci && npm run build
chown -R www-data:www-data /var/www/quiz
systemctl restart qvalify-api qvalify-worker
```

---

## Встраивание квиза на сайт клиента

Готовые сниппеты копируются из админки (вкладка «Публикация»). Варианты:

```html
<!-- Встроенный блок -->
<div id="kvalify-quiz"></div>
<script src="https://qvalify.ru/widget/kvalify-widget.js"
        data-quiz-id="UUID" data-mode="inline" data-target="#kvalify-quiz" defer></script>

<!-- Попап с плавающей кнопкой -->
<script src="https://qvalify.ru/widget/kvalify-widget.js"
        data-quiz-id="UUID" data-mode="popup" data-button-text="Пройти квиз" defer></script>

<!-- Открытие по своей кнопке -->
<button data-kvalify-open>Подобрать решение</button>
<script src="https://qvalify.ru/widget/kvalify-widget.js"
        data-quiz-id="UUID" data-mode="button" defer></script>
```

## Дальше по плану

1. Telegram-уведомления о горячих лидах (неделя 3 спеки).
2. Аналитика: воронка по вопросам из таблицы `events` + ИИ-аналитик (промпт 5).
3. ЮKassa: подписки, тарифные лимиты, PDF-счета для юрлиц.
4. Редактирование отдельных вопросов скелета в админке, drag&drop, дизайн-темы виджета.
