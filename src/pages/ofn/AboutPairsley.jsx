// Ported from Oatmeal Farm Network (src/AboutPairsley.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
// src/AboutPairsley.jsx
// Route: /platform/pairsley
import React from 'react';
import { Link } from 'react-router';
import { useTranslation } from '../../lib/i18n';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import Breadcrumbs from '../../components/Breadcrumbs';
import { useIsLoggedIn } from '../../lib/useIsLoggedIn';

const ACCENT = '#2f7d4a';

export default function AboutPairsley() {
  const { t } = useTranslation();
  const isLoggedIn = useIsLoggedIn();

  const S = (p) => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p} />
  );

  const capabilities = [
    {
      icon: <S><path d="M17 8C8 10 5.9 16.17 3.82 20.99"/><path d="M9.1 17.64C10.63 16.13 12.5 14.5 17 13"/><path d="M17 8c0 6-5 9-5 9"/></S>,
      title: t('pairsley.cap1_title'),
      body:  t('pairsley.cap1_body'),
      to:    '/restaurant/farms',
    },
    {
      icon: <S><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></S>,
      title: t('pairsley.cap2_title'),
      body:  t('pairsley.cap2_body'),
      to:    '/chef',
    },
    {
      icon: <S><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></S>,
      title: t('pairsley.cap3_title'),
      body:  t('pairsley.cap3_body'),
      to:    '/marketplaces/farm-to-table',
    },
    {
      icon: <S><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></S>,
      title: t('pairsley.cap4_title'),
      body:  t('pairsley.cap4_body'),
      to:    '/restaurant/farms',
    },
    {
      icon: <S><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></S>,
      title: t('pairsley.cap5_title'),
      body:  t('pairsley.cap5_body'),
      to:    '/marketplaces/farm-to-table',
    },
    {
      icon: <S><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M2 12h2M20 12h2"/></S>,
      title: t('pairsley.cap6_title'),
      body:  t('pairsley.cap6_body'),
      to:    '/chef',
    },
  ];

  const TS = (p) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p} />
  );

  const tiles = [
    {
      to:    '/marketplaces/farm-to-table',
      icon:  <TS><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></TS>,
      title: t('pairsley.tile1_title'),
      body:  t('pairsley.tile1_body'),
    },
    {
      to:    '/restaurant/farms',
      icon:  <TS><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></TS>,
      title: t('pairsley.tile2_title'),
      body:  t('pairsley.tile2_body'),
    },
    {
      to:    '/restaurant/standing-orders',
      icon:  <TS><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></TS>,
      title: t('pairsley.tile3_title'),
      body:  t('pairsley.tile3_body'),
    },
    {
      to:    '/restaurant/digest',
      icon:  <TS><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></TS>,
      title: t('pairsley.tile4_title'),
      body:  t('pairsley.tile4_body'),
    },
    {
      to:    '/chef/dashboard',
      icon:  <TS><path d="M20 7a4 4 0 0 0-4-4 4 4 0 0 0-4 4 4 4 0 0 0-4-4 4 4 0 0 0-4 4 4 4 0 0 0 4 4h8a4 4 0 0 0 4-4z"/><path d="M8 11v9h8v-9"/></TS>,
      title: t('pairsley.tile5_title'),
      body:  t('pairsley.tile5_body'),
    },
  ];

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f7f2e8' }}>
      <PageMeta
        title="Pairsley | AI Agent for Restaurants & Professional Kitchens"
        description="Pairsley is the Livestock Of America AI agent for restaurateurs, chefs, and professional kitchens — sourcing, seasonal menus, costing, and vendor relationships."
        keywords="restaurant AI assistant, chef AI tool, farm to table sourcing, menu costing software, local food sourcing app, Pairsley AI, Livestock Of America, restaurant technology"
        canonical="https://livestockofamerica.com/platform/pairsley"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            'name': 'Pairsley',
            'applicationCategory': 'BusinessApplication',
            'operatingSystem': 'Web',
            'url': 'https://livestockofamerica.com/platform/pairsley',
            'description': 'AI consultant for chefs and restaurant operators — local sourcing, menu costing, specials writing, and farm connections.',
            'featureList': ['Local farm sourcing', 'Menu costing', 'Specials writing', 'Vendor management', 'Seasonal produce lookup'],
            'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
            'provider': { '@type': 'Organization', 'name': 'Livestock Of America', 'url': 'https://livestockofamerica.com' },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            'itemListElement': [
              { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://livestockofamerica.com' },
              { '@type': 'ListItem', 'position': 2, 'name': 'Pairsley', 'item': 'https://livestockofamerica.com/platform/pairsley' },
            ],
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              { '@type': 'Question', name: t('pairsley.cap1_title'), acceptedAnswer: { '@type': 'Answer', text: t('pairsley.cap1_body') } },
              { '@type': 'Question', name: t('pairsley.cap2_title'), acceptedAnswer: { '@type': 'Answer', text: t('pairsley.cap2_body') } },
              { '@type': 'Question', name: t('pairsley.cap3_title'), acceptedAnswer: { '@type': 'Answer', text: t('pairsley.cap3_body') } },
              { '@type': 'Question', name: t('pairsley.cap4_title'), acceptedAnswer: { '@type': 'Answer', text: t('pairsley.cap4_body') } },
              { '@type': 'Question', name: t('pairsley.cap5_title'), acceptedAnswer: { '@type': 'Answer', text: t('pairsley.cap5_body') } },
              { '@type': 'Question', name: t('pairsley.cap6_title'), acceptedAnswer: { '@type': 'Answer', text: t('pairsley.cap6_body') } },
            ],
          },
        ]}
      />
      <Header />

      {/* Breadcrumbs */}
      <div className="mx-auto px-4 pt-4" style={{ maxWidth: '1300px' }}>
        <Breadcrumbs items={[
          { label: 'Home', to: '/' },
          { label: 'Our Services', to: '/platform' },
          { label: 'Pairsley' },
        ]} />
      </div>

      {/* Coming Soon banner */}
      <div style={{
        background: '#2f7d4a', color: '#fff',
        textAlign: 'center', padding: '1.25rem 1rem',
        fontFamily: "'Lora','Times New Roman',serif",
      }}>
        <span style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '0.04em' }}>Coming Soon!</span>
        <p style={{ margin: '0.25rem 0 0', fontSize: '1rem', opacity: 0.9 }}>
          Pairsley is currently in development. Check back soon!
        </p>
      </div>

      {/* Hero — image card with gradient overlay, matching /directory */}
      <div className="mx-auto px-4 pt-2" style={{ maxWidth: '1300px' }}>
        <div className="relative w-full overflow-hidden rounded-xl">
          <img
            src="/images/PairsleyBanner.webp"
            alt="Pairsley AI for Restaurants &amp; Professional Kitchens"
            className="w-full object-cover"
            style={{ height: '260px', display: 'block' }}
            loading="eager"
            fetchPriority="high"
            width="1300"
            height="260"
          />
          {/* Left-to-right gradient — green tint matches Pairsley accent */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to right, rgba(18,72,38,0.92) 0%, rgba(18,72,38,0.75) 45%, rgba(18,72,38,0) 78%)',
            }}
          />
          <div
            className="absolute inset-0 flex flex-col justify-center px-8 py-6"
            style={{ maxWidth: '720px' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: 'rgba(255,255,255,0.22)' }}
              >
                <img src="/images/PairsleyAIIcon.webp" alt="Pairsley" width="28" height="28" style={{ display: 'block', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.88)' }}>
                {t('pairsley.hero_badge')}
              </span>
            </div>
            <h1
              style={{
                color: '#ffffff',
                fontFamily: "'Lora','Times New Roman',serif",
                fontSize: '2rem',
                fontWeight: 'bold',
                margin: '0 0 10px',
                lineHeight: 1.2,
              }}
            >
              {t('pairsley.hero_title')}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.94)', fontSize: '0.92rem', margin: '0 0 4px', lineHeight: 1.6 }}>
              {t('pairsley.hero_body')}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: '0.84rem', margin: '0 0 16px', lineHeight: 1.5, fontStyle: 'italic' }}>
              {t('pairsley.hero_tagline')}
            </p>
          </div>
        </div>
      </div>

      {/* Page body */}
      <div className="mx-auto px-4 py-8" style={{ maxWidth: '1300px' }}>

        {/* What Pairsley does */}
        <p className="text-gray-700 leading-relaxed mb-8">{t('pairsley.what_body')}</p>

        {/* Capabilities — horizontal cards matching /directory card style */}
        <h2 className="text-lg font-bold text-gray-900 mb-5">{t('pairsley.cap_title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          {capabilities.map(cap => (
            <div
              key={cap.title}
              className="flex bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md hover:border-[#819360] transition-all duration-200"
            >
              {/* Left: icon box */}
              <div
                className="shrink-0 flex items-center justify-center"
                style={{ width: '110px', minHeight: '110px', backgroundColor: '#f0f6ec', color: ACCENT }}
              >
                {cap.icon}
              </div>
              {/* Right: text */}
              <div className="flex flex-col justify-between px-5 py-4 flex-1 min-w-0">
                <div>
                  <p className="font-bold text-sm mb-1" style={{ color: ACCENT }}>{cap.title}</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{cap.body}</p>
                </div>
                <div className="mt-3">
                  <Link
                    to={cap.to}
                    className="text-xs font-bold hover:underline"
                    style={{ color: ACCENT }}
                  >
                    TRY IT →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Example questions — horizontal cards with accent left bar */}
        <h2 className="text-lg font-bold text-gray-900 mb-5">{t('pairsley.ask_title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div
              key={i}
              className="flex bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200"
            >
              <div className="shrink-0" style={{ width: '6px', backgroundColor: ACCENT }} />
              <div className="px-5 py-4">
                <p className="text-sm text-gray-800 italic">{t(`pairsley.q${i}`)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Connected features — horizontal cards */}
        <h2 className="text-lg font-bold text-gray-900 mb-2">{t('pairsley.connected_title')}</h2>
        <p className="text-sm text-gray-700 leading-relaxed mb-5 max-w-3xl">{t('pairsley.connected_body')}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {tiles.map(tile => (
            <div
              key={tile.title}
              className="flex bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md hover:border-[#819360] transition-all duration-200"
            >
              <div
                className="shrink-0 flex items-center justify-center"
                style={{ width: '88px', minHeight: '88px', backgroundColor: '#f0f6ec', color: ACCENT }}
              >
                {tile.icon}
              </div>
              <div className="flex flex-col justify-between px-5 py-4 flex-1 min-w-0">
                <div>
                  <p className="font-bold text-sm mb-1" style={{ color: ACCENT }}>{tile.title}</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{tile.body}</p>
                </div>
                <div className="mt-3">
                  <Link
                    to={tile.to}
                    className="text-xs font-bold hover:underline"
                    style={{ color: ACCENT }}
                  >
                    EXPLORE →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <section className="mt-10 text-center bg-white border border-gray-200 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2"
              style={{ fontFamily: "'Lora','Times New Roman',serif" }}>
            Pairsley Is Ready When You Are
          </h3>
          <p className="text-sm text-gray-600 mb-5 max-w-xl mx-auto">
            No setup required. Open your chef dashboard or any restaurant page and tap the green bubble in the corner to start a conversation.
          </p>
          {!isLoggedIn && (
            <Link to="/signup"
              className="inline-block px-6 py-3 rounded-lg font-bold shadow hover:shadow-md transition"
              style={{ backgroundColor: ACCENT, color: '#ffffff' }}>
              Create an Account
            </Link>
          )}
        </section>

      </div>

      <Footer />
    </div>
  );
}
