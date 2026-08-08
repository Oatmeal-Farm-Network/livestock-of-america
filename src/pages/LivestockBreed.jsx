import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { useTranslation } from '../lib/i18n';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';
import GuestAccessPrompt, { GUEST_DESC_CHARS, plainTextPreview } from '../components/GuestAccessPrompt';
import { useLanguage } from '../lib/LanguageContext';
import { isLoggedIn } from '../lib/auth';

const API_URL = import.meta.env.VITE_LIVESTOCK_API_URL || '';

export default function LivestockBreed() {
  const { t } = useTranslation();
  const { species, breedId } = useParams();
  const { language } = useLanguage();
  // Knowledgebase is public reference content — full breed profile shows for
  // everyone, signed in or not. (Toggle back to `!isLoggedIn()` to re-gate.)
  const guest = false;
  const [breed, setBreed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setImageFailed(false);
    fetch(`${API_URL}/api/livestock/breed/${breedId}?lang=${language}`)
      .then(r => r.json())
      .then(data => setBreed(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [breedId, language]);

  const label = species
    ? species.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : '';

  const breedImgUrl = breed?.image
    ? (breed.image.startsWith('http') ? breed.image : `/images/${breed.image.replace(/^.*[\\/]/, '')}`)
    : null;
  const showPhoto = Boolean(breedImgUrl) && !imageFailed;


  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f7f2e8' }}>
      <PageMeta
        title={breed ? `${breed.breed} ${label} | Livestock Breed` : `${label} Breed | Livestock Database`}
        description={breed
          ? `Learn about the ${breed.breed} ${label.toLowerCase()} breed — origin, characteristics, and farming uses on Livestock of America.`
          : `${label} breed information in the Livestock of America livestock database.`}
        keywords={breed ? `${breed.breed}, ${breed.breed} ${label.toLowerCase()}, ${label.toLowerCase()} breed, livestock` : `${label.toLowerCase()} breeds`}
        canonical={`https://livestockofamerica.com/livestock/${species}/breed/${breedId}`}
        image={breedImgUrl}
        ogType="article"
        jsonLd={breed ? {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: `${breed.breed} ${label}`,
          description: `Learn about the ${breed.breed} ${label.toLowerCase()} breed.`,
          image: breedImgUrl || undefined,
          mainEntityOfPage: `https://livestockofamerica.com/livestock/${species}/breed/${breedId}`,
        } : undefined}
      />
      <Header />

      {/* ── Hero ── */}
      <div className="mx-auto px-4 pt-6" style={{ maxWidth: '1300px' }}>
        <Breadcrumbs items={[
          { label: 'Home', to: '/' },
          { label: 'Livestock Database', to: '/livestock' },
          { label, to: `/livestock/${species}` },
          { label: breed?.breed || 'Breed' },
        ]} />
        <div style={{ padding: '1rem 0 0.5rem' }}>
          {loading ? (
            <div className="bg-gray-200 animate-pulse h-8 rounded w-64" />
          ) : (
            <>
              <p
                style={{
                  color: '#3D6B34',
                  fontFamily: "'Lora','Times New Roman',serif",
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  margin: '0 0 6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {label}
              </p>
              <h1
                style={{
                  color: '#000000',
                  fontFamily: "'Lora','Times New Roman',serif",
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  margin: '0 0 14px',
                  lineHeight: 1.2,
                }}
              >
                {breed?.breed || '…'}
              </h1>
              <div>
                <Link
                  to={`/livestock/${species}`}
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
                  {t('livestock_breed.all_breeds', { label })}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mx-auto px-4 py-8" style={{ maxWidth: '1300px' }}>
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 animate-pulse space-y-3">
            <div className="float-right ml-6 mb-4 bg-gray-200 rounded-xl" style={{ width: '300px', height: '220px' }} />
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-3 rounded" style={{ width: i % 3 === 2 ? '75%' : '100%' }} />
            ))}
          </div>
        ) : !breed ? (
          <div className="text-gray-500 py-12 text-center">{t('livestock_breed.not_found')}</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 overflow-hidden">
            {/* Floated breed image, or empty slot when missing/broken */}
            <div className="float-right ml-6 mb-4" style={{ width: '300px', maxWidth: '100%' }}>
              {showPhoto ? (
                <>
                  <img
                    src={breedImgUrl}
                    alt={breed.breed}
                    loading="eager"
                    className="w-full rounded-xl shadow-sm"
                    onError={() => setImageFailed(true)}
                  />
                  {breed.image_caption && (
                    <p
                      className="text-xs text-gray-500 mt-2 text-center"
                      dangerouslySetInnerHTML={{ __html: breed.image_caption }}
                    />
                  )}
                </>
              ) : (
                <div
                  className="w-full rounded-xl flex flex-col items-center justify-center gap-2 select-none"
                  style={{ height: '220px', backgroundColor: '#ebe6dc' }}
                  aria-label="Image placeholder"
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#b5ae9f" strokeWidth="1.5">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <circle cx="8.5" cy="10" r="1.5" fill="#b5ae9f" stroke="none" />
                    <path d="M3 16l5-5 3 3 4-4 6 6" />
                  </svg>
                  <span className="text-xs font-medium uppercase tracking-wide" style={{ color: '#9a9285' }}>
                    No image
                  </span>
                </div>
              )}
            </div>

            {/* Description — guests see a short teaser only */}
            {guest ? (
              <>
                <p className="text-sm text-gray-700 leading-relaxed m-0 mb-5">
                  {plainTextPreview(breed.description, GUEST_DESC_CHARS)
                    || t('livestock_breed.preview_fallback', 'Breed overview is available to members.')}
                </p>
                <GuestAccessPrompt
                  title={t('guest_access.kb_detail_title', 'Sign in for the full breed profile')}
                  message={t(
                    'guest_access.kb_detail',
                    'Create a free account or sign in to read the complete breed description, characteristics, and farming uses.',
                  )}
                />
              </>
            ) : (
              <div
                className="text-sm text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: breed.description || '<p>No description available.</p>' }}
              />
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
