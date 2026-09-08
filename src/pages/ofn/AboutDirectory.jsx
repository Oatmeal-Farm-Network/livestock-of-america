// Ported from Oatmeal Farm Network (src/AboutDirectory.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
// src/AboutDirectory.jsx
// Route: /platform/directory
import React from 'react';
import { Link } from 'react-router';
import { useTranslation } from '../../lib/i18n';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import Breadcrumbs from '../../components/Breadcrumbs';

const ACCENT = '#3D6B34';

export default function AboutDirectory() {
  const { t } = useTranslation();

  const S = (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}/>;
  const filters = [
    { icon: <S><path d="M2 22V12l10-10 10 10v10"/><path d="M7 22V12l5-5 5 5v10"/><rect x="9" y="17" width="6" height="5"/></S>,            label: t('dir_about.filter1') },
    { icon: <S><ellipse cx="12" cy="14" rx="7" ry="5"/><path d="M5 14c0-1-1-3-1-5a3 3 0 0 1 6 0"/><path d="M19 14c0-1 1-3 1-5a3 3 0 0 0-6 0"/></S>, label: t('dir_about.filter2') },
    { icon: <S><path d="M2 15s4-4 10-4 10 4 10 4"/><path d="M4 11V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M12 11v4"/></S>,          label: t('dir_about.filter3') },
    { icon: <S><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></S>,                             label: t('dir_about.filter4') },
    { icon: <S><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></S>, label: t('dir_about.filter5') },
    { icon: <S><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></S>,                                      label: t('dir_about.filter6') },
    { icon: <S><path d="M7 20s4-6 4-10a4 4 0 0 0-8 0c0 4 4 10 4 10z"/><path d="M7 20h10"/><path d="M13 12s2-3 5-3"/></S>,                  label: t('dir_about.filter7') },
    { icon: <S><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></S>, label: t('dir_about.filter8') },
  ];

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f7f2e8' }}>
      <PageMeta
        title="Directory | Livestock Of America"
        description="A searchable directory of farms, ranches, mills, bakers, chefs, and agricultural businesses on Livestock Of America. Filter by product, livestock breed, certification, and region."
        canonical="https://livestockofamerica.com/platform/directory"
      />
      <Header />

      {/* Breadcrumbs */}
      <div className="mx-auto px-4 pt-4" style={{ maxWidth: '1300px' }}>
        <Breadcrumbs items={[
          { label: 'Home', to: '/' },
          { label: 'Our Services', to: '/platform' },
          { label: 'Directory' },
        ]} />
      </div>

      {/* Hero — photo + gradient overlay */}
      <div className="mx-auto px-4 pt-2" style={{ maxWidth: '1300px' }}>
        <div className="relative w-full overflow-hidden rounded-xl">
          <img
            src="/images/DirectoryBanner.webp"
            alt="Farm Network Directory"
            className="w-full object-cover"
            style={{ height: '260px', display: 'block' }}
            loading="eager"
            onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to right, rgba(18,72,38,0.92) 0%, rgba(18,72,38,0.75) 45%, rgba(18,72,38,0) 78%)' }}
          />
          <div className="absolute inset-0 flex flex-col justify-center px-8 py-6" style={{ maxWidth: '720px' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.22)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#ffffff' }}>{t('dir_about.hero_badge')}</span>
            </div>
            <h1 style={{ color: '#ffffff', fontFamily: "'Lora','Times New Roman',serif", fontSize: '2rem', fontWeight: 'bold', margin: '0 0 10px', lineHeight: 1.2 }}>
              {t('dir_about.hero_title')}
            </h1>
            <p style={{ color: '#ffffff', fontSize: '0.92rem', margin: '0 0 16px', lineHeight: 1.6 }}>
              {t('dir_about.hero_body')}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/directory" className="bg-white font-bold px-5 py-2.5 rounded-lg shadow hover:shadow-md transition text-sm" style={{ color: ACCENT }}>
                {t('dir_about.hero_cta1')}
              </Link>
              <Link to="/account" className="border-2 font-bold px-5 py-2.5 rounded-lg transition text-sm hover:bg-white/10" style={{ borderColor: '#ffffff', color: '#ffffff' }}>
                {t('dir_about.hero_cta2')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 py-8" style={{ maxWidth: '1300px' }}>

        <section className="mt-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-3"
              style={{ fontFamily: "'Lora','Times New Roman',serif" }}>
            {t('dir_about.biz_card_title')}
          </h2>
          <p className="text-gray-700 leading-relaxed">
            {t('dir_about.biz_card_body')}
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4"
              style={{ fontFamily: "'Lora','Times New Roman',serif" }}>
            {t('dir_about.search_title')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {filters.map(x => (
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
            {t('dir_about.included_title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Feature icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4"/></svg>} title={t('dir_about.feat1_title')} body={t('dir_about.feat1_body')} />
            <Feature icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>} title={t('dir_about.feat2_title')} body={t('dir_about.feat2_body')} />
            <Feature icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>} title={t('dir_about.feat3_title')} body={t('dir_about.feat3_body')} />
            <Feature icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>} title={t('dir_about.feat4_title')} body={t('dir_about.feat4_body')} />
          </div>
        </section>

        <section className="mt-10 text-center bg-white border border-gray-200 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2"
              style={{ fontFamily: "'Lora','Times New Roman',serif" }}>
            {t('dir_about.cta_title')}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {t('dir_about.cta_body')}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/directory"
              className="px-6 py-3 rounded-lg text-white font-bold shadow hover:shadow-md transition"
              style={{ backgroundColor: ACCENT }}>
              {t('dir_about.cta1')}
            </Link>
            <Link to="/account"
              className="px-6 py-3 rounded-lg border-2 font-bold transition"
              style={{ borderColor: ACCENT, color: ACCENT }}>
              {t('dir_about.cta2')}
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
