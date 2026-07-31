// src/pages/herd-health/HerdHealthLayout.jsx
// Shared shell for Herd Health pages — sidebar nav + Header/Footer.
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../../lib/i18n';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import Breadcrumbs from '../../components/Breadcrumbs';

const CREAM = '#f7f2e8';
const OLIVE = '#3d6b34';
const INK = '#2c2c2c';
const MUTED = '#6b6b6b';

export default function HerdHealthLayout({ businessId, title, children }) {
  const { t } = useTranslation();
  const location = useLocation();
  const qs = businessId ? `?BusinessID=${businessId}` : '';

  const NAV = [
    { key: 'dashboard', label: t('herd_health.nav_dashboard', 'Dashboard'), to: `/herd-health/dashboard${qs}` },
    { key: 'events', label: t('herd_health.nav_events', 'Events'), to: `/herd-health/events${qs}` },
  ];

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ background: CREAM }}>
      <PageMeta title={`${title || 'Herd Health'} | Livestock of America`} noIndex />
      <Header />

      <main className="grow w-full max-w-[1200px] mx-auto px-4 md:px-6 py-6 md:py-8">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'Dashboard', to: '/account' },
            { label: t('herd_health.title', 'Herd Health') },
          ]}
        />

        <div className="flex flex-col md:flex-row gap-5">
          <aside className="md:w-56 shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-3 md:sticky md:top-24">
              <p
                className="text-[10px] font-bold tracking-[0.14em] uppercase px-2 pt-1 pb-2"
                style={{ color: OLIVE }}
              >
                {t('herd_health.title', 'Herd Health')}
              </p>
              <nav className="flex md:flex-col gap-1 flex-wrap">
                {NAV.map((item) => {
                  const active = location.pathname.startsWith(item.to.split('?')[0]);
                  return (
                    <Link
                      key={item.key}
                      to={item.to}
                      className="block rounded-lg px-3 py-2 text-sm font-semibold no-underline"
                      style={
                        active
                          ? { background: '#e8f0e3', color: OLIVE }
                          : { color: INK }
                      }
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          <section className="flex-1 min-w-0">
            {!businessId ? (
              <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 text-center">
                <p style={{ color: MUTED }}>
                  {t('herd_health.missing_business', 'Select a business from your dashboard to view herd health.')}
                </p>
              </div>
            ) : (
              children
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
