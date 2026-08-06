import React from 'react';
import { Link } from 'react-router';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';

const CREAM = '#f7f2e8';
const OLIVE = '#3d6b34';

export default function ComingSoon({ title = 'Coming Soon', description }) {
  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: CREAM }}>
      <PageMeta title={`${title} | Livestock of America by Oatmeal AI`} description={description || title} noIndex />
      <Header />
      <div className="flex-1 max-w-[900px] mx-auto px-4 w-full">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: title }]} />
        <div className="py-16 md:py-24 text-center">
          <p className="text-sm uppercase tracking-widest mb-3" style={{ color: OLIVE }}>
            Livestock of America by Oatmeal AI
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Lora', serif", color: '#2c2c2c' }}>
            {title}
          </h1>
          <p className="text-base md:text-lg mb-8 max-w-xl mx-auto" style={{ color: '#6b6b6b' }}>
            {description || 'This section is coming soon. Explore the livestock marketplace in the meantime.'}
          </p>
          <Link
            to="/animals"
            className="inline-block rounded-lg px-6 py-3 text-sm font-semibold text-white no-underline"
            style={{ backgroundColor: OLIVE }}
          >
            Browse Marketplace
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
