import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import { isLoggedIn, logout } from '../lib/auth';

const HEADER_BG = '#8b3a2b';
const LORA = "'Lora', 'Times New Roman', serif";

/** LOA public-site links only (sidebar owns OFN workspace nav). */
const LOA_NAV = [
  { labelKey: 'phase1.nav.home', fallback: 'Home', to: '/', authTo: '/account' },
  {
    labelKey: 'phase1.nav.knowledgebase',
    fallback: 'Knowledgebase',
    to: '/livestock',
  },
  {
    labelKey: 'phase1.nav.marketplace',
    fallback: 'Marketplace',
    to: '/animals',
  },
  { labelKey: 'phase1.nav.news', fallback: 'News Feed', to: '/news' },
  { labelKey: 'phase1.nav.events', fallback: 'Events', to: '/events' },
  { labelKey: 'phase1.nav.about', fallback: 'About', to: '/about' },
  { labelKey: 'phase1.nav.blog', fallback: 'Blog', to: '/blog' },
];

const GUEST_EXTRA = [
  { labelKey: 'phase1.nav.contact', fallback: 'Contact Us', to: '/contact-us' },
];

/**
 * LOA top header only.
 * Guests: marketing nav + Login.
 * Signed-in: same LOA site links + Log Out (OFN workspace lives in left sidebar).
 * AuthShell renders <Header force />; page-level <Header /> is hidden when signed in.
 */
export default function Header({ force = false }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();
  const [open, setOpen] = useState(false);

  if (loggedIn && !force) return null;

  const nav = loggedIn ? LOA_NAV : [...LOA_NAV, ...GUEST_EXTRA];
  const homeTo = loggedIn ? '/account' : '/';

  const linkStyle = {
    color: '#ffffff',
    fontFamily: LORA,
    textDecoration: 'none',
    fontSize: '0.9rem',
    whiteSpace: 'nowrap',
  };

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/');
  };

  const itemTo = (item) => (loggedIn && item.authTo ? item.authTo : item.to);

  return (
    <nav
      className="relative py-3.5 px-5 md:px-8 shadow-md sticky top-0 z-[10000]"
      style={{ backgroundColor: HEADER_BG }}
    >
      <div className="mx-auto flex items-center justify-between gap-4 max-w-[1400px]">
        <Link to={homeTo} className="flex items-center shrink-0">
          <img
            src="/images/loa-header-logo.png"
            className="h-12 md:h-14 w-auto object-contain"
            alt="Livestock of America by Oatmeal AI"
            width="200"
            height="56"
          />
        </Link>

        <div className="hidden lg:flex items-center gap-4 flex-wrap justify-end">
          {nav.map((item) => (
            <Link key={item.labelKey} to={itemTo(item)} style={linkStyle}>
              {t(item.labelKey, item.fallback)}
            </Link>
          ))}
          {loggedIn ? (
            <button
              type="button"
              onClick={handleLogout}
              className="bg-transparent border-0 cursor-pointer p-0"
              style={linkStyle}
            >
              {t('nav.log_out', 'Log Out')}
            </button>
          ) : (
            <Link to="/login" style={linkStyle}>
              {t('nav.login', 'Login')}
            </Link>
          )}
        </div>

        <button
          type="button"
          className="lg:hidden text-white text-2xl leading-none shrink-0"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          ☰
        </button>
      </div>

      {open && (
        <div
          className="lg:hidden absolute top-full left-0 w-full border-t border-white/10 shadow-xl z-50 px-5 py-4 flex flex-col gap-3"
          style={{ backgroundColor: HEADER_BG }}
        >
          {nav.map((item) => (
            <Link
              key={item.labelKey}
              to={itemTo(item)}
              onClick={() => setOpen(false)}
              style={linkStyle}
            >
              {t(item.labelKey, item.fallback)}
            </Link>
          ))}
          {loggedIn ? (
            <button
              type="button"
              onClick={handleLogout}
              className="bg-transparent border-0 cursor-pointer p-0 text-left"
              style={linkStyle}
            >
              {t('nav.log_out', 'Log Out')}
            </button>
          ) : (
            <Link to="/login" onClick={() => setOpen(false)} style={linkStyle}>
              {t('nav.login', 'Login')}
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
