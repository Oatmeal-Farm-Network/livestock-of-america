import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';
import { useLanguage } from '../lib/LanguageContext';

const API_URL = import.meta.env.VITE_LIVESTOCK_API_URL || '';

// Fallback card images (same as LivestockDB index) keyed by slug
const FALLBACK_IMAGES = {
  'alpacas':      '/images/AlpacasHeader.webp',
  'bison':        '/images/BisonHeader.png',
  'buffalo':      '/images/BuffaloHeader.webp',
  'camels':       '/images/camelHeader.webp',
  'cattle':       '/images/CattleHeader.webp',
  'chickens':     '/images/ChickenHeader.webp',
  'crocodiles':   '/images/CrocodileHeader.webp',
  'deer':         '/images/DeerHeader.webp',
  'dogs':         '/images/WorkingDogsHeader.webp',
  'donkeys':      '/images/DonkeysHeader.webp',
  'ducks':        '/images/DucksHeader.webp',
  'emus':         '/images/Emus.webp',
  'geese':        '/images/Geese.webp',
  'goats':        '/images/Goats.webp',
  'guinea-fowl':  '/images/GuineaFowlHeader.webp',
  'honey-bees':   '/images/BeesHeader.webp',
  'horses':       '/images/HorsesHeader.webp',
  'llamas':       '/images/Llama2.webp',
  'musk-ox':      '/images/muskox.webp',
  'ostriches':    '/images/OstrichetHeader.webp',
  'pheasants':    '/images/PheasantHeader.webp',
  'pigs':         '/images/PigHeader.webp',
  'pigeons':      '/images/PigeonHeader.webp',
  'quails':       '/images/QualsHeader.jpg',
  'rabbits':      '/images/RabbitHeader.webp',
  'sheep':        '/images/SheepHeader.webp',
  'snails':       '/images/SnailsHeader.webp',
  'turkeys':      '/images/TurkeyHeader.webp',
  'yaks':         '/images/YakHeader.webp',
};

const PLACEHOLDER_IMAGE = '/images/MissingLivestockImage.webp';

const getImageSrc = (image) => {
  if (!image) return PLACEHOLDER_IMAGE;
  if (image.startsWith('http')) return image;
  const filename = image.replace(/^.*[\\/]/, '');
  return `/images/${filename}`;
};

const resolveHeroSrc = (speciesInfo, species) => {
  if (FALLBACK_IMAGES[species]) return FALLBACK_IMAGES[species];
  if (speciesInfo?.main_image) return getImageSrc(speciesInfo.main_image);
  return '/images/HomepageLivestockDB.webp';
};

const EAGER_COUNT = 4;

