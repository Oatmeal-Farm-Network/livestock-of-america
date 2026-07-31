import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';
import { useLanguage } from '../lib/LanguageContext';

const API_URL = import.meta.env.VITE_OFN_API_URL || import.meta.env.VITE_LIVESTOCK_API_URL || '';

const na = v => (v === null || v === undefined || v === '') ? 'N/A' : v;

function DetailItem({ label, value, description, impact }) {
  const { t } = useTranslation();
  return (
    <li className="mb-4 text-center">
      <div className="text-sm text-gray-800">
        <strong>{label}:</strong> {na(value)}
      </div>
      {description && description !== 'N/A' && (
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      )}
      {impact && impact !== 'N/A' && (
        <p className="text-xs text-gray-500 italic mt-1"><em>{t('plant_varietal_detail.impact_prefix')}</em> {impact}</p>
      )}
    </li>
  );
}

export default function PlantVarietalDetail() {
  const { t } = useTranslation();
  const { varietyId } = useParams();
  const { language } = useLanguage();
  const [detail, setDetail] = useState(null);
  const [nutrients, setNutrients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsLoggedIn(Boolean(token));

    fetch(`${API_URL}/api/plant-knowledgebase/varietal-detail/${varietyId}?lang=${language}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setDetail(data);
          setNutrients(data.nutrients || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [varietyId, language]);

  if (loading) return (
    <div className="min-h-screen font-sans">
      <Header />
      <div className="text-center py-20 text-gray-400">{t('plant_varietal_detail.loading')}</div>
      <Footer />
    </div>
  );

  if (!detail) return (
    <div className="min-h-screen font-sans">
      <Header />
      <div className="text-center py-20 text-gray-500">{t('plant_varietal_detail.not_found')}</div>
      <Footer />
    </div>
  );

  const waterDisplay = (detail.water_min == null || detail.water_max == null)
    ? 'N/A'
    : t('plant_varietal_detail.water_per_week', { min: detail.water_min, max: detail.water_max });

  const zone = detail.zone
    ? `${detail.zone}${detail.temp_start != null ? ` (Min: ${detail.temp_start}°F, Max: ${detail.temp_end}°F)` : ''}`
    : 'N/A';

  return (
    <div className="min-h-screen font-sans">
      <PageMeta
        title={`${detail.plant_variety_name} | ${detail.plant_name} Varietal`}
        description={detail.plant_variety_description
          ? detail.plant_variety_description.slice(0, 155)
          : `Detailed growing information for ${detail.plant_variety_name}, a variety of ${detail.plant_name}. Includes soil, water, pH, nutrient, and climate requirements.`}
        keywords={`${detail.plant_variety_name}, ${detail.plant_name}, ${detail.plant_name} variety, growing guide, soil requirements, nutrient profile`}
        canonical={`https://livestockofamerica.com/plant-knowledgebase/varietal-detail/${varietyId}`}
        ogType="article"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: `${detail.plant_variety_name} (${detail.plant_name})`,
          description: detail.plant_variety_description || `Growing information for ${detail.plant_variety_name}.`,
          mainEntityOfPage: `https://livestockofamerica.com/plant-knowledgebase/varietal-detail/${varietyId}`,
        }}
      />
     <Header />

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>
        <Breadcrumbs items={[
          { label: 'Home', to: '/' },
          { label: 'Knowledgebases', to: '/knowledgebase' },
          { label: 'Plant Knowledgebase', to: '/plant-knowledgebase' },
          { label: detail.plant_name, to: `/plant-knowledgebase/varietals/${detail.plant_id || ''}` },
          { label: detail.plant_variety_name },
        ]} />

        {/* Variety title + plant name + description */}
        <h1 className="font-bold text-gray-900 mb-1" style={{ fontSize: '2rem' }}>
          {detail.plant_variety_name}
        </h1>
        <p className="text-gray-600 text-sm mb-1">{detail.plant_name}</p>
        <p className="text-gray-700 mb-6">{detail.plant_variety_description}</p>

        {/* Two column cards: Growing Environment + Nutrient Profile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Growing Environment */}
          <div className="rounded border border-gray-200 p-6 shadow-sm bg-white">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{t('plant_varietal_detail.growing_env_heading')}</h2>
            <ul className="list-none p-0 m-0">
              <DetailItem
                label={t('plant_varietal_detail.label_soil_texture')}
                value={detail.soil_texture}
                description={detail.soil_texture_description}
              />
              <DetailItem
                label={t('plant_varietal_detail.label_ph_range')}
                value={detail.ph_range}
                description={detail.ph_range_description}
              />
              <DetailItem
                label={t('plant_varietal_detail.label_organic_matter')}
                value={detail.organic_matter}
                description={detail.organic_matter_description}
              />
              <DetailItem
                label={t('plant_varietal_detail.label_salinity_level')}
                value={detail.salinity_level ? `${detail.salinity_level} (${na(detail.salinity_classification)})` : null}
                description={detail.salinity_description}
                impact={detail.salinity_impact}
              />
              <DetailItem label={t('plant_varietal_detail.label_hardiness_zone')} value={zone} />
              <DetailItem
                label={t('plant_varietal_detail.label_humidity')}
                value={detail.humidity_classification}
                description={detail.humidity_description}
                impact={detail.humidity_impact}
              />
              <DetailItem label={t('plant_varietal_detail.label_water_req')} value={waterDisplay} />
            </ul>
          </div>

          {/* Nutrient Profile */}
          <div className="rounded border border-gray-200 p-6 shadow-sm bg-white">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{t('plant_varietal_detail.nutrient_heading')}</h2>
            {nutrients.length === 0 ? (
              <p className="text-sm text-gray-400">{t('plant_varietal_detail.no_nutrients')}</p>
            ) : (
              <ul className="list-none p-0 m-0">
                {nutrients.map((n, i) => (
                  <li key={i} className="mb-4">
                    <div className="text-sm text-gray-800">
                      <strong>{n.nutrient_name}</strong>
                      {(n.nutrient_low != null || n.nutrient_high != null) && (
                        <span className="text-gray-500 ml-1">({na(n.nutrient_low)} - {na(n.nutrient_high)})</span>
                      )}
                    </div>
                    {n.description && <p className="text-xs text-gray-500 mt-1">{n.description}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}
