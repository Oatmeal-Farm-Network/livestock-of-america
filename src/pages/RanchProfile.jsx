// src/pages/RanchProfile.jsx
// Public ranch profile page — /marketplaces/livestock/ranch/:businessId
import React, { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';

const API_URL = import.meta.env.VITE_LIVESTOCK_API_URL || '';
const CREAM = '#f7f2e8';
const OLIVE = '#3d6b34';
const OLIVE_DARK = '#507033';
const MAROON = '#441c15';
const LORA = "'Lora', 'Times New Roman', serif";

const SOCIAL_LINKS = [
  { key: 'facebook', icon: '/icons/facebook.png', alt: 'Facebook', base: 'https://facebook.com/' },
  { key: 'x', icon: '/icons/TwitterX.png', alt: 'Twitter/X', base: 'https://twitter.com/' },
  { key: 'instagram', icon: '/icons/instagramicon.png', alt: 'Instagram', base: 'https://instagram.com/' },
  { key: 'pinterest', icon: '/icons/PinterestLogo.png', alt: 'Pinterest', base: 'https://pinterest.com/' },
  { key: 'youtube', icon: '/icons/YouTube.jpg', alt: 'YouTube', base: 'https://youtube.com/' },
  { key: 'blog', icon: '/icons/BlogIcon.png', alt: 'Blog', base: '' },
  { key: 'truth_social', icon: '/icons/Truthsocial.png', alt: 'Truth Social', base: '' },
  { key: 'other_social1', icon: '/icons/GeneralSocialIcon.png', alt: 'Social', base: '' },
  { key: 'other_social2', icon: '/icons/GeneralSocialIcon.png', alt: 'Social', base: '' },
];

function AnimalCard({ animal, isStuds }) {
  const { t } = useTranslation();
  const [imgFailed, setImgFailed] = useState(false);
  const detailUrl = `/marketplaces/livestock/animal/${animal.animal_id}`;
  const priceLabel = isStuds ? t('ranch_profile.stud_fee', 'Stud Fee') : t('ranch_profile.price_label', 'Price');

  return (
    <div className="flex gap-3 mb-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <div style={{ width: '90px', flexShrink: 0 }}>
        {!imgFailed && animal.photo ? (
          <Link to={detailUrl}>
            <img
              src={animal.photo}
              alt={animal.full_name}
              loading="lazy"
              onError={() => setImgFailed(true)}
              style={{ width: '90px', height: '90px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #eee' }}
            />
          </Link>
        ) : (
          <div className="rounded flex items-center justify-center text-[11px] text-gray-400" style={{ width: '90px', height: '90px', backgroundColor: '#f0ede6' }}>
            {t('ranch_profile.no_photo', 'No Photo')}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <Link to={detailUrl} className="block font-bold text-gray-800 no-underline mb-1" style={{ fontSize: '1rem' }}>
          {animal.full_name}
        </Link>
        {animal.breeds?.length > 0 && <p className="text-sm text-gray-500 mb-1">{animal.breeds.join(', ')}</p>}
        <p className="text-sm mb-2">
          <strong>{priceLabel}:</strong>{' '}
          {animal.price ? `$${Math.round(animal.price).toLocaleString()}` : t('ranch_profile.call_for_price', 'Call For Price')}
        </p>
        <Link
          to={detailUrl}
          className="inline-block text-white text-xs font-semibold rounded px-3 py-1 no-underline"
          style={{ backgroundColor: OLIVE }}
        >
          {t('ranch_profile.view_details', 'View Details')}
        </Link>
      </div>
    </div>
  );
}

function AnimalsTab({ businessId, isStuds }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/ranches/profile/${businessId}/animals?page=${page}&studs_only=${isStuds}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [businessId, page, isStuds]);

  if (loading) return <div className="py-5 text-gray-400">{t('ranch_profile.loading', 'Loading…')}</div>;
  if (!data || data.animals.length === 0) {
    return (
      <div className="py-5 text-gray-400">
        {isStuds ? t('ranch_profile.no_stud_listings', 'No stud listings right now.') : t('ranch_profile.no_sale_listings', 'No animals for sale right now.')}
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-3">{t('ranch_profile.animal_count', '{{count}} animals', { count: data.total })}</p>
      {data.animals.map((a) => <AnimalCard key={a.animal_id} animal={a} isStuds={isStuds} />)}
      {data.total_pages > 1 && (
        <div className="flex gap-1 mt-4">
          {page > 1 && <button onClick={() => setPage((p) => p - 1)} style={btnStyle}>{t('ranch_profile.prev', '← Prev')}</button>}
          {page < data.total_pages && <button onClick={() => setPage((p) => p + 1)} style={btnStyle}>{t('ranch_profile.next', 'Next →')}</button>}
        </div>
      )}
    </div>
  );
}

function ContactTab({ ranch }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [sent, setSent] = useState(false);
  const [q] = useState(() => {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    return { a, b, answer: a + b };
  });
  const [userAnswer, setUserAnswer] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (parseInt(userAnswer, 10) !== q.answer) { alert(t('ranch_profile.alert_wrong_answer', 'Please answer the verification question correctly.')); return; }
    if (!formData.name || !formData.email) { alert(t('ranch_profile.alert_required', 'Name and email are required.')); return; }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <h4 className="mb-2 font-bold text-green-800">{t('ranch_profile.msg_sent', 'Message Sent!')}</h4>
        <p className="m-0 text-green-800">{t('ranch_profile.thank_you', 'Thank you — {{name}} will be in touch soon.', { name: ranch.business_name })}</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '500px' }}>
      <h3 className="mb-4 font-bold text-gray-800" style={{ fontFamily: LORA }}>
        {t('ranch_profile.contact_heading', 'Contact {{name}}', { name: ranch.business_name })}
      </h3>
      {ranch.address_city && (
        <p className="mb-4 text-sm text-gray-500">
          {[ranch.address_street, ranch.address_city, ranch.address_state, ranch.address_zip, ranch.address_country].filter(Boolean).join(', ')}
        </p>
      )}
      {ranch.email && (
        <p className="mb-4 text-sm">
          <strong>Email:</strong> <a href={`mailto:${ranch.email}`} style={{ color: OLIVE_DARK }}>{ranch.email}</a>
        </p>
      )}
      <form onSubmit={handleSubmit}>
        {[
          { id: 'name', label: t('ranch_profile.field_name', 'Name'), type: 'text', required: true },
          { id: 'email', label: t('ranch_profile.field_email', 'Email'), type: 'email', required: true },
          { id: 'phone', label: t('ranch_profile.field_phone', 'Phone'), type: 'tel', required: false, optional: true },
        ].map((f) => (
          <div key={f.id} className="mb-3">
            <label className="block mb-1 text-sm font-semibold text-gray-600">
              {f.label}
              {f.optional && <span className="ml-1 text-xs font-normal text-gray-400">{t('ranch_profile.optional', '(optional)')}</span>}
            </label>
            <input
              type={f.type}
              value={formData[f.id]}
              onChange={(e) => setFormData((p) => ({ ...p, [f.id]: e.target.value }))}
              required={f.required}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm box-border"
            />
          </div>
        ))}
        <div className="mb-3">
          <label className="block mb-1 text-sm font-semibold text-gray-600">{t('ranch_profile.field_message', 'Message')}</label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
            rows={4}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm box-border resize-y"
          />
        </div>
        <div className="mb-4 rounded bg-gray-50 p-3">
          <p className="mb-2 text-sm font-semibold">{t('ranch_profile.human_verification', 'Human verification')}</p>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold">{q.a} + {q.b} =</span>
            <input
              type="number"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="?"
              className="rounded border border-gray-300 px-2 py-1.5 text-sm"
              style={{ width: '60px' }}
            />
          </div>
        </div>
        <button
          type="submit"
          className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: OLIVE }}
        >
          {t('ranch_profile.send', 'Send Message')}
        </button>
      </form>
    </div>
  );
}

