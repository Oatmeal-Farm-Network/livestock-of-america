// Ported from Oatmeal Farm Network (src/EquipmentMarketplace.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
// src/EquipmentMarketplace.jsx
// Route: /marketplaces/equipment
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import Breadcrumbs from '../../components/Breadcrumbs';
import { useTranslation } from '../../lib/i18n';

const API = import.meta.env.VITE_LIVESTOCK_API_URL || '';
const ACCENT = '#3D6B34';

const TYPE_OPTS = [
  { key: '',      labelKey: 'type_all' },
  { key: 'sale',  labelKey: 'type_sale' },
  { key: 'swap',  labelKey: 'type_swap' },
  { key: 'borrow',labelKey: 'type_borrow' },
];

const CONDITION_KEYS = {
  excellent: 'cond_excellent',
  good:      'cond_good',
  fair:      'cond_fair',
  parts:     'cond_parts',
};

const CONDITION_COLORS = {
  excellent: { bg: '#e6f4ea', text: '#2d6a38' },
  good:      { bg: '#eaf1fb', text: '#1d4e89' },
  fair:      { bg: '#fff8e1', text: '#7d5a00' },
  parts:     { bg: '#fce8e8', text: '#9b2335' },
};

const TYPE_BADGE = {
  sale:   { labelKey: 'badge_for_sale', bg: '#e6f4ea', text: '#2d6a38' },
  swap:   { labelKey: 'badge_swap',     bg: '#fff3e0', text: '#a05c00' },
  borrow: { labelKey: 'badge_borrow',   bg: '#eaf1fb', text: '#1d4e89' },
};

function TypeBadge({ type }) {
  const { t } = useTranslation();
  const eq = k => t(`equipment.${k}`);
  const b = TYPE_BADGE[type] || { labelKey: null, bg: '#f3f4f6', text: '#374151' };
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: b.bg, color: b.text }}>
      {b.labelKey ? eq(b.labelKey) : type}
    </span>
  );
}

function ConditionDot({ condition }) {
  const { t } = useTranslation();
  const eq = k => t(`equipment.${k}`);
  const c = CONDITION_COLORS[condition] || { bg: '#f3f4f6', text: '#374151' };
  return (
    <span className="text-xs px-2 py-0.5 rounded-full"
          style={{ backgroundColor: c.bg, color: c.text }}>
      {CONDITION_KEYS[condition] ? eq(CONDITION_KEYS[condition]) : condition}
    </span>
  );
}

