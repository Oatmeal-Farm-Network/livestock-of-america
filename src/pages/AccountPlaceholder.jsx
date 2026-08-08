import React from 'react';
import { Link, useLocation } from 'react-router';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';
import RequireAuth from '../components/RequireAuth';

const CREAM = '#f7f2e8';
const OLIVE = '#3d6b34';
const INK = '#2c2c2c';
const MUTED = '#6b6b6b';

/** Lightweight placeholders for OFN account sub-pages not yet ported to LOA. */
function Inner({ title, description }) {
  const location = useLocation();
  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ background: CREAM }}>
      <PageMeta title={`${title} | Livestock of America`} noIndex />
      <Header />
      <main className="grow w-full max-w-[900px] mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', to: '/account' },
            { label: title },
          ]}
        />
        <h1
          className="text-3xl font-bold mb-3"
          style={{ fontFamily: "'Lora', serif", color: INK }}
        >
          {title}
        </h1>
        <p className="mb-6" style={{ color: MUTED }}>
          {description ||
            'This account tool is coming soon on Livestock of America. Your dashboard is ready — more account pages will follow.'}
        </p>
        <p className="text-xs mb-6" style={{ color: MUTED }}>
          Path: {location.pathname}
          {location.search}
        </p>
        <Link
          to="/account"
          className="inline-flex rounded-xl px-5 py-3 text-sm font-bold no-underline"
          style={{ background: OLIVE, color: '#fff' }}
        >
          Back to Dashboard
        </Link>
      </main>
      <Footer />
    </div>
  );
}

export default function AccountPlaceholder({ title, description }) {
  return (
    <RequireAuth>
      <Inner title={title} description={description} />
    </RequireAuth>
  );
}
