// Ported from Oatmeal Farm Network (src/SellerStripeConnect.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
// src/SellerStripeConnect.jsx
// Seller-side Stripe Connect onboarding panel. Lives at /account/stripe-connect?BusinessID=X.
// Status flows: not started → in progress → connected (payouts + charges enabled).
import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation } from '../../lib/i18n';
import AccountLayout from '../../components/AccountLayout';

const API = import.meta.env.VITE_LIVESTOCK_API_URL || '';

function authHeaders() {
  const tok = localStorage.getItem('access_token');
  return tok ? { Authorization: `Bearer ${tok}` } : {};
}

export default function SellerStripeConnect() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const businessId = params.get('BusinessID');
  const justReturned = params.get('return') === '1';

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const fetchStatus = useCallback(async () => {
    if (!businessId) { setLoading(false); return; }
    setLoading(true); setErr('');
    try {
      const r = await fetch(`${API}/api/marketplace/payments/connect-account/${businessId}`, {
        headers: authHeaders(),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.detail || `HTTP ${r.status}`);
      }
      setStatus(await r.json());
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // After the seller returns from Stripe onboarding, force a sync so our DB
  // row reflects the latest state without waiting on the webhook.
  useEffect(() => {
    if (!justReturned || !businessId) return;
    (async () => {
      try {
        await fetch(`${API}/api/marketplace/payments/connect-account/${businessId}/sync`, {
          method: 'POST', headers: authHeaders(),
        });
      } catch {}
      fetchStatus();
    })();
  }, [justReturned, businessId, fetchStatus]);

  const startOnboarding = async () => {
    if (!businessId) return;
    setBusy(true); setErr('');
    try {
      const endpoint = status?.connected
        ? `/api/marketplace/payments/connect-account/${businessId}/onboarding-link`
        : `/api/marketplace/payments/connect-account/${businessId}/create`;
      const r = await fetch(`${API}${endpoint}`, {
        method: 'POST', headers: authHeaders(),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || `HTTP ${r.status}`);
      if (data.onboarding_url) {
        window.location.href = data.onboarding_url;
      } else {
        throw new Error(t('stripe_connect.err_no_url'));
      }
    } catch (e) {
      setErr(e.message || String(e));
      setBusy(false);
    }
  };

  const syncNow = async () => {
    if (!businessId) return;
    setBusy(true); setErr('');
    try {
      const r = await fetch(`${API}/api/marketplace/payments/connect-account/${businessId}/sync`, {
        method: 'POST', headers: authHeaders(),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.detail || `HTTP ${r.status}`);
      }
      await fetchStatus();
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const content = (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{t('stripe_connect.heading')}</h1>
        <p className="text-sm text-gray-600 mt-1">{t('stripe_connect.intro')}</p>
      </div>

      {!businessId && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800">
          {t('stripe_connect.no_business_id')}
        </div>
      )}

      {err && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800">
          {err}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-400">{t('stripe_connect.loading')}</div>
      ) : status && businessId ? (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
          <StatusRow
            label={t('stripe_connect.lbl_account')}
            ok={status.connected}
            okText={status.account_id}
            notText={t('stripe_connect.not_created')}
          />
          <StatusRow
            label={t('stripe_connect.lbl_onboarding')}
            ok={status.onboarding_complete}
            okText={t('stripe_connect.onboarding_complete')}
            notText={t('stripe_connect.onboarding_incomplete')}
          />
          <StatusRow
            label={t('stripe_connect.lbl_charges')}
            ok={status.charges_enabled}
            okText={t('stripe_connect.charges_yes')}
            notText={t('stripe_connect.not_yet')}
          />
          <StatusRow
            label={t('stripe_connect.lbl_payouts')}
            ok={status.payouts_enabled}
            okText={t('stripe_connect.payouts_yes')}
            notText={t('stripe_connect.not_yet')}
          />

          <div className="flex gap-3 justify-end pt-3 border-t border-gray-100">
            {status.connected && (
              <button
                onClick={syncNow}
                disabled={busy}
                className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {t('stripe_connect.btn_refresh')}
              </button>
            )}
            <button
              onClick={startOnboarding}
              disabled={busy}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#3D6B34] text-white hover:bg-[#2f5328] disabled:opacity-50"
            >
              {busy
                ? t('stripe_connect.btn_opening')
                : !status.connected
                  ? t('stripe_connect.btn_connect')
                  : status.onboarding_complete
                    ? t('stripe_connect.btn_update')
                    : t('stripe_connect.btn_continue')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );

  return <AccountLayout>{content}</AccountLayout>;
}

function StatusRow({ label, ok, okText, notText }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm font-semibold text-gray-700">{label}</span>
      <span className={`text-sm ${ok ? 'text-green-700' : 'text-gray-500'}`}>
        <span className={`inline-block w-2 h-2 rounded-full mr-2 align-middle ${ok ? 'bg-green-500' : 'bg-gray-300'}`} />
        {ok ? okText : notText}
      </span>
    </div>
  );
}
