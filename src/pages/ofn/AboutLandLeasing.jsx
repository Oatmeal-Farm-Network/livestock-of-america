// Ported from Oatmeal Farm Network (src/AboutLandLeasing.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
// src/AboutLandLeasing.jsx
// Route: /platform/land-leasing
import React from 'react';
import { Link } from 'react-router';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import Breadcrumbs from '../../components/Breadcrumbs';
import { useIsLoggedIn } from '../../lib/useIsLoggedIn';

const ACCENT = '#7B5E2A';

export default function AboutLandLeasing() {
  const isLoggedIn = useIsLoggedIn();
  const S = (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}/>;

  const capabilities = [
    { icon: <S><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></S>, title: 'Land & Property Listings', body: 'List farmland, pasture, orchards, barns, and rural properties available for lease, purchase, or sharecrop arrangements.' },
    { icon: <S><path d="M2 22V12l10-10 10 10v10"/><path d="M7 22V12l5-5 5 5v10"/><rect x="9" y="17" width="6" height="5"/></S>, title: 'Farmstead & Structure Details', body: 'Include acreage, soil type, water rights, irrigation infrastructure, buildings, fencing, and zoning details on every listing.' },
    { icon: <S><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></S>, title: 'Lease Agreement Notes', body: 'Attach lease terms, crop-share percentages, and land-use conditions to listings so prospective tenants know the deal upfront.' },
    { icon: <S><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></S>, title: 'Direct Landowner Contact', body: 'Interested farmers contact landowners directly through the platform — straightforward, no agent required.' },
    { icon: <S><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/></S>, title: 'Beginning Farmer Friendly', body: 'Listings can be tagged for beginning farmer programs, USDA FSA partnerships, or land-access initiatives.' },
    { icon: <S><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></S>, title: 'Conservation Easements', body: 'Landowners can note conservation easement status, habitat restrictions, and any stewardship requirements.' },
  ];

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f7f2e8' }}>
      <PageMeta
        title="Real Estate & Land Leasing | Oatmeal Farm Network"
        description="Find or list agricultural land and farmsteads for lease or sale on OFN — pasture, cropland, orchards, rural properties, and land-access resources for beginning farmers."
        canonical="https://oatmealfarmnetwork.com/platform/land-leasing"
      />
      <Header />

      <div className="mx-auto px-4 pt-4" style={{ maxWidth: '1300px' }}>
        <Breadcrumbs items={[
          { label: 'Home', to: '/' },
          { label: 'Our Services', to: '/platform' },
          { label: 'Real Estate & Land Leasing' },
        ]} />
      </div>

      <div className="mx-auto px-4 pt-2" style={{ maxWidth: '1300px' }}>
        <div className="relative w-full overflow-hidden rounded-xl">
          <img src="/images/1wmain.webp" alt="Agricultural Land Leasing" className="w-full object-cover" style={{ height: '260px', display: 'block' }} loading="eager" fetchPriority="high" width="1300" height="260" onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(70,45,15,0.92) 0%, rgba(70,45,15,0.75) 45%, rgba(70,45,15,0) 78%)' }} />
          <div className="absolute inset-0 flex flex-col justify-center px-8 py-6" style={{ maxWidth: '720px' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.22)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#ffffff' }}>Real Estate &amp; Land Leasing</span>
            </div>
            <h1 style={{ color: '#ffffff', fontFamily: "'Lora','Times New Roman',serif", fontSize: '2rem', fontWeight: 'bold', margin: '0 0 10px', lineHeight: 1.2 }}>
              Agricultural Land, Found &amp; Listed
            </h1>
            <p style={{ color: '#ffffff', fontSize: '0.92rem', margin: '0 0 16px', lineHeight: 1.6 }}>
              Connect farmers with landowners. Browse cropland, pasture, and rural properties for lease or sale — with soil, water, and infrastructure details included.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/land" className="bg-white font-bold px-5 py-2.5 rounded-lg shadow hover:shadow-md transition text-sm" style={{ color: ACCENT }}>Browse Land Listings</Link>
              {!isLoggedIn && <Link to="/signup" className="border-2 font-bold px-5 py-2.5 rounded-lg transition text-sm hover:bg-white/10" style={{ borderColor: '#ffffff', color: '#ffffff' }}>Open an Account</Link>}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 py-8" style={{ maxWidth: '1300px' }}>
        <section className="mt-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-3" style={{ fontFamily: "'Lora','Times New Roman',serif" }}>Agricultural Real Estate &amp; Access</h2>
          <p className="text-gray-700 leading-relaxed">Finding good farmland — especially for beginning farmers — is one of the biggest barriers in agriculture. OFN's land leasing board makes agricultural real estate discoverable: landowners list properties with full details, and farmers search by location, acreage, and land type. No generic real estate sites, no residential noise.</p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Lora','Times New Roman',serif" }}>What's Included</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {capabilities.map(c => <Capability key={c.title} icon={c.icon} title={c.title} body={c.body} />)}
          </div>
        </section>

        <section className="mt-10 text-center bg-white border border-gray-200 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Lora','Times New Roman',serif" }}>List or Find Agricultural Land</h3>
          <p className="text-sm text-gray-600 mb-4">Landowners list for free. Farmers browse at no cost and contact owners directly.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/land" className="px-6 py-3 rounded-lg text-white font-bold shadow hover:shadow-md transition" style={{ backgroundColor: ACCENT }}>Browse Land</Link>
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
