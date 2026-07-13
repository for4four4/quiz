import type { FastifyInstance } from 'fastify';
import { niches, findNiche, type Niche } from '../data/niches.js';
import { config } from '../config.js';

const ORIGIN = config.publicOrigin.replace(/\/$/, '');

/**
 * Публичная галерея «квиз для {ниша}» — маркетинговые SEO-демо (неделя 5 спеки).
 * Серверный рендер HTML (краулится), CTA ведёт в онбординг админки с
 * предзаполненным брифом (`/new?niche=slug`). Плюс публичный JSON для префилла.
 */
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
:root{--ink:#181822;--muted:#8a8a99;--line:#e9e9f0;--primary:oklch(0.53 0.20 274);--grad:linear-gradient(120deg,oklch(0.53 0.20 274),oklch(0.60 0.19 300))}
body{font-family:'Manrope',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:var(--ink);background:#f6f7f9;line-height:1.55;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
.wrap{max-width:1040px;margin:0 auto;padding:0 20px}
header{padding:20px 0;display:flex;align-items:center;gap:10px}
.mark{width:22px;height:22px;border-radius:6px;background:var(--grad);transform:rotate(45deg)}
.brand{font-weight:800;font-size:18px}
.hero{background:var(--grad);color:#fff;border-radius:24px;padding:48px 36px;margin:8px 0 32px;position:relative;overflow:hidden}
.hero .eyebrow{font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;opacity:.7}
.hero h1{font-size:38px;font-weight:800;letter-spacing:-.02em;margin:12px 0;text-wrap:balance;max-width:16em}
.hero p{font-size:17px;opacity:.85;max-width:34em}
.cta{display:inline-flex;align-items:center;gap:8px;background:#fff;color:var(--primary);font-weight:800;font-size:16px;padding:15px 26px;border-radius:14px;margin-top:24px;box-shadow:0 10px 30px rgba(0,0,0,.15);transition:transform .15s ease}
.cta:hover{transform:translateY(-2px)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;margin-bottom:48px}
.card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:22px;transition:transform .18s ease,box-shadow .18s ease,border-color .18s}
.card:hover{transform:translateY(-4px);box-shadow:0 24px 50px -28px rgba(20,20,50,.3);border-color:#c7d2fe}
.card .emoji{font-size:30px}
.card h3{font-size:18px;font-weight:800;margin:12px 0 6px}
.card p{color:var(--muted);font-size:14px}
.card .go{margin-top:14px;font-weight:800;color:var(--primary);font-size:14px}
.section-title{font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin:0 0 16px}
.qs{display:flex;flex-direction:column;gap:10px;margin-bottom:32px}
.q{background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px 18px;display:flex;gap:14px;align-items:center}
.q .n{width:28px;height:28px;flex:none;display:grid;place-items:center;border-radius:9px;background:oklch(0.96 0.02 274);color:var(--primary);font-weight:800;font-size:13px}
.q b{font-weight:700}
.how{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:8px 0 40px}
.how .step{background:#fff;border:1px solid var(--line);border-radius:16px;padding:20px}
.how .step .num{color:var(--primary);font-weight:800;font-size:13px}
.how .step h4{font-size:16px;font-weight:800;margin:6px 0}
.how .step p{color:var(--muted);font-size:14px}
.back{color:var(--muted);font-weight:700;font-size:14px;display:inline-block;margin:8px 0 16px}
footer{border-top:1px solid var(--line);padding:28px 0;color:var(--muted);font-size:13px;text-align:center;margin-top:24px}
@media(max-width:640px){.hero{padding:32px 22px;border-radius:18px}.hero h1{font-size:28px}.how{grid-template-columns:1fr}}
`;

function shell(title: string, description: string, canonical: string, body: string): string {
  return `<!doctype html><html lang="ru"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(canonical)}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>${CSS}</style></head>
<body><div class="wrap"><header><span class="mark"></span><span class="brand">Квалифай</span></header>${body}
<footer>Квалифай — умные ИИ-квизы для лидогенерации. Опишите бизнес — ИИ соберёт квиз за 60 секунд.</footer>
</div></body></html>`;
}

function nicheCard(n: Niche): string {
  return `<a class="card" href="/kviz-dlya/${n.slug}">
    <div class="emoji">${n.emoji}</div>
    <h3>${esc(n.name)}</h3>
    <p>${esc(n.intro.split('.')[0])}.</p>
    <div class="go">Смотреть пример →</div>
  </a>`;
}

export async function galleryRoutes(app: FastifyInstance) {
  // Публичный JSON для префилла онбординга в админке
  app.get('/api/niches', async () => niches.map((n) => ({ slug: n.slug, name: n.name, emoji: n.emoji })));
  app.get('/api/niches/:slug', async (req, reply) => {
    const n = findNiche((req.params as { slug: string }).slug);
    if (!n) return reply.code(404).send({ error: 'Ниша не найдена' });
    return { slug: n.slug, name: n.name, brief: n.brief };
  });

  // Индекс галереи
  app.get('/kviz-dlya', async (_req, reply) => {
    const body = `
    <section class="hero">
      <div class="eyebrow">Галерея квизов</div>
      <h1>Квиз для вашего бизнеса — за 60 секунд</h1>
      <p>Выберите нишу и посмотрите пример. Внутри — тот же ИИ-онбординг: опишите бизнес, и ИИ соберёт квиз, зададут умные вопросы и оценит каждый лид.</p>
      <a class="cta" href="/new">✨ Собрать свой квиз</a>
    </section>
    <div class="grid">${niches.map(nicheCard).join('')}</div>`;
    reply.type('text/html; charset=utf-8').send(shell(
      'Квиз для бизнеса — галерея по нишам | Квалифай',
      'Готовые примеры квизов для лидогенерации: строительство, ремонт, недвижимость, авто, мебель, образование и другие ниши. Соберите свой за 60 секунд.',
      `${ORIGIN}/kviz-dlya`, body,
    ));
  });

  // Страница ниши
  app.get('/kviz-dlya/:slug', async (req, reply) => {
    const n = findNiche((req.params as { slug: string }).slug);
    if (!n) return reply.code(404).type('text/html; charset=utf-8')
      .send(shell('Ниша не найдена | Квалифай', 'Страница не найдена', `${ORIGIN}/kviz-dlya`,
        '<section class="hero"><h1>Такой ниши пока нет</h1><a class="cta" href="/kviz-dlya">← В галерею</a></section>'));

    const others = niches.filter((x) => x.slug !== n.slug).slice(0, 3);
    const body = `
    <a class="back" href="/kviz-dlya">← Все ниши</a>
    <section class="hero">
      <div class="eyebrow">${n.emoji} ${esc(n.name)}</div>
      <h1>${esc(n.h1)}</h1>
      <p>${esc(n.intro)}</p>
      <a class="cta" href="/new?niche=${n.slug}">✨ Собрать такой для моего бизнеса</a>
    </section>

    <div class="section-title">Какие вопросы задаёт ИИ</div>
    <div class="qs">${n.sample_questions.map((q, i) => `<div class="q"><span class="n">${i + 1}</span><b>${esc(q)}</b></div>`).join('')}</div>

    <div class="section-title">Как это работает</div>
    <div class="how">
      <div class="step"><div class="num">01</div><h4>Опишите бизнес</h4><p>Пара предложений о том, что вы продаёте и кого считаете хорошим клиентом.</p></div>
      <div class="step"><div class="num">02</div><h4>ИИ соберёт квиз</h4><p>Вопросы под вашу нишу и правила оценки лидов — за 15 секунд.</p></div>
      <div class="step"><div class="num">03</div><h4>Получайте лиды</h4><p>Каждая заявка со скорингом 0–100 и резюме для продаж. Мусор не тарифицируется.</p></div>
    </div>

    <div class="section-title">Другие ниши</div>
    <div class="grid">${others.map(nicheCard).join('')}</div>`;

    reply.type('text/html; charset=utf-8').send(shell(
      `${n.h1} — пример и генерация | Квалифай`,
      `${n.intro} Соберите квиз для ниши «${n.name}» за 60 секунд с помощью ИИ.`,
      `${ORIGIN}/kviz-dlya/${n.slug}`, body,
    ));
  });
}
