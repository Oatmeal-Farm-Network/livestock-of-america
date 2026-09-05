// src/pages/herd-health/HerdHealthLayout.jsx
// Shared shell for Herd Health pages — nested module nav under the top Header.
import React from 'react';
import { Link, useLocation } from 'react-router';
import { useTranslation } from '../../lib/i18n';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import Breadcrumbs from '../../components/Breadcrumbs';
import { useHerdBusinessId } from './useHerdBusinessId';

const CREAM = '#f7f2e8';
const OLIVE = '#3d6b34';
const INK = '#2c2c2c';
const MUTED = '#6b6b6b';
const LORA = "'Lora', 'Times New Roman', serif";

const NAV_GROUPS = [
  {
    labelKey: 'herd_health.group_overview',
    label: 'Overview',
    items: [
      { key: 'dashboard', labelKey: 'herd_health.nav_dashboard', label: 'Dashboard', path: '/herd-health' },
      { key: 'reports', labelKey: 'herd_health.nav_reports', label: 'Reports', path: '/herd-health/reports' },
    ],
  },
  {
    labelKey: 'herd_health.group_care',
    label: 'Care',
    items: [
      { key: 'events', labelKey: 'herd_health.nav_events', label: 'Events', path: '/herd-health/events' },
      { key: 'vaccinations', labelKey: 'herd_health.nav_vaccinations', label: 'Vaccinations', path: '/herd-health/vaccinations' },
      { key: 'treatments', labelKey: 'herd_health.nav_treatments', label: 'Treatments', path: '/herd-health/treatments' },
      { key: 'quarantine', labelKey: 'herd_health.nav_quarantine', label: 'Quarantine', path: '/herd-health/quarantine' },
      { key: 'medications', labelKey: 'herd_health.nav_medications', label: 'Medications', path: '/herd-health/medications' },
      { key: 'vet-visits', labelKey: 'herd_health.nav_vet_visits', label: 'Vet visits', path: '/herd-health/vet-visits' },
    ],
  },
  {
    labelKey: 'herd_health.group_records',
    label: 'Records',
    items: [
      { key: 'weights', labelKey: 'herd_health.nav_weights', label: 'Weights', path: '/herd-health/weights' },
      { key: 'parasites', labelKey: 'herd_health.nav_parasites', label: 'Parasites', path: '/herd-health/parasites' },
      { key: 'mortality', labelKey: 'herd_health.nav_mortality', label: 'Mortality', path: '/herd-health/mortality' },
      { key: 'lab-results', labelKey: 'herd_health.nav_lab_results', label: 'Lab results', path: '/herd-health/lab-results' },
      { key: 'biosecurity', labelKey: 'herd_health.nav_biosecurity', label: 'Biosecurity', path: '/herd-health/biosecurity' },
      { key: 'reproduction', labelKey: 'herd_health.nav_reproduction', label: 'Reproduction', path: '/herd-health/reproduction' },
    ],
  },
  {
    labelKey: 'herd_health.group_directory',
    label: 'Directory',
    items: [
      { key: 'vet-contacts', labelKey: 'herd_health.nav_vet_contacts', label: 'Vet contacts', path: '/herd-health/vet-contacts' },
    ],
  },
];

function pathActive(pathname, path) {
  if (path === '/herd-health') {
    return pathname === '/herd-health' || pathname === '/herd-health/dashboard';
  }
  return pathname === path || pathname.startsWith(`${path}/`);
}

export default function HerdHealthLayout({ businessId: businessIdProp, title, children }) {
  const { t } = useTranslation();
  const location = useLocation();
  const { businessId: hookBiz, setBusinessId, options, qs } = useHerdBusinessId();
  const businessId = businessIdProp || hookBiz;

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
                {NAV_GROUPS.map((group) => (
                  <div key={group.label} className="w-full mb-2">
                    <p
                      className="hidden md:block text-[10px] font-bold tracking-[0.12em] uppercase px-2 pt-2 pb-1"
                      style={{ color: MUTED }}
                    >
                      {t(group.labelKey, group.label)}
                    </p>
                    {group.items.map((item) => {
                      const to = `${item.path}${qs || (businessId ? `?BusinessID=${businessId}` : '')}`;
                      const active = pathActive(location.pathname, item.path);
                      return (
                        <Link
                          key={item.key}
                          to={to}
                          className="block rounded-lg px-3 py-2 text-sm font-semibold no-underline"
                          style={
                            active
                              ? { background: '#e8f0e3', color: OLIVE }
                              : { color: INK }
                          }
                        >
                          {t(item.labelKey, item.label)}
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </nav>
            </div>
          </aside>

          <section className="flex-1 min-w-0">
            {!businessId ? (
              <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6">
                <h1
                  className="text-xl font-bold mb-2"
                  style={{ fontFamily: LORA, color: INK }}
                >
                  {t('herd_health.pick_business_title', 'Select a business')}
                </h1>
                <p className="text-sm mb-4" style={{ color: MUTED }}>
                  {t(
                    'herd_health.pick_business_body',
                    'Choose which ranch or business herd health records to manage.',
                  )}
                </p>
                {!options.length ? (
                  <p className="text-sm" style={{ color: MUTED }}>
                    {t(
                      'herd_health.no_businesses',
                      'No businesses found on your account. Add one from your dashboard first.',
                    )}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {options.map((opt) => (
                      <li key={opt.id}>
                        <button
                          type="button"
                          onClick={() => setBusinessId(opt.id)}
                          className="w-full text-left rounded-lg px-4 py-3 text-sm font-semibold cursor-pointer border"
                          style={{
                            background: '#fff',
                            borderColor: 'rgba(61,107,52,0.25)',
                            color: INK,
                            fontFamily: LORA,
                          }}
                        >
                          {opt.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
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
