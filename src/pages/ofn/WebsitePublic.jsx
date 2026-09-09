// Ported from Oatmeal Farm Network (src/WebsitePublic.jsx). Mechanical adaptations only:
// router package, i18n hook, component paths and API base env var.
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router';
import { useTranslation } from '../../lib/i18n';
import PageMeta from '../../components/PageMeta';
import { LivestockAnimalDetailContent } from '../../components/website/LivestockAnimalDetailContent';

const API = import.meta.env.VITE_LIVESTOCK_API_URL;

// Convert rem/em font sizes to px so old DB values still render correctly
function remToPx(val) {
  if (val === null || val === undefined || val === '') return '';
  const s = String(val).trim();
  if (!s) return '';
  if (s.endsWith('px')) return s;
  const num = parseFloat(s);
  if (isNaN(num)) return '';
  if (s.endsWith('rem') || s.endsWith('em')) return `${Math.round(num * 16)}px`;
  if (/^[0-9.]+$/.test(s)) return `${Math.round(num)}px`;
  return s;
}

// Build CSS for site-wide image styling (rounded corners + drop shadow)
function buildPublicImageCss(site) {
  if (!site) return '';
  const radius   = Number(site.image_border_radius ?? 0);
  const enabled  = !!site.image_shadow_enabled;
  const color    = site.image_shadow_color    || 'rgba(0,0,0,0.35)';
  const distance = Number(site.image_shadow_distance ?? 4);
  const blur     = Number(site.image_shadow_blur     ?? 8);
  const angle    = Number(site.image_shadow_angle    ?? 135);
  const rad = (angle * Math.PI) / 180;
  const ox  = Math.round(Math.cos(rad) * distance);
  const oy  = Math.round(Math.sin(rad) * distance);
  const parts = ['margin:8px !important;'];
  if (radius > 0)  parts.push(`border-radius:${radius}% !important;`);
  if (enabled)     parts.push(`box-shadow:${ox}px ${oy}px ${blur}px ${color} !important;`);
  const rule = parts.join('');
  // Imgs inside figures share the figure's margins, so override the bare-img margin
  // to 0 — otherwise 100%-wide imgs overflow their parent figure.
  // [data-no-style] opts an image (or iframe/video) out of all site-wide styling.
  const figRule = [];
  if (radius > 0) figRule.push(`border-radius:${radius}% !important;`);
  if (enabled)    figRule.push(`box-shadow:${ox}px ${oy}px ${blur}px ${color} !important;`);
  const figStyle = figRule.join('');
  return `.site-rte img:not([data-no-style]) { ${rule} }
.site-rte figure > img:not([data-no-style]) { margin:0 !important; ${figStyle} }
.site-rte iframe:not([data-no-style]), .site-rte video:not([data-no-style]) { ${figStyle} }
.site-rte .wb-video-shield { display: none !important; }`;
}

// ── Build CSS rules for [data-rte-style] spans (mirrors WebsiteBuilder's buildRteTypoCss) ──
function buildPublicRteTypoCss(site) {
  if (!site) return '';
  return [['h1','h1'],['h2','h2'],['h3','h3'],['h4','h4'],['body','body']].map(([k]) => {
    const size       = remToPx(site[`${k}_size`]) || (k==='body'?'16px':k==='h1'?'40px':k==='h2'?'29px':k==='h3'?'21px':'17px');
    const weight     = site[`${k}_weight`] || (k==='body'?'400':k==='h1'?'800':k==='h2'?'700':k==='h3'?'600':'600');
    const color      = site[`${k}_color`]  || site.text_color || '';
    const fontFamily = site[`${k}_font`]   || site.font_family || '';
    const uline      = site[`${k}_underline`];
    const italic     = site[`${k}_italic`];
    const hasRule    = k !== 'body' && site[`${k}_rule`];
    const ruleclr    = site[`${k}_rule_color`] || site.text_color || '#000';
    const align      = site[`${k}_align`]  || 'left';
    let css = `font-size:${size};font-weight:${weight};`;
    if (fontFamily) css += `font-family:${fontFamily};`;
    if (color)      css += `color:${color};`;
    css += italic ? `font-style:italic;` : `font-style:normal;`;
    css += uline ? `text-decoration:underline;` : `text-decoration:none;`;
    css += hasRule ? `border-bottom:2px solid ${ruleclr};padding-bottom:2px;` : `border-bottom:none;padding-bottom:0;`;
    if (align !== 'left') css += `display:inline-block;text-align:${align};width:100%;`;
    return `.site-rte [data-rte-style="${k}"] { ${css} }`;
  }).join('\n    ');
}

// ── Blog content helpers ─────────────────────────────────────────
function blogExcerpt(content, wordLimit = 30) {
  if (!content) return '';
  let text = content;
  try {
    const blocks = JSON.parse(content);
    if (Array.isArray(blocks))
      text = blocks.filter(b => b.type === 'text').map(b => b.content || '').join(' ');
  } catch {}
  // Text blocks may embed images with captions as <figure><img><figcaption>…</figcaption></figure>.
  // Drop the whole figure so caption text never leaks into the excerpt.
  const stripped = text
    .replace(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi, ' ')
    .replace(/<figcaption\b[^>]*>[\s\S]*?<\/figcaption>/gi, ' ');
  const plain = stripped.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!plain) return '';
  const words = plain.split(' ');
  if (words.length <= wordLimit) return plain;
  return words.slice(0, wordLimit).join(' ') + '…';
}

function blogCoverImage(post) {
  if (post.cover_image) return post.cover_image;
  const raw = post.content || '';
  try {
    const blocks = JSON.parse(raw);
    if (Array.isArray(blocks)) {
      // 1. Dedicated image block
      const img = blocks.find(b => b.type === 'image' && b.url);
      if (img) return img.url;
      // 2. <img> embedded inside a text block (figure/img markup from RTE)
      for (const b of blocks) {
        if (b.type === 'text' && b.content) {
          const m = b.content.match(/<img[^>]+src="([^"]+)"/i);
          if (m) return m[1];
        }
      }
    }
  } catch {}
  // 3. Legacy plain-HTML content
  const m = raw.match(/<img[^>]+src="([^"]+)"/i);
  return m ? m[1] : null;
}

