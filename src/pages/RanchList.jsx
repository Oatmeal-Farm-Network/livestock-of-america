import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { useTranslation } from '../lib/i18n';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';
import LivestockHeroTabs from '../components/LivestockHeroTabs';
import SaveButton from '../components/SaveButton';
import GuestAccessPrompt, { GUEST_LIST_PREVIEW } from '../components/GuestAccessPrompt';
import { isLoggedIn } from '../lib/auth';

const API_URL = import.meta.env.VITE_LIVESTOCK_API_URL || '';
const CREAM = '#f7f2e8';
const OLIVE = '#3d6b34';
const RUST = '#8b3a2b';
const INK = '#2c2c2c';
const MUTED = '#6b6b6b';
const LORA = "'Lora', 'Times New Roman', serif";

const SIDEBAR_SECTIONS = [
  {
    id: 'for_sale',
    items: [
      { label: 'Alpacas', path: '/marketplaces/livestock/alpacas' },
      { label: 'Bison', path: '/marketplaces/livestock/bison' },
      { label: 'Buffalo', path: '/marketplaces/livestock/buffalo' },
      { label: 'Camels', path: '/marketplaces/livestock/camels' },
      { label: 'Cattle', path: '/marketplaces/livestock/cattle' },
      { label: 'Chickens', path: '/marketplaces/livestock/chickens' },
      { label: 'Crocodiles & Alligators', path: '/marketplaces/livestock/crocodiles' },
      { label: 'Deer', path: '/marketplaces/livestock/deer' },
      { label: 'Working Dogs', path: '/marketplaces/livestock/dogs' },
      { label: 'Donkeys', path: '/marketplaces/livestock/donkeys' },
      { label: 'Ducks', path: '/marketplaces/livestock/ducks' },
      { label: 'Emus', path: '/marketplaces/livestock/emus' },
      { label: 'Geese', path: '/marketplaces/livestock/geese' },
      { label: 'Goats', path: '/marketplaces/livestock/goats' },
      { label: 'Guinea Fowl', path: '/marketplaces/livestock/guinea-fowl' },
      { label: 'Honey Bees', path: '/marketplaces/livestock/honey-bees' },
      { label: 'Horses', path: '/marketplaces/livestock/horses' },
      { label: 'Llamas', path: '/marketplaces/livestock/llamas' },
      { label: 'Musk Ox', path: '/marketplaces/livestock/musk-ox' },
      { label: 'Ostriches', path: '/marketplaces/livestock/ostriches' },
      { label: 'Pheasants', path: '/marketplaces/livestock/pheasants' },
      { label: 'Pigeons', path: '/marketplaces/livestock/pigeons' },
      { label: 'Pigs', path: '/marketplaces/livestock/pigs' },
      { label: 'Quails', path: '/marketplaces/livestock/quails' },
      { label: 'Rabbits', path: '/marketplaces/livestock/rabbits' },
      { label: 'Sheep', path: '/marketplaces/livestock/sheep' },
      { label: 'Snails', path: '/marketplaces/livestock/snails' },
      { label: 'Turkeys', path: '/marketplaces/livestock/turkeys' },
      { label: 'Yaks', path: '/marketplaces/livestock/yaks' },
    ],
  },
  {
    id: 'studs',
    items: [
      { label: 'Alpaca Studs', path: '/marketplaces/livestock/studs/alpacas' },
      { label: 'Bison Studs', path: '/marketplaces/livestock/studs/bison' },
      { label: 'Buffalo Studs', path: '/marketplaces/livestock/studs/buffalo' },
      { label: 'Camel Studs', path: '/marketplaces/livestock/studs/camels' },
      { label: 'Cattle Studs', path: '/marketplaces/livestock/studs/cattle' },
      { label: 'Working Dog Studs', path: '/marketplaces/livestock/studs/dogs' },
      { label: 'Donkey Studs', path: '/marketplaces/livestock/studs/donkeys' },
      { label: 'Goat Studs', path: '/marketplaces/livestock/studs/goats' },
      { label: 'Horse Studs', path: '/marketplaces/livestock/studs/horses' },
      { label: 'Llama Studs', path: '/marketplaces/livestock/studs/llamas' },
      { label: 'Pig Studs', path: '/marketplaces/livestock/studs/pigs' },
      { label: 'Rabbit Studs', path: '/marketplaces/livestock/studs/rabbits' },
      { label: 'Sheep Studs', path: '/marketplaces/livestock/studs/sheep' },
      { label: 'Yak Studs', path: '/marketplaces/livestock/studs/yaks' },
    ],
  },
  {
    id: 'ranches',
    items: [
      { label: 'Alpaca Ranches', path: '/marketplaces/livestock/ranches/alpacas' },
      { label: 'Bees, Honey', path: '/marketplaces/livestock/ranches/honey-bees' },
      { label: 'Bison Ranches', path: '/marketplaces/livestock/ranches/bison' },
      { label: 'Buffalo Ranches', path: '/marketplaces/livestock/ranches/buffalo' },
      { label: 'Camel Ranches', path: '/marketplaces/livestock/ranches/camels' },
      { label: 'Cattle Ranches', path: '/marketplaces/livestock/ranches/cattle' },
      { label: 'Chicken Ranches', path: '/marketplaces/livestock/ranches/chickens' },
      { label: 'Crocodile & Alligator Ranches', path: '/marketplaces/livestock/ranches/crocodiles' },
      { label: 'Deer Ranches', path: '/marketplaces/livestock/ranches/deer' },
      { label: 'Working Dog Ranches', path: '/marketplaces/livestock/ranches/dogs' },
      { label: 'Donkey Ranches', path: '/marketplaces/livestock/ranches/donkeys' },
      { label: 'Duck Ranches', path: '/marketplaces/livestock/ranches/ducks' },
      { label: 'Emu Ranches', path: '/marketplaces/livestock/ranches/emus' },
      { label: 'Geese Ranches', path: '/marketplaces/livestock/ranches/geese' },
      { label: 'Goat Ranches', path: '/marketplaces/livestock/ranches/goats' },
      { label: 'Guinea Fowl Ranches', path: '/marketplaces/livestock/ranches/guinea-fowl' },
      { label: 'Horse Ranches', path: '/marketplaces/livestock/ranches/horses' },
      { label: 'Llama Ranches', path: '/marketplaces/livestock/ranches/llamas' },
      { label: 'Musk Ox Ranches', path: '/marketplaces/livestock/ranches/musk-ox' },
      { label: 'Ostrich Ranches', path: '/marketplaces/livestock/ranches/ostriches' },
      { label: 'Pheasant Ranches', path: '/marketplaces/livestock/ranches/pheasants' },
      { label: 'Pig Ranches', path: '/marketplaces/livestock/ranches/pigs' },
      { label: 'Pigeon Ranches', path: '/marketplaces/livestock/ranches/pigeons' },
      { label: 'Quail Ranches', path: '/marketplaces/livestock/ranches/quails' },
      { label: 'Rabbit Ranches', path: '/marketplaces/livestock/ranches/rabbits' },
      { label: 'Sheep Ranches', path: '/marketplaces/livestock/ranches/sheep' },
      { label: 'Snail Ranches', path: '/marketplaces/livestock/ranches/snails' },
      { label: 'Turkey Ranches', path: '/marketplaces/livestock/ranches/turkeys' },
      { label: 'Yak Ranches', path: '/marketplaces/livestock/ranches/yaks' },
    ],
  },
];

