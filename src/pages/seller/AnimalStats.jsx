// src/pages/seller/AnimalStats.jsx
// Herd statistics for a business — /seller/animals/stats?BusinessID=
// Derived from the same /auth/animals list the seller pages already use, so
// this needs no endpoint of its own.
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useTranslation } from '../../lib/i18n';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import Breadcrumbs from '../../components/Breadcrumbs';
import { endpoints } from '../../config/api';
import { getToken } from '../../lib/auth';

const CREAM = '#f7f2e8';
const OLIVE = '#3d6b34';
const RUST = '#8b3a2b';
const INK = '#2c2c2c';
const MUTED = '#6b6b6b';
const STUD = '#2f5d8a';
const LORA = "'Lora', 'Times New Roman', serif";
const BAR_COLORS = ['#3d6b34', '#8b3a2b', '#5a7d4a', '#a86b3c', '#2f4f2f', '#6b5344'];

const money = (n) =>
  Number(n || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

// What an animal is actually being asked for: an explicit sale price wins,
// otherwise the general price.
const askingPrice = (a) => Number(a.SalePrice) > 0 ? Number(a.SalePrice) : Number(a.Price || 0);

function StatCard({ label, value, accent, sub }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-4">
      <p className="text-[11px] font-bold tracking-[0.1em] uppercase mb-1" style={{ color: MUTED }}>
        {label}
      </p>
      <p className="text-3xl font-bold" style={{ color: accent || INK, fontFamily: LORA }}>
        {value}
      </p>
      {sub && <p className="text-xs mt-0.5" style={{ color: MUTED }}>{sub}</p>}
    </div>
  );
}

function Breakdown({ title, rows, emptyText, total }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-4">
      <h2 className="text-base font-bold m-0 mb-3" style={{ color: INK, fontFamily: LORA }}>
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="text-sm m-0" style={{ color: MUTED }}>{emptyText}</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => {
            const pct = total > 0 ? Math.round((r.count / total) * 100) : 0;
            return (
              <div key={r.label}>
                <div className="flex justify-between items-baseline gap-2 mb-0.5">
                  <span className="text-sm truncate" style={{ color: INK }}>{r.label}</span>
                  <span className="text-xs shrink-0" style={{ color: MUTED }}>
                    {r.count} · {pct}%
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.max(pct, 2)}%`, background: BAR_COLORS[i % BAR_COLORS.length] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AnimalStats() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const BusinessID = searchParams.get('BusinessID');

  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const token = getToken();
  const animalsHref = `/seller/animals${BusinessID ? `?BusinessID=${BusinessID}` : ''}`;

  useEffect(() => {
    if (!BusinessID) {
      setLoading(false);
      return;
    }
    fetch(endpoints.authAnimals(BusinessID), {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        setAnimals(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => {
        setFailed(true);
        setLoading(false);
      });
  }, [BusinessID, token]);

  const stats = useMemo(() => {
    const total = animals.length;
    const forSale = animals.filter((a) => a.PublishForSale);
    const atStud = animals.filter((a) => a.PublishStud);
    const priced = forSale.map(askingPrice).filter((p) => p > 0);
    const listedValue = priced.reduce((s, p) => s + p, 0);

    const countBy = (key) => {
      const map = new Map();
      for (const a of animals) {
        const k = (a[key] || '').trim() || '—';
        map.set(k, (map.get(k) || 0) + 1);
      }
      return [...map.entries()]
        .map(([label, count]) => ({ label, count }))
        .sort((x, y) => y.count - x.count);
    };

    return {
      total,
      forSale: forSale.length,
      atStud: atStud.length,
      unlisted: total - forSale.length,
      listedValue,
      avgPrice: priced.length ? listedValue / priced.length : 0,
      topPrice: priced.length ? Math.max(...priced) : 0,
      studFees: animals.filter((a) => Number(a.StudFee) > 0).length,
      bySpecies: countBy('SpeciesName'),
      byCategory: countBy('Category'),
    };
  }, [animals]);

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ background: CREAM }}>
      <PageMeta title="Animal Statistics | Livestock of America" noIndex />
      <Header />

      <main className="grow w-full max-w-[900px] mx-auto px-4 md:px-6 py-6 md:py-8">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'Dashboard', to: '/account' },
            { label: t('seller_animals.title', 'My Animals'), to: animalsHref },
            { label: t('animal_stats.page_title', 'Statistics') },
          ]}
        />

        <div className="mb-5">
          <h1 className="text-2xl font-bold m-0" style={{ fontFamily: LORA, color: INK }}>
            {t('animal_stats.heading', 'Herd statistics')}
          </h1>
          <p className="text-sm m-0 mt-0.5" style={{ color: MUTED }}>
            {t('animal_stats.subtitle', 'How your herd breaks down, and what you have on the market.')}
          </p>
        </div>

        {!BusinessID ? (
          <p className="text-sm" style={{ color: MUTED }}>
            {t('animal_stats.no_business', 'Choose a business to see its statistics.')}
          </p>
        ) : loading ? (
          <p className="text-sm animate-pulse" style={{ color: MUTED }}>
            {t('animal_stats.loading', 'Loading…')}
          </p>
        ) : failed ? (
          <p className="text-sm" style={{ color: RUST }}>
            {t('animal_stats.error', 'Could not load your animals just now.')}
          </p>
        ) : stats.total === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 text-center">
            <p className="text-sm mb-3" style={{ color: MUTED }}>
              {t('animal_stats.empty', 'No animals on file for this business yet.')}
            </p>
            <Link to={`/seller/animals/add?BusinessID=${BusinessID}`} className="font-semibold text-sm" style={{ color: OLIVE }}>
              {t('animal_stats.add_first', 'Add your first animal')}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label={t('animal_stats.stat_total', 'Animals')} value={stats.total} />
              <StatCard
                label={t('animal_stats.stat_for_sale', 'Listed for sale')}
                value={stats.forSale}
                accent={OLIVE}
                sub={t('animal_stats.stat_unlisted', '{n} not listed', { n: stats.unlisted })}
              />
              <StatCard label={t('animal_stats.stat_at_stud', 'At stud')} value={stats.atStud} accent={STUD} />
              <StatCard
                label={t('animal_stats.stat_listed_value', 'Listed value')}
                value={money(stats.listedValue)}
                accent={OLIVE}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCard label={t('animal_stats.stat_avg_price', 'Average asking')} value={money(stats.avgPrice)} />
              <StatCard label={t('animal_stats.stat_top_price', 'Highest asking')} value={money(stats.topPrice)} />
              <StatCard label={t('animal_stats.stat_stud_fees', 'With a stud fee')} value={stats.studFees} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Breakdown
                title={t('animal_stats.by_species', 'By species')}
                rows={stats.bySpecies}
                total={stats.total}
                emptyText={t('animal_stats.no_breakdown', 'Nothing to break down yet.')}
              />
              <Breakdown
                title={t('animal_stats.by_category', 'By category')}
                rows={stats.byCategory}
                total={stats.total}
                emptyText={t('animal_stats.no_breakdown', 'Nothing to break down yet.')}
              />
            </div>

            <p className="text-xs" style={{ color: MUTED }}>
              {t('animal_stats.footnote', 'Asking figures count only animals listed for sale, using the sale price where one is set.')}
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
