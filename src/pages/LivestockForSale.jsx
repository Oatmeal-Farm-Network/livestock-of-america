import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router';
import { useTranslation } from '../lib/i18n';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';
import SaveButton from '../components/SaveButton';
import ListingPhoto from '../components/ListingPhoto';
import GuestAccessPrompt, { GUEST_LIST_PREVIEW } from '../components/GuestAccessPrompt';
import { isLoggedIn } from '../lib/auth';

const API_URL = import.meta.env.VITE_LIVESTOCK_API_URL || '';
const CREAM = '#f7f2e8';
const OLIVE = '#3d6b34';
const RUST = '#8b3a2b';
const INK = '#2c2c2c';
const MUTED = '#6b6b6b';
const LORA = "'Lora', 'Times New Roman', serif";

// Events are hidden for now, matching the header and the workspace sidebar.
// This badge also pointed at /events/:id, which has no route — it fell through
// to the catch-all and bounced the visitor to the homepage. Flip to true when
// events come back, and add that route.
const SHOW_EVENT_BADGE = false;

const ANCESTRY_OPTIONS = [
  'Any', 'Full Peruvian', 'Partial Peruvian',
  'Full Chilean', 'Partial Chilean',
  'Full Bolivian', 'Partial Bolivian',
];

const US_STATE_ABBR = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas',
  KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts',
  MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
  NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico',
  NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia',
};

