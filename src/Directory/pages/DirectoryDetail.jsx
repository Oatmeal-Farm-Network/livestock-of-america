import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router';
import { useTranslation } from '../../lib/i18n';
import { API_ENDPOINTS } from '../config';
import { DIRECTORY_TYPE_TO_IMAGE, DIRECTORY_TYPE_TO_BUSINESS_TYPE } from './directoryMappings';
import photoNotAvailable from '../images/photo not available .jpg';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import Breadcrumbs from '../../components/Breadcrumbs';

const DIRECTORY_TYPE_TO_BUSINESS_TYPE_ID = {
    'agricultural-associations': '1',
    'artisan-producers': '11',
    'business-resources': '28',
    'crafter-organizations': '15',
    'farmers-markets': '29',
    'farms-ranches': '8',
    'fiber-cooperatives': '25',
    'fiber-mills': '18',
    'fisheries': '22',
    'fishermen': '23',
    'food-cooperatives': '14',
    'food-hubs': '18',
    'grocery-stores': '26',
    'herb-and-tea-producer': '31',
    'hunger-relief-organizations': '35',
    'manufacturers': '16',
    'marinas': '21',
    'meat-wholesalers': '19',
    'real-estate-agents': '30',
    'restaurants': '9',
    'retailers': '24',
    'service-providers': '20',
    'transporter': '32',
    'universities': '27',
    'veterinarians': '17',
    'vineyards': '34',
    'wineries': '33',
    'others': '3',
};

function fixUrl(val) {
    if (!val || val.trim() === '') return null;
    if (val.startsWith('http')) return val;
    return 'https://' + val;
}

function SocialLinks({ business }) {
    const links = [
        { url: fixUrl(business.BusinessFacebook),     icon: '/icons/facebook.png',         alt: 'Facebook' },
        { url: fixUrl(business.BusinessX),            icon: '/icons/TwitterX.png',          alt: 'Twitter/X' },
        { url: fixUrl(business.BusinessInstagram),    icon: '/icons/instagramicon.png',     alt: 'Instagram' },
        { url: fixUrl(business.BusinessLinkedIn),     icon: '/icons/LinkedIcon.png',        alt: 'LinkedIn' },
        { url: fixUrl(business.BusinessPinterest),    icon: '/icons/PinterestLogo.png',     alt: 'Pinterest' },
        { url: fixUrl(business.BusinessYouTube),      icon: '/icons/YouTube.jpg',           alt: 'YouTube' },
        { url: fixUrl(business.BusinessTruthSocial),  icon: '/icons/Truthsocial.png',       alt: 'Truth Social' },
        { url: fixUrl(business.BusinessBlog),         icon: '/icons/BlogIcon.png',          alt: 'Blog' },
        { url: fixUrl(business.BusinessOtherSocial1), icon: '/icons/GeneralSocialIcon.png', alt: 'Social Media' },
        { url: fixUrl(business.BusinessOtherSocial2), icon: '/icons/GeneralSocialIcon.png', alt: 'Social Media' },
    ].filter(l => l.url !== null);

    if (links.length === 0) return null;
    return (
        <div className="flex gap-1.5 flex-wrap mt-2">
            {links.map((l, i) => (
                <a key={i} href={l.url} target="_blank" rel="noopener noreferrer">
                    <img src={l.icon} alt={l.alt} style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                </a>
            ))}
        </div>
    );
}

