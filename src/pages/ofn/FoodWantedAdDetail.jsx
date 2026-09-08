// Ported from Oatmeal Farm Network (src/FoodWantedAdDetail.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
// src/FoodWantedAdDetail.jsx
// Route: /marketplaces/food-wanted/:adId
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

const DELIVERY_KEYS = {
  pickup:   'delivery_pickup',
  delivery: 'delivery_needed',
  either:   'delivery_either',
};

const TYPE_COLORS = {
  'Restaurant':         { bg: '#fef3c7', text: '#92400e' },
  'Artisan Producer':   { bg: '#ede9fe', text: '#5b21b6' },
  'Grocery / Retailer': { bg: '#e0f2fe', text: '#075985' },
  'Food Hub':           { bg: '#d1fae5', text: '#065f46' },
  'Individual':         { bg: '#f3f4f6', text: '#374151' },
  'Other':              { bg: '#f3f4f6', text: '#374151' },
};

export default function FoodWantedAdDetail() {
  const { t } = useTranslation();
  const fw = k => t(`food_wanted.${k}`);
  const { adId } = useParams();
  const { BusinessID } = useAccount();
  const navigate = useNavigate();
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [otfLoading, setOtfLoading] = useState(false);

  const [form, setForm] = useState({ sender_name: '', sender_email: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState('');

  useEffect(() => {
    fetch(`${API}/api/food-wanted/${adId}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setAd(d))
      .catch(() => setAd(null))
      .finally(() => setLoading(false));
  }, [adId]);

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
          targetBusinessId: ad.BusinessID,
          message: `Hi! I can supply some of the ingredients you're looking for in "${ad.Title}"`,
        }),
      });
    } finally {
      setOtfLoading(false);
    }
    navigate('/over-the-fence');
  }

  async function submitResponse(e) {
    e.preventDefault();
    if (!form.message.trim()) return;
    setSending(true); setSendError('');
    const qs = BusinessID ? `?business_id=${BusinessID}` : '';
    try {
      const r = await fetch(`${API}/api/food-wanted/${adId}/respond${qs}`, {
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
      <div className="flex items-center justify-center py-24 text-gray-400">{fw('loading')}</div>
      <Footer />
    </div>
  );

  if (!ad) return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f7f2e8' }}>
      <Header />
      <div className="flex flex-col items-center justify-center py-24 text-gray-500 gap-3">
        <p className="font-semibold">{fw('ad_not_found')}</p>
        <Link to="/marketplaces/food-wanted" className="text-sm underline" style={{ color: ACCENT }}>{fw('back_to_board')}</Link>
      </div>
      <Footer />
    </div>
  );

  const typeCols = TYPE_COLORS[ad.BuyerType] || { bg: '#f3f4f6', text: '#374151' };
  const items = ad.items || [];

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f7f2e8' }}>
      <PageMeta
        title={`${ad.Title} | Food Wanted`}
        description={`${ad.BuyerType || 'Buyer'} looking for local ingredients. ${items.map(i => i.IngredientName).join(', ')}`}
      />
      <Header />

      <div className="mx-auto px-4 pt-4" style={{ maxWidth: '900px' }}>
        <Breadcrumbs items={[
          { label: 'Home', to: '/' },
          { label: 'Food Wanted', to: '/marketplaces/food-wanted' },
          { label: ad.Title },
        ]} />
      </div>

      <div className="mx-auto px-4 py-6" style={{ maxWidth: '900px' }}>

        {/* Main ad card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-start gap-3 mb-4 flex-wrap">
            {ad.BuyerType && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: typeCols.bg, color: typeCols.text }}>
                {ad.BuyerType}
              </span>
            )}
            {ad.NeededBy && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-medium">
                {fw('needed_by')} {new Date(ad.NeededBy).toLocaleDateString()}
              </span>
            )}
          </div>

          <h1 style={{ fontFamily: "'Lora','Times New Roman',serif", fontSize: '1.6rem', fontWeight: 'bold', color: '#111', lineHeight: 1.3, marginBottom: '8px' }}>
            {ad.Title}
          </h1>

          {ad.BusinessName && (
            <p className="text-sm text-gray-500 mb-2">{fw('posted_by')} <span className="font-semibold text-gray-700">{ad.BusinessName}</span></p>
          )}
          <button onClick={openOtfDM} disabled={otfLoading}
            className="mb-4 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60 transition"
            style={{ backgroundColor: '#516234' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3l3 3 3-3h3a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"/></svg>
            {otfLoading ? '…' : 'Contact Buyer via Over the Fence'}
          </button>

          {ad.Description && (
            <p className="text-sm text-gray-700 leading-relaxed mb-5 whitespace-pre-line">{ad.Description}</p>
          )}

          {/* Details row */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 border-t border-gray-100 pt-4">
            {(ad.LocationCity || ad.LocationState) && (
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {[ad.LocationCity, ad.LocationState].filter(Boolean).join(', ')}
              </span>
            )}
            {ad.DeliveryPreference && (
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                {DELIVERY_KEYS[ad.DeliveryPreference] ? fw(DELIVERY_KEYS[ad.DeliveryPreference]) : ad.DeliveryPreference}
              </span>
            )}
          </div>
        </div>

        {/* Ingredients wanted */}
        {items.length > 0 && (
          <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6">
            <h2 style={{ fontFamily: "'Lora','Times New Roman',serif" }}
                className="text-lg font-bold text-gray-900 mb-4">
              {fw('ingredients_wanted')}
            </h2>
            <div className="divide-y divide-gray-100">
              {items.map((item, i) => (
                <div key={i} className="flex items-start justify-between py-3 gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900">{item.IngredientName}</p>
                    {item.Notes && (
                      <p className="text-xs text-gray-500 mt-0.5">{item.Notes}</p>
                    )}
                  </div>
                  {(item.Quantity || item.Unit) && (
                    <span className="text-sm font-medium shrink-0" style={{ color: ACCENT }}>
                      {[item.Quantity, item.Unit].filter(Boolean).join(' ')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Response form */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 style={{ fontFamily: "'Lora','Times New Roman',serif" }}
              className="text-lg font-bold text-gray-900 mb-4">
            {fw('supply_heading')}
          </h2>
          {sent ? (
            <div className="rounded-lg px-5 py-4 text-sm font-semibold" style={{ backgroundColor: '#e6f4ea', color: '#2d6a38' }}>
              {fw('response_sent')}
            </div>
          ) : (
            <form onSubmit={submitResponse} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{fw('f_name_farm')}</label>
                  <input type="text" value={form.sender_name}
                    onChange={e => setForm(f => ({ ...f, sender_name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    {...{ placeholder: fw('ph_name_farm') }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{fw('f_email')}</label>
                  <input type="email" value={form.sender_email}
                    onChange={e => setForm(f => ({ ...f, sender_email: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    {...{ placeholder: fw('ph_email') }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {fw('f_message')} <span className="text-red-500">*</span>
                </label>
                <textarea required value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  rows={5}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                  placeholder={fw('ph_message')} />
              </div>
              {sendError && <p className="text-sm text-red-600">{fw('send_error')}</p>}
              <button type="submit" disabled={sending}
                className="px-6 py-2.5 rounded-lg text-white font-bold text-sm shadow hover:shadow-md transition disabled:opacity-60 w-fit"
                style={{ backgroundColor: ACCENT }}>
                {sending ? fw('btn_sending') : fw('btn_send_response')}
              </button>
            </form>
          )}
        </section>

        <div className="mt-6">
          <Link to="/marketplaces/food-wanted" className="text-sm underline" style={{ color: ACCENT }}>
            {fw('back_to_board')}
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
