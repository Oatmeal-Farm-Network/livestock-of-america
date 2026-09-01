import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from '../lib/i18n';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';
import SaveButton from '../components/SaveButton';
import ListingPhoto from '../components/ListingPhoto';
import GuestAccessPrompt, { GUEST_LIST_PREVIEW } from '../components/GuestAccessPrompt';
import { isLoggedIn } from '../lib/auth';
import {
  FOR_SALE_SPECIES,
  STUD_SPECIES,
  RANCH_SPECIES,
  forSalePath,
  studPath,
  ranchPath,
} from '../lib/livestockSpecies';

const API_URL = import.meta.env.VITE_LIVESTOCK_API_URL || '';
const CREAM = '#f7f2e8';
const OLIVE = '#3d6b34';
const AMBER = '#e59a24';
const INK = '#2c2c2c';
const MUTED = '#6b6b6b';
const LORA = "'Lora', 'Times New Roman', serif";

const QUICK_SPECIES = [
  { slug: 'cattle', label: 'Cattle', img: '/images/Cattle.webp' },
  { slug: 'sheep', label: 'Sheep', img: '/images/Sheepbreeds.webp' },
  { slug: 'horses', label: 'Horses', img: '/images/cowboy2.webp' },
  { slug: 'goats', label: 'Goats', img: '/images/Goats.webp' },
  { slug: 'pigs', label: 'Pigs', img: '/images/Pig.webp' },
  { slug: 'chickens', label: 'Chickens', img: '/images/Chicken.webp' },
  { slug: 'alpacas', label: 'Alpacas', img: '/images/Alpaca.webp' },
  { slug: 'bison', label: 'Bison', img: '/images/Bison.webp' },
];