const QUICK_RANCHES = [
  { slug: 'cattle', label: 'Cattle' },
  { slug: 'sheep', label: 'Sheep' },
  { slug: 'horses', label: 'Horses' },
  { slug: 'goats', label: 'Goats' },
  { slug: 'alpacas', label: 'Alpacas' },
  { slug: 'pigs', label: 'Pigs' },
  { slug: 'chickens', label: 'Chickens' },
  { slug: 'bison', label: 'Bison' },
];

const SOCIAL_ICONS = [
  { key: 'facebook', icon: '/icons/facebook.png', alt: 'Facebook' },
  { key: 'x', icon: '/icons/TwitterX.png', alt: 'Twitter/X' },
  { key: 'instagram', icon: '/icons/instagramicon.png', alt: 'Instagram' },
  { key: 'pinterest', icon: '/icons/PinterestLogo.png', alt: 'Pinterest' },
  { key: 'youtube', icon: '/icons/YouTube.jpg', alt: 'YouTube' },
  { key: 'blog', icon: '/icons/BlogIcon.png', alt: 'Blog' },
  { key: 'truth_social', icon: '/icons/Truthsocial.png', alt: 'Truth Social' },
];

const filterLabelCls = 'block text-[10px] font-bold tracking-wider mb-1';
const selectCls = 'w-full rounded-md border px-3 py-2 text-sm';
const selectBorder = { borderColor: '#ddd8cc', color: INK };

