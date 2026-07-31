import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import LivestockHeroTabs from '../components/LivestockHeroTabs';
import { isLoggedIn } from '../lib/auth';

const API_URL = import.meta.env.VITE_LIVESTOCK_API_URL || '';
const PLACEHOLDER = '/images/MissingLivestockImage.webp';
const CREAM = '#f7f2e8';
const OLIVE = '#3d6b34';
const INK = '#2c2c2c';
const MUTED = '#6b6b6b';
const LORA = "'Lora', 'Times New Roman', serif";

function SearchBar({ query, onQueryChange, location, onLocationChange, locations, onSearch }) {
  const { t } = useTranslation();

  return (
    <form
      className="mt-8 flex flex-col lg:flex-row gap-3 items-stretch"
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

function GuestBanner() {
  const { t } = useTranslation();

  return (
    <div
      className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg px-4 py-3 border"
      style={{ backgroundColor: '#ece8df', borderColor: '#d8d2c6', color: INK }}
    >
      <p className="text-sm m-0 leading-relaxed">
        {t(
          'livestock_mkt.guest_banner',
          "You're browsing as a guest. Browse all listings and explore freely — create a free account to list animals or save favorites."
        )}
      </p>
      <div className="flex gap-2 shrink-0">
        <Link
          to="/login"
          className="rounded-md px-4 py-2 text-sm font-semibold no-underline border bg-white"
          style={{ color: INK, borderColor: '#ccc' }}
        >
          {t('nav.login', 'Login')}
        </Link>
        <Link
          to="/signup"
          className="rounded-md px-4 py-2 text-sm font-semibold text-white no-underline"
          style={{ backgroundColor: OLIVE, color: '#ffffff' }}
        >
          {t('nav.signup', 'Sign Up')}
        </Link>
      </div>
    </div>
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
  const [imgSrc, setImgSrc] = useState(animal.photo || PLACEHOLDER);
  const breeds = [animal.breeds?.[0], animal.breeds?.[1]].filter(Boolean).join(' · ') || animal.breed || '';
  const species = animal.species || '';
  const metaLine = [species, breeds].filter(Boolean).join(' · ');
  const priceLabel = animal.price
    ? `$${Math.round(animal.price).toLocaleString()}`
    : t('livestock_mkt.price_call');

  return (
    <Link
      to={`/marketplaces/livestock/animal/${animal.animal_id}`}
      className="no-underline block h-full group"
      style={{ color: 'inherit' }}
    >
      <article
        className="bg-white rounded-xl overflow-hidden border h-full flex flex-col transition-shadow group-hover:shadow-lg"
        style={{ borderColor: '#e5e0d6' }}
      >
        <div className="aspect-[4/3] bg-[#f0ede6] flex items-center justify-center overflow-hidden">
          <img
            src={imgSrc}
            alt={animal.full_name}
            loading="lazy"
            onError={() => setImgSrc(PLACEHOLDER)}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-4 flex-1 flex flex-col">
          <h3
            className="text-[15px] font-bold leading-snug mb-1 line-clamp-2"
            style={{ fontFamily: LORA, color: INK }}
          >
            {animal.full_name}
          </h3>
          {metaLine && (
            <p className="text-xs mb-1 m-0" style={{ color: MUTED }}>{metaLine}</p>
          )}
          {animal.seller && (
            <p className="text-xs mb-3 m-0 truncate" style={{ color: MUTED }}>{animal.seller}</p>
          )}
          <p className="text-sm font-semibold mt-auto mb-0" style={{ color: OLIVE }}>{priceLabel}</p>
        </div>
        <div className="px-4 py-3 border-t flex justify-end" style={{ borderColor: '#f0ede6' }}>
          <span className="text-xs font-bold" style={{ color: OLIVE }}>
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
      navigate('/marketplaces/livestock/ranches/cattle');
      return;
    }
    // for_sale stays on marketplace landing and filters local listings
  };

  const handleAnimalTypeChange = (type) => {
    setAnimalType(type);
    if (!type) return;
    // Jump to species for-sale listing when a specific animal type is chosen
    const slug = String(type).toLowerCase().replace(/\s+/g, '-');
    if (category === 'studs') {
      navigate(`/marketplaces/livestock/studs/${slug}`);
    } else if (category === 'ranches') {
      navigate(`/marketplaces/livestock/ranches/${slug}`);
    }
    // for_sale: filter homepage listings by species (already handled by animalType state)
  };

  useEffect(() => {
    fetch(`${API_URL}/api/marketplace/homepage-listings`)
      .then((r) => r.json())
      .then((data) => { setListings(Array.isArray(data) ? data : []); setLoading(false); })
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

  const featured = filtered.slice(0, 4);
  const more = filtered.slice(4);

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

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: CREAM }}>
      <PageMeta
        title="Livestock of America | Livestock Marketplace"
        description="Browse livestock for sale across the United States. Connect with ranchers, breeders, and buyers on Livestock of America."
        keywords="livestock marketplace, farm animals for sale, cattle for sale, sheep for sale, buy livestock"
        canonical="https://livestockofamerica.com/"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Livestock of America Marketplace',
            url: 'https://livestockofamerica.com/',
            description: 'Livestock of America marketplace — buy and sell farm animals directly from ranchers and breeders.',
          },
          listings.length > 0 ? {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            url: 'https://livestockofamerica.com/',
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
        <SearchBar
          query={query}
          onQueryChange={setQuery}
          location={searchLocation}
          onLocationChange={setSearchLocation}
          locations={locations}
          onSearch={handleSearch}
        />

        <section className="mt-8 max-w-4xl">
          <h1
            className="text-3xl sm:text-4xl font-bold mb-4 leading-tight"
            style={{ fontFamily: LORA, color: INK }}
          >
            {t('livestock_mkt.title')}
          </h1>
          <p className="text-sm sm:text-base leading-relaxed mb-3" style={{ color: INK }}>
            {t('livestock_mkt.intro1')}
          </p>
          <p className="text-sm sm:text-base leading-relaxed italic mb-5" style={{ color: MUTED }}>
            {t('livestock_mkt.intro2')}
          </p>
          <Link
            to="/signup"
            className="inline-block rounded-lg px-6 py-3 text-sm font-semibold text-white no-underline shadow-sm"
            style={{ backgroundColor: OLIVE, color: '#ffffff' }}
          >
            {t('livestock_mkt.join_now')}
          </Link>
        </section>

        {guest && <GuestBanner />}

        {loading ? (
          <div className="text-center py-16" style={{ color: MUTED }}>{t('livestock_mkt.loading')}</div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16" style={{ color: MUTED }}>
            <p className="mb-4">{t('livestock_mkt.no_listings')}</p>
            <Link to="/signup" className="regsubmit2">{t('livestock_mkt.list_animals')}</Link>
          </div>
        ) : (
          <section className="mt-8 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 items-start">
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
                <h2
                  className="text-2xl sm:text-3xl font-bold m-0"
                  style={{ fontFamily: LORA, color: INK }}
                >
                  {t('livestock_mkt.featured')}
                </h2>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {featured.map((animal) => (
                    <AnimalCard key={animal.animal_id} animal={animal} />
                  ))}
                </div>
              )}

              {more.length > 0 && (
                <div className="mt-10">
                  <h3
                    className="text-xl font-bold mb-4"
                    style={{ fontFamily: LORA, color: INK }}
                  >
                    {t('livestock_mkt.more_listings')}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {more.map((animal) => (
                      <AnimalCard key={animal.animal_id} animal={animal} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      <Footer />
    </div>
  );
}
