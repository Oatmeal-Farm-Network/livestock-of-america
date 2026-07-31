import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';
import { useLanguage } from '../lib/LanguageContext';

const API_URL = import.meta.env.VITE_OFN_API_URL || import.meta.env.VITE_LIVESTOCK_API_URL || '';

const CATEGORY_MAP = {
  'algae':           { dbType: 'Algaes',        label: 'Algae',           header: '/images/AlgaeHeader.webp' },
  'berries':         { dbType: 'Berries',        label: 'Berries',         header: '/images/BerriesHeader.webp' },
  'bulbs':           { dbType: 'Bulbs',          label: 'Bulbs',           header: '/images/BulbsHeader.webp' },
  'corms':           { dbType: 'Corms',          label: 'Corms',           header: '/images/CormsHeader.webp' },
  'culinary-herbs':  { dbType: 'Culinary Herbs', label: 'Culinary Herbs',  header: '/images/CulinaryHerbsHeader.webp' },
  'edible-flowers':  { dbType: 'Edible Flowers', label: 'Edible Flowers',  header: '/images/EdibleFlowersHeader.webp' },
  'fruits':          { dbType: 'Fruits',         label: 'Fruits',          header: '/images/FruitsHeader.webp' },
  'ginkgos':         { dbType: 'Ginkgoes',       label: 'Ginkgos',         header: '/images/GinkgoHeader.webp' },
  'grains':          { dbType: 'Grains',         label: 'Grains',          header: '/images/GrainsHeader.webp' },
  'grasses':         { dbType: 'Grasses',        label: 'Grasses',         header: '/images/GrassesHeader.webp' },
  'leafy-greens':    { dbType: 'Leafy Greens',   label: 'Leafy Greens',    header: '/images/LeafyGreensHeader.webp' },
  'legumes':         { dbType: 'Legumes',        label: 'Legumes',         header: '/images/LegumesHeader.webp' },
  'medicinal-herbs': { dbType: 'Medicinal Herb', label: 'Medicinal Herbs', header: '/images/MedicinalHerbsHeader.webp' },
  'mushrooms':       { dbType: 'Mushroom',       label: 'Mushrooms',       header: '/images/MushroomsHeader.webp' },
  'nuts':            { dbType: 'Nut',            label: 'Nuts',            header: '/images/NutsHeader.webp' },
  'palms':           { dbType: 'Palms',          label: 'Palms',           header: '/images/PalmsHeader.webp' },
  'pseudocereals':   { dbType: 'Pseudocereal',   label: 'Pseudocereals',   header: '/images/PseudocerealsHeader.webp' },
  'rhizomes':        { dbType: 'Rhizomes',       label: 'Rhizomes',        header: '/images/RhizomesHeader.webp' },
  'root-vegetables': { dbType: 'Root',           label: 'Root Vegetables', header: '/images/RootVegetablesHeader.webp' },
  'spices':          { dbType: 'Spices',         label: 'Spices',          header: '/images/SpicesHeader.webp' },
  'tubers':          { dbType: 'Tubers',         label: 'Tubers',          header: '/images/TubersHeader.webp' },
  'vegetables':      { dbType: 'Vegetable',      label: 'Vegetables',      header: '/images/VegetablesHeader.webp' },
};

// Eager-load the first 4 plant images (above the fold), lazy-load the rest
const EAGER_COUNT = 4;

function plantImgSrc(plant) {
  if (plant.plant_image) {
    if (plant.plant_image.startsWith('/') || plant.plant_image.startsWith('http')) return plant.plant_image;
    return '/images/' + plant.plant_image;
  }
  return '/images/' + plant.plant_name.replace(/ /g, '') + '.webp';
}

