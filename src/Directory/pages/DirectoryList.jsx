import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from '../../lib/i18n';
import { API_ENDPOINTS } from '../config';
import { DIRECTORY_CATEGORIES, directoryTitleKey } from '../../lib/directoryCategories';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import Breadcrumbs from '../../components/Breadcrumbs';
import KnowledgebaseLandingHero from '../../components/KnowledgebaseLandingHero';

const EAGER_COUNT = 4;

export default function DirectoryList() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('');

  const CATEGORIES = useMemo(
    () =>
      DIRECTORY_CATEGORIES.map((c) => ({
        ...c,
        title: t(directoryTitleKey(c.slug), c.label),
        desc: t(`directory_list.cat_${c.slug.replace(/-/g, '_')}_desc`),
      })),
    [t]
  );

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return CATEGORIES;
    return CATEGORIES.filter(
      (cat) =>
        cat.title?.toLowerCase().includes(q) ||
        cat.desc?.toLowerCase().includes(q) ||
        cat.slug.includes(q)
    );
  }, [CATEGORIES, filter]);

  // Business-name search. The tile filter above only ever matched the 29
  // category names, so a real business name found nothing.
  const [businesses, setBusinesses] = useState([]);
  const [bizTotal, setBizTotal] = useState(0);
  const [bizLoading, setBizLoading] = useState(false);

  useEffect(() => {
    const q = filter.trim();
    if (q.length < 2) {
      setBusinesses([]);
      setBizTotal(0);
      setBizLoading(false);
      return undefined;
    }
    let cancelled = false;
    setBizLoading(true);
    // Debounced so typing doesn't fire a request per keystroke.
    const timer = setTimeout(() => {
      fetch(`${API_ENDPOINTS.BUSINESS_SEARCH}?q=${encodeURIComponent(q)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (cancelled) return;
          setBusinesses(Array.isArray(data?.businesses) ? data.businesses : []);
          setBizTotal(data?.total || 0);
          setBizLoading(false);
        })
        .catch(() => {
          if (cancelled) return;
          setBusinesses([]);
          setBizTotal(0);
          setBizLoading(false);
        });
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [filter]);

  const searching = filter.trim().length >= 2;

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f7f2e8' }}>
      <PageMeta
        title="Farm & Food Business Directory | Find Local Farms & Producers"
        description="Find farms, food hubs, farmers markets, restaurants, processors, artisan producers, and more in our comprehensive farm and food business directory."
        keywords="farm directory, food business directory, local farms, farmers markets, food hubs, restaurants, artisan producers, agricultural businesses, farm listings"
        canonical="https://livestockofamerica.com/directory"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Farm & Food Business Directory',
          description: 'Comprehensive directory of farms, food producers, markets, and agricultural businesses.',
          url: 'https://livestockofamerica.com/directory',
        }}
      />
      <Header />

      <div className="mx-auto px-4 pt-2 md:pt-6" style={{ maxWidth: '1300px' }}>
        <Breadcrumbs items={[
          { label: t('directory_list.breadcrumb_home'), to: '/' },
          { label: t('directory_list.breadcrumb_directory') },
        ]} />

        <KnowledgebaseLandingHero
          image="/images/KBHeroDirectory.webp"
          alt="The Food System Directory"
          title="The Food System Directory"
          description="Find what you're looking for across 29 categories — from farms and food hubs to restaurants, fiber mills, and more. Search and connect with local farms, food businesses, and organizations in your area."
          stats={[
            { value: '4,085', label: 'Documented Varieties' },
            { value: String(DIRECTORY_CATEGORIES.length), label: 'Core Classifications' },
            { value: '24', label: 'New Entries This Month' },
          ]}
          searchPlaceholder="Search producers, mills, or markets..."
          searchValue={filter}
          onSearchChange={setFilter}
        />
      </div>

      <div className="mx-auto px-4 py-8" style={{ maxWidth: '1300px' }}>
        {searching && (
          <section className="mb-10">
            <h2
              className="text-xl md:text-2xl font-bold mb-1"
              style={{ fontFamily: "'Lora','Times New Roman',serif", color: '#3D6B34' }}
            >
              Businesses
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              {bizLoading
                ? 'Searching…'
                : bizTotal === 0
                  ? `No businesses match “${filter.trim()}”.`
                  : `${bizTotal.toLocaleString()} business${bizTotal === 1 ? '' : 'es'} matching “${filter.trim()}”` +
                    (businesses.length < bizTotal ? ` — showing first ${businesses.length.toLocaleString()}` : '')}
            </p>

            {!bizLoading && businesses.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {businesses.map((b) => (
                  <Link
                    key={b.BusinessID}
                    to={`/directory/business/${b.BusinessID}`}
                    className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-3 no-underline hover:shadow-md hover:border-[#819360] transition-all duration-200"
                  >
                    <div
                      className="shrink-0 rounded-lg overflow-hidden bg-[#efe9df] flex items-center justify-center"
                      style={{ width: '48px', height: '48px' }}
                    >
                      {b.ProfileImage ? (
                        <img
                          src={b.ProfileImage}
                          alt={`${b.BusinessName} logo`}
                          loading="lazy"
                          className="w-full h-full object-contain"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <span className="text-sm font-bold" style={{ color: '#b5ae9f' }}>
                          {(b.BusinessName || '?').trim().charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="m-0 font-bold text-sm truncate" style={{ color: '#3D6B34' }}>
                        {b.BusinessName}
                      </p>
                      <p className="m-0 text-[11px] text-gray-500 truncate">
                        {[b.BusinessType, [b.AddressCity, b.AddressState].filter(Boolean).join(', ')]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        <h2
          className="text-xl md:text-2xl font-bold mb-5"
          style={{ fontFamily: "'Lora','Times New Roman',serif", color: '#3D6B34' }}
        >
          {searching ? 'Categories' : t('directory_list.section_heading')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((cat, index) => (
            <div
              key={cat.slug}
              className="flex bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md hover:border-[#819360] transition-all duration-200"
            >
              <Link to={`/directory/${cat.slug}`} className="shrink-0 overflow-hidden" style={{ width: '155px', height: '155px' }}>
                <img
                  src={cat.img}
                  alt={cat.title}
                  width="155"
                  height="155"
                  loading={index < EAGER_COUNT ? 'eager' : 'lazy'}
                  decoding={index < EAGER_COUNT ? 'sync' : 'async'}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  onError={(e) => { e.target.src = '/images/DirectoryHome.webp'; }}
                />
              </Link>

              <div className="flex flex-col justify-between px-5 py-4 flex-1 min-w-0">
                <div>
                  <Link
                    to={`/directory/${cat.slug}`}
                    className="font-bold text-sm hover:underline"
                    style={{ color: '#3D6B34' }}
                  >
                    {cat.title}
                  </Link>
                  <p className="text-xs text-gray-600 leading-relaxed mt-1">{cat.desc}</p>
                </div>
                <div className="mt-3">
                  <Link
                    to={`/directory/${cat.slug}`}
                    className="text-xs font-bold hover:underline"
                    style={{ color: '#3D6B34' }}
                  >
                    {t('directory_list.btn_explore')}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
            No directory categories match your search.
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