const SIDEBAR_SECTIONS = [
  {
    id: 'for_sale',
    items: [
      { key: 'sp_alpacas', path: '/marketplaces/livestock/alpacas' },
      { key: 'sp_bison', path: '/marketplaces/livestock/bison' },
      { key: 'sp_buffalo', path: '/marketplaces/livestock/buffalo' },
      { key: 'sp_camels', path: '/marketplaces/livestock/camels' },
      { key: 'sp_cattle', path: '/marketplaces/livestock/cattle' },
      { key: 'sp_chickens', path: '/marketplaces/livestock/chickens' },
      { key: 'sp_crocodiles', path: '/marketplaces/livestock/crocodiles' },
      { key: 'sp_deer', path: '/marketplaces/livestock/deer' },
      { key: 'sp_dogs', path: '/marketplaces/livestock/dogs' },
      { key: 'sp_donkeys', path: '/marketplaces/livestock/donkeys' },
      { key: 'sp_ducks', path: '/marketplaces/livestock/ducks' },
      { key: 'sp_emus', path: '/marketplaces/livestock/emus' },
      { key: 'sp_geese', path: '/marketplaces/livestock/geese' },
      { key: 'sp_goats', path: '/marketplaces/livestock/goats' },
      { key: 'sp_guinea_fowl', path: '/marketplaces/livestock/guinea-fowl' },
      { key: 'sp_honey_bees', path: '/marketplaces/livestock/honey-bees' },
      { key: 'sp_horses', path: '/marketplaces/livestock/horses' },
      { key: 'sp_llamas', path: '/marketplaces/livestock/llamas' },
      { key: 'sp_musk_ox', path: '/marketplaces/livestock/musk-ox' },
      { key: 'sp_ostriches', path: '/marketplaces/livestock/ostriches' },
      { key: 'sp_pheasants', path: '/marketplaces/livestock/pheasants' },
      { key: 'sp_pigeons', path: '/marketplaces/livestock/pigeons' },
      { key: 'sp_pigs', path: '/marketplaces/livestock/pigs' },
      { key: 'sp_quails', path: '/marketplaces/livestock/quails' },
      { key: 'sp_rabbits', path: '/marketplaces/livestock/rabbits' },
      { key: 'sp_sheep', path: '/marketplaces/livestock/sheep' },
      { key: 'sp_snails', path: '/marketplaces/livestock/snails' },
      { key: 'sp_turkeys', path: '/marketplaces/livestock/turkeys' },
      { key: 'sp_yaks', path: '/marketplaces/livestock/yaks' },
    ],
  },
  {
    id: 'studs',
    items: [
      { key: 'sp_alpaca_studs', path: '/marketplaces/livestock/studs/alpacas' },
      { key: 'sp_bison_studs', path: '/marketplaces/livestock/studs/bison' },
      { key: 'sp_buffalo_studs', path: '/marketplaces/livestock/studs/buffalo' },
      { key: 'sp_camel_studs', path: '/marketplaces/livestock/studs/camels' },
      { key: 'sp_cattle_studs', path: '/marketplaces/livestock/studs/cattle' },
      { key: 'sp_dog_studs', path: '/marketplaces/livestock/studs/dogs' },
      { key: 'sp_donkey_studs', path: '/marketplaces/livestock/studs/donkeys' },
      { key: 'sp_goat_studs', path: '/marketplaces/livestock/studs/goats' },
      { key: 'sp_horse_studs', path: '/marketplaces/livestock/studs/horses' },
      { key: 'sp_llama_studs', path: '/marketplaces/livestock/studs/llamas' },
      { key: 'sp_pig_studs', path: '/marketplaces/livestock/studs/pigs' },
      { key: 'sp_rabbit_studs', path: '/marketplaces/livestock/studs/rabbits' },
      { key: 'sp_sheep_studs', path: '/marketplaces/livestock/studs/sheep' },
      { key: 'sp_yak_studs', path: '/marketplaces/livestock/studs/yaks' },
    ],
  },
  {
    id: 'ranches',
    items: [
      { key: 'sp_alpaca_ranches', path: '/marketplaces/livestock/ranches/alpacas' },
      { key: 'sp_bees_honey', path: '/marketplaces/livestock/ranches/honey-bees' },
      { key: 'sp_bison_ranches', path: '/marketplaces/livestock/ranches/bison' },
      { key: 'sp_buffalo_ranches', path: '/marketplaces/livestock/ranches/buffalo' },
      { key: 'sp_camel_ranches', path: '/marketplaces/livestock/ranches/camels' },
      { key: 'sp_cattle_ranches', path: '/marketplaces/livestock/ranches/cattle' },
      { key: 'sp_chicken_ranches', path: '/marketplaces/livestock/ranches/chickens' },
      { key: 'sp_crocodile_ranches', path: '/marketplaces/livestock/ranches/crocodiles' },
      { key: 'sp_deer_ranches', path: '/marketplaces/livestock/ranches/deer' },
      { key: 'sp_dog_ranches', path: '/marketplaces/livestock/ranches/dogs' },
      { key: 'sp_donkey_ranches', path: '/marketplaces/livestock/ranches/donkeys' },
      { key: 'sp_duck_ranches', path: '/marketplaces/livestock/ranches/ducks' },
      { key: 'sp_emu_ranches', path: '/marketplaces/livestock/ranches/emus' },
      { key: 'sp_geese_ranches', path: '/marketplaces/livestock/ranches/geese' },
      { key: 'sp_goat_ranches', path: '/marketplaces/livestock/ranches/goats' },
      { key: 'sp_guinea_fowl_ranches', path: '/marketplaces/livestock/ranches/guinea-fowl' },
      { key: 'sp_horse_ranches', path: '/marketplaces/livestock/ranches/horses' },
      { key: 'sp_llama_ranches', path: '/marketplaces/livestock/ranches/llamas' },
      { key: 'sp_musk_ox_ranches', path: '/marketplaces/livestock/ranches/musk-ox' },
      { key: 'sp_ostrich_ranches', path: '/marketplaces/livestock/ranches/ostriches' },
      { key: 'sp_pheasant_ranches', path: '/marketplaces/livestock/ranches/pheasants' },
      { key: 'sp_pig_ranches', path: '/marketplaces/livestock/ranches/pigs' },
      { key: 'sp_pigeon_ranches', path: '/marketplaces/livestock/ranches/pigeons' },
      { key: 'sp_quail_ranches', path: '/marketplaces/livestock/ranches/quails' },
      { key: 'sp_rabbit_ranches', path: '/marketplaces/livestock/ranches/rabbits' },
      { key: 'sp_sheep_ranches', path: '/marketplaces/livestock/ranches/sheep' },
      { key: 'sp_snail_ranches', path: '/marketplaces/livestock/ranches/snails' },
      { key: 'sp_turkey_ranches', path: '/marketplaces/livestock/ranches/turkeys' },
      { key: 'sp_yak_ranches', path: '/marketplaces/livestock/ranches/yaks' },
    ],
  },
];

