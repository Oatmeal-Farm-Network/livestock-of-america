// Ported from Oatmeal Farm Network (src/AccountDelete.jsx). Page logic is unchanged;
// only the router package, the i18n hook, component paths, the API base env
// var and the people-id accessor differ. The LOA backend already serves the
// same endpoints this calls.
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useTranslation } from '../lib/i18n';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';
import { useBusinessId } from '../lib/useBusinessId';

const API_URL = import.meta.env.VITE_LIVESTOCK_API_URL || '';

export default function AccountDelete() {
  const { t } = useTranslation();
  // Falls back to the selected/displayed business; without this the page
  // bounced to /dashboard whenever the URL had no BusinessID.
  const { businessId, resolving } = useBusinessId();
  const navigate = useNavigate();

  const [business, setBusiness] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const peopleId = localStorage.getItem('people_id');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { navigate('/login'); return; }
    if (resolving) return;
    if (!businessId) { navigate('/dashboard'); return; }

    fetch(`${API_URL}/api/businesses/profile/${businessId}`)
      .then(r => r.json())
      .then(data => setBusiness(data))
      .catch(() => setError(t('account_delete.err_load')));
  }, [businessId]);

  const handleDelete = async () => {
    if (!confirmed) {
      setError(t('account_delete.err_confirm_required'));
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/businesses/delete/${businessId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      if (res.ok) {
        navigate('/dashboard', { state: { deleted: business?.BusinessName } });
      } else {
        const data = await res.json();
        setError(data.detail || t('account_delete.err_generic'));
      }
    } catch {
      setError(t('account_delete.err_generic'));
    } finally {
      setDeleting(false);
    }
  };

  if (!business && !error) return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Header />
      <div className="text-center py-20 text-gray-400">{t('account_delete.loading')}</div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <PageMeta
        title={t('account_delete.meta_title')}
        description={t('account_delete.meta_desc')}
        noIndex
      />
      <Header />

      <div style={{ maxWidth: '550px', margin: '2rem auto', padding: '0 1rem 3rem' }}>
        <Breadcrumbs items={[
          { label: t('account_delete.breadcrumb_home'), to: '/' },
          { label: t('account_delete.breadcrumb_accounts'), to: '/accounts' },
          { label: t('account_delete.breadcrumb_delete') },
        ]} />

        <Link
          to={`/account?PeopleID=${peopleId}&BusinessID=${businessId}`}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4"
        >
          {t('account_delete.back_link')}
        </Link>

        <div className="bg-white rounded-xl shadow border border-gray-100 p-8">

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-red-600">{t('account_delete.heading')}</h1>
          </div>

          <p className="text-gray-600 text-sm mb-6 leading-relaxed">{t('account_delete.warning_body')}</p>

          {business && (
            <div className="border border-gray-200 rounded-lg p-4 mb-6 bg-gray-50">
              <h2 className="font-bold text-gray-800 text-base mb-1">{business.BusinessName}</h2>
              {business.BusinessType && (
                <p className="text-sm text-gray-500">{t('account_delete.business_type', { type: business.BusinessType })}</p>
              )}
              {business.AddressCity && (
                <p className="text-sm text-gray-500">
                  {[business.AddressCity, business.AddressState].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          )}

          <label className="flex items-start gap-3 mb-6 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => { setConfirmed(e.target.checked); setError(null); }}
              className="mt-0.5"
            />
            <span className="text-sm text-gray-700">
              {t('account_delete.confirm_label_pre')}{' '}
              <strong>{business?.BusinessName}</strong>
              {t('account_delete.confirm_label_post')}
            </span>
          </label>

          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 rounded px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Link
              to={`/account?PeopleID=${peopleId}&BusinessID=${businessId}`}
              className="flex-1 text-center border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {t('account_delete.btn_cancel')}
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {deleting ? t('account_delete.btn_deleting') : t('account_delete.btn_delete')}
            </button>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}