const btnStyle = { padding: '5px 12px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#fff', cursor: 'pointer', fontSize: '0.85rem' };

export default function RanchProfile() {
  const { t } = useTranslation();
  const { businessId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [ranch, setRanch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [animalCounts, setAnimalCounts] = useState({ for_sale: 0, studs: 0 });

  const activeTab = searchParams.get('tab') || 'home';
  const setTab = (tab) => setSearchParams({ tab });

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    fetch(`${API_URL}/api/ranches/profile/${businessId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { setRanch(d); setLoading(false); })
      .catch(() => setLoading(false));

    fetch(`${API_URL}/api/ranches/profile/${businessId}/animals?page=1&studs_only=false`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setAnimalCounts((prev) => ({ ...prev, for_sale: d.total })))
      .catch(() => {});
    fetch(`${API_URL}/api/ranches/profile/${businessId}/animals?page=1&studs_only=true`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setAnimalCounts((prev) => ({ ...prev, studs: d.total })))
      .catch(() => {});
  }, [businessId]);

  if (loading) {
    return (
      <div className="min-h-screen font-sans" style={{ backgroundColor: CREAM }}>
        <Header />
        <div className="mx-auto animate-pulse px-4 py-10" style={{ maxWidth: '1000px' }}>
          <div className="mb-5 rounded-lg bg-gray-200" style={{ height: '120px' }} />
          <div className="mb-4 rounded bg-gray-200" style={{ height: '40px' }} />
          <div className="rounded bg-gray-100" style={{ height: '200px' }} />
        </div>
        <Footer />
      </div>
    );
  }

  if (!ranch) {
    return (
      <div className="min-h-screen font-sans" style={{ backgroundColor: CREAM }}>
        <Header />
        <div className="px-4 py-16 text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-800" style={{ fontFamily: LORA }}>{t('ranch_profile.not_found', 'Ranch Not Found')}</h1>
          <Link to="/marketplaces/livestock" className="text-sm font-bold" style={{ color: OLIVE }}>{t('ranch_profile.back', '← Back to Marketplace')}</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const TABS = [
    { key: 'home', label: t('ranch_profile.tab_home', 'Home'), always: true },
    { key: 'animals', label: t('ranch_profile.tab_animals', 'For Sale ({{count}})', { count: animalCounts.for_sale }), show: animalCounts.for_sale > 0 },
    { key: 'studs', label: t('ranch_profile.tab_studs', 'Studs ({{count}})', { count: animalCounts.studs }), show: animalCounts.studs > 0 },
    { key: 'contact', label: t('ranch_profile.tab_contact', 'Contact'), always: true },
  ].filter((tab) => tab.always || tab.show);

  const ranchLocation = [ranch.address_city, ranch.address_state].filter(Boolean).join(', ');
  const ranchDesc = ranch.description
    ? ranch.description.replace(/<[^>]+>/g, '').slice(0, 155)
    : `${ranch.business_name}${ranchLocation ? ` in ${ranchLocation}` : ''} — livestock ranch and breeder on Livestock of America.`;

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: CREAM }}>
      <PageMeta
        title={`${ranch.business_name}${ranchLocation ? ` — ${ranchLocation}` : ''} | Ranch Profile`}
        description={ranchDesc}
        keywords={`${ranch.business_name}, ${ranchLocation}, livestock ranch, breeder, farm, ranch profile`}
        canonical={`https://livestockofamerica.com/marketplaces/livestock/ranch/${businessId}`}
        ogType="profile"
        image={ranch.header_image || ranch.logo || undefined}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: ranch.business_name,
          description: ranchDesc,
          url: `https://livestockofamerica.com/marketplaces/livestock/ranch/${businessId}`,
          ...(ranch.address_city ? {
            address: {
              '@type': 'PostalAddress',
              streetAddress: ranch.address_street || undefined,
              addressLocality: ranch.address_city || undefined,
              addressRegion: ranch.address_state || undefined,
              postalCode: ranch.address_zip || undefined,
              addressCountry: ranch.address_country || undefined,
            },
          } : {}),
          ...(ranch.email ? { email: ranch.email } : {}),
        }}
      />
      <Header />

      <div className="mx-auto px-4 pb-12" style={{ maxWidth: '1000px' }}>
        <div className="pt-2">
          <Breadcrumbs items={[
            { label: 'Home', to: '/' },
            { label: t('livestock_mkt.crumb_marketplaces', 'Marketplaces'), to: '/marketplaces' },
            { label: t('livestock_mkt.crumb_livestock', 'Livestock'), to: '/marketplaces/livestock' },
            { label: t('ranch_list.breadcrumb_ranches', 'Ranches') },
            { label: ranch.business_name },
          ]} />
        </div>

        {/* Ranch header */}
        <div className="border-b border-gray-200 py-6 text-center">
          {ranch.header_image ? (
            <img
              src={ranch.header_image}
              alt={ranch.business_name}
              style={{ maxHeight: '120px', maxWidth: '100%', objectFit: 'contain' }}
              className="mx-auto"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : ranch.logo ? (
            <img
              src={ranch.logo}
              alt={ranch.business_name}
              style={{ maxHeight: '100px', maxWidth: '100%', objectFit: 'contain' }}
              className="mx-auto"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <h1 className="text-3xl font-bold text-gray-800" style={{ fontFamily: LORA }}>{ranch.business_name}</h1>
          )}
          {(ranch.header_image || ranch.logo) && (
            <h2 className="mt-2 text-xl text-gray-800" style={{ fontFamily: LORA }}>{ranch.business_name}</h2>
          )}
          {ranchLocation && (
            <p className="mt-1 text-sm text-gray-500">{ranchLocation}</p>
          )}
        </div>

        {/* Tab navigation */}
        <div className="mb-6 flex overflow-x-auto border-b-2 border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTab(tab.key)}
              className="whitespace-nowrap px-5 py-2.5 text-sm font-semibold border-0 cursor-pointer"
              style={{
                backgroundColor: activeTab === tab.key ? MAROON : 'transparent',
                color: activeTab === tab.key ? '#fff' : '#555',
                borderBottom: activeTab === tab.key ? `2px solid ${MAROON}` : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'home' && (
          <div>
            {ranch.home_heading && <h2 className="mb-4 text-xl font-bold text-gray-800" style={{ fontFamily: LORA }}>{ranch.home_heading}</h2>}
            {ranch.home_text && <div className="mb-4 text-sm leading-relaxed text-gray-700" dangerouslySetInnerHTML={{ __html: ranch.home_text }} />}
            {ranch.home_text2 && <div className="mb-6 text-sm leading-relaxed text-gray-700" dangerouslySetInnerHTML={{ __html: ranch.home_text2 }} />}
            {!ranch.home_text && !ranch.home_text2 && ranch.description && (
              <div className="mb-6 text-sm leading-relaxed text-gray-700" dangerouslySetInnerHTML={{ __html: ranch.description }} />
            )}

            <div className="mb-4 rounded-lg bg-white border border-gray-200 p-4">
              <strong className="mb-2 block text-base text-gray-800">{ranch.business_name}</strong>
              {[ranch.address_street, ranch.address_city && `${ranch.address_city}, ${ranch.address_state} ${ranch.address_zip}`, ranch.address_country]
                .filter(Boolean)
                .map((line, i) => <p key={i} className="m-0 mb-1 text-sm text-gray-500">{line}</p>)}
              {ranch.email && (
                <p className="mt-1 text-sm">
                  <a href={`mailto:${ranch.email}`} style={{ color: OLIVE_DARK }}>{ranch.email}</a>
                </p>
              )}
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {SOCIAL_LINKS.map((s) => (ranch[s.key] ? (
                <a key={s.key} href={ranch[s.key].startsWith('http') ? ranch[s.key] : `${s.base}${ranch[s.key]}`} target="_blank" rel="noopener noreferrer">
                  <img
                    src={s.icon}
                    alt={s.alt}
                    style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </a>
              ) : null))}
            </div>

            <button
              onClick={() => setTab('contact')}
              className="rounded-lg px-6 py-2.5 font-semibold text-white"
              style={{ backgroundColor: OLIVE }}
            >
              {t('ranch_profile.contact_btn', 'Contact This Ranch')}
            </button>
          </div>
        )}

        {activeTab === 'animals' && <AnimalsTab businessId={businessId} isStuds={false} />}
        {activeTab === 'studs' && <AnimalsTab businessId={businessId} isStuds={true} />}
        {activeTab === 'contact' && <ContactTab ranch={ranch} />}
      </div>

      <Footer />
    </div>
  );
}
