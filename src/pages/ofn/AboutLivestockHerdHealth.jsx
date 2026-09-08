// Ported from Oatmeal Farm Network (src/AboutLivestockHerdHealth.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
// src/AboutLivestockHerdHealth.jsx
// Route: /platform/livestock-herd-health
import React from 'react';
import { Link } from 'react-router';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import Breadcrumbs from '../../components/Breadcrumbs';
import { useIsLoggedIn } from '../../lib/useIsLoggedIn';

const ACCENT = '#6B2D2D';

export default function AboutLivestockHerdHealth() {
  const isLoggedIn = useIsLoggedIn();
  const S = (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}/>;

  const capabilities = [
    { icon: <S><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></S>, title: 'Health Event Log', body: 'Record vaccinations, treatments, vet visits, and illness events — with date, dosage, withdrawal periods, and notes.' },
    { icon: <S><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></S>, title: 'Herd Roster', body: 'Maintain a complete animal registry — tag numbers, birth dates, breed, dam, sire, and current weight for every head.' },
    { icon: <S><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></S>, title: 'Vaccination Schedules', body: 'Set recurring vaccination reminders. The system tracks what\'s due, overdue, and completed across the entire herd.' },
    { icon: <S><path d="M12 2a3 3 0 0 0 0 6"/><rect x="9" y="8" width="6" height="8" rx="1"/><path d="M7 15v2a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2"/></S>, title: 'Reproduction Tracking', body: 'Log breeding dates, pregnancy confirmations, and births. Track dam–sire pairings and calving/lambing outcomes.' },
    { icon: <S><rect x="18" y="3" width="4" height="18"/><rect x="10" y="8" width="4" height="13"/><rect x="2" y="13" width="4" height="8"/></S>, title: 'Weight & Growth Records', body: 'Log weigh-ins over time and visualize growth curves. Compare against breed benchmarks and feeding programs.' },
    { icon: <S><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></S>, title: 'Quarantine & Biosecurity', body: 'Flag animals for quarantine, track biosecurity protocols, and log lab results to protect herd health.' },
    { icon: <S><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></S>, title: 'Vet Contact & Visit Records', body: 'Store vet contacts, log clinic visits, attach treatment protocols, and maintain a full veterinary history.' },
    { icon: <S><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></S>, title: 'Herd Health Reports', body: 'Generate printable or shareable health summaries for sale, show entry, or regulatory compliance.' },
  ];

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f7f2e8' }}>
      <PageMeta
        title="Livestock & Herd Health | Livestock Of America"
        description="Complete livestock management on OFN — herd roster, health events, vaccinations, reproduction tracking, weight records, and vet history for every animal."
        canonical="https://livestockofamerica.com/platform/livestock-herd-health"
      />
      <Header />

      <div className="mx-auto px-4 pt-4" style={{ maxWidth: '1300px' }}>
        <Breadcrumbs items={[
          { label: 'Home', to: '/' },
          { label: 'Our Services', to: '/platform' },
          { label: 'Livestock & Herd Health' },
        ]} />
      </div>

      <div className="mx-auto px-4 pt-2" style={{ maxWidth: '1300px' }}>
        <div className="relative w-full overflow-hidden rounded-xl">
          <img src="/images/CoreFeaturesLivestock.webp" alt="Livestock & Herd Health" className="w-full object-cover" style={{ height: '260px', display: 'block' }} loading="eager" fetchPriority="high" width="1300" height="260" onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(80,20,20,0.92) 0%, rgba(80,20,20,0.75) 45%, rgba(80,20,20,0) 78%)' }} />
          <div className="absolute inset-0 flex flex-col justify-center px-8 py-6" style={{ maxWidth: '720px' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.22)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#ffffff' }}>Livestock &amp; Herd Health</span>
            </div>
            <h1 style={{ color: '#ffffff', fontFamily: "'Lora','Times New Roman',serif", fontSize: '2rem', fontWeight: 'bold', margin: '0 0 10px', lineHeight: 1.2 }}>
              Complete Herd Management in One Place
            </h1>
            <p style={{ color: '#ffffff', fontSize: '0.92rem', margin: '0 0 16px', lineHeight: 1.6 }}>
              Track every animal from birth to sale — health events, vaccinations, weights, reproduction, and vet records all in a searchable herd registry.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/animals" className="bg-white font-bold px-5 py-2.5 rounded-lg shadow hover:shadow-md transition text-sm" style={{ color: ACCENT }}>Go to My Herd</Link>
              {!isLoggedIn && <Link to="/signup" className="border-2 font-bold px-5 py-2.5 rounded-lg transition text-sm hover:bg-white/10" style={{ borderColor: '#ffffff', color: '#ffffff' }}>Open an Account</Link>}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 py-8" style={{ maxWidth: '1300px' }}>
        <section className="mt-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-3" style={{ fontFamily: "'Lora','Times New Roman',serif" }}>Your Digital Herd Records</h2>
          <p className="text-gray-700 leading-relaxed">OFN's livestock and herd health tools replace paper-and-clipboard management with a cloud-based registry that travels with you from the barn to the vet to the sale barn. Every animal gets a permanent record — tag number, pedigree, health history, and weight log — so nothing gets lost at sale time or during a herd audit.</p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Lora','Times New Roman',serif" }}>What's Included</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {capabilities.map(c => <Capability key={c.title} icon={c.icon} title={c.title} body={c.body} />)}
          </div>
        </section>

        <section className="mt-10 text-center bg-white border border-gray-200 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Lora','Times New Roman',serif" }}>Start Managing Your Herd</h3>
          <p className="text-sm text-gray-600 mb-4">Add your first animals and build a complete health history — free with your OFN account.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/animals" className="px-6 py-3 rounded-lg text-white font-bold shadow hover:shadow-md transition" style={{ backgroundColor: ACCENT }}>Go to My Herd</Link>
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
