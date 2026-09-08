// Ported from Oatmeal Farm Network (src/AboutProductsStorefront.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
// src/AboutProductsStorefront.jsx
// Route: /platform/products-storefront
import React from 'react';
import { Link } from 'react-router';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import Breadcrumbs from '../../components/Breadcrumbs';
import { useIsLoggedIn } from '../../lib/useIsLoggedIn';

const ACCENT = '#A0522D';

export default function AboutProductsStorefront() {
  const isLoggedIn = useIsLoggedIn();
  const S = (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}/>;

  const capabilities = [
    { icon: <S><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></S>, title: 'Products Marketplace', body: 'List fresh produce, processed foods, and farm products on a public storefront that consumers can browse and buy directly.' },
    { icon: <S><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></S>, title: 'Farm 2 Table Channel', body: 'Sell direct to restaurants, caterers, and institutional buyers through the Farm 2 Table marketplace with weekly ordering.' },
    { icon: <S><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></S>, title: 'Stripe Connect Payouts', body: 'Integrated Stripe payments — buyers pay at checkout and funds are deposited directly to your connected bank account.' },
    { icon: <S><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></S>, title: 'Inventory Management', body: 'Track stock levels for produce, meat, and processed foods. Set available quantities and receive low-stock alerts.' },
    { icon: <S><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></S>, title: 'Custom Pricing & Bundles', body: 'Set prices per pound, per unit, or per bundle. Offer case pricing for wholesale buyers alongside retail quantities.' },
    { icon: <S><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></S>, title: 'Order Management', body: 'Receive and manage orders from one dashboard. View order history, print pick lists, and message buyers directly.' },
  ];

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f7f2e8' }}>
      <PageMeta
        title="Products & Storefront | Livestock Of America"
        description="Sell farm products, produce, and processed foods directly to consumers and restaurants on Livestock Of America's integrated marketplace and storefront."
        canonical="https://livestockofamerica.com/platform/products-storefront"
      />
      <Header />

      <div className="mx-auto px-4 pt-4" style={{ maxWidth: '1300px' }}>
        <Breadcrumbs items={[
          { label: 'Home', to: '/' },
          { label: 'Our Services', to: '/platform' },
          { label: 'Products & Storefront' },
        ]} />
      </div>

      <div className="mx-auto px-4 pt-2" style={{ maxWidth: '1300px' }}>
        <div className="relative w-full overflow-hidden rounded-xl">
          <img src="/images/CoreFeaturesFarm2Table.webp" alt="Products & Storefront" className="w-full object-cover" style={{ height: '260px', display: 'block' }} loading="eager" fetchPriority="high" width="1300" height="260" onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(100,40,10,0.92) 0%, rgba(100,40,10,0.75) 45%, rgba(100,40,10,0) 78%)' }} />
          <div className="absolute inset-0 flex flex-col justify-center px-8 py-6" style={{ maxWidth: '720px' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.22)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#ffffff' }}>Products &amp; Storefront</span>
            </div>
            <h1 style={{ color: '#ffffff', fontFamily: "'Lora','Times New Roman',serif", fontSize: '2rem', fontWeight: 'bold', margin: '0 0 10px', lineHeight: 1.2 }}>
              Sell Your Farm Products Online
            </h1>
            <p style={{ color: '#ffffff', fontSize: '0.92rem', margin: '0 0 16px', lineHeight: 1.6 }}>
              List produce, processed foods, and farm goods on a branded storefront. Accept payments, manage orders, and reach consumers and restaurant buyers in one place.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/marketplace/products" className="bg-white font-bold px-5 py-2.5 rounded-lg shadow hover:shadow-md transition text-sm" style={{ color: ACCENT }}>Browse Products</Link>
              {!isLoggedIn && <Link to="/signup" className="border-2 font-bold px-5 py-2.5 rounded-lg transition text-sm hover:bg-white/10" style={{ borderColor: '#ffffff', color: '#ffffff' }}>Open an Account</Link>}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 py-8" style={{ maxWidth: '1300px' }}>
        <section className="mt-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-3" style={{ fontFamily: "'Lora','Times New Roman',serif" }}>Your Farm Store, Online</h2>
          <p className="text-gray-700 leading-relaxed">OFN's Products & Storefront gives farms and artisan producers a direct sales channel — no third-party platform fees eating into your margins. List once and reach consumers through the Products marketplace and restaurants through the Farm 2 Table channel. Payments go straight to your Stripe account at checkout.</p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Lora','Times New Roman',serif" }}>What's Included</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {capabilities.map(c => <Capability key={c.title} icon={c.icon} title={c.title} body={c.body} />)}
          </div>
        </section>

        <section className="mt-10 text-center bg-white border border-gray-200 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Lora','Times New Roman',serif" }}>Start Selling Today</h3>
          <p className="text-sm text-gray-600 mb-4">Set up your storefront, add your products, and start taking orders with integrated Stripe payments.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/products" className="px-6 py-3 rounded-lg text-white font-bold shadow hover:shadow-md transition" style={{ backgroundColor: ACCENT }}>Manage My Products</Link>
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
