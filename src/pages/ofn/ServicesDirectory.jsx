// Ported from Oatmeal Farm Network (src/ServicesDirectory.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useTranslation } from '../../lib/i18n';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import Breadcrumbs from '../../components/Breadcrumbs';

const API = import.meta.env.VITE_LIVESTOCK_API_URL || '';
const FALLBACK_IMG = '/images/Services.webp';
const EAGER_COUNT = 4;

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const CATEGORY_IMAGES = {
  [norm('Agricultural Production')]:          '/images/AgriculturalServices.webp',
  [norm('Animal Services')]:                  '/images/Animalservices.webp',
  [norm('Artisan & Crafting Services')]:      '/images/Artisan&CraftingServices.webp',
  [norm('Baking & Pastry')]:                  '/images/BakingService.webp',
  [norm('Beverage Production')]:              '/images/BeverageProductions.webp',
  [norm('Community Building & Advocacy')]:    '/images/CommunityBuilding&Advocacy.webp',
  [norm('Education')]:                        '/images/EducationServices.webp',
  [norm('Entertainment')]:                    '/images/EntertainmentServices.webp',
  [norm('Environmental & Conservation Services')]: '/images/Environmental&ConcervationServices.webp',
  [norm('Fiber & Textile Arts')]:             '/images/FiberArts.webp',
  [norm('Food Production & Processing')]:     '/images/FoodProduction&Processsing.webp',
  [norm('Ghost Kitchens & Delivery-Only')]:   '/images/GhostKitchen.webp',
  [norm('Industrial & Manufacturing Support')]: '/images/Manufacturing.webp',
  [norm('Hospitality & Dining')]:             '/images/Hospitality&Dining.webp',
  [norm('Logistics & Distribution')]:         '/images/Logistics&Distribution.webp',
  [norm('Marketing and Sales')]:              '/images/Marketing&Sales.webp',
  [norm('Medical')]:                          '/images/MedicalServices.webp',
  [norm('Planning & Management')]:            '/images/FarmManagement.webp',
  [norm('Real Estate & Land Management')]:    '/images/RealEstate.webp',
  [norm('Retail & Wholesale')]:               '/images/Retail&Wholesale.webp',
  [norm('Specialty Support Services')]:       '/images/SpecialtySupportServices.webp',
};

const imgForCategory = (name) => CATEGORY_IMAGES[norm(name)] || FALLBACK_IMG;

// Each category page gets its own hero. Keyed by id, not name, because the id
// is in the URL from the first render while the name only arrives with the
// categories fetch -- keying by name would load the shared hero first and swap,
// which is the worst thing to do to an eager, high-priority LCP image.
const HERO_DEFAULT = '/images/ServiceDirectory.webp';
const heroForCategory = (id) =>
  (id ? `/images/service-heroes/${id}.webp` : HERO_DEFAULT);

const DEFAULT_LEAD = 'From veterinarians and farriers to shearing, equipment rental, and farm consulting — connect with agricultural professionals serving farms and ranches.';

