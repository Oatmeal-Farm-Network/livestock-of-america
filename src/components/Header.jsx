import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import { isLoggedIn, logout } from '../lib/auth';

const HEADER_BG = '#8b3a2b';
const LORA = "'Lora', 'Times New Roman', serif";

const KB_DROPDOWN = [
  { to: '/livestock', labelKey: 'nav.livestock_breeds', fallback: 'Livestock Breeds' },
  { to: '/plant-knowledgebase', labelKey: 'nav.plants', fallback: 'Plants' },
  { to: '/ingredient-knowledgebase', labelKey: 'nav.ingredients', fallback: 'Ingredients' },
];

const NAV = [
  { labelKey: 'phase1.nav.home', fallback: 'Home', to: '/' },
  {
    labelKey: 'phase1.nav.knowledgebase',
    fallback: 'Livestock Knowledgebase',
    to: '/livestock',
    dropdown: KB_DROPDOWN,
  },
  { labelKey: 'phase1.nav.marketplace', fallback: 'Livestock Marketplace', to: '/animals' },
  { labelKey: 'phase1.nav.events', fallback: 'Events', to: '/events' },
  { labelKey: 'phase1.nav.news', fallback: 'News Feed', to: '/news' },
  { labelKey: 'phase1.nav.about', fallback: 'About', to: '/about' },
  { labelKey: 'phase1.nav.blog', fallback: 'Blog', to: '/blog' },
  { labelKey: 'phase1.nav.contact', fallback: 'Contact Us', to: '/contact-us' },
];

function KbDropdown({ item, t, linkStyle }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ ...linkStyle, background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
      >
        {t(item.labelKey, item.fallback)}
        <span style={{ fontSize: '0.7rem', opacity: 0.85 }}>▾</span>
      </button>
      {open && (
        <div
          className="absolute top-full left-0 mt-1 min-w-[200px] rounded-lg shadow-lg py-2 z-50"
          style={{ backgroundColor: '#6e2f23', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <Link
            to={item.to}
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm font-semibold"
            style={linkStyle}
          >
            {t('livestock_db.title', 'Livestock Heritage Database')}
          </Link>
          {item.dropdown.map((d) => (
            <Link
              key={d.to}
              to={d.to}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm"
              style={linkStyle}
            >
              {t(d.labelKey, d.fallback)}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();
  const [open, setOpen] = useState(false);
  const [kbOpen, setKbOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/');
  };

  const linkStyle = { color: '#ffffff', fontFamily: LORA, textDecoration: 'none', fontSize: '0.92rem' };

  return (
    <nav
      className="relative py-3.5 px-5 md:px-8 shadow-md sticky top-0 z-[10000]"
      style={{ backgroundColor: HEADER_BG }}
    >
      <div className="mx-auto flex justify-between items-center gap-4 max-w-[1400px]">
        <Link to="/" className="flex items-center shrink-0">
          <img
            src="/images/loa-header-logo.png"
            className="h-12 md:h-14 w-auto object-contain"
            alt="Livestock of America"
            width="200"
            height="56"
          />
        </Link>

        <div className="hidden lg:flex items-center ml-auto gap-4 flex-wrap justify-end">
          {NAV.map((item) =>
            item.dropdown ? (
              <KbDropdown key={item.to} item={item} t={t} linkStyle={linkStyle} />
            ) : (
              <Link key={item.to} to={item.to} style={linkStyle}>
                {t(item.labelKey, item.fallback)}
              </Link>
            ),
          )}
          {loggedIn ? (
            <>
              <Link to="/account" style={linkStyle}>
                {t('nav.dashboard', 'Dashboard')}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                style={{ ...linkStyle, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {t('nav.log_out', 'Logout')}
              </button>
            </>
          ) : (
            <Link to="/login" style={linkStyle}>
              {t('nav.login', 'Login')}
            </Link>
          )}
        </div>

        <button
          type="button"
          className="lg:hidden text-white text-2xl leading-none"
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
          {NAV.map((item) =>
            item.dropdown ? (
              <div key={item.to}>
                <button
                  type="button"
                  onClick={() => setKbOpen((v) => !v)}
                  style={{ ...linkStyle, background: 'none', border: 'none', textAlign: 'left', width: '100%' }}
                >
                  {t(item.labelKey, item.fallback)} {kbOpen ? '▴' : '▾'}
                </button>
                {kbOpen && (
                  <div className="pl-3 mt-2 flex flex-col gap-2">
                    <Link to="/livestock" onClick={() => setOpen(false)} style={linkStyle}>
                      {t('livestock_db.title', 'Livestock Heritage Database')}
                    </Link>
                    {item.dropdown.map((d) => (
                      <Link key={d.to} to={d.to} onClick={() => setOpen(false)} style={linkStyle}>
                        {t(d.labelKey, d.fallback)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                style={linkStyle}
              >
                {t(item.labelKey, item.fallback)}
              </Link>
            ),
          )}
          {loggedIn ? (
            <>
              <Link to="/account" onClick={() => setOpen(false)} style={linkStyle}>
                {t('nav.dashboard', 'Dashboard')}
              </Link>
              <button type="button" onClick={handleLogout} style={{ ...linkStyle, textAlign: 'left', background: 'none', border: 'none' }}>
                {t('nav.log_out', 'Logout')}
              </button>
            </>
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
