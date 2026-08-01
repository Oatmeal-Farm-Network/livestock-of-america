import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';
import { useLanguage } from '../lib/LanguageContext';

const API_URL = import.meta.env.VITE_LIVESTOCK_API_URL || '';
const PLACEHOLDER_IMAGE = '/images/MissingLivestockImage.webp';

export default function LivestockBreed() {
  const { t } = useTranslation();
  const { species, breedId } = useParams();
  const { language } = useLanguage();
  const [breed, setBreed] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
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
    : PLACEHOLDER_IMAGE;

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
          { label: 'Knowledgebases', to: '/knowledgebase' },
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
            {/* Floated breed image */}
            <div className="float-right ml-6 mb-4" style={{ maxWidth: '300px' }}>
              <img
                src={breedImgUrl}
                alt={breed.breed || 'Breed'}
                loading="eager"
                className="w-full rounded-xl shadow-sm"
                onError={(e) => {
                  if (e.target.dataset.fallback === '1') return;
                  e.target.dataset.fallback = '1';
                  e.target.src = PLACEHOLDER_IMAGE;
                }}
              />
              {breed.image_caption && (
                <p
                  className="text-xs text-gray-500 mt-2 text-center"
                  dangerouslySetInnerHTML={{ __html: breed.image_caption }}
                />
              )}
            </div>

            {/* Description */}
            <div
              className="text-sm text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: breed.description || '<p>No description available.</p>' }}
            />
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
