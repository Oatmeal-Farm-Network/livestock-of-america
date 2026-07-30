import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';
import LivestockHeroTabs from '../components/LivestockHeroTabs';

const API_URL = import.meta.env.VITE_LIVESTOCK_API_URL || '';

const ANCESTRY_OPTIONS = [
  'Any', 'Full Peruvian', 'Partial Peruvian',
  'Full Chilean', 'Partial Chilean',
  'Full Bolivian', 'Partial Bolivian',
];

const US_STATE_ABBR = {
  AL:'Alabama', AK:'Alaska', AZ:'Arizona', AR:'Arkansas', CA:'California',
  CO:'Colorado', CT:'Connecticut', DE:'Delaware', FL:'Florida', GA:'Georgia',
  HI:'Hawaii', ID:'Idaho', IL:'Illinois', IN:'Indiana', IA:'Iowa', KS:'Kansas',
  KY:'Kentucky', LA:'Louisiana', ME:'Maine', MD:'Maryland', MA:'Massachusetts',
  MI:'Michigan', MN:'Minnesota', MS:'Mississippi', MO:'Missouri', MT:'Montana',
  NE:'Nebraska', NV:'Nevada', NH:'New Hampshire', NJ:'New Jersey', NM:'New Mexico',
  NY:'New York', NC:'North Carolina', ND:'North Dakota', OH:'Ohio', OK:'Oklahoma',
  OR:'Oregon', PA:'Pennsylvania', RI:'Rhode Island', SC:'South Carolina',
  SD:'South Dakota', TN:'Tennessee', TX:'Texas', UT:'Utah', VT:'Vermont',
  VA:'Virginia', WA:'Washington', WV:'West Virginia', WI:'Wisconsin', WY:'Wyoming',
  DC:'District of Columbia',
};

