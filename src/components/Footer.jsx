import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import { CONTACT_EMAIL } from '../config/api';
import { isLoggedIn } from '../lib/auth';

const FOOTER_BG = '#2c241c';

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  const loggedIn = isLoggedIn();

  // Logged-in workspace uses AuthShell; keep chrome light.
  if (loggedIn) return null;

  const links = [
    { to: '/', label: t('phase1.nav.home', 'Home') },
    { to: '/animals', label: t('phase1.nav.marketplace', 'Marketplace') },
    { to: '/livestock', label: t('phase1.nav.knowledgebase', 'Knowledgebase') },
    { to: '/news', label: t('phase1.nav.news', 'News Feed') },
    { to: '/events', label: t('phase1.nav.events', 'Events') },
    { to: '/about', label: t('phase1.nav.about', 'About') },
    { to: '/contact-us', label: t('phase1.nav.contact', 'Contact Us') },
    { to: '/login', label: t('nav.login', 'Login') },
  ];

  return (
    <footer className="mt-auto text-white/80 text-sm" style={{ backgroundColor: FOOTER_BG }}>
      <div className="max-w-[1200px] mx-auto px-5 py-10">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          <div>
            <img
              src="/images/loa-header-logo.png"
              alt="Livestock of America by Oatmeal AI"
              className="h-12 w-auto mb-3 rounded"
            />
            <p className="m-0 mb-2 text-sm font-semibold text-white" style={{ fontFamily: "'Lora', 'Times New Roman', serif" }}>
              Livestock of America by Oatmeal AI
            </p>
            <p className="max-w-sm text-white/70 leading-relaxed m-0">
              {t(
                'phase1.about.tagline',
                'Connecting ranchers, buyers, and livestock professionals across America.',
              )}
            </p>
            {CONTACT_EMAIL && (
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-block mt-3 text-white no-underline hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
            )}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="text-white/80 hover:text-white no-underline">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="border-t border-white/10 mt-8 pt-4 text-white/50 text-xs">
          © {year} Livestock of America by Oatmeal AI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
