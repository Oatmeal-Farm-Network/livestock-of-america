// Ported from Oatmeal Farm Network (src/AboutMarketplaces.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
// src/AboutMarketplaces.jsx
// Route: /platform/marketplaces
import React from 'react';
import { Link } from 'react-router';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import Breadcrumbs from '../../components/Breadcrumbs';
import { useIsLoggedIn } from '../../lib/useIsLoggedIn';

const ACCENT = '#3D6B34';

const MARKETPLACES = [
  {
    accent: '#A3301E',
    badge: 'Wholesale',
    title: 'Farm 2 Table',
    audience: 'For chefs, restaurants & professional kitchens',
    body: 'Connect directly with farms in your region. Browse real inventory from verified producers, set up standing orders, and lock in wholesale pricing — without the middleman.',
    features: [
      'Wholesale pricing unlocked for verified restaurant buyers',
      'Weekly harvest digest emailed to your kitchen',
      'Standing orders and recurring delivery schedules',
    ],
    to: '/marketplaces/farm-to-table',
    cta: 'Browse Farm 2 Table',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/>
        <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
      </svg>
    ),
  },
  {
    accent: '#A0522D',
    badge: 'Direct to Consumer',
    title: 'Products & Storefront',
    audience: 'For farms selling direct to the public',
    body: 'A public-facing storefront for jams, eggs, produce, meat shares, honey, fiber, and everything your farm shop carries. Consumers browse and buy directly — no farmers market required.',
    features: [
      'Branded storefront tied to your OFN directory profile',
      'Retail and bundle pricing with Stripe checkout',
      'Inventory alerts and order management dashboard',
    ],
    to: '/marketplace/products',
    cta: 'Browse Products',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
  },
  {
    accent: '#8B5E3C',
    badge: 'Breeding Stock & Animals',
    title: 'Livestock Marketplace',
    audience: 'For ranchers, breeders & buyers of farm animals',
    body: 'Buy, sell, and connect with ranchers across the network. Breed-specific listings, pedigree documents, and full ranch profiles — so you can make confident purchases from anywhere.',
    features: [
      'Cattle, sheep, goats, pigs, poultry, and more',
      'Pedigree and registration documents on every listing',
      'Stud and breeding services with performance data',
    ],
    to: '/marketplaces/livestock',
    cta: 'Browse Livestock',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="14" rx="7" ry="5"/>
        <path d="M5 14c0-1-1-3-1-5a3 3 0 0 1 6 0"/>
        <path d="M19 14c0-1 1-3 1-5a3 3 0 0 0-6 0"/>
      </svg>
    ),
  },
  {
    accent: '#3D6B34',
    badge: 'Buy · Sell · Swap · Borrow',
    title: 'Equipment Marketplace',
    audience: 'For farms buying, selling, or sharing equipment',
    body: 'Farm equipment sits idle for most of the year but depreciates year-round. List what you\'ve grown out of, swap for something you need, or lend to a neighbor during your off-season.',
    features: [
      'Tractors, tillage, planters, harvesters, and more',
      'Swap Meet — trade equipment of similar value, no cash required',
      'Borrow & Lend network for seasonal equipment sharing',
    ],
    to: '/marketplaces/equipment',
    cta: 'Browse Equipment',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="1"/>
        <path d="M16 8h4l3 3v5h-7V8z"/>
        <circle cx="5.5" cy="18.5" r="2.5"/>
        <circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
  },
  {
    accent: '#516234',
    badge: 'Land & Property',
    title: 'Real Estate For Sale',
    audience: 'For buyers and sellers of farmland & rural property',
    body: 'Browse farms, parcels, and rural properties listed for sale by verified OFN members. Filter by acreage, soil type, irrigation, and region — then reach out directly to the owner.',
    features: [
      'Acreage, price, soil type, and irrigation details on every listing',
      'Direct inquiry form — no broker required',
      'Also browse land available to lease on the Land Leasing page',
    ],
    to: '/marketplaces/real-estate',
    cta: 'Browse Real Estate',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
];

const SHARED_FEATURES = [
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
    title: 'Stripe Connect Payouts',
    body: 'Connect your Stripe account and get paid directly. We never touch the money — your payouts land in your bank.',
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    title: 'Direct Messaging',
    body: 'Questions about cuts, breeds, or availability flow straight to the seller — not a generic contact form.',
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    title: 'Order Tracking',
    body: 'Confirm, reject, and ship orders from one dashboard. Tracking numbers flow back to the buyer automatically.',
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    title: 'Provenance Cards',
    body: 'Every product can print a sourcing card showing the farm, the field, or the animal it came from.',
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    title: 'Verified Sellers',
    body: 'Every listing is tied to a verified farm or ranch profile on OFN, so you always know who you\'re dealing with.',
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
    title: 'Wholesale + Retail Pricing',
    body: 'Show retail by default and unlock wholesale pricing automatically for verified restaurant and co-op buyers.',
  },
];

