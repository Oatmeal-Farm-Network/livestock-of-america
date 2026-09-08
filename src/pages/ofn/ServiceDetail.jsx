// Ported from Oatmeal Farm Network (src/ServiceDetail.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { useTranslation } from '../../lib/i18n';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import Breadcrumbs from '../../components/Breadcrumbs';

const API = import.meta.env.VITE_LIVESTOCK_API_URL || '';

export default function ServiceDetail() {
  const { t } = useTranslation();
  const { servicesId } = useParams();
  const navigate = useNavigate();
  const [svc, setSvc]           = useState(null);
  const [loading, setLoading]   = useState(true);
  const [mainPhoto, setMainPhoto] = useState(null);

  useEffect(() => {
    if (!servicesId) return;
    fetch(`${API}/api/services/public/${servicesId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        setSvc(d);
        if (d?.photos?.length) setMainPhoto(d.photos[0]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [servicesId]);

  if (loading) return (
    <div className="min-h-screen font-sans">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-400">{t('service_detail.loading')}</div>
      <Footer />
    </div>
  );

  if (!svc) return (
    <div className="min-h-screen font-sans">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">{t('service_detail.not_found')}</p>
        <Link to="/services/directory" className="text-[#3D6B34] hover:underline">{t('service_detail.back_dir')}</Link>
      </div>
      <Footer />
    </div>
  );

  const location = [svc.AddressCity, svc.AddressState].filter(Boolean).join(', ');
  const svcDesc = svc.ServiceDescription
    ? svc.ServiceDescription.replace(/<[^>]+>/g, '').slice(0, 155)
    : (svc.ServicesDescription
      ? svc.ServicesDescription.replace(/<[^>]+>/g, '').slice(0, 155)
      : `${svc.ServiceTitle}${location ? ` in ${location}` : ''}${svc.ServicesCategory ? ` — ${svc.ServicesCategory}` : ''}. Find agricultural services on Livestock Of America.`);
  const svcCanonical = `https://livestockofamerica.com/services/public/${servicesId}`;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <PageMeta
        title={`${svc.ServiceTitle} | Agricultural Services`}
        description={svcDesc}
        keywords={`${svc.ServiceTitle}, ${svc.ServicesCategory || 'farm service'}, ${svc.BusinessName || ''}, ${location}, agricultural services`}
        image={mainPhoto || undefined}
        canonical={svcCanonical}
        ogType="article"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: svc.ServiceTitle,
            description: svcDesc,
            ...(mainPhoto ? { image: mainPhoto } : {}),
            ...(svc.ServicesCategory ? { category: svc.ServicesCategory } : {}),
            provider: {
              '@type': 'LocalBusiness',
              name: svc.BusinessName,
              ...(location || svc.AddressCity ? {
                address: {
                  '@type': 'PostalAddress',
                  ...(svc.AddressCity ? { addressLocality: svc.AddressCity } : {}),
                  ...(svc.AddressState ? { addressRegion: svc.AddressState } : {}),
                },
              } : {}),
              ...(svc.ServicePhone ? { telephone: svc.ServicePhone } : {}),
            },
            ...(svc.ServicePrice && !svc.ServiceContactForPrice ? {
              offers: {
                '@type': 'Offer',
                price: svc.ServicePrice,
                priceCurrency: 'USD',
              }
            } : {}),
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://livestockofamerica.com' },
              { '@type': 'ListItem', position: 2, name: 'Services Directory', item: 'https://livestockofamerica.com/services/directory' },
              ...(svc.ServicesCategory ? [{ '@type': 'ListItem', position: 3, name: svc.ServicesCategory, item: `https://livestockofamerica.com/services/directory/${svc.ServiceCategoryID}` }, { '@type': 'ListItem', position: 4, name: svc.ServiceTitle, item: svcCanonical }] : [{ '@type': 'ListItem', position: 3, name: svc.ServiceTitle, item: svcCanonical }]),
            ],
          },
        ]}
      />
      <Header />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <Breadcrumbs items={[
          { label: 'Home', to: '/' },
          { label: 'Services Directory', to: '/services/directory' },
          ...(svc.ServicesCategory ? [{
            label: svc.ServicesCategory,
            to: `/services/directory/${svc.ServiceCategoryID}`,
          }] : []),
          { label: svc.ServiceTitle },
        ]} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Left: photos */}
          <div>
            {mainPhoto ? (
              <img src={mainPhoto}
                alt={svc.photo_captions?.[svc.photos?.indexOf(mainPhoto)] || svc.ServiceTitle}
                className="w-full rounded-xl object-cover max-h-80 mb-3"
                onError={e => e.target.style.display = 'none'} />
            ) : (
              <div className="w-full rounded-xl bg-gray-100 flex items-center justify-center h-64 mb-3 text-5xl">🔧</div>
            )}

            {/* Thumbnail strip */}
            {svc.photos?.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {svc.photos.map((p, i) => (
                  <button key={i} onClick={() => setMainPhoto(p)}
                    className={`rounded-lg overflow-hidden border-2 transition-all ${mainPhoto === p ? 'border-[#3D6B34]' : 'border-gray-200'}`}>
                    {/* Prefer the caption the owner wrote over a bare index. */}
                    <img src={p}
                      alt={svc.photo_captions?.[i] || `${svc.ServiceTitle} photo ${i + 1}`}
                      className="w-16 h-16 object-cover"
                      onError={e => e.target.style.display = 'none'} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: details */}
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">{svc.ServiceTitle}</h1>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              {svc.ServicesCategory && (
                <Link to={`/services/directory/${svc.ServiceCategoryID}`}
                  className="inline-block text-xs font-medium bg-[#3D6B34]/10 text-[#3D6B34] px-3 py-1 rounded-full no-underline hover:bg-[#3D6B34]/20">
                  {svc.ServicesCategory}
                </Link>
              )}
              {/* Not a link: the directory browses by category only. */}
              {svc.ServiceSubCategoryName && (
                <span className="inline-block text-xs font-medium bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                  {svc.ServiceSubCategoryName}
                </span>
              )}
            </div>

            {/* Price */}
            <div className="mb-4">
              {svc.ServiceContactForPrice ? (
                <span className="text-lg text-gray-500 italic">{t('service_detail.contact_for_price')}</span>
              ) : svc.ServicePrice ? (
                <span className="text-2xl font-bold text-[#3D6B34]">
                  ${parseFloat(svc.ServicePrice).toLocaleString()}
                </span>
              ) : null}
            </div>

            {/* Availability */}
            {svc.ServiceAvailable && (
              <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{svc.ServiceAvailable}</span>
              </div>
            )}

            {/* Description */}
            {svc.ServicesDescription && (
              <div className="text-gray-700 text-sm leading-relaxed mb-6 whitespace-pre-line">
                {svc.ServicesDescription}
              </div>
            )}

            {/* Provider info */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">{t('service_detail.provided_by')}</p>
              <Link to={`/profile?BusinessID=${svc.BizID || svc.BusinessID}`}
                className="font-bold text-gray-800 text-base hover:text-[#3D6B34] no-underline block mb-1">
                {svc.BusinessName}
              </Link>
              {location && <p className="text-sm text-gray-500 mb-2">{location}</p>}
              {svc.ServicePhone && (
                <p className="text-sm text-gray-600 mb-1">
                  📞 <a href={`tel:${svc.ServicePhone}`} className="hover:underline">{svc.ServicePhone}</a>
                </p>
              )}
              {svc.Serviceemail && (
                <p className="text-sm text-gray-600 mb-1">
                  ✉️ <a href={`mailto:${svc.Serviceemail}`} className="hover:underline">{svc.Serviceemail}</a>
                </p>
              )}
              {svc.Servicewebsite && (
                <p className="text-sm text-gray-600 mb-3">
                  🌐 <a href={svc.Servicewebsite.startsWith('http') ? svc.Servicewebsite : `https://${svc.Servicewebsite}`}
                    target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {svc.Servicewebsite}
                  </a>
                </p>
              )}
              <Link to={`/profile?BusinessID=${svc.BizID || svc.BusinessID}`}
                className="inline-block mt-1 bg-[#3D6B34] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#2d5226] no-underline transition-colors">
                {t('service_detail.view_profile')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
