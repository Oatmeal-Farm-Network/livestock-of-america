import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';

const CREAM = '#f7f2e8';
const OLIVE = '#3d6b34';
const INK = '#2c2c2c';
const MUTED = '#6b6b6b';
const LORA = "'Lora', 'Times New Roman', serif";

export const HERO_TABS = [
  {
    id: 'for_sale',
    titleKey: 'livestock_mkt.tab_for_sale',
    titleFallback: 'Livestock for Sale',
    subtitleKey: 'livestock_mkt.tab_for_sale_sub',
    subtitleFallback: 'Animals available from trusted breeders.',
    to: '/marketplaces/livestock/cattle',
    icon: 'sale',
  },
  {
    id: 'studs',
    titleKey: 'livestock_mkt.tab_studs',
    titleFallback: 'Stud Services',
    subtitleKey: 'livestock_mkt.tab_studs_sub',
    subtitleFallback: 'Find quality stud animals.',
    to: '/marketplaces/livestock/studs/cattle',
    icon: 'barn',
  },
  {
    id: 'ranches',
    titleKey: 'livestock_mkt.tab_ranches',
    titleFallback: 'Ranches',
    subtitleKey: 'livestock_mkt.tab_ranches_sub',
    subtitleFallback: 'Explore ranches and operations.',
    to: '/marketplaces/livestock/ranches/cattle',
    icon: 'barn',
  },
];

/** Resolve which hero tab should appear active from the current URL. */
export function getHeroTabActiveId(pathname) {
  if (pathname.includes('/marketplaces/livestock/studs/') || /\/studs\/[^/]+/.test(pathname)) {
    return 'studs';
  }
  if (pathname.includes('/marketplaces/livestock/ranches/') || /\/ranches\/[^/]+/.test(pathname)) {
    return 'ranches';
  }
  return 'for_sale';
}

function TabIcon({ type, active }) {
  const color = active ? '#fff' : OLIVE;
  if (type === 'sale') {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" />
        <path d="M8 14c1.5-2 2.5-3 4-3s2.5 1 4 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="9" cy="10" r="1" fill={color} />
        <circle cx="15" cy="10" r="1" fill={color} />
      </svg>
    );
  }
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 10l8-5 8 5v9H4v-9z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 19v-5h6v5" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Shared marketplace hero banner + category tabs.
 * Pass activeId explicitly, or omit to auto-detect from the current route.
 */
export default function LivestockHeroTabs({ activeId: activeIdProp }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const activeId = activeIdProp ?? getHeroTabActiveId(pathname);

  return (
    <div className="relative w-full">
      <div className="relative overflow-hidden">
        <img
          src="/images/LOAwebbanner1898x360.webp"
          alt="Livestock of America"
          loading="eager"
          fetchPriority="high"
          className="w-full block object-cover h-[180px] sm:h-[220px] md:h-[260px]"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'repeating-linear-gradient(105deg, transparent, transparent 80px, rgba(229,154,36,0.55) 80px, rgba(229,154,36,0.55) 88px)',
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-10 sm:-mt-12 relative z-10 pb-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {HERO_TABS.map((tab) => {
            const active = tab.id === activeId;
            const inner = (
              <div
                className="flex items-start gap-3 rounded-xl px-4 py-4 shadow-md h-full transition-all"
                style={{
                  backgroundColor: active ? OLIVE : '#fff',
                  color: active ? '#fff' : INK,
                  border: active ? `1px solid ${OLIVE}` : '1px solid #e5e0d6',
                  cursor: active ? 'default' : 'pointer',
                }}
              >
                <div
                  className="shrink-0 rounded-full flex items-center justify-center"
                  style={{
                    width: 44,
                    height: 44,
                    backgroundColor: active ? 'rgba(255,255,255,0.15)' : CREAM,
                  }}
                >
                  <TabIcon type={tab.icon} active={active} />
                </div>
                <div className="min-w-0 pt-0.5">
                  <div className="font-semibold text-[15px] leading-tight mb-1" style={{ fontFamily: LORA }}>
                    {t(tab.titleKey, tab.titleFallback)}
                  </div>
                  <div className="text-xs leading-snug" style={{ color: active ? 'rgba(255,255,255,0.88)' : MUTED }}>
                    {t(tab.subtitleKey, tab.subtitleFallback)}
                  </div>
                </div>
              </div>
            );

            if (active) {
              return <div key={tab.id} aria-current="page">{inner}</div>;
            }
            return (
              <Link key={tab.id} to={tab.to} className="no-underline block hover:-translate-y-0.5 transition-transform">
                {inner}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