const SIDEBAR_SECTIONS = [
  {
    id: 'for_sale',
    items: [
      { key: 'sp_alpacas',     path: '/marketplaces/livestock/alpacas' },
      { key: 'sp_bison',       path: '/marketplaces/livestock/bison' },
      { key: 'sp_buffalo',     path: '/marketplaces/livestock/buffalo' },
      { key: 'sp_camels',      path: '/marketplaces/livestock/camels' },
      { key: 'sp_cattle',      path: '/marketplaces/livestock/cattle' },
      { key: 'sp_chickens',    path: '/marketplaces/livestock/chickens' },
      { key: 'sp_crocodiles',  path: '/marketplaces/livestock/crocodiles' },
      { key: 'sp_deer',        path: '/marketplaces/livestock/deer' },
      { key: 'sp_dogs',        path: '/marketplaces/livestock/dogs' },
      { key: 'sp_donkeys',     path: '/marketplaces/livestock/donkeys' },
      { key: 'sp_ducks',       path: '/marketplaces/livestock/ducks' },
      { key: 'sp_emus',        path: '/marketplaces/livestock/emus' },
      { key: 'sp_geese',       path: '/marketplaces/livestock/geese' },
      { key: 'sp_goats',       path: '/marketplaces/livestock/goats' },
      { key: 'sp_guinea_fowl', path: '/marketplaces/livestock/guinea-fowl' },
      { key: 'sp_honey_bees',  path: '/marketplaces/livestock/honey-bees' },
      { key: 'sp_horses',      path: '/marketplaces/livestock/horses' },
      { key: 'sp_llamas',      path: '/marketplaces/livestock/llamas' },
      { key: 'sp_musk_ox',     path: '/marketplaces/livestock/musk-ox' },
      { key: 'sp_ostriches',   path: '/marketplaces/livestock/ostriches' },
      { key: 'sp_pheasants',   path: '/marketplaces/livestock/pheasants' },
      { key: 'sp_pigeons',     path: '/marketplaces/livestock/pigeons' },
      { key: 'sp_pigs',        path: '/marketplaces/livestock/pigs' },
      { key: 'sp_quails',      path: '/marketplaces/livestock/quails' },
      { key: 'sp_rabbits',     path: '/marketplaces/livestock/rabbits' },
      { key: 'sp_sheep',       path: '/marketplaces/livestock/sheep' },
      { key: 'sp_snails',      path: '/marketplaces/livestock/snails' },
      { key: 'sp_turkeys',     path: '/marketplaces/livestock/turkeys' },
      { key: 'sp_yaks',        path: '/marketplaces/livestock/yaks' },
    ],
  },
  {
    id: 'studs',
    items: [
      { key: 'sp_alpaca_studs',  path: '/marketplaces/livestock/studs/alpacas' },
      { key: 'sp_bison_studs',   path: '/marketplaces/livestock/studs/bison' },
      { key: 'sp_buffalo_studs', path: '/marketplaces/livestock/studs/buffalo' },
      { key: 'sp_camel_studs',   path: '/marketplaces/livestock/studs/camels' },
      { key: 'sp_cattle_studs',  path: '/marketplaces/livestock/studs/cattle' },
      { key: 'sp_dog_studs',     path: '/marketplaces/livestock/studs/dogs' },
      { key: 'sp_donkey_studs',  path: '/marketplaces/livestock/studs/donkeys' },
      { key: 'sp_goat_studs',    path: '/marketplaces/livestock/studs/goats' },
      { key: 'sp_horse_studs',   path: '/marketplaces/livestock/studs/horses' },
      { key: 'sp_llama_studs',   path: '/marketplaces/livestock/studs/llamas' },
      { key: 'sp_pig_studs',     path: '/marketplaces/livestock/studs/pigs' },
      { key: 'sp_rabbit_studs',  path: '/marketplaces/livestock/studs/rabbits' },
      { key: 'sp_sheep_studs',   path: '/marketplaces/livestock/studs/sheep' },
      { key: 'sp_yak_studs',     path: '/marketplaces/livestock/studs/yaks' },
    ],
  },
  {
    id: 'ranches',
    items: [
      { key: 'sp_alpaca_ranches',      path: '/marketplaces/livestock/ranches/alpacas' },
      { key: 'sp_bees_honey',          path: '/marketplaces/livestock/ranches/honey-bees' },
      { key: 'sp_bison_ranches',       path: '/marketplaces/livestock/ranches/bison' },
      { key: 'sp_buffalo_ranches',     path: '/marketplaces/livestock/ranches/buffalo' },
      { key: 'sp_camel_ranches',       path: '/marketplaces/livestock/ranches/camels' },
      { key: 'sp_cattle_ranches',      path: '/marketplaces/livestock/ranches/cattle' },
      { key: 'sp_chicken_ranches',     path: '/marketplaces/livestock/ranches/chickens' },
      { key: 'sp_crocodile_ranches',   path: '/marketplaces/livestock/ranches/crocodiles' },
      { key: 'sp_deer_ranches',        path: '/marketplaces/livestock/ranches/deer' },
      { key: 'sp_dog_ranches',         path: '/marketplaces/livestock/ranches/dogs' },
      { key: 'sp_donkey_ranches',      path: '/marketplaces/livestock/ranches/donkeys' },
      { key: 'sp_duck_ranches',        path: '/marketplaces/livestock/ranches/ducks' },
      { key: 'sp_emu_ranches',         path: '/marketplaces/livestock/ranches/emus' },
      { key: 'sp_geese_ranches',       path: '/marketplaces/livestock/ranches/geese' },
      { key: 'sp_goat_ranches',        path: '/marketplaces/livestock/ranches/goats' },
      { key: 'sp_guinea_fowl_ranches', path: '/marketplaces/livestock/ranches/guinea-fowl' },
      { key: 'sp_horse_ranches',       path: '/marketplaces/livestock/ranches/horses' },
      { key: 'sp_llama_ranches',       path: '/marketplaces/livestock/ranches/llamas' },
      { key: 'sp_musk_ox_ranches',     path: '/marketplaces/livestock/ranches/musk-ox' },
      { key: 'sp_ostrich_ranches',     path: '/marketplaces/livestock/ranches/ostriches' },
      { key: 'sp_pheasant_ranches',    path: '/marketplaces/livestock/ranches/pheasants' },
      { key: 'sp_pig_ranches',         path: '/marketplaces/livestock/ranches/pigs' },
      { key: 'sp_pigeon_ranches',      path: '/marketplaces/livestock/ranches/pigeons' },
      { key: 'sp_quail_ranches',       path: '/marketplaces/livestock/ranches/quails' },
      { key: 'sp_rabbit_ranches',      path: '/marketplaces/livestock/ranches/rabbits' },
      { key: 'sp_sheep_ranches',       path: '/marketplaces/livestock/ranches/sheep' },
      { key: 'sp_snail_ranches',       path: '/marketplaces/livestock/ranches/snails' },
      { key: 'sp_turkey_ranches',      path: '/marketplaces/livestock/ranches/turkeys' },
      { key: 'sp_yak_ranches',         path: '/marketplaces/livestock/ranches/yaks' },
    ],
  },
];