const CATEGORY_LEADS = {
  [norm('Agricultural Production')]:          'Crop growers, livestock producers, orchard and greenhouse operators — the farms and ranches producing food and fiber at the source.',
  [norm('Animal Services')]:                  'Veterinarians, farriers, shearers, trainers, breeders, and livestock handlers serving every species on the farm.',
  [norm('Artisan & Crafting Services')]:      'Hand-makers and craftspeople — woodworkers, leatherworkers, potters, blacksmiths, and other skilled artisans producing one-of-a-kind work.',
  [norm('Baking & Pastry')]:                  'Bakers, pastry chefs, and custom-cake makers supplying bread, pies, desserts, and other baked goods to homes, markets, and events.',
  [norm('Beverage Production')]:              'Breweries, wineries, cideries, distilleries, roasters, and other beverage makers crafting drinks from farm-grown ingredients.',
  [norm('Community Building & Advocacy')]:    'Associations, cooperatives, nonprofits, and organizers strengthening the agricultural community through events, education, and advocacy.',
  [norm('Education')]:                        'Instructors, workshops, clinics, and programs teaching farming, livestock husbandry, food production, and agricultural skills.',
  [norm('Entertainment')]:                    'Agritainment venues, event hosts, petting zoos, and farm-based entertainment bringing visitors onto the farm.',
  [norm('Environmental & Conservation Services')]: 'Conservationists, land stewards, and environmental specialists focused on soil health, water, wildlife, and sustainable land use.',
  [norm('Fiber & Textile Arts')]:             'Spinners, weavers, dyers, knitters, and fiber processors turning raw wool, alpaca, and other fibers into finished textiles.',
  [norm('Food Production & Processing')]:     'Butchers, millers, canners, cheesemakers, and processors turning raw farm products into shelf-ready food.',
  [norm('Ghost Kitchens & Delivery-Only')]:   'Delivery-only kitchens and virtual food brands preparing meals from farm-sourced ingredients for pickup or doorstep delivery.',
  [norm('Hospitality & Dining')]:             'Farm-to-table restaurants, farm stays, bed & breakfasts, and hospitality venues rooted in the agricultural community.',
  [norm('Industrial & Manufacturing Support')]: 'Fabricators, equipment manufacturers, and industrial suppliers building and maintaining the tools and infrastructure farms depend on.',
  [norm('Logistics & Distribution')]:         'Trucking, cold-chain, warehousing, and distribution services moving farm products from field to market.',
  [norm('Marketing and Sales')]:              'Photographers, designers, copywriters, web builders, and sales specialists helping farms reach and grow their customer base.',
  [norm('Medical')]:                          'Human medical, dental, and wellness services — health professionals serving rural communities and farm workers.',
  [norm('Planning & Management')]:            'Consultants, farm managers, bookkeepers, and planning specialists helping agricultural operations run and scale.',
  [norm('Real Estate & Land Management')]:    'Land brokers, farm realtors, surveyors, and property managers specializing in agricultural real estate and working land.',
  [norm('Retail & Wholesale')]:               'Farm stores, co-ops, distributors, and wholesalers moving farm products through retail and wholesale channels.',
  [norm('Specialty Support Services')]:       'Specialized providers — niche services and one-of-a-kind support roles that fill unique needs across the farm economy.',
};

const leadForCategory = (name, t) => {
  if (t) {
    const key = 'services_dir.lead_' + norm(name);
    const translated = t(key, CATEGORY_LEADS[norm(name)] || DEFAULT_LEAD);
    return translated;
  }
  return CATEGORY_LEADS[norm(name)] || DEFAULT_LEAD;
};

