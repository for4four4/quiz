import type { CSSProperties } from 'react';
import type { QuizDesign, QuizFull } from '../types';

/**
 * Живое превью обложки виджета в редакторе «Дизайн».
 * Повторяет токены и раскладку боевого виджета (widget/src/styles.ts),
 * но на инлайн-стилях — чтобы владелец сразу видел выбранную тему и стиль карточки.
 */
export function WidgetPreview({ quiz, design, scale = 1 }: { quiz: QuizFull; design: QuizDesign; scale?: number }) {
  const primary = design.primary || 'oklch(0.53 0.20 274)';
  const grad = design.grad || 'oklch(0.60 0.19 300)';
  const surface = design.surface || '#ffffff';
  const text = design.text || 'oklch(0.24 0.03 275)';
  const radius = design.radius ?? 16;
  const style = design.card_style || 'classic';

  const muted = `color-mix(in oklab, ${text}, transparent 44%)`;
  const border = `color-mix(in oklab, ${text}, transparent 86%)`;
  const tint = `color-mix(in oklab, ${primary}, ${surface} 88%)`;
  const gradient = `linear-gradient(120deg, ${primary}, ${grad})`;
  const r = (n: number) => `${Math.max(0, radius * n)}px`;

  const offer = quiz.settings.offer_page;
  const count = quiz.questions.length || quiz.settings.max_questions || 5;
  const chips = [`${count} вопросов`, '≈ 1 минута', ...(offer?.bonus ? [`Бонус: ${offer.bonus}`] : [])];
  const eyebrow = (quiz.settings as { eyebrow?: string }).eyebrow;
  const sub = (quiz.settings as { cover_subtitle?: string }).cover_subtitle;

  const card: CSSProperties = {
    width: 320, background: surface, color: text, borderRadius: r(1.4), overflow: 'hidden',
    border: `1px solid ${border}`, boxShadow: '0 24px 50px -28px rgba(20,20,50,.3)',
    fontFamily: "'Manrope Variable', sans-serif", transform: `scale(${scale})`, transformOrigin: 'top center',
  };
  const body: CSSProperties = { padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 300 };
  const title: CSSProperties = { fontSize: 22, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.1, margin: 0 };
  const subCss: CSSProperties = { fontSize: 13.5, color: muted, margin: 0, lineHeight: 1.5 };
  const chipCss: CSSProperties = { display: 'inline-block', padding: '6px 11px', borderRadius: 999, background: tint,
    color: `color-mix(in oklab, ${primary}, black 12%)`, fontSize: 12, fontWeight: 600 };
  const cta: CSSProperties = { border: 'none', borderRadius: r(0.75), background: gradient, color: '#fff',
    padding: '13px', fontSize: 15, fontWeight: 700, cursor: 'default', fontFamily: 'inherit' };
  const eyebrowCss: CSSProperties = { fontSize: 10.5, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: primary };
  const footer: CSSProperties = { borderTop: `1px solid ${border}`, padding: 10, textAlign: 'center', fontSize: 10.5, color: muted, fontWeight: 500 };
  const chipRow = <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{chips.map((c) => <span key={c} style={chipCss}>{c}</span>)}</div>;
  const brand = <div style={footer}>Сделано на <b style={{ color: text }}>◆ Квалифай</b></div>;

  if (style === 'minimal') {
    return (
      <div style={card}>
        <div style={{ ...body, gap: 18, justifyContent: 'center' }}>
          <span style={{ width: 36, height: 36, borderRadius: r(0.65), background: gradient }} />
          <h1 style={{ ...title, fontSize: 28 }}>{quiz.title}</h1>
          <div style={{ flex: 1 }} />
          <button style={cta}>Начать →</button>
        </div>{brand}
      </div>
    );
  }
  if (style === 'banner') {
    return (
      <div style={card}>
        <div style={{ ...body, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 0 }}>
          <span style={{ width: 42, height: 42, flex: 'none', borderRadius: r(0.65), background: tint, display: 'grid', placeItems: 'center', color: primary, fontWeight: 800 }}>✦</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ ...title, fontSize: 16 }}>{quiz.title}</h1>
            <p style={{ ...subCss, fontSize: 12 }}>{count} вопросов · ≈ 1 минута</p>
          </div>
          <button style={{ ...cta, padding: '11px 16px', flex: 'none' }}>Пройти</button>
        </div>{brand}
      </div>
    );
  }
  if (style === 'gradient') {
    return (
      <div style={card}>
        <div style={{ ...body, background: gradient, color: '#fff' }}>
          {eyebrow && <div style={{ ...eyebrowCss, color: 'rgba(255,255,255,.7)' }}>{eyebrow}</div>}
          <h1 style={title}>{quiz.title}</h1>
          {sub && <p style={{ ...subCss, color: 'rgba(255,255,255,.8)' }}>{sub}</p>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {chips.map((c) => <span key={c} style={{ ...chipCss, background: 'rgba(255,255,255,.15)', color: '#fff' }}>{c}</span>)}
          </div>
          <div style={{ flex: 1, minHeight: 12 }} />
          <button style={{ ...cta, background: '#fff', color: primary }}>Пройти квиз</button>
        </div>{brand}
      </div>
    );
  }
  if (style === 'photo') {
    return (
      <div style={card}>
        <div style={{ position: 'relative' }}>
          {design.hero_image
            ? <img src={design.hero_image} alt="" style={{ width: '100%', height: 150, objectFit: 'cover', display: 'block' }} />
            : <div style={{ height: 150, background: `linear-gradient(135deg, ${tint}, ${surface})`, display: 'grid', placeItems: 'center', color: muted, fontSize: 12 }}>Добавьте фото объекта</div>}
          <span style={{ position: 'absolute', left: 12, bottom: 10, padding: '5px 10px', borderRadius: 999, background: `color-mix(in oklab, ${text}, transparent 20%)`, color: '#fff', fontSize: 11, fontWeight: 700 }}>≈ 1 минута · {count} вопросов</span>
        </div>
        <div style={{ ...body, minHeight: 160 }}>
          <h1 style={title}>{quiz.title}</h1>
          {sub && <p style={subCss}>{sub}</p>}
          <div style={{ flex: 1 }} />
          <button style={cta}>Пройти квиз</button>
        </div>{brand}
      </div>
    );
  }
  return (
    <div style={card}>
      <div style={body}>
        {eyebrow && <div style={eyebrowCss}>{eyebrow}</div>}
        <h1 style={title}>{quiz.title}</h1>
        {sub && <p style={subCss}>{sub}</p>}
        {chipRow}
        <div style={{ flex: 1, minHeight: 12 }} />
        <button style={cta}>Пройти квиз</button>
      </div>{brand}
    </div>
  );
}
