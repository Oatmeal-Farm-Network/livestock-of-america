import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from '../lib/i18n';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import LivestockHeroTabs from '../components/LivestockHeroTabs';
import SaveButton from '../components/SaveButton';
import ListingPhoto from '../components/ListingPhoto';
import GuestAccessPrompt, { GUEST_LIST_PREVIEW } from '../components/GuestAccessPrompt';
import { isLoggedIn } from '../lib/auth';

const API_URL = import.meta.env.VITE_LIVESTOCK_API_URL || '';
const CREAM = '#f7f2e8';
const OLIVE = '#3d6b34';
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
  const guest = !isLoggedIn();
  const breeds = [animal.breeds?.[0], animal.breeds?.[1]].filter(Boolean).join(' · ') || animal.breed || '';
  const species = animal.species || '';
  const metaLine = [species, breeds].filter(Boolean).join(' · ');
  const priceLabel = guest
    ? t('guest_access.members_only', 'Sign in to view')
    : animal.price
      ? `$${Math.round(animal.price).toLocaleString()}`
      : t('livestock_mkt.price_call');

  return (
    <Link
      to={`/marketplaces/livestock/animal/${animal.animal_id}`}
      className="no-underline block h-full group"
      style={{ color: 'inherit' }}
    >
      <article
        className="bg-white rounded-lg overflow-hidden border h-full flex flex-col transition-shadow group-hover:shadow-md"
        style={{ borderColor: '#e5e0d6' }}
      >
        <div className="aspect-[16/10] bg-[#f0ede6] flex items-center justify-center overflow-hidden relative">
          <ListingPhoto
            src={animal.photo}
            alt={animal.full_name}
            imgClassName="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute top-2 right-2 z-10" onClick={(e) => e.preventDefault()}>
            <SaveButton itemType="animal" itemId={animal.animal_id} />
          </div>
        </div>
        <div className="px-3 pt-2.5 pb-2 flex-1 flex flex-col">
          <h3
            className="text-[13px] font-bold leading-snug mb-0.5 line-clamp-2"
            style={{ fontFamily: LORA, color: INK }}
          >
            {animal.full_name}
          </h3>
          {metaLine && (
            <p className="text-[11px] mb-0.5 m-0 truncate" style={{ color: MUTED }}>{metaLine}</p>
          )}
          {animal.seller && (
            <p className="text-[11px] mb-1.5 m-0 truncate" style={{ color: MUTED }}>{animal.seller}</p>
          )}
          <p className="text-xs font-semibold mt-auto mb-0" style={{ color: OLIVE }}>{priceLabel}</p>
        </div>
        <div className="px-3 py-1.5 border-t flex justify-end" style={{ borderColor: '#f0ede6' }}>
          <span className="text-[11px] font-bold" style={{ color: OLIVE }}>
            {t('livestock_mkt.explore', 'Explore →')}
          </span>
        </div>
      </article>
    </Link>
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
  const guest = !isLoggedIn();

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
  const more = filtered.slice(GUEST_LIST_PREVIEW);

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

      <LivestockHeroTabs />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="mt-8">
          <SearchBar
            query={query}
            onQueryChange={setQuery}
            location={searchLocation}
            onLocationChange={setSearchLocation}
            locations={locations}
            onSearch={handleSearch}
          />
        </div>

        <section className="mt-10">
          <div>
            <p className="m-0 mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: OLIVE }}>
              Livestock Marketplace
            </p>
            <h2
              className="text-3xl sm:text-4xl font-bold mb-4 leading-tight m-0"
              style={{ fontFamily: LORA, color: INK }}
            >
              {t('livestock_mkt.title', 'Connecting Ranches Across The United States.')}
            </h2>
            <p className="text-sm sm:text-base leading-relaxed mb-3 m-0" style={{ color: INK }}>
              {t(
                'livestock_mkt.intro1',
                'Browse animals for sale, stud services, and ranch profiles from breeders coast to coast. Reach sellers directly and grow your herd with confidence.',
              )}
            </p>
            <p className="text-sm sm:text-base leading-relaxed italic mb-5 m-0" style={{ color: MUTED }}>
              {t(
                'livestock_mkt.intro2',
                'From cattle and sheep to alpacas and horses — Livestock of America by Oatmeal AI is built for people who live with the land.',
              )}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/signup"
                className="inline-block rounded-lg px-6 py-3 text-sm font-semibold text-white no-underline shadow-sm"
                style={{ backgroundColor: OLIVE, color: '#ffffff' }}
              >
                {t('livestock_mkt.join_now', 'Join Now')}
              </Link>
              <Link
                to="/livestock"
                className="inline-block rounded-lg px-6 py-3 text-sm font-semibold no-underline border bg-white"
                style={{ color: INK, borderColor: '#d0c8ba' }}
              >
                Research breeds
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <p className="m-0 mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: OLIVE }}>
            Browse by animal
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {QUICK_SPECIES.map((s) => (
              <Link
                key={s.slug}
                to={`/marketplaces/livestock/${s.slug}`}
                className="shrink-0 group no-underline"
              >
                <div
                  className="w-[88px] rounded-lg overflow-hidden border bg-white transition-shadow group-hover:shadow-md"
                  style={{ borderColor: '#e5e0d6' }}
                >
                  <div className="aspect-square overflow-hidden bg-[#efe9df]">
                    <img
                      src={s.img}
                      alt={s.label}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <p
                    className="m-0 py-1.5 text-center text-[11px] font-semibold"
                    style={{ color: INK, fontFamily: LORA }}
                  >
                    {s.label}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {listingsBlock}
      </div>

      <section style={{ backgroundColor: '#efe9df' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl">
            <p className="m-0 mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: OLIVE }}>
              Before you buy
            </p>
            <h2 className="m-0 mb-2 text-xl md:text-2xl font-bold" style={{ fontFamily: LORA, color: INK }}>
              Research breeds in the knowledgebase
            </h2>
            <p className="m-0 text-sm leading-relaxed" style={{ color: MUTED }}>
              Origins, traits, and farming notes for 29 species — so you know the animal before you make the call.
            </p>
          </div>
          <Link
            to="/livestock"
            className="shrink-0 inline-flex rounded-lg px-6 py-3 text-sm font-semibold no-underline text-white"
            style={{ backgroundColor: OLIVE }}
          >
            Open Knowledgebase
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
