// Ported from Oatmeal Farm Network (src/ServicesEdit.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
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

const Field = ({ label, hint, children }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#5a3e2b', marginBottom: 5 }}>
      {label}
    </label>
    {children}
    {hint && <div style={{ fontSize: 12, color: '#a08060', marginTop: 4 }}>{hint}</div>}
  </div>
);

const SaveBar = ({ saving, saved, onSave }) => {
  const { t } = useTranslation();
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 24 }}>
      {saved && <span style={{ color: '#4a7c3f', fontWeight: 600, fontSize: 14 }}>{t('services_edit.saved')}</span>}
      <button
        onClick={onSave}
        disabled={saving}
        style={{
          background: saving ? '#9ab' : '#5a3e2b', color: '#fff',
          border: 'none', borderRadius: 6, padding: '10px 28px',
          fontWeight: 700, fontSize: 15, cursor: saving ? 'not-allowed' : 'pointer',
        }}
      >
        {saving ? t('services_edit.btn_saving') : t('services_edit.btn_save_changes')}
      </button>
    </div>
  );
};

// ─── BASICS TAB ──────────────────────────────────────────────────────────────
function BasicsTab({ ServicesID, BusinessID }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!ServicesID) return;
    fetch(`${apiBase}/api/services/${ServicesID}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
    })
      .then(r => r.json())
      .then(d => {
        setForm(d);
        fetch(`${apiBase}/api/services/categories`)
          .then(r => r.json()).then(setCategories).catch(() => {});
        if (d.ServiceCategoryID) {
          fetch(`${apiBase}/api/services/categories/${d.ServiceCategoryID}/subcategories`)
            .then(r => r.json()).then(setSubCategories).catch(() => {});
        }
      });
  }, [ServicesID]);

  useEffect(() => {
    if (!form?.ServiceCategoryID) { setSubCategories([]); return; }
    fetch(`${apiBase}/api/services/categories/${form.ServiceCategoryID}/subcategories`)
      .then(r => r.json()).then(d => setSubCategories(Array.isArray(d) ? d : [])).catch(() => {});
  }, [form?.ServiceCategoryID]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`${apiBase}/api/services/${ServicesID}/update`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  if (!form) return <div style={{ padding: '40px 0', textAlign: 'center', color: '#8b7355' }}>{t('services_edit.loading')}</div>;

  return (
    <div>
      <div style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 17, color: '#2c1a0e', borderBottom: '1px solid #e8e0d5', paddingBottom: 8, marginBottom: 20 }}>
        {t('services_edit.basics_heading')}
      </div>

      <Field label={t('services_edit.lbl_title')}>
        <input value={form.ServiceTitle || ''} onChange={e => set('ServiceTitle', e.target.value)} maxLength={50} style={inputStyle} />
      </Field>

      <Field label={t('services_edit.lbl_category')}>
        <select
          value={form.ServiceCategoryID || ''}
          onChange={e => { set('ServiceCategoryID', e.target.value); set('ServiceSubCategoryID', ''); }}
          style={inputStyle}
        >
          <option value="">{t('services_edit.select_category')}</option>
          {categories.map(c => (
            <option key={c.ServiceCategoryID} value={c.ServiceCategoryID}>{c.ServicesCategory}</option>
          ))}
        </select>
      </Field>

      {subCategories.length > 0 && (
        <Field label={t('services_edit.lbl_subcategory')}>
          <select value={form.ServiceSubCategoryID || ''} onChange={e => set('ServiceSubCategoryID', e.target.value)} style={inputStyle}>
            <option value="">{t('services_edit.select_subcategory')}</option>
            {subCategories.map(s => (
              <option key={s.ServiceSubCategoryID} value={s.ServiceSubCategoryID}>{s.ServiceSubCategoryName}</option>
            ))}
          </select>
        </Field>
      )}

      <Field label={t('services_edit.lbl_price')}>
        <input type="number" value={form.ServicePrice || ''} onChange={e => set('ServicePrice', e.target.value)} style={{ ...inputStyle, maxWidth: 180 }} placeholder="0.00" />
      </Field>

      <Field label={t('services_edit.lbl_contact_for_price')}>
        <div style={{ display: 'flex', gap: 24 }}>
          {[['Yes', '1'], ['No', '0']].map(([label, val]) => (
            <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
              <input
                type="radio"
                name="ServiceContactForPrice"
                checked={String(form.ServiceContactForPrice) === val}
                onChange={() => set('ServiceContactForPrice', val)}
              />
              {label === 'Yes' ? t('services_edit.radio_yes') : t('services_edit.radio_no')}
            </label>
          ))}
        </div>
      </Field>

      <Field label={t('services_edit.lbl_availability')}>
        <input value={form.ServiceAvailable || ''} onChange={e => set('ServiceAvailable', e.target.value)} style={inputStyle} placeholder={t('services_edit.availability_placeholder')} />
      </Field>

      <Field label={t('services_edit.lbl_description')}>
        <textarea value={form.ServicesDescription || ''} onChange={e => set('ServicesDescription', e.target.value)} rows={6} style={{ ...inputStyle, resize: 'vertical' }} />
      </Field>

      <div style={{ background: '#f9f6f2', border: '1px solid #e8e0d5', borderRadius: 8, padding: '16px 18px', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#5a3e2b', marginBottom: 12 }}>
          {t('services_edit.contact_heading')} <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 12 }}>{t('services_edit.contact_optional')}</span>
        </div>
        <Field label={t('services_edit.lbl_phone')}>
          <input value={form.ServicePhone || ''} onChange={e => set('ServicePhone', e.target.value)} style={inputStyle} placeholder="555-123-4567" />
        </Field>
        <Field label={t('services_edit.lbl_website')}>
          <input value={form.Servicewebsite || ''} onChange={e => set('Servicewebsite', e.target.value)} style={inputStyle} placeholder="www.yoursite.com" />
        </Field>
        <Field label={t('services_edit.lbl_email')}>
          <input type="email" value={form.Serviceemail || ''} onChange={e => set('Serviceemail', e.target.value)} style={inputStyle} placeholder="info@yourfarm.com" />
        </Field>
      </div>

      <SaveBar saving={saving} saved={saved} onSave={save} />
    </div>
  );
}

// ─── PHOTOS TAB ──────────────────────────────────────────────
// Talks to /api/services/{id}/photos, /photos/upload, /photos/{slot}/remove and
// /photos/{slot}/caption. Those routes exist now — they had been defined on the
// produce router, whose prefix put them at /api/produce/... so every call from
// here 404'd until they were moved.
//
// Six slots. The table carries Photo1..Photo8, but only the first six are
// offered and the backend refuses any slot outside that range.
const MAX_SERVICE_PHOTOS = 6;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

function PhotosTab({ ServicesID }) {
  const { t } = useTranslation();
  const emptySlots = () => Array.from({ length: MAX_SERVICE_PHOTOS },
    (_, i) => ({ slot: i + 1, url: '', caption: '' }));
  const [photos, setPhotos] = useState(emptySlots);
  const [uploading, setUploading] = useState(null);
  const [saving, setSaving] = useState(null);
  // Failures used to reach console.error only, so a rejected upload looked
  // exactly like nothing happening. Slot 0 holds page-level errors.
  const [errors, setErrors] = useState({});
  const setError = (slot, msg) => setErrors(e => ({ ...e, [slot]: msg }));

  useEffect(() => {
    if (!ServicesID) return;
    fetch(`${apiBase}/api/services/${ServicesID}/photos`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
    })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(d => { if (Array.isArray(d) && d.length) setPhotos(d); })
      .catch(() => setError(0, t('services_edit.photo_error_load')));
  }, [ServicesID]);

  const setCaption = (slot, val) =>
    setPhotos(ps => ps.map(p => (p.slot === slot ? { ...p, caption: val } : p)));

  const uploadPhoto = async (slot, file) => {
    // Checked here as well as on the server, so the two common mistakes do not
    // cost a round trip of the whole file.
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError(slot, t('services_edit.photo_error_type'));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError(slot, t('services_edit.photo_error_size'));
      return;
    }
    setError(slot, null);
    setUploading(slot);
    const fd = new FormData();
    fd.append('file', file);
    try {
      // slot is a query parameter on the endpoint, not part of the form body.
      const res = await fetch(
        `${apiBase}/api/services/${ServicesID}/photos/upload?slot=${slot}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
          body: fd,
        });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || t('services_edit.photo_error_upload'));
      setPhotos(ps => ps.map(p => (p.slot === slot ? { ...p, url: data.url } : p)));
    } catch (e) {
      setError(slot, e.message || t('services_edit.photo_error_upload'));
    }
    setUploading(null);
  };

  const removePhoto = async (slot) => {
    setError(slot, null);
    try {
      const res = await fetch(`${apiBase}/api/services/${ServicesID}/photos/${slot}/remove`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setPhotos(ps => ps.map(p => (p.slot === slot ? { ...p, url: '', caption: '' } : p)));
    } catch {
      setError(slot, t('services_edit.photo_error_remove'));
    }
  };

  const saveCaption = async (slot, caption) => {
    setError(slot, null);
    setSaving(slot);
    try {
      const res = await fetch(`${apiBase}/api/services/${ServicesID}/photos/${slot}/caption`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ caption }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      setError(slot, t('services_edit.photo_error_caption'));
    }
    setSaving(null);
  };

  const used = photos.filter(p => p.url).length;

  return (
    <div>
      <div style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 17, color: '#2c1a0e', borderBottom: '1px solid #e8e0d5', paddingBottom: 8, marginBottom: 20 }}>
        {t('services_edit.photos_heading')}
      </div>
      <p style={{ color: '#7a6a5a', fontSize: 13, marginBottom: 6 }}>
        {t('services_edit.photos_subtitle')}
      </p>
      <p style={{ color: '#8b7355', fontSize: 12, marginBottom: 24 }}>
        {t('services_edit.photos_used', { used, max: MAX_SERVICE_PHOTOS })}
      </p>
      {errors[0] && (
        <p style={{ color: '#c0392b', fontSize: 13, marginBottom: 16 }}>{errors[0]}</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {photos.map(photo => (
          <div key={photo.slot} style={{ border: '1px solid #e8e0d5', borderRadius: 10, padding: 16, background: '#faf7f4' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#5a3e2b', marginBottom: 10 }}>
              {t('services_edit.photo_slot', { slot: photo.slot })}
            </div>

            {/* Preview */}
            <div style={{ width: '100%', height: 160, background: '#f0ebe3', borderRadius: 6, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {photo.url ? (
                <img
                  src={photo.url}
                  alt={photo.caption
                    ? t('services_edit.photo_alt_captioned', { caption: photo.caption })
                    : t('services_edit.photo_alt', { slot: photo.slot })}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }}
                />
              ) : (
                <span style={{ color: '#c0a882', fontSize: 13 }}>{t('services_edit.no_image')}</span>
              )}
            </div>

            {/* Upload */}
            <label style={{ display: 'block', marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#5a3e2b', marginBottom: 4 }}>
                {photo.url ? t('services_edit.replace_photo') : t('services_edit.upload_photo')}
              </div>
              <input
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(',')}
                onChange={e => {
                  const f = e.target.files[0];
                  if (f) uploadPhoto(photo.slot, f);
                  // Cleared so re-picking the same file fires onChange again.
                  e.target.value = '';
                }}
                disabled={uploading === photo.slot}
                style={{ fontSize: 12, width: '100%' }}
              />
              {uploading === photo.slot && (
                <div style={{ fontSize: 12, color: '#8b7355', marginTop: 4 }}>{t('services_edit.uploading')}</div>
              )}
            </label>

            {errors[photo.slot] && (
              <div style={{ color: '#c0392b', fontSize: 12, marginBottom: 8 }}>{errors[photo.slot]}</div>
            )}

            {/* Caption */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <input
                value={photo.caption || ''}
                onChange={e => setCaption(photo.slot, e.target.value)}
                maxLength={256}
                placeholder={t('services_edit.caption_placeholder')}
                style={{ ...inputStyle, fontSize: 12, padding: '5px 8px', flex: 1 }}
              />
              <button
                onClick={() => saveCaption(photo.slot, photo.caption)}
                disabled={saving === photo.slot}
                style={{ background: '#5a3e2b', color: '#fff', border: 'none', borderRadius: 5, padding: '5px 10px', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {saving === photo.slot ? t('services_edit.btn_saving_caption') : t('services_edit.btn_save_caption')}
              </button>
            </div>

            {/* Remove */}
            {photo.url && (
              <button
                onClick={() => removePhoto(photo.slot)}
                style={{ background: 'none', border: '1px solid #e0b0b0', borderRadius: 5, padding: '4px 12px', fontSize: 12, color: '#c0392b', cursor: 'pointer', width: '100%' }}
              >
                {t('services_edit.btn_remove_image')}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function ServicesEdit() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ServicesID = searchParams.get('ServicesID');
  // Feeds the back-links, which otherwise read /services?BusinessID=null.
  const { businessId: BusinessID } = useBusinessId();
  const PeopleID = getPeopleId();
  const { LoadBusiness } = useAccount();
  // ?tab=photos lets the list's Photos link open straight onto that tab.
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') === 'photos' ? 'photos' : 'basics');
  const [serviceTitle, setServiceTitle] = useState('');

  const TABS = [
    { id: 'basics', label: t('services_edit.tab_basics') },
    { id: 'photos', label: t('services_edit.tab_photos') },
  ];

  useEffect(() => {
    if (BusinessID) LoadBusiness(BusinessID);
    if (!ServicesID) return;
    fetch(`${apiBase}/api/services/${ServicesID}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
    })
      .then(r => r.json())
      .then(d => setServiceTitle(d.ServiceTitle || t('services_edit.default_title')))
      .catch(() => {});
  }, [BusinessID, ServicesID]);

  if (!ServicesID) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#7a6a5a' }}>
      {t('services_edit.no_service_msg')} <a href={`/services?BusinessID=${BusinessID}`} style={{ color: '#5a3e2b' }}>{t('services_edit.no_service_back')}</a>
    </div>
  );

  const tabComponents = {
    basics: <BasicsTab ServicesID={ServicesID} BusinessID={BusinessID} />,
    photos: <PhotosTab ServicesID={ServicesID} />,
  };

  return (
    <AccountLayout BusinessID={BusinessID} PeopleID={PeopleID} pageTitle={t('services_edit.page_title')} breadcrumbs={[{ label: t('common.dashboard'), to: '/dashboard' }, { label: t('services_edit.breadcrumb_my_services') }, { label: t('services_edit.breadcrumb_my_services'), to: `/services?BusinessID=${BusinessID}` }, { label: t('common.edit') }]}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 0 60px' }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: 13, color: '#8b7355', marginBottom: 14 }}>
          <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate(`/services?BusinessID=${BusinessID}`)}>
            {t('services_edit.breadcrumb_my_services')}
          </span>
          {' › '}
          <span style={{ color: '#2c1a0e' }}>{serviceTitle || t('services_edit.default_title')}</span>
        </div>

        {/* Header */}
        <div style={{ background: '#fff', border: '1px solid #e8e0d5', borderRadius: 10, padding: '16px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 20, color: '#2c1a0e', fontFamily: 'Georgia, serif' }}>{serviceTitle || t('services_edit.default_title')}</div>
          <button
            onClick={() => navigate(`/services?BusinessID=${BusinessID}`)}
            style={{ background: 'none', border: '1px solid #d5c9bc', borderRadius: 6, padding: '7px 18px', fontWeight: 600, fontSize: 13, color: '#8b7355', cursor: 'pointer' }}
          >
            {t('services_edit.btn_back')}
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #e8e0d5', marginBottom: 28 }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none', border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #5a3e2b' : '2px solid transparent',
                marginBottom: -2, padding: '10px 24px',
                fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? '#5a3e2b' : '#8b7355',
                fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ background: '#fff', border: '1px solid #e8e0d5', borderRadius: 10, padding: '28px 32px', boxShadow: '0 2px 12px rgba(90,62,43,0.06)' }}>
          {tabComponents[activeTab]}
        </div>

      </div>
    </AccountLayout>
  );
}
