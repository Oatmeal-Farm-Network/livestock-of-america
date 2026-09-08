// Ported from Oatmeal Farm Network (src/AboutEvents.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
// src/AboutEvents.jsx
// Route: /platform/events
import React from 'react';
import { Link } from 'react-router';
import { useTranslation } from '../../lib/i18n';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import Breadcrumbs from '../../components/Breadcrumbs';

const ACCENT = '#EFAE15';
const ACCENT_DARK = '#B87F0B';

export default function AboutEvents() {
  const { t } = useTranslation();

  const S = (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}/>;
  const eventTypes = [
    { icon: <S><ellipse cx="12" cy="14" rx="7" ry="5"/><path d="M5 14c0-1-1-3-1-5a3 3 0 0 1 6 0"/><path d="M19 14c0-1 1-3 1-5a3 3 0 0 0-6 0"/></S>, label: t('events_about.et_livestock') },
    { icon: <S><path d="M4 4l16 16"/><circle cx="8" cy="8" r="3"/><circle cx="16" cy="16" r="3"/></S>, label: t('events_about.et_fiber') },
    { icon: <S><path d="M12 2a3 3 0 0 0 0 6"/><rect x="9" y="8" width="6" height="8" rx="1"/><path d="M7 15v2a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2"/></S>, label: t('events_about.et_conferences') },
    { icon: <S><path d="M8 21l2-5 2 5 2-5 2 5"/><path d="M4 7h16"/><path d="M6 7V4h12v3"/></S>, label: t('events_about.et_competitions') },
    { icon: <S><path d="M15 12l-8.5 8.5a2.12 2.12 0 0 1-3-3L12 9"/><path d="M17.64 15L22 10.36"/></S>, label: t('events_about.et_auctions') },
    { icon: <S><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></S>, label: t('events_about.et_farm_tours') },
    { icon: <S><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></S>, label: t('events_about.et_vendor') },
    { icon: <S><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></S>, label: t('events_about.et_dinners') },
    { icon: <S><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></S>, label: t('events_about.et_workshops') },
    { icon: <S><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></S>, label: t('events_about.et_festivals') },
    { icon: <S><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></S>, label: t('events_about.et_rsvp') },
    { icon: <S><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></S>, label: t('events_about.et_certs') },
  ];

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f7f2e8' }}>
      <PageMeta
        title="Events | Oatmeal Farm Network"
        description="Turnkey event management for the ag world — fiber festivals, livestock shows, auctions, conferences, workshops, farm tours, and vendor fairs. All in one place."
        canonical="https://oatmealfarmnetwork.com/platform/events"
      />
      <Header />

      {/* Breadcrumbs */}
      <div className="mx-auto px-4 pt-4" style={{ maxWidth: '1300px' }}>
        <Breadcrumbs items={[
          { label: 'Home', to: '/' },
          { label: 'Our Services', to: '/platform' },
          { label: 'Events' },
        ]} />
      </div>

      {/* Hero — photo + gradient overlay */}
      <div className="mx-auto px-4 pt-2" style={{ maxWidth: '1300px' }}>
        <div className="relative w-full overflow-hidden rounded-xl">
          <img
            src="/images/EventBanner.webp"
            alt="Farm Events"
            className="w-full object-cover"
            style={{ height: '260px', display: 'block' }}
            loading="eager"
            onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to right, rgba(90,55,0,0.92) 0%, rgba(90,55,0,0.75) 45%, rgba(90,55,0,0) 78%)' }}
          />
          <div className="absolute inset-0 flex flex-col justify-center px-8 py-6" style={{ maxWidth: '720px' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.22)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#ffffff' }}>{t('events_about.hero_badge')}</span>
            </div>
            <h1 style={{ color: '#ffffff', fontFamily: "'Lora','Times New Roman',serif", fontSize: '2rem', fontWeight: 'bold', margin: '0 0 10px', lineHeight: 1.2 }}>
              {t('events_about.hero_title')}
            </h1>
            <p style={{ color: '#ffffff', fontSize: '0.92rem', margin: '0 0 16px', lineHeight: 1.6 }}>
              {t('events_about.hero_body')}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/events" className="bg-white font-bold px-5 py-2.5 rounded-lg shadow hover:shadow-md transition text-sm" style={{ color: ACCENT_DARK }}>
                {t('events_about.hero_cta1')}
              </Link>
              <Link to="/events/add" className="border-2 font-bold px-5 py-2.5 rounded-lg transition text-sm hover:bg-white/10" style={{ borderColor: '#ffffff', color: '#ffffff' }}>
                {t('events_about.hero_cta2')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 py-8" style={{ maxWidth: '1300px' }}>

        <section className="mt-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-3"
              style={{ fontFamily: "'Lora','Times New Roman',serif" }}>
            {t('events_about.shape_title')}
          </h2>
          <p className="text-gray-700 leading-relaxed">
            {t('events_about.shape_body')}
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4"
              style={{ fontFamily: "'Lora','Times New Roman',serif" }}>
            {t('events_about.types_title')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {eventTypes.map(x => (
              <div key={x.label} className="bg-white border border-gray-200 rounded-xl p-3 text-center">
                <div className="mb-1 flex justify-center text-gray-600">{x.icon}</div>
                <div className="text-xs font-semibold text-gray-700">{x.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4"
              style={{ fontFamily: "'Lora','Times New Roman',serif" }}>
            {t('events_about.included_title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Feature icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT_DARK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9.5V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5.5"/><path d="M22 14.5V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-5.5"/><path d="M12 12a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/><path d="M2 9.5h20"/><path d="M2 14.5h20"/></svg>} title={t('events_about.feat1_title')} body={t('events_about.feat1_body')} />
            <Feature icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT_DARK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>} title={t('events_about.feat2_title')} body={t('events_about.feat2_body')} />
            <Feature icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT_DARK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="18" y="3" width="4" height="18"/><rect x="10" y="8" width="4" height="13"/><rect x="2" y="13" width="4" height="8"/></svg>} title={t('events_about.feat3_title')} body={t('events_about.feat3_body')} />
            <Feature icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT_DARK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} title={t('events_about.feat4_title')} body={t('events_about.feat4_body')} />
            <Feature icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT_DARK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0 0 6"/><rect x="9" y="8" width="6" height="8" rx="1"/><path d="M7 15v2a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2"/></svg>} title={t('events_about.feat5_title')} body={t('events_about.feat5_body')} />
            <Feature icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT_DARK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></svg>} title={t('events_about.feat6_title')} body={t('events_about.feat6_body')} />
          </div>
        </section>

        <section className="mt-10 text-center bg-white border border-gray-200 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2"
              style={{ fontFamily: "'Lora','Times New Roman',serif" }}>
            {t('events_about.cta_title')}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {t('events_about.cta_body')}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/events/add"
              className="px-6 py-3 rounded-lg text-white font-bold shadow hover:shadow-md transition"
              style={{ backgroundColor: ACCENT_DARK }}>
              {t('events_about.cta1')}
            </Link>
            <Link to="/events"
              className="px-6 py-3 rounded-lg border-2 font-bold transition"
              style={{ borderColor: ACCENT_DARK, color: ACCENT_DARK }}>
              {t('events_about.cta2')}
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}

function Feature({ icon, title, body }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{icon}</span>
        <h3 className="font-bold text-gray-900">{title}</h3>
      </div>
      <p className="text-sm text-gray-600">{body}</p>
    </div>
  );
}
