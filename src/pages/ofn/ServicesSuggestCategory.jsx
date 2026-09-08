// Ported from Oatmeal Farm Network (src/ServicesSuggestCategory.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from '../../lib/i18n';
import AccountLayout from '../../components/AccountLayout';
import { useAccount } from '../../lib/AccountContext';
import { useBusinessId } from '../../lib/useBusinessId';
import { getPeopleId } from '../../lib/auth';

const apiBase = import.meta.env.VITE_LIVESTOCK_API_URL || '';

export default function ServicesSuggestCategory() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // A bare URL used to post BusinessID: null.
  const { businessId: BusinessID } = useBusinessId();
  const PeopleID = getPeopleId();
  const { LoadBusiness } = useAccount();

  const [form, setForm] = useState({
    Categories: '',
    SubCategories: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (BusinessID) LoadBusiness(BusinessID);
  }, [BusinessID]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.Categories.trim()) return;
    setSaving(true);
    try {
      await fetch(`${apiBase}/api/services/suggest-category`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          BusinessID,
          BusinessName: Business?.BusinessName || '',
          Email: localStorage.getItem('email') || '',
          Categories: form.Categories,
          SubCategories: form.SubCategories,
        }),
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting suggestion:', err);
    }
    setSaving(false);
  };

  const inputStyle = {
    display: 'block', width: '100%', padding: '8px 12px',
    border: '1px solid #d5c9bc', borderRadius: 6, fontSize: 14,
    color: '#2c1a0e', background: '#fff', boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  return (
    <AccountLayout BusinessID={BusinessID} PeopleID={PeopleID} pageTitle={t('services_suggest.page_title')} breadcrumbs={[{ label: t('services_suggest.breadcrumb_dashboard'), to: '/dashboard' }, { label: t('services_suggest.breadcrumb_services') }, { label: t('services_suggest.breadcrumb_suggest') }]}>
      <div className="bg-white rounded-2xl shadow border border-gray-200 p-6" style={{ maxWidth: 1300 }}>

        <div style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 22, color: '#2c1a0e', marginBottom: 6 }}>
          {t('services_suggest.heading')}
        </div>
        <p style={{ color: '#7a6a5a', fontSize: 14, marginBottom: 24 }}>
          {t('services_suggest.intro')}
        </p>

        {submitted ? (
          <div style={{
            background: '#f0f7ee', border: '1px solid #b7d9b0',
            borderRadius: 8, padding: '20px 24px', marginBottom: 24,
          }}>
            <div style={{ fontWeight: 700, color: '#4a7c3f', fontSize: 15, marginBottom: 4 }}>
              {t('services_suggest.success_heading')}
            </div>
            <p style={{ color: '#5a7a54', fontSize: 14, margin: 0 }}>
              {t('services_suggest.success_body')}
            </p>
          </div>
        ) : (
          <>
            {/* Business name (read-only) */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#5a3e2b', marginBottom: 5 }}>
                {t('services_suggest.lbl_business_name')}
              </label>
              <input
                value={Business?.BusinessName || ''}
                readOnly
                style={{ ...inputStyle, background: '#f9f6f2', color: '#8b7355' }}
              />
            </div>

            {/* Suggested Categories */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#5a3e2b', marginBottom: 5 }}>
                {t('services_suggest.lbl_categories')}
              </label>
              <textarea
                value={form.Categories}
                onChange={e => set('Categories', e.target.value)}
                rows={3}
                placeholder={t('services_suggest.placeholder_categories')}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            {/* Suggested Sub-Categories */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#5a3e2b', marginBottom: 5 }}>
                {t('services_suggest.lbl_subcategories')}
              </label>
              <textarea
                value={form.SubCategories}
                onChange={e => set('SubCategories', e.target.value)}
                rows={3}
                placeholder={t('services_suggest.placeholder_subcategories')}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => navigate(`/services?BusinessID=${BusinessID}`)}
                style={{
                  background: 'none', border: '1px solid #d5c9bc', borderRadius: 6,
                  padding: '10px 20px', fontWeight: 600, fontSize: 14,
                  color: '#8b7355', cursor: 'pointer',
                }}
              >
                {t('services_suggest.btn_cancel')}
              </button>
              <button
                onClick={submit}
                disabled={saving || !form.Categories.trim()}
                style={{
                  background: saving || !form.Categories.trim() ? '#9ab' : '#5a3e2b',
                  color: '#fff', border: 'none', borderRadius: 6,
                  padding: '10px 28px', fontWeight: 700, fontSize: 15,
                  cursor: saving || !form.Categories.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? t('services_suggest.btn_sending') : t('services_suggest.btn_submit')}
              </button>
            </div>
          </>
        )}

        {submitted && (
          <button
            onClick={() => navigate(`/services?BusinessID=${BusinessID}`)}
            style={{
              background: '#5a3e2b', color: '#fff', border: 'none', borderRadius: 6,
              padding: '10px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}
          >
            {t('services_suggest.btn_back')}
          </button>
        )}

      </div>
    </AccountLayout>
  );
}