const QUICK_STUDS = [
  { slug: 'cattle', label: 'Cattle' },
  { slug: 'horses', label: 'Horses' },
  { slug: 'sheep', label: 'Sheep' },
  { slug: 'goats', label: 'Goats' },
  { slug: 'alpacas', label: 'Alpacas' },
  { slug: 'pigs', label: 'Pigs' },
  { slug: 'llamas', label: 'Llamas' },
  { slug: 'dogs', label: 'Dogs' },
];

const filterLabelCls = 'block text-[10px] font-bold tracking-wider mb-1';
const selectCls = 'w-full rounded-md border px-3 py-2 text-sm';
const selectBorder = { borderColor: '#ddd8cc', color: INK };

function CategoryFilters({ categoryId, slug, onCategoryChange, onSpeciesChange }) {
  const { t } = useTranslation();
  const section = SIDEBAR_SECTIONS.find((s) => s.id === categoryId) || SIDEBAR_SECTIONS[0];
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
          value={categoryId}
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
            <option key={item.key} value={item.path}>
              {t(`livestock_mkt.${item.key}`)}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}

function AnimalCard({ animal, type }) {
  const { t } = useTranslation();
  const guest = !isLoggedIn();
  const detailUrl = `/marketplaces/livestock/animal/${animal.animal_id}`;
  const priceVal = type === 'studs' ? animal.stud_fee : animal.price;
  const priceLabel = type === 'studs'
    ? t('livestock_mkt.stud_fee_label', 'Stud fee')
    : t('livestock_mkt.price_label', 'Price');
  const priceDisplay = guest
    ? t('guest_access.members_only', 'Sign in to view')
    : priceVal
      ? `$${Math.round(priceVal).toLocaleString()}`
      : t('livestock_mkt.call_for_price_lc', 'Call for price');
  const breeds = animal.breeds?.length ? animal.breeds.join(', ') : 'N/A';
  const ev = animal.upcoming_event;
  const evDate = ev?.EventStartDate ? new Date(ev.EventStartDate) : null;
  const evDateStr = evDate && !Number.isNaN(evDate)
    ? evDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '';

  return (
    <article
      className="mb-4 rounded-xl border bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
      style={{ borderColor: '#e5e0d6' }}
    >
      <div className="flex flex-col sm:flex-row">
        <Link
          to={detailUrl}
          className="sm:w-[200px] shrink-0 aspect-[4/3] sm:aspect-auto sm:min-h-[180px] overflow-hidden bg-[#efe9df] block relative"
        >
          <ListingPhoto
            src={animal.photo}
            alt={animal.full_name}
            imgClassName="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute top-2 right-2 z-10" onClick={(e) => e.preventDefault()}>
            <SaveButton itemType={type === 'studs' ? 'stud' : 'animal'} itemId={animal.animal_id} />
          </div>
        </Link>
        <div className="flex-1 p-4 min-w-0 flex flex-col">
          <Link
            to={detailUrl}
            className="no-underline text-lg font-bold leading-snug mb-2"
            style={{ fontFamily: LORA, color: INK }}
          >
            {animal.full_name}
          </Link>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm mb-3" style={{ color: MUTED }}>
            <p className="m-0">
              <span className="font-semibold" style={{ color: INK }}>{priceLabel}:</span>{' '}
              <span style={{ color: OLIVE, fontWeight: 600 }}>{priceDisplay}</span>
            </p>
            <p className="m-0">
              <span className="font-semibold" style={{ color: INK }}>{t('livestock_mkt.filter_breed', 'Breed')}:</span>{' '}
              {breeds}
            </p>
            <p className="m-0">
              <span className="font-semibold" style={{ color: INK }}>{t('livestock_mkt.filter_state', 'Location')}:</span>{' '}
              {animal.location || 'N/A'}
            </p>
            <p className="m-0">
              <span className="font-semibold" style={{ color: INK }}>{t('livestock_mkt.filter_ranch', 'Ranch')}:</span>{' '}
              {animal.seller || 'N/A'}
            </p>
          </div>
          {SHOW_EVENT_BADGE && ev && (
            <Link
              to={`/events/${ev.EventID}`}
              className="inline-flex self-start mb-3 rounded-full px-3 py-1 text-xs font-semibold no-underline"
              style={{ backgroundColor: '#eef3e7', color: OLIVE }}
            >
              {t('livestock_mkt.see_in_person', { name: ev.EventName })}
              {evDateStr ? ` · ${evDateStr}` : ''}
            </Link>
          )}
          <div className="mt-auto">
            <Link
              to={detailUrl}
              className="inline-flex rounded-lg px-4 py-2 text-sm font-semibold no-underline text-white"
              style={{ backgroundColor: OLIVE }}
            >
              {t('livestock_mkt.view_details', 'View details')}
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
          {t('livestock_mkt.pagination_prev', 'Prev')}
        </button>
      )}
      {pages.map((p) => (
        <button key={p} type="button" onClick={() => onPageChange(p)} style={btn(p === page)}>
          {p}
        </button>
      ))}
      {page < totalPages && (
        <button type="button" onClick={() => onPageChange(page + 1)} style={btn(false)}>
          {t('livestock_mkt.pagination_next', 'Next')}
        </button>
      )}
      {totalPages > 5 && page < totalPages && (
        <button type="button" onClick={() => onPageChange(totalPages)} style={btn(false)}>
          {t('livestock_mkt.pagination_last', 'Last')}
        </button>
      )}
    </div>
  );
}