function RanchCategoryFilters({ slug, onCategoryChange, onSpeciesChange }) {
  const { t } = useTranslation();
  const section = SIDEBAR_SECTIONS.find((s) => s.id === 'ranches') || SIDEBAR_SECTIONS[2];
  const currentPath = section.items.find((item) => item.path.endsWith(`/${slug}`))?.path
    || section.items[0]?.path
    || '';

  return (
    <>
      <div className="mb-4">
        <label className={filterLabelCls} style={{ color: MUTED }}>
          {t('livestock_mkt.filter_category', 'CATEGORY')}
        </label>
        <select
          value="ranches"
          onChange={(e) => onCategoryChange(e.target.value)}
          className={selectCls}
          style={selectBorder}
        >
          <option value="for_sale">{t('livestock_mkt.section_for_sale', 'Livestock for Sale')}</option>
          <option value="studs">{t('livestock_mkt.section_studs', 'Stud Services')}</option>
          <option value="ranches">{t('livestock_mkt.section_ranches', 'Ranches')}</option>
        </select>
      </div>
      <div className="mb-4">
        <label className={filterLabelCls} style={{ color: MUTED }}>
          {t('livestock_mkt.filter_animal_type', 'ANIMAL TYPE')}
        </label>
        <select
          value={currentPath}
          onChange={(e) => onSpeciesChange(e.target.value)}
          className={selectCls}
          style={selectBorder}
        >
          {section.items.map((item) => (
            <option key={item.path} value={item.path}>{item.label}</option>
          ))}
        </select>
      </div>
    </>
  );
}

