// src/pages/LivestockAnimalDetail.jsx
// Public animal detail page — /marketplaces/livestock/animal/:id
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { useTranslation } from '../lib/i18n';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';
import SaveButton from '../components/SaveButton';
import { resolveListingPhoto, ListingPhotoPlaceholder } from '../components/ListingPhoto';
import { useLanguage } from '../lib/LanguageContext';

const API_URL = import.meta.env.VITE_LIVESTOCK_API_URL || '';
const CREAM = '#f7f2e8';
const OLIVE = '#3d6b34';
const OLIVE_DARK = '#507033';
const LORA = "'Lora', 'Times New Roman', serif";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(n) {
  if (n == null) return null;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function formatDOB({ month, day, year } = {}) {
  const parts = [];
  if (month && String(month) !== '0') parts.push(String(month).padStart(2, '0'));
  if (day && String(day) !== '0') parts.push(String(day).padStart(2, '0'));
  if (year && String(year) !== '0') parts.push(String(year));
  return parts.join('/') || null;
}

function hasAncestor(node) {
  return node && node.name && node.name.trim().length > 0;
}

// ── Photo gallery ─────────────────────────────────────────────────────────────
function PhotoGallery({ photos }) {
  const { t } = useTranslation();
  const realPhotos = (photos || []).filter((url) => resolveListingPhoto(url));
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState({});

  useEffect(() => {
    setActive(0);
    setFailed({});
  }, [photos]);

  const markFailed = (i) => setFailed((prev) => ({ ...prev, [i]: true }));

  const handleMainError = () => {
    markFailed(active);
    const next = realPhotos.findIndex((_, i) => i > active && !failed[i]);
    if (next !== -1) setActive(next);
  };

  const visibleCount = realPhotos.filter((_, i) => !failed[i]).length;

  if (realPhotos.length === 0 || visibleCount === 0) {
    return (
      <div className="rounded-xl overflow-hidden" style={{ height: '320px' }}>
        <ListingPhotoPlaceholder label={t('livestock_animal.no_photos', 'No image')} />
      </div>
    );
  }

  return (
    <div>
      <div
        className="rounded-xl bg-gray-100 flex items-center justify-center"
        style={{ width: '100%', minHeight: '240px', maxHeight: '560px', overflow: 'hidden' }}
      >
        <img
          key={active}
          src={realPhotos[active]}
          alt="Animal photo"
          style={{ maxWidth: '100%', maxHeight: '560px', width: 'auto', height: 'auto', objectFit: 'contain', display: 'block' }}
          onError={handleMainError}
        />
      </div>
      {realPhotos.length > 1 && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {realPhotos.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className="overflow-hidden rounded-lg border-2 transition-all"
              style={{ width: '72px', height: '72px', flexShrink: 0, display: failed[i] ? 'none' : 'block', borderColor: i === active ? OLIVE : '#e5e0d6' }}
            >
              <img
                src={url}
                alt={`Photo ${i + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#f0ede6' }}
                onError={() => markFailed(i)}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Stats table row ───────────────────────────────────────────────────────────
function StatRow({ label, value, children }) {
  const content = children ?? value;
  if (content == null || content === '' || content === false) return null;
  return (
    <tr style={{ border: 'none' }}>
      <td style={{ border: 'none' }} className="py-0.5 pr-4 text-xs font-semibold text-gray-500 whitespace-nowrap w-32 align-top">{label}</td>
      <td style={{ border: 'none' }} className="py-0.5 text-sm text-gray-800 align-top">{content}</td>
    </tr>
  );
}

// ── Ancestry pedigree tree ────────────────────────────────────────────────────
function AncestorBox({ node, gender }) {
  const bg = gender === 'male' ? '#dbeafe' : '#fce7f3';
  const border = gender === 'male' ? '#93c5fd' : '#f9a8d4';
  const empty = !hasAncestor(node);
  return (
    <div
      className="rounded px-3 py-2 text-xs"
      style={{
        backgroundColor: empty ? '#f5f1ea' : bg,
        border: `1px solid ${empty ? '#e2d9cb' : border}`,
        color: '#374151',
        width: '100%',
        minHeight: 56,
        wordBreak: 'break-word',
        opacity: empty ? 0.5 : 1,
      }}
    >
      {!empty && (
        <>
          <div className="font-semibold leading-tight">
            {(() => {
              const link = node.link;
              if (!link || link === '0' || String(link).length <= 4) return node.name;
              const isInternal = String(link).startsWith('/');
              return isInternal
                ? <Link to={link} style={{ color: OLIVE }}>{node.name}</Link>
                : <a href={link} target="_blank" rel="noopener noreferrer" style={{ color: OLIVE }}>{node.name}</a>;
            })()}
          </div>
          {node.color && node.color !== 'Not Available' && (
            <div className="text-gray-500 leading-tight mt-0.5">{node.color}</div>
          )}
          {node.reg && String(node.reg).trim() && (
            <div className="text-gray-500 leading-tight mt-0.5">{node.reg}</div>
          )}
        </>
      )}
    </div>
  );
}

function BranchCell({ top, bottom }) {
  return (
    <td
      style={{
        width: 18,
        padding: 0,
        borderRight: '2px solid #c9b89e',
        borderTop: top ? '2px solid #c9b89e' : 'none',
        borderBottom: bottom ? '2px solid #c9b89e' : 'none',
      }}
    />
  );
}

function AncCell({ children, rowSpan }) {
  return (
    <td rowSpan={rowSpan} style={{ padding: '3px 6px', verticalAlign: 'middle' }}>
      {children}
    </td>
  );
}

function AncestrySection({ ancestry }) {
  const { t } = useTranslation();
  const bloodline = ancestry?.bloodline || {};
  const bloodlineEntries = Object.entries(bloodline).filter(([, v]) => v && String(v).trim());
  const hasAnyAncestor = [
    ancestry.sire, ancestry.sire_sire, ancestry.sire_dam,
    ancestry.sire_sire_sire, ancestry.sire_sire_dam,
    ancestry.sire_dam_sire, ancestry.sire_dam_dam,
    ancestry.dam, ancestry.dam_sire, ancestry.dam_dam,
    ancestry.dam_sire_sire, ancestry.dam_sire_dam,
    ancestry.dam_dam_sire, ancestry.dam_dam_dam,
  ].some(hasAncestor);

  if (bloodlineEntries.length === 0 && !hasAnyAncestor) return null;
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mt-6">
      <h2 className="text-base font-bold mb-3" style={{ color: OLIVE_DARK, fontFamily: LORA }}>
        {t('livestock_animal.ancestry', 'Ancestry')}
      </h2>
      {bloodlineEntries.length > 0 && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-800 mb-5">
          {bloodlineEntries.map(([label, value]) => (
            <span key={label}>
              <span className="font-semibold">{value}</span> {label}
            </span>
          ))}
        </div>
      )}
      {hasAnyAncestor && <PedigreeTree ancestry={ancestry} />}
    </div>
  );
}

function PedigreeTree({ ancestry }) {
  const { sire_term: ST = 'Sire', dam_term: DT = 'Dam' } = ancestry;
  const a = ancestry;

  const anyAncestor = [
    a.sire, a.sire_sire, a.sire_dam, a.sire_sire_sire, a.sire_sire_dam,
    a.sire_dam_sire, a.sire_dam_dam,
    a.dam, a.dam_sire, a.dam_dam, a.dam_sire_sire, a.dam_sire_dam,
    a.dam_dam_sire, a.dam_dam_dam,
  ].some(hasAncestor);
  if (!anyAncestor) return null;

  return (
    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 2px', tableLayout: 'fixed' }}>
      <colgroup>
        <col style={{ width: '30%' }} />
        <col style={{ width: 18 }} />
        <col style={{ width: '30%' }} />
        <col style={{ width: 18 }} />
        <col style={{ width: '40%' }} />
      </colgroup>
      <tbody>
        <tr>
          <AncCell rowSpan={4}>
            <AncestorBox node={a.sire} gender="male" />
            <div className="text-[10px] text-gray-400 text-center mt-0.5">{ST}</div>
          </AncCell>
          <BranchCell top={false} bottom={true} />
          <AncCell rowSpan={2}>
            <AncestorBox node={a.sire_sire} gender="male" />
          </AncCell>
          <BranchCell top={false} bottom={true} />
          <AncCell>
            <AncestorBox node={a.sire_sire_sire} gender="male" />
          </AncCell>
        </tr>
        <tr>
          <td style={{ borderRight: '2px solid #c9b89e', padding: 0, width: 18 }} />
          <BranchCell top={true} bottom={false} />
          <AncCell>
            <AncestorBox node={a.sire_sire_dam} gender="female" />
          </AncCell>
        </tr>
        <tr>
          <td style={{ borderRight: '2px solid #c9b89e', padding: 0, width: 18 }} />
          <AncCell rowSpan={2}>
            <AncestorBox node={a.sire_dam} gender="female" />
          </AncCell>
          <BranchCell top={false} bottom={true} />
          <AncCell>
            <AncestorBox node={a.sire_dam_sire} gender="male" />
          </AncCell>
        </tr>
        <tr>
          <td style={{ padding: 0, width: 18 }} />
          <BranchCell top={true} bottom={false} />
          <AncCell>
            <AncestorBox node={a.sire_dam_dam} gender="female" />
          </AncCell>
        </tr>

        <tr><td colSpan={5} style={{ height: 12 }} /></tr>

        <tr>
          <AncCell rowSpan={4}>
            <AncestorBox node={a.dam} gender="female" />
            <div className="text-[10px] text-gray-400 text-center mt-0.5">{DT}</div>
          </AncCell>
          <BranchCell top={false} bottom={true} />
          <AncCell rowSpan={2}>
            <AncestorBox node={a.dam_sire} gender="male" />
          </AncCell>
          <BranchCell top={false} bottom={true} />
          <AncCell>
            <AncestorBox node={a.dam_sire_sire} gender="male" />
          </AncCell>
        </tr>
        <tr>
          <td style={{ borderRight: '2px solid #c9b89e', padding: 0, width: 18 }} />
          <BranchCell top={true} bottom={false} />
          <AncCell>
            <AncestorBox node={a.dam_sire_dam} gender="female" />
          </AncCell>
        </tr>
        <tr>
          <td style={{ borderRight: '2px solid #c9b89e', padding: 0, width: 18 }} />
          <AncCell rowSpan={2}>
            <AncestorBox node={a.dam_dam} gender="female" />
          </AncCell>
          <BranchCell top={false} bottom={true} />
          <AncCell>
            <AncestorBox node={a.dam_dam_sire} gender="male" />
          </AncCell>
        </tr>
        <tr>
          <td style={{ padding: 0, width: 18 }} />
          <BranchCell top={true} bottom={false} />
          <AncCell>
            <AncestorBox node={a.dam_dam_dam} gender="female" />
          </AncCell>
        </tr>
      </tbody>
    </table>
  );
}

// ── Fiber stats table ─────────────────────────────────────────────────────────
const FIBER_VALUE_FIELDS = [
  'Average', 'StandardDev', 'COV', 'GreaterThan30',
  'Curve', 'CF', 'CrimpPerInch', 'Length', 'ShearWeight', 'BlanketWeight',
];

/** Date cell text — legacy rows store '0' for an absent month/day/year. */
function fiberDate(r) {
  return [r.SampleDateMonth, r.SampleDateDay, r.SampleDateYear]
    .filter((p) => p && p !== '0')
    .join('/');
}

function FiberStats({ rows }) {
  const { t } = useTranslation();
  // Most Fiber records are blank legacy placeholders. Every cell falls back to
  // an em-dash, so an empty row renders as a line of dashes — drop those. The
  // API filters them too; this keeps the table right against any backend.
  const visible = (rows || []).filter(
    (r) => fiberDate(r) || FIBER_VALUE_FIELDS.some((f) => r[f]),
  );
  if (visible.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-base font-bold mb-4" style={{ color: OLIVE_DARK, fontFamily: LORA }}>
        {t('livestock_animal.fiber_stats', 'Fiber Stats')}
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left pb-2 text-gray-500 font-semibold">{t('livestock_animal.fiber_date', 'Date')}</th>
              <th className="text-center pb-2 text-gray-500 font-semibold">{t('livestock_animal.fiber_afd', 'AFD')}</th>
              <th className="text-center pb-2 text-gray-500 font-semibold">{t('livestock_animal.fiber_sd', 'SD')}</th>
              <th className="text-center pb-2 text-gray-500 font-semibold">{t('livestock_animal.fiber_cov', 'CV')}</th>
              <th className="text-center pb-2 text-gray-500 font-semibold">{t('livestock_animal.fiber_gt30', '>30µ')}</th>
              <th className="text-center pb-2 text-gray-500 font-semibold">{t('livestock_animal.fiber_curve', 'Curve')}</th>
              <th className="text-center pb-2 text-gray-500 font-semibold">{t('livestock_animal.fiber_cf', 'CF')}</th>
              <th className="text-center pb-2 text-gray-500 font-semibold">{t('livestock_animal.fiber_crimps', 'Crimps/in')}</th>
              <th className="text-center pb-2 text-gray-500 font-semibold">{t('livestock_animal.fiber_length', 'Length')}</th>
              <th className="text-center pb-2 text-gray-500 font-semibold">{t('livestock_animal.fiber_shear', 'Shear Wt')}</th>
              <th className="text-center pb-2 text-gray-500 font-semibold">{t('livestock_animal.fiber_blanket', 'Blanket Wt')}</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => {
              return (
                <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="py-1.5 pr-3 whitespace-nowrap">{fiberDate(r) || '—'}</td>
                  <td className="py-1.5 text-center">{r.Average || '—'}</td>
                  <td className="py-1.5 text-center">{r.StandardDev || '—'}</td>
                  <td className="py-1.5 text-center">{r.COV || '—'}</td>
                  <td className="py-1.5 text-center">{r.GreaterThan30 || '—'}</td>
                  <td className="py-1.5 text-center">{r.Curve || '—'}</td>
                  <td className="py-1.5 text-center">{r.CF || '—'}</td>
                  <td className="py-1.5 text-center">{r.CrimpPerInch || '—'}</td>
                  <td className="py-1.5 text-center">{r.Length || '—'}</td>
                  <td className="py-1.5 text-center">{r.ShearWeight || '—'}</td>
                  <td className="py-1.5 text-center">{r.BlanketWeight || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Awards table ──────────────────────────────────────────────────────────────
function Awards({ rows }) {
  const { t } = useTranslation();
  if (!rows || rows.length === 0) return null;
  const hasVal = (v) => v != null && v !== '' && String(v) !== '0';
  const filtered = rows.filter((r) => hasVal(r.ShowName) || hasVal(r.Placing) || hasVal(r.AwardClass));
  if (filtered.length === 0) return null;
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-base font-bold mb-4" style={{ color: OLIVE_DARK, fontFamily: LORA }}>
        {t('livestock_animal.awards', 'Awards')}
      </h2>
      <div className="space-y-2">
        {filtered.map((r, i) => (
          <div key={i} className={`rounded-lg px-4 py-2 text-sm ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white border border-gray-100'}`}>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5">
              {hasVal(r.Placing) && <span className="font-semibold" style={{ color: OLIVE }}>{r.Placing}</span>}
              {hasVal(r.AwardClass) && <span className="text-gray-600">{r.AwardClass}</span>}
              {hasVal(r.AwardYear) && <span className="text-gray-500">{r.AwardYear}</span>}
              {hasVal(r.ShowName) && <span className="text-gray-700">{r.ShowName}</span>}
            </div>
            {hasVal(r.AwardComments) && <p className="text-gray-500 text-xs mt-0.5">{r.AwardComments}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main content ──────────────────────────────────────────────────────────────
function LivestockAnimalDetailContent({ animal }) {
  const { t } = useTranslation();
  if (!animal) return null;
  const { pricing, owner, ancestry, photos, awards, fiber_stats, registrations } = animal;
  const dob = formatDOB(animal.dob || {});

  const priceDisplay = pricing?.free
    ? t('livestock_animal.free', 'Free')
    : pricing?.sold
    ? null
    : pricing?.price
    ? formatPrice(pricing.price)
    : null;

  const studFeeDisplay = !animal.sold && (animal.publish_stud || pricing?.stud_fee)
    ? (pricing?.stud_fee ? formatPrice(pricing.stud_fee) : t('livestock_animal.call_for_fee', 'Call For Fee'))
    : null;

  const backSlug = animal.species_slug;
  const backCrumbLabel = animal.species_singular ? `${animal.species_singular}s` : 'Livestock';

  return (
    <div className="mx-auto px-4 py-6" style={{ maxWidth: '1200px' }}>
      <Breadcrumbs items={[
        { label: 'Home', to: '/' },
        { label: t('livestock_mkt.crumb_marketplaces', 'Marketplaces'), to: '/marketplaces' },
        { label: t('livestock_mkt.crumb_livestock', 'Livestock'), to: '/marketplaces/livestock' },
        ...(backSlug ? [{ label: backCrumbLabel, to: `/marketplaces/livestock/${backSlug}` }] : []),
        { label: animal.full_name },
      ]} />

      {animal.last_updated && (
        <p className="text-xs text-gray-400 mb-4">
          {t('livestock_animal.last_updated', 'Updated {{date}}', { date: new Date(animal.last_updated).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) })}
        </p>
      )}

      <div className="flex items-start justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 m-0" style={{ fontFamily: LORA }}>
          {animal.full_name}
        </h1>
        <SaveButton
          itemType={animal.publish_stud && !animal.publish_for_sale ? 'stud' : 'animal'}
          itemId={animal.animal_id}
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {animal.sold && (
          <span className="inline-block bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full">{t('livestock_animal.sold', 'Sold')}</span>
        )}
        {animal.sale_pending && !animal.sold && (
          <span className="inline-block bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full">{t('livestock_animal.sale_pending', 'Sale Pending')}</span>
        )}
        {animal.publish_stud && !animal.sold && (
          <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">{t('livestock_animal.stud_available', 'Stud Available')}</span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Left column: combined info card ── */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">

            <div>
              {pricing?.price_comments && (
                <p className="text-sm font-semibold text-gray-700 mb-3">{pricing.price_comments}</p>
              )}
              <table className="w-full text-sm">
                <tbody>
                  {priceDisplay && (
                    <StatRow label={t('livestock_animal.label_price', 'Price')}>
                      <span className="font-bold text-lg" style={{ color: OLIVE }}>{priceDisplay}</span>
                      {pricing.obo && <span className="ml-2 text-xs text-gray-500">{t('livestock_animal.obo', 'OBO')}</span>}
                    </StatRow>
                  )}
                  {pricing?.discount > 0 && priceDisplay && (
                    <StatRow label={t('livestock_animal.label_discount', 'Discount')}>
                      <span className="text-red-600 font-bold">{pricing.discount}% off</span>
                      <span className="ml-2 text-gray-500 line-through">{priceDisplay}</span>
                      <span className="ml-2 font-bold text-red-600">
                        {formatPrice(pricing.price * (1 - pricing.discount / 100))}
                      </span>
                    </StatRow>
                  )}
                  {studFeeDisplay && (
                    <StatRow label={t('livestock_animal.label_stud_fee', 'Stud Fee')}>
                      <span className="font-bold" style={{ color: OLIVE }}>{studFeeDisplay}</span>
                    </StatRow>
                  )}
                  {dob && <StatRow label={t('livestock_animal.label_dob', 'DOB')} value={dob} />}
                  {(() => {
                    const seen = new Set();
                    return (registrations || [])
                      .filter((r) => {
                        const key = `${r.type}|${r.number}`;
                        if (seen.has(key)) return false;
                        seen.add(key);
                        return true;
                      })
                      .map((r, i) => (
                        <StatRow key={i} label={r.type} value={r.number} />
                      ));
                  })()}
                  <StatRow label={t('livestock_animal.label_species', 'Species')} value={animal.species_singular} />
                  {animal.breeds && animal.breeds.length > 0 && (
                    <StatRow label={animal.breeds.length > 1 ? t('livestock_animal.label_breeds', 'Breeds') : t('livestock_animal.label_breed', 'Breed')} value={animal.breeds.join(', ')} />
                  )}
                  {animal.category && String(animal.category) !== '0' && (
                    <StatRow label={t('livestock_animal.label_category', 'Category')} value={animal.category} />
                  )}
                  {animal.colors && animal.colors.length > 0 && (
                    <StatRow label={t('livestock_animal.label_color', 'Color')} value={animal.colors.join(' / ')} />
                  )}
                  {animal.height && <StatRow label={t('livestock_animal.label_height', 'Height')} value={animal.height} />}
                  {animal.weight && <StatRow label={t('livestock_animal.label_weight', 'Weight')} value={animal.weight} />}
                  {animal.horns && String(animal.horns) !== '0' && <StatRow label={t('livestock_animal.label_horns', 'Horns')} value={animal.horns} />}
                  {animal.temperament && animal.temperament !== '0' && (
                    <StatRow label={t('livestock_animal.label_temperament', 'Temperament')}>
                      {animal.temperament} <span className="text-xs text-gray-400 ml-1">{t('livestock_animal.temperament_scale', '(1-10)')}</span>
                    </StatRow>
                  )}
                  {animal.vaccinations && (
                    <StatRow label={t('livestock_animal.label_vaccinations', 'Vaccinations')} value={animal.vaccinations} />
                  )}
                </tbody>
              </table>
            </div>

            {(owner?.business_name || owner?.city || owner?.state) && (
              <>
                <hr className="border-gray-100" />
                <div className="text-center">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{t('livestock_animal.listed_by', 'Listed By')}</p>
                  {owner.logo && (
                    <img
                      src={owner.logo}
                      alt={owner.business_name}
                      className="mb-2 object-contain rounded mx-auto"
                      style={{ maxHeight: '56px', maxWidth: '160px' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
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
                        style={{ color: OLIVE }}
                      >
                        {t('livestock_animal.view_ranch', 'View Ranch Profile')}
                      </Link>
                    </div>
                  )}
                  {owner.business_id && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{t('livestock_animal.contact_seller', 'Contact Seller')}</p>
                      <Link
                        to={`/marketplaces/livestock/ranch/${owner.business_id}?tab=contact`}
                        className="inline-block px-4 py-1.5 rounded-lg font-bold text-xs text-white transition-all hover:opacity-90"
                        style={{ backgroundColor: OLIVE }}
                      >
                        {t('livestock_animal.contact_seller', 'Contact Seller')}
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}

            {animal.finance_terms && animal.finance_terms.trim().length > 6 && (
              <>
                <hr className="border-gray-100" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">{t('livestock_animal.financial_terms', 'Financial Terms')}</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{animal.finance_terms}</p>
                </div>
              </>
            )}
          </div>

          {animal.co_owners && animal.co_owners.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-sm font-bold mb-2 text-gray-700">{t('livestock_animal.co_owned_by', 'Co-Owned By')}</h2>
              {animal.co_owners.map((co, i) => (
                <div key={i} className="text-sm text-gray-700 mb-1">
                  {co.link && co.link.length > 3
                    ? <a href={`http://${co.link}`} target="_blank" rel="noopener noreferrer" style={{ color: OLIVE }}>{co.business || co.name}</a>
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
                <a href={animal.video_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold" style={{ color: OLIVE }}>
                  {t('livestock_animal.watch_video', 'Watch Video')}
                </a>
              </div>
            )}
            {(animal.registration_url || animal.histogram_url) && (
              <div className="mt-3 flex flex-col gap-1">
                {animal.registration_url && (
                  <a href={animal.registration_url} target="_blank" rel="noopener noreferrer" download
                    className="text-xs font-bold" style={{ color: OLIVE }}>
                    {t('livestock_animal.download_reg', 'Download Registration')}
                  </a>
                )}
                {animal.histogram_url && (
                  <a href={animal.histogram_url} target="_blank" rel="noopener noreferrer" download
                    className="text-xs font-bold" style={{ color: OLIVE }}>
                    {t('livestock_animal.download_histogram', 'Download Histogram')}
                  </a>
                )}
              </div>
            )}
            <div className="mt-3">
              <Link to={`/marketplaces/livestock/animal/${animal.animal_id}/progeny`}
                className="text-xs font-bold" style={{ color: OLIVE }}>
                {t('livestock_animal.view_progeny', 'View Progeny')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {awards && awards.length > 0 && (
        <div className="mt-6">
          <Awards rows={awards} />
        </div>
      )}

      {animal.description && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mt-6">
          <h2 className="text-base font-bold mb-3" style={{ color: OLIVE_DARK, fontFamily: LORA }}>
            {t('livestock_animal.about_animal', 'About {{name}}', { name: animal.full_name })}
          </h2>
          <div
            className="text-sm text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: animal.description }}
          />
        </div>
      )}

      {fiber_stats && fiber_stats.length > 0 && (
        <div className="mt-6">
          <FiberStats rows={fiber_stats} />
        </div>
      )}

      {ancestry && <AncestrySection ancestry={ancestry} />}
    </div>
  );
}

// ── Main page component ────────────────────────────────────────────────────────
export default function LivestockAnimalDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { language } = useLanguage();
  const [animal, setAnimal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    setNotFound(false);
    fetch(`${API_URL}/api/marketplace/animal/${id}?lang=${language}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => {
        if (data) setAnimal(data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id, language]);

  if (loading) {
    return (
      <div className="min-h-screen font-sans" style={{ backgroundColor: CREAM }}>
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: OLIVE, borderTopColor: 'transparent' }} />
        </div>
        <Footer />
      </div>
    );
  }

  if (notFound || !animal) {
    return (
      <div className="min-h-screen font-sans" style={{ backgroundColor: CREAM }}>
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4" style={{ fontFamily: LORA }}>{t('livestock_animal.not_found', 'Animal Not Found')}</h1>
          <p className="text-gray-600 mb-8">{t('livestock_animal.not_found_body', "The animal you're looking for isn't available anymore.")}</p>
          <Link to="/marketplaces/livestock" className="text-sm font-bold" style={{ color: OLIVE }}>{t('livestock_animal.back_marketplace', '← Back to Marketplace')}</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const { owner, pricing } = animal;
  const backLabel = animal.species_singular ? `${animal.species_singular}s` : 'Livestock';
  const metaDesc = `${animal.full_name} — ${animal.species_singular} for sale at ${owner?.business_name || 'Livestock of America'}${owner?.state ? `, ${owner.state}` : ''}. ${(animal.description || '').replace(/<[^>]+>/g, '').slice(0, 120)}`;

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: CREAM }}>
      <PageMeta
        title={`${animal.full_name} — ${animal.species_singular} For Sale`}
        description={metaDesc}
        keywords={`${animal.full_name}, ${animal.species_singular} for sale, ${backLabel || ''}, livestock marketplace`}
        canonical={`https://livestockofamerica.com/marketplaces/livestock/animal/${id}`}
        ogType="product"
        image={animal.photos?.[0]}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: animal.full_name,
            description: metaDesc,
            url: `https://livestockofamerica.com/marketplaces/livestock/animal/${id}`,
            ...(pricing?.price ? {
              offers: {
                '@type': 'Offer',
                price: pricing.price,
                priceCurrency: 'USD',
                availability: animal.sold ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
              },
            } : {}),
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://livestockofamerica.com' },
              { '@type': 'ListItem', position: 2, name: 'Livestock Marketplace', item: 'https://livestockofamerica.com/marketplaces/livestock' },
              { '@type': 'ListItem', position: 3, name: animal.full_name, item: `https://livestockofamerica.com/marketplaces/livestock/animal/${id}` },
            ],
          },
        ]}
      />
      <Header />
      <LivestockAnimalDetailContent animal={animal} />
      <Footer />
    </div>
  );
}
