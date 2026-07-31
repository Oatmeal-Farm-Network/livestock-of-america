// src/pages/herd-health/HerdHealthEvents.jsx
// Stub — full events log ships in a later phase.
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from '../../lib/i18n';
import HerdHealthLayout from './HerdHealthLayout';

const INK = '#2c2c2c';
const MUTED = '#6b6b6b';

export default function HerdHealthEvents() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const BusinessID = searchParams.get('BusinessID');

  return (
    <HerdHealthLayout businessId={BusinessID} title={t('herd_health.nav_events', 'Events')}>
      <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 text-center">
        <h1
          className="text-2xl font-bold mb-2"
          style={{ fontFamily: "'Lora', 'Times New Roman', serif", color: INK }}
        >
          {t('herd_health.nav_events', 'Events')}
        </h1>
        <p className="text-sm" style={{ color: MUTED }}>
          {t('herd_health.events_coming_soon', 'A full herd health event log is coming soon.')}
        </p>
      </div>
    </HerdHealthLayout>
  );
}
