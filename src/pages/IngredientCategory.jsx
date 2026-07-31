import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';
import { useLanguage } from '../lib/LanguageContext';

const API_URL = import.meta.env.VITE_OFN_API_URL || import.meta.env.VITE_LIVESTOCK_API_URL || '';

// Category hero images — matches IngredientKnowledgebase CATEGORY_META keys
const HERO_IMAGES = {
  'algae':                    '/images/algaeIngredientHeader.webp',
  'beans':                    '/images/beansIngredientHeader.webp',
  'berries':                  '/images/berriesIngredientHeader.webp',
  'breads':                   '/images/breadsIngredientHeader.webp',
  'candy':                    '/images/candyIngredientHeader.webp',
  'cheeses':                  '/images/CheesesIngredientHeader.webp',
  'chemicals':                '/images/ChemicalsIngredientHeader.webp',
  'edible-flowers':           '/images/EdibleflowersIngredientHeader.webp',
  'fish':                     '/images/FishIngredientHeader.webp',
  'flours':                   '/images/FloursIngredientHeader.webp',
  'fruit':                    '/images/FruitsIngredientHeader.webp',
  'fungi':                    '/images/FungisIngredientHeader.webp',
  'gourd':                    '/images/GourdsIngredientHeader.webp',
  'grain':                    '/images/Grains.webp',
  'herbs':                    '/images/herbsIngredientHeader.webp',
  'juice':                    '/images/JuicesIngredientHeader.webp',
  'legumes':                  '/images/LegumesIngredientHeader.webp',
  'meats':                    '/images/MeatsIngredientHeader.webp',
  'melon':                    '/images/MelonsIngredientHeader.webp',
  'milks':                    '/images/MilksIngredientHeader.webp',
  'mollusks-and-crustaceans': '/images/mollusksandcrustaceansIngredientHeader.webp',
  'nuts':                     '/images/nutsIngredientHeader.webp',
  'oil':                      '/images/OilsIngredientHeader.webp',
  'pasta':                    '/images/PastasIngredientHeader.webp',
  'peppers':                  '/images/peppersIngredientHeader.webp',
  'powders':                  '/images/PowdersIngredientHeader.webp',
  'rices':                    '/images/RicesIngredientHeader.webp',
  'roots':                    '/images/RootsIngredientHeader.webp',
  'salts':                    '/images/SaltsIngredientHeader.webp',
  'sauces':                   '/images/Sauces.webp',
  'seeds':                    '/images/SeedsIngredientHeader.webp',
  'spices':                   '/images/SpicesIngredientHeader.webp',
  'sugars':                   '/images/SugarsIngredientHeader.webp',
  'teas':                     '/images/TeasIngredientHeader.webp',
  'tubers':                   '/images/TubersIngredientHeader.webp',
  'vegetables':               '/images/VegetablesIngredientHeader.webp',
};

function resolveHeroImg(category, catHeader) {
  if (catHeader) return catHeader;
  if (HERO_IMAGES[category]) return HERO_IMAGES[category];
  // Fallback: try capitalised convention
  const cap = category.replace(/-/g, '');
  return '/images/' + cap.charAt(0).toUpperCase() + cap.slice(1) + 'IngredientHeader.webp';
}

// Resolve image src — prefer DB IngredientImage, fall back to local convention
function imgSrc(ingredient) {
  const img = ingredient.image || ingredient.IngredientImage;
  if (img) {
    if (img.startsWith('http') || img.startsWith('/')) return img;
    return '/images/' + img;
  }
  return '/images/' + (ingredient.name || ingredient.IngredientName || '').replace(/ /g, '') + '.webp';
}

const EAGER_COUNT = 4;