function Pagination({ currentPage, totalPages, onPageChange }) {
    const { t } = useTranslation();
    if (totalPages <= 1) return null;

    let pages = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        let start = Math.max(1, currentPage - 2);
        let end   = Math.min(totalPages, currentPage + 2);
        if (currentPage <= 3) end   = Math.min(totalPages, 5);
        if (currentPage >= totalPages - 2) start = Math.max(1, totalPages - 4);
        for (let j = start; j <= end; j++) pages.push(j);
    }

    return (
        <div className="flex gap-1 flex-wrap items-center mb-4">
            {pages.map(p => (
                <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    className="w-9 h-9 text-sm font-bold rounded-lg transition-all"
                    style={{
                        backgroundColor: currentPage === p ? '#3D6B34' : '#fff',
                        color:           currentPage === p ? '#fff'    : '#3D6B34',
                        border:          '1px solid #3D6B34',
                    }}
                >
                    {p}
                </button>
            ))}
            {currentPage < totalPages && (
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    className="px-3 h-9 text-sm font-bold rounded-lg transition-all"
                    style={{ backgroundColor: '#fff', color: '#3D6B34', border: '1px solid #3D6B34' }}
                >
                    &rsaquo;
                </button>
            )}
            {totalPages > 5 && (
                <button
                    onClick={() => onPageChange(totalPages)}
                    className="px-3 h-9 text-sm font-bold rounded-lg transition-all"
                    style={{ backgroundColor: '#fff', color: '#3D6B34', border: '1px solid #3D6B34' }}
                >
                    {t('directory_detail.btn_last')}
                </button>
            )}
        </div>
    );
}

