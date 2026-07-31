// src/pages/herd-health/HerdHealthDashboard.jsx
// Herd Health MVP dashboard — /herd-health/dashboard?BusinessID=
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from '../../lib/i18n';
import HerdHealthLayout from './HerdHealthLayout';
import { endpoints } from '../../config/api';
import { getToken } from '../../lib/auth';

const OLIVE = '#3d6b34';
const RUST = '#8b3a2b';
const INK = '#2c2c2c';
const MUTED = '#6b6b6b';

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-4">
      <p className="text-[11px] font-bold tracking-[0.1em] uppercase mb-1" style={{ color: MUTED }}>
        {label}
      </p>
      <p className="text-3xl font-bold" style={{ color: accent || INK, fontFamily: "'Lora', 'Times New Roman', serif" }}>
        {value}
      </p>
    </div>
  );
}

export default function HerdHealthDashboard() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const BusinessID = searchParams.get('BusinessID');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!BusinessID) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    const token = getToken();
    fetch(endpoints.herdHealthDashboard(BusinessID), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [BusinessID]);

  return (
    <HerdHealthLayout businessId={BusinessID} title={t('herd_health.dashboard_title', 'Dashboard')}>
      <h1
        className="text-2xl font-bold mb-4"
        style={{ fontFamily: "'Lora', 'Times New Roman', serif", color: INK }}
      >
        {t('herd_health.dashboard_title', 'Dashboard')}
      </h1>

      {loading ? (
        <p className="text-sm" style={{ color: MUTED }}>
          {t('herd_health.loading', 'Loading herd health data…')}
        </p>
      ) : error ? (
        <p className="text-sm text-red-600">
          {t('herd_health.error', 'Could not load herd health data. Please try again.')}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            <StatCard label={t('herd_health.stat_open_events', 'Open Events')} value={data?.open_events ?? 0} accent={RUST} />
            <StatCard label={t('herd_health.stat_vaccinations_due', 'Vaccinations Due')} value={data?.vaccinations_due ?? 0} accent={OLIVE} />
            <StatCard label={t('herd_health.stat_quarantine', 'Active Quarantine')} value={data?.active_quarantine ?? 0} />
            <StatCard label={t('herd_health.stat_treatments', 'Active Treatments')} value={data?.active_treatments ?? 0} />
            <StatCard label={t('herd_health.stat_low_meds', 'Low Medications')} value={data?.low_medications ?? 0} accent={RUST} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-4">
              <h2 className="text-base font-bold mb-3" style={{ color: INK }}>
                {t('herd_health.recent_events', 'Recent Events')}
              </h2>
              {!data?.recent_events?.length ? (
                <p className="text-sm" style={{ color: MUTED }}>
                  {t('herd_health.no_recent_events', 'No recent events.')}
                </p>
              ) : (
                <ul className="space-y-2">
                  {data.recent_events.map((ev) => (
                    <li key={ev.EventID} className="text-sm border-b pb-2" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                      <span className="font-semibold" style={{ color: INK }}>
                        {ev.Title || ev.EventType || t('herd_health.untitled_event', 'Event')}
                      </span>
                      {ev.AnimalTag && <span style={{ color: MUTED }}> — {ev.AnimalTag}</span>}
                      {ev.EventDate && (
                        <span className="block text-xs" style={{ color: MUTED }}>
                          {ev.EventDate}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-4">
              <h2 className="text-base font-bold mb-3" style={{ color: INK }}>
                {t('herd_health.upcoming_vaccinations', 'Upcoming Vaccinations')}
              </h2>
              {!data?.upcoming_vaccinations?.length ? (
                <p className="text-sm" style={{ color: MUTED }}>
                  {t('herd_health.no_upcoming_vaccinations', 'No vaccinations due.')}
                </p>
              ) : (
                <ul className="space-y-2">
                  {data.upcoming_vaccinations.map((v) => (
                    <li key={v.VaccinationID} className="text-sm border-b pb-2" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                      <span className="font-semibold" style={{ color: INK }}>
                        {v.VaccineName || t('herd_health.untitled_vaccine', 'Vaccine')}
                      </span>
                      {(v.AnimalTag || v.GroupName) && (
                        <span style={{ color: MUTED }}> — {v.AnimalTag || v.GroupName}</span>
                      )}
                      {v.NextDueDate && (
                        <span className="block text-xs" style={{ color: MUTED }}>
                          {t('herd_health.due', 'Due')}: {v.NextDueDate}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {data?.active_quarantine_list?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-4 md:col-span-2">
                <h2 className="text-base font-bold mb-3" style={{ color: INK }}>
                  {t('herd_health.active_quarantine_list', 'Active Quarantine')}
                </h2>
                <ul className="space-y-2">
                  {data.active_quarantine_list.map((q) => (
                    <li key={q.QuarantineID} className="text-sm border-b pb-2" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                      <span className="font-semibold" style={{ color: INK }}>
                        {q.AnimalTag || t('herd_health.untitled_animal', 'Animal')}
                      </span>
                      {q.Reason && <span style={{ color: MUTED }}> — {q.Reason}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      )}
    </HerdHealthLayout>
  );
}
