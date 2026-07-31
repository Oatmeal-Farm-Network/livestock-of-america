import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';
import { useLanguage } from '../lib/LanguageContext';

const API_URL = import.meta.env.VITE_OFN_API_URL || import.meta.env.VITE_LIVESTOCK_API_URL || '';

export default function PlantVarietals() {
  const { t } = useTranslation();
  const { plantId } = useParams();
  const { language } = useLanguage();
  const [plantName, setPlantName] = useState('');
  const [varietals, setVarietals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsLoggedIn(Boolean(token));

    fetch(`${API_URL}/api/plant-knowledgebase/varietals/${plantId}?lang=${language}`)
      .then(r => r.ok ? r.json() : { plant_name: '', varietals: [] })
      .then(data => {
        setPlantName(data.plant_name || '');
        setVarietals(data.varietals || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [plantId, language]);

  const na = v => (v === null || v === undefined || v === '') ? 'N/A' : v;
  const water = (min, max) => (min == null || max == null) ? 'N/A' : `${min} - ${max}`;

  return (
    <div className="min-h-screen font-sans">
      <PageMeta
        title={plantName ? `${plantName} Varietals | Plant Knowledgebase` : 'Plant Varietals | Plant Knowledgebase'}
        description={plantName ? `Browse all known varietals of ${plantName} including growing requirements, soil preferences, water needs, and nutritional profiles.` : 'Browse plant varietals in the Livestock of America plant knowledgebase.'}
        keywords={plantName ? `${plantName} varietals, ${plantName} varieties, ${plantName} growing guide, plant database` : 'plant varietals'}
        canonical={`https://livestockofamerica.com/plant-knowledgebase/varietals/${plantId}`}
      />
     <Header />

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem 1rem 3rem' }}>
        <Breadcrumbs items={[
          { label: 'Home', to: '/' },
          { label: 'Knowledgebases', to: '/knowledgebase' },
          { label: 'Plant Knowledgebase', to: '/plant-knowledgebase' },
          { label: plantName ? `${plantName} Varietals` : 'Varietals' },
        ]} />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{plantName} {t('plant_varietals.varietals_suffix')}</h1>
        <p className="text-gray-700 mb-6">
          {t('plant_varietals.intro', { name: plantName })}
        </p>

        {loading ? (
          <div className="text-gray-400 py-12 text-center">{t('plant_varietals.loading')}</div>
        ) : varietals.length === 0 ? (
          <div className="text-gray-500 py-8 text-center">{t('plant_varietals.not_found', { name: plantName })}</div>
        ) : (
          <div className="overflow-x-auto rounded border border-gray-200 shadow-sm">
            <table className="w-full text-sm border-collapse" style={{ minWidth: '800px' }}>
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 text-left border-b border-gray-200">{t('plant_varietals.col_varietal_name')}</th>
                  <th className="px-4 py-3 text-left border-b border-gray-200">{t('plant_varietals.col_description')}</th>
                  <th className="px-4 py-3 text-left border-b border-gray-200">{t('plant_varietals.col_soil_texture')}</th>
                  <th className="px-4 py-3 text-left border-b border-gray-200">{t('plant_varietals.col_ph_range')}</th>
                  <th className="px-4 py-3 text-left border-b border-gray-200">{t('plant_varietals.col_organic_matter')}</th>
                  <th className="px-4 py-3 text-left border-b border-gray-200">{t('plant_varietals.col_salinity_level')}</th>
                  <th className="px-4 py-3 text-left border-b border-gray-200">{t('plant_varietals.col_hardiness_zone')}</th>
                  <th className="px-4 py-3 text-left border-b border-gray-200">{t('plant_varietals.col_humidity')}</th>
                  <th className="px-4 py-3 text-left border-b border-gray-200">{t('plant_varietals.col_water')}</th>
                  <th className="px-4 py-3 text-left border-b border-gray-200">{t('plant_varietals.col_primary_nutrient')}</th>
                </tr>
              </thead>
              <tbody>
                {varietals.map((v, i) => (
                  <tr key={v.plant_variety_id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 border-b border-gray-100">
                      <Link
                        to={`/plant-knowledgebase/varietal-detail/${v.plant_variety_id}`}
                        className="hover:underline"
                        style={{ color: '#3D6B34' }}
                      >
                        {v.plant_variety_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 text-gray-700" style={{ maxWidth: '220px' }}>
                      {na(v.plant_variety_description)}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 text-gray-700">{na(v.soil_texture)}</td>
                    <td className="px-4 py-3 border-b border-gray-100 text-gray-700">{na(v.ph_range)}</td>
                    <td className="px-4 py-3 border-b border-gray-100 text-gray-700">{na(v.organic_matter)}</td>
                    <td className="px-4 py-3 border-b border-gray-100 text-gray-700">{na(v.salinity_level)}</td>
                    <td className="px-4 py-3 border-b border-gray-100 text-gray-700">{na(v.zone)}</td>
                    <td className="px-4 py-3 border-b border-gray-100 text-gray-700">{na(v.humidity)}</td>
                    <td className="px-4 py-3 border-b border-gray-100 text-gray-700">{water(v.water_min, v.water_max)}</td>
                    <td className="px-4 py-3 border-b border-gray-100 text-gray-700">{na(v.primary_nutrient)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
