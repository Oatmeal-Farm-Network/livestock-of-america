import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { useTranslation } from '../lib/i18n';
import Header from './Header';
import Footer from './Footer';
import PageMeta from './PageMeta';
import Breadcrumbs from './Breadcrumbs';

/**
 * Chrome for the account setup pages ported from Oatmeal Farm Network.
 *
 * Header and Footer return null while signed in — AuthShell supplies the nav
 * and sidebar for the logged-in workspace — so rendering them here only
 * matters if one of these pages is ever reached as a guest.
 */
export default function AccountLayout({
  children,
  pageTitle,
  breadcrumbs,
  allowAnonymous = false,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    if (allowAnonymous) return;
    const token =
      localStorage.getItem('access_token') || localStorage.getItem('AccessToken');
    if (!token) navigate('/login');
  }, [navigate, allowAnonymous]);

  const crumbs =
    breadcrumbs && breadcrumbs.length > 0
      ? breadcrumbs
      : [
          { label: t('phase1.nav.home', 'Home'), to: '/' },
          { label: t('phase1.nav.account', 'Account'), to: '/account' },
          ...(pageTitle ? [{ label: pageTitle }] : []),
        ];

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: '#f7f2e8' }}>
      <PageMeta
        title={pageTitle ? `${pageTitle} | Livestock of America` : 'Account | Livestock of America'}
        noIndex
      />
      <Header />

      {/* Breadcrumbs sit directly under the header on every page but Home. */}
      <div className="mx-auto w-full px-5" style={{ maxWidth: '1100px' }}>
        <Breadcrumbs items={crumbs} />
      </div>

      <div className="grow w-full mx-auto px-5 pb-10" style={{ maxWidth: '1100px' }}>
        {children}
        <div className="mt-8">
          <Link to="/account" className="text-sm font-semibold no-underline" style={{ color: '#3d6b34' }}>
            ← {t('phase1.nav.account', 'Account')}
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
