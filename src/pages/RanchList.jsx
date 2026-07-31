import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';
import LivestockHeroTabs from '../components/LivestockHeroTabs';

const API_URL = import.meta.env.VITE_LIVESTOCK_API_URL || '';

// id used for open-state management; items are species proper names (not translated)
const SIDEBAR_SECTIONS = [
  {
    id: 'for_sale',
    items: [
      { label: 'Alpacas', path: '/marketplaces/livestock/alpacas' },
      { label: 'Bison', path: '/marketplaces/livestock/bison' },
      { label: 'Buffalo', path: '/marketplaces/livestock/buffalo' },
      { label: 'Camels', path: '/marketplaces/livestock/camels' },
      { label: 'Cattle', path: '/marketplaces/livestock/cattle' },
      { label: 'Chickens', path: '/marketplaces/livestock/chickens' },
      { label: 'Crocodiles & Alligators', path: '/marketplaces/livestock/crocodiles' },
      { label: 'Deer', path: '/marketplaces/livestock/deer' },
      { label: 'Working Dogs', path: '/marketplaces/livestock/dogs' },
      { label: 'Donkeys', path: '/marketplaces/livestock/donkeys' },
      { label: 'Ducks', path: '/marketplaces/livestock/ducks' },
      { label: 'Emus', path: '/marketplaces/livestock/emus' },
      { label: 'Geese', path: '/marketplaces/livestock/geese' },
      { label: 'Goats', path: '/marketplaces/livestock/goats' },
      { label: 'Guinea Fowl', path: '/marketplaces/livestock/guinea-fowl' },
      { label: 'Honey Bees', path: '/marketplaces/livestock/honey-bees' },
      { label: 'Horses', path: '/marketplaces/livestock/horses' },
      { label: 'Llamas', path: '/marketplaces/livestock/llamas' },
      { label: 'Musk Ox', path: '/marketplaces/livestock/musk-ox' },
      { label: 'Ostriches', path: '/marketplaces/livestock/ostriches' },
      { label: 'Pheasants', path: '/marketplaces/livestock/pheasants' },
      { label: 'Pigeons', path: '/marketplaces/livestock/pigeons' },
      { label: 'Pigs', path: '/marketplaces/livestock/pigs' },
      { label: 'Quails', path: '/marketplaces/livestock/quails' },
      { label: 'Rabbits', path: '/marketplaces/livestock/rabbits' },
      { label: 'Sheep', path: '/marketplaces/livestock/sheep' },
      { label: 'Snails', path: '/marketplaces/livestock/snails' },
      { label: 'Turkeys', path: '/marketplaces/livestock/turkeys' },
      { label: 'Yaks', path: '/marketplaces/livestock/yaks' },
    ],
  },
  {
    id: 'studs',
    items: [
      { label: 'Alpaca Studs', path: '/marketplaces/livestock/studs/alpacas' },
      { label: 'Bison Studs', path: '/marketplaces/livestock/studs/bison' },
      { label: 'Buffalo Studs', path: '/marketplaces/livestock/studs/buffalo' },
      { label: 'Camel Studs', path: '/marketplaces/livestock/studs/camels' },
      { label: 'Cattle Studs', path: '/marketplaces/livestock/studs/cattle' },
      { label: 'Working Dog Studs', path: '/marketplaces/livestock/studs/dogs' },
      { label: 'Donkey Studs', path: '/marketplaces/livestock/studs/donkeys' },
      { label: 'Goat Studs', path: '/marketplaces/livestock/studs/goats' },
      { label: 'Horse Studs', path: '/marketplaces/livestock/studs/horses' },
      { label: 'Llama Studs', path: '/marketplaces/livestock/studs/llamas' },
      { label: 'Pig Studs', path: '/marketplaces/livestock/studs/pigs' },
      { label: 'Rabbit Studs', path: '/marketplaces/livestock/studs/rabbits' },
      { label: 'Sheep Studs', path: '/marketplaces/livestock/studs/sheep' },
      { label: 'Yak Studs', path: '/marketplaces/livestock/studs/yaks' },
    ],
  },
  {
    id: 'ranches',
    items: [
      { label: 'Alpaca Ranches', path: '/marketplaces/livestock/ranches/alpacas' },
      { label: 'Bees, Honey', path: '/marketplaces/livestock/ranches/honey-bees' },
      { label: 'Bison Ranches', path: '/marketplaces/livestock/ranches/bison' },
      { label: 'Buffalo Ranches', path: '/marketplaces/livestock/ranches/buffalo' },
      { label: 'Camel Ranches', path: '/marketplaces/livestock/ranches/camels' },
      { label: 'Cattle Ranches', path: '/marketplaces/livestock/ranches/cattle' },
      { label: 'Chicken Ranches', path: '/marketplaces/livestock/ranches/chickens' },
      { label: 'Crocodile & Alligator Ranches', path: '/marketplaces/livestock/ranches/crocodiles' },
      { label: 'Deer Ranches', path: '/marketplaces/livestock/ranches/deer' },
      { label: 'Working Dog Ranches', path: '/marketplaces/livestock/ranches/dogs' },
      { label: 'Donkey Ranches', path: '/marketplaces/livestock/ranches/donkeys' },
      { label: 'Duck Ranches', path: '/marketplaces/livestock/ranches/ducks' },
      { label: 'Emu Ranches', path: '/marketplaces/livestock/ranches/emus' },
      { label: 'Geese Ranches', path: '/marketplaces/livestock/ranches/geese' },
      { label: 'Goat Ranches', path: '/marketplaces/livestock/ranches/goats' },
      { label: 'Guinea Fowl Ranches', path: '/marketplaces/livestock/ranches/guinea-fowl' },
      { label: 'Horse Ranches', path: '/marketplaces/livestock/ranches/horses' },
      { label: 'Llama Ranches', path: '/marketplaces/livestock/ranches/llamas' },
      { label: 'Musk Ox Ranches', path: '/marketplaces/livestock/ranches/musk-ox' },
      { label: 'Ostrich Ranches', path: '/marketplaces/livestock/ranches/ostriches' },
      { label: 'Pheasant Ranches', path: '/marketplaces/livestock/ranches/pheasants' },
      { label: 'Pig Ranches', path: '/marketplaces/livestock/ranches/pigs' },
      { label: 'Pigeon Ranches', path: '/marketplaces/livestock/ranches/pigeons' },
      { label: 'Quail Ranches', path: '/marketplaces/livestock/ranches/quails' },
      { label: 'Rabbit Ranches', path: '/marketplaces/livestock/ranches/rabbits' },
      { label: 'Sheep Ranches', path: '/marketplaces/livestock/ranches/sheep' },
      { label: 'Snail Ranches', path: '/marketplaces/livestock/ranches/snails' },
      { label: 'Turkey Ranches', path: '/marketplaces/livestock/ranches/turkeys' },
      { label: 'Yak Ranches', path: '/marketplaces/livestock/ranches/yaks' },
    ],
  },
];