function ListingCard({ item }) {
  const { t } = useTranslation();
  const eq = k => t(`equipment.${k}`);
  const hasPrice = item.ListingType === 'sale' && item.AskingPrice != null;
  return (
    <Link
      to={`/marketplaces/equipment/${item.ListingID}`}
      className="flex flex-col bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md hover:border-[#819360] transition-all duration-200"
    >
      <div className="relative w-full bg-gray-100" style={{ height: '180px' }}>
        {item.PrimaryImage ? (
          <img
            src={item.PrimaryImage}
            alt={item.Title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#f0f7ed' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#819360" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
          <TypeBadge type={item.ListingType} />
        </div>
      </div>
      <div className="p-4 flex flex-col gap-1.5 flex-1">
        <h3 className="font-bold text-sm text-gray-900 leading-snug line-clamp-2">{item.Title}</h3>
        {(item.Make || item.YearMade) && (
          <p className="text-xs text-gray-500">
            {[item.YearMade, item.Make, item.Model].filter(Boolean).join(' ')}
          </p>
        )}
        <div className="flex items-center gap-2 flex-wrap mt-0.5">
          {item.Condition && <ConditionDot condition={item.Condition} />}
          {item.HoursUsed != null && (
            <span className="text-xs text-gray-500">{item.HoursUsed.toLocaleString()} hrs</span>
          )}
        </div>
        <div className="mt-auto pt-2 flex items-center justify-between">
          {hasPrice ? (
            <span className="font-bold text-sm" style={{ color: ACCENT }}>
              ${Number(item.AskingPrice).toLocaleString()}
            </span>
          ) : item.ListingType === 'swap' ? (
            <span className="text-xs text-orange-700 font-medium">{eq('lbl_swap_trade')}</span>
          ) : (
            <span className="text-xs text-blue-700 font-medium">{eq('lbl_available_borrow')}</span>
          )}
          {item.StateProvince && (
            <span className="text-xs text-gray-400">{item.StateProvince}</span>
          )}
        </div>
        {item.BusinessName && (
          <p className="text-xs text-gray-400 truncate">{item.BusinessName}</p>
        )}
      </div>
    </Link>
  );
}

export default function EquipmentMarketplace() {
  const { t } = useTranslation();
  const eq = k => t(`equipment.${k}`);
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const listingType = searchParams.get('type') || '';
  const category    = searchParams.get('category') || '';
  const state       = searchParams.get('state') || '';
  const search      = searchParams.get('search') || '';

  const [searchInput, setSearchInput] = useState(search);
  const [stateInput, setStateInput] = useState(state);

  const load = useCallback(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (listingType) qs.set('listing_type', listingType);
    if (category)    qs.set('category', category);
    if (state)       qs.set('state', state);
    if (search)      qs.set('search', search);
    fetch(`${API}/api/equipment?${qs}`)
      .then(r => r.json())
      .then(d => { setListings(d.items || []); setTotal(d.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [listingType, category, state, search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetch(`${API}/api/equipment/categories`)
      .then(r => r.json())
      .then(d => setCategories(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  function setParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    setSearchParams(next, { replace: true });
  }

  function submitSearch(e) {
    e.preventDefault();
    setParam('search', searchInput.trim());
  }

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f7f2e8' }}>
      <PageMeta
        title="Farm Equipment Marketplace | Buy, Sell, Swap & Borrow | Livestock Of America"
        description="Browse farm equipment listings — tractors, tillage, harvesters, irrigation and more. Buy outright, trade at the Swap Meet, or borrow from neighbors."
        canonical="https://livestockofamerica.com/marketplaces/equipment"
      />
      <Header />

      <div className="mx-auto px-4 pt-4" style={{ maxWidth: '1300px' }}>
        <Breadcrumbs items={[
          { label: 'Home', to: '/' },
          { label: 'Marketplaces', to: '/marketplaces' },
          { label: 'Equipment' },
        ]} />
      </div>

      {/* Hero */}
      <div className="mx-auto px-4 pt-2" style={{ maxWidth: '1300px' }}>
        <div className="relative w-full overflow-hidden rounded-xl">
          <img
            src="/images/EquipmentMarketplaceHeader.webp"
            alt="Farm Equipment Marketplace"
            className="w-full object-cover"
            style={{ height: '220px', display: 'block' }}
            loading="eager"
            onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }}
          />
          <div className="absolute inset-0"
               style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.75) 45%, rgba(255,255,255,0) 78%)' }} />
          <div className="absolute inset-0 flex flex-col justify-center px-8 py-6" style={{ maxWidth: '720px' }}>
            <h1 style={{ color: '#000', fontFamily: "'Lora','Times New Roman',serif", fontSize: '1.9rem', fontWeight: 'bold', margin: '0 0 8px', lineHeight: 1.2 }}>
              {eq('about_hero_title')}
            </h1>
            <p style={{ color: '#111', fontSize: '0.9rem', margin: '0 0 14px', lineHeight: 1.6 }}>
              {eq('about_hero_body')}
            </p>
            <Link to="/equipment/my-listings"
              className="inline-flex items-center gap-2 font-bold px-4 py-2 rounded-lg border-2 text-sm w-fit transition hover:bg-gray-50"
              style={{ color: ACCENT, borderColor: ACCENT }}>
              + {eq('btn_post_listing')}
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 py-6" style={{ maxWidth: '1300px' }}>

        {/* Listing type tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {TYPE_OPTS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setParam('type', opt.key)}
              className="px-4 py-1.5 rounded-full text-sm font-semibold border transition"
              style={listingType === opt.key
                ? { backgroundColor: ACCENT, color: '#fff', borderColor: ACCENT }
                : { backgroundColor: '#fff', color: '#374151', borderColor: '#d1d5db' }}
            >
              {t(`equipment.${opt.labelKey}`)}
            </button>
          ))}
        </div>

        {/* Search + filters row */}
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <form onSubmit={submitSearch} className="flex gap-2 flex-1 min-w-[220px]">
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder={eq('search_placeholder')}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
            />
            <button type="submit"
              className="px-4 py-1.5 rounded-lg text-white text-sm font-semibold"
              style={{ backgroundColor: ACCENT }}>
              {eq('btn_search')}
            </button>
          </form>

          <select
            value={category}
            onChange={e => setParam('category', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
          >
            <option value="">{eq('all_categories')}</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <input
            type="text"
            value={stateInput}
            onChange={e => setStateInput(e.target.value)}
            onBlur={() => setParam('state', stateInput.trim())}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); setParam('state', stateInput.trim()); } }}
            placeholder={eq('filter_state_placeholder')}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white w-36"
          />

          {(listingType || category || state || search) && (
            <button
              onClick={() => { setSearchInput(''); setStateInput(''); setSearchParams({}); }}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              {eq('btn_clear_filters')}
            </button>
          )}
        </div>

        {/* Results */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
{loading ? eq('loading') : `${total.toLocaleString()} listing${total !== 1 ? 's' : ''}`}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl h-64 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <svg className="mx-auto mb-3 opacity-30" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            <p className="font-semibold">{eq('no_listings')}</p>
            <p className="text-sm mt-1">{eq('no_listings_cta')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {listings.map(item => <ListingCard key={item.ListingID} item={item} />)}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
