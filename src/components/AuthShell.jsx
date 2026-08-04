import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { isLoggedIn, logout } from '../lib/auth';
import { useAccount } from '../lib/AccountContext';
import SaigeWidget from './SaigeWidget';

const CREAM = '#f7f2e8';
const OLIVE = '#3d6b34';
const INK = '#2c2c2c';
const MUTED = '#6b6b6b';
const LORA = "'Lora', 'Times New Roman', serif";
const SIDEBAR_W = 240;

function resolveHerdHealthTo(BusinessID, businesses) {
  const fromCtx = BusinessID ? Number(BusinessID) : null;
  const fromList = businesses?.[0]
    ? Number(businesses[0].BusinessID ?? businesses[0].businessId ?? businesses[0].id)
    : null;
  const fromStore = (() => {
    const n = parseInt(localStorage.getItem('selected_business_id') || '', 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  })();
  const id = fromCtx || fromStore || fromList;
  return id ? `/herd-health?BusinessID=${id}` : '/herd-health';
}

/** LOA nav — left sidebar after login (layout pattern only; not a clone of other apps). */
function buildNav(herdTo) {
  return [
    { label: 'Dashboard', to: '/account', match: ['/account'] },
    { label: 'Profile', to: '/account/settings', match: ['/account/settings'] },
    { label: 'Livestock Marketplace', to: '/animals', match: ['/animals', '/marketplaces'] },
    { label: 'Livestock Knowledgebase', to: '/livestock', match: ['/livestock'] },
    { label: 'My Animals', to: '/seller/animals?tab=saved', match: ['/seller'] },
    { label: 'Herd Health', to: herdTo, match: ['/herd-health'] },
    { label: 'Events', to: '/events', match: ['/events'] },
    { label: 'About', to: '/about', match: ['/about'] },
    { label: 'Blog', to: '/blog', match: ['/blog'] },
  ];
}

function pathActive(pathname, item) {
  if (item.to === '/account') {
    return pathname === '/account' || pathname.startsWith('/accounts/');
  }
  if (item.to === '/account/settings') {
    return pathname === '/account/settings' || pathname.startsWith('/account/settings/');
  }
  return item.match.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Simple left-nav workspace chrome for signed-in users.
 */
export default function AuthShell({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { BusinessID, businesses } = useAccount() || {};

  const firstName = localStorage.getItem('first_name') || '';
  const lastName = localStorage.getItem('last_name') || '';
  const displayName = [firstName, lastName].filter(Boolean).join(' ') || 'Account';

  const NAV = useMemo(
    () => buildNav(resolveHerdHealthTo(BusinessID, businesses)),
    [BusinessID, businesses],
  );

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  if (!isLoggedIn()) return children;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const sidebar = (
    <aside
      className="flex flex-col h-full border-r"
      style={{
        width: SIDEBAR_W,
        background: '#fff',
        borderColor: '#e5e0d6',
      }}
    >
      <div className="px-4 pt-5 pb-4 border-b" style={{ borderColor: '#e5e0d6' }}>
        <Link to="/account" className="block no-underline mb-3">
          <img
            src="/images/loa-header-logo.webp"
            alt="Livestock of America by Oatmeal AI"
            className="h-10 w-auto rounded object-contain"
          />
        </Link>
        <p className="m-0 text-sm font-semibold truncate" style={{ color: INK, fontFamily: LORA }}>
          {displayName}
        </p>
        <p className="m-0 mt-0.5 text-xs leading-snug" style={{ color: MUTED }}>
          Livestock of America by Oatmeal AI
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV.map((item) => {
          const active = pathActive(location.pathname, item);
          return (
            <Link
              key={item.label}
              to={item.to}
              className="block rounded-lg px-3 py-2.5 text-sm no-underline transition-colors"
              style={{
                fontFamily: LORA,
                fontWeight: active ? 700 : 500,
                color: active ? OLIVE : INK,
                background: active ? '#eef3e7' : 'transparent',
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t" style={{ borderColor: '#e5e0d6' }}>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full text-left text-sm font-semibold bg-transparent border-0 cursor-pointer p-0"
          style={{ color: OLIVE, fontFamily: LORA }}
        >
          Log Out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: CREAM }}>
      <div
        className="lg:hidden sticky top-0 z-[100] flex items-center justify-between px-4 py-3"
        style={{ background: '#8b3a2b' }}
      >
        <button
          type="button"
          className="text-white text-xl bg-transparent border-0 cursor-pointer"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
        >
          ☰
        </button>
        <Link to="/account" className="no-underline">
          <img src="/images/loa-header-logo.webp" alt="LOA" className="h-9 rounded" />
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="text-white text-xs font-semibold bg-transparent border-0 cursor-pointer"
        >
          Log Out
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="hidden lg:block sticky top-0 h-screen shrink-0">{sidebar}</div>

        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-[200] flex">
            <button
              type="button"
              className="absolute inset-0 bg-black/40 border-0 cursor-pointer"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative h-full shadow-xl bg-white" style={{ width: SIDEBAR_W }}>
              {sidebar}
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col">{children}</div>
      </div>

      <SaigeWidget />
    </div>
  );
}
