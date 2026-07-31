/**
 * Knowledgebases landing page — high-level overview of the three databases
 * (Plant, Livestock, Ingredient) with deep-link cards into each.
 *
 * Lora headlines are set via inline style because index.css cascades a global
 * `h1 { font-size: 24px; font-weight: bold; }` rule that out-prioritises any
 * Tailwind size/weight utility — same pattern the home page uses.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';
import { isPhase1PublicMode } from '../lib/auth';

const LORA = "'Lora', 'Times New Roman', serif";
const GREEN = '#3D6B34';
const SAGE = '#4C8B5D';

// One source of truth for both the top-of-page stats strip and the per-KB cards.
const KBS = [
  {
    slug: 'plants',
    title: 'Plant Knowledgebase',
    icon: '🌾',
    statN: '4,000+',
    statLabel: 'Plant varieties',
    img: '/images/PlantDBHome.webp',
    link: '/plant-knowledgebase',
    tagline: 'From staple grains to single-origin spices.',
    description:
      "Detailed profiles for every food plant we've documented across 22 categories — grains, legumes, vegetables, fruits, berries, herbs, spices, oilseeds, mushrooms, edible flowers and more. Each entry covers scientific name, varieties, growing conditions, climate zones, harvest timing, common pests, and culinary or processing uses.",
    bullets: [
      '22 categories — grains, vegetables, fruits, herbs, spices, more',
      'Variety-level detail (cultivar, region, season)',
      'Growing requirements: zone, soil, water, sun',
      'Pest & disease references plus companion-planting hints',
      'Direct links to producers in the Food-System Directory',
    ],
    cta: 'Explore plant database',
  },
  {
    slug: 'livestock',
    title: 'Livestock Database',
    icon: '🐄',
    statN: '3,000+',
    statLabel: 'Breeds across 28 species',
    img: '/images/HomepageLivestockDB.webp',
    link: '/livestock',
    tagline: 'Every breed worth raising — with the data to prove it.',
    description:
      'Profiles for over 3,000 breeds across 28 species: cattle, sheep, goats, pigs, poultry, rabbits, alpacas, llamas, yaks, bison, camels, deer, donkeys, horses, fish and more. Each breed entry includes origin, history, morphology, productivity (milk / meat / fiber / draft), temperament, dual-purpose ratings, conservation status, and links to active producers and registries.',
    bullets: [
      '28 species — from cattle and sheep to alpacas, yaks and bees',
      'Origin, history, and conservation-status notes',
      'Productivity data: milk yield, meat quality, fiber micron, eggs',
      'Temperament, climate fitness, and dual-purpose suitability',
      'Cross-links to breed registries and active producers',
    ],
    cta: 'Explore livestock database',
  },
  {
    slug: 'ingredients',
    title: 'Ingredient Knowledgebase',
    icon: '🧂',
    statN: '1,400+',
    statLabel: 'Ingredients · 14,000+ varieties',
    img: '/images/Homepagefoodsystemdirectory.webp',
    link: '/ingredient-knowledgebase',
    tagline: 'Built for chefs, food businesses, and anyone sourcing real food.',
    description:
      'Over 1,400 agricultural ingredients with more than 14,000 varieties — flours, cheeses, oils, fish, fungi, edible flowers, fruits, herbs and teas, spices, sweeteners, and chemistry. Each ingredient entry covers flavor profile, nutritional data, common processing methods, culinary uses, allergen and substitution notes, and direct sourcing paths to artisan producers and farms in the network.',
    bullets: [
      'Flavor profile, nutritional snapshot, allergen flags',
      'Substitutions and processing-method notes',
      'Variety-level detail (e.g. 80+ cheese varieties)',
      'Sourcing paths into the Farm 2 Table marketplace',
      'Powers Chef\'s Digital Pantry and the Pairsley AI advisor',
    ],
    cta: 'Explore ingredient database',
  },
];

function StatStrip() {
  const { t } = useTranslation();
  return (
    <section style={{ backgroundColor: GREEN }} className="text-white">
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        {KBS.map(k => (
          <Link
            key={k.slug}
            to={k.link}
            className="block rounded-xl px-2 py-1 transition-colors hover:bg-white/10"
            style={{ fontFamily: LORA, color: '#ffffff' }}
          >
            <div className="text-3xl md:text-4xl font-bold leading-none" style={{ color: '#ffffff' }}>
              {k.statN}
            </div>
            <div className="text-[10px] md:text-xs tracking-widest mt-1 uppercase" style={{ color: '#ffffff' }}>
              {t('knowledgebases.' + k.slug + '_stat_label', k.statLabel)}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function KBCard({ kb, imageRight }) {
  const { t } = useTranslation();
  const Img = (
    <Link to={kb.link} className="block w-full md:w-2/5 shrink-0 overflow-hidden aspect-video md:aspect-auto bg-white">
      <img
        src={kb.img}
        alt={kb.title}
        loading="lazy"
        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        onError={e => { e.target.src = '/images/DirectoryHome.webp'; }}
      />
    </Link>
  );
  const Text = (
    <div className="p-6 flex flex-col justify-center flex-1">
      <div className="text-[10px] uppercase tracking-widest font-semibold text-gray-500 mb-1">
        {kb.statN} {t('knowledgebases.' + kb.slug + '_stat_label', kb.statLabel)}
      </div>
      <h2
        style={{ fontFamily: LORA, fontWeight: 700, fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', color: SAGE, marginBottom: '0.5rem' }}
      >
        {t('knowledgebases.' + kb.slug + '_title', kb.title)}
      </h2>
      <div className="italic text-sm text-gray-600 mb-3" style={{ fontFamily: LORA }}>
        {t('knowledgebases.' + kb.slug + '_tagline', kb.tagline)}
      </div>
      <p className="text-sm text-gray-700 leading-relaxed mb-3">{t('knowledgebases.' + kb.slug + '_description', kb.description)}</p>
      <ul className="text-sm text-gray-700 space-y-1 mb-4 list-disc pl-5">
        {kb.bullets.map((b, i) => <li key={i}>{t('knowledgebases.' + kb.slug + '_bullet_' + i, b)}</li>)}
      </ul>
      <Link
        to={kb.link}
        className="self-end px-5 py-2 rounded-full font-semibold text-white text-sm shadow-sm hover:shadow-md transition"
        style={{ backgroundColor: GREEN, color: '#ffffff' }}
      >
        {t('knowledgebases.' + kb.slug + '_cta', kb.cta)} →
      </Link>
    </div>
  );
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-shadow duration-200">
      {imageRight ? (<>{Text}{Img}</>) : (<>{Img}{Text}</>)}
    </div>
  );
}

export default function Knowledgebases() {
  const { t } = useTranslation();
  const phase1 = isPhase1PublicMode();
  const pageTitle = phase1
    ? t('phase1.knowledgebase.meta_title', 'Livestock Knowledgebase | Plants, Livestock Breeds & Ingredients')
    : 'Agricultural Knowledgebases | Plants, Livestock & Ingredients';
  const canonical = phase1
    ? 'https://livestockofamerica.com/knowledgebase'
    : 'https://livestockofamerica.com/knowledgebases';

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f7f2e8' }}>
      <PageMeta
        title={pageTitle}
        description="Three trusted, free databases for the food system: 4,000+ food plant varieties, 3,000+ livestock breeds across 28 species, and 1,400+ ingredients with 14,000+ varieties."
        keywords="agricultural database, plant varieties, livestock breeds, ingredient knowledgebase, farm encyclopedia, food system reference"
        canonical={canonical}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: phase1 ? 'Livestock Knowledgebase' : 'Agricultural Knowledgebases',
          url: canonical,
          description: 'Plants, livestock breeds, and ingredient knowledgebases — a trusted source of truth for the food ecosystem.',
        }}
      />
      <Header />

      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <Breadcrumbs items={[
            { label: t('phase1.nav.home', 'Home'), to: '/' },
            { label: phase1 ? t('phase1.nav.knowledgebase', 'Livestock Knowledgebase') : 'Knowledgebases' },
          ]} />
          <h1
            className="leading-tight mt-3 mb-3"
            style={{
              fontFamily: LORA,
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 'clamp(1.625rem, 2.5vw, 2.25rem)',
              color: '#232f3a',
            }}
          >
            {t('knowledgebases.hero_h1')}
          </h1>
          <h2
            className="mb-4"
            style={{
              fontFamily: LORA,
              fontWeight: 700,
              fontSize: 'clamp(1.875rem, 3vw, 2.5rem)',
              color: SAGE,
            }}
          >
            {t('knowledgebases.hero_h2')}
          </h2>
          <p className="text-gray-700 text-base leading-relaxed max-w-3xl">
            {t('knowledgebases.hero_body')}
          </p>
        </div>
      </section>

      {/* ─── Headline stats ───────────────────────────────────────────── */}
      <StatStrip />

      {/* ─── Per-KB detail cards ─────────────────────────────────────── */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 space-y-6">
          {KBS.map((kb, i) => (
            <KBCard key={kb.slug} kb={kb} imageRight={i % 2 === 1} />
          ))}
        </div>
      </section>

      {/* ─── How they connect ────────────────────────────────────────── */}
      <section className="pb-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h3
              className="mb-3"
              style={{ fontFamily: LORA, fontWeight: 700, fontSize: '1.5rem', color: SAGE }}
            >
              {t('knowledgebases.why_heading')}
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              {t('knowledgebases.why_body1')}
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {t('knowledgebases.why_body2')}
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
