// Ported from Oatmeal Farm Network (src/Accounts.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router';
import { useTranslation } from '../../lib/i18n';
const IcoUsers = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IcoEdit  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IcoDel   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import Breadcrumbs from '../../components/Breadcrumbs';
import { getPeopleId } from '../../lib/auth';

const FARM_RANCH_TYPE_ID = 8;

export default function Accounts() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  const peopleId = searchParams.get('PeopleID') || getPeopleId();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { navigate('/login'); return; }
    if (!peopleId) return;

    fetch(`${import.meta.env.VITE_LIVESTOCK_API_URL}/auth/my-businesses?PeopleID=${peopleId}`)
      .then(r => r.json())
      .then(data => { setBusinesses(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [peopleId]);

  return (
    <div className="min-h-screen font-sans">
      <PageMeta
        title="My Accounts | Oatmeal Farm Network"
        description="Manage your farm and ranch business accounts on Oatmeal Farm Network."
        noIndex
      />
      <Header />

      <div className="container mx-auto px-4 py-8" style={{ maxWidth: '1300px' }}>

        <Breadcrumbs items={[{ label: t('nav.home'), to: '/' }, { label: t('accounts.heading') }]} />

        <div className="flex items-center justify-between mb-6 pb-3 border-b-2 border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">{t('accounts.heading')}</h2>
          {!loading && (
            <Link
              to={`/accounts/new?PeopleID=${peopleId}`}
              className="regsubmit2"
              style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}
            >
              {/* The key is absent from the translation file, and t() returns
                  the key itself when missing — a truthy string, so `|| 'Add
                  Account'` never fired and the button read
                  "accounts.add_account_btn". The fallback belongs in t(). */}
              + {t('accounts.add_account_btn', 'Add Account')}
            </Link>
          )}
        </div>

        {loading ? (
          <p className="text-gray-500 py-8">{t('accounts.loading')}</p>
        ) : businesses.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">{t('accounts.no_accounts')}</p>
            <Link to={`/accounts/new?PeopleID=${peopleId}`} className="regsubmit2">
              {t('accounts.add_first')}
            </Link>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>{t('accounts.th_name')}</th>
                <th style={thStyle}>{t('accounts.th_type')}</th>
                <th style={{ ...thStyle, minWidth: '110px' }}>{t('accounts.th_actions')}</th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((b, i) => (
                <React.Fragment key={b.BusinessID}>
                  <tr style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={tdStyle}>
                      <Link
                        to={`/account?PeopleID=${peopleId}&BusinessID=${b.BusinessID}`}
                        className="text-[#3D6B34] hover:underline font-medium"
                      >
                        {b.BusinessName}
                      </Link>
                    </td>
                    <td style={tdStyle} className="text-gray-600 text-sm">
                      {b.BusinessType || '—'}
                    </td>
                    <td style={tdStyle}>
                      <div className="flex items-center gap-2">
                        <Link to={`/account/users?PeopleID=${peopleId}&BusinessID=${b.BusinessID}`} title={t('accounts.ico_users')}>
                          <IcoUsers />
                        </Link>
                        <span className="text-gray-300">|</span>
                        <Link to={`/account/profile?BusinessID=${b.BusinessID}`} title={t('accounts.ico_edit')}>
                          <IcoEdit />
                        </Link>
                        <span className="text-gray-300">|</span>
                        <Link to={`/account/delete?BusinessID=${b.BusinessID}`} title={t('accounts.ico_delete')}>
                          <IcoDel />
                        </Link>
                      </div>
                    </td>
                  </tr>

                  <tr style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #E5E7EB' }}>
                    <td colSpan={3} style={{ padding: '0.25rem 1rem 0.6rem', fontSize: '0.82rem' }}>
                      {b.BusinessTypeID === FARM_RANCH_TYPE_ID ? (
                        <span className="flex gap-3 flex-wrap">
                          <Link to={`/account/livestock/add?BusinessID=${b.BusinessID}`} className="text-[#3D6B34] hover:underline">{t('accounts.sub_add_livestock')}</Link>
                          <span className="text-gray-300">|</span>
                          <Link to={`/account/livestock?BusinessID=${b.BusinessID}`} className="text-[#3D6B34] hover:underline">{t('accounts.sub_list_livestock')}</Link>
                          <span className="text-gray-300">|</span>
                          <Link to={`/account/produce?BusinessID=${b.BusinessID}`} className="text-[#3D6B34] hover:underline">{t('accounts.sub_produce')}</Link>
                          <span className="text-gray-300">|</span>
                          <Link to={`/account/orders?BusinessID=${b.BusinessID}`} className="text-[#3D6B34] hover:underline">{t('accounts.sub_orders')}</Link>
                        </span>
                      ) : (
                        <Link to={`/account/events?BusinessID=${b.BusinessID}`} className="text-[#3D6B34] hover:underline">{t('accounts.sub_events')}</Link>
                      )}
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Footer />
    </div>
  );
}

const thStyle = {
  padding: '0.75rem 1rem',
  textAlign: 'left',
  backgroundColor: '#F3F4F6',
  fontWeight: '600',
  color: '#4B5563',
  textTransform: 'uppercase',
  fontSize: '0.75rem',
  letterSpacing: '0.05em',
  borderBottom: '1px solid #E5E7EB',
};

const tdStyle = {
  padding: '0.75rem 1rem',
  textAlign: 'left',
  borderBottom: 'none',
  verticalAlign: 'middle',
};