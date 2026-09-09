// Ported from Oatmeal Farm Network (src/ServicesAdd.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from '../../lib/i18n';
import AccountLayout from '../../components/AccountLayout';
import { useAccount } from '../../lib/AccountContext';
import { useBusinessId } from '../../lib/useBusinessId';
import { getPeopleId } from '../../lib/auth';

const apiBase = import.meta.env.VITE_LIVESTOCK_API_URL || '';

const inputStyle = {
  display: 'block', width: '100%', padding: '8px 12px',
  border: '1px solid #d5c9bc', borderRadius: 6, fontSize: 14,
  color: '#2c1a0e', background: '#fff', boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const selectStyle = { ...inputStyle };

const Field = ({ label, error, children, hint }) => (
  <div style={{ marginBottom: 18 }}>
    <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#5a3e2b', marginBottom: 5 }}>
      {label}
    </label>
    {children}
    {hint && <div style={{ fontSize: 12, color: '#a08060', marginTop: 4 }}>{hint}</div>}
    {error && <div style={{ fontSize: 12, color: '#c0392b', marginTop: 4 }}>{error}</div>}
  </div>
);

export default function ServicesAdd() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Without this a bare /services/add loaded no categories and posted
  // BusinessID: null.
  const { businessId: BusinessID, resolving } = useBusinessId();
  const PeopleID = getPeopleId();
  const { LoadBusiness } = useAccount();

  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [form, setForm] = useState({
    ServiceTitle: '',
    ServiceCategoryID: '',
    ServiceSubCategoryID: '',
    ServicePrice: '',
    // smallint publish flag, not free text. Default to listed.
    ServiceAvailable: '1',
    ServiceContactForPrice: '0',
    ServicePhone: '',
    Servicewebsite: '',
    Serviceemail: '',
    ServicesDescription: '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (resolving || !BusinessID) return;
    LoadBusiness(BusinessID);
    fetch(`${apiBase}/api/services/categories`)
      .then(r => r.json())
      .then(d => setCategories(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [BusinessID, resolving]);

  useEffect(() => {
    if (!form.ServiceCategoryID) { setSubCategories([]); return; }
    fetch(`${apiBase}/api/services/categories/${form.ServiceCategoryID}/subcategories`)
      .then(r => r.json())
      .then(d => setSubCategories(Array.isArray(d) ? d : []))
      .catch(() => setSubCategories([]));
  }, [form.ServiceCategoryID]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const errs = {};
    if (!form.ServiceTitle.trim()) errs.ServiceTitle = t('services_add.err_title_required');
    if (!form.ServiceCategoryID) errs.ServiceCategoryID = t('services_add.err_category_required');
    return errs;
  };

  const submit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/api/services/add`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...form, BusinessID }),
      });
      const data = await res.json();
      if (data.ServicesID) {
        navigate(`/services/edit?BusinessID=${BusinessID}&ServicesID=${data.ServicesID}`);
      }
    } catch (err) {
      console.error('Error adding service:', err);
    }
    setSaving(false);
  };

  return (
    <AccountLayout BusinessID={BusinessID} PeopleID={PeopleID} pageTitle={t('services_add.page_title')} breadcrumbs={[{ label: t('services_add.breadcrumb_dashboard'), to: '/dashboard' }, { label: t('services_add.breadcrumb_services') }, { label: t('services_add.breadcrumb_my_services'), to: `/services?BusinessID=${BusinessID}` }, { label: t('services_add.breadcrumb_add') }]}>
      <div className="bg-white rounded-2xl shadow border border-gray-200 p-6" style={{ maxWidth: 600 }}>

        <div style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 22, color: '#2c1a0e', marginBottom: 6 }}>
          {t('services_add.heading')}
        </div>
        <p style={{ color: '#7a6a5a', fontSize: 14, marginBottom: 24 }}>
          {t('services_add.subheading')}
        </p>

        <Field label={t('services_add.lbl_title')} error={errors.ServiceTitle} hint={t('services_add.hint_title')}>
          <input
            value={form.ServiceTitle}
            onChange={e => set('ServiceTitle', e.target.value)}
            maxLength={50}
            style={inputStyle}
            placeholder={t('services_add.placeholder_title')}
          />
        </Field>

        <Field label={t('services_add.lbl_category')} error={errors.ServiceCategoryID}>
          <select
            value={form.ServiceCategoryID}
            onChange={e => { set('ServiceCategoryID', e.target.value); set('ServiceSubCategoryID', ''); }}
            style={selectStyle}
          >
            <option value="">{t('services_add.select_category')}</option>
            {categories.map(c => (
              <option key={c.ServiceCategoryID} value={c.ServiceCategoryID}>{c.ServicesCategory}</option>
            ))}
          </select>
        </Field>

        {subCategories.length > 0 && (
          <Field label={t('services_add.lbl_subcategory')}>
            <select
              value={form.ServiceSubCategoryID}
              onChange={e => set('ServiceSubCategoryID', e.target.value)}
              style={selectStyle}
            >
              <option value="">{t('services_add.select_subcategory')}</option>
              {subCategories.map(s => (
                <option key={s.ServiceSubCategoryID} value={s.ServiceSubCategoryID}>{s.ServiceSubCategoryName}</option>
              ))}
            </select>
          </Field>
        )}

        <Field label={t('services_add.lbl_price')} hint={t('services_add.hint_price')}>
          <input
            type="number"
            value={form.ServicePrice}
            onChange={e => set('ServicePrice', e.target.value)}
            style={{ ...inputStyle, maxWidth: 180 }}
            placeholder="0.00"
          />
        </Field>

        <Field label={t('services_add.lbl_contact_for_price')}>
          <div style={{ display: 'flex', gap: 24 }}>
            {[['1', t('services_add.yes')], ['0', t('services_add.no')]].map(([val, label]) => (
              <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="radio"
                  name="ServiceContactForPrice"
                  value={val}
                  checked={form.ServiceContactForPrice === val}
                  onChange={() => set('ServiceContactForPrice', val)}
                />
                {label}
              </label>
            ))}
          </div>
        </Field>

        <Field label={t('services_add.lbl_listing_status')}>
          <select
            value={form.ServiceAvailable}
            onChange={e => set('ServiceAvailable', e.target.value)}
            style={inputStyle}
          >
            <option value="1">{t('services_add.opt_listed')}</option>
            <option value="0">{t('services_add.opt_hidden')}</option>
          </select>
          <p style={{ fontSize: 12, color: '#7a6a5a', margin: '4px 0 0' }}>
            {t('services_add.listing_status_hint')}
          </p>
        </Field>

        <Field label={t('services_add.lbl_description')}>
          <textarea
            value={form.ServicesDescription}
            onChange={e => set('ServicesDescription', e.target.value)}
            rows={5}
            style={{ ...inputStyle, resize: 'vertical' }}
            placeholder={t('services_add.placeholder_description')}
          />
        </Field>

        <div style={{
          background: '#f9f6f2', border: '1px solid #e8e0d5',
          borderRadius: 8, padding: '16px 18px', marginBottom: 18,
        }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#5a3e2b', marginBottom: 12 }}>
            {t('services_add.contact_info_heading')} <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 12 }}>({t('services_add.optional')})</span>
          </div>
          <Field label={t('services_add.lbl_phone')}>
            <input value={form.ServicePhone} onChange={e => set('ServicePhone', e.target.value)} style={inputStyle} placeholder={t('services_add.placeholder_phone')} />
          </Field>
          <Field label={t('services_add.lbl_website')}>
            <input value={form.Servicewebsite} onChange={e => set('Servicewebsite', e.target.value)} style={inputStyle} placeholder={t('services_add.placeholder_website')} />
          </Field>
          <Field label={t('services_add.lbl_email')}>
            <input type="email" value={form.Serviceemail} onChange={e => set('Serviceemail', e.target.value)} style={inputStyle} placeholder={t('services_add.placeholder_email')} />
          </Field>
        </div>

        <p style={{ fontSize: 13, color: '#8b7355', marginBottom: 24 }}>
          {t('services_add.suggest_category_prompt')}{' '}
          <a href={`/services/suggest-category?BusinessID=${BusinessID}`} style={{ color: '#5a3e2b', textDecoration: 'underline' }}>
            {t('services_add.suggest_category_link')}
          </a>
        </p>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'flex-end' }}>
          <button
            onClick={() => navigate(`/services?BusinessID=${BusinessID}`)}
            style={{
              background: 'none', border: '1px solid #d5c9bc', borderRadius: 6,
              padding: '10px 20px', fontWeight: 600, fontSize: 14,
              color: '#8b7355', cursor: 'pointer',
            }}
          >
            {t('services_add.btn_cancel')}
          </button>
          <button
            onClick={submit}
            disabled={saving}
            style={{
              background: saving ? '#9ab' : '#5a3e2b',
              color: '#fff', border: 'none', borderRadius: 6,
              padding: '10px 28px', fontWeight: 700, fontSize: 15,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? t('services_add.btn_saving') : t('services_add.btn_save')}
          </button>
        </div>

      </div>
    </AccountLayout>
  );
}