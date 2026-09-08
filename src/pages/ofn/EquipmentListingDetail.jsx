// Ported from Oatmeal Farm Network (src/EquipmentListingDetail.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
// src/EquipmentListingDetail.jsx
// Route: /marketplaces/equipment/:listingId
import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import Breadcrumbs from '../../components/Breadcrumbs';
import { useAccount } from '../../lib/AccountContext';
import { useTranslation } from '../../lib/i18n';
import { getPeopleId } from '../../lib/auth';

const API = import.meta.env.VITE_LIVESTOCK_API_URL || '';
const ACCENT = '#3D6B34';

function authHeaders() {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const TYPE_BADGE = {
  sale:   { labelKey: 'badge_for_sale',     bg: '#e6f4ea', text: '#2d6a38' },
  swap:   { labelKey: 'badge_swap',          bg: '#fff3e0', text: '#a05c00' },
  borrow: { labelKey: 'badge_borrow_long',   bg: '#eaf1fb', text: '#1d4e89' },
};
const CONDITION_KEYS = {
  excellent: 'cond_excellent', good: 'cond_good', fair: 'cond_fair', parts: 'cond_parts',
};

export default function EquipmentListingDetail() {
  const { t } = useTranslation();
  const eq = k => t(`equipment.${k}`);
  const { listingId } = useParams();
  const { BusinessID } = useAccount();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [selectedImg, setSelectedImg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [otfLoading, setOtfLoading] = useState(false);

  const [form, setForm] = useState({ sender_name: '', sender_email: '', message: '', inquiry_type: 'general' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState('');

  useEffect(() => {
    fetch(`${API}/api/equipment/${listingId}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setListing(d))
      .catch(() => setListing(null))
      .finally(() => setLoading(false));
  }, [listingId]);

  async function openOtfDM() {
    const token = localStorage.getItem('access_token');
    if (!token) { navigate('/login'); return; }
    setOtfLoading(true);
    try {
      const pid = getPeopleId();
      await fetch(`${API}/api/admin/mill/dm/from-module`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'x-people-id': pid || '' },
        body: JSON.stringify({
          targetBusinessId: listing.BusinessID,
          message: `Hi! I'm interested in your listing: ${listing.Title}`,
        }),
      });
    } finally {
      setOtfLoading(false);
    }
    navigate('/over-the-fence');
  }

  async function submitInquiry(e) {
    e.preventDefault();
    if (!form.message.trim()) return;
    setSending(true); setSendError('');
    const qs = BusinessID ? `?business_id=${BusinessID}` : '';
    try {
      const r = await fetch(`${API}/api/equipment/${listingId}/inquire${qs}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error();
      setSent(true);
    } catch {
      setSendError('Failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f7f2e8' }}>
      <Header />
      <div className="flex items-center justify-center py-24 text-gray-400">{eq('loading')}</div>
      <Footer />
    </div>
  );

  if (!listing) return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f7f2e8' }}>
      <Header />
      <div className="flex flex-col items-center justify-center py-24 text-gray-500 gap-3">
        <p className="font-semibold">{eq('not_found')}</p>
        <Link to="/marketplaces/equipment" className="text-sm underline" style={{ color: ACCENT }}>{eq('back_to_marketplace')}</Link>
      </div>
      <Footer />
    </div>
  );

  const badge = TYPE_BADGE[listing.ListingType] || { label: listing.ListingType, bg: '#f3f4f6', text: '#374151' };
  const images = listing.images || [];
  const inquiryTypeLabel = listing.ListingType === 'swap' ? 'swap' : listing.ListingType === 'borrow' ? 'borrow' : 'purchase';

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f7f2e8' }}>
      <PageMeta
        title={`${listing.Title} | Equipment Marketplace`}
        description={listing.Description?.slice(0, 155) || 'Farm equipment listing on Livestock Of America.'}
      />
      <Header />

      <div className="mx-auto px-4 pt-4" style={{ maxWidth: '1100px' }}>
        <Breadcrumbs items={[
          { label: 'Home', to: '/' },
          { label: 'Equipment', to: '/marketplaces/equipment' },
          { label: listing.Title },
        ]} />
      </div>

      <div className="mx-auto px-4 py-6" style={{ maxWidth: '1100px' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Images */}
          <div>
            <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm"
                 style={{ height: '340px' }}>
              {images.length > 0 ? (
                <img
                  src={images[selectedImg]?.ImageURL}
                  alt={listing.Title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#f0f7ed' }}>
                  <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#819360" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                  </svg>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImg(i)}
                    className="shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition"
                    style={{ borderColor: selectedImg === i ? ACCENT : 'transparent' }}>
                    <img src={img.ImageURL} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: badge.bg, color: badge.text }}>
                  {badge.labelKey ? eq(badge.labelKey) : listing.ListingType}
                </span>
                {listing.Condition && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                    {CONDITION_KEYS[listing.Condition] ? eq(CONDITION_KEYS[listing.Condition]) : listing.Condition}
                  </span>
                )}
              </div>
              <h1 style={{ fontFamily: "'Lora','Times New Roman',serif", fontSize: '1.5rem', fontWeight: 'bold', color: '#111', lineHeight: 1.3 }}>
                {listing.Title}
              </h1>
              {(listing.Make || listing.YearMade) && (
                <p className="text-sm text-gray-500 mt-1">
                  {[listing.YearMade, listing.Make, listing.Model].filter(Boolean).join(' ')}
                  {listing.HoursUsed != null && ` · ${listing.HoursUsed.toLocaleString()} hrs`}
                </p>
              )}
            </div>

            {/* Price / swap / borrow */}
            {listing.ListingType === 'sale' && listing.AskingPrice != null && (
              <div className="bg-white border border-gray-200 rounded-xl px-5 py-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-0.5">{eq('asking_price')}</p>
                <p className="text-2xl font-bold" style={{ color: ACCENT }}>
                  ${Number(listing.AskingPrice).toLocaleString()}
                </p>
              </div>
            )}
            {listing.ListingType === 'swap' && (
              <div className="bg-white border border-gray-200 rounded-xl px-5 py-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">{eq('will_swap_for')}</p>
                <p className="text-sm text-gray-800">{listing.SwapFor || eq('contact_no_swap')}</p>
              </div>
            )}
            {listing.ListingType === 'borrow' && (
              <div className="bg-white border border-gray-200 rounded-xl px-5 py-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">{eq('loan_terms_label')}</p>
                <p className="text-sm text-gray-800">{listing.LoanTerms || eq('contact_no_loan')}</p>
              </div>
            )}

            {/* Specs grid */}
            <div className="bg-white border border-gray-200 rounded-xl px-5 py-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">{eq('details_heading')}</p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {listing.Category && <><dt className="text-gray-500">{eq('lbl_category')}</dt><dd className="font-medium text-gray-900">{listing.Category}</dd></>}
                {listing.YearMade && <><dt className="text-gray-500">{eq('lbl_year')}</dt><dd className="font-medium text-gray-900">{listing.YearMade}</dd></>}
                {listing.Make     && <><dt className="text-gray-500">{eq('lbl_make')}</dt><dd className="font-medium text-gray-900">{listing.Make}</dd></>}
                {listing.Model    && <><dt className="text-gray-500">{eq('lbl_model')}</dt><dd className="font-medium text-gray-900">{listing.Model}</dd></>}
                {listing.HoursUsed != null && <><dt className="text-gray-500">{eq('lbl_hours')}</dt><dd className="font-medium text-gray-900">{listing.HoursUsed.toLocaleString()}</dd></>}
                {(listing.City || listing.StateProvince) && (
                  <><dt className="text-gray-500">{eq('lbl_location')}</dt><dd className="font-medium text-gray-900">{[listing.City, listing.StateProvince].filter(Boolean).join(', ')}</dd></>
                )}
              </dl>
            </div>

            {listing.BusinessName && (
              <p className="text-sm text-gray-500">{eq('listed_by')} <span className="font-semibold text-gray-700">{listing.BusinessName}</span></p>
            )}
            {(listing.ContactEmail || listing.ContactPhone) && (
              <div className="bg-white border border-gray-200 rounded-xl px-5 py-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">{eq('lbl_contact_info')}</p>
                {listing.ContactEmail && (
                  <p className="text-sm text-gray-800 mb-1">
                    <span className="text-gray-500 mr-1">{eq('lbl_contact_email')}:</span>
                    <a href={`mailto:${listing.ContactEmail}`} className="font-medium hover:underline" style={{ color: ACCENT }}>{listing.ContactEmail}</a>
                  </p>
                )}
                {listing.ContactPhone && (
                  <p className="text-sm text-gray-800">
                    <span className="text-gray-500 mr-1">{eq('lbl_contact_phone')}:</span>
                    <a href={`tel:${listing.ContactPhone}`} className="font-medium hover:underline" style={{ color: ACCENT }}>{listing.ContactPhone}</a>
                  </p>
                )}
              </div>
            )}
            <button onClick={openOtfDM} disabled={otfLoading}
              className="mt-1 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60 transition"
              style={{ backgroundColor: '#516234', width: 'fit-content' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3l3 3 3-3h3a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"/></svg>
              {otfLoading ? '…' : 'Message Seller via Over the Fence'}
            </button>
          </div>
        </div>

        {/* Description */}
        {listing.Description && (
          <section className="mt-8 bg-white border border-gray-200 rounded-xl px-6 py-5">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">{eq('description_heading')}</h2>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{listing.Description}</p>
          </section>
        )}

        {/* Inquiry form */}
        <section className="mt-8 bg-white border border-gray-200 rounded-xl px-6 py-6">
          <h2 style={{ fontFamily: "'Lora','Times New Roman',serif" }}
              className="text-lg font-bold text-gray-900 mb-4">
            {listing.ListingType === 'swap' ? eq('form_propose_trade') :
             listing.ListingType === 'borrow' ? eq('form_request_borrow') : eq('form_contact_seller')}
          </h2>
          {sent ? (
            <div className="rounded-lg px-5 py-4 text-sm font-semibold" style={{ backgroundColor: '#e6f4ea', color: '#2d6a38' }}>
              {eq('msg_sent')}
            </div>
          ) : (
            <form onSubmit={submitInquiry} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{eq('f_your_name')}</label>
                  <input
                    type="text" value={form.sender_name}
                    onChange={e => setForm(f => ({ ...f, sender_name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    {...{ placeholder: eq('ph_your_name') }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{eq('f_your_email')}</label>
                  <input
                    type="email" value={form.sender_email}
                    onChange={e => setForm(f => ({ ...f, sender_email: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    {...{ placeholder: eq('ph_your_email') }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{eq('f_inquiry_type')}</label>
                <select
                  value={form.inquiry_type}
                  onChange={e => setForm(f => ({ ...f, inquiry_type: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  {listing.ListingType === 'sale'   && <option value="purchase">{eq('opt_want_buy')}</option>}
                  {listing.ListingType === 'swap'   && <option value="swap">{eq('opt_want_swap')}</option>}
                  {listing.ListingType === 'borrow' && <option value="borrow">{eq('opt_want_borrow')}</option>}
                  <option value="general">{eq('opt_general')}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{eq('f_message')} <span className="text-red-500">*</span></label>
                <textarea
                  required value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                  placeholder={listing.ListingType === 'swap'
                    ? eq('ph_swap_msg')
                    : listing.ListingType === 'borrow'
                    ? eq('ph_borrow_msg')
                    : eq('ph_purchase_msg')}
                />
              </div>
              {sendError && <p className="text-sm text-red-600">{eq('send_error')}</p>}
              <button
                type="submit" disabled={sending}
                className="px-6 py-2.5 rounded-lg text-white font-bold text-sm shadow hover:shadow-md transition disabled:opacity-60"
                style={{ backgroundColor: ACCENT, width: 'fit-content' }}
              >
                {sending ? eq('btn_sending') : eq('btn_send_message')}
              </button>
            </form>
          )}
        </section>

        <div className="mt-6">
          <Link to="/marketplaces/equipment" className="text-sm underline" style={{ color: ACCENT }}>
            {eq('back_to_marketplace')}
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
