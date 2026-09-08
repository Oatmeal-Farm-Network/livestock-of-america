// Ported from Oatmeal Farm Network (src/ForBusinessPage.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
import React from 'react';
import { Link } from 'react-router';
import { useTranslation } from '../../lib/i18n';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import Breadcrumbs from '../../components/Breadcrumbs';

// ── Shared SVG wrapper ───────────────────────────────────────────
const S = ({ children }) => (
  <svg width="24" height="24" viewBox="0 0 16 16" fill="none" stroke="currentColor"
    strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

// ── Icons ────────────────────────────────────────────────────────
const I = {
  satellite: <S><rect x="5" y="1" width="6" height="4" rx="0.5"/><line x1="8" y1="5" x2="8" y2="8"/><circle cx="8" cy="10" r="3"/><line x1="1" y1="3" x2="4" y2="5"/><line x1="15" y1="3" x2="12" y2="5"/></S>,
  saige:     <S><path d="M8 14V8"/><path d="M5 11c0-3 3-4 3-7 0 3 3 4 3 7a3 3 0 0 1-6 0z"/></S>,
  livestock: <S><path d="M3 12c0-2.8 2.2-5 5-5s5 2.2 5 5"/><circle cx="8" cy="5" r="2.5"/><path d="M1 10c.5-1.5 1.5-2 2-2"/><path d="M15 10c-.5-1.5-1.5-2-2-2"/></S>,
  market:    <S><path d="M2 3h12l-1 5H3L2 3z"/><path d="M3 8l1 5h8l1-5"/><line x1="8" y1="8" x2="8" y2="13"/></S>,
  website:   <S><rect x="1" y="2" width="14" height="10" rx="1"/><line x1="4" y1="15" x2="12" y2="15"/><line x1="8" y1="12" x2="8" y2="15"/></S>,
  directory: <S><circle cx="8" cy="8" r="6"/><path d="M8 2c-2 1.5-3 3.5-3 6s1 4.5 3 6"/><path d="M8 2c2 1.5 3 3.5 3 6s-1 4.5-3 6"/><line x1="2" y1="8" x2="14" y2="8"/></S>,
  events:    <S><rect x="1" y="3" width="14" height="11" rx="1"/><path d="M5 3V1M11 3V1"/><line x1="1" y1="7" x2="15" y2="7"/></S>,
  assoc:     <S><path d="M8 1L2 4v4c0 3.5 2.5 6.5 6 7.5C14 14.5 14 8 14 8V4L8 1z"/></S>,
  rosemarie: <S><path d="M8 2c-1 2-3 3-3 5.5A3 3 0 0 0 8 11a3 3 0 0 0 3-3.5C11 5 9 4 8 2z"/><line x1="8" y1="11" x2="8" y2="14"/></S>,
  pairsley:  <S><path d="M5 2v5a3 3 0 0 0 6 0V2"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="5" y1="14" x2="11" y2="14"/></S>,
  pantry:    <S><rect x="2" y="4" width="12" height="10" rx="1"/><path d="M5 4V2.5A1.5 1.5 0 0 1 6.5 1h3A1.5 1.5 0 0 1 11 2.5V4"/><line x1="8" y1="8" x2="8" y2="11"/><line x1="6" y1="9.5" x2="10" y2="9.5"/></S>,
  blog:      <S><path d="M11 2l3 3-8 8H3v-3z"/><line x1="9" y1="4" x2="12" y2="7"/></S>,
  source:    <S><path d="M4 8h8M8 4l4 4-4 4"/></S>,
};

// ── Static (non-text) data per type ─────────────────────────────
// Shared image references mirroring the home page constants
const IMG_PRECISION  = '/images/CoreFeaturesPrecisionAg.webp';
const IMG_SAIGE      = '/images/SaigeBanner.webp';
const IMG_LIVESTOCK  = '/images/HomepageLivestockMarketplace.webp';
const IMG_FARM2TABLE = '/images/CoreFeaturesFarm2Table.webp';
const IMG_WEBSITE    = '/images/HomeCustomWebsiteSystem.webp';
const IMG_EVENTS     = '/images/EventsHeader.webp';
const IMG_ASSOC      = '/images/CoreFeaturesAssociationSupport.webp';
const IMG_RESTAURANTS= '/images/Restaurants.webp';
const IMG_DIRECTORY  = '/images/AboutDirectoryImage.webp';
const IMG_BLOG       = '/images/ForXBlog.webp';
const IMG_INGREDIENTS= '/images/ForXIngredients.webp';

const TYPE_DATA = {
  farms: {
    key:     'farms',
    color:   '#3D6B34',
    heroImg: '/images/FarmsPageHeader.webp',
    cta1To:  '/oatsense',
    cta2To:  '/signup',
    dir:     '/directory/farms-ranches',
    tools: [
      { icon: I.satellite, img: IMG_PRECISION,  link: '/platform/precision-ag' },
      { icon: I.saige,     img: IMG_SAIGE,      link: '/platform/saige' },
      { icon: I.livestock, img: IMG_LIVESTOCK,  link: '/marketplaces/livestock' },
      { icon: I.market,    img: IMG_FARM2TABLE, link: '/marketplaces/farm-to-table' },
      { icon: I.website,   img: IMG_WEBSITE,    link: '/website-builder' },
      { icon: I.directory, img: IMG_DIRECTORY,  link: '/directory/farms-ranches' },
      { icon: I.events,    img: IMG_EVENTS,     link: '/event-registration' },
      { icon: I.assoc,     img: IMG_ASSOC,      link: '/agriculture-support' },
    ],
  },
  ranches: {
    key:     'ranches',
    color:   '#7C5A3A',
    heroImg: '/images/RanchesHeader.webp',
    cta1To:  '/marketplaces/livestock',
    cta2To:  '/signup',
    dir:     '/directory/farms-ranches',
    tools: [
      { icon: I.livestock, img: IMG_LIVESTOCK,  link: '/marketplaces/livestock' },
      { icon: I.saige,     img: IMG_SAIGE,      link: '/platform/saige' },
      { icon: I.satellite, img: IMG_PRECISION,  link: '/platform/precision-ag' },
      { icon: I.website,   img: IMG_WEBSITE,    link: '/website-builder' },
      { icon: I.directory, img: IMG_DIRECTORY,  link: '/directory/farms-ranches' },
      { icon: I.events,    img: IMG_EVENTS,     link: '/event-registration' },
      { icon: I.assoc,     img: IMG_ASSOC,      link: '/agriculture-support' },
      { icon: I.market,    img: IMG_FARM2TABLE, link: '/marketplaces/farm-to-table' },
    ],
  },
  'artisan-producers': {
    key:     'artisan',
    color:   '#7C3F8B',
    heroImg: '/images/ArtisanProducers.webp',
    cta1To:  '/marketplaces/farm-to-table',
    cta2To:  '/signup',
    dir:     '/directory/artisan-producers',
    tools: [
      { icon: I.market,    img: IMG_INGREDIENTS, link: '/marketplaces/farm-to-table' },
      { icon: I.rosemarie, img: IMG_SAIGE,       link: '/platform/rosemarie' },
      { icon: I.source,    img: IMG_FARM2TABLE,  link: '/marketplaces/farm-to-table' },
      { icon: I.website,   img: IMG_WEBSITE,    link: '/website-builder' },
      { icon: I.blog,      img: IMG_BLOG,         link: '/website-builder' },
      { icon: I.directory, img: IMG_DIRECTORY,  link: '/directory/artisan-producers' },
      { icon: I.events,    img: IMG_EVENTS,     link: '/event-registration' },
      { icon: I.assoc,     img: IMG_ASSOC,      link: '/agriculture-support' },
    ],
  },
  restaurants: {
    key:     'restaurants',
    color:   '#2f7d4a',
    heroImg: '/images/Restaurants.webp',
    cta1To:  '/marketplaces/farm-to-table',
    cta2To:  '/signup',
    dir:     '/directory/restaurants',
    tools: [
      { icon: I.pantry,    img: IMG_RESTAURANTS, link: '/chef-pantry' },
      { icon: I.market,    img: IMG_INGREDIENTS, link: '/marketplaces/farm-to-table' },
      { icon: I.pairsley,  img: IMG_SAIGE,       link: '/platform/pairsley' },
      { icon: I.website,   img: IMG_WEBSITE,     link: '/website-builder' },
      { icon: I.directory, img: IMG_DIRECTORY,   link: '/directory/restaurants' },
      { icon: I.events,    img: IMG_EVENTS,      link: '/event-registration' },
      { icon: I.blog,      img: IMG_BLOG,          link: '/website-builder' },
      { icon: I.assoc,     img: IMG_ASSOC,       link: '/agriculture-support' },
    ],
  },
};

export default function ForBusinessPage({ type }) {
  const { t } = useTranslation();
  const data = TYPE_DATA[type];
  if (!data) return null;

  const p = data.key;
  const cfg = {
    title:     t(`for_biz.${p}_title`),
    color:     data.color,
    heroImg:   data.heroImg,
    heroTitle: t(`for_biz.${p}_hero_title`),
    heroSub:   t(`for_biz.${p}_hero_sub`),
    what:      t(`for_biz.${p}_what`),
    tools: data.tools.map((tool, i) => ({
      icon:  tool.icon,
      img:   tool.img || null,
      title: t(`for_biz.${p}_tool${i + 1}_title`),
      body:  t(`for_biz.${p}_tool${i + 1}_body`),
      link:  tool.link,
      cta:   t(`for_biz.${p}_tool${i + 1}_cta`),
    })),
    cta1: { label: t(`for_biz.${p}_cta1`), to: data.cta1To },
    cta2: { label: t(`for_biz.${p}_cta2`), to: data.cta2To },
    dir: data.dir,
  };

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f7f2e8' }}>
      <PageMeta
        title={`${cfg.heroTitle} | Oatmeal Farm Network`}
        description={cfg.heroSub}
        canonical={`https://oatmealfarmnetwork.com/for-${type}`}
      />
      <Header />

      {/* ── Breadcrumbs ── */}
      <div className="mx-auto px-4 pt-4" style={{ maxWidth: '1300px' }}>
        <Breadcrumbs items={[
          { label: 'Home', to: '/' },
          { label: cfg.title },
        ]} />
      </div>

      {/* ── Hero — photo with gradient overlay, matching /directory ── */}
      <div className="mx-auto px-4 pt-2" style={{ maxWidth: '1300px' }}>
        <div className="relative w-full overflow-hidden rounded-xl">
          <img
            src={cfg.heroImg}
            alt={cfg.heroTitle}
            className="w-full object-cover"
            style={{ height: '250px', display: 'block' }}
            loading="eager"
            onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }}
          />
          {/* Gradient overlay — same formula as /directory */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.78) 45%, rgba(255,255,255,0) 80%)' }}
          />
          {/* Text content */}
          <div className="absolute inset-0 flex flex-col justify-center px-8 py-6" style={{ maxWidth: '780px' }}>
            <h1
              style={{
                color: '#000000',
                fontFamily: "'Lora','Times New Roman',serif",
                fontSize: '2rem',
                fontWeight: 'bold',
                margin: '0 0 12px',
                lineHeight: 1.2,
              }}
            >
              {cfg.heroTitle}
            </h1>
            <p style={{ color: '#111111', fontSize: '0.92rem', margin: '0 0 16px', lineHeight: 1.6 }}>
              {cfg.heroSub}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to={cfg.cta1.to}
                className="font-bold px-5 py-2 rounded-lg shadow hover:shadow-md transition text-sm"
                style={{ backgroundColor: cfg.color, color: '#fff' }}
              >
                {cfg.cta1.label}
              </Link>
              <Link
                to={cfg.cta2.to}
                className="font-bold px-5 py-2 rounded-lg shadow hover:shadow-md transition text-sm hover:opacity-90"
                style={{ backgroundColor: cfg.color, color: '#fff' }}
              >
                {cfg.cta2.label}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="mx-auto px-4 py-8" style={{ maxWidth: '1300px' }}>

        {/* What is OFN */}
        <section className="mb-8">
          <h2
            className="text-lg font-bold text-gray-900 mb-3"
            style={{ fontFamily: "'Lora','Times New Roman',serif" }}
          >
            {t('for_biz.what_ofn')}
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed max-w-3xl">{cfg.what}</p>
        </section>

        {/* Tools grid — horizontal cards matching /directory style */}
        <h2
          className="text-lg font-bold text-gray-900 mb-5"
          style={{ fontFamily: "'Lora','Times New Roman',serif" }}
        >
          {t('for_biz.tools_included')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cfg.tools.map((tool, i) => (
            <ToolCard key={i} icon={tool.icon} img={tool.img} title={tool.title} body={tool.body}
              link={tool.link} cta={tool.cta} color={cfg.color} />
          ))}
        </div>

        {/* Bottom CTA — matches directory's "Want to add your business?" tone */}
        <div
          className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4
                     bg-white border border-gray-200 rounded-xl px-8 py-6"
        >
          <div>
            <h3
              className="font-bold text-gray-900 text-base mb-1"
              style={{ fontFamily: "'Lora','Times New Roman',serif" }}
            >
              {t('for_biz.ready_title')}
            </h3>
            <p className="text-sm text-gray-600">{t('for_biz.ready_body')}</p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              to="/signup"
              className="px-5 py-2.5 rounded-lg font-bold text-sm shadow hover:shadow-md transition"
              style={{ backgroundColor: cfg.color, color: '#fff' }}
            >
              {t('for_biz.create_free')}
            </Link>
            <Link
              to={cfg.dir}
              className="px-5 py-2.5 rounded-lg font-bold border-2 text-sm transition hover:bg-gray-50"
              style={{ color: cfg.color, borderColor: cfg.color }}
            >
              {t('for_biz.browse_directory')}
            </Link>
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}