function IngredientCard({ ing, category, index }) {
  const { t } = useTranslation();
  const src = imgSrc(ing);
  const name = ing.name || ing.IngredientName || '';
  const description = ing.description || ing.IngredientDescription || '';
  const hasVarieties = ing.variety_count > 0;
  const linkTo = hasVarieties
    ? `/ingredient-knowledgebase/${category}/varieties/${ing.id}`
    : `/ingredient-knowledgebase/${category}/${ing.id || ing.IngredientID}`;

  return (
    <div className="flex bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md hover:border-[#819360] transition-all duration-200">
      {/* Left: square image */}
      <Link to={linkTo} className="shrink-0 overflow-hidden" style={{ width: '155px', height: '155px' }}>
        <img
          src={src}
          alt={name}
          width="155"
          height="155"
          loading={index < EAGER_COUNT ? 'eager' : 'lazy'}
          decoding={index < EAGER_COUNT ? 'sync' : 'async'}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          onError={e => { e.target.style.display = 'none'; }}
        />
      </Link>

      {/* Right: text */}
      <div className="flex flex-col justify-between px-5 py-4 flex-1 min-w-0">
        <div>
          <Link
            to={linkTo}
            className="font-bold text-sm hover:underline"
            style={{ color: '#3D6B34' }}
          >
            {name}
          </Link>
          {hasVarieties && (
            <p className="text-xs font-semibold mt-0.5 mb-2" style={{ color: '#819360' }}>
              {ing.variety_count} {ing.variety_count === 1 ? t('ingredient_cat.variety_singular') : t('ingredient_cat.variety_plural')}
            </p>
          )}
          {description && (
            <p className="text-xs text-gray-600 leading-relaxed" style={{
              display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {description}
            </p>
          )}
        </div>
        <div className="mt-3">
          <Link to={linkTo} className="text-xs font-bold hover:underline" style={{ color: '#3D6B34' }}>
            {t('ingredient_cat.explore_arrow')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function IngredientCategory() {
  const { t } = useTranslation();
  const { category } = useParams();
  const { language } = useLanguage();
  const [catName, setCatName]       = useState('');
  const [catHeader, setCatHeader]   = useState('');
  const [ingredients, setIngredients] = useState(null);
  const [search, setSearch]         = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    fetch(`${API_URL}/api/ingredient-knowledgebase/category/${category}?lang=${language}`)
      .then(r => r.json())
      .then(data => {
        setCatName(data.category_name || category);
        setCatHeader(data.header_image || '');
        setIngredients(Array.isArray(data.ingredients) ? data.ingredients : []);
      })
      .catch(() => setIngredients([]));
  }, [category, language]);

  const filtered = ingredients
    ? ingredients.filter(ing => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        const name = (ing.name || ing.IngredientName || '').toLowerCase();
        const desc = (ing.description || ing.IngredientDescription || '').toLowerCase();
        return name.includes(q) || desc.includes(q);
      })
    : null;

  const displayName = catName || category;
  const heroImg = resolveHeroImg(category, catHeader);

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f7f2e8' }}>
      <PageMeta
        title={`${displayName} Ingredients | Ingredient Knowledgebase`}
        description={`Browse ${displayName.toLowerCase()} ingredients in the Livestock of America knowledgebase. Find flavor profiles, processing methods, varieties, and culinary uses.`}
        keywords={`${displayName.toLowerCase()}, ${displayName.toLowerCase()} ingredients, ${displayName.toLowerCase()} varieties, ingredient knowledgebase`}
        canonical={`https://livestockofamerica.com/ingredient-knowledgebase/${category}`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: `${displayName} Ingredients`,
          url: `https://livestockofamerica.com/ingredient-knowledgebase/${category}`,
          description: `Browse ${displayName.toLowerCase()} ingredients.`
        }}
      />
      <Header />

      {/* ── Hero ── */}
      <div className="mx-auto px-4 pt-6" style={{ maxWidth: '1300px' }}>
        <Breadcrumbs items={[
          { label: 'Home', to: '/' },
          { label: 'Knowledgebases', to: '/knowledgebase' },
          { label: 'Ingredient Knowledgebase', to: '/ingredient-knowledgebase' },
          { label: displayName },
        ]} />
        <div className="relative w-full overflow-hidden rounded-xl">
          <img
            src={heroImg}
            alt={displayName}
            className="w-full object-cover"
            style={{ height: '250px', display: 'block' }}
            loading="eager"
            onError={e => {
              const lower = '/images/' + category.replace(/-/g, '').toLowerCase() + 'IngredientHeader.webp';
              if (e.target.src !== window.location.origin + lower) {
                e.target.src = lower;
              } else {
                e.target.src = '/images/FruitsIngredientHeader.webp';
              }
            }}
          />
          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.72) 45%, rgba(255,255,255,0) 75%)' }}
          />
          {/* Text */}
          <div className="absolute inset-0 flex flex-col justify-center px-8 py-6" style={{ maxWidth: '780px' }}>
            <h1
              style={{
                color: '#000000',
                fontFamily: "'Lora','Times New Roman',serif",
                fontSize: '2rem',
                fontWeight: 'bold',
                margin: '0 0 12px',
                lineHeight: 1.2,
              }}
            >
              {displayName}
            </h1>
            <div>
              <Link
                to="/ingredient-knowledgebase"
                style={{
                  display: 'inline-block',
                  backgroundColor: '#3D6B34',
                  color: '#fff',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  padding: '7px 18px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                }}
              >
                {t('ingredient_cat.back_btn')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mx-auto px-4 py-8" style={{ maxWidth: '1300px' }}>

        {/* Section heading + search */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <h2 className="text-lg font-bold text-gray-900">
            {displayName} {t('ingredient_cat.ingredient_types')}
            {filtered && (
              <span className="text-sm font-normal text-gray-400 ml-2">
                {filtered.length} {filtered.length !== 1 ? t('ingredient_cat.ingredients') : t('ingredient_cat.ingredient')}
              </span>
            )}
          </h2>

          {ingredients && ingredients.length > 6 && (
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('ingredient_cat.search_placeholder')}
              className="border border-gray-300 rounded-lg text-sm text-gray-700 outline-none"
              style={{ padding: '0.4rem 0.75rem', width: 220 }}
            />
          )}
        </div>

        {/* Grid */}
        {filtered === null ? (
          <div className="text-center text-gray-400 py-16">{t('ingredient_cat.loading')}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-500 py-16">
            {search ? t('ingredient_cat.no_results', { search }) : t('ingredient_cat.no_ingredients')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map((ing, index) => (
              <IngredientCard key={ing.id || ing.IngredientID} ing={ing} category={category} index={index} />
            ))}
          </div>
        )}

      </div>

      <Footer />
    </div>
  );
}