function renderBlogContent(content) {
  if (!content) return null;
  let blocks;
  try {
    blocks = JSON.parse(content);
    if (!Array.isArray(blocks)) throw new Error();
  } catch {
    return <div style={{ fontSize: '1rem', color: '#1f2937', lineHeight: 1.8, wordBreak: 'break-word' }} dangerouslySetInnerHTML={{ __html: content }} />;
  }
  return (
    <>
      {blocks.map((block, i) => {
        if (block.type === 'image') {
          return (
            <figure key={i} style={{ margin: '1.75rem 0', textAlign: block.align || 'center' }}>
              <img src={block.url} alt={block.caption || ''} style={{ width: block.width || '100%', maxWidth: '100%', borderRadius: 10, display: 'inline-block', objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
              {block.caption && <figcaption style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.4rem', fontStyle: 'italic' }}>{block.caption}</figcaption>}
            </figure>
          );
        }
        return <div key={i} style={{ fontSize: '1rem', color: '#1f2937', lineHeight: 1.8, wordBreak: 'break-word', marginBottom: '0.5rem' }} dangerouslySetInnerHTML={{ __html: block.content || '' }} />;
      })}
    </>
  );
}

// ── Content cache (avoid re-fetching per block) ──────────────────
const contentCache = {};
async function fetchContent(url) {
  if (contentCache[url]) return contentCache[url];
  const r = await fetch(url);
  if (!r.ok) return [];
  const data = await r.json();
  contentCache[url] = data;
  return data;
}

// ── Dropdown nav item with hover state ───────────────────────────
function DropdownItem({ label, active, navColor, hoverColor, fontFamily, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block', width: '100%', textAlign: 'left',
        background: active || hovered ? hoverColor : 'none',
        border: 0, borderBottom: '1px solid rgba(255,255,255,0.08)',
        color: navColor, padding: '0.2rem 1rem',
        fontWeight: active ? 700 : 400, cursor: 'pointer',
        fontSize: '0.87rem', fontFamily,
        transition: 'background 0.15s',
      }}
    >{label}</button>
  );
}

// ── Block renderers ───────────────────────────────────────────────

function SlideshowBlock({ data, site }) {
  const { t } = useTranslation(); const wp = (k, o) => t(`website_public.${k}`, o);
  // Images can be array of strings or objects {url, caption}
  const raw = Array.isArray(data.images) ? data.images : [];
  const slides = raw
    .map(s => (typeof s === 'string' ? { url: s, caption: '' } : s))
    .filter(s => s && s.url);
  const [idx, setIdx] = React.useState(0);
  const intervalMs = Math.max(2000, Number(data.interval_ms) || 5000);
  const bgWidth = site.body_bg_width || '100%';
  React.useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % slides.length), intervalMs);
    return () => clearInterval(t);
  }, [slides.length, intervalMs]);
  if (slides.length === 0) return null;
  const current = slides[idx];
  const showDots = data.show_dots !== false && slides.length > 1;
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <section style={{
        width: '100%', maxWidth: bgWidth,
        position: 'relative', overflow: 'hidden',
        aspectRatio: '16 / 6', minHeight: 280, maxHeight: 620,
        background: '#000',
      }}>
        {slides.map((s, i) => (
          <img
            key={s.url}
            src={s.url}
            alt={s.caption || ''}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%', objectFit: 'cover',
              opacity: i === idx ? 1 : 0,
              transition: 'opacity 700ms ease',
            }}
          />
        ))}
        {current.caption && (
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0,
            padding: '1rem 2rem',
            background: 'linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0))',
            color: '#fff', fontFamily: site.font_family, fontSize: '1.05rem',
          }}>{current.caption}</div>
        )}
        {showDots && (
          <div style={{
            position: 'absolute', bottom: 12, left: 0, right: 0,
            display: 'flex', justifyContent: 'center', gap: 8,
          }}>
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={wp('slide_n', { n: i + 1 })}
                style={{
                  width: 10, height: 10, borderRadius: '50%',
                  border: 'none', cursor: 'pointer',
                  background: i === idx ? '#fff' : 'rgba(255,255,255,0.5)',
                  padding: 0,
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// Readable text over an arbitrary background: pick white or the site's own text
// colour by the background's luminance, rather than assuming every hero sits on
// something dark. A site whose primary colour is #FFFFFF was getting white
// headings on a white band.
function readableOn(bgColor, darkText) {
  const hex = String(bgColor || '').trim().replace('#', '');
  if (hex.length !== 3 && hex.length !== 6) return '#fff';
  const full = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return '#fff';
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  // Rec. 709 relative luminance, 0..255
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) > 140 ? (darkText || '#111827') : '#fff';
}

function HeroBlock({ data, site }) {
  const align = data.align || 'center';
  const alignClass = align === 'left' ? 'items-start text-left' : align === 'right' ? 'items-end text-right' : 'items-center text-center';
  const bgWidth = site.body_bg_width || '100%';
  const textWidth = site.body_content_width || '100%';
  // Same rule as the builder preview, so the two agree.
  const heroText = data.image_url ? '#fff' : readableOn(site.primary_color, site.text_color);
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <section style={{
        width: '100%', maxWidth: bgWidth,
        minHeight: data.min_height_px ? `${data.min_height_px}px` : '70vh',
        display: 'flex', alignItems: 'center',
        justifyContent: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
        backgroundImage: data.image_url ? `url(${data.image_url})` : `linear-gradient(135deg, ${site.primary_color}cc, ${site.secondary_color}cc)`,
        backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative',
        paddingTop: 10,
      }}>
        {data.image_url && data.overlay && (
          <div style={{ position: 'absolute', inset: 0, background: data.overlay_color || 'rgba(0,0,0,0.45)' }} />
        )}
        <div style={{ position: 'relative', width: '100%', maxWidth: textWidth, padding: '3rem 2rem', zIndex: 1 }}
             className={`flex flex-col gap-4 ${alignClass}`}>
          {data.headline && (
            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.15,
                          color: heroText, fontFamily: site.font_family }}>
              {data.headline}
            </h1>
          )}
          {data.subtext && (
            <div className="site-rte" style={{ fontSize: '1.2rem', color: data.image_url ? 'rgba(255,255,255,0.9)' : heroText,
                         fontFamily: site.font_family }}
                 dangerouslySetInnerHTML={{ __html: addLinkTargets(data.subtext) }} />
          )}
          {data.cta_text && data.cta_link && (
            <a href={data.cta_link} style={{
              display: 'inline-block', background: site.accent_color, color: '#fff',
              fontWeight: 700, padding: '0.85rem 2rem', borderRadius: 50, textDecoration: 'none',
              fontSize: '1rem', transition: 'transform 0.2s', boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
               onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              {data.cta_text}
            </a>
          )}
        </div>
      </section>
    </div>
  );
}

// Normalize images to {url, wrap, w} — handles new format and old position/x fields
const POS_DEFAULTS_PUB = { right:{wrap:'right',w:38}, left:{wrap:'left',w:38}, center:{wrap:'center',w:60}, full:{wrap:'full',w:100}, top:{wrap:'center',w:50}, bottom:{wrap:'right',w:38} };
function normImages(data) {
  const topCaption = data.image_caption || '';
  const raw = Array.isArray(data.images) && data.images.length > 0
    ? data.images
    : (data.image_url ? [data.image_url] : []);
  return raw.map(img => {
    if (typeof img === 'string') {
      const pos = data.image_position || 'right';
      const defaults = POS_DEFAULTS_PUB[pos] || POS_DEFAULTS_PUB.right;
      const w = data.image_width || defaults.w;
      return { url: img, ...defaults, w, caption: topCaption };
    }
    const caption = img.caption || topCaption;
    if (!img.wrap && typeof img.x === 'number') return { wrap: img.x < 50 ? 'left' : 'right', w: img.w || 38, y: img.y || 0, url: img.url, caption };
    if (!img.wrap && img.position) { const pos = img.position || 'right'; return { url: img.url, ...(POS_DEFAULTS_PUB[pos] || POS_DEFAULTS_PUB.right), caption }; }
    return { y: 0, ...img, caption };
  });
}

function figureWrapStyle(img, shadow) {
  const w  = `${Math.min(90, img.w || 38)}%`;
  const mt = `${img.y || 0}%`;
  const sh = shadow ? { boxShadow: '0 4px 20px rgba(0,0,0,0.12)' } : {};
  const base = { margin: 0, padding: 0, borderRadius: 12, overflow: 'hidden', ...sh };
  switch (img.wrap || 'right') {
    case 'left':   return { ...base, float:'left',  width:w, marginTop:mt, marginRight:'1.5rem', marginBottom:'1rem' };
    case 'right':  return { ...base, float:'right', width:w, marginTop:mt, marginLeft:'1.5rem',  marginBottom:'1rem' };
    case 'center': return { ...base, display:'block', width:w, marginTop:mt, marginLeft:'auto', marginRight:'auto', marginBottom:'1rem', clear:'both' };
    case 'full':   return { ...base, display:'block', width:'100%', marginTop:mt, marginBottom:'1rem', clear:'both' };
    default:       return { ...base, float:'right', width:w, marginTop:mt, marginLeft:'1.5rem', marginBottom:'1rem' };
  }
}

function BlockImage({ img, shadow }) {
  const hasCaption = img.caption && img.caption.trim();
  return (
    <figure style={figureWrapStyle(img, shadow)}>
      <img
        src={img.url}
        alt={img.caption || ''}
        style={{
          display: 'block',
          width: '100%',
          borderRadius: 12,
        }}
      />
      {hasCaption && (
        <figcaption style={{
          color: '#6b7280',
          fontSize: '0.8rem',
          textAlign: 'center',
          padding: '5px 10px',
          lineHeight: 1.4,
        }}>
          {img.caption}
        </figcaption>
      )}
    </figure>
  );
}

const stripHtml = html => html?.replace(/<[^>]*>/g, '').trim() || '';
// True if the HTML has any visible content — text OR an embedded media element
const hasRteContent = html => !!(html && (stripHtml(html) || /<(img|iframe|video|figure)\b/i.test(html)));

// Ensure every external <a> tag opens in a new tab. Internal page links
// (marked with data-page-slug) are left alone so the SPA click handler
// can intercept them.
const addLinkTargets = html =>
  html ? html.replace(/<a\b([^>]*)>/gi, (full, attrs) => {
    if (/\bdata-page-slug\s*=/i.test(attrs)) return full;
    const clean = attrs
      .replace(/\btarget\s*=\s*["'][^"']*["']/gi, '')
      .replace(/\brel\s*=\s*["'][^"']*["']/gi, '');
    return `<a${clean} target="_blank" rel="noopener noreferrer">`;
  }) : html;

function AboutBlock({ data, site }) {
  const imgs       = normImages(data);
  const hasHeading = !!data.heading?.trim();
  const hasBody    = hasRteContent(data.body);
  if (!hasHeading && !hasBody && imgs.length === 0) return null;
  return (
    <SectionWrap site={site} blockBgColor={data.bg_color || undefined}>
      <div style={{ overflow: 'hidden' }}>
        {imgs.map((img, i) => <BlockImage key={i} img={img} shadow={true} />)}
        {hasHeading && <SectionHeading html={data.heading} site={site} headingStyle={data.heading_style || 'h2'} />}
        {hasBody && <BodyText html={data.body} site={site} />}
        <div style={{ clear: 'both' }} />
      </div>
    </SectionWrap>
  );
}

function ContentBlock({ data, site }) {
  const imgs       = normImages(data);
  const hasHeading = !!data.heading?.trim();
  const hasBody    = hasRteContent(data.body);
  if (!hasHeading && !hasBody && imgs.length === 0) return null;

  // Use flexbox layout (matching editor) for a single side image (left/right).
  // data.image_width is authoritative (set by the editor's resize handle);
  // fall back to img0.w (from normImages/d.images) then to 38.
  const img0   = imgs[0];
  const isSide = img0 && (img0.wrap === 'left' || img0.wrap === 'right');

  if (isSide && (hasHeading || hasBody)) {
    const flexDir  = img0.wrap === 'left' ? 'row' : 'row-reverse';
    const wPct     = data.image_width ?? img0.w ?? 38;
    const imgW     = `${Math.min(90, wPct)}%`;
    const imgUrl   = data.image_url || img0.url;
    const caption  = data.image_caption || img0.caption || '';
    const otherImgs = imgs.slice(1);
    return (
      <SectionWrap site={site} blockBgColor={data.bg_color || undefined}>
        <div style={{ display: 'flex', flexDirection: flexDir, gap: '2rem', alignItems: 'flex-start' }}>
          <div style={{ width: imgW, flexShrink: 0 }}>
            <img src={imgUrl} alt={caption} style={{ width: '100%', display: 'block', borderRadius: 8 }} />
            {caption && (
              <p style={{ fontSize: '0.78rem', color: '#6b7280', fontStyle: 'italic', textAlign: 'center', margin: '4px 0 0' }}>{caption}</p>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            {otherImgs.map((img, i) => <BlockImage key={i} img={img} shadow={false} />)}
            {hasHeading && <SectionHeading html={data.heading} site={site} headingStyle={data.heading_style || 'h2'} />}
            {hasBody && <BodyText html={data.body} site={site} />}
            <div style={{ clear: 'both' }} />
          </div>
        </div>
      </SectionWrap>
    );
  }

  return (
    <SectionWrap site={site} blockBgColor={data.bg_color || undefined}>
      <div style={{ overflow: 'hidden' }}>
        {imgs.map((img, i) => <BlockImage key={i} img={img} shadow={false} />)}
        {hasHeading && <SectionHeading html={data.heading} site={site} headingStyle={data.heading_style || 'h2'} />}
        {hasBody && <BodyText html={data.body} site={site} />}
        <div style={{ clear: 'both' }} />
      </div>
    </SectionWrap>
  );
}

// Multi-column content block — stacks on mobile
function MultiColumnBlock({ data, site, columnCount }) {
  const rawCols = Array.isArray(data.columns) ? data.columns : [];
  const cols = [...rawCols];
  while (cols.length < columnCount) cols.push({});
  cols.length = columnCount;

  const anyContent = cols.some(c =>
    c.heading?.trim() || hasRteContent(c.body) || normImages(c).length > 0
  );
  if (!anyContent) return null;

  const gap   = columnCount === 4 ? '0.5rem' : '1.5rem';
  const basis = columnCount === 2 ? 'calc(50% - 0.75rem)' : 'calc(25% - 0.375rem)';

  return (
    <SectionWrap site={site} blockBgColor={data.bg_color || undefined}>
      <div className="wb-multicol-public" style={{ display: 'flex', flexWrap: 'wrap', gap, alignItems: 'flex-start' }}>
        {cols.map((c, i) => {
          const colImgs    = normImages(c);
          const hasHeading = !!c.heading?.trim();
          const hasBody    = hasRteContent(c.body);
          const img0       = colImgs[0];
          const isSide     = img0 && (img0.wrap === 'left' || img0.wrap === 'right');
          if (isSide && (hasHeading || hasBody)) {
            const flexDir  = img0.wrap === 'left' ? 'row' : 'row-reverse';
            const wPct     = c.image_width ?? img0.w ?? 38;
            const imgW     = `${Math.min(90, wPct)}%`;
            const imgUrl   = c.image_url || img0.url;
            const caption  = c.image_caption || img0.caption || '';
            return (
              <div key={i} className="wb-multicol-public-col" style={{ flex: `1 1 ${basis}`, minWidth: 0 }}>
                <div style={{ display: 'flex', flexDirection: flexDir, gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ width: imgW, flexShrink: 0 }}>
                    <img src={imgUrl} alt={caption} style={{ width: '100%', display: 'block', borderRadius: 8 }} />
                    {caption && <p style={{ fontSize: '0.78rem', color: '#6b7280', fontStyle: 'italic', textAlign: 'center', margin: '4px 0 0' }}>{caption}</p>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    {colImgs.slice(1).map((img, j) => <BlockImage key={j} img={img} shadow={false} />)}
                    {hasHeading && <SectionHeading html={c.heading} site={site} headingStyle={c.heading_style || 'h2'} />}
                    {hasBody && <BodyText html={c.body} site={site} />}
                    <div style={{ clear: 'both' }} />
                  </div>
                </div>
              </div>
            );
          }
          return (
            <div key={i} className="wb-multicol-public-col" style={{ flex: `1 1 ${basis}`, minWidth: 0 }}>
              <div style={{ overflow: 'hidden' }}>
                {colImgs.map((img, j) => <BlockImage key={j} img={img} shadow={false} />)}
                {hasHeading && <SectionHeading html={c.heading} site={site} headingStyle={c.heading_style || 'h2'} />}
                {hasBody && <BodyText html={c.body} site={site} />}
                <div style={{ clear: 'both' }} />
              </div>
            </div>
          );
        })}
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 900px) {
          .wb-multicol-public .wb-multicol-public-col { flex: 1 1 100% !important; }
        }
      `}} />
    </SectionWrap>
  );
}

function LivestockBlock({ data, site, businessId, mode = 'sale' }) {
  const { t } = useTranslation(); const wp = (k, o) => t(`website_public.${k}`, o);
  const isStud = mode === 'stud';
  const [animals, setAnimals] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [viewMode, setViewMode] = useState(data.default_view || 'grid');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [detailAnimal, setDetailAnimal] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => { setViewMode(data.default_view || 'grid'); }, [data.default_view]);

  useEffect(() => {
    fetchContent(`${API}/api/website/content/livestock?business_id=${businessId}`)
      .then(all => setAnimals(Array.isArray(all) ? all : []))
      .catch(() => setAnimals([]));
  }, [businessId]);

  const primary    = site.primary_color  || '#3D6B34';
  const textColor  = site.text_color     || '#111827';
  const fontFamily = site.font_family    || 'inherit';
  const bodySize   = site.body_size      || '1rem';

  const stripHtml = (s) => {
    if (!s) return '';
    try {
      const tmp = document.createElement('div');
      tmp.innerHTML = s;
      return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
    } catch {
      return String(s).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }
  };
  const fmtPrice = (n) => {
    if (n === null || n === undefined || n === '' || Number(n) === 0) return '';
    const num = Number(n);
    if (Number.isNaN(num)) return '';
    return num.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  };
  const showStud = (a) => a.PublishStud && Number(a.StudFee || 0) > 0;

  // Only "For Sale" animals
  const forSale = useMemo(() => animals.filter(a => isStud ? (a.PublishStud || Number(a.StudFee || 0) > 0) : a.PublishForSale), [animals, isStud]);

  const visible = useMemo(() => {
    let list = forSale;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(a =>
        (a.FullName || '').toLowerCase().includes(q) ||
        (a.Breed || '').toLowerCase().includes(q) ||
        (a.CategoryName || '').toLowerCase().includes(q) ||
        (a.Description || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [forSale, search]);

  const groups = useMemo(() => {
    const map = new Map();
    for (const a of visible) {
      const key = a.CategoryName || 'Other';
      if (!map.has(key)) {
        map.set(key, {
          name: a.CategoryName || 'Other',
          plural: a.CategoryPlural || (a.CategoryName ? `${a.CategoryName}s` : 'Other'),
          order: a.CategoryOrder ?? 9999,
          items: [],
        });
      }
      map.get(key).items.push(a);
    }
    const arr = [...map.values()];
    arr.sort((a, b) => (a.order - b.order) || a.name.localeCompare(b.name));
    const priceOf = (a) => {
      const s = Number(a.SalePrice || 0);
      const p = Number(a.Price || 0);
      return s > 0 ? s : p;
    };
    for (const g of arr) {
      g.items.sort((x, y) => {
        if (sortKey === 'name')       return (x.FullName || '').localeCompare(y.FullName || '');
        if (sortKey === 'breed')      return (x.Breed || '').localeCompare(y.Breed || '');
        if (sortKey === 'price_asc')  return priceOf(x) - priceOf(y);
        if (sortKey === 'price_desc') return priceOf(y) - priceOf(x);
        return 0;
      });
    }
    return arr;
  }, [visible, sortKey]);

  const flat = useMemo(() => groups.flatMap(g => g.items), [groups]);
  const indexOf = (animal) => flat.findIndex(x => x.AnimalID === animal.AnimalID);
  const defaultHeading = isStud ? wp('stud_default_heading') : wp('livestock_default_heading');
  const groupHeading = (g) => g.plural || g.name;

  const breedCount = useMemo(() => {
    const s = new Set();
    for (const a of forSale) if (a.Breed) s.add(a.Breed);
    return s.size;
  }, [forSale]);
  useEffect(() => {
    if (sortKey === 'breed' && breedCount < 2) setSortKey('name');
  }, [breedCount, sortKey]);

  // ── Detail view ──
  // Fetch the full marketplace detail payload whenever the selected animal changes.
  const selectedStub = selectedIdx !== null ? flat[selectedIdx] : null;
  useEffect(() => {
    if (!selectedStub) { setDetailAnimal(null); return; }
    setDetailLoading(true);
    fetch(`${API}/api/marketplace/animal/${selectedStub.AnimalID}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setDetailAnimal(d))
      .catch(() => setDetailAnimal(null))
      .finally(() => setDetailLoading(false));
  }, [selectedStub?.AnimalID]);

  if (forSale.length === 0) return null;

  const ctrlBtn = (active) => ({
    padding: '6px 12px',
    background: active ? primary : '#fff',
    color: active ? '#fff' : '#64748b',
    border: `1px solid ${active ? primary : '#e2e8f0'}`,
    borderRadius: 0, cursor: 'pointer', fontSize: 13, fontWeight: 600,
  });

  if (selectedIdx !== null && selectedStub) {
    return (
      <SectionWrap site={site} blockBgColor={data.bg_color}>
        {detailLoading && !detailAnimal ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#9ca3af' }}>{wp('livestock_loading')}</div>
        ) : detailAnimal ? (
          <LivestockAnimalDetailContent
            animal={detailAnimal}
            siteMode
            onBack={() => setSelectedIdx(null)}
            backLabel={data.heading || defaultHeading}
            onPrev={() => setSelectedIdx(selectedIdx - 1)}
            onNext={() => setSelectedIdx(selectedIdx + 1)}
            hasPrev={selectedIdx > 0}
            hasNext={selectedIdx < flat.length - 1}
            primaryColor={primary}
            fontFamily={fontFamily}
          />
        ) : (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#ef4444' }}>
            {wp('livestock_error')}
            <div style={{ marginTop: 12 }}>
              <button onClick={() => setSelectedIdx(null)} style={{ background: 'none', border: 'none', color: primary, cursor: 'pointer', fontSize: bodySize }}>{wp('livestock_back', { heading: data.heading || defaultHeading })}</button>
            </div>
          </div>
        )}
      </SectionWrap>
    );
  }

  // ── Card renderers ──
  const renderGridCard = (a) => (
    <div key={a.AnimalID}
      onClick={() => setSelectedIdx(indexOf(a))}
      style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'box-shadow 0.15s', display: 'flex', flexDirection: 'column' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.11)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'}
    >
      {a.Photo1
        ? <img src={a.Photo1} alt={a.FullName || ''} style={{ width: '100%', height: 'auto', display: 'block' }} onError={e => e.target.style.display = 'none'} />
        : <div style={{ aspectRatio: '4 / 3', background: `${primary}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>🐄</div>}
      <div style={{ padding: '0.75rem 0.9rem', display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: '0.98rem', color: textColor, lineHeight: 1.3, fontFamily }}>{a.FullName}</div>
        {(a.Breed || a.CategoryName) && <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>{a.Breed}{a.Breed && a.CategoryName ? ' · ' : ''}{a.CategoryName}</div>}
        {isStud ? (
          fmtPrice(a.StudFee) && (
            <div style={{ fontSize: '0.85rem', marginTop: 2 }}>
              <span style={{ color: primary, fontWeight: 700 }}>{wp('lbl_stud_fee_colon')}{fmtPrice(a.StudFee)}</span>
            </div>
          )
        ) : (fmtPrice(a.Price) || showStud(a)) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: '0.85rem', marginTop: 2 }}>
            {fmtPrice(a.Price) && (
              <span style={{ color: primary, fontWeight: 700 }}>
                {fmtPrice(a.Price)}
                {fmtPrice(a.SalePrice) && <span style={{ color: '#ef4444', marginLeft: 4 }}>({fmtPrice(a.SalePrice)})</span>}
              </span>
            )}
            {showStud(a) && <span style={{ color: '#6B7280' }}>{wp('lbl_stud_space')}{fmtPrice(a.StudFee)}</span>}
          </div>
        )}
        {a.PriceComments && <div style={{ fontSize: '0.74rem', color: '#9ca3af', fontStyle: 'italic' }}>{stripHtml(a.PriceComments)}</div>}
      </div>
    </div>
  );

  const renderListCard = (a) => (
    <div key={a.AnimalID}
      onClick={() => setSelectedIdx(indexOf(a))}
      style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', cursor: 'pointer', transition: 'box-shadow 0.15s', alignItems: 'stretch' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.11)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'}
    >
      {a.Photo1
        ? <img src={a.Photo1} alt={a.FullName || ''} style={{ width: 220, minWidth: 220, height: 'auto', objectFit: 'contain', alignSelf: 'flex-start', flexShrink: 0, display: 'block', background: '#f8fafc' }} onError={e => e.target.style.display = 'none'} />
        : <div style={{ width: 220, minWidth: 220, background: `${primary}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', flexShrink: 0 }}>🐄</div>}
      <div style={{ padding: '1rem 1.2rem', display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: textColor, lineHeight: 1.3, fontFamily }}>{a.FullName}</div>
        {(a.Breed || a.CategoryName) && <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>{a.Breed}{a.Breed && a.CategoryName ? ' · ' : ''}{a.CategoryName}</div>}
        {isStud ? (
          fmtPrice(a.StudFee) && (
            <div style={{ fontSize: '0.92rem', marginTop: 2 }}>
              <span style={{ color: primary, fontWeight: 700 }}>{wp('lbl_stud_fee_colon')}{fmtPrice(a.StudFee)}</span>
            </div>
          )
        ) : (fmtPrice(a.Price) || showStud(a)) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: '0.92rem', marginTop: 2 }}>
            {fmtPrice(a.Price) && (
              <span style={{ color: primary, fontWeight: 700 }}>
                {fmtPrice(a.Price)}
                {fmtPrice(a.SalePrice) && <span style={{ color: '#ef4444', marginLeft: 4 }}>({fmtPrice(a.SalePrice)})</span>}
              </span>
            )}
            {showStud(a) && <span style={{ color: '#6B7280' }}>{wp('lbl_stud_colon')}<strong style={{ color: textColor }}>{fmtPrice(a.StudFee)}</strong></span>}
          </div>
        )}
        {a.PriceComments && <div style={{ fontSize: '0.78rem', color: '#9ca3af', fontStyle: 'italic' }}>{stripHtml(a.PriceComments)}</div>}
        {a.Description && <p style={{ margin: 0, fontSize: '0.88rem', color: '#4b5563', lineHeight: 1.6, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{stripHtml(a.Description)}</p>}
      </div>
    </div>
  );

  return (
    <SectionWrap site={site} blockBgColor={data.bg_color}>
      <SectionHeading site={site} headingStyle={data.heading_style || 'h1'} html={data.heading || defaultHeading} />
      {data.intro_body && <BodyText site={site} html={data.intro_body} />}

      {/* Toolbar: search + sort + view mode */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.25rem', padding: '0.6rem 0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={wp('livestock_search_ph')}
          style={{ flex: '1 1 200px', minWidth: 160, padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14, background: '#fff' }}
        />
        <select value={sortKey} onChange={e => setSortKey(e.target.value)}
          style={{ padding: '7px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, background: '#fff', color: '#374151' }}>
          <option value="name">{wp('sort_name')}</option>
          {breedCount > 1 && <option value="breed">{wp('sort_breed')}</option>}
          <option value="price_asc">{wp('sort_price_low')}</option>
          <option value="price_desc">{wp('sort_price_high')}</option>
        </select>
        <div style={{ display: 'flex', gap: 0, border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden', marginLeft: 'auto' }}>
          <button onClick={() => setViewMode('grid')}  title="Grid view"  style={{ ...ctrlBtn(viewMode === 'grid'),  borderRadius: 0, border: 'none', borderRight: '1px solid #e2e8f0' }}>{wp('view_grid')}</button>
          <button onClick={() => setViewMode('list')}  title="List view"  style={{ ...ctrlBtn(viewMode === 'list'),  borderRadius: 0, border: 'none', borderRight: '1px solid #e2e8f0' }}>{wp('view_list')}</button>
          <button onClick={() => setViewMode('table')} title="Table view" style={{ ...ctrlBtn(viewMode === 'table'), borderRadius: 0, border: 'none' }}>{wp('view_table')}</button>
        </div>
      </div>

      {visible.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem', fontSize: 14, border: '1px dashed #e2e8f0', borderRadius: 8, background: '#fff' }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{wp('no_animals')}</div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>{wp('no_animals_hint')}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {groups.map(g => (
            <section key={g.name}>
              <SectionHeading site={site} headingStyle="h2">{groupHeading(g)}</SectionHeading>
              {viewMode === 'grid' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem', alignItems: 'start' }}>
                  {g.items.map(renderGridCard)}
                </div>
              ) : viewMode === 'list' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {g.items.map(renderListCard)}
                </div>
              ) : (
                <div style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                        <th style={{ padding: '0.7rem 0.9rem', fontWeight: 700, color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.3, borderBottom: '1px solid #e5e7eb' }}>{wp('th_photo')}</th>
                        <th style={{ padding: '0.7rem 0.9rem', fontWeight: 700, color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.3, borderBottom: '1px solid #e5e7eb' }}>{wp('th_name')}</th>
                        <th style={{ padding: '0.7rem 0.9rem', fontWeight: 700, color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.3, borderBottom: '1px solid #e5e7eb' }}>{wp('th_breed')}</th>
                        {isStud
                          ? <th style={{ padding: '0.7rem 0.9rem', fontWeight: 700, color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.3, borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>{wp('th_stud_fee')}</th>
                          : <>
                              <th style={{ padding: '0.7rem 0.9rem', fontWeight: 700, color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.3, borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>{wp('th_price')}</th>
                              <th style={{ padding: '0.7rem 0.9rem', fontWeight: 700, color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.3, borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>{wp('th_stud_fee')}</th>
                            </>
                        }
                        <th style={{ padding: '0.7rem 0.9rem', fontWeight: 700, color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.3, borderBottom: '1px solid #e5e7eb' }}>{wp('th_description')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.items.map(a => (
                        <tr key={a.AnimalID}
                          onClick={() => setSelectedIdx(indexOf(a))}
                          style={{ cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                        >
                          <td style={{ padding: '0.6rem 0.9rem' }}>
                            {a.Photo1
                              ? <img src={a.Photo1} alt="" style={{ width: 72, height: 'auto', borderRadius: 6, display: 'block' }} onError={e => e.target.style.display = 'none'} />
                              : <div style={{ width: 72, height: 54, borderRadius: 6, background: `${primary}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>🐄</div>}
                          </td>
                          <td style={{ padding: '0.6rem 0.9rem', fontWeight: 600, color: textColor }}>{a.FullName}</td>
                          <td style={{ padding: '0.6rem 0.9rem', color: '#6B7280' }}>{a.Breed || '—'}</td>
                          {isStud ? (
                            <td style={{ padding: '0.6rem 0.9rem', textAlign: 'right', color: primary, fontWeight: 700, whiteSpace: 'nowrap' }}>
                              {fmtPrice(a.StudFee) || '—'}
                            </td>
                          ) : (
                            <>
                              <td style={{ padding: '0.6rem 0.9rem', textAlign: 'right', color: primary, fontWeight: 700, whiteSpace: 'nowrap' }}>
                                {fmtPrice(a.Price) || '—'}
                                {fmtPrice(a.SalePrice) && <span style={{ color: '#ef4444', fontWeight: 600, marginLeft: 4 }}>({fmtPrice(a.SalePrice)})</span>}
                              </td>
                              <td style={{ padding: '0.6rem 0.9rem', textAlign: 'right', color: '#6B7280', whiteSpace: 'nowrap' }}>
                                {showStud(a) ? fmtPrice(a.StudFee) : '—'}
                              </td>
                            </>
                          )}
                          <td style={{ padding: '0.6rem 0.9rem', color: '#6B7280', maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {stripHtml(a.Description) || (a.PriceComments ? stripHtml(a.PriceComments) : '—')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </SectionWrap>
  );
}

function ProduceBlock({ data, site, businessId }) {
  const { t } = useTranslation(); const wp = (k, o) => t(`website_public.${k}`, o);
  const [items, setItems] = useState([]);
  useEffect(() => {
    fetchContent(`${API}/api/website/content/produce?business_id=${businessId}`)
      .then(d => setItems(d.slice(0, data.max_items || 8)));
  }, [businessId]);
  if (items.length === 0) return null;
  return (
    <SectionWrap site={site}>
      <SectionHeading site={site}>{data.heading || wp('heading_produce')}</SectionHeading>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
        {items.map(p => (
          <PriceCard key={p.ProduceID} icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M7 20s4-6 4-10a4 4 0 0 0-8 0c0 4 4 10 4 10z"/><path d="M7 20h10"/><path d="M13 12s2-3 5-3"/></svg>} name={p.IngredientName} price={p.RetailPrice}
            unit={p.QuantityMeasurement} tags={[p.IsOrganic && wp('tag_organic'), p.IsLocal && wp('tag_local')].filter(Boolean)}
            site={site} />
        ))}
      </div>
    </SectionWrap>
  );
}

function MeatBlock({ data, site, businessId }) {
  const { t } = useTranslation(); const wp = (k, o) => t(`website_public.${k}`, o);
  const [items, setItems] = useState([]);
  useEffect(() => {
    fetchContent(`${API}/api/website/content/meat?business_id=${businessId}`)
      .then(d => setItems(d.slice(0, data.max_items || 8)));
  }, [businessId]);
  if (items.length === 0) return null;
  return (
    <SectionWrap site={site} alt>
      <SectionHeading site={site}>{data.heading || wp('heading_meat')}</SectionHeading>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
        {items.map(m => (
          <PriceCard key={m.MeatInventoryID} icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 13L5 21l7-4 7 4-1-8"/><path d="M5 4l7 4 7-4"/><path d="M5 4v9m14-9v9"/></svg>} name={m.IngredientName}
            price={m.RetailPrice} unit={`${m.Weight} ${m.WeightUnit}`}
            tags={[]} site={site} />
        ))}
      </div>
    </SectionWrap>
  );
}

function ProcessedFoodBlock({ data, site, businessId }) {
  const { t } = useTranslation(); const wp = (k, o) => t(`website_public.${k}`, o);
  const [items, setItems] = useState([]);
  useEffect(() => {
    fetchContent(`${API}/api/website/content/processed-food?business_id=${businessId}`)
      .then(d => setItems(d.slice(0, data.max_items || 8)));
  }, [businessId]);
  if (items.length === 0) return null;
  return (
    <SectionWrap site={site}>
      <SectionHeading site={site}>{data.heading || wp('heading_processed_food')}</SectionHeading>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
        {items.map(f => (
          <PriceCard key={f.ProcessedFoodID} icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2h18l-2 7H5z"/><path d="M5 9l1 11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-11"/></svg>} name={f.Name} price={f.RetailPrice}
            image={f.ImageURL} desc={f.Description} tags={[]} site={site} />
        ))}
      </div>
    </SectionWrap>
  );
}

function ServicesBlock({ data, site, businessId }) {
  const { t } = useTranslation(); const wp = (k, o) => t(`website_public.${k}`, o);
  const [items, setItems] = useState([]);
  useEffect(() => {
    fetchContent(`${API}/api/website/content/services?business_id=${businessId}`)
      .then(d => setItems(d.slice(0, data.max_items || 6)));
  }, [businessId]);
  if (items.length === 0) return null;
  return (
    <SectionWrap site={site} alt>
      <SectionHeading site={site}>{data.heading || wp('heading_services')}</SectionHeading>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
        {items.map(s => (
          <div key={s.ServicesID} style={{ background: '#fff', borderRadius: 14, padding: '1.25rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            {s.Photo1 && <img src={s.Photo1} alt={s.ServiceTitle} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8, marginBottom: '0.75rem' }} />}
            <div style={{ fontWeight: 700, color: site.text_color, fontFamily: site.font_family }}>{s.ServiceTitle}</div>
            {s.ServicesDescription && <p style={{ fontSize: '0.82rem', color: '#6B7280', marginTop: 6, lineHeight: 1.5 }}>{s.ServicesDescription?.slice(0, 150)}</p>}
            {(s.ServicePrice || s.Price2) && (
              <div style={{ marginTop: 8, fontWeight: 600, color: site.primary_color }}>{s.ServicePrice || `$${s.Price2}`}</div>
            )}
          </div>
        ))}
      </div>
    </SectionWrap>
  );
}

function MarketplaceBlock({ data, site, businessId }) {
  const { t } = useTranslation(); const wp = (k, o) => t(`website_public.${k}`, o);
  const [items, setItems] = useState([]);
  useEffect(() => {
    fetchContent(`${API}/api/website/content/marketplace?business_id=${businessId}`)
      .then(d => setItems(d.slice(0, data.max_items || 12)));
  }, [businessId]);
  if (items.length === 0) return null;
  return (
    <SectionWrap site={site}>
      <SectionHeading site={site}>{data.heading || wp('heading_marketplace')}</SectionHeading>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
        {items.map(m => (
          <PriceCard key={m.ListingID} name={m.Title} price={m.UnitPrice}
            unit={m.UnitLabel} image={m.ImageURL} desc={m.Description}
            tags={[m.IsFeatured && wp('tag_featured'), m.IsOrganic && wp('tag_organic'), m.IsLocal && wp('tag_local')].filter(Boolean)}
            site={site} />
        ))}
      </div>
    </SectionWrap>
  );
}

function GalleryBlock({ data, site, businessId }) {
  const { t } = useTranslation(); const wp = (k, o) => t(`website_public.${k}`, o);
  const [items, setItems] = useState([]);
  const [lightbox, setLightbox] = useState(null);
  useEffect(() => {
    fetchContent(`${API}/api/website/content/gallery?business_id=${businessId}`)
      .then(setItems);
  }, [businessId]);
  if (items.length === 0) return null;
  const cols = data.columns || 3;
  return (
    <SectionWrap site={site} alt>
      <SectionHeading site={site}>{data.heading || wp('heading_gallery')}</SectionHeading>
      <div className={`grid gap-3 mt-4`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {items.map(g => (
          <div key={g.GalleryID} onClick={() => setLightbox(g)}
            style={{ cursor: 'pointer', borderRadius: 10, overflow: 'hidden', aspectRatio: '1', position: 'relative' }}>
            <img src={g.GalleryImage} alt={g.GalleryCaption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
          </div>
        ))}
      </div>
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', cursor: 'pointer' }}>
          <img src={lightbox.GalleryImage} alt={lightbox.GalleryCaption || ''} style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} />
          {lightbox.GalleryCaption && <p style={{ position: 'absolute', bottom: '1.5rem', color: '#fff', fontSize: '0.9rem', background: 'rgba(0,0,0,0.5)', padding: '6px 16px', borderRadius: 20 }}>{lightbox.GalleryCaption}</p>}
        </div>
      )}
    </SectionWrap>
  );
}

function BlogBlock({ data, site, businessId }) {
  const { t } = useTranslation(); const wp = (k, o) => t(`website_public.${k}`, o);
  const [posts, setPosts] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const maxPosts = data.max_posts || 100;
  const filterCategory = data.category || '';

  useEffect(() => {
    const params = new URLSearchParams({ business_id: businessId, limit: maxPosts, show_on_website: 'true' });
    if (filterCategory) params.set('category_name', filterCategory);
    fetchContent(`${API}/api/blog/posts?${params}`)
      .then(d => setPosts(Array.isArray(d) ? d : []))
      .catch(() => {
        fetchContent(`${API}/api/website/content/blog?business_id=${businessId}`)
          .then(d => setPosts((Array.isArray(d) ? d : []).slice(0, maxPosts).map(p => ({
            post_id: null, title: p.BlogHeadline, excerpt: p.BlogText1?.slice(0, 150),
            cover_image: p.BlogImage1,
            created_at: p.BlogYear ? `${p.BlogYear}-${String(p.BlogMonth||1).padStart(2,'0')}-${String(p.BlogDay||1).padStart(2,'0')}` : null,
            business_name: null,
          }))));
      });
  }, [businessId, filterCategory, maxPosts]);

  if (posts.length === 0) return null;

  const linkColor = site.link_color || site.accent_color || site.primary_color || '#2563eb';
  const heading   = data.heading || (data.category || 'From the Blog');
  const headingStyle = data.heading_style || 'h1';

  const bodyFont   = site.font_family || 'inherit';
  const bodySize   = site.body_size   || '1rem';
  const bodyColor  = site.body_color  || site.text_color || '#1f2937';
  const navLinkStyle = (disabled) => ({
    background: 'none', border: 'none', padding: 0, cursor: disabled ? 'default' : 'pointer',
    fontFamily: bodyFont, fontSize: bodySize, color: disabled ? 'transparent' : linkColor,
    opacity: disabled ? 0 : 1, pointerEvents: disabled ? 'none' : 'auto',
  });

  // ── Detail view ─────────────────────────────────────────────────
  if (selectedIdx !== null) {
    const p = posts[selectedIdx];
    const dateStr = (p.published_at || p.created_at)
      ? new Date(p.published_at || p.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : '';
    const cover = blogCoverImage(p);
    return (
      <SectionWrap site={site} blockBgColor={data.bg_color || undefined}>
        {/* Back link — upper left */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '1rem' }}>
          <button style={navLinkStyle(false)} onClick={() => setSelectedIdx(null)}>{wp('blog_back', { heading })}</button>
        </div>

        {/* Article */}
        <article style={{ maxWidth: 760, margin: '0 auto' }}>
          {cover && (
            <img src={cover} alt={p.title} style={{ width: '100%', maxHeight: 380, objectFit: 'cover', borderRadius: 12, display: 'block', marginBottom: '1.5rem' }} onError={e => e.target.style.display = 'none'} />
          )}
          <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
            {dateStr}{p.business_name && ` · ${p.business_name}`}
          </div>
          <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.6rem', fontWeight: 800, color: site.text_color || '#111827', fontFamily: bodyFont, lineHeight: 1.25 }}>
            {p.title}
          </h2>
          <div style={{ paddingTop: '0.5rem', borderTop: '1px solid #e5e7eb' }}>
            {renderBlogContent(p.content)}
          </div>
        </article>

        {/* Bottom nav — plain text arrows */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2.5rem', paddingTop: '1.25rem', borderTop: '1px solid #e5e7eb' }}>
          <button style={navLinkStyle(selectedIdx === 0)} onClick={() => setSelectedIdx(selectedIdx - 1)}>{wp('blog_prev')}</button>
          <button style={navLinkStyle(selectedIdx === posts.length - 1)} onClick={() => setSelectedIdx(selectedIdx + 1)}>{wp('blog_next')}</button>
        </div>
      </SectionWrap>
    );
  }

  // ── List view ────────────────────────────────────────────────────
  return (
    <SectionWrap site={site} blockBgColor={data.bg_color || undefined}>
      <SectionHeading site={site} headingStyle={headingStyle}>{heading}</SectionHeading>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}>
        {posts.map((p, i) => {
          const dateStr = (p.published_at || p.created_at) ? new Date(p.published_at || p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
          const cover = blogCoverImage(p);
          const excerpt = blogExcerpt(p.content, 200);
          return (
            <div key={p.post_id || i}
              onClick={() => setSelectedIdx(i)}
              style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', display: 'flex', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.11)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.06)'}
            >
              {cover && (
                <img src={cover} alt="" style={{ width: 250, minWidth: 250, objectFit: 'cover', flexShrink: 0, display: 'block' }} onError={e => e.target.style.display = 'none'} />
              )}
              <div style={{ padding: '1.1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1 }}>
                <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                  {dateStr}{p.business_name && ` · ${p.business_name}`}
                </div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: site.text_color || '#111827', fontFamily: site.font_family, lineHeight: 1.35 }}>{p.title}</div>
                {excerpt && <p style={{ margin: 0, fontSize: '0.88rem', color: '#4B5563', lineHeight: 1.6 }}>{excerpt}</p>}
                <div style={{ marginTop: 'auto', paddingTop: '0.5rem', fontSize: '0.83rem', color: linkColor, fontWeight: 600 }}>
                  {wp('blog_read_more')}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SectionWrap>
  );
}

// ── Upcoming Events block ────────────────────────────────────────
function EventsBlock({ data, site, businessId }) {
  const { t } = useTranslation(); const wp = (k, o) => t(`website_public.${k}`, o);
  const [events, setEvents] = useState([]);
  const maxItems = data.max_items || 6;
  const layout = data.layout || 'cards';

  useEffect(() => {
    if (!businessId) return;
    fetchContent(`${API}/api/events?business_id=${businessId}&limit=${maxItems}`)
      .then(d => setEvents(Array.isArray(d) ? d : []))
      .catch(() => setEvents([]));
  }, [businessId, maxItems]);

  if (events.length === 0) return null;

  const heading = data.heading || wp('heading_events');
  const headingStyle = data.heading_style || 'h1';
  const linkColor = site.link_color || site.accent_color || site.primary_color || '#2563eb';
  const textColor = site.text_color || '#111827';
  const bodyFont = site.font_family || 'inherit';

  const fmtDate = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    return isNaN(dt) ? '' : dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  const fmtRange = (s, e) => {
    const sStr = fmtDate(s);
    if (!e || s === e) return sStr;
    return `${sStr} – ${fmtDate(e)}`;
  };

  const isList = layout === 'list';

  return (
    <SectionWrap site={site} blockBgColor={data.bg_color || undefined}>
      <SectionHeading site={site} headingStyle={headingStyle}>{heading}</SectionHeading>
      <div style={{
        display: isList ? 'flex' : 'grid',
        flexDirection: isList ? 'column' : undefined,
        gridTemplateColumns: isList ? undefined : 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1.25rem',
        marginTop: '1.5rem',
      }}>
        {events.map(ev => {
          const location = [ev.EventLocationCity, ev.EventLocationState].filter(Boolean).join(', ');
          return (
            <div key={ev.EventID} style={{
              background: '#fff', borderRadius: 12, overflow: 'hidden',
              boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
              display: 'flex', flexDirection: isList ? 'row' : 'column',
            }}>
              {ev.EventImage && (
                <img src={ev.EventImage} alt={ev.EventName}
                  style={{
                    width: isList ? 220 : '100%',
                    height: isList ? 'auto' : 180,
                    minWidth: isList ? 220 : undefined,
                    objectFit: 'cover', display: 'block',
                  }}
                  onError={e => e.target.style.display = 'none'} />
              )}
              <div style={{ padding: '1.1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                <div style={{ fontSize: '0.78rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  {ev.EventType || 'Event'}
                </div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: textColor, fontFamily: bodyFont, lineHeight: 1.3 }}>
                  {ev.EventName}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#4B5563' }}>
                  📅 {fmtRange(ev.EventStartDate, ev.EventEndDate)}
                </div>
                {location && (
                  <div style={{ fontSize: '0.88rem', color: '#4B5563' }}>📍 {location}</div>
                )}
                <div style={{ marginTop: 'auto', paddingTop: '0.75rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <Link to={`/events/${ev.EventID}`} style={{ fontSize: '0.88rem', color: linkColor, fontWeight: 600, textDecoration: 'none' }}>
                    {wp('events_details')}
                  </Link>
                  {ev.RegistrationRequired ? (
                    <Link to={`/events/${ev.EventID}/register`} style={{
                      fontSize: '0.85rem', fontWeight: 600,
                      background: linkColor, color: '#fff',
                      padding: '0.35rem 0.9rem', borderRadius: 6, textDecoration: 'none',
                    }}>
                      {wp('events_register')}
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SectionWrap>
  );
}

// ── Testimonials blocks ──────────────────────────────────────────
function wrapTestimonialHtml(html, font, size) {
  if (!html) return html;
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const txt = (tmp.textContent || '').trim();
  const hasQuote = /^[\u201C\u201D\u2018\u2019"']/.test(txt);
  if (!hasQuote) {
    const walker = document.createTreeWalker(tmp, NodeFilter.SHOW_TEXT);
    const first = walker.nextNode();
    if (first) first.textContent = '\u201C' + first.textContent;
    let last = first;
    while (walker.nextNode()) last = walker.currentNode;
    if (last) last.textContent = last.textContent + '\u201D';
  }
  if (font || size) {
    for (const child of tmp.querySelectorAll('*')) {
      if (font) child.style.fontFamily = font;
      if (size) child.style.fontSize = size;
    }
  }
  return `<em>${tmp.innerHTML}</em>`;
}

function TestimonialsBlock({ data, site, businessId }) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    fetchContent(`${API}/api/testimonials?BusinessID=${businessId}`)
      .then(d => setItems(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [businessId]);

  const maxItems = data.max_items || 0;
  const visible = maxItems > 0 ? items.slice(0, maxItems) : items;
  if (visible.length === 0) return null;

  const textColor = site.text_color || '#1f2937';
  const tFont = data.testimonial_font || site.body_font || site.font_family || 'inherit';
  const tSize = data.testimonial_size || site.body_size || '1rem';

  return (
    <SectionWrap site={site} blockBgColor={data.bg_color || undefined}>
      {data.heading && <SectionHeading site={site} headingStyle={data.heading_style || 'h1'} html={data.heading} />}
      {data.intro_body && <BodyText site={site} html={data.intro_body} />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: (data.heading || data.intro_body) ? '1.5rem' : 0 }}>
        {visible.map((t, i) => (
          <div key={t.TestimonialsID || i} style={{ background: '#f9fafb', borderRadius: 12, padding: '1.25rem', border: '1px solid #e5e7eb' }}>
            <div style={{ fontFamily: tFont, fontSize: tSize, color: textColor, lineHeight: 1.6, margin: 0 }} dangerouslySetInnerHTML={{ __html: wrapTestimonialHtml(t.Content, tFont, tSize) }} />
            <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: textColor }}>
                — {(() => { const firstName = (t.AuthorName || 'Anonymous').split(' ')[0]; const loc = [t.City, t.State].filter(Boolean).join(' '); return loc ? `${firstName}, ${loc}` : firstName; })()}
              </p>
              {t.Rating > 0 && <span style={{ fontSize: '0.82rem', color: '#f59e0b' }}>{'★'.repeat(t.Rating)}{'☆'.repeat(5 - t.Rating)}</span>}
            </div>
          </div>
        ))}
      </div>
    </SectionWrap>
  );
}

function TestimonialRandomBlock({ data, site, businessId }) {
  const [item, setItem] = useState(null);
  useEffect(() => {
    fetchContent(`${API}/api/testimonials?BusinessID=${businessId}`)
      .then(d => {
        const arr = Array.isArray(d) ? d : [];
        if (arr.length > 0) setItem(arr[Math.floor(Math.random() * arr.length)]);
      })
      .catch(() => {});
  }, [businessId]);

  if (!item) return null;

  const tFont = data.testimonial_font || site.body_font || site.font_family || 'inherit';
  const tSize = data.testimonial_size || site.body_size || '1rem';
  const tColor = site.body_color || site.text_color || '#4B5563';
  const tLineHeight = site.body_line_height || 1.75;

  return (
    <SectionWrap site={site} blockBgColor={data.bg_color || undefined}>
      {data.heading && <SectionHeading site={site} headingStyle={data.heading_style || 'h1'} html={data.heading} />}
      {data.intro_body && <BodyText site={site} html={data.intro_body} />}
      <div style={{ marginTop: (data.heading || data.intro_body) ? '1rem' : 0, textAlign: data.align || 'left' }}>
        <div className="site-rte" style={{ fontFamily: tFont, fontSize: tSize, color: tColor, lineHeight: tLineHeight }} dangerouslySetInnerHTML={{ __html: wrapTestimonialHtml(item.Content, tFont, tSize) }} />
        <div style={{ textAlign: data.align || 'left', marginTop: '0.75rem' }}>
          <p style={{ margin: 0, fontWeight: 600, fontFamily: tFont, fontSize: tSize, color: tColor }}>
            — {(() => { const firstName = (item.AuthorName || 'Anonymous').split(' ')[0]; const loc = [item.City, item.State].filter(Boolean).join(' '); return loc ? `${firstName}, ${loc}` : firstName; })()}
          </p>
          {item.Rating > 0 && <div style={{ fontSize: '1rem', color: '#f59e0b', marginTop: '0.25rem' }}>{'★'.repeat(item.Rating)}{'☆'.repeat(5 - item.Rating)}</div>}
        </div>
      </div>
    </SectionWrap>
  );
}

const CONTACT_API = import.meta.env.VITE_LIVESTOCK_API_URL;

const contactInp = { border: '1px solid #E5E7EB', borderRadius: 8, padding: '0.6rem 0.9rem', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' };
const contactLbl = { display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#9CA3AF', marginBottom: 4, textTransform: 'lowercase' };

function ContactBlock({ data, site }) {
  const { t } = useTranslation(); const wp = (k, o) => t(`website_public.${k}`, o);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', organization: '', message: '' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setSending(true);
    const toEmail = data.contact_email || site.email || 'livestockoftheworld@gmail.com';
    try {
      await fetch(`${CONTACT_API}/api/website/contact-form`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, to_email: toEmail, site_name: site.site_name }),
      });
    } catch {}
    setSent(true);
    setSending(false);
  };

  return (
    <SectionWrap site={site} alt>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <SectionHeading site={site} centered>{data.heading || wp('heading_contact')}</SectionHeading>
        {data.sub_heading && (
          <div className="site-rte" style={{ color: '#6B7280', textAlign: 'center', marginBottom: '1.5rem', fontFamily: site.font_family, lineHeight: 1.7 }}
               dangerouslySetInnerHTML={{ __html: addLinkTargets(data.sub_heading) }} />
        )}
        {/* Contact info */}
        <div className="flex flex-wrap gap-6 justify-center mb-6 text-sm text-gray-600">
          {site.phone && <span>📞 {site.phone}</span>}
          {site.email && <a href={`mailto:${site.email}`} style={{ color: site.primary_color }}>✉️ {site.email}</a>}
          {site.address && <span>📍 {site.address}</span>}
        </div>
        {/* Social */}
        <div className="flex gap-4 justify-center mb-6">
          {site.facebook_url && <a href={site.facebook_url} target="_blank" rel="noreferrer" style={{ color: site.primary_color, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>Facebook</a>}
          {site.instagram_url && <a href={site.instagram_url} target="_blank" rel="noreferrer" style={{ color: site.primary_color, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>Instagram</a>}
          {site.twitter_url && <a href={site.twitter_url} target="_blank" rel="noreferrer" style={{ color: site.primary_color, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>X / Twitter</a>}
        </div>
        {/* Contact form */}
        {data.show_form !== false && !sent && (
          <form onSubmit={handleSubmit}
            style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={contactLbl}>{wp('contact_lbl_first_name')}</label>
                <input required placeholder={wp('contact_ph_first')} value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} style={contactInp} />
              </div>
              <div>
                <label style={contactLbl}>{wp('contact_lbl_last_name')}</label>
                <input required placeholder={wp('contact_ph_last')} value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} style={contactInp} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={contactLbl}>{wp('contact_lbl_email')}</label>
                <input required type="email" placeholder={wp('contact_ph_email')} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} style={contactInp} />
              </div>
              <div>
                <label style={contactLbl}>{wp('contact_lbl_phone')} <span style={{ fontWeight: 400 }}>{wp('contact_lbl_optional')}</span></label>
                <input type="tel" placeholder={wp('contact_ph_phone')} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} style={contactInp} />
              </div>
            </div>
            <div>
              <label style={contactLbl}>{wp('contact_lbl_org')} <span style={{ fontWeight: 400 }}>{wp('contact_lbl_optional')}</span></label>
              <input placeholder={wp('contact_ph_org')} value={form.organization} onChange={e => setForm(p => ({ ...p, organization: e.target.value }))} style={contactInp} />
            </div>
            <div>
              <label style={contactLbl}>{wp('contact_lbl_message')}</label>
              <textarea required placeholder={wp('contact_ph_message')} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                style={{ ...contactInp, minHeight: 110, resize: 'vertical' }} />
            </div>
            <button type="submit" disabled={sending}
              style={{ background: site.primary_color, color: '#fff', fontWeight: 700, padding: '0.7rem 2rem', borderRadius: 8, border: 0, cursor: sending ? 'not-allowed' : 'pointer', fontSize: '0.9rem', opacity: sending ? 0.7 : 1 }}>
              {sending ? wp('contact_sending') : wp('contact_send')}
            </button>
          </form>
        )}
        {sent && (
          <div style={{ textAlign: 'center', padding: '2rem', background: '#F0FDF4', borderRadius: 16, color: '#15803D', fontWeight: 600 }}>
            {wp('contact_success')}
          </div>
        )}
      </div>
    </SectionWrap>
  );
}

function DividerBlock({ data }) {
  return <div style={{ height: data.height || 40 }} />;
}

function normLinksGroups(data) {
  if (Array.isArray(data.groups) && data.groups.length > 0) return data.groups;
  if (Array.isArray(data.items)  && data.items.length  > 0) return [{ heading: '', items: data.items }];
  return [];
}

function LinksBlock({ data, site }) {
  const groups    = normLinksGroups(data);
  const cols      = data.columns || 3;
  if (groups.length === 0) return null;
  const linkColor = site.link_color || site.accent_color || '#2563eb';
  const linkUline = site.link_underline !== false;
  const bodyFont  = site.body_font  || site.font_family || 'inherit';
  const bodySize  = site.body_size  || '1rem';
  const bodyColor = site.body_color || site.text_color  || '#111827';

  // Resolve H1/H2 styles from site typography settings
  const h1Size   = site.h1_size   || '2.5rem'; const h1Weight = site.h1_weight || '800';
  const h1Font   = site.h1_font   || site.font_family || 'inherit';
  const h1Color  = site.h1_color  || site.text_color  || '#111827';
  const h2Size   = site.h2_size   || '1.8rem'; const h2Weight = site.h2_weight || '700';
  const h2Font   = site.h2_font   || site.font_family || 'inherit';
  const h2Color  = site.h2_color  || site.text_color  || '#111827';

  return (
    <SectionWrap site={site}>
      {data.heading && (
        <h1 style={{ fontSize: h1Size, fontWeight: h1Weight, fontFamily: h1Font, color: h1Color, marginBottom: '1rem', lineHeight: 1.2 }}>
          {data.heading}
        </h1>
      )}
      {groups.map((group, gi) => (
        <div key={gi} style={{ marginBottom: '1.5rem' }}>
          {group.heading && (
            <h2 style={{ fontSize: h2Size, fontWeight: h2Weight, fontFamily: h2Font, color: h2Color, marginBottom: '0.75rem', lineHeight: 1.3 }}>
              {group.heading}
            </h2>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '0.75rem' }}>
            {(group.items || []).map((item, i) => {
              const labelHtml = item.label || '';
              const hasInnerLink = /<a\b/i.test(labelHtml);
              const linkCss = `color:${linkColor};${linkUline ? 'text-decoration:underline;' : 'text-decoration:none;'}`;
              // Inject link_color into any <a> tags embedded in label/description HTML
              const colorizeLinks = (html) => html ? html.replace(/<a\b/gi, `<a style="${linkCss}"`) : html;
              const itemUrl = item.url || (!hasInnerLink ? '#' : undefined);
              const Wrapper = itemUrl ? 'a' : 'div';
              const wrapperProps = itemUrl ? { href: itemUrl, target: '_blank', rel: 'noopener noreferrer' } : {};
              return (
                <Wrapper
                  key={i}
                  {...wrapperProps}
                  style={{
                    display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
                    color: linkColor,
                    textDecoration: linkUline ? 'underline' : 'none',
                    fontFamily: bodyFont,
                    fontSize: bodySize,
                  }}
                >
                  {item.icon_url && (
                    <div style={{ flexShrink: 0 }}>
                      <img src={item.icon_url} alt="" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 4 }} />
                    </div>
                  )}
                  <div>
                    <div dangerouslySetInnerHTML={{ __html: colorizeLinks(labelHtml) }} style={{ fontWeight: 600 }} />
                    {item.description && (
                      <div
                        dangerouslySetInnerHTML={{ __html: colorizeLinks(item.description) }}
                        style={{ color: bodyColor, fontWeight: 400, marginTop: 3, lineHeight: 1.4, textDecoration: 'none' }}
                      />
                    )}
                  </div>
                </Wrapper>
              );
            })}
          </div>
        </div>
      ))}
    </SectionWrap>
  );
}

// ── Shared layout components ──────────────────────────────────────
function SectionWrap({ children, site, alt, blockBgColor }) {
  const pageBg = site.page_background_color || site.bg_color || '#FFFFFF';
  const bgColor = blockBgColor || (alt ? (pageBg === '#FFFFFF' ? '#F9FAFB' : pageBg + 'ee') : pageBg);
  const bgWidth = site.body_bg_width || '100%';
  const textWidth = site.body_content_width || '100%';
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <section style={{ width: '100%', maxWidth: bgWidth, paddingTop: 10, paddingLeft: '1.5rem', paddingRight: '1.5rem', paddingBottom: 0, background: bgColor }}>
        <div style={{ maxWidth: textWidth, margin: '0 auto' }}>{children}</div>
      </section>
    </div>
  );
}
function SectionHeading({ children, html, site, centered, headingStyle }) {
  // headingStyle is h1/h2/h3/h4/p from block_data; default to h2 for data-backed blocks
  const k   = (!headingStyle || headingStyle === 'p') ? 'body' : headingStyle;
  const tag = (!headingStyle || headingStyle === 'p') ? 'p'    : headingStyle;
  const ruleclr = site[`${k}_rule_color`] || site.text_color || '#000';
  const hasRule = k !== 'body' && !!site[`${k}_rule`];
  const align   = centered ? 'center' : (site[`${k}_align`] || 'left');
  const style = {
    fontSize:       remToPx(site[`${k}_size`]) || (k==='body'?'16px':k==='h1'?'40px':k==='h2'?'29px':k==='h3'?'21px':'17px'),
    fontWeight:     site[`${k}_weight`] || (k==='body'?'400':k==='h1'?'800':k==='h2'?'700':'600'),
    fontStyle:      site[`${k}_italic`] ? 'italic' : 'normal',
    color:          site[`${k}_color`]  || site.text_color,
    fontFamily:     site[`${k}_font`]   || site.font_family,
    marginTop:      (site[`${k}_margin_top`]    ?? 0)  + 'px',
    marginBottom:   (site[`${k}_margin_bottom`] ?? 8)  + 'px',
    textAlign:      align,
    textDecoration: site[`${k}_underline`] ? 'underline' : 'none',
    borderBottom:   hasRule ? `2px solid ${ruleclr}` : undefined,
    paddingBottom:  hasRule ? '2px' : undefined,
  };
  const Tag = tag;
  if (html !== undefined) return <Tag style={style} dangerouslySetInnerHTML={{ __html: html }} />;
  return <Tag style={style}>{children}</Tag>;
}
function BodyText({ children, html, site }) {
  const style = {
    color: site.body_color || '#4B5563',
    lineHeight: site.body_line_height || 1.75,
    fontSize: remToPx(site.body_size) || '16px',
    fontStyle: site.body_italic ? 'italic' : 'normal',
    fontFamily: site.font_family,
    marginTop: (site.body_margin_top ?? 0) + 'px',
    marginBottom: (site.body_margin_bottom ?? 12) + 'px',
  };
  if (html !== undefined) return <div className="site-rte" style={style} dangerouslySetInnerHTML={{ __html: addLinkTargets(html) }} />;
  return <p style={{ ...style, whiteSpace: 'pre-wrap' }}>{children}</p>;
}
function PriceCard({ icon, name, price, unit, image, desc, tags, site }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
      {image
        ? <img src={image} alt={name} style={{ width: '100%', height: 130, objectFit: 'cover' }} />
        : <div style={{ height: 80, background: `${site.primary_color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: site.primary_color }}>{icon || <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>}</div>
      }
      <div style={{ padding: '0.75rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: site.text_color, fontFamily: site.font_family, lineHeight: 1.3 }}>{name}</div>
        {desc && <p style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: 3, lineHeight: 1.4 }}>{desc?.slice(0, 80)}</p>}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, flexWrap: 'wrap', gap: 4 }}>
          {price != null && <span style={{ fontWeight: 700, color: site.primary_color, fontSize: '0.9rem' }}>${Number(price).toFixed(2)}{unit ? ` / ${unit}` : ''}</span>}
          {tags?.length > 0 && (
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {tags.map(t => <span key={t} style={{ background: site.accent_color + '44', color: '#78350F', fontSize: '0.65rem', fontWeight: 600, borderRadius: 10, padding: '1px 7px' }}>{t}</span>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── PackagesBlock: package deals with clickable animals ───────────
function PackagesBlock({ data, site, businessId }) {
  const { t } = useTranslation(); const wp = (k, o) => t(`website_public.${k}`, o);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [animalPackages, setAnimalPackages] = useState([]);

  useEffect(() => {
    setLoading(true);
    fetchContent(`${API}/api/website/content/packages?business_id=${businessId}`)
      .then(d => setPackages(Array.isArray(d) ? d : []))
      .catch(() => setPackages([]))
      .finally(() => setLoading(false));
  }, [businessId]);

  // Fetch animal detail + that animal's packages when one is clicked
  useEffect(() => {
    if (!selectedAnimal) { setDetailData(null); setAnimalPackages([]); return; }
    setDetailLoading(true);
    Promise.all([
      fetch(`${API}/api/marketplace/animal/${selectedAnimal}`).then(r => r.ok ? r.json() : null),
      fetch(`${API}/api/website/content/animal-packages?animal_id=${selectedAnimal}`).then(r => r.ok ? r.json() : []),
    ])
      .then(([animal, pkgs]) => { setDetailData(animal); setAnimalPackages(Array.isArray(pkgs) ? pkgs : []); })
      .catch(() => { setDetailData(null); setAnimalPackages([]); })
      .finally(() => setDetailLoading(false));
  }, [selectedAnimal]);

  const primary    = site.primary_color || '#3D6B34';
  const textColor  = site.text_color    || '#111827';
  const fontFamily = site.font_family   || 'inherit';
  const fmtPrice = (n) => {
    if (!n || Number(n) === 0) return '';
    return Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  };

  if (loading) return <SectionWrap site={site}><div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>{wp('packages_loading')}</div></SectionWrap>;

  // If an animal detail is open, render it
  if (selectedAnimal && (detailLoading || detailData)) {
    return (
      <SectionWrap site={site}>
        <button onClick={() => setSelectedAnimal(null)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: primary, fontWeight: 600, fontSize: 14, marginBottom: 12, fontFamily }}>
          {wp('packages_back')}
        </button>
        {detailLoading ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#9ca3af' }}>{wp('packages_animal_loading')}</div>
        ) : detailData ? (
          <>
            <LivestockAnimalDetailContent animal={detailData} siteMode onBack={() => setSelectedAnimal(null)} backLabel={wp('packages_back')} primaryColor={primary} fontFamily={fontFamily} animalPackages={animalPackages} onPackageClick={() => setSelectedAnimal(null)} />
          </>
        ) : (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#ef4444' }}>
            {wp('packages_animal_error')}
            <div style={{ marginTop: 12 }}>
              <button onClick={() => setSelectedAnimal(null)} style={{ background: 'none', border: 'none', color: primary, cursor: 'pointer', fontSize: 14 }}>{wp('packages_back')}</button>
            </div>
          </div>
        )}
      </SectionWrap>
    );
  }

  return (
    <SectionWrap site={site}>
      {data.heading && <SectionHeading site={site} headingStyle={data.heading_style || 'h1'} html={data.heading} />}
      {data.intro_body && <BodyText site={site} html={data.intro_body} />}
      {packages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af', fontFamily }}>{wp('packages_none')}</div>
      ) : (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', fontFamily }}>
        {packages.map(pkg => {
          const pkgPrice = Number(pkg.PackagePrice || 0);
          const totalVal = Number(pkg.total_value || 0);
          const savings = totalVal > 0 && pkgPrice > 0 && pkgPrice < totalVal ? totalVal - pkgPrice : 0;
          const pct = savings > 0 ? Math.round((savings / totalVal) * 100) : 0;
          return (
            <div key={pkg.PackageID} style={{ borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>
              {/* Animal images */}
              {pkg.items?.length > 0 && (
                <div style={{ display: 'flex', gap: 6, padding: '10px 12px 0', background: '#f9fafb' }}>
                  {pkg.items.map((it, i) => (
                    <div key={it.PackageItemID || i}
                      onClick={() => setSelectedAnimal(it.AnimalID)}
                      style={{ flex: 1, position: 'relative', minWidth: 0, cursor: 'pointer', textAlign: 'center', transition: 'transform 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      title={`View ${it.FullName}`}>
                      {it.Photo1 ? (
                        <img src={it.Photo1} alt={it.FullName} style={{ width: '100%', height: 170, objectFit: 'contain', display: 'block', borderRadius: 8 }} />
                      ) : (
                        <div style={{ width: '100%', height: 170, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d1d5db', fontSize: 32, borderRadius: 8 }}>🐄</div>
                      )}
                      <div style={{ fontSize: 11, color: '#374151', marginTop: 3, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 2px' }}>{it.FullName}</div>
                      {it.IncludeType === 'stud' && (
                        <span style={{ position: 'absolute', top: 2, right: 2, background: '#7C5CBF', color: '#fff', fontSize: 9, padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>STUD</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div style={{ padding: '1rem 1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: textColor }}>{pkg.Title}</h3>
                {pkg.Description && <p style={{ margin: '6px 0 10px', fontSize: 14, color: '#6b7280', lineHeight: 1.5 }}>{pkg.Description}</p>}
                {/* Per-animal detail links */}
                <div style={{ fontSize: 13, marginBottom: 10, lineHeight: 1.8 }}>
                  {pkg.items?.map((it, i) => (
                    <div key={it.PackageItemID || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {it.FullName}{it.Breed ? ` (${it.Breed})` : ''}{it.IncludeType === 'stud' ? ' — Stud' : ''}
                      </span>
                      <a onClick={() => setSelectedAnimal(it.AnimalID)}
                        style={{ color: primary, cursor: 'pointer', fontSize: 12, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {wp('packages_learn_more')}
                      </a>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: primary }}>{fmtPrice(pkgPrice)}</span>
                  {savings > 0 && (
                    <>
                      <span style={{ fontSize: 14, color: '#9ca3af', textDecoration: 'line-through' }}>{fmtPrice(totalVal)}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: 6 }}>{wp('packages_save', { pct })}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </SectionWrap>
  );
}

// ── Association widgets ──────────────────────────────────────────

function MemberDirectoryBlock({ data, site, businessId }) {
  const { t } = useTranslation(); const wp = (k, o) => t(`website_public.${k}`, o);
  const [members, setMembers] = useState(null);
  const [q, setQ] = useState('');
  const [state, setState] = useState('');
  const primary = site.primary_color || '#3D6B34';
  const cols    = Math.max(1, Math.min(4, Number(data.columns) || 3));
  const maxN    = Number(data.max_items) || 24;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const params = new URLSearchParams({ business_id: String(businessId), max_items: String(maxN) });
        if (q)     params.set('q', q);
        if (state) params.set('state', state);
        const res = await fetch(`${import.meta.env.VITE_LIVESTOCK_API_URL || ''}/api/website/content/members?${params}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rows = await res.json();
        if (alive) setMembers(Array.isArray(rows) ? rows : []);
      } catch {
        if (alive) setMembers([]);
      }
    })();
    return () => { alive = false; };
  }, [businessId, q, state, maxN]);

  return (
    <SectionWrap site={site}>
      {data.heading && <SectionHeading site={site} headingStyle={data.heading_style || 'h1'}>{data.heading}</SectionHeading>}
      {data.intro_body && <BodyText site={site} html={data.intro_body} />}
      {(data.show_search || data.show_state_filter) && (
        <div style={{ display: 'flex', gap: 10, marginBottom: '1rem', flexWrap: 'wrap' }}>
          {data.show_search && (
            <input value={q} onChange={e => setQ(e.target.value)} placeholder={wp('members_search_ph')}
              style={{ flex: '1 1 220px', padding: '0.6rem 0.9rem', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.95rem' }} />
          )}
          {data.show_state_filter && (
            <select value={state} onChange={e => setState(e.target.value)}
              style={{ padding: '0.6rem 0.9rem', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.95rem', background: '#fff' }}>
              <option value="">{wp('members_all_states')}</option>
              {['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
        </div>
      )}
      {members === null ? (
        <p style={{ color: '#9ca3af' }}>{wp('members_loading')}</p>
      ) : members.length === 0 ? (
        <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>{wp('members_none')}</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 14 }}>
          {members.map(m => (
            <a key={m.business_id} href={`/ranch/${m.slug || m.business_id}`}
               style={{ display: 'flex', gap: 10, padding: '0.8rem', border: '1px solid #e5e7eb', borderRadius: 10, background: '#fff', textDecoration: 'none', color: 'inherit' }}>
              {m.logo_url
                ? <img src={m.logo_url} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: '50%', flexShrink: 0 }} />
                : <div style={{ width: 56, height: 56, borderRadius: '50%', background: primary + '22', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: primary, fontWeight: 700 }}>{(m.name || '?').charAt(0)}</div>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: site.text_color || '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name || 'Member'}</div>
                {(m.city || m.state) && <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>{[m.city, m.state].filter(Boolean).join(', ')}</div>}
              </div>
            </a>
          ))}
        </div>
      )}
    </SectionWrap>
  );
}

function PedigreeSearchBlock({ data, site, businessId }) {
  const { t } = useTranslation(); const wp = (k, o) => t(`website_public.${k}`, o);
  const [name, setName]   = useState('');
  const [reg, setReg]     = useState('');
  const [owner, setOwner] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const primary = site.primary_color || '#3D6B34';
  const maxN    = Number(data.max_results) || 20;

  const runSearch = async (e) => {
    e && e.preventDefault();
    setSearching(true);
    try {
      const params = new URLSearchParams({ business_id: String(businessId), max_results: String(maxN) });
      if (name)  params.set('name', name);
      if (reg)   params.set('reg_number', reg);
      if (owner) params.set('owner', owner);
      const res = await fetch(`${import.meta.env.VITE_LIVESTOCK_API_URL || ''}/api/website/content/registry?${params}`);
      setResults(res.ok ? await res.json() : []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const fields = [];
  if (data.show_name !== false)       fields.push(['name',       name, setName,   wp('pedigree_ph_name')]);
  if (data.show_reg_number !== false) fields.push(['reg_number', reg,  setReg,    wp('pedigree_ph_reg')]);
  if (data.show_owner !== false)      fields.push(['owner',      owner, setOwner, wp('pedigree_ph_owner')]);

  return (
    <SectionWrap site={site}>
      {data.heading && <SectionHeading site={site} headingStyle={data.heading_style || 'h1'}>{data.heading}</SectionHeading>}
      {data.intro_body && <BodyText site={site} html={data.intro_body} />}
      <form onSubmit={runSearch} style={{ display: 'grid', gridTemplateColumns: `repeat(${fields.length}, 1fr) auto`, gap: 10, marginBottom: '1.2rem' }}>
        {fields.map(([key, val, setter, label]) => (
          <input key={key} value={val} onChange={e => setter(e.target.value)} placeholder={label}
            style={{ padding: '0.6rem 0.9rem', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.95rem' }} />
        ))}
        <button type="submit" disabled={searching}
          style={{ background: primary, color: '#fff', border: 'none', borderRadius: 8, padding: '0.6rem 1.4rem', fontWeight: 700, cursor: searching ? 'wait' : 'pointer' }}>
          {searching ? wp('pedigree_searching') : wp('pedigree_search')}
        </button>
      </form>
      {results === null ? (
        <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>{wp('pedigree_prompt')}</p>
      ) : results.length === 0 ? (
        <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>{wp('pedigree_no_results')}</p>
      ) : (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.2fr 100px', padding: '0.7rem 1rem', background: '#f9fafb', fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}>
            <div>{wp('pedigree_th_name')}</div><div>{wp('pedigree_th_reg')}</div><div>{wp('pedigree_th_owner')}</div><div style={{ textAlign: 'right' }}></div>
          </div>
          {results.map(r => (
            <div key={r.animal_id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.2fr 100px', padding: '0.7rem 1rem', fontSize: '0.92rem', borderTop: '1px solid #f3f4f6' }}>
              <div style={{ fontWeight: 600 }}>{r.name || '—'}</div>
              <div style={{ color: '#6b7280' }}>{r.reg_number || '—'}</div>
              <div style={{ color: '#6b7280' }}>{r.owner || '—'}</div>
              <div style={{ textAlign: 'right' }}>
                {r.detail_url && <a href={r.detail_url} style={{ color: primary, textDecoration: 'none', fontWeight: 600 }}>{wp('pedigree_view')}</a>}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionWrap>
  );
}

function FeeScheduleBlock({ data, site }) {
  const { t } = useTranslation(); const wp = (k, o) => t(`website_public.${k}`, o);
  const primary = site.primary_color || '#3D6B34';
  const rows    = Array.isArray(data.rows) ? data.rows : [];
  return (
    <SectionWrap site={site}>
      {data.heading && <SectionHeading site={site} headingStyle={data.heading_style || 'h1'}>{data.heading}</SectionHeading>}
      {data.intro_body && <BodyText site={site} html={data.intro_body} />}
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr', padding: '0.7rem 1.1rem', background: '#f9fafb', fontSize: '0.9rem', fontWeight: 700, color: '#374151' }}>
          <div>{wp('fee_th_item')}</div><div style={{ textAlign: 'right' }}>{wp('fee_th_amount')}</div><div style={{ paddingLeft: 18 }}>{wp('fee_th_notes')}</div>
        </div>
        {rows.length === 0 ? (
          <div style={{ padding: '1rem 1.1rem', color: '#9ca3af', fontStyle: 'italic' }}>{wp('fee_none')}</div>
        ) : rows.map((r, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr', padding: '0.7rem 1.1rem', fontSize: '0.95rem', borderTop: '1px solid #f3f4f6', color: '#1f2937' }}>
            <div>{r.label || '—'}</div>
            <div style={{ textAlign: 'right', fontWeight: 700, color: primary }}>{r.amount || ''}</div>
            <div style={{ paddingLeft: 18, color: '#6b7280' }}>{r.notes || ''}</div>
          </div>
        ))}
      </div>
    </SectionWrap>
  );
}

function MapLocationBlock({ data, site }) {
  const { t } = useTranslation(); const wp = (k, o) => t(`website_public.${k}`, o);
  const primary = site.primary_color || '#3D6B34';
  const textColor = site.text_color || '#1f2937';
  const isGoogleMapsEmbed = typeof data.embed_url === 'string' && /^https:\/\/(www\.)?google\.com\/maps\/embed/.test(data.embed_url);
  return (
    <SectionWrap site={site}>
      {data.heading && <SectionHeading site={site} headingStyle={data.heading_style || 'h1'}>{data.heading}</SectionHeading>}
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
        {isGoogleMapsEmbed && (
          <iframe src={data.embed_url} style={{ border: 0, width: '100%', height: data.height || 320, display: 'block' }} loading="lazy" title={wp('map_title')} />
        )}
        {data.address && (
          <div style={{ padding: '0.9rem 1.1rem', borderTop: isGoogleMapsEmbed ? '1px solid #e5e7eb' : 'none', fontSize: '1rem', color: textColor }}>
            📍 {data.address}
            {' '}<a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.address)}`} target="_blank" rel="noreferrer"
                style={{ color: primary, marginLeft: 8 }}>{wp('map_directions')}</a>
          </div>
        )}
      </div>
    </SectionWrap>
  );
}

function HoursOfOperationBlock({ data, site }) {
  const { t } = useTranslation(); const wp = (k, o) => t(`website_public.${k}`, o);
  const rows = Array.isArray(data.hours) ? data.hours : [];
  const textColor = site.text_color || '#1f2937';
  return (
    <SectionWrap site={site}>
      {data.heading && <SectionHeading site={site} headingStyle={data.heading_style || 'h1'}>{data.heading}</SectionHeading>}
      {data.intro_body && <BodyText site={site} html={data.intro_body} />}
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', background: '#fff', maxWidth: 560 }}>
        {rows.length === 0 ? (
          <div style={{ padding: '1rem 1.1rem', color: '#9ca3af', fontStyle: 'italic' }}>{wp('hours_none')}</div>
        ) : rows.map((r, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', padding: '0.75rem 1.1rem', fontSize: '0.98rem', borderTop: i ? '1px solid #f3f4f6' : 'none', color: textColor }}>
            <div style={{ fontWeight: 600 }}>{r.day || '—'}</div>
            <div style={{ textAlign: 'right', color: r.closed ? '#9ca3af' : textColor }}>
              {r.closed ? wp('hours_closed') : (r.open && r.close ? `${r.open} – ${r.close}` : '—')}
              {r.notes && !r.closed ? <span style={{ color: '#6b7280', fontSize: '0.82rem', marginLeft: 6 }}>({r.notes})</span> : null}
            </div>
          </div>
        ))}
      </div>
      {data.timezone ? <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: 8 }}>{wp('hours_timezone', { timezone: data.timezone })}</p> : null}
    </SectionWrap>
  );
}

function CtaBlock({ data, site }) {
  const headline    = (data.headline || '').trim();
  const buttonText  = (data.button_text || '').trim();
  const buttonLink  = (data.button_link || '#').trim() || '#';
  if (!headline && !buttonText) return null;
  const align       = data.align === 'center' ? 'center' : 'split';
  const bg          = data.bg_color       || '#1a1a1a';
  const fg          = data.text_color     || '#ffffff';
  const btnBg       = data.button_bg_color || site.accent_color || '#7CB342';
  const btnFg       = data.button_text_color || '#ffffff';
  return (
    <div style={{ background: bg, color: fg, padding: '2.5rem 1.5rem', width: '100%' }}>
      <div className="ofn-cta-inner" style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'flex',
        flexDirection: align === 'center' ? 'column' : 'row',
        justifyContent: align === 'center' ? 'center' : 'space-between',
        alignItems: 'center', gap: '1.5rem', textAlign: 'center',
      }}>
        {headline && (
          <div style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
            {headline}
          </div>
        )}
        {buttonText && (
          <a href={buttonLink} style={{
            display: 'inline-block', padding: '0.85rem 2.5rem',
            background: btnBg, color: btnFg, fontWeight: 700, letterSpacing: '0.04em',
            textTransform: 'uppercase', textDecoration: 'none', borderRadius: 4,
            fontSize: '0.95rem', whiteSpace: 'nowrap',
          }}>{buttonText}</a>
        )}
      </div>
      <style>{`@media (max-width: 768px) { .ofn-cta-inner { flex-direction: column !important; } }`}</style>
    </div>
  );
}

function SponsorsBlock({ data, site }) {
  const sponsors = Array.isArray(data.sponsors) ? data.sponsors : [];
  if (sponsors.length === 0 && !data.heading) return null;
  const cols = Math.max(1, Math.min(6, Number(data.columns) || 4));
  const logoH = Math.max(40, Math.min(200, Number(data.logo_height) || 80));
  const showNames = data.show_names !== false;
  const textColor = site.text_color || '#1f2937';
  return (
    <SectionWrap site={site}>
      {data.heading && <SectionHeading site={site} headingStyle={data.heading_style || 'h1'}>{data.heading}</SectionHeading>}
      {data.intro_body && <BodyText site={site} html={data.intro_body} />}
      <div className="ofn-sponsors-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '1.5rem 1.25rem', alignItems: 'center', padding: '0.5rem 0' }}>
        {sponsors.map((s, i) => {
          const inner = (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              {s.logo_url ? (
                <img src={s.logo_url} alt={s.name || 'Sponsor'} loading="lazy"
                  style={{ maxHeight: logoH, maxWidth: '100%', objectFit: 'contain', filter: s.grayscale ? 'grayscale(100%)' : undefined }} />
              ) : (
                <div style={{ height: logoH, width: '80%', background: '#f3f4f6', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 12 }}>
                  {s.name || 'Logo'}
                </div>
              )}
              {showNames && s.name && (
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: textColor, textAlign: 'center' }}>{s.name}</div>
              )}
            </div>
          );
          return s.url ? (
            <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
              style={{ textDecoration: 'none', color: 'inherit' }}>{inner}</a>
          ) : (
            <div key={i}>{inner}</div>
          );
        })}
      </div>
      <style>{`
        @media (max-width: 768px) {
          .ofn-sponsors-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </SectionWrap>
  );
}

function FaqBlock({ data, site }) {
  const items = Array.isArray(data.items) ? data.items : [];
  if (items.length === 0) return null;
  const primary   = site.primary_color || '#3D6B34';
  const textColor = site.text_color    || '#111827';
  const bodyColor = site.body_color    || site.text_color || '#4B5563';
  return (
    <SectionWrap site={site} alt>
      {data.heading && <SectionHeading site={site}>{data.heading}</SectionHeading>}
      <div style={{ marginTop: data.heading ? '1.25rem' : 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item, i) => (
          <details key={i} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <summary style={{
              padding: '1rem 1.25rem', cursor: 'pointer', fontWeight: 700,
              fontSize: '1rem', color: textColor, fontFamily: site.font_family,
              listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              {item.question}
              <span style={{ fontSize: '1.2rem', color: primary, marginLeft: 12, flexShrink: 0 }}>+</span>
            </summary>
            <div style={{ padding: '0 1.25rem 1rem', fontSize: '0.93rem', color: bodyColor, lineHeight: 1.7, borderTop: '1px solid #f3f4f6' }}>
              {item.answer}
            </div>
          </details>
        ))}
      </div>
    </SectionWrap>
  );
}

function FeaturesBlock({ data, site }) {
  const items = Array.isArray(data.items) ? data.items : [];
  if (items.length === 0) return null;
  const primary = site.primary_color || '#3D6B34';
  const textColor = site.text_color || '#111827';
  const bodyColor = site.body_color || site.text_color || '#4B5563';
  const cols = items.length <= 2 ? items.length : items.length <= 4 ? 2 : 3;
  return (
    <SectionWrap site={site} alt>
      {data.heading && <SectionHeading site={site}>{data.heading}</SectionHeading>}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '1.5rem', marginTop: data.heading ? '1.5rem' : 0 }}
           className="ofn-features-grid">
        {items.map((item, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '1.5rem 1.25rem', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {item.icon_url && (
              <img src={item.icon_url} alt={item.title || ''} loading="lazy"
                style={{ width: 52, height: 52, objectFit: 'contain', borderRadius: 8 }} />
            )}
            {!item.icon_url && (
              <div style={{ width: 44, height: 44, borderRadius: 10, background: `${primary}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>✦</div>
            )}
            <div style={{ fontWeight: 700, fontSize: '1rem', color: textColor, fontFamily: site.font_family, lineHeight: 1.3 }}>{item.title}</div>
            {item.description && <p style={{ margin: 0, fontSize: '0.85rem', color: bodyColor, lineHeight: 1.6 }}>{item.description}</p>}
          </div>
        ))}
      </div>
      <style>{`
        @media (max-width: 640px) { .ofn-features-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 900px) and (min-width: 641px) { .ofn-features-grid { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>
    </SectionWrap>
  );
}

function TeamBlock({ data, site }) {
  const members = Array.isArray(data.members) ? data.members : [];
  if (members.length === 0) return null;
  const primary   = site.primary_color || '#3D6B34';
  const textColor = site.text_color    || '#111827';
  const bodyColor = site.body_color    || site.text_color || '#4B5563';
  const cols = members.length <= 2 ? members.length : members.length <= 4 ? 2 : 3;
  return (
    <SectionWrap site={site}>
      {data.heading && <SectionHeading site={site}>{data.heading}</SectionHeading>}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '2rem', marginTop: data.heading ? '2rem' : 0 }}
           className="ofn-team-grid">
        {members.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12 }}>
            {m.photo_url ? (
              <img src={m.photo_url} alt={m.name || ''} loading="lazy"
                style={{ width: 140, height: 140, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${primary}30` }} />
            ) : (
              <div style={{ width: 140, height: 140, borderRadius: '50%', background: `${primary}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', color: primary }}>👤</div>
            )}
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: textColor, fontFamily: site.font_family }}>{m.name}</div>
              {m.role && <div style={{ fontSize: '0.85rem', color: primary, fontWeight: 600, marginTop: 2 }}>{m.role}</div>}
              {m.bio && <p style={{ margin: '8px 0 0', fontSize: '0.82rem', color: bodyColor, lineHeight: 1.6 }}>{m.bio}</p>}
            </div>
          </div>
        ))}
      </div>
      <style>{`
        @media (max-width: 640px) { .ofn-team-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 900px) and (min-width: 641px) { .ofn-team-grid { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>
    </SectionWrap>
  );
}

function PricingBlock({ data, site }) {
  const { t } = useTranslation(); const wp = (k, o) => t(`website_public.${k}`, o);
  const tiers = Array.isArray(data.tiers) ? data.tiers : [];
  if (tiers.length === 0) return null;
  const primary   = site.primary_color || '#3D6B34';
  const textColor = site.text_color    || '#111827';
  const bodyColor = site.body_color    || site.text_color || '#4B5563';
  const cols = Math.min(tiers.length, 3);
  return (
    <SectionWrap site={site} alt>
      {data.heading && <SectionHeading site={site}>{data.heading}</SectionHeading>}
      {data.intro_body && <p style={{ textAlign: 'center', color: bodyColor, marginBottom: '1.5rem' }}>{data.intro_body}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '1.5rem', marginTop: '1.5rem', alignItems: 'start' }}
           className="ofn-pricing-grid">
        {tiers.map((tier, i) => (
          <div key={i} style={{
            background: tier.highlight ? primary : '#fff',
            color: tier.highlight ? '#fff' : textColor,
            borderRadius: 16,
            padding: '2rem 1.5rem',
            boxShadow: tier.highlight ? `0 8px 30px ${primary}40` : '0 2px 12px rgba(0,0,0,0.07)',
            display: 'flex', flexDirection: 'column', gap: 12,
            border: tier.highlight ? `2px solid ${primary}` : '1px solid #e5e7eb',
          }}>
            {tier.highlight && (
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.85 }}>{wp('pricing_popular')}</div>
            )}
            <div style={{ fontWeight: 700, fontSize: '1.15rem', fontFamily: site.font_family }}>{tier.name}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: '2rem', fontWeight: 800 }}>{tier.price}</span>
              {tier.period && <span style={{ fontSize: '0.85rem', opacity: 0.75 }}>/{tier.period}</span>}
            </div>
            {tier.description && <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8, lineHeight: 1.6 }}>{tier.description}</p>}
            {Array.isArray(tier.features) && tier.features.length > 0 && (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {tier.features.map((f, j) => (
                  <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.85rem', opacity: 0.9 }}>
                    <span style={{ color: tier.highlight ? '#fff' : primary, flexShrink: 0, marginTop: 2 }}>✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
      <style>{`
        @media (max-width: 640px) { .ofn-pricing-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 900px) and (min-width: 641px) { .ofn-pricing-grid { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>
    </SectionWrap>
  );
}

// ── Block dispatcher ──────────────────────────────────────────────
function RenderBlock({ block, site, businessId }) {
  const { block_type: type, block_data: data } = block;
  switch (type) {
    case 'hero':           return <HeroBlock data={data} site={site} />;
    case 'slideshow':      return <SlideshowBlock data={data} site={site} />;
    case 'about':          return <AboutBlock data={data} site={site} />;
    case 'content':        return <ContentBlock data={data} site={site} />;
    case 'content_2col':   return <MultiColumnBlock data={data} site={site} columnCount={2} />;
    case 'content_4col':   return <MultiColumnBlock data={data} site={site} columnCount={4} />;
    case 'livestock':      return <LivestockBlock data={data} site={site} businessId={businessId} />;
    case 'studs':          return <LivestockBlock data={data} site={site} businessId={businessId} mode="stud" />;
    case 'produce':        return <ProduceBlock data={data} site={site} businessId={businessId} />;
    case 'meat':           return <MeatBlock data={data} site={site} businessId={businessId} />;
    case 'processed_food': return <ProcessedFoodBlock data={data} site={site} businessId={businessId} />;
    case 'services':       return <ServicesBlock data={data} site={site} businessId={businessId} />;
    case 'marketplace':    return <MarketplaceBlock data={data} site={site} businessId={businessId} />;
    case 'gallery':        return <GalleryBlock data={data} site={site} businessId={businessId} />;
    case 'blog':           return <BlogBlock data={data} site={site} businessId={businessId} />;
    case 'events':         return <EventsBlock data={data} site={site} businessId={businessId} />;
    case 'testimonials':   return <TestimonialsBlock data={data} site={site} businessId={businessId} />;
    case 'testimonial_random': return <TestimonialRandomBlock data={data} site={site} businessId={businessId} />;
    case 'packages':       return <PackagesBlock data={data} site={site} businessId={businessId} />;
    case 'contact':        return <ContactBlock data={data} site={site} />;
    case 'links':          return <LinksBlock data={data} site={site} />;
    case 'divider':        return <DividerBlock data={data} />;
    case 'member_directory': return <MemberDirectoryBlock data={data} site={site} businessId={businessId} />;
    case 'pedigree_search':  return <PedigreeSearchBlock  data={data} site={site} businessId={businessId} />;
    case 'fee_schedule':     return <FeeScheduleBlock     data={data} site={site} />;
    case 'hours_of_operation': return <HoursOfOperationBlock data={data} site={site} />;
    case 'map_location':       return <MapLocationBlock       data={data} site={site} />;
    case 'faq':                return <FaqBlock               data={data} site={site} />;
    case 'features':           return <FeaturesBlock          data={data} site={site} />;
    case 'team':               return <TeamBlock              data={data} site={site} />;
    case 'pricing':            return <PricingBlock           data={data} site={site} />;
    case 'sponsors':           return <SponsorsBlock          data={data} site={site} />;
    case 'cta':                return <CtaBlock               data={data} site={site} />;
    default:               return null;
  }
}

// Hostnames that are this platform itself — anything else is a customer's own
// domain, which is looked up by hostname rather than by URL slug.
//
// This list came across naming Oatmeal Farm Network's hosts, so every request
// to livestockofamerica.com counted as a custom domain: /sites/{slug} asked for
// a site registered to livestockofamerica.com, found none, and rendered "Site
// Not Found" for a site that was published and serving fine.
const PLATFORM_HOSTS = [
  'livestockofamerica.com', 'www.livestockofamerica.com',
  'localhost', '127.0.0.1',
];
const isCustomDomain = !PLATFORM_HOSTS.some(h => window.location.hostname === h || window.location.hostname.endsWith(`.${h}`));

// Pick the header image whose month/day range covers today.
// Falls back to header_banner_url if no images are configured.
function resolveActiveBanner(site) {
  const imgs = site.header_images;
  if (!imgs || imgs.length === 0) return site.header_banner_url || null;
  if (imgs.length === 1) return imgs[0].image_url;
  const now = new Date();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const today = m * 100 + d; // e.g. March 15 → 315
  for (const img of imgs) {
    if (!img.start_date || !img.end_date) continue;
    const [, sm, sd] = img.start_date.split('-').map(Number);
    const [, em, ed] = img.end_date.split('-').map(Number);
    const start = sm * 100 + sd;
    const end   = em * 100 + ed;
    const inRange = start <= end
      ? today >= start && today <= end          // normal: Jan–Mar
      : today >= start || today <= end;         // year-wrap: Nov–Feb
    if (inRange) return img.image_url;
  }
  return imgs[0].image_url; // fallback: first image
}

// ── Main public site renderer ─────────────────────────────────────
export default function WebsitePublic() {
  const { t } = useTranslation(); const wp = (k, o) => t(`website_public.${k}`, o);
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === '1';

  const [siteData, setSiteData] = useState(null);
  const [activePage, setActivePage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // page_id of open nav dropdown
  // Grace-period close so the dropdown doesn't vanish when the cursor briefly
  // crosses the gap between the menu trigger and the dropdown panel — this is
  // a pure UX fix that applies to any site, regardless of dropdown width.
  const dropdownCloseTimerRef = useRef(null);
  const openNavDropdown = (id) => {
    if (dropdownCloseTimerRef.current) {
      clearTimeout(dropdownCloseTimerRef.current);
      dropdownCloseTimerRef.current = null;
    }
    setOpenDropdown(id);
  };
  const scheduleCloseNavDropdown = () => {
    if (dropdownCloseTimerRef.current) clearTimeout(dropdownCloseTimerRef.current);
    dropdownCloseTimerRef.current = setTimeout(() => {
      setOpenDropdown(null);
      dropdownCloseTimerRef.current = null;
    }, 220);
  };
  useEffect(() => () => {
    if (dropdownCloseTimerRef.current) clearTimeout(dropdownCloseTimerRef.current);
  }, []);

  useEffect(() => {
    // On a custom domain, look up by hostname instead of URL slug so the
    // address bar keeps showing the custom domain (no redirect needed).
    const url = isCustomDomain
      ? `${API}/api/website/bundle-by-domain?domain=${encodeURIComponent(window.location.hostname)}`
      : `${API}/api/website/bundle/${slug}`;

    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error('Site not found');
        return r.json();
      })
      .then(data => {
        setSiteData(data);
        const home = data.pages.find(p => p.is_home_page) || data.pages[0];
        setActivePage(home);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  // Delegate clicks on internal page anchors (data-page-slug) inside rich-text
  // bodies, so WYSIWYG "link to page" navigates within the SPA.
  useEffect(() => {
    if (!siteData?.pages) return;
    const onClick = (e) => {
      const a = e.target.closest?.('a[data-page-slug]');
      if (!a) return;
      const slug = a.getAttribute('data-page-slug');
      const target = siteData.pages.find(p => p.slug === slug);
      if (target) {
        e.preventDefault();
        setActivePage(target);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [siteData?.pages]);

  // Apply favicon from site settings
  useEffect(() => {
    if (!siteData?.favicon_url) return;
    let link = document.querySelector("link[rel~='icon']");
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.href = siteData.favicon_url;
    return () => { link.href = '/favicon.ico'; };
  }, [siteData?.favicon_url]);

  // Inject Google Fonts <link> when the site was imported with a custom typeface
  useEffect(() => {
    let gfUrl = '';
    try {
      const sej = siteData?.seo_extras_json ? JSON.parse(siteData.seo_extras_json) : null;
      gfUrl = (sej?.google_fonts_url || '').trim();
    } catch {}
    if (!gfUrl) return;
    const existing = document.querySelector(`link[data-ofn-gf]`);
    if (existing) { existing.href = gfUrl; return; }
    const el = document.createElement('link');
    el.rel = 'stylesheet'; el.href = gfUrl; el.setAttribute('data-ofn-gf', '1');
    document.head.appendChild(el);
    return () => { try { document.head.removeChild(el); } catch {} };
  }, [siteData?.seo_extras_json]);

  // Close mobile menu when viewport widens past the md breakpoint (768px)
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMobileMenu(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', color: '#6B7280' }}>
      {wp('site_loading')}
    </div>
  );

  if (!siteData) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ fontSize: '3rem' }}>🌾</div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>{wp('site_not_found')}</h1>
      <p style={{ color: '#6B7280' }}>{wp('site_not_found_msg')}</p>
    </div>
  );

  if (!siteData.is_published && !isPreview) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ fontSize: '3rem' }}>🚧</div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>{wp('coming_soon')}</h1>
      <p style={{ color: '#6B7280' }}>{wp('coming_soon_msg')}</p>
    </div>
  );

  const site = siteData;
  const pages = siteData.pages || [];

  const pageBg = site.bg_image_url
    ? `url(${site.bg_image_url}) center/cover no-repeat fixed`
    : (site.bg_gradient || site.screen_background_color || site.bg_color || '#fff');

  // Full typography CSS for .site-rte rich-text blocks (standard h1/h2/h3/h4/p tags from inline editor)
  const buildSiteRteBodyCss = () => {
    const linkColor = site.link_color || site.accent_color || '#2563eb';
    const linkUline = site.link_underline !== false;
    const linkRule  = `.site-rte a{color:${linkColor};${linkUline ? 'text-decoration:underline;' : 'text-decoration:none;'}}`;
    const liFont  = site.body_font  || site.font_family || 'inherit';
    const liSize  = remToPx(site.body_size) || '16px';
    const liColor = site.body_color || site.text_color  || 'inherit';
    const listRules = [
      `.site-rte ul{list-style:disc!important;padding-left:1.5em!important;margin:0.4em 0!important;}`,
      `.site-rte ol{list-style:decimal!important;padding-left:1.5em!important;margin:0.4em 0!important;}`,
      `.site-rte li{margin:0.2em 0;font-family:${liFont};font-size:${liSize};color:${liColor};}`,
      `.site-rte li *{font-family:inherit;font-size:inherit;color:inherit;}`,
    ].join('');
    const tagRules  = [
      ['h1','h1'],['h2','h2'],['h3','h3'],['h4','h4'],['body','p'],
    ].map(([k, tag]) => {
      const size    = remToPx(site[`${k}_size`]) || (k==='body'?'16px':k==='h1'?'40px':k==='h2'?'29px':k==='h3'?'21px':'17px');
      const weight  = site[`${k}_weight`]       || (k==='body'?'400':k==='h1'?'800':k==='h2'?'700':'600');
      const color   = site[`${k}_color`]        || site.text_color || '';
      const font    = site[`${k}_font`]         || site.font_family || '';
      const uline   = site[`${k}_underline`];
      const italic  = site[`${k}_italic`];
      const hasRule = k !== 'body' && site[`${k}_rule`];
      const ruleclr = site[`${k}_rule_color`]   || site.text_color || '#000';
      const align   = site[`${k}_align`]        || 'left';
      const mt      = site[`${k}_margin_top`]   ?? 0;
      const mb      = site[`${k}_margin_bottom`]?? (k === 'body' ? 12 : 8);
      let css = `font-size:${size};font-weight:${weight};margin-top:${mt}px;margin-bottom:${mb}px;`;
      if (font)    css += `font-family:${font};`;
      if (color)   css += `color:${color};`;
      if (italic)  css += `font-style:italic;`;
      if (uline)   css += `text-decoration:underline;`;
      if (hasRule) css += `border-bottom:2px solid ${ruleclr};padding-bottom:2px;`;
      if (align !== 'left') css += `text-align:${align};`;
      return `.site-rte ${tag}{${css}}`;
    }).join('\n');
    return linkRule + '\n' + listRules + '\n' + tagRules;
  };

  const typographyCss = buildSiteRteBodyCss() + '\n' + buildPublicRteTypoCss(site) + '\n' + buildPublicImageCss(site);

  const pageName = activePage?.page_name || 'Home';
  const metaTitle = `${pageName} | ${site.site_name}`;
  const metaDesc = activePage?.meta_description || site.tagline || `Visit ${site.site_name} on Oatmeal Farm Network.`;
  const socialImage = site.og_image_url || site.logo_url || undefined;

  return (
    <div style={{ minHeight: '100vh', background: pageBg, fontFamily: site.font_family }}>
      <PageMeta
        title={metaTitle}
        description={metaDesc}
        image={socialImage}
        noIndex={!siteData.is_published || isPreview}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: site.site_name,
          description: metaDesc,
          ...(site.phone ? { telephone: site.phone } : {}),
          ...(site.email ? { email: site.email } : {}),
          ...(site.logo_url ? { image: site.logo_url } : {}),
        }}
      />
      <style dangerouslySetInnerHTML={{ __html: typographyCss }} />
      {/* Preview banner */}
      {isPreview && (
        <div style={{ background: '#1E3A5F', color: '#fff', textAlign: 'center', padding: '0.5rem', fontSize: '0.8rem', fontFamily: 'Inter, sans-serif' }}>
          {wp('preview_mode')}<strong>{wp('preview_not_published')}</strong>
        </div>
      )}

      {/* ── Site Header (3 zones) ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, fontFamily: site.font_family, display: 'flex', justifyContent: 'center', background: 'transparent' }}>
        {/* Background band — only this div carries the color, constrained to header_bg_width */}
        <div style={{ width: '100%', maxWidth: site.header_bg_width || '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          {/* Zone 1: Top bar */}
          {site.top_bar_enabled && site.top_bar_html && (
            <div style={{
              width: '100%', maxWidth: site.header_content_width || '100%',
              background: site.top_bar_bg_color || '#f8f5ef',
              padding: '5px 1.5rem', textAlign: site.top_bar_align || 'right',
            }}>
              <span style={{ fontSize: 13, color: site.top_bar_text_color || '#333' }}
                dangerouslySetInnerHTML={{ __html: site.top_bar_html }} />
            </div>
          )}

          {(() => {
            const isNavTop = site.header_layout === 'nav_top';

            // Zone 2: Header banner — image+logo constrained to header_content_width.
            // In nav_top layout the logo is the centerpiece: centered horizontally,
            // larger, with a white/light background instead of the green primary.
            const bannerHeight = site.header_height || (isNavTop ? 180 : 120);
            const bannerBg = site.header_banner_bg_color
              || (isNavTop ? '#ffffff' : (site.primary_color || '#3D6B34'));
            const logoMaxHeight = isNavTop
              ? Math.min(bannerHeight * 0.85, 150)
              : Math.min(bannerHeight * 0.55, 90);
            const activeBannerUrl = resolveActiveBanner(site);
            const bannerEl = (activeBannerUrl || site.logo_url || site.show_site_name !== false) ? (
              <div style={{
                width: '100%', maxWidth: site.header_content_width || '100%',
                position: 'relative',
              }}>
                {activeBannerUrl ? (
                  <img src={activeBannerUrl} alt=""
                    style={{ width: '100%', display: 'block' }} />
                ) : (
                  <div style={{ height: bannerHeight, background: bannerBg }} />
                )}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  display: 'flex', alignItems: 'center',
                  justifyContent: isNavTop ? 'center' : 'flex-start',
                  padding: '0 1.5rem', gap: '1rem',
                }}>
                  {site.logo_url && (
                    <img src={site.logo_url} alt="logo" style={{
                      height: logoMaxHeight,
                      maxWidth: '100%',
                      objectFit: 'contain', borderRadius: 4,
                    }} />
                  )}
                  {site.show_site_name !== false && (
                    <span style={{
                      fontWeight: 800,
                      color: isNavTop
                        ? (site.h1_color || site.text_color || '#111827')
                        : (site.nav_text_color || '#fff'),
                      fontSize: 'clamp(1.1rem, 2.5vw, 1.8rem)',
                      textShadow: (!isNavTop && activeBannerUrl) ? '1px 2px 6px rgba(0,0,0,0.55)' : 'none',
                    }}>{site.site_name}</span>
                  )}
                </div>
              </div>
            ) : null;

            // Zone 3: Nav bar — constrained to header_content_width
            const navEl = (() => {
            const navBg = site.nav_bg_image_url
              ? `url(${site.nav_bg_image_url}) center/cover no-repeat`
              : (site.primary_color || '#3D6B34');
            const navColor = site.nav_text_color || '#fff';
            const dropdownBg = site.dropdown_bg_color2
              ? `linear-gradient(${site.dropdown_gradient_dir || '135deg'}, ${site.dropdown_bg_color || site.primary_color || '#3D6B34'}, ${site.dropdown_bg_color2})`
              : (site.dropdown_bg_color || site.primary_color || '#3D6B34');
            const dropdownHover = site.dropdown_hover_color || 'rgba(255,255,255,0.15)';
            // Build nav tree — filter unpublished pages/headings on live site
            const visiblePages = isPreview ? pages : pages.filter(p => p.is_published !== false);
            const topLevelPages = visiblePages.filter(p => !p.parent_page_id);
            const childrenOf = parentId => visiblePages.filter(p => p.parent_page_id === parentId);
            const isActiveOrChild = p => activePage?.page_id === p.page_id || childrenOf(p.page_id).some(c => c.page_id === activePage?.page_id);
            // nav_top layout: plain uppercase links, centered, no active-tab pill.
            const itemActiveBg = isNavTop ? 'none' : 'rgba(255,255,255,0.2)';
            const itemPadding  = isNavTop ? '0.4rem 1rem' : '0.4rem 0.9rem';
            const itemRadius   = isNavTop ? 0 : 8;
            const itemFontSize = isNavTop ? '0.82rem' : '0.9rem';
            // Nav typography overrides extracted from the source site (when
            // imported via Lavendir). Falls back to layout-aware defaults.
            // menu_style_json shape: { fontWeight, textTransform, letterSpacing }
            let menuStyle = {};
            try { menuStyle = site.menu_style_json ? (typeof site.menu_style_json === 'string' ? JSON.parse(site.menu_style_json) : site.menu_style_json) : {}; }
            catch { menuStyle = {}; }
            const navItemWeight = (menuStyle.fontWeight && Number(menuStyle.fontWeight))
              || 600;  // bumped default — old 500 read too thin on most sites
            const itemTransform = menuStyle.textTransform || (isNavTop ? 'uppercase' : 'none');
            const itemLetter    = menuStyle.letterSpacing || (isNavTop ? '0.05em' : 'normal');
            return (
              <nav style={{ width: '100%', maxWidth: site.header_content_width || '100%', background: navBg, boxShadow: '0 2px 16px rgba(0,0,0,0.15)' }}>
                <div style={{ padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: isNavTop ? 'center' : 'space-between', height: isNavTop ? 44 : 50 }}>
                  {/* Desktop nav */}
                  <div className="hidden md:flex items-center gap-1" style={{ position: 'relative' }}>
                    {topLevelPages.map(p => {
                      const children = childrenOf(p.page_id);
                      const active = isActiveOrChild(p);
                      const isHeading = p.is_nav_heading || children.length > 0;
                      if (!isHeading) {
                        return (
                          <button key={p.page_id}
                            onClick={() => { setActivePage(p); setOpenDropdown(null); }}
                            style={{ background: active ? itemActiveBg : 'none', border: 0, color: navColor, padding: itemPadding, borderRadius: itemRadius, fontWeight: active ? Math.max(navItemWeight, 700) : navItemWeight, cursor: 'pointer', fontSize: itemFontSize, fontFamily: site.font_family, transition: 'background 0.2s', textTransform: itemTransform, letterSpacing: itemLetter }}>
                            {p.page_name}
                          </button>
                        );
                      }
                      return (
                        <div key={p.page_id} style={{ position: 'relative' }}
                          onMouseEnter={() => openNavDropdown(p.page_id)}
                          onMouseLeave={scheduleCloseNavDropdown}>
                          <span
                            style={{ background: active ? itemActiveBg : 'none', color: navColor, padding: itemPadding, borderRadius: itemRadius, fontWeight: active ? Math.max(navItemWeight, 700) : navItemWeight, fontSize: itemFontSize, fontFamily: site.font_family, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'default', userSelect: 'none', textTransform: itemTransform, letterSpacing: itemLetter }}>
                            {p.page_name}
                            {children.length > 0 && <span style={{ fontSize: '1rem', lineHeight: 1, opacity: 0.9 }}>▾</span>}
                          </span>
                          {children.length > 0 && openDropdown === p.page_id && (<>
                            {/* Invisible bridge — extends past the parent's edges so the cursor
                                stays inside a child element while crossing into the dropdown. */}
                            <div style={{ position: 'absolute', top: '100%', left: -40, right: -40, height: 12, background: 'transparent' }} />
                            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, background: dropdownBg, borderRadius: 8, boxShadow: '0 6px 24px rgba(0,0,0,0.25)', minWidth: 170, zIndex: 300, overflow: 'hidden' }}
                                 onMouseEnter={() => openNavDropdown(p.page_id)}
                                 onMouseLeave={scheduleCloseNavDropdown}>
                              {children.map(child => (
                                <DropdownItem key={child.page_id}
                                  label={child.page_name}
                                  active={activePage?.page_id === child.page_id}
                                  navColor={navColor}
                                  hoverColor={dropdownHover}
                                  fontFamily={site.font_family}
                                  onClick={() => { setActivePage(child); setOpenDropdown(null); }}
                                />
                              ))}
                            </div>
                          </>)}
                        </div>
                      );
                    })}
                  </div>
                  {/* Mobile: site name + hamburger */}
                  <button onClick={() => { setActivePage(pages.find(p => p.is_home_page) || pages[0]); setMobileMenu(false); }}
                    className="md:hidden"
                    style={{ fontWeight: 800, color: navColor, background: 'none', border: 0, cursor: 'pointer', fontSize: '1rem' }}>
                    {site.site_name}
                  </button>
                  <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden" style={{ background: 'none', border: 0, color: navColor, cursor: 'pointer', fontSize: '1.4rem' }}>
                    {mobileMenu ? '✕' : '☰'}
                  </button>
                </div>
                {/* Mobile menu — parents then indented children */}
                {mobileMenu && (
                  <div style={{ background: site.secondary_color || site.primary_color, padding: '0.5rem 1.5rem 1rem' }}>
                    {topLevelPages.map(p => {
                      const children = childrenOf(p.page_id);
                      const isHeading = p.is_nav_heading || children.length > 0;
                      return (
                        <React.Fragment key={p.page_id}>
                          {isHeading ? (
                            <div style={{ display: 'block', width: '100%', color: navColor, padding: '0.2rem 0 0.1rem', fontWeight: 600, fontSize: '0.75rem', fontFamily: site.font_family, opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.07em', userSelect: 'none' }}>
                              {p.page_name}
                            </div>
                          ) : (
                          <button onClick={() => { setActivePage(p); setMobileMenu(false); }}
                            style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 0, color: navColor, padding: '0.18rem 0', fontWeight: isActiveOrChild(p) ? 700 : 400, cursor: 'pointer', fontSize: '1rem', fontFamily: site.font_family, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            {p.page_name}
                          </button>
                          )}
                          {children.map((child, ci) => (
                            <button key={child.page_id} onClick={() => { setActivePage(child); setMobileMenu(false); }}
                              style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 0, color: navColor, padding: '0.15rem 0 0.15rem 1.2rem', fontWeight: activePage?.page_id === child.page_id ? 700 : 400, cursor: 'pointer', fontSize: '0.9rem', fontFamily: site.font_family, opacity: 0.85, borderBottom: ci === children.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                              {child.page_name}
                            </button>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}
              </nav>
            );
            })();

            return isNavTop
              ? (<>{navEl}{bannerEl}</>)
              : (<>{bannerEl}{navEl}</>);
          })()}
        </div>
      </header>

      {/* Page content — body band centered at body_bg_width, filled with page_background_color.
          Outside the band shows the screen background (same treatment as header/footer sides). */}
      <div style={{ display: 'flex', justifyContent: 'center', background: 'transparent' }}>
      <div style={{ width: '100%', maxWidth: site.body_bg_width || '100%', background: site.page_background_color || 'transparent' }}>
      {activePage && (() => {
        // Group consecutive half/third blocks into grid rows; full-width blocks get their own row
        const rows = [];
        let currentRow = [];
        activePage.blocks.forEach(block => {
          const span = block.block_data?.col_span || 'full';
          if (span === 'full') {
            if (currentRow.length > 0) { rows.push(currentRow); currentRow = []; }
            rows.push([block]);
          } else {
            currentRow.push(block);
            const totalSpan = currentRow.reduce((acc, b) => {
              const s = b.block_data?.col_span || 'full';
              return acc + (s === 'third' ? 1 : 2); // half=2/3cols, third=1/3col (out of 3)
            }, 0);
            if (totalSpan >= 3) { rows.push(currentRow); currentRow = []; }
          }
        });
        if (currentRow.length > 0) rows.push(currentRow);

        return rows.map((row, ri) => {
          if (row.length === 1 && (!row[0].block_data?.col_span || row[0].block_data.col_span === 'full')) {
            return <RenderBlock key={row[0].block_id} block={row[0]} site={site} businessId={site.business_id} />;
          }
          return (
            <div key={ri} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', maxWidth: site.body_content_width || '100%', margin: '0 auto', padding: '0 1rem' }}>
              {row.map(block => {
                const span = block.block_data?.col_span || 'full';
                const colSpan = span === 'third' ? 1 : 2;
                return (
                  <div key={block.block_id} style={{ gridColumn: `span ${colSpan}` }}>
                    <RenderBlock block={block} site={site} businessId={site.business_id} />
                  </div>
                );
              })}
            </div>
          );
        });
      })()}
      </div>
      </div>

      {/* Footer — outer band at footer_bg_width, inner content at footer_content_width */}
      {(() => {
        const fRadius = Number(site.footer_bottom_radius) || 0;
        const fRadiusCss = fRadius ? `0 0 ${fRadius}px ${fRadius}px` : undefined;
        const copyrightBg = site.copyright_bar_bg_color || 'rgba(0,0,0,0.18)';
        const copyrightIsTransparent = !copyrightBg || copyrightBg === 'transparent';
        const footerContentRadius = copyrightIsTransparent ? fRadiusCss : undefined;
        const copyrightRadius = copyrightIsTransparent ? undefined : fRadiusCss;
        // Strip a trailing "© ... all rights reserved" block from footer_html so
        // it never duplicates the dedicated copyright bar. If found, use its
        // text as the copyright when the site doesn't have its own.
        const _copyRx = /<(div|p|small|span)\b[^>]*>[\s\S]*?(?:&copy;|©)[\s\S]*?all\s+rights\s+reserved[\s\S]*?<\/\1>\s*$/i;
        let footerHtml = site.footer_html || '';
        let extractedCopy = '';
        const m = footerHtml.match(_copyRx);
        if (m) {
          extractedCopy = m[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          footerHtml = footerHtml.replace(_copyRx, '');
        }
        const copyrightLine = site.copyright_text || extractedCopy || `© ${new Date().getFullYear()} ${site.site_name}`;
        return (
      <footer style={{ display: 'flex', justifyContent: 'center', background: 'transparent', fontFamily: site.font_family, paddingBottom: fRadius }}>
        <div style={{ width: '100%', maxWidth: site.footer_bg_width || '100%', borderRadius: fRadiusCss, overflow: fRadius ? 'hidden' : undefined }}>
          {site.footer_bg_image_url ? (
            /* Image case: bg-image with cover+overlay; height matches the
               no-image branch (footer_height) so the band stays compact. */
            <>
              <div style={{
                position: 'relative',
                minHeight: Number(site.footer_height) || 240,
                backgroundImage: `url(${site.footer_bg_image_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                borderRadius: footerContentRadius,
                overflow: fRadius && copyrightIsTransparent ? 'hidden' : undefined,
              }}>
                {/* Dark scrim so white text reads on bright photo areas */}
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', pointerEvents: 'none' }} />
                <div style={{ position: 'relative', maxWidth: site.footer_content_width || '100%', margin: '0 auto' }}>
                  {footerHtml ? (
                    <div style={{ padding: '0.5rem 1rem', color: '#fff', lineHeight: 1.7 }}
                      dangerouslySetInnerHTML={{ __html: footerHtml }} />
                  ) : null}
                </div>
              </div>
              {/* Copyright bar — its own background, sibling block below */}
              <div style={{ background: copyrightBg, borderRadius: copyrightRadius }}>
                <div style={{ maxWidth: site.footer_content_width || '100%', margin: '0 auto', padding: '0.5rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)' }}>
                    {copyrightLine}
                  </span>
                  <a href="https://livestockofamerica.com" target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
                    {wp('powered_by')}
                  </a>
                </div>
              </div>
            </>
          ) : (
            /* No image: footer content and copyright are plain block siblings */
            <>
              {/* Footer content area */}
              <div style={{ minHeight: Number(site.footer_height) || 200, background: site.footer_bg_color || site.primary_color, borderRadius: footerContentRadius }}>
                <div style={{ maxWidth: site.footer_content_width || '100%', margin: '0 auto' }}>
                  {footerHtml ? (
                    <div style={{ padding: '0.5rem 1rem', color: '#fff', lineHeight: 1.7 }}
                      dangerouslySetInnerHTML={{ __html: footerHtml }} />
                  ) : null}
                </div>
              </div>
              {/* Copyright bar — its own independent background, always below footer content */}
              <div style={{ background: copyrightBg, borderRadius: copyrightRadius }}>
                <div style={{ maxWidth: site.footer_content_width || '100%', margin: '0 auto', padding: '0.5rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)' }}>
                    {copyrightLine}
                  </span>
                  <a href="https://livestockofamerica.com" target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
                    {wp('powered_by')}
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </footer>
        );
      })()}
    </div>
  );
}