const SOCIAL_ICONS = [
  { key: 'facebook',    icon: '/icons/facebook.png',         alt: 'Facebook' },
  { key: 'x',          icon: '/icons/TwitterX.png',          alt: 'Twitter/X' },
  { key: 'instagram',  icon: '/icons/instagramicon.png',     alt: 'Instagram' },
  { key: 'pinterest',  icon: '/icons/PinterestLogo.png',     alt: 'Pinterest' },
  { key: 'youtube',    icon: '/icons/YouTube.jpg',           alt: 'YouTube' },
  { key: 'blog',       icon: '/icons/BlogIcon.png',          alt: 'Blog' },
  { key: 'truth_social', icon: '/icons/Truthsocial.png',    alt: 'Truth Social' },
];

function Sidebar({ collapsed, onToggle }) {
  // Kept for reference / future restore — Browse sidebar is hidden; options live in Filters.
  const { t } = useTranslation();
  const SECTION_LABELS = {
    for_sale: t('ranch_list.sidebar_for_sale'),
    studs:    t('ranch_list.stud_services'),
    ranches:  t('ranch_list.sidebar_ranches'),
  };
  const [openSections, setOpenSections] = useState({ ranches: true });
  const toggle = (id) => setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div style={{
      width: collapsed ? '40px' : '220px', minWidth: collapsed ? '40px' : '220px',
      transition: 'all 0.3s ease', backgroundColor: '#f5f5f0',
      borderRight: '1px solid #ddd', overflowY: collapsed ? 'hidden' : 'auto',
      overflowX: 'hidden', position: 'sticky', top: '72px',
      maxHeight: 'calc(100vh - 72px)', flexShrink: 0,
    }}>
      <button onClick={onToggle} style={{
        width: '100%', padding: '10px', border: 'none', backgroundColor: '#e59a24',
        color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px',
        display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between',
      }}>
        {!collapsed && <span style={{ fontSize: '12px', fontWeight: 600 }}>{t('ranch_list.browse')}</span>}
        <span style={{ fontSize: '18px' }}>{collapsed ? '☰' : '✕'}</span>
      </button>
      {!collapsed && (
        <div style={{ padding: '8px 0' }}>
          {SIDEBAR_SECTIONS.map(section => (
            <div key={section.id}>
              <button onClick={() => toggle(section.id)} style={{
                width: '100%', padding: '8px 12px', border: 'none',
                backgroundColor: '#e8e8e0', color: '#333', fontWeight: '700',
                fontSize: '12px', textAlign: 'left', cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>
                {SECTION_LABELS[section.id]}
                <span>{openSections[section.id] ? '▲' : '▼'}</span>
              </button>
              {openSections[section.id] && (
                <ul style={{ listStyle: 'none', margin: 0, padding: '4px 0' }}>
                  {section.items.map(item => (
                    <li key={item.label}>
                      <Link to={item.path} style={{ display: 'block', padding: '5px 16px', fontSize: '13px', color: '#4d734d', textDecoration: 'none' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e5ede5'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        {item.label}
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

const ranchFilterBox = { marginBottom: '12px' };
const ranchFilterLabel = {
  display: 'block', fontSize: '0.8rem', fontWeight: 600,
  color: '#555', marginBottom: '4px', textTransform: 'uppercase',
};
const ranchSelectStyle = {
  width: '100%', padding: '6px 8px', border: '1px solid #ccc',
  borderRadius: '4px', fontSize: '0.85rem',
};

function RanchCategoryFilters({ slug, onCategoryChange, onSpeciesChange }) {
  const { t } = useTranslation();
  const section = SIDEBAR_SECTIONS.find((s) => s.id === 'ranches') || SIDEBAR_SECTIONS[2];
  const currentPath = section.items.find((item) => item.path.endsWith(`/${slug}`))?.path
    || section.items[0]?.path
    || '';

  return (
    <>
      <div style={ranchFilterBox}>
        <label style={ranchFilterLabel}>{t('livestock_mkt.filter_category', 'CATEGORY')}</label>
        <select
          value="ranches"
          onChange={(e) => onCategoryChange(e.target.value)}
          style={ranchSelectStyle}
        >
          <option value="for_sale">{t('livestock_mkt.section_for_sale', 'Livestock for Sale')}</option>
          <option value="studs">{t('livestock_mkt.section_studs', 'Stud Services')}</option>
          <option value="ranches">{t('livestock_mkt.section_ranches', 'Ranches')}</option>
        </select>
      </div>
      <div style={ranchFilterBox}>
        <label style={ranchFilterLabel}>{t('livestock_mkt.filter_animal_type', 'ANIMAL TYPE')}</label>
        <select
          value={currentPath}
          onChange={(e) => onSpeciesChange(e.target.value)}
          style={ranchSelectStyle}
        >
          {section.items.map((item) => (
            <option key={item.path} value={item.path}>{item.label}</option>
          ))}
        </select>
      </div>
    </>
  );
}

function RanchCard({ ranch }) {
  const { t } = useTranslation();
  const [logoFailed, setLogoFailed] = useState(false);
  const profileUrl = `/marketplaces/livestock/ranch/${ranch.business_id}`;
  const location = [ranch.city, ranch.state, ranch.country].filter(Boolean).join(', ');

  return (
    <div style={{ marginBottom: '16px', border: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.12)', borderRadius: '4px', overflow: 'hidden' }}>
      <div style={{ backgroundColor: '#441c15', padding: '8px 16px' }}>
        <Link to={profileUrl} style={{ color: '#fff', fontWeight: 600, fontSize: '1rem', textDecoration: 'none' }}>
          {ranch.business_name}
        </Link>
      </div>

      <div style={{ display: 'flex', padding: '12px', gap: '16px', backgroundColor: '#fff' }}>
        <div style={{ width: '180px', flexShrink: 0, textAlign: 'center' }}>
          {!logoFailed && ranch.logo ? (
            <Link to={profileUrl}>
              <img src={ranch.logo} alt={ranch.business_name} loading="lazy"
                onError={() => setLogoFailed(true)}
                style={{ maxWidth: '180px', maxHeight: '120px', objectFit: 'contain' }} />
            </Link>
          ) : (
            <div style={{ height: '80px', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: '12px', borderRadius: '4px' }}>
              {t('ranch_list.no_logo')}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }}>
          {location && <p style={{ margin: '0 0 6px', fontSize: '0.9rem', color: '#555' }}>{location}</p>}

          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            {ranch.has_animals && (
              <span style={{ fontSize: '11px', backgroundColor: '#507033', color: '#fff', padding: '2px 8px', borderRadius: '10px' }}>
                {t('ranch_list.animals_for_sale')}
              </span>
            )}
            {ranch.has_studs && (
              <span style={{ fontSize: '11px', backgroundColor: '#e59a24', color: '#fff', padding: '2px 8px', borderRadius: '10px' }}>
                {t('ranch_list.stud_services')}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
            {SOCIAL_ICONS.map(s => ranch[s.key] ? (
              <a key={s.key} href={ranch[s.key]} target="_blank" rel="noopener noreferrer">
                <img src={s.icon} alt={s.alt} style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                  onError={e => { e.target.style.display = 'none'; }} />
              </a>
            ) : null)}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to={`${profileUrl}?tab=contact`}
              style={{ backgroundColor: '#6c757d', color: '#fff', padding: '5px 14px', borderRadius: '4px', textDecoration: 'none', fontSize: '0.85rem' }}>
              {t('ranch_list.contact_ranch')}
            </Link>
            <Link to={profileUrl}
              style={{ backgroundColor: '#e59a24', color: '#fff', padding: '5px 14px', borderRadius: '4px', textDecoration: 'none', fontSize: '0.85rem' }}>
              {t('ranch_list.profile')}
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
  for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) pages.push(i);
  return (
    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', margin: '16px 0' }}>
      {page > 1 && <button onClick={() => onPageChange(page - 1)} style={btnStyle}>{t('ranch_list.prev')}</button>}
      {pages.map(p => (
        <button key={p} onClick={() => onPageChange(p)}
          style={{ ...btnStyle, backgroundColor: p === page ? '#507033' : '#fff', color: p === page ? '#fff' : '#333' }}>
          {p}
        </button>
      ))}
      {page < totalPages && <button onClick={() => onPageChange(page + 1)} style={btnStyle}>{t('ranch_list.next')}</button>}
    </div>
  );
}

const btnStyle = { padding: '5px 12px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#fff', cursor: 'pointer', fontSize: '0.85rem' };

export default function RanchList() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [nameFilter, setNameFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (window.innerWidth < 768) setSidebarCollapsed(true);
  }, []);

  const [singularTerm, setSingularTerm] = useState('');
  useEffect(() => {
    fetch(`${API_URL}/api/marketplace/species/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setSingularTerm(d.singular_term || ''))
      .catch(() => {});
  }, [slug]);

  const loadData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, name: nameFilter });
    fetch(`${API_URL}/api/ranches/list/${slug}?${params}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        setData(d ? { ...d, ranches: d.ranches || [] } : { total: 0, page: 1, per_page: 10, total_pages: 1, ranches: [] });
        setLoading(false);
      })
      .catch(() => {
        setData({ total: 0, page: 1, per_page: 10, total_pages: 1, ranches: [] });
        setLoading(false);
      });
  }, [slug, page, nameFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); };
  const rawLabel = data?.label || slug;
  const fallbackLabel = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
  const label = singularTerm || fallbackLabel;

  const handleCategoryChange = (nextCategory) => {
    if (nextCategory === 'ranches') return;
    if (nextCategory === 'studs') {
      navigate(`/marketplaces/livestock/studs/${slug}`);
      return;
    }
    navigate(`/marketplaces/livestock/${slug}`);
  };

  const handleSpeciesChange = (path) => {
    if (path) navigate(path);
  };

  return (
    <div className="min-h-screen font-sans">
      <PageMeta
        title={`${label} Ranches & Farms Directory`}
        description={`Browse ${label.toLowerCase()} ranches and farms across the United States. Find breeders, contact ranchers directly, and discover quality livestock operations on Oatmeal Farm Network.`}
        keywords={`${label.toLowerCase()} ranches, ${label.toLowerCase()} farms, ${label.toLowerCase()} breeders directory, livestock ranchers, ranch directory`}
        canonical={`https://oatmealfarmnetwork.com/marketplaces/livestock/ranches/${slug}`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: `${label} Ranches & Farms Directory`,
          url: `https://oatmealfarmnetwork.com/marketplaces/livestock/ranches/${slug}`,
          description: `Directory of ${label.toLowerCase()} ranches and farms.`
        }}
      />
      <Header />
      <LivestockHeroTabs />

      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '0.5rem 1rem 0' }}>
        <Breadcrumbs items={[
          { label: 'Home', to: '/' },
          { label: 'Marketplaces', to: '/marketplaces' },
          { label: 'Livestock', to: '/marketplaces/livestock' },
          { label: t('ranch_list.breadcrumb_ranches') },
          { label: `${label} Ranches` },
        ]} />
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        {SHOW_BROWSE_SIDEBAR && (
          <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(p => !p)} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ backgroundColor: '#441c15', padding: '12px 24px' }}>
            <h1 style={{ color: '#fff', margin: 0, fontSize: '1.4rem', fontWeight: 'bold' }}>
              {label} Ranches
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', padding: '16px', gap: '24px' }}>
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
                <RanchCategoryFilters
                  slug={slug}
                  onCategoryChange={handleCategoryChange}
                  onSpeciesChange={handleSpeciesChange}
                />
                <div style={ranchFilterBox}>
                  <label style={ranchFilterLabel}>{t('ranch_list.search_placeholder', 'Search ranches')}</label>
                  <input
                    type="text"
                    value={nameFilter}
                    onChange={e => { setNameFilter(e.target.value); setPage(1); }}
                    placeholder={t('ranch_list.search_placeholder')}
                    style={{ ...ranchSelectStyle, boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse" style={{ marginBottom: '16px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '36px', backgroundColor: '#c8a0a0' }} />
                    <div style={{ display: 'flex', padding: '12px', gap: '12px', backgroundColor: '#f9f9f9' }}>
                      <div style={{ width: '160px', height: '100px', backgroundColor: '#e8e8e8', borderRadius: '4px', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        {[...Array(3)].map((_, j) => (
                          <div key={j} style={{ height: '14px', backgroundColor: '#e8e8e8', borderRadius: '4px', marginBottom: '10px', width: j === 2 ? '40%' : '60%' }} />
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              ) : !data || data.ranches.length === 0 ? (
                <div style={{ backgroundColor: '#d1ecf1', border: '1px solid #bee5eb', borderRadius: '4px', padding: '16px' }}>
                  <h4 style={{ margin: '0 0 8px' }}>{t('ranch_list.no_ranches_title')}</h4>
                  <p style={{ margin: 0 }}>{t('ranch_list.no_ranches_body', { label })}</p>
                </div>
              ) : (
                <>
                  <div style={{ color: '#666', fontSize: '0.85rem', marginBottom: '12px' }}>
                    {t('ranch_list.ranches_found', { count: data.total })}
                  </div>
                  <Pagination page={page} totalPages={data.total_pages} onPageChange={setPage} />
                  {data.ranches.map(ranch => <RanchCard key={ranch.business_id} ranch={ranch} />)}
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