export default function AboutMarketplaces() {
  const isLoggedIn = useIsLoggedIn();

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f7f2e8' }}>
      <PageMeta
        title="Marketplaces | Buy, Sell & Trade Farm Products | Oatmeal Farm Network"
        description="Five marketplaces in one platform — Farm 2 Table for chefs, Products for consumers, Livestock for ranchers, Equipment for farms, and Real Estate for buyers and sellers."
        canonical="https://oatmealfarmnetwork.com/platform/marketplaces"
      />
      <Header />

      <div className="mx-auto px-4 pt-4" style={{ maxWidth: '1300px' }}>
        <Breadcrumbs items={[
          { label: 'Home', to: '/' },
          { label: 'Our Services', to: '/platform' },
          { label: 'Marketplaces' },
        ]} />
      </div>

      {/* Hero */}
      <div className="mx-auto px-4 pt-2" style={{ maxWidth: '1300px' }}>
        <div className="relative w-full overflow-hidden rounded-xl">
          <img
            src="/images/CoreFeaturesFarm2Table.webp"
            alt="OFN Marketplaces"
            className="w-full object-cover"
            style={{ height: '260px', display: 'block' }}
            loading="eager"
            fetchPriority="high"
            width="1300"
            height="260"
            onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }}
          />
          <div className="absolute inset-0"
               style={{ background: 'linear-gradient(to right, rgba(18,72,38,0.92) 0%, rgba(18,72,38,0.75) 45%, rgba(18,72,38,0) 78%)' }} />
          <div className="absolute inset-0 flex flex-col justify-center px-8 py-6" style={{ maxWidth: '720px' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.22)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-white">Platform Service</span>
            </div>
            <h1 style={{ color: '#fff', fontFamily: "'Lora','Times New Roman',serif", fontSize: '2rem', fontWeight: 'bold', margin: '0 0 10px', lineHeight: 1.2 }}>
              Five Marketplaces, One Platform
            </h1>
            <p style={{ color: '#fff', fontSize: '0.92rem', margin: '0 0 16px', lineHeight: 1.6 }}>
              Farm 2 Table for chefs, Products for consumers, Livestock for ranchers, Equipment for farms, and Real Estate for buyers and sellers — all built on the same verified network.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/marketplaces/farm-to-table"
                className="bg-white font-bold px-5 py-2.5 rounded-lg shadow hover:shadow-md transition text-sm"
                style={{ color: ACCENT }}>
                Browse Marketplaces →
              </Link>
              <Link to={isLoggedIn ? '/account' : '/signup'}
                className="border-2 font-bold px-5 py-2.5 rounded-lg transition text-sm hover:bg-white/10"
                style={{ borderColor: '#ffffff', color: '#ffffff' }}>
                {isLoggedIn ? 'Post a Listing' : 'Open an Account'}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 py-8" style={{ maxWidth: '1300px' }}>

        {/* Intro */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-3"
              style={{ fontFamily: "'Lora','Times New Roman',serif" }}>
            One Listing, Five Storefronts
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed max-w-3xl">
            Every product you add to OFN flows into the right marketplace automatically. A case of heirloom tomatoes shows up in Farm 2 Table for chefs. A pint of raspberry jam goes into the Products marketplace for direct-to-consumer. A registered Angus bull goes into the Livestock marketplace. Idle equipment finds a new home in the Equipment Marketplace. And your land can reach buyers in Real Estate. One record — many storefronts.
          </p>
        </section>

        {/* Marketplace cards */}
        <h2 className="text-lg font-bold text-gray-900 mb-5"
            style={{ fontFamily: "'Lora','Times New Roman',serif" }}>
          The Five Marketplaces
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
          {MARKETPLACES.map(m => (
            <MarketplaceCard key={m.title} {...m} />
          ))}
        </div>

        {/* Shared features */}
        <h2 className="text-lg font-bold text-gray-900 mb-5"
            style={{ fontFamily: "'Lora','Times New Roman',serif" }}>
          What's Included Across All Marketplaces
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {SHARED_FEATURES.map(f => (
            <div key={f.title} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="flex items-center">{f.icon}</span>
                <h3 className="font-bold text-gray-900 text-sm">{f.title}</h3>
              </div>
              <p className="text-sm text-gray-600">{f.body}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-gray-200 rounded-xl px-8 py-6">
          <div>
            <h3 className="font-bold text-gray-900 text-base mb-1"
                style={{ fontFamily: "'Lora','Times New Roman',serif" }}>
              Ready to Sell?
            </h3>
            <p className="text-sm text-gray-600">Free to list. Standard Stripe fees apply to payouts. No OFN commission on your first $1,000 in sales.</p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link to={isLoggedIn ? '/account' : '/signup'}
              className="px-5 py-2.5 rounded-lg text-white font-bold text-sm shadow hover:shadow-md transition"
              style={{ backgroundColor: ACCENT }}>
              {isLoggedIn ? 'Post a Listing' : 'Create a Free Account'}
            </Link>
            <Link to="/marketplaces/farm-to-table"
              className="px-5 py-2.5 rounded-lg font-bold border-2 text-sm transition hover:bg-gray-50"
              style={{ color: ACCENT, borderColor: ACCENT }}>
              Browse Listings
            </Link>
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}

function MarketplaceCard({ accent, badge, title, audience, body, features, to, cta, icon }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
               style={{ backgroundColor: `${accent}15`, color: accent }}>
            {icon}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: accent }}>
              {badge}
            </span>
            <h3 className="font-bold text-gray-900 text-base leading-tight"
                style={{ fontFamily: "'Lora','Times New Roman',serif" }}>
              {title}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{audience}</p>
          </div>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed mb-3">{body}</p>
        <ul className="space-y-1 mb-4">
          {features.map(f => (
            <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
              <svg className="shrink-0 mt-0.5" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {f}
            </li>
          ))}
        </ul>
      </div>
      <div className="px-5 pb-5">
        <Link to={to}
          className="inline-flex items-center gap-1.5 font-bold text-sm px-4 py-2 rounded-lg text-white transition shadow hover:shadow-md"
          style={{ backgroundColor: accent }}>
          {cta} →
        </Link>
      </div>
    </div>
  );
}
