import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import { isLoggedIn } from '../lib/auth';

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
const HERO_COPY = {
  for_sale: {
    eyebrow: 'Marketplace',
    title: 'Buy and sell livestock across America',
  },
  studs: {
    eyebrow: 'Stud Services',
    title: 'Find quality stud animals nationwide',
  },
  ranches: {
    eyebrow: 'Ranches',
    title: 'Discover ranches and breeders coast to coast',
  },
};

export default function LivestockHeroTabs({ activeId: activeIdProp }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const activeId = activeIdProp ?? getHeroTabActiveId(pathname);
  const copy = HERO_COPY[activeId] || HERO_COPY.for_sale;
  const guest = !isLoggedIn();

  return (
    <div className="relative w-full">
      <div className="relative overflow-hidden min-h-[180px] sm:min-h-[220px] md:min-h-[280px]">
        <img
          src="/images/home-hero-livestock.png"
          alt="Livestock of America marketplace"
          loading="eager"
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover object-[center_60%]"
          onError={(e) => {
            e.currentTarget.src = '/images/LOAwebbanner1898x360.webp';
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(44,36,28,0.35) 0%, rgba(44,36,28,0.55) 100%)',
          }}
        />
        <div className="relative z-10 max-w-6xl mx-auto px-4 pt-10 sm:pt-14 pb-16 sm:pb-20">
          <p
            className="m-0 mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/85"
            style={{ fontFamily: LORA }}
          >
            {copy.eyebrow}
          </p>
          <h1
            className="m-0 text-white max-w-xl"
            style={{
              fontFamily: LORA,
              fontWeight: 700,
              fontSize: 'clamp(1.5rem, 3.5vw, 2.15rem)',
              lineHeight: 1.15,
            }}
          >
            {copy.title}
          </h1>
        </div>
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
            if (tab.id === 'ranches' && guest) {
              return (
                <button
                  key={tab.id}
                  type="button"
                  className="no-underline block hover:-translate-y-0.5 transition-transform text-left w-full p-0 border-0 bg-transparent"
                  onClick={() => navigate('/login', { state: { from: { pathname: tab.to } } })}
                >
                  {inner}
                </button>
              );
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
