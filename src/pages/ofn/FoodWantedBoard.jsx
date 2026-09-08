// Ported from Oatmeal Farm Network (src/FoodWantedBoard.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
// src/FoodWantedBoard.jsx
// Route: /marketplaces/food-wanted
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import Breadcrumbs from '../../components/Breadcrumbs';
import { useTranslation } from '../../lib/i18n';

const API = import.meta.env.VITE_LIVESTOCK_API_URL || '';
const ACCENT = '#3D6B34';

const BUYER_TYPES = [
  { key: '',                  labelKey: 'buyer_lbl_all' },
  { key: 'Restaurant',        labelKey: 'buyer_lbl_restaurant' },
  { key: 'Artisan Producer',  labelKey: 'buyer_lbl_artisan' },
  { key: 'Grocery / Retailer',labelKey: 'buyer_lbl_grocery' },
  { key: 'Food Hub',          labelKey: 'buyer_lbl_food_hub' },
  { key: 'Individual',        labelKey: 'buyer_lbl_individual' },
  { key: 'Other',             labelKey: 'buyer_lbl_other' },
];

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

function BuyerBadge({ type }) {
  const c = TYPE_COLORS[type] || { bg: '#f3f4f6', text: '#374151' };
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: c.bg, color: c.text }}>
      {type || 'Buyer'}
    </span>
  );
}

function AdCard({ ad }) {
  const { t } = useTranslation();
  const fw = k => t(`food_wanted.${k}`);
  const items = ad.items || [];
  const visibleItems = items.slice(0, 4);
  const overflow = items.length - visibleItems.length;

  return (
    <Link
      to={`/marketplaces/food-wanted/${ad.AdID}`}
      className="flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-[#819360] transition-all duration-200 p-5 gap-3"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-gray-900 leading-snug line-clamp-2">{ad.Title}</h3>
          {ad.BusinessName && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{ad.BusinessName}</p>
          )}
        </div>
        {ad.BuyerType && <BuyerBadge type={ad.BuyerType} />}
      </div>

      {/* Ingredient chips */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {visibleItems.map((item, i) => (
            <span key={i}
                  className="text-xs px-2.5 py-0.5 rounded-full font-medium border"
                  style={{ backgroundColor: '#f0f7ed', color: ACCENT, borderColor: '#c3dfc3' }}>
              {item.IngredientName}
              {item.Quantity ? ` · ${item.Quantity}${item.Unit ? ' ' + item.Unit : ''}` : ''}
            </span>
          ))}
          {overflow > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
              +{overflow} more
            </span>
          )}
        </div>
      )}

      {/* Footer row */}
      <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap mt-auto pt-1 border-t border-gray-100">
        {(ad.LocationCity || ad.LocationState) && (
          <span>{[ad.LocationCity, ad.LocationState].filter(Boolean).join(', ')}</span>
        )}
        {ad.DeliveryPreference && ad.DeliveryPreference !== 'either' && (
          <span>{DELIVERY_KEYS[ad.DeliveryPreference] ? fw(DELIVERY_KEYS[ad.DeliveryPreference]) : ad.DeliveryPreference}</span>
        )}
        {ad.NeededBy && (
          <span>{fw('needed_by')} {new Date(ad.NeededBy).toLocaleDateString()}</span>
        )}
      </div>
    </Link>
  );
}