export default function LivestockSpecies() {
  const { t } = useTranslation();
  const { species } = useParams();
  const { language } = useLanguage();
  const [speciesInfo, setSpeciesInfo]           = useState(null);
  const [availableLetters, setAvailableLetters] = useState([]);
  const [selectedLetter, setSelectedLetter]     = useState(null);
  const [breeds, setBreeds]                     = useState(null);
  const [loadingBreeds, setLoadingBreeds]        = useState(false);
  const [showAll, setShowAll]                   = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setSpeciesInfo(null);
    setBreeds(null);
    setSelectedLetter(null);
    setAvailableLetters([]);
    setShowAll(false);

    fetch(`${API_URL}/api/livestock/species/${species}/letters`)
      .then(r => r.json())
      .then(data => {
        setSpeciesInfo(data.species_info || null);
        const letters      = data.letters || [];
        const totalBreeds  = data.total_breeds || 0;

        if (totalBreeds > 0 && totalBreeds < 26) {
          // Few breeds — load all at once, no letter nav
          setShowAll(true);
          setAvailableLetters([]);
        } else {
          setShowAll(false);
          setAvailableLetters(letters);
          if (letters.length > 0) setSelectedLetter(letters[0]);
        }
      })
      .catch(() => {});
  }, [species]);

  // Load all breeds when showAll is set
  useEffect(() => {
    if (!showAll) return;
    setLoadingBreeds(true);
    fetch(`${API_URL}/api/livestock/species/${species}?lang=${language}`)
      .then(r => r.json())
      .then(data => { setBreeds(data.breeds || []); setLoadingBreeds(false); })
      .catch(() => { setBreeds([]); setLoadingBreeds(false); });
  }, [showAll, species, language]);

  // Load breeds by letter when paginating
  useEffect(() => {
    if (showAll || !selectedLetter) return;
    setBreeds(null);
    setLoadingBreeds(true);
    fetch(`${API_URL}/api/livestock/species/${species}?letter=${encodeURIComponent(selectedLetter)}&lang=${language}`)
      .then(r => r.json())
      .then(data => { setBreeds(data.breeds || []); setLoadingBreeds(false); })
      .catch(() => { setBreeds([]); setLoadingBreeds(false); });
  }, [species, selectedLetter, showAll, language]);

  const label      = species ? species.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';
  const pluralTerm = speciesInfo?.plural || label;
  const heroSrc    = resolveHeroSrc(speciesInfo, species);

  const heroSnippet = speciesInfo?.description
    ? (() => {
        const plain = speciesInfo.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        return plain.length > 180 ? plain.substring(0, 180).replace(/\s\S+$/, '') + '…' : plain;
      })()
    : null;

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f7f2e8' }}>
      <PageMeta
        title={`${pluralTerm} Breeds | Livestock Database`}
        description={`Browse all ${pluralTerm.toLowerCase()} breeds in the Livestock of America livestock database. Find breed characteristics, origins, uses, and farming information.`}
        keywords={`${pluralTerm.toLowerCase()} breeds, ${pluralTerm.toLowerCase()} farming, ${pluralTerm.toLowerCase()} database, livestock`}
        canonical={`https://livestockofamerica.com/livestock/${species}`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: `${pluralTerm} Breeds`,
          url: `https://livestockofamerica.com/livestock/${species}`,
          description: `Breeds of ${pluralTerm.toLowerCase()} in the Livestock of America livestock database.`
        }}
      />
      <Header />

      {/* ── Hero ── */}
      <div className="mx-auto px-4 pt-6" style={{ maxWidth: '1300px' }}>
        <Breadcrumbs items={[
          { label: 'Home', to: '/' },
          { label: 'Knowledgebases', to: '/knowledgebase' },
          { label: 'Livestock Database', to: '/livestock' },
          { label: pluralTerm },
        ]} />
        <div className="relative w-full overflow-hidden rounded-xl">
          <img
            src={heroSrc}
            alt={pluralTerm}
            className="w-full object-cover"
            style={{ height: '250px', display: 'block' }}
            loading="eager"
            onError={e => { e.target.src = FALLBACK_IMAGES[species] || '/images/HomepageLivestockDB.webp'; }}
          />
          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.72) 45%, rgba(255,255,255,0) 75%)' }}
          />
          {/* Text */}
          <div className="absolute inset-0 flex flex-col justify-center px-8 py-4" style={{ maxWidth: '780px' }}>
            <h1
              style={{
                color: '#000000',
                fontFamily: "'Lora','Times New Roman',serif",
                fontSize: '1.6rem',
                fontWeight: 'bold',
                margin: '0 0 8px',
                lineHeight: 1.2,
              }}
            >
              {t('livestock_species.breeds_of', { name: pluralTerm })}
            </h1>
            {heroSnippet && (
              <p style={{ color: '#111111', fontSize: '0.82rem', margin: '0 0 10px', lineHeight: 1.5 }}>
                {heroSnippet}
              </p>
            )}
            <div>
              <Link
                to={`/livestock/${species}/about`}
                style={{
                  display: 'inline-block',
                  backgroundColor: '#3D6B34',
                  color: '#fff',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                }}
              >
                {t('livestock_species.learn_more', { name: pluralTerm })}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 py-8" style={{ maxWidth: '1300px' }}>

        {/* ── Section heading ── */}
        <h2 className="text-lg font-bold text-gray-900 mb-4">{t('livestock_species.all_breeds', { label })}</h2>

        {/* ── Letter selector (only when paginating) ── */}
        {!showAll && availableLetters.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-6 p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
            {availableLetters.map(letter => (
              <button
                key={letter}
                onClick={() => setSelectedLetter(letter)}
                className="w-9 h-9 text-sm font-bold rounded-lg transition-all"
                style={{
                  backgroundColor: selectedLetter === letter ? '#3D6B34' : '#fff',
                  color:           selectedLetter === letter ? '#fff'    : '#3D6B34',
                  border:          '1px solid #3D6B34',
                }}
              >
                {letter}
              </button>
            ))}
          </div>
        )}

        {/* ── Breed cards ── */}
        {loadingBreeds ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 animate-pulse" style={{ height: '155px' }}>
                <div className="shrink-0 bg-gray-200" style={{ width: '155px', height: '155px' }} />
                <div className="flex-1 px-5 py-4 space-y-2">
                  <div className="bg-gray-200 h-4 rounded w-3/4" />
                  <div className="bg-gray-200 h-3 rounded w-full" />
                  <div className="bg-gray-200 h-3 rounded w-5/6" />
                  <div className="bg-gray-200 h-3 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : breeds === null ? (
          <div className="text-gray-400 py-12 text-center">{t('livestock_species.select_letter')}</div>
        ) : breeds.length === 0 ? (
          <div className="text-gray-400 py-8 text-center">{t('livestock_species.no_breeds')}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {breeds.map((b, index) => {
              const imgSrc = getImageSrc(b.image);
              const shortDesc = b.description
                ? b.description.replace(/<[^>]+>/g, '').substring(0, 220) + (b.description.length > 220 ? '…' : '')
                : null;
              return (
                <div
                  key={b.breed_id}
                  className="flex bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md hover:border-[#819360] transition-all duration-200"
                >
                  <Link
                    to={`/livestock/${species}/breed/${b.breed_id}`}
                    className="shrink-0 overflow-hidden bg-gray-100 flex items-center justify-center"
                    style={{ width: '155px', height: '155px' }}
                  >
                    <img
                      src={imgSrc}
                      alt={b.breed || 'Breed'}
                      width="155"
                      height="155"
                      loading={index < EAGER_COUNT ? 'eager' : 'lazy'}
                      decoding={index < EAGER_COUNT ? 'sync' : 'async'}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        if (e.target.dataset.fallback === '1') return;
                        e.target.dataset.fallback = '1';
                        e.target.src = PLACEHOLDER_IMAGE;
                      }}
                    />
                  </Link>

                  <div className="flex flex-col justify-between px-5 py-4 flex-1 min-w-0">
                    <div>
                      <Link
                        to={`/livestock/${species}/breed/${b.breed_id}`}
                        className="font-bold text-sm hover:underline"
                        style={{ color: '#3D6B34' }}
                      >
                        {b.breed}
                      </Link>
                      {b.origin && (
                        <p className="text-xs font-semibold mt-0.5 mb-1" style={{ color: '#819360' }}>
                          {b.origin}
                        </p>
                      )}
                      {shortDesc && (
                        <p className="text-xs text-gray-600 leading-relaxed">{shortDesc}</p>
                      )}
                    </div>
                    <div className="mt-3">
                      <Link
                        to={`/livestock/${species}/breed/${b.breed_id}`}
                        className="text-xs font-bold hover:underline"
                        style={{ color: '#3D6B34' }}
                      >
                        {t('livestock_species.learn_more_arrow')}
                      </Link>
                    </div>
                  </div>
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
