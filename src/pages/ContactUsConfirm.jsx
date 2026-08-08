import React, { useEffect, useState } from 'react';
import { Link, useLocation, Navigate } from 'react-router';
import { useTranslation } from '../lib/i18n';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';

const CREAM = '#f7f2e8';
const OLIVE = '#3d6b34';
const INK = '#2c2c2c';
const MUTED = '#6b6b6b';

export default function ContactUsConfirm() {
  const location = useLocation();
  const payload = location.state?.payload;
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setIsLoggedIn(Boolean(localStorage.getItem('access_token')));
  }, []);

  if (!payload) {
    return <Navigate to="/contact-us" replace />;
  }

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ background: CREAM }}>
      <PageMeta
        title="Thank You | Livestock of America"
        description="Thanks for contacting Livestock of America by Oatmeal AI. We'll be in touch soon."
        noIndex
      />
      <Header />
      <main className="grow w-full max-w-2xl mx-auto px-4 py-8 md:py-12">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'Contact Us', to: '/contact-us' },
            { label: 'Confirmation' },
          ]}
        />

        <section className="bg-white rounded-2xl border border-black/5 p-8 md:p-10 shadow-sm text-center">
          <div
            className="mx-auto mb-5 w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: '#e8f0e3' }}
            aria-hidden
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={OLIVE} strokeWidth="2.2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>

          <h1
            className="text-3xl font-bold mb-3"
            style={{ fontFamily: "'Lora', 'Times New Roman', serif", color: OLIVE }}
          >
            {t('contact.confirm_title', 'Thank You')}
          </h1>
          <p className="mb-6 leading-relaxed" style={{ color: MUTED }}>
            {t(
              'contact.confirm_body',
              "Your message is on its way. We'll get back to you soon — usually within 1–2 business days."
            )}
          </p>

          <div
            className="mb-8 rounded-xl border border-black/5 p-4 text-left text-sm space-y-2"
            style={{ background: '#f7f2e8' }}
          >
            <p style={{ color: INK }}>
              <strong>{t('contact.confirm_name', 'Name:')}</strong> {payload.FName} {payload.LName}
            </p>
            <p style={{ color: INK }}>
              <strong>{t('contact.confirm_email', 'Email:')}</strong> {payload.Email}
            </p>
            {payload.Topic && (
              <p style={{ color: INK }}>
                <strong>Topic:</strong> {payload.Topic}
              </p>
            )}
            {payload.BizName && (
              <p style={{ color: INK }}>
                <strong>{t('contact.confirm_org', 'Organization:')}</strong> {payload.BizName}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to={isLoggedIn ? '/dashboard' : '/'}
              className="inline-flex justify-center items-center rounded-xl px-6 py-3 text-sm font-bold no-underline hover:opacity-90"
              style={{ background: OLIVE, color: '#ffffff' }}
            >
              {isLoggedIn
                ? t('contact.confirm_return_dashboard', 'Return To Dashboard')
                : t('contact.confirm_return_home', 'Return To Home')}
            </Link>
            <Link
              to="/contact-us"
              className="inline-flex justify-center items-center rounded-xl px-6 py-3 text-sm font-bold no-underline hover:bg-black/5"
              style={{ border: '1.5px solid rgba(0,0,0,0.12)', color: INK }}
            >
              Send another message
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