export default function PlantCategory() {
  const { t } = useTranslation();
  const { category } = useParams();
  const { language } = useLanguage();
  const [plants, setPlants] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const cat = CATEGORY_MAP[category];

  useEffect(() => {
    window.scrollTo(0, 0);
    setPlants(null);
    const token = localStorage.getItem('access_token');
    setIsLoggedIn(Boolean(token));
    if (!cat) { setPlants([]); return; }

    const url = API_URL + '/api/plant-knowledgebase/plants?plant_type=' + encodeURIComponent(cat.dbType) + '&lang=' + language;
    fetch(url)
      .then(r => r.json())
      .then(data => setPlants(Array.isArray(data) ? data : []))
      .catch(() => setPlants([]));
  }, [category, cat?.dbType, language]);

  if (!cat) return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f7f2e8' }}>
      <Header />
      <div className="text-center py-20 text-gray-500">{t('plant_cat.not_found', { category })}</div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f7f2e8' }}>
      <PageMeta
        title={`${cat.label} Plants | Plant Knowledgebase`}
        description={`Browse ${cat.label.toLowerCase()} plant varieties in the Livestock of America plant knowledgebase. Find growing guides, soil requirements, and nutritional data for each variety.`}
        keywords={`${cat.label.toLowerCase()}, ${cat.label.toLowerCase()} varieties, food plants, plant knowledgebase`}
        canonical={`https://livestockofamerica.com/plant-knowledgebase/${category}`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: `${cat.label} Plants`,
          url: `https://livestockofamerica.com/plant-knowledgebase/${category}`,
          description: `Browse ${cat.label.toLowerCase()} plant varieties.`
        }}
      />
      <Header />

      {/* ── Hero: same max-width as body content ── */}
      <div className="mx-auto px-4 pt-6" style={{ maxWidth: '1300px' }}>
        <Breadcrumbs items={[
          { label: 'Home', to: '/' },
          { label: 'Knowledgebases', to: '/knowledgebase' },
          { label: 'Plant Knowledgebase', to: '/plant-knowledgebase' },
          { label: cat.label },
        ]} />
        <div className="relative w-full overflow-hidden rounded-xl">
          <img
            src={cat.header}
            alt={cat.label}
            loading="eager"
            fetchPriority="high"
            className="w-full object-cover"
            style={{ maxHeight: '400px', minHeight: '260px', display: 'block' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
          {/* Gradient overlay — opaque on the left where text sits, fades to transparent */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.72) 45%, rgba(255,255,255,0) 75%)' }} />
          {/* Text over image */}
          <div className="absolute inset-0 flex flex-col justify-center px-8 py-6" style={{ maxWidth: '680px' }}>
            <h1
              style={{
                color: '#000000',
                fontFamily: "'Lora','Times New Roman',serif",
                fontSize: '2rem',
                fontWeight: 'bold',
                margin: '0 0 8px',
                lineHeight: 1.2,
              }}
            >
              {cat.label}
            </h1>
            <p style={{ color: '#111111', fontSize: '0.92rem', margin: 0, lineHeight: 1.6 }}>
              {t('plant_cat.hero_browse', { name: t('plant_cat.cat_label_' + category.replace(/-/g, '_'), cat.label).toLowerCase() })}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 py-8" style={{ maxWidth: '1300px' }}>

        <h2 className="text-lg font-bold text-gray-900 mb-5">{t('plant_cat.section_heading', { name: t('plant_cat.cat_label_' + category.replace(/-/g, '_'), cat.label) })}</h2>

        {plants === null ? (
          /* Skeleton placeholders */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 animate-pulse">
                <div className="bg-gray-200 shrink-0" style={{ width: '155px', height: '155px' }} />
                <div className="flex-1 px-5 py-4 space-y-2">
                  <div className="bg-gray-200 h-4 rounded w-3/4" />
                  <div className="bg-gray-200 h-3 rounded w-1/3" />
                  <div className="bg-gray-200 h-3 rounded w-full" />
                  <div className="bg-gray-200 h-3 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : plants.length === 0 ? (
          <div className="text-gray-500 py-12 text-center">{t('plant_cat.no_plants', { type: cat.dbType })}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {plants.map((plant, index) => (
              <div
                key={plant.plant_id}
                className="flex bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md hover:border-[#819360] transition-all duration-200"
              >
                {/* Left: square image */}
                <Link to={'/plant-knowledgebase/varietals/' + plant.plant_id} className="shrink-0 overflow-hidden" style={{ width: '155px', height: '155px' }}>
                  <img
                    src={plantImgSrc(plant)}
                    alt={plant.plant_name}
                    width="155"
                    height="155"
                    loading={index < EAGER_COUNT ? 'eager' : 'lazy'}
                    decoding={index < EAGER_COUNT ? 'sync' : 'async'}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    onError={e => { e.target.src = '/images/PlantDBHome.webp'; }}
                  />
                </Link>

                {/* Right: text */}
                <div className="flex flex-col justify-between px-5 py-4 flex-1 min-w-0">
                  <div>
                    <Link
                      to={'/plant-knowledgebase/varietals/' + plant.plant_id}
                      className="font-bold text-sm hover:underline"
                      style={{ color: '#3D6B34' }}
                    >
                      {plant.plant_name}
                    </Link>
                    <p className="text-xs font-semibold mt-0.5 mb-2" style={{ color: '#819360' }}>
                      {plant.variety_count > 0 ? t('plant_cat.variety_count', { count: plant.variety_count.toLocaleString() }) : '—'}
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed">{plant.plant_description}</p>
                  </div>
                  <div className="mt-3">
                    <Link
                      to={'/plant-knowledgebase/varietals/' + plant.plant_id}
                      className="text-xs font-bold hover:underline"
                      style={{ color: '#3D6B34' }}
                    >
                      {t('plant_cat.explore_arrow')}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}