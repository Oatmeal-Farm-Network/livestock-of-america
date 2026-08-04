import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';
import GuestAccessPrompt, { GUEST_DESC_CHARS, plainTextPreview } from '../components/GuestAccessPrompt';
import { useLanguage } from '../lib/LanguageContext';
import { isLoggedIn } from '../lib/auth';

const API_URL = import.meta.env.VITE_LIVESTOCK_API_URL || '';

// Kept in sync with FALLBACK_IMAGES in LivestockSpecies.jsx so the /about
// hero matches the /livestock/:slug hero when the user lands here directly
// (e.g. emus, which skips the breed-list page because it only has one breed).
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
  'rabbits':      '/images/Rabitts.webp',
  'sheep':        '/images/Sheepbreeds.webp',
  'snails':       '/images/Snail.webp',
  'turkeys':      '/images/TurkeyHeader.webp',
  'yaks':         '/images/YakHeader.webp',
};

const getImageSrc = (image) => {
  if (!image) return null;
  if (image.startsWith('http')) return image;
  const filename = image.replace(/^.*[\\/]/, '');
  return `/images/${filename}`;
};

const resolveHeroSrc = (info, species) => {
  if (FALLBACK_IMAGES[species]) return FALLBACK_IMAGES[species];
  if (info?.main_image) return getImageSrc(info.main_image);
  return '/images/HomepageLivestockDB.webp';
};

// Species with a single breed — skip the breed-list page and its cross-links.
const SINGLE_BREED_SLUGS = new Set(['emus', 'ostriches']);

export default function LivestockAbout() {
  const { t } = useTranslation();
  const { species } = useParams();
  const { language } = useLanguage();
  const guest = !isLoggedIn();
  const [info, setInfo] = useState(null);
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetch(API_URL + '/api/livestock/about/' + species + '?lang=' + language)
      .then(r => r.json())
      .then(data => {
        setInfo(data);
        setColors(data.colors || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [species, language]);

  const label = species ? species.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';
  const pluralTerm = info?.plural || label;
  const heroSrc    = resolveHeroSrc(info, species);
  const isSingleBreed = SINGLE_BREED_SLUGS.has(species);

  const heroSnippet = info?.about_html
    ? (() => {
        const plain = info.about_html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        return plain.length > 180 ? plain.substring(0, 180).replace(/\s\S+$/, '') + '…' : plain;
      })()
    : null;

  return (
    <div className="min-h-screen font-sans">
      <PageMeta
        title={`About ${label} | Livestock Species Overview`}
        description={`Learn about ${label.toLowerCase()} — history, characteristics, colors, uses, and farming considerations. Part of the Livestock of America livestock knowledgebase.`}
        keywords={`${label.toLowerCase()}, ${label.toLowerCase()} farming, ${label.toLowerCase()} history, livestock species`}
        canonical={`https://livestockofamerica.com/livestock/${species}/about`}
      />
      <Header />

      <div className="mx-auto px-4 pt-6" style={{ maxWidth: '1300px' }}>
        <Breadcrumbs items={[
          { label: 'Home', to: '/' },
          { label: 'Livestock Database', to: '/livestock' },
          ...(isSingleBreed
            ? [{ label: pluralTerm }]
            : [{ label: pluralTerm, to: `/livestock/${species}` }, { label: t('livestock_about.about_prefix') }]),
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
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.72) 45%, rgba(255,255,255,0) 75%)' }}
          />
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
              {t('livestock_about.about_prefix')} {pluralTerm}
            </h1>
            {heroSnippet && (
              <p style={{ color: '#111111', fontSize: '0.82rem', margin: 0, lineHeight: 1.5 }}>
                {heroSnippet}
              </p>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>
        {loading ? (
          <div className="text-gray-400 py-12 text-center">{t('livestock_about.loading')}</div>
        ) : !info ? (
          <div className="text-gray-500 py-12 text-center">{t('livestock_about.not_found')}</div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8">

            {!isSingleBreed && (
              <>
                <div className="text-center mb-6 pb-4 border-b-2 border-gray-200">
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
                    <img
                      src={`/images/${label.replace(/ /g,'')}.webp`}
                      alt={label}
                      loading="lazy"
                      style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                    {t('livestock_about.about_prefix')} {label}
                  </h1>
                </div>
                <Link to={`/livestock/${species}`} className="text-sm font-bold hover:underline block mb-4" style={{ color: '#3D6B34' }}>
                  {t('livestock_about.about_breeds', { label })}
                </Link>
              </>
            )}

            <div className="overflow-hidden mb-6">
              {info.main_image && (
                <div className="float-right ml-6 mb-4 rounded overflow-hidden shadow" style={{ width: '300px' }}>
                  <img
                    src={info.main_image.startsWith('http') ? info.main_image : `/images/${info.main_image}`}
                    alt={label}
                    loading="lazy"
                    className="w-full"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}
              {guest ? (
                <p className="text-sm text-gray-700 leading-relaxed m-0">
                  {plainTextPreview(info.about_html, GUEST_DESC_CHARS)}
                </p>
              ) : (
                <div
                  className="text-sm text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: info.about_html || '' }}
                />
              )}
            </div>

            {guest ? (
              <GuestAccessPrompt
                className="clear-both"
                title={t('guest_access.kb_detail_title', 'Sign in for the full breed profile')}
                message={t(
                  'guest_access.kb_detail',
                  'Create a free account or sign in to read the complete breed description, characteristics, and farming uses.',
                )}
              />
            ) : (
              <>
                {info.sections && info.sections.map((section, i) => (
                  <div key={i} className="mt-8 clear-both">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">{section.title}</h2>
                    <div className="overflow-hidden">
                      {section.image && (
                        <div className="float-left mr-6 mb-4 rounded overflow-hidden shadow" style={{ width: '200px' }}>
                          <img
                            src={section.image.startsWith('http') ? section.image : `/images/${section.image}`}
                            alt={section.title}
                            className="w-full"
                            loading="lazy"
                            onError={e => { e.target.style.display = 'none'; }}
                          />
                        </div>
                      )}
                      <div
                        className="text-sm text-gray-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: section.content }}
                      />
                    </div>
                  </div>
                ))}

                {colors.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-200 clear-both">
                    <h2 className="text-xl font-bold mb-3" style={{ color: '#4CAF50' }}>{t('livestock_about.colors_title', { label })}</h2>
                    <p className="text-sm text-gray-700 mb-2">{t('livestock_about.colors_intro', { label })}</p>
                    <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1">
                      {colors.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}
              </>
            )}

            <div className="mt-8 pt-4 border-t border-gray-100">
              <Link to={`/livestock/${species}`} className="text-sm hover:underline" style={{ color: '#3D6B34' }}>
                {t('livestock_about.back_breeds', { label })}
              </Link>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
