// src/pages/herd-health/HerdHealthDashboard.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../../lib/i18n';
import HerdHealthLayout from './HerdHealthLayout';
import { useHerdBusinessId } from './useHerdBusinessId';
import { endpoints } from '../../config/api';
import { herdAuthHeaders } from './herdAuth';
import { formatDisplayDate } from './herdUtils';
import { subscribeHerdHealthChanged } from './herdLive';

const OLIVE = '#3d6b34';
const RUST = '#8b3a2b';
const INK = '#2c2c2c';
const MUTED = '#6b6b6b';
const LORA = "'Lora', 'Times New Roman', serif";
const BAR_COLORS = ['#3d6b34', '#8b3a2b', '#5a7d4a', '#a86b3c', '#2f4f2f', '#6b5344'];

function StatCard({ label, value, accent, to }) {
  const inner = (
    <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-4 h-full">
      <p className="text-[11px] font-bold tracking-[0.1em] uppercase mb-1" style={{ color: MUTED }}>
        {label}
      </p>
      <p className="text-3xl font-bold" style={{ color: accent || INK, fontFamily: LORA }}>
        {value}
      </p>
    </div>
  );
  if (!to) return inner;
  return (
    <Link to={to} className="no-underline block hover:opacity-90">
      {inner}
    </Link>
  );
}