export default function FoodWantedBoard() {
  const { t } = useTranslation();
  const fw = k => t(`food_wanted.${k}`);
  const [searchParams, setSearchParams] = useSearchParams();
  const [ads, setAds] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const buyerType = searchParams.get('type') || '';
  const state     = searchParams.get('state') || '';
  const search    = searchParams.get('search') || '';
  const [searchInput, setSearchInput] = useState(search);

  const load = useCallback(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (buyerType) qs.set('buyer_type', buyerType);
    if (state)     qs.set('state', state);
    if (search)    qs.set('search', search);
    fetch(`${API}/api/food-wanted?${qs}`)
      .then(r => r.json())
      .then(d => { setAds(d.items || []); setTotal(d.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [buyerType, state, search]);

  useEffect(() => { load(); }, [load]);

  function setParam(key, val) {
    const next = new URLSearchParams(searchParams);
    if (val) next.set(key, val); else next.delete(key);
    setSearchParams(next, { replace: true });
  }

  function submitSearch(e) {
    e.preventDefault();
    setParam('search', searchInput.trim());
  }

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f7f2e8' }}>
      <PageMeta
        title="Food Wanted Board | Oatmeal Farm Network"
        description="Restaurants, artisan producers, and food businesses post ingredient requests. Farms respond directly."
        canonical="https://oatmealfarmnetwork.com/marketplaces/food-wanted"
      />
      <Header />

      <div className="mx-auto px-4 pt-4" style={{ maxWidth: '1300px' }}>
        <Breadcrumbs items={[
          { label: 'Home', to: '/' },
          { label: 'Marketplaces', to: '/marketplaces' },
          { label: 'Food Wanted' },
        ]} />
      </div>

      {/* Hero */}
      <div className="mx-auto px-4 pt-2" style={{ maxWidth: '1300px' }}>
        <div className="relative w-full overflow-hidden rounded-xl">
          <img
            src="/images/CoreFeaturesFarm2Table.webp"
            alt="Food Wanted Board"
            className="w-full object-cover"
            style={{ height: '200px', display: 'block' }}
            loading="eager"
            onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }}
          />
          <div className="absolute inset-0"
               style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.75) 45%, rgba(255,255,255,0) 78%)' }} />
          <div className="absolute inset-0 flex flex-col justify-center px-8 py-6" style={{ maxWidth: '680px' }}>
            <h1 style={{ color: '#000', fontFamily: "'Lora','Times New Roman',serif", fontSize: '1.8rem', fontWeight: 'bold', margin: '0 0 8px', lineHeight: 1.2 }}>
              {fw('board_hero_title')}
            </h1>
            <p style={{ color: '#111', fontSize: '0.9rem', margin: '0 0 14px', lineHeight: 1.6 }}>
              {fw('board_hero_body')}
            </p>
            <Link to="/food-wanted/my-ads?new=1"
              className="inline-flex items-center gap-2 font-bold px-4 py-2 rounded-lg border-2 text-sm w-fit transition hover:bg-gray-50"
              style={{ color: ACCENT, borderColor: ACCENT }}>
              {fw('btn_post_wanted_ad')}
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 py-6" style={{ maxWidth: '1300px' }}>

        {/* Buyer type tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {BUYER_TYPES.map(opt => (
            <button key={opt.key}
              onClick={() => setParam('type', opt.key)}
              className="px-4 py-1.5 rounded-full text-sm font-semibold border transition"
              style={buyerType === opt.key
                ? { backgroundColor: ACCENT, color: '#fff', borderColor: ACCENT }
                : { backgroundColor: '#fff', color: '#374151', borderColor: '#d1d5db' }}>
              {t(`food_wanted.${opt.labelKey}`)}
            </button>
          ))}
        </div>

        {/* Search row */}
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <form onSubmit={submitSearch} className="flex gap-2 flex-1 min-w-[220px]">
            <input
              type="text" value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder={fw('search_placeholder')}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
            />
            <button type="submit"
              className="px-4 py-1.5 rounded-lg text-white text-sm font-semibold"
              style={{ backgroundColor: ACCENT }}>
              {fw('btn_search')}
            </button>
          </form>
          {(buyerType || state || search) && (
            <button onClick={() => { setSearchInput(''); setSearchParams({}); }}
              className="text-sm text-gray-500 hover:text-gray-700 underline">
              {fw('btn_clear_filters')}
            </button>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
{loading ? fw('loading') : `${total.toLocaleString()} ad${total !== 1 ? 's' : ''}`}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl h-44 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : ads.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <svg className="mx-auto mb-3 opacity-30" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M17 8C8 10 5.9 16.17 3.82 22"/><path d="M9.5 9.5s1-3 4.5-5c0 0 1 3-1 7"/><path d="M3.82 22s1.5-3.5 8.18-4.5"/></svg>
            <p className="font-semibold">{fw('no_ads')}</p>
            <p className="text-sm mt-1">{fw('no_ads_cta')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ads.map(ad => <AdCard key={ad.AdID} ad={ad} />)}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
