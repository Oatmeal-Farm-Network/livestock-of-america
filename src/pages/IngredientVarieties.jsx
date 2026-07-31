import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';

const API_URL = import.meta.env.VITE_OFN_API_URL || import.meta.env.VITE_LIVESTOCK_API_URL || '';

export default function IngredientVarieties() {
  const { t } = useTranslation();
  const { category, ingredientId } = useParams();
  const [ingredientName, setIngredientName] = useState('');
  const [varieties, setVarieties] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsLoggedIn(Boolean(token));

    fetch(API_URL + '/api/ingredient-knowledgebase/varieties/' + ingredientId)
      .then(r => r.json())
      .then(data => {
        setIngredientName(data.ingredient_name || '');
        setVarieties(Array.isArray(data.varieties) ? data.varieties : []);
      })
      .catch(() => setVarieties([]));
  }, [ingredientId]);

  return (
    <div className="min-h-screen font-sans">
      <PageMeta
        title={ingredientName ? `${ingredientName} Varieties | Ingredient Knowledgebase` : 'Ingredient Varieties | Ingredient Knowledgebase'}
        description={ingredientName ? `Browse all known varieties of ${ingredientName} including flavor profiles, sourcing information, and nutritional data.` : 'Browse ingredient varieties in the Livestock of America knowledgebase.'}
        keywords={ingredientName ? `${ingredientName} varieties, ${ingredientName} types, ingredient varieties, ingredient knowledgebase` : 'ingredient varieties'}
        canonical={`https://livestockofamerica.com/ingredient-knowledgebase/${category}/varieties/${ingredientId}`}
      />
     <Header />

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem 1rem 3rem' }}>
        <Breadcrumbs items={[
          { label: 'Home', to: '/' },
          { label: 'Knowledgebases', to: '/knowledgebase' },
          { label: 'Ingredient Knowledgebase', to: '/ingredient-knowledgebase' },
          { label: category ? category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '', to: `/ingredient-knowledgebase/${category}` },
          { label: ingredientName ? `${ingredientName} Varieties` : 'Varieties' },
        ]} />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{ingredientName} {t('ingredient_vars.varieties_suffix')}</h1>
        <p className="text-gray-700 mb-6">
          {t('ingredient_vars.intro', { name: ingredientName })}
        </p>

        {varieties === null ? (
          <div className="text-gray-400 py-12 text-center">{t('ingredient_vars.loading')}</div>
        ) : varieties.length === 0 ? (
          <div className="text-gray-500 py-8 text-center">{t('ingredient_vars.not_found', { name: ingredientName })}</div>
        ) : (
          <div className="overflow-x-auto rounded border border-gray-200 shadow-sm">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 text-left border-b border-gray-200">{t('ingredient_vars.col_name')}</th>
                  <th className="px-4 py-3 text-left border-b border-gray-200">{t('ingredient_vars.col_description')}</th>
                </tr>
              </thead>
              <tbody>
                {varieties.map((v, i) => (
                  <tr key={v.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 border-b border-gray-100">
                      {v.nutrient_count > 0 ? (
                        <Link
                          to={'/ingredient-knowledgebase/' + category + '/variety-detail/' + v.id}
                          className="hover:underline"
                          style={{ color: '#3D6B34' }}
                        >
                          {v.name}
                        </Link>
                      ) : (
                        <span className="text-gray-800">{v.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 text-gray-700">{v.description}</td>
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