function BusinessCard({ business, onProfileClick }) {
    const { t } = useTranslation();
    return (
        <div className="flex bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md hover:border-[#819360] transition-all duration-200">
            {/* Left: logo */}
            <div
                className="shrink-0 flex items-center justify-center bg-gray-50 border-r border-gray-100 cursor-pointer"
                style={{ width: '130px', height: '130px' }}
                onClick={() => onProfileClick(business)}
            >
                <img
                    loading="lazy"
                    src={business.ProfileImage || photoNotAvailable}
                    alt={business.BusinessName + ' logo'}
                    style={{ width: '110px', height: '110px', objectFit: 'contain', borderRadius: '6px' }}
                    onError={e => { e.target.onerror = null; e.target.src = photoNotAvailable; }}
                />
            </div>

            {/* Right: info */}
            <div className="flex flex-col justify-between px-5 py-4 flex-1 min-w-0">
                <div>
                    <button
                        onClick={() => onProfileClick(business)}
                        className="font-bold text-sm hover:underline text-left"
                        style={{ color: '#3D6B34', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                    >
                        {business.BusinessName}
                    </button>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: '#819360' }}>
                        {[business.AddressCity, business.AddressState, business.AddressCountry].filter(Boolean).join(', ')}
                    </p>
                    {business.BusinessWebsite && (
                        <a
                            href={fixUrl(business.BusinessWebsite)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs hover:underline block mt-1 truncate"
                            style={{ color: '#c47d00' }}
                        >
                            {business.BusinessWebsite}
                        </a>
                    )}
                    <SocialLinks business={business} />
                </div>
                <div className="mt-3">
                    <button
                        onClick={() => onProfileClick(business)}
                        className="text-xs font-bold hover:underline"
                        style={{ color: '#3D6B34', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                    >
                        {t('directory_detail.btn_view_profile')}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Accumulating type-ahead for <select> elements.
// Appends each printable key to a buffer and jumps to the first option whose
// text starts with the buffer. Resets after 1 second of no typing.
function useSelectTypeahead(options, onSelect) {
    const bufRef    = useRef('');
    const timerRef  = useRef(null);
    return useCallback((e) => {
        if (e.key.length !== 1) return; // ignore arrows, backspace, etc.
        clearTimeout(timerRef.current);
        bufRef.current += e.key.toLowerCase();
        const buf = bufRef.current;
        const match = options.find(o => o.toLowerCase().startsWith(buf));
        if (match) onSelect(match);
        timerRef.current = setTimeout(() => { bufRef.current = ''; }, 1000);
    }, [options, onSelect]);
}

const DirectoryDetail = function () {
    const { t } = useTranslation();
    const { directoryType } = useParams();
    const navigate  = useNavigate();
    const location  = useLocation();
    const backState = location.state;

    const [countries, setCountries]           = useState([]);
    const [states, setStates]                 = useState([]);
    const [businesses, setBusinesses]         = useState([]);
    const [selectedCountry, setSelectedCountry] = useState(backState?.selectedCountry || '');
    const [selectedState, setSelectedState]   = useState(backState?.selectedState || '');

    const countryTypeahead = useSelectTypeahead(countries, c => { setSelectedCountry(c); setSelectedState(''); });
    const stateTypeahead   = useSelectTypeahead(states.map(s => s.name), setSelectedState);
    const [nameFilter, setNameFilter]         = useState(backState?.nameFilter || '');
    const [appliedCountry, setAppliedCountry] = useState(backState?.selectedCountry || '');
    const [appliedState, setAppliedState]     = useState(backState?.selectedState || '');
    const [appliedName, setAppliedName]       = useState(backState?.nameFilter || '');
    const [loading, setLoading]               = useState(true);
    const [error, setError]                   = useState(null);
    const [currentPage, setCurrentPage]       = useState(1);
    const itemsPerPage = 24;

    const CATEGORY_HEADERS = {
        'agricultural-associations': '/images/AgricuturalAssociationsHeader.webp',
        'artisan-producers':         '/images/ArtisanProducersHeader.webp',
        'business-resources':        '/images/BusinessResources.webp',
        'crafter-organizations':     '/images/CraftersHeader.webp',
        'farmers-markets':           '/images/FarmersMarketHeader.webp',
        'farms-ranches':             '/images/farmsHeader.webp',
        'fiber-cooperatives':        '/images/FibercooperativeHeader.webp',
        'fiber-mills':               '/images/FiberMillHeader.webp',
        'fisheries':                 '/images/FisheryHeader.webp',
        'fishermen':                 '/images/FishermenHeader.webp',
        'food-cooperatives':         '/images/FoodCoopHeader.webp',
        'food-hubs':                 '/images/FoodHubHeader.webp',
        'grocery-stores':            '/images/GroceryStoreHeader.webp',
        'hunger-relief-organizations': '/images/HungerReleifOrgHeader.webp',
        'manufacturers':             '/images/ManufacturingHeader.webp',
        'marinas':                   '/images/MarinaHeader.webp',
        'restaurants':               '/images/RestaurantHeader.webp',
        'retailers':                 '/images/RetailerHeader.webp',
        'wineries':                  '/images/WineryHeader.webp',
        'vineyards':                 '/images/VineyardHeader.webp',
        'veterinarians':             '/images/VetrinarianHeader.webp',
        'universities':              '/images/UniversityHeader.webp',
        'service-providers':         '/images/ServiceProviderHeader.webp',
        'meat-wholesalers':          '/images/MeatWholesalerHeader.webp',
        'real-estate-agents':        '/images/RealEstateHeader.webp',
    };

    const CATEGORY_TEXT = {
        'business-resources': t('directory_detail.cat_text_business_resources'),
    };

    const businessType = DIRECTORY_TYPE_TO_BUSINESS_TYPE_ID[directoryType] || directoryType;
    const PAGE_TITLE_OVERRIDES = {
        'farms-ranches': 'Farms & Ranches',
    };
    const pageTitle = PAGE_TITLE_OVERRIDES[directoryType] ?? directoryType
        .replace(/-/g, ' ')
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    const categoryIcon = DIRECTORY_TYPE_TO_IMAGE?.[directoryType] || null;

    useEffect(() => { if (backState) window.history.replaceState({}, document.title); }, []);

// Each entry: keys = any substring that must appear in the DB country name,
    // excludes = substrings that must NOT appear (prevents false matches).
    const FALLBACK_SPECS = [
        { keys: ['canada'],                   excludes: [] },
        { keys: ['india'],                    excludes: ['ocean', 'territory', 'british'] },
        { keys: ['malaysia'],                 excludes: [] },
        { keys: ['usa', 'united states'],     excludes: ['minor', 'outlying'] },
    ];
    // Hard-coded last-resort names (if the reference API is also unavailable).
    const FALLBACK_COUNTRIES = ['Canada', 'India', 'Malaysia', 'United States'];

    useEffect(() => {
        fetch(`${API_ENDPOINTS.COUNTRIES}?business_type_id=${encodeURIComponent(businessType)}`)
            .then(r => r.ok ? r.json() : [])
            .then(data => {
                if (data.length > 0) { setCountries(data); return; }
                // No listings yet — pull the reference country list so that the names
                // exactly match what the states endpoint's JOIN uses.
                fetch(API_ENDPOINTS.COUNTRIES)
                    .then(r => r.ok ? r.json() : [])
                    .then(all => {
                        const matches = FALLBACK_SPECS.flatMap(spec => {
                            const hit = all.find(c => {
                                const lower = c.toLowerCase();
                                return spec.keys.some(k => lower === k || lower.includes(k)) &&
                                       !spec.excludes.some(ex => lower.includes(ex));
                            });
                            return hit ? [hit] : [];
                        });
                        setCountries(matches.length > 0 ? matches : FALLBACK_COUNTRIES);
                    })
                    .catch(() => setCountries(FALLBACK_COUNTRIES));
            })
            .catch(() => setCountries(FALLBACK_COUNTRIES));
    }, [businessType]);

    // Display labels for the country dropdown — keeps the DB name as the option value
    // (needed for the states endpoint JOIN) but shows a friendlier label to users.
    const COUNTRY_DISPLAY = (name) => {
        const lower = name.toLowerCase();
        if ((lower === 'usa' || lower.includes('united states')) &&
            !lower.includes('minor') && !lower.includes('outlying'))
            return 'USA';
        return name;
    };

    useEffect(() => {
        if (!selectedCountry) { setStates([]); setSelectedState(''); return; }
        fetch(API_ENDPOINTS.STATES + '?country=' + encodeURIComponent(selectedCountry))
            .then(r => r.ok ? r.json() : [])
            .then(data => setStates(data || []))
            .catch(() => setStates([]));
    }, [selectedCountry]);

    useEffect(() => {
        setLoading(true);
        setError(null);
        let url = API_ENDPOINTS.BUSINESSES + '?BusinessTypeID=' + encodeURIComponent(businessType);
        if (appliedCountry) url += '&country=' + encodeURIComponent(appliedCountry);
        if (appliedState)   url += '&state='   + encodeURIComponent(appliedState);
        fetch(url)
            .then(r => { if (!r.ok) throw new Error('Failed to fetch: ' + r.statusText); return r.json(); })
            .then(data => { setBusinesses(data || []); setLoading(false); })
            .catch(err => { setError(err.message); setLoading(false); });
    }, [appliedCountry, appliedState, businessType]);

    useEffect(() => { setCurrentPage(1); }, [appliedCountry, appliedState, nameFilter]);

    function handleApplyFilters() {
        setAppliedCountry(selectedCountry);
        setAppliedState(selectedState);
        setAppliedName(nameFilter);
        setCurrentPage(1);
    }

    function handleProfileClick(business) {
        navigate(`/directory/business/${business.BusinessID}`, {
            state: { business, directoryType, selectedCountry: appliedCountry, selectedState: appliedState, nameFilter },
        });
    }

    function handlePageChange(page) {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Live name search (filters as you type) + drop blank names.
    const nameQuery = nameFilter.trim().toLowerCase();
    const filteredBusinesses = businesses
        .filter(b =>
            b.BusinessName && b.BusinessName.trim() !== '' &&
            b.BusinessName.toLowerCase().includes(nameQuery)
        )
        // Real (letter-first) names ahead of symbol/number-led names, then A→Z.
        .sort((a, b) => {
            const na = a.BusinessName.trim();
            const nb = b.BusinessName.trim();
            const ra = /^[a-z]/i.test(na) ? 0 : 1;
            const rb = /^[a-z]/i.test(nb) ? 0 : 1;
            if (ra !== rb) return ra - rb;
            return na.toLowerCase().localeCompare(nb.toLowerCase());
        });
    const totalPages       = Math.ceil(filteredBusinesses.length / itemsPerPage) || 1;
    const startIndex       = (currentPage - 1) * itemsPerPage;
    const currentBusinesses = filteredBusinesses.slice(startIndex, startIndex + itemsPerPage);

    // Alpha jump-bar: which first-letters exist, and a jump-to-that-page helper.
    const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const availableLetters = new Set(
        filteredBusinesses
            .map(b => (b.BusinessName.trim()[0] || '').toUpperCase())
            .filter(ch => ch >= 'A' && ch <= 'Z')
    );
    const jumpToLetter = (letter) => {
        const idx = filteredBusinesses.findIndex(
            b => (b.BusinessName.trim()[0] || '').toUpperCase() === letter
        );
        if (idx >= 0) {
            setCurrentPage(Math.floor(idx / itemsPerPage) + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen font-sans" style={{ backgroundColor: '#f7f2e8' }}>
            <PageMeta
                title={`${pageTitle} Directory | Farm & Food Business Listings`}
                description={`Find ${pageTitle.toLowerCase()} businesses near you. Browse verified listings with contact information, location, and details on Livestock of America by Oatmeal AI.`}
                keywords={`${pageTitle}, ${pageTitle.toLowerCase()} directory, local ${pageTitle.toLowerCase()}, farm directory, food business listings`}
                canonical={`https://livestockofamerica.com/directory/${directoryType}`}
                jsonLd={{
                    '@context': 'https://schema.org',
                    '@type': 'CollectionPage',
                    name: `${pageTitle} Directory`,
                    description: `Directory of ${pageTitle.toLowerCase()} on Livestock of America by Oatmeal AI.`,
                    url: `https://livestockofamerica.com/directory/${directoryType}`,
                }}
            />
            <Header />

            <div className="mx-auto px-4 pt-4" style={{ maxWidth: '1400px' }}>
                <Breadcrumbs items={[
                    { label: t('directory_detail.breadcrumb_home'), to: '/' },
                    { label: t('directory_detail.breadcrumb_directory'), to: '/directory' },
                    { label: pageTitle },
                ]} />
            </div>

            {/* ── Hero ── */}
            <div className="mx-auto px-4 pt-2" style={{ maxWidth: '1400px' }}>
                <div className="relative w-full overflow-hidden rounded-xl">
                    {CATEGORY_HEADERS[directoryType] && (
                        <img
                            src={CATEGORY_HEADERS[directoryType]}
                            alt={pageTitle}
                            className="w-full object-cover"
                            style={{ height: '250px', display: 'block' }}
                            loading="eager"
                            onError={e => { e.target.style.display = 'none'; }}
                        />
                    )}
                    {CATEGORY_HEADERS[directoryType] && (
                        <div
                            className="absolute inset-0"
                            style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.72) 45%, rgba(255,255,255,0) 75%)' }}
                        />
                    )}
                    <div
                        className={CATEGORY_HEADERS[directoryType] ? 'absolute inset-0 flex flex-col justify-center px-8 py-6' : 'flex flex-col gap-3 px-2 py-4'}
                        style={{ maxWidth: '780px' }}
                    >
                        <div className="flex items-center gap-3 mb-3">
                            {categoryIcon && (
                                <img src={categoryIcon} alt={pageTitle} style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
                            )}
                            <h1
                                style={{
                                    color: '#000000',
                                    fontFamily: "'Lora','Times New Roman',serif",
                                    fontSize: '2rem',
                                    fontWeight: 'bold',
                                    margin: 0,
                                    lineHeight: 1.2,
                                }}
                            >
                                {pageTitle}
                            </h1>
                        </div>
                        {CATEGORY_TEXT[directoryType] && (
                            <p style={{ color: '#111111', fontSize: '0.88rem', margin: '0 0 10px', lineHeight: 1.6, maxWidth: '560px' }}>
                                {CATEGORY_TEXT[directoryType]}
                            </p>
                        )}
                        <Link
                            to="/directory"
                            style={{
                                display: 'inline-block',
                                backgroundColor: '#3D6B34',
                                color: '#fff',
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                padding: '7px 18px',
                                borderRadius: '6px',
                                textDecoration: 'none',
                                width: 'fit-content',
                            }}
                        >
                            {t('directory_detail.btn_all_categories')}
                        </Link>
                    </div>
                </div>
            </div>

            <div className="mx-auto px-4 py-8" style={{ maxWidth: '1400px' }}>

                {/* ── Filter card ── */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex gap-4 flex-wrap items-end mb-4">
                        <div className="flex flex-col gap-1.5 flex-1" style={{ minWidth: '160px' }}>
                            <label className="text-xs font-semibold text-gray-600">{t('directory_detail.lbl_country')}</label>
                            <select
                                value={selectedCountry}
                                onChange={e => { setSelectedCountry(e.target.value); setSelectedState(''); }}
                                onKeyDown={countryTypeahead}
                                className="border border-gray-300 rounded-lg text-sm text-gray-700"
                                style={{ padding: '8px 10px' }}
                            >
                                <option value="">{t('directory_detail.opt_select_country')}</option>
                                {countries.map(c => <option key={c} value={c}>{COUNTRY_DISPLAY(c)}</option>)}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1.5 flex-1" style={{ minWidth: '160px' }}>
                            <label className="text-xs font-semibold text-gray-600">{t('directory_detail.lbl_state')}</label>
                            <select
                                value={selectedState}
                                onChange={e => setSelectedState(e.target.value)}
                                onKeyDown={stateTypeahead}
                                disabled={states.length === 0}
                                className="border border-gray-300 rounded-lg text-sm text-gray-700"
                                style={{ padding: '8px 10px' }}
                            >
                                <option value="">{t('directory_detail.opt_any')}</option>
                                {states.map(s => <option key={s.StateIndex} value={s.name}>{s.name}</option>)}
                            </select>
                        </div>

<div className="flex flex-col gap-1.5" style={{ minWidth: '200px', flex: 2 }}>
                            <label className="text-xs font-semibold text-gray-600">{t('directory_detail.lbl_business_name')}</label>
                            <input
                                type="text"
                                value={nameFilter}
                                onChange={e => setNameFilter(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleApplyFilters()}
                                placeholder={t('directory_detail.placeholder_search')}
                                className="border border-gray-300 rounded-lg text-sm text-gray-700"
                                style={{ padding: '8px 10px' }}
                            />
                        </div>

                        <button
                            onClick={handleApplyFilters}
                            style={{
                                backgroundColor: '#3D6B34',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '8px 24px',
                                fontSize: '0.85rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                alignSelf: 'flex-end',
                            }}
                        >
                            {t('directory_detail.btn_apply_filters')}
                        </button>
                    </div>
                </div>

                {/* ── Results heading ── */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">
                        {t('directory_detail.listings_heading', { type: pageTitle })}
                    </h2>
                    {!loading && filteredBusinesses.length > 0 && (
                        <span className="text-sm text-gray-400">
                            {t('directory_detail.results_range', { from: startIndex + 1, to: Math.min(startIndex + itemsPerPage, filteredBusinesses.length), total: filteredBusinesses.length })}
                        </span>
                    )}
                </div>

                {error && <p className="text-red-500 mb-4">Error: {error}</p>}

                {/* ── Alpha jump-bar ── */}
                {!loading && filteredBusinesses.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                        {ALPHABET.map((letter) => {
                            const has = availableLetters.has(letter);
                            return (
                                <button
                                    key={letter}
                                    type="button"
                                    disabled={!has}
                                    onClick={() => jumpToLetter(letter)}
                                    title={has ? `Jump to ${letter}` : `No listings under ${letter}`}
                                    style={{
                                        width: 26,
                                        height: 26,
                                        borderRadius: 6,
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        border: `1px solid ${has ? '#3D6B34' : '#e5e7eb'}`,
                                        background: '#fff',
                                        color: has ? '#3D6B34' : '#cbd5e1',
                                        cursor: has ? 'pointer' : 'default',
                                    }}
                                >
                                    {letter}
                                </button>
                            );
                        })}
                    </div>
                )}

                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />

                {/* ── Business cards ── */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 animate-pulse" style={{ height: '130px' }}>
                                <div className="shrink-0 bg-gray-200" style={{ width: '130px' }} />
                                <div className="flex-1 px-5 py-4 space-y-2">
                                    <div className="bg-gray-200 h-4 rounded w-3/4" />
                                    <div className="bg-gray-200 h-3 rounded w-1/2" />
                                    <div className="bg-gray-200 h-3 rounded w-2/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : currentBusinesses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {currentBusinesses.map((business, i) => (
                            <BusinessCard key={startIndex + i} business={business} onProfileClick={handleProfileClick} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 text-center text-gray-500 py-16">
                        {t('directory_detail.no_results')}
                    </div>
                )}

                <div className="mt-6">
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                </div>

            </div>

            <Footer />
        </div>
    );
};

export default DirectoryDetail;
