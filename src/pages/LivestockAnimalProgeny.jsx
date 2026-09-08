// Ported from Oatmeal Farm Network (src/LivestockAnimalProgeny.jsx). Page logic is unchanged;
// router package, i18n hook, component paths, API base env var and the
// people-id accessor differ, as in the other ported pages.
// src/LivestockAnimalProgeny.jsx
// Public progeny list — /marketplaces/livestock/animal/:id/progeny
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { useTranslation } from '../lib/i18n';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';

const API_URL = import.meta.env.VITE_LIVESTOCK_API_URL || '';

function formatDOB(year, month, day) {
  const parts = [];
  if (month && String(month) !== '0') parts.push(String(month).padStart(2, '0'));
  if (day   && String(day)   !== '0') parts.push(String(day).padStart(2, '0'));
  if (year  && String(year)  !== '0') parts.push(String(year));
  return parts.join('/') || null;
}

export default function LivestockAnimalProgeny() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    setNotFound(false);
    fetch(`${API_URL}/api/marketplace/animal/${id}/progeny`)
      .then(r => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json();
      })
      .then(d => { if (d) setData(d); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f7f2e8' }}>
      <Header />
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-[#3D6B34] border-t-transparent rounded-full animate-spin" />
      </div>
      <Footer />
    </div>
  );

  if (notFound || !data) return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f7f2e8' }}>
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">{t('livestock_progeny.not_found')}</h1>
        <Link to="/marketplaces/livestock" className="text-sm font-bold" style={{ color: '#3D6B34' }}>
          {t('livestock_progeny.back_to_marketplace')}
        </Link>
      </div>
      <Footer />
    </div>
  );

  const { parent_id, parent_name, progeny = [] } = data;

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f7f2e8' }}>
      <PageMeta
        title={t('livestock_progeny.meta_title', { name: parent_name })}
        description={t('livestock_progeny.meta_desc', { name: parent_name })}
        keywords={t('livestock_progeny.meta_keywords', { name: parent_name })}
        canonical={`https://livestockofamerica.com/marketplaces/livestock/animal/${parent_id}/progeny`}
      />
      <Header />

      <div className="mx-auto px-4 py-6" style={{ maxWidth: '1200px' }}>
        <Breadcrumbs items={[
          { label: t('livestock_progeny.crumb_home'), to: '/' },
          { label: t('livestock_progeny.crumb_marketplaces'), to: '/marketplaces' },
          { label: t('livestock_progeny.crumb_livestock'), to: '/marketplaces/livestock' },
          { label: parent_name, to: `/marketplaces/livestock/animal/${parent_id}` },
          { label: t('livestock_progeny.crumb_progeny') },
        ]} />

        <h1 className="text-2xl font-bold mb-1" style={{ color: '#3D6B34' }}>
          {t('livestock_progeny.heading', { name: parent_name })}
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          {progeny.length === 0
            ? t('livestock_progeny.empty')
            : t('livestock_progeny.count', { count: progeny.length })}
        </p>

        {progeny.length > 0 && (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {progeny.map(p => {
              const dob = formatDOB(p.dob_year, p.dob_month, p.dob_day);
              return (
                <Link
                  key={p.animal_id}
                  to={`/marketplaces/livestock/animal/${p.animal_id}`}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div style={{
                    aspectRatio: '1',
                    background: '#faf7f4',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                  }}>
                    {p.photo ? (
                      <img src={p.photo} alt={p.full_name}
                           style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                           onError={e => { e.target.style.display = 'none'; }} />
                    ) : (
                      <span style={{ color: '#c8bfb5', fontSize: 40 }}>🐾</span>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="font-bold text-sm" style={{ color: '#3D6B34' }}>
                      {p.full_name}
                    </div>
                    {p.colors && (
                      <div className="text-xs text-gray-600 mt-1">{p.colors}</div>
                    )}
                    {dob && (
                      <div className="text-xs text-gray-500 mt-1">{t('livestock_progeny.dob', { dob })}</div>
                    )}
                    {p.category && (
                      <div className="text-xs text-gray-500 mt-1">{p.category}</div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-8">
          <Link to={`/marketplaces/livestock/animal/${parent_id}`}
                className="text-sm font-bold" style={{ color: '#3D6B34' }}>
            {t('livestock_progeny.back_to_parent', { name: parent_name })}
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