// ── ToolCard — horizontal layout matching /directory cards ────────
function ToolCard({ icon, img, title, body, link, cta, color }) {
  return (
    <div className="flex bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md hover:border-[#819360] transition-all duration-200">
      {/* Left: image or icon block — same 155px width as directory photo column */}
      <Link
        to={link}
        className="shrink-0 flex items-center justify-center"
        style={{ width: '155px', minHeight: '155px', backgroundColor: img ? undefined : `${color}18` }}
        aria-hidden="true"
        tabIndex={-1}
      >
        {img ? (
          <img
            src={img}
            alt={title}
            className="w-full h-full object-cover"
            style={{ width: '155px', height: '155px' }}
            loading="lazy"
            onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }}
          />
        ) : (
          <span style={{ color, opacity: 0.85, transform: 'scale(2.2)', display: 'flex' }}>
            {icon}
          </span>
        )}
      </Link>

      {/* Right: text — same padding/layout as directory */}
      <div className="flex flex-col justify-between px-5 py-4 flex-1 min-w-0">
        <div>
          <Link
            to={link}
            className="font-bold text-sm hover:underline"
            style={{ color: '#3D6B34' }}
          >
            {title}
          </Link>
          <p className="text-xs text-gray-600 leading-relaxed mt-1">{body}</p>
        </div>
        <div className="mt-3">
          <Link to={link} className="text-xs font-bold hover:underline" style={{ color }}>
            {cta} →
          </Link>
        </div>
      </div>
    </div>
  );
}
