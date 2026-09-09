// Ported from Oatmeal Farm Network (src/AboutGrants.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
// src/AboutGrants.jsx
// Route: /platform/grants
import React from 'react';
import { Link } from 'react-router';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import Breadcrumbs from '../../components/Breadcrumbs';
import { useIsLoggedIn } from '../../lib/useIsLoggedIn';

const ACCENT = '#2A5C45';

export default function AboutGrants() {
  const isLoggedIn = useIsLoggedIn();
  const S = (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}/>;

  const capabilities = [
    { icon: <S><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M12 6v6l4 2"/></S>, title: 'Grant & Program Database', body: 'Browse USDA, NRCS, FSA, state, and private foundation programs — filtered by farm type, region, and eligibility criteria.' },
    { icon: <S><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></S>, title: 'Deadline Tracking', body: 'Save programs you\'re interested in and track application deadlines so you never miss an open window.' },
    { icon: <S><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></S>, title: 'Application Notes', body: 'Keep private notes on each grant — eligibility status, required documents, and application progress — without losing track.' },
    { icon: <S><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></S>, title: 'Beginning Farmer Resources', body: 'Dedicated section for beginning and socially disadvantaged farmer programs — FSA loans, BFRDP grants, and more.' },
    { icon: <S><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/></S>, title: 'Conservation Programs', body: 'Find EQIP, CSP, CRP, and other conservation cost-share programs relevant to your operation and land type.' },
    { icon: <S><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></S>, title: 'Saige Integration', body: 'Ask Saige about grant eligibility, required documents, and application tips — AI-assisted research right in your account.' },
  ];

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f7f2e8' }}>
      <PageMeta
        title="Grants & Programs | Livestock Of America"
        description="Discover USDA, NRCS, state, and private agricultural grants and programs on OFN — with deadline tracking, eligibility filters, and Saige AI assistance."
        canonical="https://livestockofamerica.com/platform/grants"
        // Not indexed: grants_programs is hidden, so this page markets something a
        // visitor cannot get to.
        noIndex
      />
      <Header />

      <div className="mx-auto px-4 pt-4" style={{ maxWidth: '1300px' }}>
        <Breadcrumbs items={[
          { label: 'Home', to: '/' },
          { label: 'Our Services', to: '/platform' },
          { label: 'Grants & Programs' },
        ]} />
      </div>

      <div className="mx-auto px-4 pt-2" style={{ maxWidth: '1300px' }}>
        <div className="relative w-full overflow-hidden rounded-xl">
          <img src="/images/GrantsBanner.webp" alt="Agricultural Grants & Programs" className="w-full object-cover" style={{ height: '260px', display: 'block' }} loading="eager" fetchPriority="high" width="1300" height="260" onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(20,60,40,0.92) 0%, rgba(20,60,40,0.75) 45%, rgba(20,60,40,0) 78%)' }} />
          <div className="absolute inset-0 flex flex-col justify-center px-8 py-6" style={{ maxWidth: '720px' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.22)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M12 6v6l4 2"/></svg>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#ffffff' }}>Grants &amp; Programs</span>
            </div>
            <h1 style={{ color: '#ffffff', fontFamily: "'Lora','Times New Roman',serif", fontSize: '2rem', fontWeight: 'bold', margin: '0 0 10px', lineHeight: 1.2 }}>
              Find Funding for Your Farm
            </h1>
            <p style={{ color: '#ffffff', fontSize: '0.92rem', margin: '0 0 16px', lineHeight: 1.6 }}>
              Browse USDA, conservation, and private grant programs with deadline tracking, eligibility filters, and Saige AI to answer your questions.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/grants" className="bg-white font-bold px-5 py-2.5 rounded-lg shadow hover:shadow-md transition text-sm" style={{ color: ACCENT }}>Browse Grants</Link>
              {!isLoggedIn && <Link to="/signup" className="border-2 font-bold px-5 py-2.5 rounded-lg transition text-sm hover:bg-white/10" style={{ borderColor: '#ffffff', color: '#ffffff' }}>Open an Account</Link>}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 py-8" style={{ maxWidth: '1300px' }}>
        <section className="mt-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-3" style={{ fontFamily: "'Lora','Times New Roman',serif" }}>Agricultural Funding, All in One Place</h2>
          <p className="text-gray-700 leading-relaxed">Farming is capital-intensive and grant programs are notoriously hard to navigate. OFN's Grants & Programs tracker consolidates USDA, NRCS, FSA, state-level, and private foundation programs into a searchable database. Filter by your operation type, save programs you qualify for, and track deadlines — with Saige on hand to answer eligibility questions.</p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Lora','Times New Roman',serif" }}>What's Included</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {capabilities.map(c => <Capability key={c.title} icon={c.icon} title={c.title} body={c.body} />)}
          </div>
        </section>

        <section className="mt-10 text-center bg-white border border-gray-200 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Lora','Times New Roman',serif" }}>Start Finding Grants Today</h3>
          <p className="text-sm text-gray-600 mb-4">Free to browse. Save programs and track deadlines with your OFN account.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/grants" className="px-6 py-3 rounded-lg text-white font-bold shadow hover:shadow-md transition" style={{ backgroundColor: ACCENT }}>Browse Grants</Link>
            {!isLoggedIn && <Link to="/signup" className="px-6 py-3 rounded-lg border-2 font-bold transition" style={{ borderColor: ACCENT, color: ACCENT }}>Open an Account</Link>}
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
