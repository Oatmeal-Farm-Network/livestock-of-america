// Ported from Oatmeal Farm Network (src/MyEquipmentListings.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
// src/MyEquipmentListings.jsx
// Route: /equipment/my-listings  (requires auth)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Breadcrumbs from '../../components/Breadcrumbs';
import { useAccount } from '../../lib/AccountContext';
import { useTranslation } from '../../lib/i18n';
import PageMeta from '../../components/PageMeta';

const API = import.meta.env.VITE_LIVESTOCK_API_URL || '';
const ACCENT = '#3D6B34';

function authHeaders() {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const CATEGORIES = [
  'Tractors','Tillage','Planting & Seeding','Harvesting',
  'Hay & Forage','Irrigation','Livestock Equipment',
  'Sprayers','Grain Handling','Trailers & Transport','Other',
];

const BLANK = {
  title: '', description: '', category: 'Other', listing_type: 'sale',
  asking_price: '', swap_for: '', loan_terms: '', condition: 'good',
  year_made: '', make: '', model: '', hours_used: '',
  city: '', state_province: '', contact_email: '', contact_phone: '',
};

const TYPE_BADGE = {
  sale:   { labelKey: 'badge_for_sale', bg: '#e6f4ea', text: '#2d6a38' },
  swap:   { labelKey: 'badge_swap',     bg: '#fff3e0', text: '#a05c00' },
  borrow: { labelKey: 'badge_borrow',   bg: '#eaf1fb', text: '#1d4e89' },
};

const INQ_STATUS_COLORS = {
  pending: { bg: '#fff8e1', text: '#7d5a00' },
  replied: { bg: '#e6f4ea', text: '#2d6a38' },
  closed:  { bg: '#f3f4f6', text: '#6b7280' },
};

export default function MyEquipmentListings() {
  const { t } = useTranslation();
  const eq = k => t(`equipment.${k}`);
  const { BusinessID } = useAccount();
  const businessId = BusinessID;
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [deleting, setDeleting] = useState(null);

  // Photos panel state
  const [photosListingId, setPhotosListingId] = useState(null);
  const [photosData, setPhotosData] = useState({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState('');
  const photoInputRef = useRef(null);

  // Inquiries panel state
  const [inquiriesListingId, setInquiriesListingId] = useState(null);
  const [inquiriesData, setInquiriesData] = useState({});
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [updatingInqId, setUpdatingInqId] = useState(null);

  const headers = authHeaders();

  const loadListings = useCallback(() => {
    if (!businessId) return;
    setLoading(true);
    fetch(`${API}/api/equipment/my?business_id=${businessId}`, { headers })
      .then(r => r.json())
      .then(d => setListings(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [businessId]);

  useEffect(() => { loadListings(); }, [loadListings]);

  function openCreate() {
    setEditing(null);
    setForm(BLANK);
    setSaveError('');
    setShowForm(true);
    setPhotosListingId(null);
    setInquiriesListingId(null);
  }

  function openEdit(item) {
    setEditing(item.ListingID);
    setForm({
      title:         item.Title         || '',
      description:   item.Description   || '',
      category:      item.Category      || 'Other',
      listing_type:  item.ListingType   || 'sale',
      asking_price:  item.AskingPrice   != null ? String(item.AskingPrice) : '',
      swap_for:      item.SwapFor       || '',
      loan_terms:    item.LoanTerms     || '',
      condition:     item.Condition     || 'good',
      year_made:     item.YearMade      != null ? String(item.YearMade) : '',
      make:          item.Make          || '',
      model:         item.Model         || '',
      hours_used:    item.HoursUsed     != null ? String(item.HoursUsed) : '',
      city:          item.City          || '',
      state_province:item.StateProvince || '',
      contact_email: item.ContactEmail  || '',
      contact_phone: item.ContactPhone  || '',
    });
    setSaveError('');
    setShowForm(true);
    setPhotosListingId(null);
    setInquiriesListingId(null);
  }

  async function saveForm(e) {
    e.preventDefault();
    if (!businessId) return;
    setSaving(true); setSaveError('');
    const body = {
      ...form,
      asking_price: form.asking_price ? parseFloat(form.asking_price) : null,
      year_made:    form.year_made    ? parseInt(form.year_made)    : null,
      hours_used:   form.hours_used   ? parseInt(form.hours_used)   : null,
    };
    const url = editing
      ? `${API}/api/equipment/${editing}`
      : `${API}/api/equipment?business_id=${businessId}`;
    const method = editing ? 'PUT' : 'POST';
    try {
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error();
      setShowForm(false);
      loadListings();
    } catch {
      setSaveError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteListing(id) {
    if (!window.confirm(eq('btn_remove') + '?')) return;
    setDeleting(id);
    try {
      await fetch(`${API}/api/equipment/${id}`, { method: 'DELETE', headers });
      loadListings();
    } catch {}
    setDeleting(null);
  }

  // ── Photos panel ──────────────────────────────────────────────────────────────

  async function togglePhotos(listingId) {
    if (photosListingId === listingId) { setPhotosListingId(null); return; }
    setInquiriesListingId(null);
    setPhotosListingId(listingId);
    if (!photosData[listingId]) {
      try {
        const r = await fetch(`${API}/api/equipment/${listingId}`, { headers });
        const d = await r.json();
        setPhotosData(prev => ({ ...prev, [listingId]: d.images || [] }));
      } catch {
        setPhotosData(prev => ({ ...prev, [listingId]: [] }));
      }
    }
  }

  async function uploadPhoto(listingId, file) {
    if (!file) return;
    setUploadingPhoto(true);
    setPhotoUploadError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch(`${API}/api/equipment/${listingId}/upload-image`, {
        method: 'POST',
        headers,
        body: fd,
      });
      if (!r.ok) throw new Error();
      const d = await r.json();
      setPhotosData(prev => ({
        ...prev,
        [listingId]: [...(prev[listingId] || []), { ImageID: d.image_id, ImageURL: d.url, SortOrder: 999 }],
      }));
      loadListings();
    } catch {
      setPhotoUploadError(eq('photo_upload_error'));
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function deletePhoto(listingId, imageId) {
    try {
      await fetch(`${API}/api/equipment/images/${imageId}`, { method: 'DELETE', headers });
      setPhotosData(prev => ({
        ...prev,
        [listingId]: (prev[listingId] || []).filter(img => img.ImageID !== imageId),
      }));
      loadListings();
    } catch {}
  }

  // ── Inquiries panel ───────────────────────────────────────────────────────────

  async function toggleInquiries(listingId) {
    if (inquiriesListingId === listingId) { setInquiriesListingId(null); return; }
    setPhotosListingId(null);
    setInquiriesListingId(listingId);
    if (!inquiriesData[listingId]) {
      setInquiriesLoading(true);
      try {
        const r = await fetch(`${API}/api/equipment/${listingId}/inquiries`, { headers });
        const d = await r.json();
        setInquiriesData(prev => ({ ...prev, [listingId]: Array.isArray(d) ? d : [] }));
      } catch {
        setInquiriesData(prev => ({ ...prev, [listingId]: [] }));
      } finally {
        setInquiriesLoading(false);
      }
    }
  }

  async function updateInquiryStatus(listingId, inquiryId, status) {
    setUpdatingInqId(inquiryId);
    try {
      await fetch(`${API}/api/equipment/inquiry/${inquiryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ status }),
      });
      setInquiriesData(prev => ({
        ...prev,
        [listingId]: (prev[listingId] || []).map(inq =>
          inq.InquiryID === inquiryId ? { ...inq, Status: status } : inq
        ),
      }));
      loadListings();
    } catch {}
    setUpdatingInqId(null);
  }

  const f = form;
  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f7f2e8' }}>
      <PageMeta title="My Equipment Listings | OFN" noIndex />
      <Header />

      <div className="mx-auto px-4 pt-4" style={{ maxWidth: '1100px' }}>
        <Breadcrumbs items={[
          { label: 'Home', to: '/' },
          { label: 'Equipment', to: '/marketplaces/equipment' },
          { label: 'My Listings' },
        ]} />
      </div>

      <div className="mx-auto px-4 py-6" style={{ maxWidth: '1100px' }}>
        <div className="flex items-center justify-between mb-6">
          <h1 style={{ fontFamily: "'Lora','Times New Roman',serif", fontSize: '1.5rem', fontWeight: 'bold', color: '#111' }}>
            {eq('my_listings_title')}
          </h1>
          {!showForm && (
            <button onClick={openCreate}
              className="px-5 py-2 rounded-lg text-white font-bold text-sm shadow hover:shadow-md transition"
              style={{ backgroundColor: ACCENT }}>
              {eq('btn_new_listing')}
            </button>
          )}
        </div>

        {/* Create / Edit form */}
        {showForm && (
          <form onSubmit={saveForm} className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
            <h2 style={{ fontFamily: "'Lora','Times New Roman',serif" }}
                className="text-lg font-bold text-gray-900 mb-5">
              {editing ? eq('form_edit_title') : eq('form_post_title')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">{eq('f_title')} <span className="text-red-500">*</span></label>
                <input required value={f.title} onChange={e => set('title', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. 2015 John Deere 5075E Tractor" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{eq('f_listing_type')}</label>
                <select value={f.listing_type} onChange={e => set('listing_type', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="sale">{eq('opt_for_sale')}</option>
                  <option value="swap">{eq('opt_swap_trade')}</option>
                  <option value="borrow">{eq('opt_borrow_lend')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{eq('f_category')}</label>
                <select value={f.category} onChange={e => set('category', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {f.listing_type === 'sale' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{eq('f_asking_price')}</label>
                  <input type="number" min="0" step="0.01" value={f.asking_price}
                    onChange={e => set('asking_price', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="0.00" />
                </div>
              )}
              {f.listing_type === 'swap' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{eq('f_will_swap_for')}</label>
                  <input value={f.swap_for} onChange={e => set('swap_for', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="e.g. Hay rake, round baler, or similar value" />
                </div>
              )}
              {f.listing_type === 'borrow' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{eq('f_loan_terms')}</label>
                  <input value={f.loan_terms} onChange={e => set('loan_terms', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="e.g. Up to 1 week, fuel replacement, within 30 miles" />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{eq('f_condition')}</label>
                <select value={f.condition} onChange={e => set('condition', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="excellent">{eq('cond_excellent')}</option>
                  <option value="good">{eq('cond_good')}</option>
                  <option value="fair">{eq('cond_fair')}</option>
                  <option value="parts">{eq('cond_parts')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{eq('f_year')}</label>
                <input type="number" min="1900" max={new Date().getFullYear() + 1}
                  value={f.year_made} onChange={e => set('year_made', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. 2015" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{eq('f_make')}</label>
                <input value={f.make} onChange={e => set('make', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. John Deere" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{eq('f_model')}</label>
                <input value={f.model} onChange={e => set('model', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. 5075E" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{eq('f_hours_used')}</label>
                <input type="number" min="0" value={f.hours_used}
                  onChange={e => set('hours_used', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. 1200" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{eq('f_city')}</label>
                <input value={f.city} onChange={e => set('city', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. Springfield" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{eq('f_state_province')}</label>
                <input value={f.state_province} onChange={e => set('state_province', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. Iowa" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{eq('f_contact_email')}</label>
                <input type="email" value={f.contact_email} onChange={e => set('contact_email', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="optional" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{eq('f_contact_phone')}</label>
                <input value={f.contact_phone} onChange={e => set('contact_phone', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="optional" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">{eq('f_description')}</label>
                <textarea value={f.description} onChange={e => set('description', e.target.value)}
                  rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                  placeholder="Describe the equipment's history, attachments included, any known issues, etc." />
              </div>
            </div>

            {saveError && <p className="text-sm text-red-600 mb-3">{eq('save_error')}</p>}

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-6 py-2 rounded-lg font-bold text-sm border border-gray-300 text-gray-600 hover:bg-gray-50 transition">
                {eq('btn_cancel')}
              </button>
              <button type="submit" disabled={saving}
                className="px-6 py-2 rounded-lg text-white font-bold text-sm shadow hover:shadow-md transition disabled:opacity-60"
                style={{ backgroundColor: ACCENT }}>
                {saving ? eq('btn_saving') : editing ? eq('btn_save_changes') : eq('btn_post_listing_action')}
              </button>
            </div>
          </form>
        )}

        {/* Listings */}
        {loading ? (
          <div className="text-sm text-gray-400 py-12 text-center">{eq('loading')}</div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl text-gray-500">
            <svg className="mx-auto mb-3 opacity-30" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            <p className="font-semibold mb-1">{eq('no_listings_my')}</p>
            <p className="text-sm">{eq('no_listings_my_body')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {listings.map(item => {
              const badge = TYPE_BADGE[item.ListingType] || { label: item.ListingType, bg: '#f3f4f6', text: '#374151' };
              const showPhotos = photosListingId === item.ListingID;
              const showInquiries = inquiriesListingId === item.ListingID;
              const pendingCount = item.PendingInquiries || 0;
              const imageCount = item.ImageCount || 0;
              return (
                <div key={item.ListingID}
                     className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:border-[#819360] transition-all duration-200">

                  {/* Main row */}
                  <div className="flex">
                    <div className="shrink-0 bg-gray-100 flex items-center justify-center" style={{ width: '100px', minHeight: '100px' }}>
                      {item.PrimaryImage
                        ? <img src={item.PrimaryImage} alt="" className="w-full h-full object-cover" style={{ minHeight: '100px' }} />
                        : <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.2"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                      }
                    </div>
                    <div className="flex flex-col justify-between px-5 py-3 flex-1 min-w-0">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: badge.bg, color: badge.text }}>
                            {badge.labelKey ? eq(badge.labelKey) : item.ListingType}
                          </span>
                          {!item.IsActive && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{eq('badge_inactive')}</span>
                          )}
                        </div>
                        <Link to={`/marketplaces/equipment/${item.ListingID}`}
                              className="font-bold text-sm hover:underline" style={{ color: ACCENT }}>
                          {item.Title}
                        </Link>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {[item.YearMade, item.Make, item.Model].filter(Boolean).join(' ')}
                          {item.StateProvince ? ` · ${item.StateProvince}` : ''}
                        </p>
                      </div>
                      {item.ListingType === 'sale' && item.AskingPrice != null && (
                        <p className="text-sm font-bold mt-1" style={{ color: ACCENT }}>
                          ${Number(item.AskingPrice).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col justify-center gap-2 px-4 py-3 shrink-0">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(item)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition">
                          {eq('btn_edit')}
                        </button>
                        <button onClick={() => deleteListing(item.ListingID)}
                          disabled={deleting === item.ListingID}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-50">
                          {deleting === item.ListingID ? '…' : eq('btn_remove')}
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => togglePhotos(item.ListingID)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition"
                          style={showPhotos
                            ? { backgroundColor: ACCENT, color: '#fff', borderColor: ACCENT }
                            : { borderColor: '#d1d5db', color: '#374151' }}>
                          {eq('btn_manage_photos')}{imageCount > 0 ? ` (${imageCount})` : ''}
                        </button>
                        <button
                          onClick={() => toggleInquiries(item.ListingID)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition"
                          style={showInquiries
                            ? { backgroundColor: ACCENT, color: '#fff', borderColor: ACCENT }
                            : pendingCount > 0
                            ? { backgroundColor: '#fff8e1', color: '#7d5a00', borderColor: '#f9d76b' }
                            : { borderColor: '#d1d5db', color: '#374151' }}>
                          {eq('btn_inquiries')}{pendingCount > 0 ? ` (${pendingCount})` : ''}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Photos panel */}
                  {showPhotos && (
                    <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">{eq('photos_heading')}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {(photosData[item.ListingID] || []).map(img => (
                          <div key={img.ImageID} className="relative group">
                            <img src={img.ImageURL} alt=""
                              className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                            <button
                              onClick={() => deletePhoto(item.ListingID, img.ImageID)}
                              className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition leading-none"
                              title={eq('btn_delete_photo')}>
                              ×
                            </button>
                          </div>
                        ))}
                        {(photosData[item.ListingID] || []).length === 0 && !uploadingPhoto && (
                          <p className="text-xs text-gray-400">{eq('no_photos')}</p>
                        )}
                        {uploadingPhoto && (
                          <div className="w-20 h-20 rounded-lg border border-dashed border-gray-300 flex items-center justify-center">
                            <span className="text-xs text-gray-400">{eq('uploading_photo')}</span>
                          </div>
                        )}
                      </div>
                      {photoUploadError && <p className="text-xs text-red-600 mb-2">{photoUploadError}</p>}
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) uploadPhoto(item.ListingID, file);
                          e.target.value = '';
                        }}
                      />
                      <button
                        onClick={() => photoInputRef.current?.click()}
                        disabled={uploadingPhoto}
                        className="text-xs font-semibold px-4 py-1.5 rounded-lg border border-dashed border-gray-400 text-gray-600 hover:bg-white transition disabled:opacity-50">
                        + {eq('btn_upload_photo')}
                      </button>
                    </div>
                  )}

                  {/* Inquiries panel */}
                  {showInquiries && (
                    <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">{eq('inquiries_heading')}</p>
                      {inquiriesLoading ? (
                        <p className="text-xs text-gray-400">{eq('loading')}</p>
                      ) : (inquiriesData[item.ListingID] || []).length === 0 ? (
                        <p className="text-xs text-gray-400">{eq('no_inquiries')}</p>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {(inquiriesData[item.ListingID] || []).map(inq => {
                            const sc = INQ_STATUS_COLORS[inq.Status] || INQ_STATUS_COLORS.pending;
                            const isUpdating = updatingInqId === inq.InquiryID;
                            return (
                              <div key={inq.InquiryID} className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                                <div className="flex items-start justify-between gap-3 mb-1">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                      <span className="text-xs font-semibold text-gray-800">
                                        {inq.SenderName || inq.FromBusinessName || eq('inq_anonymous')}
                                      </span>
                                      {inq.SenderEmail && (
                                        <a href={`mailto:${inq.SenderEmail}`}
                                          className="text-xs text-blue-600 hover:underline">{inq.SenderEmail}</a>
                                      )}
                                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                            style={{ backgroundColor: sc.bg, color: sc.text }}>
                                        {eq(`inq_status_${inq.Status}`) || inq.Status}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-1">
                                      {inq.InquiryType} · {new Date(inq.CreatedAt).toLocaleDateString()}
                                    </p>
                                    <p className="text-sm text-gray-700 leading-relaxed">{inq.Message}</p>
                                  </div>
                                </div>
                                {inq.Status !== 'closed' && (
                                  <div className="flex gap-2 mt-2">
                                    {inq.Status === 'pending' && (
                                      <button
                                        onClick={() => updateInquiryStatus(item.ListingID, inq.InquiryID, 'replied')}
                                        disabled={isUpdating}
                                        className="text-xs font-semibold px-3 py-1 rounded-lg border border-green-300 text-green-700 hover:bg-green-50 transition disabled:opacity-50">
                                        {isUpdating ? '…' : eq('btn_mark_replied')}
                                      </button>
                                    )}
                                    <button
                                      onClick={() => updateInquiryStatus(item.ListingID, inq.InquiryID, 'closed')}
                                      disabled={isUpdating}
                                      className="text-xs font-semibold px-3 py-1 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition disabled:opacity-50">
                                      {isUpdating ? '…' : eq('btn_close_inq')}
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