export default function ServicesDirectory() {
  const { t } = useTranslation();
  const { categoryId } = useParams();

  const [categories,    setCategories]    = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [services,      setServices]      = useState([]);
  const [catName,       setCatName]       = useState('');
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [subcatId,      setSubcatId]      = useState('');

  useEffect(() => {
    fetch(`${API}/api/services/categories`)
      .then(r => r.json())
      .then(d => setCategories(Array.isArray(d) ? d : []))
      .catch(() => {});
    fetch(`${API}/api/services/subcategories/all`)
      .then(r => r.json())
      .then(d => setSubcategories(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  useEffect(() => { setSubcatId(''); setSearch(''); }, [categoryId]);

  const filtersActive = !!(search.trim() || subcatId);

  useEffect(() => {
    if (!categoryId && !filtersActive) { setServices([]); setLoading(false); return; }
    setLoading(true);
    const params = new URLSearchParams();
    if (categoryId) params.set('category_id', categoryId);
    if (subcatId) params.set('subcategory_id', subcatId);
    if (search.trim()) params.set('q', search.trim());
    fetch(`${API}/api/services/public?${params.toString()}`)
      .then(r => r.json())
      .then(d => { setServices(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => { setServices([]); setLoading(false); });
  }, [categoryId, subcatId, search, filtersActive]);

  const visibleSubcats = (categoryId
    ? subcategories.filter(s => String(s.ServiceCategoryID) === String(categoryId))
    : subcategories.slice()
  ).sort((a, b) => {
    if (!categoryId) {
      const catCmp = String(a.ServicesCategory || '').localeCompare(String(b.ServicesCategory || ''));
      if (catCmp !== 0) return catCmp;
    }
    return String(a.ServiceSubCategoryName || '').localeCompare(String(b.ServiceSubCategoryName || ''));
  });

  useEffect(() => {
    if (categoryId && categories.length) {
      const cat = categories.find(c => String(c.ServiceCategoryID) === String(categoryId));
      setCatName(cat?.ServicesCategory || '');
    } else {
      setCatName('');
    }
  }, [categoryId, categories]);

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: '#f7f2e8' }}>
      <PageMeta
        title={catName ? `${catName} Services | Agricultural Services Directory` : 'Agricultural Services Directory | Find Farm Services'}
        description={catName
          ? `Find ${catName.toLowerCase()} services from farmers, ranchers, and agricultural professionals on Livestock Of America.`
          : 'Find agricultural services including veterinary care, farm consulting, equipment rental, shearing, farriery, and more. Browse service providers near you.'}
        keywords={catName
          ? `${catName}, ${catName} services, farm services, agricultural ${catName.toLowerCase()}, service providers`
          : 'agricultural services, farm services, veterinary, farriery, shearing, farm consulting, equipment rental, livestock services'}
        canonical={categoryId
          ? `https://livestockofamerica.com/services/directory/${categoryId}`
          : 'https://livestockofamerica.com/services/directory'}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: catName ? `${catName} Services` : 'Agricultural Services Directory',
            description: 'Browse farm and agricultural services by category.',
            url: categoryId
              ? `https://livestockofamerica.com/services/directory/${categoryId}`
              : 'https://livestockofamerica.com/services/directory',
          },
          !categoryId && categories.length > 0 ? {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            url: 'https://livestockofamerica.com/services/directory',
            itemListElement: categories.slice(0, 20).map((c, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              url: `https://livestockofamerica.com/services/directory/${c.ServiceCategoryID}`,
              name: c.ServicesCategory,
            })),
          } : null,
          categoryId && services.length > 0 ? {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            url: `https://livestockofamerica.com/services/directory/${categoryId}`,
            itemListElement: services.slice(0, 10).map((s, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              url: `https://livestockofamerica.com/services/public/${s.ServicesID}`,
              name: s.ServiceTitle,
            })),
          } : null,
        ].filter(Boolean)}
      />
      <Header />

      {/* ── Hero ── */}
      <div className="mx-auto px-4 pt-2 md:pt-6 w-full" style={{ maxWidth: '1300px' }}>
        <Breadcrumbs items={[
          { label: 'Home', to: '/' },
          { label: 'Services Directory', to: categoryId ? '/services/directory' : undefined },
          ...(catName ? [{ label: catName }] : []),
        ]} />

        <div className="relative w-full overflow-hidden rounded-xl rounded-b-none md:rounded-b-xl">
          <img
            key={categoryId || 'all'}
            src={heroForCategory(categoryId)}
            alt={catName ? t('services_dir.hero_alt_category', { category: catName }) : t('services_dir.hero_alt')}
            onError={e => { e.target.onerror = null; e.target.src = HERO_DEFAULT; }}
            className="w-full object-cover block h-[160px] md:h-[250px]"
            loading="eager"
            fetchPriority="high"
            width="1300"
            height="250"
          />
          <div className="hidden md:block absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.72) 45%, rgba(255,255,255,0) 75%)' }} />
          <div className="hidden md:flex absolute inset-0 flex-col justify-center px-8 py-6" style={{ maxWidth: '780px' }}>
            <h1 style={{ color: '#000000', fontFamily: "'Lora','Times New Roman',serif", fontSize: '2rem', fontWeight: 'bold', margin: '0 0 12px', lineHeight: 1.2 }}>
              {catName || t('services_dir.title')}
            </h1>
            <p style={{ color: '#111111', fontSize: '0.92rem', margin: '0 0 8px', lineHeight: 1.6 }}>
              {catName ? (
                leadForCategory(catName, t)
              ) : (
                <>
                  {t('services_dir.hero_body_pre')}{' '}
                  <strong>{categories.length > 0 ? t('services_dir.cat_count', { count: categories.length }) : '…'}</strong>{' '}
                  {t('services_dir.hero_body_post')}
                </>
              )}
            </p>
            <p style={{ color: '#111111', fontSize: '0.92rem', margin: 0, lineHeight: 1.6 }}>
              {t('services_dir.listings_added')}{' '}
              <Link to="/contact-us" style={{ color: '#3D6B34', textDecoration: 'underline' }}>{t('services_dir.contact_us')}</Link>.
            </p>
          </div>
        </div>

        <div className="md:hidden bg-white px-5 py-4 rounded-b-xl border border-t-0 border-gray-200">
          <h1 style={{ color: '#000000', fontFamily: "'Lora','Times New Roman',serif", fontSize: '1.4rem', fontWeight: 'bold', margin: '0 0 8px', lineHeight: 1.2 }}>
            {catName || t('services_dir.title')}
          </h1>
          <p style={{ color: '#111111', fontSize: '0.85rem', margin: '0 0 6px', lineHeight: 1.6 }}>
            {catName ? (
              leadForCategory(catName, t)
            ) : (
              <>
                {t('services_dir.hero_body_pre')}{' '}
                <strong>{categories.length > 0 ? t('services_dir.cat_count_mobile', { count: categories.length }) : '…'}</strong>{' '}
                {t('services_dir.hero_body_post')}
              </>
            )}
          </p>
          <p style={{ color: '#111111', fontSize: '0.85rem', margin: 0, lineHeight: 1.6 }}>
            {t('services_dir.want_to_list')}{' '}
            <Link to="/contact-us" style={{ color: '#3D6B34', textDecoration: 'underline' }}>{t('services_dir.contact_us')}</Link>.
          </p>
        </div>
      </div>

      <div className="mx-auto px-4 py-8 w-full flex-grow" style={{ maxWidth: '1300px' }}>

        {/* ── Filter Bar ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('services_dir.search_placeholder')}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#819360]"
          />
          <select
            value={subcatId}
            onChange={e => setSubcatId(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#819360]"
          >
            <option value="">{t('services_dir.all_subcategories')}</option>
            {visibleSubcats.map(sc => (
              <option key={sc.ServiceSubCategoryID} value={sc.ServiceSubCategoryID}>
                {categoryId
                  ? sc.ServiceSubCategoryName
                  : `${sc.ServicesCategory || 'Uncategorized'} — ${sc.ServiceSubCategoryName}`}
              </option>
            ))}
          </select>
          {(search || subcatId) && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSubcatId(''); }}
              className="text-sm text-[#3D6B34] hover:underline px-2"
            >
              {t('services_dir.clear')}
            </button>
          )}
        </div>

        {!categoryId && !filtersActive ? (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-5">{t('services_dir.service_categories')}</h2>

            {categories.length === 0 ? (
              <div className="text-center py-20 text-gray-400">{t('services_dir.loading_categories')}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {categories.map((cat, index) => (
                  <div
                    key={cat.ServiceCategoryID}
                    className="flex bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md hover:border-[#819360] transition-all duration-200"
                  >
                    <Link
                      to={`/services/directory/${cat.ServiceCategoryID}`}
                      className="shrink-0 overflow-hidden"
                      style={{ width: '155px', height: '155px' }}
                    >
                      <img
                        src={imgForCategory(cat.ServicesCategory)}
                        alt={cat.ServicesCategory}
                        width="155"
                        height="155"
                        loading={index < EAGER_COUNT ? 'eager' : 'lazy'}
                        decoding={index < EAGER_COUNT ? 'sync' : 'async'}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        onError={e => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }}
                      />
                    </Link>

                    <div className="flex flex-col justify-between px-5 py-4 flex-1 min-w-0">
                      <div>
                        <Link
                          to={`/services/directory/${cat.ServiceCategoryID}`}
                          className="font-bold text-sm hover:underline"
                          style={{ color: '#3D6B34' }}
                        >
                          {cat.ServicesCategory}
                        </Link>
                        <p className="text-xs text-gray-600 leading-relaxed mt-2">
                          {t('services_dir.find_professionals', { category: cat.ServicesCategory.toLowerCase() })}
                        </p>
                      </div>
                      <div className="mt-3">
                        <Link
                          to={`/services/directory/${cat.ServiceCategoryID}`}
                          className="text-xs font-bold hover:underline"
                          style={{ color: '#3D6B34' }}
                        >
                          {t('services_dir.explore_arrow')}
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {categoryId && (
              <div className="mb-5">
                <Link to="/services/directory" className="text-sm text-[#3D6B34] hover:underline">
                  {t('services_dir.back_categories')}
                </Link>
              </div>
            )}

            {loading ? (
              <div className="text-center py-20 text-gray-400">{t('services_dir.loading_services')}</div>
            ) : services.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-16 text-center text-gray-400">
                <p className="mb-3">{t('services_dir.no_services')}</p>
                <Link to="/services/directory" className="text-[#3D6B34] hover:underline text-sm">{t('services_dir.back_categories')}</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {services.map((svc, index) => (
                  <div
                    key={svc.ServicesID}
                    className="flex bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md hover:border-[#819360] transition-all duration-200"
                  >
                    <Link
                      to={`/services/public/${svc.ServicesID}`}
                      className="shrink-0 overflow-hidden"
                      style={{ width: '155px', height: '155px' }}
                    >
                      <img
                        src={svc.Photo1 || FALLBACK_IMG}
                        alt={svc.ServiceTitle}
                        width="155"
                        height="155"
                        loading={index < EAGER_COUNT ? 'eager' : 'lazy'}
                        decoding={index < EAGER_COUNT ? 'sync' : 'async'}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        onError={e => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }}
                      />
                    </Link>

                    <div className="flex flex-col justify-between px-5 py-4 flex-1 min-w-0">
                      <div>
                        <Link
                          to={`/services/public/${svc.ServicesID}`}
                          className="font-bold text-sm hover:underline block"
                          style={{ color: '#3D6B34' }}
                        >
                          {svc.ServiceTitle}
                        </Link>
                        <p className="text-xs font-semibold mt-0.5" style={{ color: '#819360' }}>
                          {svc.BusinessName}
                        </p>
                        {svc.ServicesDescription && (
                          <p className="text-xs text-gray-600 leading-relaxed mt-2 line-clamp-3">
                            {svc.ServicesDescription}
                          </p>
                        )}
                      </div>
                      <div className="mt-3 flex items-end justify-between gap-2">
                        <Link
                          to={`/services/public/${svc.ServicesID}`}
                          className="text-xs font-bold hover:underline"
                          style={{ color: '#3D6B34' }}
                        >
                          {t('services_dir.view_arrow')}
                        </Link>
                        <div className="text-right shrink-0">
                          {svc.ServiceContactForPrice ? (
                            <span className="text-xs text-gray-500 italic">{t('services_dir.contact_for_price')}</span>
                          ) : svc.ServicePrice ? (
                            <span className="text-sm font-bold text-[#3D6B34]">
                              ${parseFloat(svc.ServicePrice).toLocaleString()}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
