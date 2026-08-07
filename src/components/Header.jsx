import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from '../lib/i18n';
import { isLoggedIn, logout } from '../lib/auth';

const HEADER_BG = '#8b3a2b';
const LORA = "'Lora', 'Times New Roman', serif";

/**
 * LOA top-header nav, in the requested order:
 * Home · Marketplace · Directory · Newsfeed▾ · Knowledgebase · Events · About▾ · Log Out
 * Newsfeed and About are dropdowns. `authTo` swaps the target once signed in.
 */
const NAV = [
  { label: 'Home', fallbackKey: 'phase1.nav.home', to: '/', authTo: '/account' },
  { label: 'Marketplace', fallbackKey: 'phase1.nav.marketplace', to: '/animals' },
  { label: 'Directory', fallbackKey: 'phase1.nav.directory', to: '/directory' },
  {
    label: 'Newsfeed',
    fallbackKey: 'phase1.nav.news',
    children: [
      { label: 'News Feed', to: '/news' },
      { label: 'Blog', to: '/blog' },
    ],
  },
  { label: 'Knowledgebase', fallbackKey: 'phase1.nav.knowledgebase', to: '/livestock' },
  { label: 'Events', fallbackKey: 'phase1.nav.events', to: '/events' },
  {
    label: 'About',
    fallbackKey: 'phase1.nav.about',
    children: [
      { label: 'About LOA', to: '/about' },
      { label: 'About Oatmeal AI', to: '/about/oatmeal-ai' },
    ],
  },
];

const linkStyle = {
  color: '#ffffff',
  fontFamily: LORA,
  textDecoration: 'none',
  fontSize: '0.9rem',
  whiteSpace: 'nowrap',
  background: 'transparent',
  border: 0,
  cursor: 'pointer',
  padding: 0,
};

/** Desktop hover dropdown with a 220ms grace-period close. */
function NavDropdown({ label, children, onNavigate }) {
  const [open, setOpen] = useState(false);
  const timer = useRef(null);

  const openNow = () => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(true);
  };
  const closeSoon = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 220);
  };

  return (
    <div
      className="relative"
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={linkStyle}
        className="flex items-center gap-1"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {label}
        <span style={{ fontSize: '0.6rem', opacity: 0.85 }}>▾</span>
      </button>
      {open && (
        <div
          className="absolute right-0 top-full pt-2 z-[10001]"
          onMouseEnter={openNow}
          onMouseLeave={closeSoon}
        >
          <div className="bg-white rounded-md shadow-lg overflow-hidden min-w-[180px] py-1">
            {children.map((c) =>
              c.external ? (
                <a
                  key={c.label}
                  href={c.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => { setOpen(false); onNavigate?.(); }}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  style={{ fontFamily: LORA }}
                >
                  {c.label}
                </a>
              ) : (
                <Link
                  key={c.label}
                  to={c.to}
                  onClick={() => { setOpen(false); onNavigate?.(); }}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  style={{ fontFamily: LORA }}
                >
                  {c.label}
                </Link>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * LOA top header only.
 * Guests: marketing nav + Login. Signed-in: same links + Log Out.
 * AuthShell renders <Header force />; page-level <Header /> is hidden when signed in.
 */
export default function Header({ force = false }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();
  const [open, setOpen] = useState(false);

  if (loggedIn && !force) return null;

  const homeTo = loggedIn ? '/account' : '/';
  const itemTo = (item) => (loggedIn && item.authTo ? item.authTo : item.to);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/');
  };

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

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-4 flex-wrap justify-end">
          {NAV.map((item) =>
            item.children ? (
              <NavDropdown
                key={item.label}
                label={t(item.fallbackKey, item.label)}
                children={item.children}
              />
            ) : (
              <Link key={item.label} to={itemTo(item)} style={linkStyle}>
                {t(item.fallbackKey, item.label)}
              </Link>
            )
          )}
          {loggedIn ? (
            <button type="button" onClick={handleLogout} style={linkStyle}>
              {t('nav.log_out', 'Log Out')}
            </button>
          ) : (
            <Link to="/login" style={linkStyle}>
              {t('nav.login', 'Login')}
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="lg:hidden text-white text-2xl leading-none shrink-0"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          ☰
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="lg:hidden absolute top-full left-0 w-full border-t border-white/10 shadow-xl z-50 px-5 py-4 flex flex-col gap-3"
          style={{ backgroundColor: HEADER_BG }}
        >
          {NAV.map((item) =>
            item.children ? (
              <div key={item.label} className="flex flex-col gap-2">
                <span style={{ ...linkStyle, opacity: 0.7, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t(item.fallbackKey, item.label)}
                </span>
                {item.children.map((c) =>
                  c.external ? (
                    <a
                      key={c.label}
                      href={c.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setOpen(false)}
                      style={linkStyle}
                      className="pl-3"
                    >
                      {c.label}
                    </a>
                  ) : (
                    <Link
                      key={c.label}
                      to={c.to}
                      onClick={() => setOpen(false)}
                      style={linkStyle}
                      className="pl-3"
                    >
                      {c.label}
                    </Link>
                  )
                )}
              </div>
            ) : (
              <Link
                key={item.label}
                to={itemTo(item)}
                onClick={() => setOpen(false)}
                style={linkStyle}
              >
                {t(item.fallbackKey, item.label)}
              </Link>
            )
          )}
          {loggedIn ? (
            <button type="button" onClick={handleLogout} style={{ ...linkStyle, textAlign: 'left' }}>
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
