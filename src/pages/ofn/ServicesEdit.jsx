// Ported from Oatmeal Farm Network (src/ServicesEdit.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
import React, { useEffect, useRef, useState } from 'react';
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

      <Field label={t('services_edit.lbl_listing_status')}>
        <select
          value={String(form.ServiceAvailable) === '1' ? '1' : '0'}
          onChange={e => set('ServiceAvailable', e.target.value)}
          style={inputStyle}
        >
          <option value="1">{t('services_edit.opt_listed')}</option>
          <option value="0">{t('services_edit.opt_hidden')}</option>
        </select>
        <p style={{ fontSize: 12, color: '#7a6a5a', margin: '4px 0 0' }}>
          {t('services_edit.listing_status_hint')}
        </p>
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
  // Which dropzone is under the pointer: a slot number, or 'all' for the bulk
  // zone. One value rather than a flag per slot, since only one can be active.
  const [dragTarget, setDragTarget] = useState(null);
  // Failures used to reach console.error only, so a rejected upload looked
  // exactly like nothing happening. Slot 0 holds page-level errors.
  const [errors, setErrors] = useState({});
  const setError = (slot, msg) => setErrors(e => ({ ...e, [slot]: msg }));
  const slotInputs = useRef({});
  const bulkInput = useRef(null);

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

  // Checked here as well as on the server, so the two common mistakes do not
  // cost a round trip of the whole file.
  const rejectReason = (file) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return t('services_edit.photo_error_type');
    if (file.size > MAX_IMAGE_BYTES) return t('services_edit.photo_error_size');
    return null;
  };

  const uploadPhoto = async (slot, file) => {
    const bad = rejectReason(file);
    if (bad) { setError(slot, bad); return false; }
    setError(slot, null);
    setUploading(slot);
    const fd = new FormData();
    fd.append('file', file);
    let ok = false;
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
      ok = true;
    } catch (e) {
      setError(slot, e.message || t('services_edit.photo_error_upload'));
    }
    setUploading(null);
    return ok;
  };

  // Dropping or picking several at once fills the empty slots in order. Free
  // slots are worked out before the first upload, so the sequence is stable
  // even though each upload updates state as it lands.
  const uploadMany = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const free = photos.filter(p => !p.url).map(p => p.slot);
    if (!free.length) {
      setError(0, t('services_edit.photos_full', { max: MAX_SERVICE_PHOTOS }));
      return;
    }
    const taking = files.slice(0, free.length);
    const skipped = files.length - taking.length;
    setError(0, skipped > 0
      ? t('services_edit.photos_no_room', { skipped, free: free.length })
      : null);
    for (let i = 0; i < taking.length; i += 1) {
      await uploadPhoto(free[i], taking[i]);
    }
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

  // Shared by both kinds of dropzone. dragenter/dragover must both preventDefault
  // or the browser navigates to the dropped file instead of firing onDrop.
  const dropHandlers = (target, onFiles) => ({
    onDragEnter: e => { e.preventDefault(); setDragTarget(target); },
    onDragOver: e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setDragTarget(target); },
    onDragLeave: e => {
      // Ignore the events fired when moving over a child element.
      if (!e.currentTarget.contains(e.relatedTarget)) setDragTarget(null);
    },
    onDrop: e => { e.preventDefault(); setDragTarget(null); onFiles(e.dataTransfer.files); },
  });

  const used = photos.filter(p => p.url).length;
  const full = used >= MAX_SERVICE_PHOTOS;

  return (
    <div>
      <div style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 17, color: '#2c1a0e', borderBottom: '1px solid #e8e0d5', paddingBottom: 8, marginBottom: 20 }}>
        {t('services_edit.photos_heading')}
      </div>
      <p style={{ color: '#7a6a5a', fontSize: 13, marginBottom: 6 }}>
        {t('services_edit.photos_subtitle')}
      </p>
      <p style={{ color: '#8b7355', fontSize: 12, marginBottom: 16 }}>
        {t('services_edit.photos_used', { used, max: MAX_SERVICE_PHOTOS })}
      </p>

      {/* Bulk dropzone: drop several at once and they fill the free slots. */}
      <div
        {...dropHandlers('all', uploadMany)}
        onClick={() => !full && bulkInput.current?.click()}
        onKeyDown={e => {
          if (full) return;
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); bulkInput.current?.click(); }
        }}
        role="button"
        tabIndex={full ? -1 : 0}
        aria-label={t('services_edit.photos_dropzone_aria')}
        style={{
          border: `2px dashed ${dragTarget === 'all' ? '#3b82f6' : '#d9cbb8'}`,
          borderRadius: 12,
          padding: '22px 16px',
          textAlign: 'center',
          cursor: full ? 'not-allowed' : 'pointer',
          background: dragTarget === 'all' ? '#eff6ff' : '#faf7f4',
          transition: 'all 0.15s',
          marginBottom: 20,
          opacity: full ? 0.6 : 1,
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 6 }} aria-hidden="true">🖼</div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: dragTarget === 'all' ? '#2563eb' : '#5a3e2b' }}>
          {full
            ? t('services_edit.photos_full', { max: MAX_SERVICE_PHOTOS })
            : dragTarget === 'all'
              ? t('services_edit.photos_drop_now')
              : t('services_edit.photos_dropzone')}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 11, color: '#8b7355' }}>
          {t('services_edit.photos_dropzone_hint', { max: MAX_SERVICE_PHOTOS })}
        </p>
        <input
          ref={bulkInput}
          type="file"
          multiple
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          style={{ display: 'none' }}
          onChange={e => { uploadMany(e.target.files); e.target.value = ''; }}
        />
      </div>

      {errors[0] && (
        <p style={{ color: '#c0392b', fontSize: 13, marginBottom: 16 }}>{errors[0]}</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {photos.map(photo => {
          const active = dragTarget === photo.slot;
          return (
            <div key={photo.slot} style={{ border: '1px solid #e8e0d5', borderRadius: 10, padding: 16, background: '#faf7f4' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#5a3e2b', marginBottom: 10 }}>
                {t('services_edit.photo_slot', { slot: photo.slot })}
              </div>

              {/* Preview doubles as this slot's dropzone and file picker. */}
              <div
                {...dropHandlers(photo.slot, files => files[0] && uploadPhoto(photo.slot, files[0]))}
                onClick={() => slotInputs.current[photo.slot]?.click()}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    slotInputs.current[photo.slot]?.click();
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={photo.url
                  ? t('services_edit.photo_replace_aria', { slot: photo.slot })
                  : t('services_edit.photo_add_aria', { slot: photo.slot })}
                style={{
                  width: '100%', height: 160,
                  background: active ? '#eff6ff' : '#f0ebe3',
                  border: `2px dashed ${active ? '#3b82f6' : 'transparent'}`,
                  borderRadius: 6, marginBottom: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', cursor: 'pointer', position: 'relative',
                  transition: 'all 0.15s',
                }}
              >
                {photo.url ? (
                  <img
                    src={photo.url}
                    alt={photo.caption
                      ? t('services_edit.photo_alt_captioned', { caption: photo.caption })
                      : t('services_edit.photo_alt', { slot: photo.slot })}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6,
                             opacity: active ? 0.4 : 1, transition: 'opacity 0.15s' }}
                  />
                ) : (
                  <span style={{ color: active ? '#2563eb' : '#c0a882', fontSize: 13, padding: '0 10px', textAlign: 'center' }}>
                    {active ? t('services_edit.photo_drop_now') : t('services_edit.photo_empty_hint')}
                  </span>
                )}
                {photo.url && active && (
                  <span style={{ position: 'absolute', fontSize: 13, fontWeight: 700, color: '#2563eb' }}>
                    {t('services_edit.photo_drop_replace')}
                  </span>
                )}
                {uploading === photo.slot && (
                  <span style={{ position: 'absolute', inset: 0, background: 'rgba(250,247,244,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#5a3e2b' }}>
                    {t('services_edit.uploading')}
                  </span>
                )}
                <input
                  ref={el => { slotInputs.current[photo.slot] = el; }}
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES.join(',')}
                  style={{ display: 'none' }}
                  onChange={e => {
                    const f = e.target.files[0];
                    if (f) uploadPhoto(photo.slot, f);
                    // Cleared so re-picking the same file fires onChange again.
                    e.target.value = '';
                  }}
                />
              </div>

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
          );
        })}
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
