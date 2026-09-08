// Ported from Oatmeal Farm Network (src/AboutWebsiteBuilder.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
﻿// src/AboutWebsiteBuilder.jsx
// Route: /platform/website-builder
import React from 'react';
import { Link } from 'react-router';
import { useTranslation } from '../../lib/i18n';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import Breadcrumbs from '../../components/Breadcrumbs';
import { useIsLoggedIn } from '../../lib/useIsLoggedIn';

const ACCENT = '#3D6B34';

const SI = ({ children }) => (
  <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor"
    strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
const FEAT_ICONS = {
  widgets: <SI><rect x="1" y="1" width="6" height="6" rx="0.5"/><rect x="9" y="1" width="6" height="6" rx="0.5"/><rect x="1" y="9" width="6" height="6" rx="0.5"/><rect x="9" y="9" width="6" height="6" rx="0.5"/></SI>,
  source:  <SI><circle cx="8" cy="8" r="2"/><path d="M3 8H1M15 8h-2M8 3V1M8 15v-2"/><circle cx="3.5" cy="3.5" r="1"/><circle cx="12.5" cy="3.5" r="1"/><circle cx="3.5" cy="12.5" r="1"/><circle cx="12.5" cy="12.5" r="1"/></SI>,
  domain:  <SI><circle cx="8" cy="8" r="6"/><path d="M8 2c-2 1.5-3 3.5-3 6s1 4.5 3 6"/><path d="M8 2c2 1.5 3 3.5 3 6s-1 4.5-3 6"/><line x1="2" y1="8" x2="14" y2="8"/></SI>,
  mobile:  <SI><rect x="4" y="1" width="8" height="14" rx="1.5"/><circle cx="8" cy="12.5" r="0.8" fill="currentColor" stroke="none"/></SI>,
  blog:    <SI><path d="M11 2l3 3-8 8H3v-3z"/><line x1="9" y1="4" x2="12" y2="7"/></SI>,
  hero:    <SI><rect x="1" y="2" width="14" height="10" rx="1"/><path d="M5 14h6"/></SI>,
};

export default function AboutWebsiteBuilder() {
  const { t } = useTranslation();
  const isLoggedIn = useIsLoggedIn();
  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f7f2e8' }}>
      <PageMeta
        title="Website Builder | Oatmeal Farm Network"
        description="Launch a professional farm website in an afternoon with farm-aware drag-and-drop widgets, custom domains, and built-in AI help from Lavendir."
        canonical="https://oatmealfarmnetwork.com/platform/website-builder"
      />
      <Header />

      {/* Breadcrumbs */}
      <div className="mx-auto px-4 pt-4" style={{ maxWidth: '1300px' }}>
        <Breadcrumbs items={[
          { label: 'Home', to: '/' },
          { label: 'Our Services', to: '/platform' },
          { label: 'Website Builder' },
        ]} />
      </div>

      {/* Hero — photo + gradient overlay */}
      <div className="mx-auto px-4 pt-2" style={{ maxWidth: '1300px' }}>
        <div className="relative w-full overflow-hidden rounded-xl">
          <img
            src="/OFN Public/image/WebsiteBuilderHeading.webp"
            alt="Farm Website Builder"
            className="w-full object-cover"
            style={{ height: '260px', display: 'block' }}
            loading="eager"
            fetchPriority="high"
            width="1300"
            height="260"
            onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to right, rgba(18,72,38,0.92) 0%, rgba(18,72,38,0.75) 45%, rgba(18,72,38,0) 78%)' }}
          />
          <div className="absolute inset-0 flex flex-col justify-center px-8 py-6" style={{ maxWidth: '720px' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.22)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#ffffff' }}>{t('web_build.hero_badge', 'Website Builder')}</span>
            </div>
            <h1 style={{ color: '#ffffff', fontFamily: "'Lora','Times New Roman',serif", fontSize: '2rem', fontWeight: 'bold', margin: '0 0 10px', lineHeight: 1.2 }}>
              {t('web_build.hero_title')}
            </h1>
            <p style={{ color: '#ffffff', fontSize: '0.92rem', margin: '0 0 16px', lineHeight: 1.6 }}>
              {t('web_build.hero_body')}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/website/builder"
                className="bg-white font-bold px-5 py-2.5 rounded-lg shadow hover:shadow-md transition text-sm"
                style={{ color: ACCENT }}
              >
                {t('web_build.hero_cta1')}
              </Link>
              {!isLoggedIn && (
                <Link
                  to="/signup"
                  className="border-2 font-bold px-5 py-2.5 rounded-lg transition text-sm hover:bg-white/10"
                  style={{ borderColor: '#ffffff', color: '#ffffff' }}
                >
                  {t('web_build.hero_cta2')}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 py-8" style={{ maxWidth: '1300px' }}>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3"
              style={{ fontFamily: "'Lora','Times New Roman',serif" }}>
            {t('web_build.what_title')}
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed max-w-3xl">
            {t('web_build.what_body')}
          </p>
        </section>

        <h2 className="text-lg font-bold text-gray-900 mb-5"
            style={{ fontFamily: "'Lora','Times New Roman',serif" }}>
          {t('web_build.included_title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          <Feature icon={FEAT_ICONS.widgets} title={t('web_build.feat1_title')} body={t('web_build.feat1_body')} />
          <Feature icon={FEAT_ICONS.source}  title={t('web_build.feat2_title')} body={t('web_build.feat2_body')} />
          <Feature icon={FEAT_ICONS.domain}  title={t('web_build.feat3_title')} body={t('web_build.feat3_body')} />
          <Feature icon={<img src="/images/LavendirAIIcon.webp" alt="Lavendir" className="w-5 h-5" />} title={t('web_build.feat4_title')} body={t('web_build.feat4_body')} />
          <Feature icon={FEAT_ICONS.mobile}  title={t('web_build.feat5_title')} body={t('web_build.feat5_body')} />
          <Feature icon={FEAT_ICONS.blog}    title={t('web_build.feat6_title')} body={t('web_build.feat6_body')} />
        </div>

        {/* Bottom CTA — left/right banner matching /precision-ag */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-gray-200 rounded-xl px-8 py-6">
          <div>
            <h3
              className="font-bold text-gray-900 text-base mb-1"
              style={{ fontFamily: "'Lora','Times New Roman',serif" }}
            >
              {t('web_build.cta_title')}
            </h3>
            <p className="text-sm text-gray-600">{t('web_build.cta_body')}</p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              to="/website/builder"
              className="px-5 py-2.5 rounded-lg text-white font-bold text-sm shadow hover:shadow-md transition"
              style={{ backgroundColor: ACCENT }}
            >
              {t('web_build.cta')}
            </Link>
            {!isLoggedIn && (
              <Link
                to="/signup"
                className="px-5 py-2.5 rounded-lg font-bold border-2 text-sm transition hover:bg-gray-50"
                style={{ color: ACCENT, borderColor: ACCENT }}
              >
                {t('web_build.hero_cta2')}
              </Link>
            )}
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}

function Feature({ icon, title, body }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="flex items-center" style={{ color: ACCENT }}>{icon}</span>
        <h3 className="font-bold text-gray-900">{title}</h3>
      </div>
      <p className="text-sm text-gray-600">{body}</p>
    </div>
  );
}