export default function LivestockForSale() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { pathname } = window.location;
  const isStuds = pathname.includes('/studs/');
  const categoryId = isStuds ? 'studs' : 'for_sale';

  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({ breeds: [], states: [], ranches: [] });
  const [loading, setLoading] = useState(true);

  const [breedId, setBreedId] = useState(Number(searchParams.get('breed_id')) || 0);
  const [stateIndex, setStateIndex] = useState(Number(searchParams.get('state_index')) || 0);
  const [businessId, setBusinessId] = useState(Number(searchParams.get('business_id')) || 0);
  const [ranchSearch, setRanchSearch] = useState('');
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');
  const [ancestry, setAncestry] = useState(searchParams.get('ancestry') || 'Any');
  const [sortBy, setSortBy] = useState(searchParams.get('sort_by') || 'lastupdated');
  const [orderBy, setOrderBy] = useState(searchParams.get('order_by') || 'desc');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  useEffect(() => {
    setBreedId(0);
    setStateIndex(0);
    setBusinessId(0);
    setRanchSearch('');
    setMinPrice('');
    setMaxPrice('');
    setAncestry('Any');
    setSortBy('lastupdated');
    setOrderBy('desc');
    setPage(1);
    setData(null);
  }, [slug]);

  useEffect(() => {
    fetch(`${API_URL}/api/marketplace/filters/${slug}`)
      .then((r) => (r.ok ? r.json() : { breeds: [], states: [], ranches: [] }))
      .then((d) => setFilters({ breeds: d.breeds || [], states: d.states || [], ranches: d.ranches || [] }))
      .catch(() => setFilters({ breeds: [], states: [], ranches: [] }));
  }, [slug]);

  const [singularTerm, setSingularTerm] = useState('');
  useEffect(() => {
    fetch(`${API_URL}/api/marketplace/species/${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setSingularTerm(d.singular_term || ''))
      .catch(() => {});
  }, [slug]);

  const loadData = useCallback(() => {
    setLoading(true);
    const endpoint = isStuds ? 'studs' : 'for-sale';
    const priceParam = isStuds ? 'stud_fee' : 'price';
    const params = new URLSearchParams({
      page,
      breed_id: breedId,
      state_index: stateIndex,
      business_id: businessId,
      [`min_${priceParam}`]: minPrice || 0,
      [`max_${priceParam}`]: maxPrice || 100000000,
      ancestry,
      sort_by: sortBy,
      order_by: orderBy,
    });
    fetch(`${API_URL}/api/marketplace/${endpoint}/${slug}?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setData(d ? { ...d, animals: d.animals || [] } : { total: 0, page: 1, per_page: 10, total_pages: 1, animals: [] });
        setLoading(false);
      })
      .catch(() => {
        setData({ total: 0, page: 1, per_page: 10, total_pages: 1, animals: [] });
        setLoading(false);
      });
  }, [slug, page, breedId, stateIndex, businessId, minPrice, maxPrice, ancestry, sortBy, orderBy, isStuds]);

  useEffect(() => { loadData(); }, [loadData]);

  const rawLabel = data?.label || slug;
  const fallbackLabel = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
  const label = singularTerm || fallbackLabel;
  const pageTitle = isStuds
    ? `${label} ${t('livestock_mkt.stud_services_suffix', 'Stud Services')}`
    : `${label} ${t('livestock_mkt.for_sale_suffix', 'for Sale')}`;
  const otherLink = isStuds ? `/marketplaces/livestock/${slug}` : `/marketplaces/livestock/studs/${slug}`;
  const otherLabel = isStuds
    ? `${label} ${t('livestock_mkt.for_sale_suffix', 'for Sale')}`
    : `${label} ${t('livestock_mkt.stud_services_suffix', 'Stud Services')}`;
  const priceFilterMinKey = isStuds ? 'min_stud_fee' : 'min_price';
  const priceFilterMaxKey = isStuds ? 'max_stud_fee' : 'max_price';
  const ranchDirLink = `/marketplaces/livestock/ranches/${slug}`;

  const metaDesc = isStuds
    ? `Browse ${label.toLowerCase()} stud services from ranchers and breeders across the US. Compare fees, genetics, and connect with breeders on Livestock of America.`
    : `Browse ${label.toLowerCase()} for sale from ranchers and breeders across the US. Filter by breed, state, price, and ancestry on Livestock of America.`;
  const metaCanonical = isStuds
    ? `https://livestockofamerica.com/marketplaces/livestock/studs/${slug}`
    : `https://livestockofamerica.com/marketplaces/livestock/${slug}`;

  const handleCategoryChange = (nextCategory) => {
    const section = SIDEBAR_SECTIONS.find((s) => s.id === nextCategory);
    if (!section?.items?.length) return;
    const match = section.items.find((item) => item.path.endsWith(`/${slug}`));
    navigate(match?.path || section.items[0].path);
  };

  const handleSpeciesChange = (path) => {
    if (path) navigate(path);
  };

  const cleanStates = (() => {
    const byName = new Map();
    filters.states.forEach((s) => {
      const idx = Number(s.state_index);
      const name = (s.state || '').trim();
      if (!idx || idx <= 0 || !name || /^\d+$/.test(name) || name.length < 2) return;
      const upper = name.toUpperCase();
      const pretty = US_STATE_ABBR[upper]
        || (name.length <= 2 ? upper : name.charAt(0).toUpperCase() + name.slice(1).toLowerCase());
      const existing = byName.get(pretty);
      if (!existing || idx < existing) byName.set(pretty, idx);
    });
    return Array.from(byName.entries())
      .map(([name, index]) => ({ index, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  })();

  const guest = !isLoggedIn();
  const firstName = typeof window !== 'undefined' ? localStorage.getItem('first_name') || '' : '';
  const mode = isStuds ? 'studs' : 'for_sale';

  const modeTabs = (
    <div className="flex flex-wrap gap-2 mb-5">
      {[
        { id: 'for_sale', label: 'For sale', to: `/marketplaces/livestock/${slug}` },
        { id: 'studs', label: 'Stud services', to: `/marketplaces/livestock/studs/${slug}` },
        { id: 'ranches', label: 'Ranches', to: `/marketplaces/livestock/ranches/${slug}` },
      ].map((tab) => {
        const active = mode === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              if (tab.id === 'ranches' && guest) {
                navigate('/login', { state: { from: { pathname: tab.to } } });
                return;
              }
              navigate(tab.to);
            }}
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
        {isStuds ? 'Popular stud categories' : 'Browse species'}
      </p>
      <div className="flex flex-wrap gap-2">
        {QUICK_STUDS.map((s) => {
          const active = slug === s.slug;
          const to = isStuds
            ? `/marketplaces/livestock/studs/${s.slug}`
            : `/marketplaces/livestock/${s.slug}`;
          return (
            <Link
              key={s.slug}
              to={to}
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

      {guest && (
        <CategoryFilters
          categoryId={categoryId}
          slug={slug}
          onCategoryChange={handleCategoryChange}
          onSpeciesChange={handleSpeciesChange}
        />
      )}

      {!guest && (
        <div className="mb-4">
          <label className={filterLabelCls} style={{ color: MUTED }}>
            SPECIES
          </label>
          <select
            value={
              isStuds
                ? `/marketplaces/livestock/studs/${slug}`
                : `/marketplaces/livestock/${slug}`
            }
            onChange={(e) => handleSpeciesChange(e.target.value)}
            className={selectCls}
            style={selectBorder}
          >
            {(SIDEBAR_SECTIONS.find((s) => s.id === categoryId)?.items || []).map((item) => (
              <option key={item.path} value={item.path}>
                {t(`livestock_mkt.${item.key}`, item.key.replace(/^sp_/, '').replace(/_/g, ' '))}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mb-4">
        <label className={filterLabelCls} style={{ color: MUTED }}>
          {t('livestock_mkt.filter_breed', 'BREED')}
        </label>
        <select
          value={breedId}
          onChange={(e) => { setBreedId(Number(e.target.value)); setPage(1); }}
          className={selectCls}
          style={selectBorder}
        >
          <option value={0}>{t('livestock_mkt.all_breeds', 'All Breeds')}</option>
          {filters.breeds.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {cleanStates.length > 0 && (
        <div className="mb-4">
          <label className={filterLabelCls} style={{ color: MUTED }}>
            {t('livestock_mkt.filter_state', 'LOCATION')}
          </label>
          <select
            value={stateIndex}
            onChange={(e) => { setStateIndex(Number(e.target.value)); setPage(1); }}
            className={selectCls}
            style={selectBorder}
          >
            <option value={0}>{t('livestock_mkt.all_states', 'All States')}</option>
            {cleanStates.map((s) => (
              <option key={s.index} value={s.index}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      {filters.ranches.length > 0 && (
        <div className="mb-4">
          <label className={filterLabelCls} style={{ color: MUTED }}>
            {t('livestock_mkt.filter_ranch', 'RANCH')}
          </label>
          <input
            type="text"
            value={ranchSearch}
            onChange={(e) => setRanchSearch(e.target.value)}
            placeholder={t('livestock_mkt.search_ranches_ph', 'Search ranches…')}
            className={`${selectCls} mb-1.5`}
            style={selectBorder}
          />
          <select
            value={businessId}
            onChange={(e) => { setBusinessId(Number(e.target.value)); setPage(1); }}
            className={selectCls}
            style={selectBorder}
          >
            <option value={0}>{t('livestock_mkt.all_ranches', 'All Ranches')}</option>
            {filters.ranches
              .filter((r) => !ranchSearch.trim() || (r.name || '').toLowerCase().includes(ranchSearch.trim().toLowerCase()))
              .map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
          </select>
        </div>
      )}

      <div className="mb-4">
        <label className={filterLabelCls} style={{ color: MUTED }}>
          {t(`livestock_mkt.${priceFilterMinKey}`, isStuds ? 'Min stud fee' : 'Min price')}
        </label>
        <input
          type="number"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          placeholder="$0"
          className={selectCls}
          style={selectBorder}
        />
      </div>

      <div className="mb-4">
        <label className={filterLabelCls} style={{ color: MUTED }}>
          {t(`livestock_mkt.${priceFilterMaxKey}`, isStuds ? 'Max stud fee' : 'Max price')}
        </label>
        <input
          type="number"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          placeholder="Any"
          className={selectCls}
          style={selectBorder}
        />
      </div>

      {slug === 'alpacas' && (
        <div className="mb-4">
          <label className={filterLabelCls} style={{ color: MUTED }}>
            {t('livestock_mkt.filter_ancestry', 'ANCESTRY')}
          </label>
          <select
            value={ancestry}
            onChange={(e) => { setAncestry(e.target.value); setPage(1); }}
            className={selectCls}
            style={selectBorder}
          >
            {ANCESTRY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      )}

      {!isStuds && (
        <div className="mb-2">
          <label className={filterLabelCls} style={{ color: MUTED }}>
            {t('livestock_mkt.filter_sort', 'SORT')}
          </label>
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            className={`${selectCls} mb-1.5`}
            style={selectBorder}
          >
            <option value="lastupdated">{t('livestock_mkt.sort_last_updated', 'Last updated')}</option>
            <option value="price">{t('livestock_mkt.sort_price', 'Price')}</option>
            <option value="name">{t('livestock_mkt.sort_name', 'Name')}</option>
            <option value="breed">{t('livestock_mkt.sort_breed', 'Breed')}</option>
          </select>
          <select
            value={orderBy}
            onChange={(e) => { setOrderBy(e.target.value); setPage(1); }}
            className={selectCls}
            style={selectBorder}
          >
            <option value="desc">{t('livestock_mkt.sort_desc', 'Descending')}</option>
            <option value="asc">{t('livestock_mkt.sort_asc', 'Ascending')}</option>
          </select>
        </div>
      )}
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
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-[200px] h-[160px] bg-[#e8e0d4]" />
                <div className="flex-1 p-4 space-y-3">
                  <div className="h-5 bg-[#e8e0d4] rounded w-2/3" />
                  <div className="h-3 bg-[#e8e0d4] rounded w-1/2" />
                  <div className="h-3 bg-[#e8e0d4] rounded w-2/5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !data || data.animals.length === 0 ? (
        <div
          className="rounded-xl border bg-white p-8 text-center"
          style={{ borderColor: '#e5e0d6' }}
        >
          <h4 className="m-0 mb-2 font-bold" style={{ fontFamily: LORA, color: INK }}>
            {t('livestock_mkt.no_results', 'No results found')}
          </h4>
          <p className="m-0 mb-4 text-sm" style={{ color: MUTED }}>
            {t('livestock_mkt.broaden_search', 'Try broadening your filters or choosing another species.')}
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
                      count: Math.min(GUEST_LIST_PREVIEW, data.animals.length),
                      total: data.total,
                    },
                  )
                : t('livestock_mkt.showing_results', {
                    from: ((page - 1) * data.per_page) + 1,
                    to: Math.min(page * data.per_page, data.total),
                    total: data.total,
                  })}
            </p>
            {!loading && (
              <p className="m-0 text-xs font-semibold" style={{ color: OLIVE }}>
                {data.total} {isStuds ? 'stud listing' : 'listing'}{data.total === 1 ? '' : 's'}
              </p>
            )}
          </div>
          {!guest && <Pagination page={page} totalPages={data.total_pages} onPageChange={setPage} />}
          {(guest ? data.animals.slice(0, GUEST_LIST_PREVIEW) : data.animals).map((animal) => (
            <AnimalCard key={animal.animal_id} animal={animal} type={isStuds ? 'studs' : 'sale'} />
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
          title={`${pageTitle} | Livestock of America`}
          description={metaDesc}
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
                {pageTitle}
              </h1>
              <p className="m-0 mt-1 text-sm" style={{ color: MUTED }}>
                {firstName ? `Welcome back, ${firstName}. ` : ''}
                {isStuds
                  ? `Compare ${label.toLowerCase()} stud fees and genetics.`
                  : `Browse ${label.toLowerCase()} listings by breed, location, and price.`}
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
        title={`${pageTitle} | Livestock Marketplace`}
        description={metaDesc}
        keywords={`${label.toLowerCase()} for sale, ${label.toLowerCase()} breeders, livestock marketplace, ${isStuds ? 'stud services, ' : ''}farm animals, ranchers`}
        canonical={metaCanonical}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: pageTitle,
          url: metaCanonical,
          description: metaDesc,
        }}
      />
      <Header />

      <div className="max-w-[1300px] mx-auto px-4 pt-3">
        <Breadcrumbs items={[
          { label: 'Home', to: '/' },
          { label: t('livestock_mkt.crumb_marketplaces', 'Marketplaces'), to: '/marketplaces' },
          { label: t('livestock_mkt.crumb_livestock', 'Livestock'), to: '/marketplaces/livestock' },
          ...(isStuds ? [{ label: t('livestock_mkt.crumb_studs', 'Stud Services') }] : []),
          { label: pageTitle },
        ]} />
      </div>

      <div className="max-w-[1300px] mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <p className="m-0 mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: isStuds ? RUST : OLIVE }}>
              {isStuds ? 'Stud Services' : 'For Sale'}
            </p>
            <h2
              className="m-0 text-2xl md:text-3xl font-bold"
              style={{ fontFamily: LORA, color: INK }}
            >
              {pageTitle}
            </h2>
            <p className="m-0 mt-2 text-sm max-w-xl" style={{ color: MUTED }}>
              {isStuds
                ? `Compare ${label.toLowerCase()} stud fees, genetics, and breeders — then reach out directly.`
                : `Browse ${label.toLowerCase()} listings by breed, location, ranch, and price.`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to={otherLink}
              className="inline-flex rounded-lg px-4 py-2 text-sm font-semibold no-underline border bg-white"
              style={{ color: INK, borderColor: '#d0c8ba' }}
            >
              {otherLabel} →
            </Link>
            {guest ? (
              <button
                type="button"
                onClick={() => navigate('/login', { state: { from: { pathname: ranchDirLink } } })}
                className="inline-flex rounded-lg px-4 py-2 text-sm font-semibold text-white border-0 cursor-pointer"
                style={{ backgroundColor: OLIVE }}
              >
                {label} Ranches
              </button>
            ) : (
              <Link
                to={ranchDirLink}
                className="inline-flex rounded-lg px-4 py-2 text-sm font-semibold no-underline text-white"
                style={{ backgroundColor: OLIVE }}
              >
                {label} Ranches
              </Link>
            )}
          </div>
        </div>

        {isStuds && speciesChips}

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 items-start">
          {filtersAside}
          {resultsBlock}
        </div>
      </div>

      <section style={{ backgroundColor: '#efe9df' }}>
        <div className="max-w-[1300px] mx-auto px-4 py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <h3 className="m-0 mb-1 text-lg font-bold" style={{ fontFamily: LORA, color: INK }}>
              {isStuds ? 'Looking for animals for sale instead?' : 'Need stud services?'}
            </h3>
            <p className="m-0 text-sm" style={{ color: MUTED }}>
              Switch categories anytime — or research breeds in the knowledgebase first.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to={otherLink}
              className="inline-flex rounded-lg px-5 py-2.5 text-sm font-semibold no-underline text-white"
              style={{ backgroundColor: OLIVE }}
            >
              {otherLabel}
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