function RanchCard({ ranch }) {
  const { t } = useTranslation();
  const [logoFailed, setLogoFailed] = useState(false);
  const profileUrl = `/marketplaces/livestock/ranch/${ranch.business_id}`;
  const location = [ranch.city, ranch.state, ranch.country].filter(Boolean).join(', ');

  return (
    <article
      className="mb-4 rounded-xl border bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      style={{ borderColor: '#e5e0d6' }}
    >
      <div className="px-4 py-3 flex items-center justify-between gap-3" style={{ backgroundColor: '#2c241c' }}>
        <Link
          to={profileUrl}
          className="no-underline text-white font-semibold text-base truncate"
          style={{ fontFamily: LORA }}
        >
          {ranch.business_name}
        </Link>
        <div className="flex gap-1.5 shrink-0 items-center">
          {ranch.has_animals && (
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: OLIVE }}>
              {t('ranch_list.animals_for_sale', 'For sale')}
            </span>
          )}
          {ranch.has_studs && (
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: RUST }}>
              {t('ranch_list.stud_services', 'Studs')}
            </span>
          )}
          <SaveButton itemType="ranch" itemId={ranch.business_id} size={18} />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 p-4">
        <div className="sm:w-[160px] shrink-0 flex items-center justify-center rounded-lg bg-[#efe9df] min-h-[100px] overflow-hidden">
          {!logoFailed && ranch.logo ? (
            <Link to={profileUrl} className="block w-full h-full p-3">
              <img
                src={ranch.logo}
                alt={ranch.business_name}
                loading="lazy"
                onError={() => setLogoFailed(true)}
                className="w-full h-full max-h-[110px] object-contain"
              />
            </Link>
          ) : (
            <span className="text-xs px-3 text-center" style={{ color: MUTED }}>
              {t('ranch_list.no_logo', 'No logo')}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col">
          {location && (
            <p className="m-0 mb-2 text-sm" style={{ color: MUTED }}>{location}</p>
          )}

          <div className="flex gap-2 mb-3 flex-wrap">
            {SOCIAL_ICONS.map((s) => (ranch[s.key] ? (
              <a key={s.key} href={ranch[s.key]} target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100">
                <img
                  src={s.icon}
                  alt={s.alt}
                  className="w-5 h-5 object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </a>
            ) : null))}
          </div>

          <div className="mt-auto flex flex-wrap gap-2">
            <Link
              to={`${profileUrl}?tab=contact`}
              className="inline-flex rounded-lg px-4 py-2 text-sm font-semibold no-underline border bg-white"
              style={{ color: INK, borderColor: '#d0c8ba' }}
            >
              {t('ranch_list.contact_ranch', 'Contact')}
            </Link>
            <Link
              to={profileUrl}
              className="inline-flex rounded-lg px-4 py-2 text-sm font-semibold no-underline text-white"
              style={{ backgroundColor: OLIVE }}
            >
              {t('ranch_list.profile', 'View profile')}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function Pagination({ page, totalPages, onPageChange }) {
  const { t } = useTranslation();
  if (totalPages <= 1) return null;
  const pages = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) pages.push(i);

  const btn = (active) => ({
    padding: '6px 12px',
    border: `1px solid ${active ? OLIVE : '#ddd8cc'}`,
    borderRadius: '8px',
    backgroundColor: active ? OLIVE : '#fff',
    color: active ? '#fff' : INK,
    cursor: 'pointer',
    fontSize: '0.85rem',
  });

  return (
    <div className="flex gap-1.5 flex-wrap my-4">
      {page > 1 && (
        <button type="button" onClick={() => onPageChange(page - 1)} style={btn(false)}>
          {t('ranch_list.prev', 'Prev')}
        </button>
      )}
      {pages.map((p) => (
        <button key={p} type="button" onClick={() => onPageChange(p)} style={btn(p === page)}>
          {p}
        </button>
      ))}
      {page < totalPages && (
        <button type="button" onClick={() => onPageChange(page + 1)} style={btn(false)}>
          {t('ranch_list.next', 'Next')}
        </button>
      )}
    </div>
  );
}

export default function RanchList() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nameFilter, setNameFilter] = useState('');
  const [page, setPage] = useState(1);
  const [singularTerm, setSingularTerm] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/marketplace/species/${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setSingularTerm(d.singular_term || ''))
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    setNameFilter('');
    setPage(1);
    setData(null);
  }, [slug]);

  const loadData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, name: nameFilter });
    fetch(`${API_URL}/api/ranches/list/${slug}?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setData(d ? { ...d, ranches: d.ranches || [] } : { total: 0, page: 1, per_page: 10, total_pages: 1, ranches: [] });
        setLoading(false);
      })
      .catch(() => {
        setData({ total: 0, page: 1, per_page: 10, total_pages: 1, ranches: [] });
        setLoading(false);
      });
  }, [slug, page, nameFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const rawLabel = data?.label || slug;
  const fallbackLabel = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
  const label = singularTerm || fallbackLabel;

  const handleCategoryChange = (nextCategory) => {
    if (nextCategory === 'ranches') return;
    if (nextCategory === 'studs') {
      navigate(`/marketplaces/livestock/studs/${slug}`);
      return;
    }
    navigate(`/marketplaces/livestock/${slug}`);
  };

  const handleSpeciesChange = (path) => {
    if (path) navigate(path);
  };

  const guest = !isLoggedIn();
  const firstName = typeof window !== 'undefined' ? localStorage.getItem('first_name') || '' : '';

  const modeTabs = (
    <div className="flex flex-wrap gap-2 mb-5">
      {[
        { id: 'for_sale', label: 'For sale', to: `/marketplaces/livestock/${slug}` },
        { id: 'studs', label: 'Stud services', to: `/marketplaces/livestock/studs/${slug}` },
        { id: 'ranches', label: 'Ranches', to: `/marketplaces/livestock/ranches/${slug}` },
      ].map((tab) => {
        const active = tab.id === 'ranches';
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => navigate(tab.to)}
            className="rounded-full px-4 py-2 text-sm font-semibold border cursor-pointer"
            style={{
              backgroundColor: active ? OLIVE : '#fff',
              color: active ? '#fff' : INK,
              borderColor: active ? OLIVE : '#e0d8cc',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );

  const speciesChips = (
    <div className="mb-5">
      <p className="m-0 mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: OLIVE }}>
        Popular ranch categories
      </p>
      <div className="flex flex-wrap gap-2">
        {QUICK_RANCHES.map((s) => {
          const active = slug === s.slug;
          return (
            <Link
              key={s.slug}
              to={`/marketplaces/livestock/ranches/${s.slug}`}
              className="rounded-full px-3.5 py-1.5 text-xs font-semibold no-underline border"
              style={{
                backgroundColor: active ? OLIVE : '#fff',
                color: active ? '#fff' : INK,
                borderColor: active ? OLIVE : '#e0d8cc',
              }}
            >
              {s.label}
            </Link>
          );
        })}
      </div>
    </div>
  );

  const filtersAside = (
    <aside
      className="rounded-xl border bg-white p-4 shadow-sm h-fit lg:sticky lg:top-6"
      style={{ borderColor: '#e5e0d6' }}
    >
      <h3 className="text-xs font-bold tracking-widest m-0 mb-4" style={{ color: INK }}>
        {t('livestock_mkt.filters', 'FILTERS')}
      </h3>
      {guest ? (
        <RanchCategoryFilters
          slug={slug}
          onCategoryChange={handleCategoryChange}
          onSpeciesChange={handleSpeciesChange}
        />
      ) : (
        <div className="mb-4">
          <label className={filterLabelCls} style={{ color: MUTED }}>
            SPECIES
          </label>
          <select
            value={`/marketplaces/livestock/ranches/${slug}`}
            onChange={(e) => handleSpeciesChange(e.target.value)}
            className={selectCls}
            style={selectBorder}
          >
            {(SIDEBAR_SECTIONS.find((s) => s.id === 'ranches')?.items || []).map((item) => (
              <option key={item.path} value={item.path}>{item.label}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className={filterLabelCls} style={{ color: MUTED }}>
          {t('ranch_list.search_placeholder', 'Search ranches')}
        </label>
        <input
          type="text"
          value={nameFilter}
          onChange={(e) => { setNameFilter(e.target.value); setPage(1); }}
          placeholder={t('ranch_list.search_placeholder', 'Search ranches')}
          className={selectCls}
          style={selectBorder}
        />
      </div>
    </aside>
  );

  const resultsBlock = (
    <div>
      {loading ? (
        <div>
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse mb-4 rounded-xl overflow-hidden border"
              style={{ borderColor: '#e5e0d6' }}
            >
              <div className="h-11 bg-[#3a3028]" />
              <div className="flex p-4 gap-4">
                <div className="w-[140px] h-[100px] bg-[#e8e0d4] rounded-lg shrink-0" />
                <div className="flex-1 space-y-3 pt-1">
                  <div className="h-3 bg-[#e8e0d4] rounded w-1/2" />
                  <div className="h-3 bg-[#e8e0d4] rounded w-1/3" />
                  <div className="h-8 bg-[#e8e0d4] rounded w-1/4 mt-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !data || data.ranches.length === 0 ? (
        <div
          className="rounded-xl border bg-white p-8 text-center"
          style={{ borderColor: '#e5e0d6' }}
        >
          <h4 className="m-0 mb-2 font-bold" style={{ fontFamily: LORA, color: INK }}>
            {t('ranch_list.no_ranches_title', 'No ranches found')}
          </h4>
          <p className="m-0 mb-4 text-sm" style={{ color: MUTED }}>
            {t('ranch_list.no_ranches_body', { label }) || `No ${label.toLowerCase()} ranches match your search right now.`}
          </p>
          <Link to="/animals" className="text-sm font-semibold no-underline" style={{ color: OLIVE }}>
            Back to marketplace →
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <p className="m-0 text-sm" style={{ color: MUTED }}>
              {guest
                ? t(
                    'guest_access.showing_preview',
                    'Showing {{count}} of {{total}} listings (preview)',
                    {
                      count: Math.min(GUEST_LIST_PREVIEW, data.ranches.length),
                      total: data.total,
                    },
                  )
                : t('ranch_list.ranches_found', { count: data.total })}
            </p>
          </div>
          {!guest && <Pagination page={page} totalPages={data.total_pages} onPageChange={setPage} />}
          {(guest ? data.ranches.slice(0, GUEST_LIST_PREVIEW) : data.ranches).map((ranch) => (
            <RanchCard key={ranch.business_id} ranch={ranch} />
          ))}
          {guest ? (
            <GuestAccessPrompt
              className="mt-4"
              title={t('guest_access.mkt_title', 'Sign in for full marketplace access')}
              message={t(
                'guest_access.mkt_list',
                'Guests can preview a few listings. Sign in or create an account to browse all animals, compare prices, and contact sellers.',
              )}
            />
          ) : (
            <Pagination page={page} totalPages={data.total_pages} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );

  /* ── Customer (logged-in) view ── */
  if (!guest) {
    return (
      <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: CREAM }}>
        <PageMeta
          title={`${label} Ranches | Livestock of America`}
          description={`Browse ${label.toLowerCase()} ranches and farms.`}
          noIndex
        />

        <div className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-6 md:py-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
              <p className="m-0 mb-1 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: OLIVE }}>
                Customer marketplace
              </p>
              <h1
                className="m-0 text-2xl md:text-3xl font-bold"
                style={{ fontFamily: LORA, color: INK }}
              >
                {label} Ranches
              </h1>
              <p className="m-0 mt-1 text-sm" style={{ color: MUTED }}>
                {firstName ? `Welcome back, ${firstName}. ` : ''}
                Explore {label.toLowerCase()} operations and contact breeders directly.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Link
                to="/seller/animals?tab=saved"
                className="inline-flex rounded-lg px-4 py-2.5 text-sm font-semibold no-underline border bg-white"
                style={{ color: OLIVE, borderColor: OLIVE }}
              >
                Saved
              </Link>
              <Link
                to="/animals"
                className="inline-flex rounded-lg px-4 py-2.5 text-sm font-semibold no-underline text-white"
                style={{ backgroundColor: OLIVE }}
              >
                All listings
              </Link>
            </div>
          </div>

          {modeTabs}
          {speciesChips}

          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 items-start">
            {filtersAside}
            {resultsBlock}
          </div>
        </div>
      </div>
    );
  }

  /* ── Public marketing view ── */
  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: CREAM }}>
      <PageMeta
        title={`${label} Ranches & Farms Directory`}
        description={`Browse ${label.toLowerCase()} ranches and farms across the United States. Find breeders, contact ranchers directly, and discover quality livestock operations on Livestock of America.`}
        keywords={`${label.toLowerCase()} ranches, ${label.toLowerCase()} farms, ${label.toLowerCase()} breeders directory, livestock ranchers, ranch directory`}
        canonical={`https://livestockofamerica.com/marketplaces/livestock/ranches/${slug}`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: `${label} Ranches & Farms Directory`,
          url: `https://livestockofamerica.com/marketplaces/livestock/ranches/${slug}`,
          description: `Directory of ${label.toLowerCase()} ranches and farms.`,
        }}
      />
      <Header />
      <LivestockHeroTabs />

      <div className="max-w-[1300px] mx-auto px-4 pt-3">
        <Breadcrumbs items={[
          { label: 'Home', to: '/' },
          { label: 'Marketplaces', to: '/marketplaces' },
          { label: 'Livestock', to: '/marketplaces/livestock' },
          { label: t('ranch_list.breadcrumb_ranches', 'Ranches') },
          { label: `${label} Ranches` },
        ]} />
      </div>

      <div className="max-w-[1300px] mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <p className="m-0 mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: RUST }}>
              Ranch Directory
            </p>
            <h2
              className="m-0 text-2xl md:text-3xl font-bold"
              style={{ fontFamily: LORA, color: INK }}
            >
              {label} Ranches
            </h2>
            <p className="m-0 mt-2 text-sm max-w-xl" style={{ color: MUTED }}>
              Explore {label.toLowerCase()} operations, contact breeders, and see who has animals or studs available.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/marketplaces/livestock/${slug}`}
              className="inline-flex rounded-lg px-4 py-2 text-sm font-semibold no-underline border bg-white"
              style={{ color: INK, borderColor: '#d0c8ba' }}
            >
              {label} for Sale →
            </Link>
            <Link
              to={`/marketplaces/livestock/studs/${slug}`}
              className="inline-flex rounded-lg px-4 py-2 text-sm font-semibold no-underline text-white"
              style={{ backgroundColor: OLIVE }}
            >
              {label} Studs
            </Link>
          </div>
        </div>

        {speciesChips}

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 items-start">
          {filtersAside}
          {resultsBlock}
        </div>
      </div>

      <section style={{ backgroundColor: '#efe9df' }}>
        <div className="max-w-[1300px] mx-auto px-4 py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <h3 className="m-0 mb-1 text-lg font-bold" style={{ fontFamily: LORA, color: INK }}>
              Ready to list your ranch?
            </h3>
            <p className="m-0 text-sm" style={{ color: MUTED }}>
              Create a free account to publish listings and put your operation in front of buyers nationwide.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/signup"
              className="inline-flex rounded-lg px-5 py-2.5 text-sm font-semibold no-underline text-white"
              style={{ backgroundColor: OLIVE }}
            >
              Create free account
            </Link>
            <Link
              to={`/livestock/${slug}`}
              className="inline-flex rounded-lg px-5 py-2.5 text-sm font-semibold no-underline border bg-white"
              style={{ color: INK, borderColor: '#d0c8ba' }}
            >
              Breed knowledgebase
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