function Sidebar({ collapsed, onToggle, isStuds }) {
  // Kept for reference / future restore — Browse sidebar is hidden; options live in Filters.
  const { t } = useTranslation();
  const defaultOpen = isStuds ? 'studs' : 'for_sale';
  const [openSections, setOpenSections] = useState({ [defaultOpen]: true });

  const toggleSection = (id) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div style={{
      width: collapsed ? '40px' : '220px',
      minWidth: collapsed ? '40px' : '220px',
      transition: 'all 0.3s ease',
      backgroundColor: '#f5f5f0',
      borderRight: '1px solid #ddd',
      overflowY: collapsed ? 'hidden' : 'auto',
      overflowX: 'hidden',
      position: 'sticky',
      top: '72px',
      maxHeight: 'calc(100vh - 72px)',
      flexShrink: 0,
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', padding: '10px', border: 'none',
          backgroundColor: '#e59a24', color: '#fff',
          fontWeight: 'bold', cursor: 'pointer', fontSize: '14px',
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: '6px',
        }}
      >
        {!collapsed && <span style={{ fontSize: '12px', fontWeight: 600 }}>{t('livestock_mkt.browse')}</span>}
        <span style={{ fontSize: '18px' }}>{collapsed ? '☰' : '✕'}</span>
      </button>

      {!collapsed && (
        <div style={{ padding: '8px 0' }}>
          {SIDEBAR_SECTIONS.map(section => (
            <div key={section.id}>
              <button
                onClick={() => toggleSection(section.id)}
                style={{
                  width: '100%', padding: '8px 12px', border: 'none',
                  backgroundColor: '#e8e8e0', color: '#333',
                  fontWeight: '700', fontSize: '12px', textAlign: 'left',
                  cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', textTransform: 'uppercase', letterSpacing: '0.5px',
                }}
              >
                {t(`livestock_mkt.section_${section.id}`)}
                <span>{openSections[section.id] ? '▲' : '▼'}</span>
              </button>
              {openSections[section.id] && (
                <ul style={{ listStyle: 'none', margin: 0, padding: '4px 0' }}>
                  {section.items.map(item => (
                    <li key={item.key}>
                      <Link
                        to={item.path}
                        style={{
                          display: 'block', padding: '5px 16px',
                          fontSize: '13px', color: '#4d734d',
                          textDecoration: 'none',
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e5ede5'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        {t(`livestock_mkt.${item.key}`)}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** When false, Browse sidebar is not shown; its category lists are in Filters instead. */
const SHOW_BROWSE_SIDEBAR = false;

function CategoryFilters({ categoryId, slug, onCategoryChange, onSpeciesChange }) {
  const { t } = useTranslation();
  const section = SIDEBAR_SECTIONS.find((s) => s.id === categoryId) || SIDEBAR_SECTIONS[0];
  const currentPath = section.items.find((item) => item.path.endsWith(`/${slug}`))?.path
    || section.items[0]?.path
    || '';

  return (
    <>
      <div style={filterBox}>
        <label style={filterLabel}>{t('livestock_mkt.filter_category', 'CATEGORY')}</label>
        <select
          value={categoryId}
          onChange={(e) => onCategoryChange(e.target.value)}
          style={selectStyle}
        >
          <option value="for_sale">{t('livestock_mkt.section_for_sale', 'Livestock for Sale')}</option>
          <option value="studs">{t('livestock_mkt.section_studs', 'Stud Services')}</option>
          <option value="ranches">{t('livestock_mkt.section_ranches', 'Ranches')}</option>
        </select>
      </div>
      <div style={filterBox}>
        <label style={filterLabel}>{t('livestock_mkt.filter_animal_type', 'ANIMAL TYPE')}</label>
        <select
          value={currentPath}
          onChange={(e) => onSpeciesChange(e.target.value)}
          style={selectStyle}
        >
          {section.items.map((item) => (
            <option key={item.key} value={item.path}>
              {t(`livestock_mkt.${item.key}`)}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}

function AnimalCard({ animal, type }) {
  const { t } = useTranslation();
  const [imgFailed, setImgFailed] = useState(false);
  const detailUrl = `/marketplaces/livestock/animal/${animal.animal_id}`;
  const priceKey = type === 'studs' ? 'stud_fee_label' : 'price_label';
  const priceVal = type === 'studs' ? animal.stud_fee : animal.price;
  const ev = animal.upcoming_event;
  const evDate = ev?.EventStartDate ? new Date(ev.EventStartDate) : null;
  const evDateStr = evDate && !isNaN(evDate)
    ? evDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '';

  return (
    <div className="card mb-3" style={{ border: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }}>
      <div style={{ backgroundColor: '#507033', padding: '8px 12px', borderRadius: '4px 4px 0 0' }}>
        <Link to={detailUrl} style={{ color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '1rem' }}>
          {animal.full_name}
        </Link>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        <div style={{ width: '200px', padding: '12px', flexShrink: 0, textAlign: 'center' }}>
          {!imgFailed && animal.photo ? (
            <Link to={detailUrl}>
              <img
                src={animal.photo}
                alt={animal.full_name}
                loading="lazy"
                onError={() => setImgFailed(true)}
                style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'contain', borderRadius: '4px' }}
              />
            </Link>
          ) : (
            <div style={{ height: '160px', backgroundColor: '#f0f0f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '12px' }}>
              {t('livestock_mkt.no_photo')}
            </div>
          )}
        </div>
        <div style={{ flex: 1, padding: '12px', minWidth: '200px' }}>
          <p style={{ margin: '0 0 6px', fontSize: '0.9rem' }}>
            <strong>{t(`livestock_mkt.${priceKey}`)}:</strong>{' '}
            {priceVal ? `$${Math.round(priceVal).toLocaleString()}` : t('livestock_mkt.call_for_price_lc')}
          </p>
          <p style={{ margin: '0 0 6px', fontSize: '0.9rem' }}>
            <strong>{t('livestock_mkt.filter_breed')}:</strong> {animal.breeds && animal.breeds.length > 0 ? animal.breeds.join(', ') : 'N/A'}
          </p>
          <p style={{ margin: '0 0 6px', fontSize: '0.9rem' }}>
            <strong>{t('livestock_mkt.filter_state')}:</strong> {animal.location || 'N/A'}
          </p>
          <p style={{ margin: '0 0 10px', fontSize: '0.9rem' }}>
            <strong>{t('livestock_mkt.filter_ranch')}:</strong> {animal.seller || 'N/A'}
          </p>
          {ev && (
            <Link to={`/events/${ev.EventID}`}
              style={{ display: 'inline-block', marginBottom: '8px', backgroundColor: '#eef3e7', color: '#3D6B34', padding: '4px 10px', borderRadius: '999px', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 600 }}>
              🎪 {t('livestock_mkt.see_in_person', { name: ev.EventName })}{evDateStr ? ` · ${evDateStr}` : ''}
            </Link>
          )}
          <div>
            <Link to={detailUrl}
              style={{ backgroundColor: '#6c757d', color: '#fff', padding: '5px 14px', borderRadius: '4px', textDecoration: 'none', fontSize: '0.85rem' }}>
              {t('livestock_mkt.view_details')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, onPageChange }) {
  const { t } = useTranslation();
  if (totalPages <= 1) return null;
  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);
  return (
    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', margin: '16px 0' }}>
      {page > 1 && <button onClick={() => onPageChange(page - 1)} style={btnStyle}>{t('livestock_mkt.pagination_prev')}</button>}
      {pages.map(p => (
        <button key={p} onClick={() => onPageChange(p)}
          style={{ ...btnStyle, backgroundColor: p === page ? '#819360' : '#fff', color: p === page ? '#fff' : '#333' }}>
          {p}
        </button>
      ))}
      {page < totalPages && <button onClick={() => onPageChange(page + 1)} style={btnStyle}>{t('livestock_mkt.pagination_next')}</button>}
      {totalPages > 5 && page < totalPages && (
        <button onClick={() => onPageChange(totalPages)} style={btnStyle}>{t('livestock_mkt.pagination_last')}</button>
      )}
    </div>
  );
}

const btnStyle = {
  padding: '5px 12px', border: '1px solid #ccc', borderRadius: '8px',
  backgroundColor: '#fff', cursor: 'pointer', fontSize: '0.85rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
};

export default function LivestockForSale() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { pathname } = window.location;
  const isStuds = pathname.includes('/studs/');
  const categoryId = isStuds ? 'studs' : 'for_sale';

  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({ breeds: [], states: [], ranches: [] });
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [breedId, setBreedId] = useState(Number(searchParams.get('breed_id')) || 0);
  const [stateIndex, setStateIndex] = useState(Number(searchParams.get('state_index')) || 0);
  const [businessId, setBusinessId] = useState(Number(searchParams.get('business_id')) || 0);
  const [ranchSearch, setRanchSearch] = useState('');
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');
  const [ancestry, setAncestry] = useState(searchParams.get('ancestry') || 'Any');
  const [sortBy, setSortBy] = useState(searchParams.get('sort_by') || 'lastupdated');
  const [orderBy, setOrderBy] = useState(searchParams.get('order_by') || 'desc');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  useEffect(() => {
    if (window.innerWidth < 768) setSidebarCollapsed(true);
  }, []);

  useEffect(() => {
    setBreedId(0);
    setStateIndex(0);
    setBusinessId(0);
    setRanchSearch('');
    setMinPrice('');
    setMaxPrice('');
    setAncestry('Any');
    setSortBy('lastupdated');
    setOrderBy('desc');
    setPage(1);
    setData(null);
  }, [slug]);

  useEffect(() => {
    fetch(`${API_URL}/api/marketplace/filters/${slug}`)
      .then(r => r.ok ? r.json() : { breeds: [], states: [], ranches: [] })
      .then(d => setFilters({ breeds: d.breeds || [], states: d.states || [], ranches: d.ranches || [] }))
      .catch(() => setFilters({ breeds: [], states: [], ranches: [] }));
  }, [slug]);

  const [singularTerm, setSingularTerm] = useState('');
  useEffect(() => {
    fetch(`${API_URL}/api/marketplace/species/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setSingularTerm(d.singular_term || ''))
      .catch(() => {});
  }, [slug]);

  const loadData = useCallback(() => {
    setLoading(true);
    const endpoint = isStuds ? 'studs' : 'for-sale';
    const priceParam = isStuds ? 'stud_fee' : 'price';
    const params = new URLSearchParams({
      page,
      breed_id: breedId,
      state_index: stateIndex,
      business_id: businessId,
      [`min_${priceParam}`]: minPrice || 0,
      [`max_${priceParam}`]: maxPrice || 100000000,
      ancestry,
      sort_by: sortBy,
      order_by: orderBy,
    });
    fetch(`${API_URL}/api/marketplace/${endpoint}/${slug}?${params}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        setData(d ? { ...d, animals: d.animals || [] } : { total: 0, page: 1, per_page: 10, total_pages: 1, animals: [] });
        setLoading(false);
      })
      .catch(() => {
        setData({ total: 0, page: 1, per_page: 10, total_pages: 1, animals: [] });
        setLoading(false);
      });
  }, [slug, page, breedId, stateIndex, businessId, minPrice, maxPrice, ancestry, sortBy, orderBy, isStuds]);

  useEffect(() => { loadData(); }, [loadData]);

  const rawLabel = data?.label || slug;
  const fallbackLabel = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
  const label = singularTerm || fallbackLabel;
  const pageTitle = isStuds
    ? `${label} ${t('livestock_mkt.stud_services_suffix')}`
    : `${label} ${t('livestock_mkt.for_sale_suffix')}`;
  const otherLink = isStuds ? `/marketplaces/livestock/${slug}` : `/marketplaces/livestock/studs/${slug}`;
  const otherLabel = isStuds
    ? `${label} ${t('livestock_mkt.for_sale_suffix')}`
    : `${label} ${t('livestock_mkt.stud_services_suffix')}`;
  const priceFilterMinKey = isStuds ? 'min_stud_fee' : 'min_price';
  const priceFilterMaxKey = isStuds ? 'max_stud_fee' : 'max_price';

  const metaDesc = isStuds
    ? `Browse ${label.toLowerCase()} stud services from ranchers and breeders across the US. Compare fees, genetics, and connect with breeders on Oatmeal Farm Network.`
    : `Browse ${label.toLowerCase()} for sale from ranchers and breeders across the US. Filter by breed, state, price, and ancestry on Oatmeal Farm Network.`;
  const metaCanonical = isStuds
    ? `https://oatmealfarmnetwork.com/marketplaces/livestock/studs/${slug}`
    : `https://oatmealfarmnetwork.com/marketplaces/livestock/${slug}`;

  const handleCategoryChange = (nextCategory) => {
    const section = SIDEBAR_SECTIONS.find((s) => s.id === nextCategory);
    if (!section?.items?.length) return;
    const match = section.items.find((item) => item.path.endsWith(`/${slug}`));
    navigate(match?.path || section.items[0].path);
  };

  const handleSpeciesChange = (path) => {
    if (path) navigate(path);
  };

  return (
    <div className="min-h-screen font-sans">
      <PageMeta
        title={`${pageTitle} | Livestock Marketplace`}
        description={metaDesc}
        keywords={`${label.toLowerCase()} for sale, ${label.toLowerCase()} breeders, livestock marketplace, ${isStuds ? 'stud services, ' : ''}farm animals, ranchers`}
        canonical={metaCanonical}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: pageTitle,
          url: metaCanonical,
          description: metaDesc
        }}
      />
      <Header />
      <LivestockHeroTabs />

      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '0.5rem 1rem 0' }}>
        <Breadcrumbs items={[
          { label: 'Home', to: '/' },
          { label: t('livestock_mkt.crumb_marketplaces'), to: '/marketplaces' },
          { label: t('livestock_mkt.crumb_livestock'), to: '/marketplaces/livestock' },
          ...(isStuds ? [{ label: t('livestock_mkt.crumb_studs') }] : []),
          { label: pageTitle },
        ]} />
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start' }}>

        {SHOW_BROWSE_SIDEBAR && (
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(p => !p)}
            isStuds={isStuds}
          />
        )}

        <div style={{ flex: 1, minWidth: 0 }}>

          <div style={{ backgroundColor: '#507033', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 style={{ color: '#fff', margin: 0, fontSize: '1.4rem', fontWeight: 'bold' }}>{pageTitle}</h1>
            <Link to={otherLink} style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {otherLabel} →
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', padding: '20px 16px', gap: '24px' }}>

            <div style={{ width: '220px', flexShrink: 0 }}>
              <div style={{
                backgroundColor: '#fff',
                border: '1px solid #e5e0d6',
                borderRadius: '8px',
                padding: '14px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}>
                <div style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: '#2c2c2c',
                  marginBottom: '12px',
                }}>
                  {t('livestock_mkt.filters', 'FILTERS')}
                </div>

                <CategoryFilters
                  categoryId={categoryId}
                  slug={slug}
                  onCategoryChange={handleCategoryChange}
                  onSpeciesChange={handleSpeciesChange}
                />

                <div style={filterBox}>
                  <label style={filterLabel}>{t('livestock_mkt.filter_breed')}</label>
                  <select value={breedId} onChange={e => { setBreedId(Number(e.target.value)); setPage(1); }} style={selectStyle}>
                    <option value={0}>{t('livestock_mkt.all_breeds')}</option>
                    {filters.breeds.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {(() => {
                  const cleanStates = (() => {
                    const byName = new Map();
                    filters.states.forEach(s => {
                      const idx = Number(s.state_index);
                      const name = (s.state || '').trim();
                      if (!idx || idx <= 0 || !name || /^\d+$/.test(name) || name.length < 2) return;
                      const upper = name.toUpperCase();
                      const pretty = US_STATE_ABBR[upper]
                        || (name.length <= 2 ? upper : name.charAt(0).toUpperCase() + name.slice(1).toLowerCase());
                      const existing = byName.get(pretty);
                      if (!existing || idx < existing) byName.set(pretty, idx);
                    });
                    return Array.from(byName.entries())
                      .map(([name, index]) => ({ index, name }))
                      .sort((a, b) => a.name.localeCompare(b.name));
                  })();
                  return cleanStates.length > 0 && (
                    <div style={filterBox}>
                      <label style={filterLabel}>{t('livestock_mkt.filter_state')}</label>
                      <select value={stateIndex} onChange={e => { setStateIndex(Number(e.target.value)); setPage(1); }} style={selectStyle}>
                        <option value={0}>{t('livestock_mkt.all_states')}</option>
                        {cleanStates.map(s => (
                          <option key={s.index} value={s.index}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  );
                })()}

                {filters.ranches.length > 0 && (
                  <div style={filterBox}>
                    <label style={filterLabel}>{t('livestock_mkt.filter_ranch')}</label>
                    <input
                      type="text"
                      value={ranchSearch}
                      onChange={e => setRanchSearch(e.target.value)}
                      placeholder={t('livestock_mkt.search_ranches_ph')}
                      style={inputStyle}
                    />
                    <select
                      value={businessId}
                      onChange={e => { setBusinessId(Number(e.target.value)); setPage(1); }}
                      style={{ ...selectStyle, marginTop: 6 }}
                    >
                      <option value={0}>{t('livestock_mkt.all_ranches')}</option>
                      {filters.ranches
                        .filter(r => !ranchSearch.trim() || (r.name || '').toLowerCase().includes(ranchSearch.trim().toLowerCase()))
                        .map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                    </select>
                  </div>
                )}

                <div style={filterBox}>
                  <label style={filterLabel}>{t(`livestock_mkt.${priceFilterMinKey}`)}</label>
                  <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)}
                    placeholder="$0" style={inputStyle} />
                </div>

                <div style={filterBox}>
                  <label style={filterLabel}>{t(`livestock_mkt.${priceFilterMaxKey}`)}</label>
                  <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                    placeholder="Any" style={inputStyle} />
                </div>

                {slug === 'alpacas' && (
                  <div style={filterBox}>
                    <label style={filterLabel}>{t('livestock_mkt.filter_ancestry')}</label>
                    <select value={ancestry} onChange={e => { setAncestry(e.target.value); setPage(1); }} style={selectStyle}>
                      {ANCESTRY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                )}

                {!isStuds && (
                  <div style={filterBox}>
                    <label style={filterLabel}>{t('livestock_mkt.filter_sort')}</label>
                    <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }} style={selectStyle}>
                      <option value="lastupdated">{t('livestock_mkt.sort_last_updated')}</option>
                      <option value="price">{t('livestock_mkt.sort_price')}</option>
                      <option value="name">{t('livestock_mkt.sort_name')}</option>
                      <option value="breed">{t('livestock_mkt.sort_breed')}</option>
                    </select>
                    <select value={orderBy} onChange={e => { setOrderBy(e.target.value); setPage(1); }}
                      style={{ ...selectStyle, marginTop: '4px' }}>
                      <option value="desc">{t('livestock_mkt.sort_desc')}</option>
                      <option value="asc">{t('livestock_mkt.sort_asc')}</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              {loading ? (
                <div>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse" style={{ marginBottom: '16px', border: '1px solid #eee', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '36px', backgroundColor: '#c8d9b8' }} />
                      <div style={{ display: 'flex', padding: '12px', gap: '12px' }}>
                        <div style={{ width: '180px', height: '160px', backgroundColor: '#e8e8e8', borderRadius: '4px', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          {[...Array(4)].map((_, j) => (
                            <div key={j} style={{ height: '14px', backgroundColor: '#e8e8e8', borderRadius: '4px', marginBottom: '10px', width: j === 3 ? '40%' : '70%' }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : !data || data.animals.length === 0 ? (
                <div style={{ backgroundColor: '#d1ecf1', border: '1px solid #bee5eb', borderRadius: '4px', padding: '16px' }}>
                  <h4 style={{ margin: '0 0 8px' }}>{t('livestock_mkt.no_results')}</h4>
                  <p style={{ margin: 0 }}>{t('livestock_mkt.broaden_search')}</p>
                </div>
              ) : (
                <>
                  <div style={{ color: '#666', fontSize: '0.85rem', marginBottom: '12px' }}>
                    {t('livestock_mkt.showing_results', {
                      from: ((page - 1) * data.per_page) + 1,
                      to: Math.min(page * data.per_page, data.total),
                      total: data.total,
                    })}
                  </div>
                  <Pagination page={page} totalPages={data.total_pages} onPageChange={setPage} />
                  {data.animals.map(animal => (
                    <AnimalCard key={animal.animal_id} animal={animal} type={isStuds ? 'studs' : 'sale'} />
                  ))}
                  <Pagination page={page} totalPages={data.total_pages} onPageChange={setPage} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

const filterBox = { marginBottom: '12px' };
const filterLabel = {
  display: 'block', fontSize: '0.8rem', fontWeight: 600,
  color: '#555', marginBottom: '4px', textTransform: 'uppercase',
};
const selectStyle = {
  width: '100%', padding: '6px 8px', border: '1px solid #ccc',
  borderRadius: '4px', fontSize: '0.85rem',
};
const inputStyle = {
  width: '100%', padding: '6px 8px', border: '1px solid #ccc',
  borderRadius: '4px', fontSize: '0.85rem', boxSizing: 'border-box',
};
