// Ported from Oatmeal Farm Network (src/EventAdd.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router';
import { useTranslation } from '../../lib/i18n';
import AccountLayout from '../../components/AccountLayout';

const API = import.meta.env.VITE_LIVESTOCK_API_URL || '';

function formatPrice(v) {
  if (v == null) return null;
  const n = Number(v);
  if (!isFinite(n) || n === 0) return null;
  return `$${n.toFixed(2)}`;
}

function TypeCard({ t: type, featuresByKey, onPick, listingFeeLabel, noExtrasLabel, btnLabel, genericTagline }) {
  const full = formatPrice(type.FullPrice);
  const disc = formatPrice(type.DiscountPrice);
  const discActive = type.DiscountEndDate && new Date(type.DiscountEndDate) > new Date();

  const resolved = (type.features || [])
    .map(k => featuresByKey[k])
    .filter(Boolean)
    .sort((a, b) => (a.SortOrder || 100) - (b.SortOrder || 100));

  const core = resolved.filter(f => f.IsCoreModule);
  const extras = resolved.filter(f => !f.IsCoreModule);
  const tagline = core.length
    ? core.map(f => f.FeatureName).join(' · ')
    : genericTagline;

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white transition hover:border-[#3D6B34] hover:shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <div className="font-semibold text-gray-900">{type.EventType}</div>
          <div className="text-xs text-gray-500 mt-0.5">{tagline}</div>
        </div>
        {full && (
          <div className="text-right shrink-0">
            {discActive && disc ? (
              <>
                <div className="text-xs text-gray-400 line-through">{full}</div>
                <div className="text-sm font-semibold text-[#3D6B34]">{disc}</div>
              </>
            ) : (
              <div className="text-sm font-semibold text-gray-700">{full}</div>
            )}
            <div className="text-[10px] uppercase tracking-wide text-gray-400">{listingFeeLabel}</div>
          </div>
        )}
      </div>
      <ul className="text-xs text-gray-600 space-y-1 mb-3 list-disc pl-4">
        {extras.length > 0 ? extras.map(f => (
          <li key={f.FeatureID} title={f.FeatureDescription || ''}>
            {f.Icon && <span className="mr-1">{f.Icon}</span>}
            {f.FeatureName}
          </li>
        )) : (
          <li className="italic text-gray-400 list-none">{noExtrasLabel}</li>
        )}
      </ul>
      <button
        type="button"
        onClick={() => onPick(type)}
        className="w-full text-sm font-medium py-1.5 rounded-lg bg-[#3D6B34] text-white hover:bg-[#2d5226]"
      >
        {btnLabel}
      </button>
    </div>
  );
}

export default function EventAdd() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const BusinessID = params.get('BusinessID');

  const [types, setTypes] = useState([]);
  const [featuresByKey, setFeaturesByKey] = useState({});
  const [typesErr, setTypesErr] = useState(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch(`${API}/api/events/types-features`).then(r => r.ok ? r.json() : Promise.reject(new Error(t('event_add.err_load_types')))),
      fetch(`${API}/api/events/features`).then(r => r.ok ? r.json() : Promise.reject(new Error(t('event_add.err_load_features')))),
    ])
      .then(([tRows, fRows]) => {
        if (!alive) return;
        setTypes(Array.isArray(tRows) ? tRows : []);
        const map = {};
        for (const f of (Array.isArray(fRows) ? fRows : [])) map[f.FeatureKey] = f;
        setFeaturesByKey(map);
      })
      .catch(e => { if (alive) setTypesErr(e.message); });
    return () => { alive = false; };
  }, []);

  const pickType = (type) => {
    const q = new URLSearchParams();
    q.set('type', type.EventType);
    if (BusinessID) q.set('BusinessID', BusinessID);
    navigate(`/events/add/details?${q.toString()}`);
  };

  const effectivePrice = (type) => {
    const discActive = type.DiscountEndDate && new Date(type.DiscountEndDate) > new Date();
    const price = discActive && type.DiscountPrice != null ? type.DiscountPrice : type.FullPrice;
    const n = Number(price);
    return isFinite(n) ? n : 0;
  };

  const filtered = useMemo(() => {
    return types
      .filter(type => !filter || type.EventType.toLowerCase().includes(filter.toLowerCase()))
      .slice()
      .sort((a, b) => effectivePrice(a) - effectivePrice(b));
  }, [types, filter]);

  const listingFeeLabel = t('event_add.listing_fee');
  const noExtrasLabel = t('event_add.no_extras');
  const btnLabel = t('event_add.btn_use_type');
  const genericTagline = t('event_add.generic_tagline');

  return (
    <AccountLayout>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('event_add.heading')}</h1>
            <p className="text-sm text-gray-500 mt-1">
              <span className="text-[#3D6B34] font-semibold">{t('event_add.step_label')}</span> · {t('event_add.step_desc')}
            </p>
          </div>
          <Link
            to={`/events/manage?BusinessID=${BusinessID || ''}`}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {t('event_add.btn_back')}
          </Link>
        </div>

        <section className="mb-4">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t('event_add.placeholder_search')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm max-w-md w-full focus:outline-none focus:border-[#819360]"
          />
        </section>

        <section>
          {typesErr && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-3">
              {typesErr}
            </div>
          )}
          {!typesErr && types.length === 0 && (
            <div className="text-sm text-gray-500">{t('event_add.loading')}</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(type => (
              <TypeCard
                key={type.EventTypeID}
                t={type}
                featuresByKey={featuresByKey}
                onPick={pickType}
                listingFeeLabel={listingFeeLabel}
                noExtrasLabel={noExtrasLabel}
                btnLabel={btnLabel}
                genericTagline={genericTagline}
              />
            ))}
          </div>
          {types.length > 0 && filtered.length === 0 && (
            <div className="text-sm text-gray-400 text-center py-8">{t('event_add.no_match')}</div>
          )}
        </section>
      </div>
    </AccountLayout>
  );
}
