// Ported from Oatmeal Farm Network (src/AboutSaige.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
// src/AboutSaige.jsx
// Marketing / about page for Saige — the AI agricultural assistant.
// Route: /platform/saige
import React from 'react';
import { Link } from 'react-router';
import { useTranslation } from '../../lib/i18n';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import Breadcrumbs from '../../components/Breadcrumbs';
import { useIsLoggedIn } from '../../lib/useIsLoggedIn';

const ACCENT = '#3D6B34';

export default function AboutSaige() {
  const { t } = useTranslation();
  const isLoggedIn = useIsLoggedIn();
  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f7f2e8' }}>
      <PageMeta
        title="Saige | AI Agricultural Assistant"
        description="Saige is the Livestock Of America AI agent for growers and ranchers — crops, livestock, soil, weather, markets, and more."
        keywords="farm AI assistant, agricultural AI, livestock AI, crop monitoring AI, precision agriculture software, farm management app, Saige AI, Livestock Of America"
        canonical="https://livestockofamerica.com/platform/saige"
        // Not indexed: Saige is not built here, so this page markets something a
        // visitor cannot get to.
        noIndex
        image="https://livestockofamerica.com/images/SaigeBanner.webp"
        imageAlt="Saige AI Agricultural Assistant — Livestock Of America"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            'name': 'Saige',
            'applicationCategory': 'BusinessApplication',
            'operatingSystem': 'Web',
            'url': 'https://livestockofamerica.com/platform/saige',
            'description': 'AI agricultural assistant for farmers and ranchers — crops, livestock, soil, weather, markets, and precision-ag field analysis.',
            'featureList': ['Crop monitoring', 'Livestock management', 'Weather analysis', 'Market prices', 'Precision agriculture', 'Field reports'],
            'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
            'provider': { '@type': 'Organization', 'name': 'Livestock Of America', 'url': 'https://livestockofamerica.com' },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            'itemListElement': [
              { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://livestockofamerica.com' },
              { '@type': 'ListItem', 'position': 2, 'name': 'Saige', 'item': 'https://livestockofamerica.com/platform/saige' },
            ],
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              { '@type': 'Question', name: t('saige.cap1_title'), acceptedAnswer: { '@type': 'Answer', text: t('saige.cap1_body') } },
              { '@type': 'Question', name: t('saige.cap2_title'), acceptedAnswer: { '@type': 'Answer', text: t('saige.cap2_body') } },
              { '@type': 'Question', name: t('saige.cap3_title'), acceptedAnswer: { '@type': 'Answer', text: t('saige.cap3_body') } },
              { '@type': 'Question', name: t('saige.cap4_title'), acceptedAnswer: { '@type': 'Answer', text: t('saige.cap4_body') } },
              { '@type': 'Question', name: t('saige.cap5_title'), acceptedAnswer: { '@type': 'Answer', text: t('saige.cap5_body') } },
              { '@type': 'Question', name: t('saige.cap6_title'), acceptedAnswer: { '@type': 'Answer', text: t('saige.cap6_body') } },
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
          { label: 'Saige' },
        ]} />
      </div>

      {/* Coming Soon banner */}
      <div style={{
        background: '#3D6B34', color: '#fff',
        textAlign: 'center', padding: '1.25rem 1rem',
        fontFamily: "'Lora','Times New Roman',serif",
      }}>
        <span style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '0.04em' }}>Coming Soon!</span>
        <p style={{ margin: '0.25rem 0 0', fontSize: '1rem', opacity: 0.9 }}>
          Saige is currently in development. Check back soon!
        </p>
      </div>

      {/* Hero — photo + gradient overlay */}
      <div className="mx-auto px-4 pt-2" style={{ maxWidth: '1300px' }}>
        <div className="relative w-full overflow-hidden rounded-xl">
          <img
            src="/images/SaigeBanner.webp"
            alt="Saige AI Agricultural Assistant"
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
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8C8 10 5.9 16.17 3.82 20.99"/><path d="M9.1 17.64C10.63 16.13 12.5 14.5 17 13"/><path d="M17 8c0 6-5 9-5 9"/></svg>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#ffffff' }}>{t('saige.hero_badge')}</span>
            </div>
            <h1 style={{ color: '#ffffff', fontFamily: "'Lora','Times New Roman',serif", fontSize: '2rem', fontWeight: 'bold', margin: '0 0 10px', lineHeight: 1.2 }}>
              {t('saige.hero_title')}
            </h1>
            <p style={{ color: '#ffffff', fontSize: '0.92rem', margin: '0 0 16px', lineHeight: 1.6 }}>
              {t('saige.hero_body')}
            </p>
            <div className="flex flex-wrap gap-3">
              {!isLoggedIn && (
                <Link to="/signup" className="border-2 font-bold px-5 py-2.5 rounded-lg transition text-sm hover:bg-white/10" style={{ borderColor: '#ffffff', color: '#ffffff' }}>
                  {t('saige.hero_cta2')}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 py-8" style={{ maxWidth: '1300px' }}>

        {/* What Saige Does */}
        <section className="mt-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-3"
              style={{ fontFamily: "'Lora','Times New Roman',serif" }}>
            {t('saige.what_title')}
          </h2>
          <p className="text-gray-700 leading-relaxed">
            {t('saige.what_body')}
          </p>
        </section>

        {/* Capabilities */}
        <section className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4"
              style={{ fontFamily: "'Lora','Times New Roman',serif" }}>
            {t('saige.cap_title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Capability icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0 0 6"/><rect x="9" y="8" width="6" height="8" rx="1"/><path d="M7 15v2a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2"/></svg>} title={t('saige.cap1_title')} body={t('saige.cap1_body')} />
            <Capability icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="14" rx="7" ry="5"/><path d="M5 14c0-1-1-3-1-5a3 3 0 0 1 6 0"/><path d="M19 14c0-1 1-3 1-5a3 3 0 0 0-6 0"/></svg>} title={t('saige.cap2_title')} body={t('saige.cap2_body')} />
            <Capability icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>} title={t('saige.cap3_title')} body={t('saige.cap3_body')} />
            <Capability icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>} title={t('saige.cap4_title')} body={t('saige.cap4_body')} />
            <Capability icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>} title={t('saige.cap5_title')} body={t('saige.cap5_body')} />
            <Capability icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>} title={t('saige.cap6_title')} body={t('saige.cap6_body')} />
          </div>
        </section>

        {/* Example conversations */}
        <section className="mt-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4"
              style={{ fontFamily: "'Lora','Times New Roman',serif" }}>
            {t('saige.ask_title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              '"Should I plant buckwheat or sudangrass as my summer cover?"',
              '"My ewe lambed twins this morning — log it and remind me to vaccinate at 2 weeks."',
              '"Draft a blog post about our fall apple harvest and schedule it."',
              '"Frost warning Thursday — what do I need to cover and which fields are at risk?"',
              '"How much grain should my 180 lb ram get through breeding season?"',
              '"Pull together a precision-ag summary for the North pasture."',
            ].map((q, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-800 italic">
                {q}
              </div>
            ))}
          </div>
        </section>

        {/* How Saige is different */}
        <section className="mt-10 bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3"
              style={{ fontFamily: "'Lora','Times New Roman',serif" }}>
            {t('saige.diff_title')}
          </h2>
          <ul className="text-sm text-gray-700 space-y-2">
            <li>• <b>{t('saige.diff1_label')}</b> {t('saige.diff1_body')}</li>
            <li>• <b>{t('saige.diff2_label')}</b> {t('saige.diff2_body')}</li>
            <li>• <b>{t('saige.diff3_label')}</b> {t('saige.diff3_body')}</li>
            <li>• <b>{t('saige.diff4_label')}</b> {t('saige.diff4_body')}</li>
            <li>• <b>{t('saige.diff5_label')}</b> {t('saige.diff5_body')}</li>
          </ul>
        </section>

        {/* CTA */}
        <section className="mt-10 text-center bg-white border border-gray-200 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2"
              style={{ fontFamily: "'Lora','Times New Roman',serif" }}>
            {t('saige.cta_title')}
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/account"
              className="px-6 py-3 rounded-lg border-2 font-bold transition"
              style={{ borderColor: ACCENT, color: ACCENT }}>
              {t('saige.cta2')}
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}

function Capability({ icon, title, body }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="flex items-center">{icon}</span>
        <h3 className="font-bold text-gray-900">{title}</h3>
      </div>
      <p className="text-sm text-gray-600">{body}</p>
    </div>
  );
}
