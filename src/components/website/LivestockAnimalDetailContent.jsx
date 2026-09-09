// LivestockAnimalDetailContent, lifted from Oatmeal Farm Network's
// LivestockAnimalDetail.jsx so the website builder and the published sites
// can render an animal inside a customer's own page.
//
// Kept separate rather than split out of this site's own
// pages/LivestockAnimalDetail.jsx: that page has diverged (SaveButton, the
// progeny link, alt-text work) and is live, so refactoring it to expose a
// Content export would risk a working page for no user-visible gain.
// src/LivestockAnimalDetail.jsx
// Public animal detail page — /marketplaces/livestock/animal/:id
// Also handles legacy redirect: /livestockmarketplace/Animals/Details.asp?ID=xxx
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router';
import { useTranslation } from '../../lib/i18n';
import PageMeta from '../../components/PageMeta';
import { useLanguage } from '../../lib/LanguageContext';

const API_URL = import.meta.env.VITE_LIVESTOCK_API_URL || 'http://127.0.0.1:8000';

// Lifted with the component: the extraction cut the file above these, so the
// component referenced them and they were not there.
function formatPrice(n) {
  if (n == null) return null;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function formatDOB({ month, day, year }) {
  const parts = [];
  if (month && String(month) !== '0') parts.push(String(month).padStart(2, '0'));
  if (day   && String(day)   !== '0') parts.push(String(day).padStart(2, '0'));
  if (year  && String(year)  !== '0') parts.push(String(year));
  return parts.join('/') || null;
}


// ── Legacy redirect component ─────────────────────────────────────────────────

export function LivestockAnimalDetailContent({
  animal,
  siteMode = false,
  onBack,
  backLabel = 'Listings',
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
  primaryColor = '#3D6B34',
  fontFamily,
  animalPackages: passedPackages,
  onPackageClick,
}) {
  const { t } = useTranslation();
  const [fetchedPackages, setFetchedPackages] = useState([]);
  useEffect(() => {
    if (passedPackages || !animal?.animal_id) return;
    fetch(`${API_URL}/api/website/content/animal-packages?animal_id=${animal.animal_id}`)
      .then(r => r.ok ? r.json() : [])
      .then(d => setFetchedPackages(Array.isArray(d) ? d : []))
      .catch(() => setFetchedPackages([]));
  }, [animal?.animal_id, passedPackages]);
  const animalPackages = passedPackages || fetchedPackages;

  if (!animal) return null;
  const { pricing, owner, ancestry, photos, awards, fiber_stats, registrations } = animal;
  const dob = formatDOB(animal.dob || {});

  const priceDisplay = pricing.free
    ? t('livestock_animal.free')
    : pricing.sold
    ? null
    : pricing.price
    ? formatPrice(pricing.price)
    : null;

  const studFeeDisplay = !animal.sold && (animal.publish_stud || pricing.stud_fee)
    ? (pricing.stud_fee ? formatPrice(pricing.stud_fee) : t('livestock_animal.call_for_fee'))
    : null;

  const backSlug = animal.species_slug;
  const backCrumbLabel = animal.species_singular ? `${animal.species_singular}s` : 'Livestock';

  return (
    <div className="mx-auto px-4 py-6" style={{ maxWidth: '1200px', fontFamily }}>

      {!siteMode && (
        <Breadcrumbs items={[
          { label: 'Home', to: '/' },
          { label: t('livestock_mkt.crumb_marketplaces'), to: '/marketplaces' },
          { label: t('livestock_mkt.crumb_livestock'), to: '/marketplaces/livestock' },
          ...(backSlug ? [{ label: backCrumbLabel, to: `/marketplaces/livestock/${backSlug}` }] : []),
          { label: animal.full_name },
        ]} />
      )}

      {siteMode && onBack && (
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: primaryColor, fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}
        >
          {t('livestock_animal.back_label', { label: backLabel })}
        </button>
      )}

      {animal.last_updated && (
        <p className="text-xs text-gray-400 mb-4">
          {t('livestock_animal.last_updated', { date: new Date(animal.last_updated).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) })}
        </p>
      )}

      <h1 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: fontFamily || "'Lora','Times New Roman',serif" }}>
        {animal.full_name}
      </h1>

      <div className="flex flex-wrap gap-2 mb-6">
        {animal.sold && (
          <span className="inline-block bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full">{t('livestock_animal.sold')}</span>
        )}
        {animal.sale_pending && !animal.sold && (
          <span className="inline-block bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full">{t('livestock_animal.sale_pending')}</span>
        )}
        {animal.publish_stud && !animal.sold && (
          <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">{t('livestock_animal.stud_available')}</span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Left column: combined info card ── */}
        <div className="space-y-5">

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">

            {/* Pricing / key stats */}
            <div>
              {pricing.price_comments && (
                <p className="text-sm font-semibold text-gray-700 mb-3">{pricing.price_comments}</p>
              )}
              <table className="w-full text-sm">
                <tbody>
                  {priceDisplay && (
                    <StatRow label={t('livestock_animal.label_price')}>
                      <span className="font-bold text-lg" style={{ color: primaryColor }}>{priceDisplay}</span>
                      {pricing.obo && <span className="ml-2 text-xs text-gray-500">{t('livestock_animal.obo')}</span>}
                    </StatRow>
                  )}
                  {pricing.discount > 0 && priceDisplay && (
                    <StatRow label={t('livestock_animal.label_discount')}>
                      <span className="text-red-600 font-bold">{pricing.discount}% off</span>
                      <span className="ml-2 text-gray-500 line-through">{priceDisplay}</span>
                      <span className="ml-2 font-bold text-red-600">
                        {formatPrice(pricing.price * (1 - pricing.discount / 100))}
                      </span>
                    </StatRow>
                  )}
                  {studFeeDisplay && (
                    <StatRow label={t('livestock_animal.label_stud_fee')}>
                      <span className="font-bold" style={{ color: primaryColor }}>{studFeeDisplay}</span>
                    </StatRow>
                  )}
                  {dob && <StatRow label={t('livestock_animal.label_dob')} value={dob} />}
                  {(() => {
                    const seen = new Set();
                    return (registrations || [])
                      .filter(r => {
                        const key = `${r.type}|${r.number}`;
                        if (seen.has(key)) return false;
                        seen.add(key);
                        return true;
                      })
                      .map((r, i) => (
                        <StatRow key={i} label={r.type} value={r.number} />
                      ));
                  })()}
                  <StatRow label={t('livestock_animal.label_species')} value={animal.species_singular} />
                  {animal.breeds && animal.breeds.length > 0 && (
                    <StatRow label={animal.breeds.length > 1 ? t('livestock_animal.label_breeds') : t('livestock_animal.label_breed')} value={animal.breeds.join(', ')} />
                  )}
                  {animal.category && String(animal.category) !== '0' && (
                    <StatRow label={t('livestock_animal.label_category')} value={animal.category} />
                  )}
                  {animal.colors && animal.colors.length > 0 && (
                    <StatRow label={t('livestock_animal.label_color')} value={animal.colors.join(' / ')} />
                  )}
                  {animalPackages.length > 0 && (
                    <StatRow label={animalPackages.length === 1 ? t('livestock_animal.label_package') : t('livestock_animal.label_packages')}>
                      {animalPackages.map((pkg, i) => (
                        <span key={pkg.PackageID}>
                          {onPackageClick ? (
                            <a onClick={() => onPackageClick(pkg.PackageID)}
                              style={{ color: primaryColor, cursor: 'pointer', fontWeight: 600, textDecoration: 'underline', textDecorationColor: primaryColor + '44' }}>
                              {pkg.Title}{pkg.PackagePrice ? ` (${formatPrice(Number(pkg.PackagePrice))})` : ''}
                            </a>
                          ) : (
                            <span style={{ fontWeight: 600 }}>
                              {pkg.Title}{pkg.PackagePrice ? ` (${formatPrice(Number(pkg.PackagePrice))})` : ''}
                            </span>
                          )}
                          {i < animalPackages.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </StatRow>
                  )}
                  {animal.height && <StatRow label={t('livestock_animal.label_height')} value={animal.height} />}
                  {animal.weight && <StatRow label={t('livestock_animal.label_weight')} value={animal.weight} />}
                  {animal.horns && String(animal.horns) !== '0' && <StatRow label={t('livestock_animal.label_horns')} value={animal.horns} />}
                  {animal.temperament && animal.temperament !== '0' && (
                    <StatRow label={t('livestock_animal.label_temperament')}>
                      {animal.temperament} <span className="text-xs text-gray-400 ml-1">{t('livestock_animal.temperament_scale')}</span>
                    </StatRow>
                  )}
                  {animal.vaccinations && (
                    <StatRow label={t('livestock_animal.label_vaccinations')} value={animal.vaccinations} />
                  )}
                </tbody>
              </table>
            </div>

            {/* siteMode: About this animal card instead of Listed By (owner info is on the ranch page) */}
            {siteMode ? (
              animal.description && (
                <>
                  <hr className="border-gray-100" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                      {t('livestock_animal.about_animal', { name: animal.full_name })}
                    </p>
                    <div
                      className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: animal.description }}
                    />
                  </div>
                </>
              )
            ) : (
              (owner?.business_name || owner?.city || owner?.state) && (
                <>
                  <hr className="border-gray-100" />
                  <div className="text-center">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{t('livestock_animal.listed_by')}</p>
                    {owner.logo && (
                      <img
                        src={owner.logo}
                        alt={owner.business_name}
                        className="mb-2 object-contain rounded mx-auto"
                        style={{ maxHeight: '56px', maxWidth: '160px' }}
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    )}
                    {owner.business_name && (
                      <p className="font-bold text-sm text-gray-800">{owner.business_name}</p>
                    )}
                    {(owner.city || owner.state) && (
                      <p className="text-sm text-gray-500 mt-0.5">
                        {[owner.city, owner.state].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {owner.business_id && (
                      <div>
                        <Link
                          to={`/marketplaces/livestock/ranch/${owner.business_id}`}
                          className="inline-block mt-2 text-xs font-bold"
                          style={{ color: primaryColor }}
                        >
                          {t('livestock_animal.view_ranch')}
                        </Link>
                      </div>
                    )}
                    {owner.business_id && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{t('livestock_animal.contact_seller')}</p>
                        <Link
                          to={`/marketplaces/livestock/ranch/${owner.business_id}`}
                          className="inline-block px-4 py-1.5 rounded-lg font-bold text-xs text-white transition-all hover:opacity-90"
                          style={{ backgroundColor: 'rgb(123, 141, 92)', color: '#ffffff' }}
                        >
                          {t('livestock_animal.contact_seller')}
                        </Link>
                      </div>
                    )}
                  </div>
                </>
              )
            )}

            {animal.finance_terms && animal.finance_terms.trim().length > 6 && (
              <>
                <hr className="border-gray-100" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">{t('livestock_animal.financial_terms')}</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{animal.finance_terms}</p>
                </div>
              </>
            )}

          </div>

          {/* Co-owners */}
          {animal.co_owners && animal.co_owners.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-sm font-bold mb-2 text-gray-700">{t('livestock_animal.co_owned_by')}</h2>
              {animal.co_owners.map((co, i) => (
                <div key={i} className="text-sm text-gray-700 mb-1">
                  {co.link && co.link.length > 3
                    ? <a href={`http://${co.link}`} target="_blank" rel="noopener noreferrer" style={{ color: primaryColor }}>{co.business || co.name}</a>
                    : <span>{co.business || co.name}</span>}
                  {co.business && co.name && co.business !== co.name && (
                    <span className="text-gray-500">, {co.name}</span>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>

        {/* ── Right column: photos ── */}
        <div className="space-y-6">

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
            <PhotoGallery photos={photos} />
            {animal.video_url && (
              <div className="mt-3">
                <a href={animal.video_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold" style={{ color: primaryColor }}>
                  {t('livestock_animal.watch_video')}
                </a>
              </div>
            )}
            {(animal.registration_url || animal.histogram_url) && (
              <div className="mt-3 flex flex-col gap-1">
                {animal.registration_url && (
                  <a href={animal.registration_url} target="_blank" rel="noopener noreferrer" download
                     className="text-xs font-bold" style={{ color: primaryColor }}>
                    {t('livestock_animal.download_reg')}
                  </a>
                )}
                {animal.histogram_url && (
                  <a href={animal.histogram_url} target="_blank" rel="noopener noreferrer" download
                     className="text-xs font-bold" style={{ color: primaryColor }}>
                    {t('livestock_animal.download_histogram')}
                  </a>
                )}
              </div>
            )}
            {!siteMode && (
              <div className="mt-3">
                <Link to={`/marketplaces/livestock/animal/${animal.animal_id}/progeny`}
                      className="text-xs font-bold" style={{ color: primaryColor }}>
                  {t('livestock_animal.view_progeny')}
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Full-width awards ── */}
      {awards && awards.length > 0 && (
        <div className="mt-6">
          <Awards rows={awards} />
        </div>
      )}

      {/* ── Full-width description (hidden in siteMode — shown inside the pricing card instead) ── */}
      {!siteMode && animal.description && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mt-6">
          <h2 className="text-base font-bold mb-3" style={{ color: '#507033' }}>
            {t('livestock_animal.about_animal', { name: animal.full_name })}
          </h2>
          <div
            className="text-sm text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: animal.description }}
          />
        </div>
      )}

      {/* ── Full-width fiber stats ── */}
      {fiber_stats && fiber_stats.length > 0 && (
        <div className="mt-6">
          <FiberStats rows={fiber_stats} />
        </div>
      )}

      {/* ── Full-width ancestry (bloodline + pedigree tree) ── */}
      {ancestry && (
        <AncestrySection ancestry={ancestry} species={animal.species_singular} />
      )}

      {/* Prev / Next navigation (siteMode) */}
      {siteMode && (onPrev || onNext) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.75rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
          <button
            onClick={hasPrev ? onPrev : undefined}
            disabled={!hasPrev}
            style={{ background: 'none', border: 'none', padding: 0, cursor: hasPrev ? 'pointer' : 'default', color: hasPrev ? primaryColor : 'transparent', fontSize: '0.9rem', fontWeight: 600, opacity: hasPrev ? 1 : 0, pointerEvents: hasPrev ? 'auto' : 'none' }}
          >
            {t('livestock_animal.prev')}
          </button>
          <button
            onClick={hasNext ? onNext : undefined}
            disabled={!hasNext}
            style={{ background: 'none', border: 'none', padding: 0, cursor: hasNext ? 'pointer' : 'default', color: hasNext ? primaryColor : 'transparent', fontSize: '0.9rem', fontWeight: 600, opacity: hasNext ? 1 : 0, pointerEvents: hasNext ? 'auto' : 'none' }}
          >
            {t('livestock_animal.next')}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