/** Card columns per breakpoint — mirrors the grid classes below. */
function useColumnCount() {
  const getCount = () => {
    if (typeof window === 'undefined') return 5;
    if (window.innerWidth >= 1280) return 5;
    if (window.innerWidth >= 640) return 4;
    return 2;
  };
  const [cols, setCols] = useState(getCount);
  useEffect(() => {
    const update = () => setCols(getCount());
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return cols;
}

const SIDEBAR_SECTIONS = [
  { id: 'for_sale', species: FOR_SALE_SPECIES, toPath: forSalePath },
  { id: 'studs',    species: STUD_SPECIES,     toPath: studPath },
  { id: 'ranches',  species: RANCH_SPECIES,    toPath: ranchPath },
];

function Sidebar({ collapsed, onToggle }) {
  const { t } = useTranslation();
  const [openSections, setOpenSections] = useState({ for_sale: true });

  const toggleSection = (id) =>
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div
      style={{
        width: collapsed ? '40px' : '220px',
        minWidth: collapsed ? '40px' : '220px',
        transition: 'all 0.3s ease',
        backgroundColor: '#f5f5f0',
        borderRight: '1px solid #ddd',
        overflowY: collapsed ? 'hidden' : 'auto',
        overflowX: 'hidden',
        position: 'sticky',
        top: '72px',
        maxHeight: 'calc(100vh - 72px)',
        flexShrink: 0,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        style={{
          width: '100%', padding: '10px', border: 'none',
          backgroundColor: AMBER, color: '#fff',
          fontWeight: 'bold', cursor: 'pointer', fontSize: '14px',
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: '6px',
        }}
      >
        {!collapsed && (
          <span style={{ fontSize: '12px', fontWeight: 600 }}>
            {t('livestock_mkt.browse', 'Browse')}
          </span>
        )}
        <span style={{ fontSize: '18px' }}>{collapsed ? '☰' : '✕'}</span>
      </button>

      {!collapsed && (
        <div style={{ padding: '8px 0' }}>
          {SIDEBAR_SECTIONS.map((section) => (
            <div key={section.id}>
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                style={{
                  width: '100%', padding: '8px 12px', border: 'none',
                  backgroundColor: '#e8e8e0', color: '#333',
                  fontWeight: '700', fontSize: '12px', textAlign: 'left',
                  cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', textTransform: 'uppercase', letterSpacing: '0.5px',
                }}
              >
                {t(`livestock_mkt.section_${section.id}`)}
                <span>{openSections[section.id] ? '▲' : '▼'}</span>
              </button>

              {openSections[section.id] && (
                <ul style={{ listStyle: 'none', margin: 0, padding: '4px 0' }}>
                  {section.species.map((item) => (
                    <li key={item.key}>
                      <Link
                        to={section.toPath(item.slug)}
                        style={{
                          display: 'block', padding: '5px 16px',
                          fontSize: '13px', color: '#4d734d',
                          textDecoration: 'none',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e5ede5'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        {t(`livestock_mkt.${item.key}`, item.label)}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SearchBar({ query, onQueryChange, location, onLocationChange, locations, onSearch }) {
  const { t } = useTranslation();

  return (
    <form
      className="flex flex-col lg:flex-row gap-3 items-stretch"
      onSubmit={(e) => { e.preventDefault(); onSearch(); }}
    >
      <div className="flex-1 flex items-center gap-3 bg-white rounded-lg border border-[#ddd8cc] px-4 py-3 shadow-sm">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3-3" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={t('livestock_mkt.search_placeholder', 'Search livestock by animal, breed, or keyword…')}
          className="flex-1 border-0 outline-none text-sm bg-transparent"
          style={{ color: INK }}
        />
      </div>
      <select
        value={location}
        onChange={(e) => onLocationChange(e.target.value)}
        className="bg-white rounded-lg border border-[#ddd8cc] px-4 py-3 text-sm shadow-sm min-w-[160px]"
        style={{ color: INK }}
      >
        <option value="">{t('livestock_mkt.all_locations', 'All Locations')}</option>
        {locations.map((loc) => (
          <option key={loc} value={loc}>{loc}</option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-lg px-8 py-3 text-sm font-semibold text-white shadow-sm"
        style={{ backgroundColor: OLIVE }}
      >
        {t('livestock_mkt.search_btn', 'Search')}
      </button>
    </form>
  );
}

function FiltersPanel({
  category,
  animalType,
  breed,
  location,
  priceMax,
  animalTypes,
  breeds,
  locations,
  onCategory,
  onAnimalType,
  onBreed,
  onLocation,
  onPriceMax,
  onClear,
}) {
  const { t } = useTranslation();

  return (
    <aside
      className="rounded-xl border bg-white p-4 shadow-sm h-fit lg:sticky lg:top-24"
      style={{ borderColor: '#e5e0d6' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold tracking-widest m-0" style={{ color: INK }}>
          {t('livestock_mkt.filters', 'FILTERS')}
        </h3>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-semibold border-0 bg-transparent cursor-pointer p-0"
          style={{ color: OLIVE }}
        >
          {t('livestock_mkt.clear_all', 'Clear all')}
        </button>
      </div>

      <label className="block text-[10px] font-bold tracking-wider mb-1" style={{ color: MUTED }}>
        {t('livestock_mkt.filter_category', 'CATEGORY')}
      </label>
      <select
        value={category}
        onChange={(e) => onCategory(e.target.value)}
        className="w-full mb-4 rounded-md border px-3 py-2 text-sm"
        style={{ borderColor: '#ddd8cc', color: INK }}
      >
        <option value="for_sale">{t('livestock_mkt.tab_for_sale', 'Livestock for Sale')}</option>
        <option value="studs">{t('livestock_mkt.tab_studs', 'Stud Services')}</option>
        <option value="ranches">{t('livestock_mkt.tab_ranches', 'Ranches')}</option>
      </select>

      <label className="block text-[10px] font-bold tracking-wider mb-1" style={{ color: MUTED }}>
        {t('livestock_mkt.filter_animal_type', 'ANIMAL TYPE')}
      </label>
      <select
        value={animalType}
        onChange={(e) => onAnimalType(e.target.value)}
        className="w-full mb-4 rounded-md border px-3 py-2 text-sm"
        style={{ borderColor: '#ddd8cc', color: INK }}
      >
        <option value="">{t('livestock_mkt.all_animals', 'All Animals')}</option>
        {animalTypes.map((type) => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>

      <label className="block text-[10px] font-bold tracking-wider mb-1" style={{ color: MUTED }}>
        {t('livestock_mkt.filter_breed', 'BREED')}
      </label>
      <select
        value={breed}
        onChange={(e) => onBreed(e.target.value)}
        className="w-full mb-4 rounded-md border px-3 py-2 text-sm"
        style={{ borderColor: '#ddd8cc', color: INK }}
      >
        <option value="">{t('livestock_mkt.all_breeds', 'All Breeds')}</option>
        {breeds.map((b) => (
          <option key={b} value={b}>{b}</option>
        ))}
      </select>

      <label className="block text-[10px] font-bold tracking-wider mb-1" style={{ color: MUTED }}>
        {t('livestock_mkt.filter_state', 'LOCATION')}
      </label>
      <select
        value={location}
        onChange={(e) => onLocation(e.target.value)}
        className="w-full mb-5 rounded-md border px-3 py-2 text-sm"
        style={{ borderColor: '#ddd8cc', color: INK }}
      >
        <option value="">{t('livestock_mkt.all_locations', 'All Locations')}</option>
        {locations.map((loc) => (
          <option key={loc} value={loc}>{loc}</option>
        ))}
      </select>

      <label className="block text-[10px] font-bold tracking-wider mb-2" style={{ color: MUTED }}>
        {t('livestock_mkt.price_range', 'PRICE RANGE')}
      </label>
      <input
        type="range"
        min={0}
        max={10000}
        step={100}
        value={priceMax}
        onChange={(e) => onPriceMax(Number(e.target.value))}
        className="w-full accent-[#3d6b34]"
      />
      <div className="flex justify-between text-xs mt-1" style={{ color: MUTED }}>
        <span>$0</span>
        <span>{priceMax >= 10000 ? '$10,000+' : `$${priceMax.toLocaleString()}`}</span>
      </div>
    </aside>
  );
}

function AnimalCard({ animal }) {
  const { t } = useTranslation();
  const breeds = [animal.breeds?.[0], animal.breeds?.[1]].filter(Boolean).join(' / ')
    || animal.breed || '';
  const priceLabel = animal.price
    ? `$${Math.round(animal.price).toLocaleString()}`
    : t('livestock_mkt.price_call');
  const shortName = animal.full_name?.length > 30
    ? `${animal.full_name.substring(0, 30)}…`
    : animal.full_name;

  return (
    <Link
      to={`/marketplaces/livestock/animal/${animal.animal_id}`}
      className="no-underline flex h-full"
      style={{ color: 'inherit' }}
    >
      <article
        className="bg-white rounded-lg overflow-hidden border w-full h-full flex flex-col transition duration-200 hover:shadow-lg hover:-translate-y-0.5"
        style={{ borderColor: '#ddd' }}
      >
        <div
          className="w-full shrink-0 flex items-center justify-center overflow-hidden relative"
          style={{ height: '180px', backgroundColor: '#f0ede6' }}
        >
          <ListingPhoto
            src={animal.photo}
            alt={animal.full_name}
            imgClassName="w-full h-full object-contain"
          />
          <div className="absolute top-2 right-2 z-10" onClick={(e) => e.preventDefault()}>
            <SaveButton itemType="animal" itemId={animal.animal_id} />
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-1" style={{ padding: '10px 12px' }}>
          <div className="font-bold leading-snug" style={{ fontSize: '0.85rem', color: '#222' }}>
            {shortName}
          </div>
          {breeds && (
            <div style={{ fontSize: '0.78rem', color: '#666' }}>{breeds}</div>
          )}
          {animal.seller && (
            <div className="truncate" style={{ fontSize: '0.75rem', color: '#888' }}>
              {animal.seller}{animal.location ? `, ${animal.location}` : ''}
            </div>
          )}
          <div className="font-semibold" style={{ fontSize: '0.85rem', color: OLIVE, marginTop: '2px' }}>
            {priceLabel}
          </div>
        </div>

        <div
          className="flex justify-end border-t"
          style={{ padding: '8px 12px', borderColor: '#f0ede6' }}
        >
          <span className="font-bold" style={{ fontSize: '0.78rem', color: OLIVE }}>
            {t('livestock_mkt.explore', 'Explore →')}
          </span>
        </div>
      </article>
    </Link>
  );
}

function CardGrid({ animals }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-5 gap-4">
      {animals.map((animal) => (
        <AnimalCard key={animal.animal_id} animal={animal} />
      ))}
    </div>
  );
}

function collectUnique(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function filterListings(listings, { query, searchLocation, animalType, breed, location, priceMax }) {
  const q = query.trim().toLowerCase();
  return listings.filter((animal) => {
    if (searchLocation && animal.location !== searchLocation) return false;
    if (location && animal.location !== location) return false;
    if (animalType && (animal.species || '').toLowerCase() !== animalType.toLowerCase()) return false;
    if (breed) {
      const breedList = animal.breeds || (animal.breed ? [animal.breed] : []);
      if (!breedList.some((b) => String(b).toLowerCase() === breed.toLowerCase())) return false;
    }
    if (priceMax < 10000 && animal.price && animal.price > priceMax) return false;
    if (!q) return true;
    const haystack = [
      animal.full_name,
      animal.seller,
      animal.location,
      animal.species,
      animal.breed,
      ...(animal.breeds || []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

export default function LivestockMarketplace() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [appliedSearchLocation, setAppliedSearchLocation] = useState('');
  const [animalType, setAnimalType] = useState('');
  const [breed, setBreed] = useState('');
  const [location, setLocation] = useState('');
  const [priceMax, setPriceMax] = useState(10000);
  const [category, setCategory] = useState('for_sale');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const cols = useColumnCount();
  const guest = !isLoggedIn();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarCollapsed(true);
  }, []);

  const handleCategoryChange = (next) => {
    setCategory(next);
    if (next === 'studs') {
      navigate('/marketplaces/livestock/studs/cattle');
      return;
    }
    if (next === 'ranches') {
      const ranchesPath = '/marketplaces/livestock/ranches/cattle';
      if (guest) {
        navigate('/login', { state: { from: { pathname: ranchesPath } } });
        return;
      }
      navigate(ranchesPath);
      return;
    }
  };

  const handleAnimalTypeChange = (type) => {
    setAnimalType(type);
    if (!type) return;
    const slug = String(type).toLowerCase().replace(/\s+/g, '-');
    if (category === 'studs') {
      navigate(`/marketplaces/livestock/studs/${slug}`);
    } else if (category === 'ranches') {
      navigate(`/marketplaces/livestock/ranches/${slug}`);
    }
  };

  useEffect(() => {
    fetch(`${API_URL}/api/marketplace/homepage-listings`)
      .then((r) => r.json())
      .then((data) => {
        const rows = Array.isArray(data) ? data : [];
        const seen = new Set();
        const unique = [];
        for (const a of rows) {
          const id = a?.animal_id;
          if (id == null || seen.has(id)) continue;
          seen.add(id);
          unique.push(a);
        }
        setListings(unique);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const locations = useMemo(
    () => collectUnique(listings.map((a) => a.location)),
    [listings]
  );
  const animalTypes = useMemo(
    () => collectUnique(listings.map((a) => a.species)),
    [listings]
  );
  const breeds = useMemo(
    () => collectUnique(listings.flatMap((a) => a.breeds || (a.breed ? [a.breed] : []))),
    [listings]
  );

  const filtered = useMemo(
    () => filterListings(listings, {
      query: appliedQuery,
      searchLocation: appliedSearchLocation,
      animalType,
      breed,
      location,
      priceMax,
    }),
    [listings, appliedQuery, appliedSearchLocation, animalType, breed, location, priceMax]
  );

  const featured = filtered.slice(0, GUEST_LIST_PREVIEW);

  // Guest view mirrors OFN: a top row of `cols` featured cards, then the rest
  // trimmed to whole rows so the grid never ends on a ragged partial row.
  const ofnFeatured = listings.slice(0, cols);
  const ofnRestAll = listings.slice(cols);
  const ofnRest = ofnRestAll.slice(0, Math.floor(ofnRestAll.length / cols) * cols);

  const handleSearch = () => {
    setAppliedQuery(query);
    setAppliedSearchLocation(searchLocation);
  };

  const clearFilters = () => {
    setQuery('');
    setSearchLocation('');
    setAppliedQuery('');
    setAppliedSearchLocation('');
    setAnimalType('');
    setBreed('');
    setLocation('');
    setPriceMax(10000);
    setCategory('for_sale');
  };

  const firstName = typeof window !== 'undefined' ? localStorage.getItem('first_name') || '' : '';

  const listingsBlock = loading ? (
    <div className="text-center py-16" style={{ color: MUTED }}>{t('livestock_mkt.loading', 'Loading listings…')}</div>
  ) : listings.length === 0 ? (
    <div className="text-center py-16" style={{ color: MUTED }}>
      <p className="mb-4">{t('livestock_mkt.no_listings', 'No listings available right now.')}</p>
      {!guest && (
        <Link
          to="/seller/animals/add"
          className="inline-flex rounded-lg px-5 py-2.5 text-sm font-semibold no-underline text-white"
          style={{ backgroundColor: OLIVE }}
        >
          List an animal
        </Link>
      )}
      {guest && (
        <Link to="/signup" className="regsubmit2">{t('livestock_mkt.list_animals', 'List your animals')}</Link>
      )}
    </div>
  ) : (
    <section className={`grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 items-start ${guest ? 'mt-8' : 'mt-5'}`}>
      <FiltersPanel
        category={category}
        animalType={animalType}
        breed={breed}
        location={location}
        priceMax={priceMax}
        animalTypes={animalTypes}
        breeds={breeds}
        locations={locations}
        onCategory={handleCategoryChange}
        onAnimalType={handleAnimalTypeChange}
        onBreed={setBreed}
        onLocation={setLocation}
        onPriceMax={setPriceMax}
        onClear={clearFilters}
      />

      <div>
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div>
            <h2
              className={`font-bold m-0 ${guest ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'}`}
              style={{ fontFamily: LORA, color: INK }}
            >
              {guest ? t('livestock_mkt.featured', 'Featured Listings') : 'Browse listings'}
            </h2>
            <p className="m-0 mt-1 text-xs" style={{ color: MUTED }}>
              {filtered.length} listing{filtered.length === 1 ? '' : 's'} match your filters
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/marketplaces/livestock/cattle')}
            className="text-sm font-semibold border-0 bg-transparent cursor-pointer p-0"
            style={{ color: OLIVE }}
          >
            {t('livestock_mkt.view_all_listings', 'View All Listings →')}
          </button>
        </div>

        {featured.length === 0 ? (
          <div className="rounded-xl border bg-white p-8 text-center" style={{ borderColor: '#e5e0d6', color: MUTED }}>
            {t('livestock_mkt.no_matches', 'No listings match your filters. Try adjusting your search.')}
          </div>
        ) : (
          <div className={`grid gap-3 ${guest ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5' : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4'}`}>
            {(guest ? featured : filtered).map((animal) => (
              <AnimalCard key={animal.animal_id} animal={animal} />
            ))}
          </div>
        )}

        {guest && (
          <GuestAccessPrompt
            className="mt-8"
            title={t('guest_access.mkt_title', 'Sign in for full marketplace access')}
            message={t(
              'guest_access.mkt_list',
              'Guests can preview a few listings. Sign in or create an account to browse all animals, compare prices, and contact sellers.',
            )}
          />
        )}
      </div>
    </section>
  );

  /* ── Customer (logged-in) marketplace ── */
  if (!guest) {
    return (
      <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: CREAM }}>
        <PageMeta
          title="Marketplace | Livestock of America"
          description="Browse livestock for sale, studs, and ranches."
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
                Find your next animal
              </h1>
              <p className="m-0 mt-1 text-sm" style={{ color: MUTED }}>
                {firstName ? `Welcome back, ${firstName}. ` : ''}
                Browse for sale, studs, and ranches — then contact sellers directly.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Link
                to="/seller/animals?tab=herd"
                className="inline-flex rounded-lg px-4 py-2.5 text-sm font-semibold no-underline text-white"
                style={{ backgroundColor: OLIVE }}
              >
                My listings
              </Link>
              <Link
                to="/seller/animals?tab=saved"
                className="inline-flex rounded-lg px-4 py-2.5 text-sm font-semibold no-underline border bg-white"
                style={{ color: OLIVE, borderColor: OLIVE }}
              >
                Saved
              </Link>
              <Link
                to="/seller/animals/add"
                className="inline-flex rounded-lg px-4 py-2.5 text-sm font-semibold no-underline border bg-white"
                style={{ color: INK, borderColor: '#d0c8ba' }}
              >
                List an animal
              </Link>
            </div>
          </div>

          {/* Mode tabs */}
          <div className="flex flex-wrap gap-2 mb-5">
            {[
              { id: 'for_sale', label: 'For sale', to: null },
              { id: 'studs', label: 'Stud services', to: '/marketplaces/livestock/studs/cattle' },
              { id: 'ranches', label: 'Ranches', to: '/marketplaces/livestock/ranches/cattle' },
            ].map((tab) => {
              const active = category === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    if (tab.to) navigate(tab.to);
                    else handleCategoryChange(tab.id);
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

          <SearchBar
            query={query}
            onQueryChange={setQuery}
            location={searchLocation}
            onLocationChange={setSearchLocation}
            locations={locations}
            onSearch={handleSearch}
          />

          <section className="mt-5">
            <p className="m-0 mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: OLIVE }}>
              Quick browse
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {QUICK_SPECIES.map((s) => (
                <Link
                  key={s.slug}
                  to={`/marketplaces/livestock/${s.slug}`}
                  className="shrink-0 inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs font-semibold no-underline"
                  style={{ borderColor: '#e0d8cc', color: INK }}
                >
                  <img
                    src={s.img}
                    alt=""
                    className="w-5 h-5 rounded-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  {s.label}
                </Link>
              ))}
            </div>
          </section>

          {listingsBlock}
        </div>
      </div>
    );
  }

  /* ── Public marketing marketplace ── */
  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: CREAM }}>
      <PageMeta
        title="Livestock of America by Oatmeal AI | Livestock Marketplace"
        description="Browse livestock for sale across the United States. Connect with ranchers, breeders, and buyers on Livestock of America by Oatmeal AI."
        keywords="livestock marketplace, farm animals for sale, cattle for sale, sheep for sale, buy livestock"
        canonical="https://livestockofamerica.com/animals"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Livestock of America by Oatmeal AI Marketplace',
            url: 'https://livestockofamerica.com/animals',
            description: 'Livestock of America by Oatmeal AI marketplace — buy and sell farm animals directly from ranchers and breeders.',
          },
          listings.length > 0 ? {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            url: 'https://livestockofamerica.com/animals',
            itemListElement: listings.slice(0, 12).map((a, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              url: `https://livestockofamerica.com/marketplaces/livestock/animal/${a.animal_id}`,
              name: a.full_name,
            })),
          } : null,
        ].filter(Boolean)}
      />
      <Header />

      {/* Breadcrumbs sit directly under the header on every page but Home. */}
      <div className="mx-auto w-full px-5" style={{ maxWidth: '1100px' }}>
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: t('livestock_mkt.crumb_marketplaces', 'Marketplaces') },
            { label: t('livestock_mkt.crumb_livestock', 'Livestock') },
          ]}
        />
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'flex-start' }}>
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((p) => !p)} />

        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
              {t('livestock_mkt.loading')}
            </div>
          ) : listings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
              <p style={{ marginBottom: '1rem' }}>{t('livestock_mkt.no_listings')}</p>
              <Link to="/signup" className="regsubmit2">{t('livestock_mkt.list_animals')}</Link>
            </div>
          ) : (
            <>
              {ofnFeatured.length > 0 && (
                <div style={{ backgroundColor: AMBER, padding: '1.5rem' }}>
                  <h2
                    className="font-bold"
                    style={{ textAlign: 'center', fontSize: '1.3rem', marginBottom: '1.25rem', color: '#222' }}
                  >
                    {t('livestock_mkt.featured')}
                  </h2>
                  <CardGrid animals={ofnFeatured} />
                </div>
              )}

              {ofnRest.length > 0 && (
                <div style={{ padding: '1.5rem' }}>
                  <h2
                    className="font-bold"
                    style={{ textAlign: 'center', fontSize: '1.3rem', marginBottom: '1.25rem', color: '#222' }}
                  >
                    {t('livestock_mkt.more_listings')}
                  </h2>
                  <CardGrid animals={ofnRest} />
                </div>
              )}

              <div style={{ padding: '0 1.5rem 1.5rem' }}>
                <GuestAccessPrompt
                  title={t('guest_access.mkt_title', 'Sign in for full marketplace access')}
                  message={t(
                    'guest_access.mkt_list',
                    'Create a free account to save listings, contact sellers, and list your own animals.',
                  )}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
