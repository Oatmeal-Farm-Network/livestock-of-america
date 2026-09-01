import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { isLoggedIn, logout } from '../lib/auth';
import Header from './Header';
import AccountSidebar from './AccountSidebar';

const CREAM = '#f7f2e8';

/**
 * Logged-in chrome: LOA top header only + full OFN left sidebar (not mixed).
 */
export default function AuthShell({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  if (!isLoggedIn()) return children;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: CREAM }}>
      {/* Full-width LOA top nav (pages' <Header /> returns null while signed in) */}
      <Header force />

      {/* Mobile sidebar trigger bar */}
      <div
        className="lg:hidden sticky top-[72px] z-[90] flex items-center justify-between px-4 py-2 border-b"
        style={{ background: '#faf6ef', borderColor: '#e5e0d6' }}
      >
        <button
          type="button"
          className="text-sm font-semibold bg-transparent border-0 cursor-pointer"
          style={{ color: '#3d6b34' }}
          aria-label="Open workspace menu"
          onClick={() => setMobileOpen(true)}
        >
          ☰ Menu
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="text-xs font-semibold bg-transparent border-0 cursor-pointer"
          style={{ color: '#3d6b34' }}
        >
          Log Out
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        <aside className="hidden lg:block sticky top-[72px] h-[calc(100vh-72px)] shrink-0 self-start overflow-hidden">
          <AccountSidebar />
        </aside>

        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-[200] flex">
            <button
              type="button"
              className="absolute inset-0 bg-black/40 border-0 cursor-pointer"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative h-full shadow-xl">
              <AccountSidebar onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col">{children}</div>
      </div>

      {/* Saige chat widget temporarily hidden — see App.tsx. */}
    </div>
  );
}
