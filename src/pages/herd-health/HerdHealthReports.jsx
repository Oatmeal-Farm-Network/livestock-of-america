// src/pages/herd-health/HerdHealthReports.jsx
// Reports hub — headline counts plus a jump-off card per Herd Health module.
// Ported from OatmealFarmNetwork's HerdHealthReports.jsx.
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from '../../lib/i18n';
import HerdHealthLayout from './HerdHealthLayout';
import { useHerdBusinessId } from './useHerdBusinessId';
import { endpoints } from '../../config/api';
import { herdAuthHeaders } from './herdAuth';

const OLIVE = '#3d6b34';
const RUST = '#8b3a2b';
const INK = '#2c2c2c';
const MUTED = '#6b6b6b';
const AMBER = '#a86b3c';
const LORA = "'Lora', 'Times New Roman', serif";

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-4 h-full">
      <p className="text-[11px] font-bold tracking-[0.1em] uppercase mb-1" style={{ color: MUTED }}>
        {label}
      </p>
      <p className="text-3xl font-bold" style={{ color: accent || INK, fontFamily: LORA }}>
        {value ?? '—'}
      </p>
    </div>
  );
}

export default function HerdHealthReports() {
  const { t } = useTranslation();
  const hh = (k, fallback) => t(`herd_health.${k}`, fallback);
  const { businessId, qs } = useHerdBusinessId();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!businessId) {
      setLoading(false);
      setSummary(null);
      return;
    }
    setLoading(true);
    fetch(endpoints.herdHealthDashboard(businessId), { headers: herdAuthHeaders() })
      .then((res) => (res.ok ? res.json() : null))
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, [businessId]);

  useEffect(() => { load(); }, [load]);

  // Keep the BusinessID on every hop so the target module opens on the same herd.
  const to = (path) => `${path}${qs || (businessId ? `?BusinessID=${businessId}` : '')}`;
  const count = (n) => Number(n ?? 0);
  const tone = (n, bad = RUST) => (count(n) > 0 ? bad : OLIVE);

  const medicationAlerts =
    count(summary?.expiring_medications) + count(summary?.low_stock_medications);

  const sections = [
    {
      title: hh('section_vacc_compliance', 'Vaccination compliance'),
      icon: '💉',
      description: hh('section_vacc_desc', 'Boosters due and overdue shots across the herd.'),
      path: '/herd-health/vaccinations',
      stat: summary ? `${count(summary.overdue_vaccinations)} ${hh('suffix_overdue', 'overdue')}` : null,
      statColor: tone(summary?.overdue_vaccinations),
    },
    {
      title: hh('section_withdrawals', 'Withdrawal periods'),
      icon: '⏱',
      description: hh('section_withdrawals_desc', 'Animals still inside a meat or milk withdrawal window.'),
      path: '/herd-health/treatments',
      stat: summary ? `${count(summary.active_withdrawals)} ${hh('suffix_active', 'active')}` : null,
      statColor: tone(summary?.active_withdrawals),
    },
    {
      title: hh('section_med_inventory', 'Medication inventory'),
      icon: '💊',
      description: hh('section_med_desc', 'Expiring product and low stock on the shelf.'),
      path: '/herd-health/medications',
      stat: summary ? `${medicationAlerts} ${hh('suffix_alerts', 'alerts')}` : null,
      statColor: medicationAlerts > 0 ? AMBER : OLIVE,
    },
    {
      title: hh('section_quarantine', 'Quarantine'),
      icon: '🔒',
      description: hh('section_quarantine_desc', 'Animals currently held in isolation.'),
      path: '/herd-health/quarantine',
      stat: summary ? `${count(summary.active_quarantine)} ${hh('suffix_animals', 'animals')}` : null,
      statColor: tone(summary?.active_quarantine),
    },
    {
      title: hh('section_open_events', 'Open events'),
      icon: '📋',
      description: hh('section_open_events_desc', 'Health events logged but not yet closed out.'),
      path: '/herd-health/events',
      stat: summary ? `${count(summary.open_events)} ${hh('suffix_open', 'open')}` : null,
      statColor: count(summary?.open_events) > 0 ? AMBER : OLIVE,
    },
    {
      title: hh('section_pending_labs', 'Lab results'),
      icon: '🔬',
      description: hh('section_pending_labs_desc', 'Samples sent out and results on file.'),
      path: '/herd-health/lab-results',
      stat: null,
    },
    {
      title: hh('section_parasites', 'Parasite control'),
      icon: '🐛',
      description: hh('section_parasites_desc', 'Fecal counts and deworming history.'),
      path: '/herd-health/parasites',
      stat: null,
    },
    {
      title: hh('section_mortality', 'Mortality'),
      icon: '📉',
      description: hh('section_mortality_desc', 'Losses recorded with cause of death.'),
      path: '/herd-health/mortality',
      stat: null,
    },
    {
      title: hh('section_biosecurity', 'Biosecurity'),
      icon: '🛡',
      description: hh('section_biosecurity_desc', 'Visitor logs and protocol checks.'),
      path: '/herd-health/biosecurity',
      stat: null,
    },
    {
      title: hh('section_weight', 'Weights'),
      icon: '⚖️',
      description: hh('section_weight_desc', 'Weigh-ins and average daily gain.'),
      path: '/herd-health/weights',
      stat: null,
    },
  ];

  return (
    <HerdHealthLayout businessId={businessId} title={hh('nav_reports', 'Reports')}>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-xl font-bold m-0" style={{ color: INK, fontFamily: LORA }}>
            {hh('reports_title', 'Herd health reports')}
          </h1>
          <p className="text-xs m-0 mt-0.5" style={{ color: MUTED }}>
            {hh('reports_subtitle', 'Where the herd stands right now, and where to go to fix it.')}
          </p>
        </div>

        {!businessId ? (
          <p className="text-sm" style={{ color: MUTED }}>
            {hh('select_business', 'Choose a business to see its herd health reports.')}
          </p>
        ) : loading ? (
          <div className="text-center py-8 text-sm animate-pulse" style={{ color: MUTED }}>
            {hh('loading_summary', 'Loading summary…')}
          </div>
        ) : summary ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              label={hh('stat_open_events_card', 'Open events')}
              value={count(summary.open_events)}
              accent={count(summary.open_events) > 0 ? AMBER : OLIVE}
            />
            <StatCard
              label={hh('stat_active_quarantine_card', 'In quarantine')}
              value={count(summary.active_quarantine)}
              accent={tone(summary.active_quarantine)}
            />
            <StatCard
              label={hh('stat_overdue_vaccinations', 'Overdue vaccinations')}
              value={count(summary.overdue_vaccinations)}
              accent={tone(summary.overdue_vaccinations)}
            />
            <StatCard
              label={hh('stat_active_withdrawals', 'Active withdrawals')}
              value={count(summary.active_withdrawals)}
              accent={tone(summary.active_withdrawals)}
            />
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sections.map((s) => (
            <Link
              key={s.title}
              to={to(s.path)}
              className="no-underline bg-white rounded-2xl shadow-sm border border-black/5 p-4 flex items-start gap-3 hover:shadow-md transition-shadow duration-150"
            >
              <div className="text-2xl shrink-0 mt-0.5">{s.icon}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-sm" style={{ color: INK }}>{s.title}</div>
                  {s.stat && (
                    <div className="text-xs font-semibold shrink-0" style={{ color: s.statColor }}>
                      {s.stat}
                    </div>
                  )}
                </div>
                <div className="text-xs mt-0.5" style={{ color: MUTED }}>{s.description}</div>
              </div>
              <div className="shrink-0 mt-1" style={{ color: MUTED }}>→</div>
            </Link>
          ))}
        </div>
      </div>
    </HerdHealthLayout>
  );
}
