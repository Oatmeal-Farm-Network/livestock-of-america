import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import { isLoggedIn } from '../lib/auth';

const HEADER_BG = '#8b3a2b';
const LORA = "'Lora', 'Times New Roman', serif";

const NAV = [
  {
    labelKey: 'phase1.nav.home',
    fallback: 'Home',
    to: '/',
  },
  {
    labelKey: 'phase1.nav.knowledgebase',
    fallback: 'Livestock Knowledgebase',
    to: '/livestock',
  },
  { labelKey: 'phase1.nav.marketplace', fallback: 'Livestock Marketplace', to: '/animals' },
  { labelKey: 'phase1.nav.events', fallback: 'Events', to: '/events' },
  { labelKey: 'phase1.nav.about', fallback: 'About', to: '/about' },
  { labelKey: 'phase1.nav.blog', fallback: 'Blog', to: '/blog' },
  { labelKey: 'phase1.nav.contact', fallback: 'Contact Us', to: '/contact-us' },
];

/**
 * Public marketing header. Hidden when signed in — AuthShell provides the left sidebar instead.
 */
export default function Header() {
  const { t } = useTranslation();
  const loggedIn = isLoggedIn();
  const [open, setOpen] = useState(false);

  if (loggedIn) return null;

  const linkStyle = {
    color: '#ffffff',
    fontFamily: LORA,
    textDecoration: 'none',
    fontSize: '0.92rem',
    whiteSpace: 'nowrap',
  };

  return (
    <nav
      className="relative py-3.5 px-5 md:px-8 shadow-md sticky top-0 z-[10000]"
      style={{ backgroundColor: HEADER_BG }}
    >
      <div className="mx-auto flex items-center justify-between gap-4 max-w-[1400px]">
        <Link to="/" className="flex items-center shrink-0">
          <img
            src="/images/loa-header-logo.webp"
            className="h-12 md:h-14 w-auto rounded-md object-contain"
            alt="Livestock of America by Oatmeal AI"
            width="200"
            height="56"
          />
        </Link>

        <div className="hidden lg:flex items-center gap-4 flex-wrap justify-end">
          {NAV.map((item) => (
            <Link key={item.to} to={item.to} style={linkStyle}>
              {t(item.labelKey, item.fallback)}
            </Link>
          ))}
          <Link to="/login" style={linkStyle}>
            {t('nav.login', 'Login')}
          </Link>
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
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              style={linkStyle}
            >
              {t(item.labelKey, item.fallback)}
            </Link>
          ))}
          <Link to="/login" onClick={() => setOpen(false)} style={linkStyle}>
            {t('nav.login', 'Login')}
          </Link>
        </div>
      )}
    </nav>
  );
}
