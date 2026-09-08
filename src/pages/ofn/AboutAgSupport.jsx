// Ported from Oatmeal Farm Network (src/AboutAgSupport.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
import React from 'react';
import { Link } from 'react-router';
import { useTranslation } from '../../lib/i18n';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import Breadcrumbs from '../../components/Breadcrumbs';

const ACCENT     = '#3D6B34';
const GOLD       = '#B87F0B';
const GOLD_LIGHT = '#FEF3C7';
const TEAL       = '#0E7490';

const S = ({ children }) => (
  <svg width="24" height="24" viewBox="0 0 16 16" fill="none" stroke="currentColor"
    strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const AFFILIATE_FEATURES = [
  {
    icon: <S><circle cx="8" cy="8" r="6"/><path d="M6 10.5c0 .8.9 1.5 2 1.5s2-.7 2-1.5-1-1.3-2-1.5-2-.7-2-1.5S6.9 6 8 6s2 .7 2 1.5"/><line x1="8" y1="4" x2="8" y2="5"/><line x1="8" y1="11" x2="8" y2="12"/></S>,
    title: '5% of Every Subscription Goes to Your Association',
    body: 'When members choose a favorite association at sign-up, 5% of their monthly OFN subscription fee is automatically directed to that association — at no extra cost to the member. Associations earn recurring revenue simply by having an active membership on the platform.',
    link: '/signup',
  },
  {
    icon: <S><rect x="1" y="2" width="14" height="10" rx="1"/><line x1="4" y1="15" x2="12" y2="15"/><line x1="8" y1="12" x2="8" y2="15"/></S>,
    title: 'Free Association Website',
    body: 'Every qualifying association receives a fully hosted, professionally designed website at no charge — including a member directory, breed registry pages, event calendar, news feed, and custom branding. No web development skills required; no ongoing hosting fees.',
    link: '/website-builder',
  },
  {
    icon: <S><rect x="1" y="3" width="14" height="11" rx="1"/><path d="M5 3V1M11 3V1"/><line x1="1" y1="7" x2="15" y2="7"/><line x1="5" y1="11" x2="11" y2="11"/></S>,
    title: 'Free Show & Event Registration',
    body: 'Associations can create and manage livestock shows, field days, fiber festivals, conferences, and other events using OFN\'s full-featured event registration system — completely free of platform fees. Online registration, check-in, scheduling, results, and reporting are all included.',
    link: '/events/add',
  },
  {
    icon: <S><circle cx="8" cy="8" r="6"/><path d="M8 2c-2 1.5-3 3.5-3 6s1 4.5 3 6"/><path d="M8 2c2 1.5 3 3.5 3 6s-1 4.5-3 6"/><line x1="2" y1="8" x2="14" y2="8"/></S>,
    title: 'Directory Services',
    body: 'Associations are featured prominently in the OFN directory with a verified badge, full profile, and links to their member roster and upcoming events. Members searching for breeders, farms, or producers in your breed or sector are directed to your association listing first.',
    link: '/directory',
  },
];

const EVENT_ICONS = [
  <S><rect x="1" y="3" width="14" height="11" rx="1"/><path d="M5 3V1M11 3V1"/><line x1="1" y1="7" x2="15" y2="7"/></S>,
  <S><rect x="2" y="4" width="12" height="9" rx="1"/><path d="M5 4V2.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V4"/><line x1="8" y1="8" x2="8" y2="11"/><line x1="6" y1="9.5" x2="10" y2="9.5"/></S>,
  <S><path d="M3 5h10M3 8h7M3 11h5"/><rect x="1" y="2" width="14" height="12" rx="1"/></S>,
  <S><circle cx="8" cy="6" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/><line x1="13" y1="4" x2="15" y2="4"/><line x1="14" y1="3" x2="14" y2="5"/></S>,
  <S><path d="M8 2L1 14h14z"/><line x1="8" y1="7" x2="8" y2="10"/><circle cx="8" cy="12.5" r="0.6" fill="currentColor" stroke="none"/></S>,
  <S><path d="M2 12 L5 7 L8 9 L11 4 L14 6"/><line x1="2" y1="14" x2="14" y2="14"/></S>,
  <S><path d="M2 4h12v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4z"/><path d="M2 4l6 5 6-5"/></S>,
  <S><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></S>,
];

const ASSOC_ICONS = [
  <S><rect x="1" y="2" width="14" height="10" rx="1"/><line x1="4" y1="15" x2="12" y2="15"/><line x1="8" y1="12" x2="8" y2="15"/></S>,
  <S><circle cx="8" cy="8" r="6"/><path d="M8 2c-2 1.5-3 3.5-3 6s1 4.5 3 6"/><path d="M8 2c2 1.5 3 3.5 3 6s-1 4.5-3 6"/><line x1="2" y1="8" x2="14" y2="8"/></S>,
  <S><rect x="1" y="3" width="14" height="11" rx="1"/><path d="M5 3V1M11 3V1"/><line x1="1" y1="7" x2="15" y2="7"/></S>,
  <S><path d="M11 2l3 3-8 8H3v-3z"/><line x1="9" y1="4" x2="12" y2="7"/></S>,
  <S><path d="M2 13 L5 8 L8 10 L11 5 L14 7"/><path d="M11 5 L14 5 L14 8"/><line x1="2" y1="15" x2="14" y2="15"/></S>,
  <S><circle cx="6" cy="5" r="2.5"/><circle cx="11" cy="10" r="2.5"/><path d="M8.5 5H13a1 1 0 0 1 1 1v1"/><path d="M7.5 10H3a1 1 0 0 1-1-1V8"/></S>,
];

export default function AboutAgSupport() {
  const { t } = useTranslation();

  const eventFeatures = EVENT_ICONS.map((icon, i) => ({
    icon,
    title: t(`ag_support.ef${i + 1}_title`),
    body:  t(`ag_support.ef${i + 1}_body`),
    link:  '/events/add',
  }));

  const assocFeatures = ASSOC_ICONS.map((icon, i) => ({
    icon,
    title: t(`ag_support.af${i + 1}_title`),
    body:  t(`ag_support.af${i + 1}_body`),
    link:  '/signup',
  }));

  const eventTypes = Array.from({ length: 12 }, (_, i) => t(`ag_support.et${i + 1}`));

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f7f2e8' }}>
      <PageMeta
        title="Agriculture Support | Oatmeal Farm Network"
        description="Turnkey event registration and custom association websites — built for farms, ranches, livestock shows, fiber festivals, breed associations, and every corner of the ag world."
        canonical="https://oatmealfarmnetwork.com/agriculture-support"
      />
      <Header />

      {/* Breadcrumbs */}
      <div className="mx-auto px-4 pt-4" style={{ maxWidth: '1300px' }}>
        <Breadcrumbs items={[
          { label: 'Home', to: '/' },
          { label: 'Agriculture Support' },
        ]} />
      </div>

      {/* Hero — photo + gradient overlay matching /for-farms */}
      <div className="mx-auto px-4 pt-2" style={{ maxWidth: '1300px' }}>
        <div className="relative w-full overflow-hidden rounded-xl">
          <img
            src="/images/CoreFeaturesAssociationSupport.webp"
            alt={t('ag_support.hero_title')}
            className="w-full object-cover"
            style={{ height: '250px', display: 'block' }}
            loading="eager"
            onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.78) 45%, rgba(255,255,255,0) 80%)' }}
          />
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
              {t('ag_support.hero_title')}
            </h1>
            <p style={{ color: '#111111', fontSize: '0.92rem', margin: '0 0 16px', lineHeight: 1.6 }}>
              {t('ag_support.hero_body')}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/events/add"
                className="font-bold px-5 py-2 rounded-lg shadow hover:shadow-md transition text-sm"
                style={{ backgroundColor: GOLD, color: '#fff' }}
              >
                {t('ag_support.hero_cta1')}
              </Link>
              <Link
                to="/signup"
                className="font-bold px-5 py-2 rounded-lg border-2 transition hover:bg-gray-50 text-sm"
                style={{ color: ACCENT, borderColor: ACCENT }}
              >
                {t('ag_support.hero_cta2')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto px-4 py-8" style={{ maxWidth: '1300px' }}>

        {/* ── Event Registration ──────────────────────────────────────── */}
        <section className="mb-10">
          <h2
            className="text-lg font-bold text-gray-900 mb-3"
            style={{ fontFamily: "'Lora','Times New Roman',serif" }}
          >
            {t('ag_support.events_h')}
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed max-w-3xl mb-5">
            {t('ag_support.events_body')}
          </p>

          {/* Event type pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {eventTypes.map(label => (
              <span
                key={label}
                className="text-xs font-semibold px-3 py-1 rounded-full border"
                style={{ background: GOLD_LIGHT, borderColor: GOLD, color: GOLD }}
              >
                {label}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {eventFeatures.map((f, i) => (
              <ToolCard key={i} icon={f.icon} title={f.title} body={f.body} link={f.link} accent={GOLD} />
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/events/add"
              className="px-5 py-2.5 rounded-lg text-white font-bold shadow hover:shadow-md transition text-sm"
              style={{ backgroundColor: GOLD }}
            >
              {t('ag_support.events_cta1')}
            </Link>
            <Link
              to="/events"
              className="px-5 py-2.5 rounded-lg font-bold border-2 transition hover:bg-yellow-50 text-sm"
              style={{ borderColor: GOLD, color: GOLD }}
            >
              {t('ag_support.events_cta2')}
            </Link>
            <Link
              to="/platform/events"
              className="px-5 py-2.5 rounded-lg font-bold border border-gray-300 text-gray-600 hover:bg-gray-50 transition text-sm"
            >
              {t('ag_support.events_cta3')}
            </Link>
          </div>
        </section>

        <hr className="my-8 border-gray-200" />

        {/* ── Association Support ─────────────────────────────────────── */}
        <section className="mb-10">
          <h2
            className="text-lg font-bold text-gray-900 mb-3"
            style={{ fontFamily: "'Lora','Times New Roman',serif" }}
          >
            {t('ag_support.assoc_h')}
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed max-w-3xl mb-6">
            {t('ag_support.assoc_body')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {assocFeatures.map((f, i) => (
              <ToolCard key={i} icon={f.icon} title={f.title} body={f.body} link={f.link} accent={ACCENT} />
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/website-builder"
              className="px-5 py-2.5 rounded-lg text-white font-bold shadow hover:shadow-md transition text-sm"
              style={{ backgroundColor: ACCENT }}
            >
              {t('ag_support.assoc_cta1')}
            </Link>
            <Link
              to="/signup"
              className="px-5 py-2.5 rounded-lg font-bold border-2 transition hover:bg-green-50 text-sm"
              style={{ borderColor: ACCENT, color: ACCENT }}
            >
              {t('ag_support.assoc_cta2')}
            </Link>
          </div>
        </section>

        <hr className="my-8 border-gray-200" />

        {/* ── Association Affiliate Program ───────────────────────────── */}
        <section className="mb-10">
          {/* Program header banner */}
          <div
            className="rounded-xl px-7 py-5 mb-6 flex flex-col sm:flex-row sm:items-center gap-3"
            style={{ backgroundColor: `${TEAL}12`, border: `1px solid ${TEAL}30` }}
          >
            <div className="shrink-0">
              <span
                className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full text-white"
                style={{ backgroundColor: TEAL }}
              >
                Affiliate Program
              </span>
            </div>
            <div>
              <h2
                className="text-lg font-bold text-gray-900"
                style={{ fontFamily: "'Lora','Times New Roman',serif" }}
              >
                Association Affiliate Program
              </h2>
              <p className="text-sm text-gray-600 mt-0.5">
                OFN is built to grow with the associations that power agriculture. Enroll your association and unlock four benefits that cost your members nothing extra.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {AFFILIATE_FEATURES.map((f, i) => (
              <ToolCard key={i} icon={f.icon} title={f.title} body={f.body} link={f.link} accent={TEAL} />
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="px-5 py-2.5 rounded-lg text-white font-bold text-sm shadow hover:shadow-md transition"
              style={{ backgroundColor: TEAL }}
            >
              Enroll Your Association
            </Link>
            <Link
              to="/contact-us"
              className="px-5 py-2.5 rounded-lg font-bold border-2 text-sm transition hover:bg-gray-50"
              style={{ borderColor: TEAL, color: TEAL }}
            >
              Contact Us to Learn More
            </Link>
          </div>
        </section>

        {/* Bottom CTA — matching /for-farms banner style */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4
                     bg-white border border-gray-200 rounded-xl px-8 py-6"
        >
          <div>
            <h3
              className="font-bold text-gray-900 text-base mb-1"
              style={{ fontFamily: "'Lora','Times New Roman',serif" }}
            >
              {t('ag_support.cta_title')}
            </h3>
            <p className="text-sm text-gray-600">{t('ag_support.cta_body')}</p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              to="/events/add"
              className="px-5 py-2.5 rounded-lg text-white font-bold text-sm shadow hover:shadow-md transition"
              style={{ backgroundColor: GOLD }}
            >
              {t('ag_support.cta1')}
            </Link>
            <Link
              to="/signup"
              className="px-5 py-2.5 rounded-lg font-bold border-2 text-sm transition hover:bg-green-50"
              style={{ color: ACCENT, borderColor: ACCENT }}
            >
              {t('ag_support.cta2')}
            </Link>
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}

// ── ToolCard — matches /for-farms horizontal card style ──────────────
function ToolCard({ icon, title, body, link, accent }) {
  return (
    <div className="flex bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md hover:border-[#819360] transition-all duration-200">
      <Link
        to={link}
        className="shrink-0 flex items-center justify-center"
        style={{ width: '155px', minHeight: '155px', backgroundColor: `${accent}18` }}
        aria-hidden="true"
        tabIndex={-1}
      >
        <span style={{ color: accent, opacity: 0.85, transform: 'scale(2.2)', display: 'flex' }}>
          {icon}
        </span>
      </Link>
      <div className="flex flex-col justify-between px-5 py-4 flex-1 min-w-0">
        <div>
          <Link
            to={link}
            className="font-bold text-sm hover:underline"
            style={{ color: accent }}
          >
            {title}
          </Link>
          <p className="text-xs text-gray-600 leading-relaxed mt-1">{body}</p>
        </div>
        <div className="mt-3">
          <Link to={link} className="text-xs font-bold hover:underline" style={{ color: accent }}>
            Learn more →
          </Link>
        </div>
      </div>
    </div>
  );
}
