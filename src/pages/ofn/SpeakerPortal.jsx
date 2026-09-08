// Ported from Oatmeal Farm Network (src/SpeakerPortal.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useTranslation } from '../../lib/i18n';

const API = import.meta.env.VITE_LIVESTOCK_API_URL || '';

function fmt(iso) {
  if (!iso) return '';
  const dt = new Date(iso);
  if (isNaN(dt)) return String(iso);
  return dt.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function SpeakerPortal() {
  const { t } = useTranslation();
  const { accessCode } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    fetch(`${API}/api/events/conference/speaker/${accessCode}`)
      .then(r => { if (!r.ok) throw new Error(t('speaker_portal.invalid_code')); return r.json(); })
      .then(setData)
      .catch(e => setErr(e.message));
  }, [accessCode]);

  if (err) return (
    <div className="min-h-screen bg-[#FAF7EE] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow p-6 max-w-md text-center">
        <div className="text-lg font-semibold text-red-600 mb-2">{err}</div>
        <p className="text-sm text-gray-600">{t('speaker_portal.invalid_code_body')}</p>
      </div>
    </div>
  );
  if (!data) return <div className="min-h-screen bg-[#FAF7EE] flex items-center justify-center text-sm text-gray-500">{t('speaker_portal.loading')}</div>;

  const { Speaker, Event, Sessions } = data;

  return (
    <div className="min-h-screen bg-[#FAF7EE]">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          {Speaker.PhotoURL && (
            <img src={Speaker.PhotoURL} alt="" className="w-14 h-14 rounded-full object-cover" />
          )}
          <div>
            <div className="text-xs text-gray-500">{Event.EventName}</div>
            <div className="font-semibold text-[#3D6B34] text-lg">{Speaker.SpeakerName}</div>
            {(Speaker.Title || Speaker.Company) && (
              <div className="text-xs text-gray-500">
                {Speaker.Title}{Speaker.Title && Speaker.Company ? ' · ' : ''}{Speaker.Company}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        <div className="text-sm text-gray-500 mb-3">
          {t('speaker_portal.your_sessions', { count: Sessions.length })}
          {Event.EventLocationName && ` · ${Event.EventLocationName}`}
        </div>
        {Sessions.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-6 text-sm text-gray-500 text-center">
            {t('speaker_portal.no_sessions')}
          </div>
        ) : (
          <div className="space-y-3">
            {Sessions.map(s => (
              <div key={s.SessionID} className="bg-white rounded-xl shadow p-4 flex gap-3">
                {s.TrackColor && (
                  <span className="w-1 rounded shrink-0" style={{ background: s.TrackColor, minHeight: 40 }} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800">{s.Title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {fmt(s.SessionStart)}
                    {s.DurationMin && ` · ${s.DurationMin} min`}
                    {s.RoomName && ` · ${s.RoomName}`}
                    {s.TrackName && ` · ${s.TrackName}`}
                  </div>
                  {s.RoleLabel && (
                    <div className="text-xs text-[#3D6B34] mt-1 font-medium">{s.RoleLabel}</div>
                  )}
                  {s.Description && (
                    <div className="text-sm text-gray-700 mt-2">{s.Description}</div>
                  )}
                  {s.Capacity && (
                    <div className="text-xs text-gray-400 mt-1">{t('speaker_portal.capacity', { n: s.Capacity })}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
