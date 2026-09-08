// Ported from Oatmeal Farm Network (src/WeatherDashboard.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router';
import SaigeWidget from '../../components/SaigeWidget';

const API = import.meta.env.VITE_LIVESTOCK_API_URL || 'http://localhost:8000';
function tok() { return localStorage.getItem('access_token'); }
function auth() { return { Authorization: `Bearer ${tok()}` }; }

// WMO weather code → emoji
const WMO_ICON = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '❄️', 77: '❄️',
  80: '🌦️', 81: '🌧️', 82: '⛈️',
  85: '🌨️', 86: '❄️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
};

function wmoIcon(code) { return WMO_ICON[code] || '🌡️'; }

function fmtDay(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
}

function fmtHour(timeStr) {
  const d = new Date(timeStr);
  return d.toLocaleTimeString('en-AU', { hour: 'numeric', hour12: true });
}

function WindBadge({ mph, dir }) {
  if (mph == null) return null;
  return (
    <span className="text-xs text-gray-500">
      {dir && `${dir} `}{Math.round(mph)} mph
    </span>
  );
}

function LocationPicker({ bid, onSaved }) {
  const [lat, setLat]   = useState('');
  const [lon, setLon]   = useState('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [detecting, setDetecting] = useState(false);

  const detect = () => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(5));
        setLon(pos.coords.longitude.toFixed(5));
        setDetecting(false);
      },
      () => setDetecting(false),
    );
  };

  const save = async () => {
    if (!lat || !lon) return;
    setSaving(true);
    await fetch(
      `${API}/api/weather/location?business_id=${bid}&latitude=${lat}&longitude=${lon}&location_name=${encodeURIComponent(name)}`,
      { method: 'POST', headers: auth() },
    );
    setSaving(false);
    onSaved({ latitude: parseFloat(lat), longitude: parseFloat(lon), location_name: name });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-md mx-auto mt-12">
      <h3 className="font-semibold text-gray-900 mb-1">Set Farm Location</h3>
      <p className="text-sm text-gray-500 mb-4">Enter coordinates or use your browser's location.</p>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Latitude</label>
            <input value={lat} onChange={e => setLat(e.target.value)} placeholder="-33.8688"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Longitude</label>
            <input value={lon} onChange={e => setLon(e.target.value)} placeholder="151.2093"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Location Name (optional)</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Home Farm"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={detect} disabled={detecting}
            className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50">
            {detecting ? 'Detecting…' : '📍 Detect'}
          </button>
          <button onClick={save} disabled={saving || !lat || !lon}
            className="px-4 py-2 text-sm bg-gray-900 text-white rounded-xl hover:bg-gray-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save & Load Weather'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WeatherDashboard() {
  const [params] = useSearchParams();
  const bid = params.get('BusinessID');

  const [location, setLocation] = useState(null);
  const [weather, setWeather]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [locLoaded, setLocLoaded] = useState(false);

  // Load saved location
  useEffect(() => {
    if (!bid) return;
    fetch(`${API}/api/weather/location?business_id=${bid}`, { headers: auth() })
      .then(r => r.ok ? r.json() : null)
      .then(loc => { setLocation(loc); setLocLoaded(true); })
      .catch(() => setLocLoaded(true));
  }, [bid]);

  // Fetch weather when location is known
  useEffect(() => {
    if (!location?.latitude) return;
    setLoading(true);
    setError('');
    fetch(`${API}/api/weather?lat=${location.latitude}&lon=${location.longitude}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setWeather)
      .catch(() => setError('Unable to load weather data.'))
      .finally(() => setLoading(false));
  }, [location]);

  const today = weather?.daily?.[0];
  const cur   = weather?.current;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Weather & Climate</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {location?.location_name || 'Farm weather'} · forecasts, rainfall, and growing conditions
          </p>
        </div>
        {location && (
          <button onClick={() => setLocation(null)}
            className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5">
            Change Location
          </button>
        )}
      </div>

      <div className="p-6 max-w-5xl space-y-5">
        {/* No location yet */}
        {locLoaded && !location && (
          <LocationPicker bid={bid} onSaved={setLocation} />
        )}

        {loading && <p className="text-gray-400 text-sm">Loading weather…</p>}
        {error   && <p className="text-red-500 text-sm">{error}</p>}

        {weather && (
          <>
            {/* Current conditions */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-5xl font-bold text-gray-900">
                    {cur?.temp_f != null ? `${Math.round(cur.temp_f)}°F` : '—'}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Feels like {cur?.feelslike_f != null ? `${Math.round(cur.feelslike_f)}°F` : '—'} ·{' '}
                    {cur?.condition}
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span>Humidity {cur?.humidity ?? '—'}%</span>
                    <WindBadge mph={cur?.wind_mph} dir={cur?.wind_dir} />
                    {today && <span>High {Math.round(today.high_f)}° / Low {Math.round(today.low_f)}°</span>}
                  </div>
                </div>
                <div className="text-7xl">{wmoIcon(0)}</div>
              </div>
            </div>

            {/* Hourly strip */}
            {weather.hourly?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Next 24 Hours</h4>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {weather.hourly.slice(0, 24).map((h, i) => (
                    <div key={i} className="shrink-0 flex flex-col items-center gap-1 w-14">
                      <span className="text-xs text-gray-400">{fmtHour(h.time)}</span>
                      <span className="text-lg">{wmoIcon(0)}</span>
                      <span className="text-sm font-medium text-gray-700">
                        {h.temp_f != null ? `${Math.round(h.temp_f)}°` : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7-day forecast */}
            {weather.daily?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">7-Day Forecast</h4>
                </div>
                <div className="divide-y divide-gray-100">
                  {weather.daily.map((d, i) => (
                    <div key={i} className="flex items-center px-5 py-3 gap-4">
                      <span className="text-sm text-gray-600 w-32 shrink-0">{i === 0 ? 'Today' : fmtDay(d.date)}</span>
                      <span className="text-xl">{wmoIcon(0)}</span>
                      <span className="text-xs text-gray-500 flex-1">{d.condition}</span>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <span className="text-gray-900">{d.high_f != null ? `${Math.round(d.high_f)}°` : '—'}</span>
                        <span className="text-gray-400">{d.low_f != null ? `${Math.round(d.low_f)}°` : '—'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick links to farm planning */}
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                ['/spray-applications', 'Spray PHI Calendar'],
                ['/irrigation', 'Irrigation Planner'],
                ['/crop-planning', 'Crop Calendar'],
                ['/field-health', 'Field Health'],
              ].map(([to, label]) => (
                <Link key={to} to={`${to}?BusinessID=${bid}`}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50">
                  {label} →
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      <SaigeWidget businessId={bid} pageContext="Weather & Climate Dashboard" />
    </div>
  );
}