function Panel({ title, children, action, subtitle }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-4 h-full">
      <div className="flex items-start justify-between mb-3 gap-2">
        <div>
          <h2 className="text-base font-bold m-0" style={{ color: INK, fontFamily: LORA }}>
            {title}
          </h2>
          {subtitle ? (
            <p className="text-xs m-0 mt-0.5" style={{ color: MUTED }}>{subtitle}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function HBarChart({ rows, emptyText }) {
  const data = (rows || []).map((r) => ({
    label: r.label || r.Label || '—',
    value: Number(r.value ?? r.Value ?? 0) || 0,
  }));
  const max = Math.max(...data.map((d) => d.value), 1);
  if (!data.length) {
    return <p className="text-sm m-0" style={{ color: MUTED }}>{emptyText}</p>;
  }
  return (
    <ul className="space-y-2.5 m-0 p-0 list-none">
      {data.map((d, i) => (
        <li key={d.label}>
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: INK }}>{d.label}</span>
            <span style={{ color: MUTED }}>{d.value}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: '#ece7dc' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(4, (d.value / max) * 100)}%`,
                background: BAR_COLORS[i % BAR_COLORS.length],
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function MonthActivityChart({ rows, emptyText }) {
  const data = (rows || []).map((r) => {
    const full = String(r.label ?? r.Label ?? '').trim();
    return {
      label: full.length >= 7 ? full.slice(5, 7) : full || '—',
      full,
      events: Number(r.events ?? r.Events ?? 0) || 0,
      vaccinations: Number(r.vaccinations ?? r.Vaccinations ?? 0) || 0,
      treatments: Number(r.treatments ?? r.Treatments ?? 0) || 0,
      mortality: Number(r.mortality ?? r.Mortality ?? 0) || 0,
    };
  });
  const max = Math.max(
    ...data.flatMap((d) => [d.events, d.vaccinations, d.treatments, d.mortality]),
    1,
  );
  const hasData = data.some((d) => d.events || d.vaccinations || d.treatments || d.mortality);
  if (!data.length || !hasData) {
    return <p className="text-sm m-0" style={{ color: MUTED }}>{emptyText}</p>;
  }
  return (
    <div>
      <div className="flex items-end gap-2 h-36">
        {data.map((d) => (
          <div key={d.full} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
            <div className="w-full flex items-end justify-center gap-0.5 h-28">
              {[
                [d.events, OLIVE, 'Events'],
                [d.vaccinations, '#5a7d4a', 'Vaccines'],
                [d.treatments, RUST, 'Treatments'],
                [d.mortality, '#6b5344', 'Mortality'],
              ].map(([v, color, name]) => (
                <div
                  key={name}
                  className="rounded-t-sm flex-1 max-w-[10px]"
                  title={`${d.full} · ${name}: ${v}`}
                  style={{
                    height: v ? `${Math.max(8, (v / max) * 100)}%` : '2px',
                    background: color,
                    opacity: v ? 1 : 0.2,
                  }}
                />
              ))}
            </div>
            <span className="text-[10px]" style={{ color: MUTED }}>{d.label}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 mt-3 text-[11px]" style={{ color: MUTED }}>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-sm" style={{ background: OLIVE }} />
          Events
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-sm" style={{ background: '#5a7d4a' }} />
          Vaccines
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-sm" style={{ background: RUST }} />
          Treatments
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-sm" style={{ background: '#6b5344' }} />
          Mortality
        </span>
      </div>
    </div>
  );
}

export default function HerdHealthDashboard() {
  const { t } = useTranslation();
  const location = useLocation();
  const { businessId, qs } = useHerdBusinessId();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const load = useCallback(({ silent = false } = {}) => {
    if (!businessId) {
      setLoading(false);
      setData(null);
      return;
    }
    if (!silent) {
      setLoading(true);
      setError(false);
    }
    const base = endpoints.herdHealthDashboard(businessId);
    const url = `${base}${base.includes('?') ? '&' : '?'}_=${Date.now()}`;
    fetch(url, { headers: herdAuthHeaders(), cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
        setError(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [businessId]);

  // Refetch whenever this page is shown (including after navigating back from Add Vaccination).
  useEffect(() => {
    load();
  }, [load, location.key]);

  useEffect(() => {
    let timer = null;
    const unsubscribe = subscribeHerdHealthChanged(() => {
      clearTimeout(timer);
      timer = setTimeout(() => load({ silent: true }), 100);
    });
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [load]);

  const analysis = data?.analysis || {};
  const insights = analysis.insights || [];

  const syncAccounting = async () => {
    if (!businessId) return;
    setSyncing(true);
    setSyncMsg('');
    try {
      const res = await fetch(endpoints.herdHealthAccountingSync(businessId), {
        method: 'POST',
        headers: herdAuthHeaders(true),
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json().catch(() => ({}));
      setSyncMsg(body?.message || t('herd_health.sync_ok', 'Accounting sync complete.'));
      load({ silent: true });
    } catch {
      setSyncMsg(t('herd_health.sync_error', 'Accounting sync failed. Please try again.'));
    } finally {
      setSyncing(false);
    }
  };

  const insightColor = (level) => {
    if (level === 'warn') return RUST;
    if (level === 'ok') return OLIVE;
    return INK;
  };

  const modulePath = (slug) => (slug ? `/herd-health/${slug}${qs}` : `/herd-health${qs}`);

  return (
    <HerdHealthLayout businessId={businessId} title={t('herd_health.dashboard_title', 'Dashboard')}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold m-0" style={{ fontFamily: LORA, color: INK }}>
          {t('herd_health.dashboard_title', 'Dashboard')}
        </h1>
        {businessId && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => load()}
              className="rounded-lg px-3 py-2 text-sm font-semibold bg-transparent cursor-pointer border"
              style={{ color: INK, borderColor: 'rgba(0,0,0,0.15)' }}
            >
              {t('herd_health.refresh', 'Refresh')}
            </button>
            <button
              type="button"
              disabled={syncing}
              onClick={syncAccounting}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white border-0 cursor-pointer disabled:opacity-60"
              style={{ background: OLIVE }}
            >
              {syncing
                ? t('herd_health.syncing', 'Syncing…')
                : t('herd_health.sync_accounting', 'Sync accounting')}
            </button>
          </div>
        )}
      </div>
      {syncMsg && (
        <p className="text-sm mb-3" style={{ color: MUTED }}>{syncMsg}</p>
      )}

      {loading && !data ? (
        <p className="text-sm" style={{ color: MUTED }}>
          {t('herd_health.loading', 'Loading herd health data…')}
        </p>
      ) : error && !data ? (
        <p className="text-sm text-red-600">
          {t('herd_health.error', 'Could not load herd health data. Please try again.')}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
            <StatCard label={t('herd_health.stat_open_events', 'Open Events')} value={data?.open_events ?? 0} accent={RUST} to={`/herd-health/events${qs}`} />
            <StatCard label={t('herd_health.stat_vaccinations_due', 'Vaccinations Due')} value={data?.vaccinations_due ?? 0} accent={OLIVE} to={`/herd-health/vaccinations${qs}`} />
            <StatCard label={t('herd_health.stat_vaccinations_total', 'Vaccinations logged')} value={data?.vaccinations_total ?? 0} to={`/herd-health/vaccinations${qs}`} />
            <StatCard label={t('herd_health.stat_quarantine', 'Active Quarantine')} value={data?.active_quarantine ?? 0} to={`/herd-health/quarantine${qs}`} />
            <StatCard label={t('herd_health.stat_treatments', 'Active Treatments')} value={data?.active_treatments ?? 0} to={`/herd-health/treatments${qs}`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <Panel title={t('herd_health.insights_title', 'Insights')}>
              <ul className="space-y-2.5 m-0 p-0 list-none">
                {insights.map((item, idx) => {
                  const body = (
                    <span className="text-sm" style={{ color: insightColor(item.level) }}>
                      {item.text}
                    </span>
                  );
                  return (
                    <li
                      key={idx}
                      className="rounded-lg px-3 py-2"
                      style={{ background: item.level === 'warn' ? '#f8eee9' : '#f3f7f0' }}
                    >
                      {item.to ? (
                        <Link to={modulePath(item.to)} className="no-underline">{body}</Link>
                      ) : (
                        body
                      )}
                    </li>
                  );
                })}
              </ul>
            </Panel>

            <Panel title={t('herd_health.events_by_type', 'Events by type')}>
              <HBarChart
                rows={analysis.events_by_type}
                emptyText={t('herd_health.analysis_empty', 'Log events to see breakdowns here.')}
              />
            </Panel>
          </div>

          <div className="mb-4">
            <Panel
              title={t('herd_health.activity_trend', 'Activity — last 6 months')}
              subtitle={
                (data?.vaccinations_total || data?.events_total)
                  ? `${data?.vaccinations_total ?? 0} vaccinations · ${data?.events_total ?? 0} events · ${data?.treatments_total ?? 0} treatments`
                  : null
              }
            >
              <MonthActivityChart
                rows={analysis.activity_by_month}
                emptyText={t('herd_health.analysis_empty_trend', 'Add vaccinations, treatments, and events to build this trend.')}
              />
            </Panel>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Panel
              title={t('herd_health.recent_events', 'Recent Events')}
              action={
                <Link to={`/herd-health/events${qs}`} className="text-xs font-semibold no-underline" style={{ color: OLIVE }}>
                  {t('herd_health.view_all', 'View all')}
                </Link>
              }
            >
              {!data?.recent_events?.length ? (
                <p className="text-sm m-0" style={{ color: MUTED }}>
                  {t('herd_health.no_recent_events', 'No recent events.')}
                </p>
              ) : (
                <ul className="space-y-2 m-0 p-0 list-none">
                  {data.recent_events.map((ev) => (
                    <li key={ev.EventID} className="text-sm border-b pb-2" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                      <Link to={`/herd-health/events${qs}`} className="no-underline font-semibold" style={{ color: INK }}>
                        {ev.Title || ev.EventType || t('herd_health.untitled_event', 'Event')}
                      </Link>
                      {ev.AnimalTag && <span style={{ color: MUTED }}> — {ev.AnimalTag}</span>}
                      {ev.EventDate && (
                        <span className="block text-xs" style={{ color: MUTED }}>
                          {formatDisplayDate(ev.EventDate)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel
              title={t('herd_health.recent_vaccinations', 'Recent Vaccinations')}
              action={
                <Link to={`/herd-health/vaccinations${qs}`} className="text-xs font-semibold no-underline" style={{ color: OLIVE }}>
                  {t('herd_health.view_all', 'View all')}
                </Link>
              }
            >
              {!data?.recent_vaccinations?.length ? (
                <p className="text-sm m-0" style={{ color: MUTED }}>
                  {t('herd_health.no_recent_vaccinations', 'No vaccinations logged yet.')}
                </p>
              ) : (
                <ul className="space-y-2 m-0 p-0 list-none">
                  {data.recent_vaccinations.map((v) => (
                    <li key={v.VaccinationID} className="text-sm border-b pb-2" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                      <Link to={`/herd-health/vaccinations${qs}`} className="no-underline font-semibold" style={{ color: INK }}>
                        {v.VaccineName || t('herd_health.untitled_vaccine', 'Vaccine')}
                      </Link>
                      {(v.AnimalTag || v.GroupName) && (
                        <span style={{ color: MUTED }}> — {v.AnimalTag || v.GroupName}</span>
                      )}
                      <span className="block text-xs" style={{ color: MUTED }}>
                        {formatDisplayDate(v.AdministeredDate || v.CreatedAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </>
      )}
    </HerdHealthLayout>
  );
}
