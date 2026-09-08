// Ported from Oatmeal Farm Network (src/FarmKPIDashboard.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
﻿import React, { useEffect, useState, useCallback } from 'react';
// ThaiymeChat, the Thaiyme agent widget, is not ported: it needs
// AgentBadge and LanguageContext. It is a floating chat panel, not
// part of this page's function.
import { useSearchParams } from 'react-router';
import AccountLayout from '../../components/AccountLayout';
import { queuedFetch } from '../../lib/offlineQueue';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const API = import.meta.env.VITE_LIVESTOCK_API_URL || '';
const hdrs = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('access_token')}` });
const apiFetch = async (path, opts) => {
  const r = await fetch(`${API}${path}`, { headers: hdrs(), ...opts });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
};

const I = ({ children, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
const IcoPlus  = () => <I size={15}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></I>;
const IcoAlert = () => <I size={16}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></I>;
const IcoBug   = () => <I size={16}><path d="M8 2l1.88 1.88"/><path d="M14.12 3.88L16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6z"/></I>;
const IcoCheck = () => <I size={14}><polyline points="20 6 9 17 4 12"/></I>;

const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

const STATUS_CONFIG = {
  ok:       { bg: '#dcfce7', color: '#166534', label: 'On Track' },
  warning:  { bg: '#fef3c7', color: '#92400e', label: 'Warning' },
  critical: { bg: '#fee2e2', color: '#dc2626', label: 'Critical' },
  no_data:  { bg: '#f3f4f6', color: '#6b7280', label: 'No Data' },
};

const TABS = ['Dashboard','KPIs','Alerts','Weather Alerts','Pest Log','P&L Report','Yield vs Budget'];

export default function FarmKPIDashboard() {
  const [params] = useSearchParams();
  const bid = params.get('BusinessID');
  const [tab, setTab]         = useState('Dashboard');
  const [dashboard, setDash]  = useState(null);
  const [kpis, setKpis]       = useState([]);
  const [alerts, setAlerts]   = useState([]);
  const [weatherAlerts, setWeatherAlerts] = useState([]);
  const [pests, setPests]     = useState([]);
  const [pnl, setPnl]         = useState(null);
  const [pnlYear, setPnlYear] = useState(new Date().getFullYear());
  const [modal, setModal]     = useState(null);
  const [form, setForm]       = useState({});

  const load = useCallback(async () => {
    if (!bid) return;
    try {
      const d = await apiFetch(`/api/farm-kpi/dashboard?business_id=${bid}`);
      setDash(d);
      setKpis(d.kpis || []);
    } catch (e) { console.error(e); }
  }, [bid]);

  const loadTab = useCallback(async (t) => {
    if (!bid) return;
    try {
      if (t === 'Alerts') {
        const d = await apiFetch(`/api/farm-kpi/alerts?business_id=${bid}`);
        setAlerts(d);
      } else if (t === 'Weather Alerts') {
        const d = await apiFetch(`/api/farm-kpi/weather-alerts?business_id=${bid}`);
        setWeatherAlerts(d);
      } else if (t === 'Pest Log') {
        const d = await apiFetch(`/api/farm-kpi/pest-observations?business_id=${bid}`);
        setPests(d);
      } else if (t === 'P&L Report' || t === 'Yield vs Budget') {
        const d = await apiFetch(`/api/farm-kpi/pnl?business_id=${bid}&crop_year=${pnlYear}`);
        setPnl(d);
      }
    } catch (e) { console.error(e); }
  }, [bid, pnlYear]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadTab(tab); }, [tab, loadTab]);

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const openModal = (type, data = {}) => { setModal({ type }); setForm(data); };
  const closeModal = () => { setModal(null); setForm({}); };

  const saveKPI = async () => {
    try {
      if (form.kpi_id) {
        await apiFetch(`/api/farm-kpi/kpis/${form.kpi_id}`, { method: 'PUT', body: JSON.stringify({ ...form, business_id: bid }) });
      } else {
        await apiFetch('/api/farm-kpi/kpis', { method: 'POST', body: JSON.stringify({ ...form, business_id: bid }) });
      }
      load();
      closeModal();
    } catch (e) { alert('Save failed'); }
  };

  const addReading = async () => {
    try {
      await apiFetch(`/api/farm-kpi/kpis/${form.kpi_id}/readings`, { method: 'POST', body: JSON.stringify({ ...form, business_id: bid }) });
      load();
      closeModal();
    } catch (e) { alert('Failed'); }
  };

  const savePest = async () => {
    try {
      const r = await queuedFetch(`${API}/api/farm-kpi/pest-observations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        body: JSON.stringify({ ...form, business_id: bid }),
        queueWhenOffline: true,
      });
      const data = await r.json().catch(() => ({}));
      if (data.queued) alert('You are offline. Pest observation will sync when connectivity returns.');
      else loadTab('Pest Log');
      closeModal();
    } catch (e) { alert('Failed'); }
  };

  const dismissAlert = async (id) => {
    try {
      await apiFetch(`/api/farm-kpi/alerts/${id}/dismiss?business_id=${bid}`, { method: 'PUT', body: '{}' });
      loadTab('Alerts');
      load();
    } catch (e) { console.error(e); }
  };

  // Simple gauge bar
  const GaugeBar = ({ kpi }) => {
    const sc = STATUS_CONFIG[kpi.status] || STATUS_CONFIG.no_data;
    const pct = kpi.pct_of_target != null ? Math.min(Math.max(kpi.pct_of_target, 0), 150) : null;
    return (
      <div style={{ background: '#fff', border: `1px solid ${kpi.status === 'critical' ? '#fecaca' : kpi.status === 'warning' ? '#fed7aa' : '#e5e7eb'}`, borderRadius: 10, padding: '16px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{kpi.kpi_name}</div>
            <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>{kpi.kpi_category}</div>
          </div>
          <span style={{ ...sc, borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{sc.label}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: sc.color }}>
            {kpi.latest_value != null ? Number(kpi.latest_value).toLocaleString() : '—'}
            {kpi.unit ? ` ${kpi.unit}` : ''}
          </div>
          {kpi.target_value != null && (
            <div style={{ fontSize: 13, color: '#6b7280' }}>Target: {Number(kpi.target_value).toLocaleString()}</div>
          )}
        </div>
        {pct != null && (
          <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3 }}>
            <div style={{ height: 6, borderRadius: 3, width: `${Math.min(pct, 100)}%`, background: sc.color }} />
          </div>
        )}
        {kpi.latest_date && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>Updated {fmtDate(kpi.latest_date)}</div>}
      </div>
    );
  };

  const sevBadge = (sev) => {
    const m = { critical: { bg: '#fee2e2', color: '#dc2626' }, warning: { bg: '#fef3c7', color: '#92400e' }, info: { bg: '#dbeafe', color: '#1d4ed8' } };
    const c = m[sev] || m.info;
    return <span style={{ ...c, borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{sev}</span>;
  };

  return (
    <AccountLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Farm KPI Dashboard & Alerts</h1>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>Track key farm performance indicators, weather alerts, and pest observations.</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid #e5e7eb', marginBottom: 24 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '7px 16px', border: 'none', background: 'none', cursor: 'pointer',
              borderBottom: tab === t ? '2px solid #16a34a' : '2px solid transparent',
              color: tab === t ? '#16a34a' : '#6b7280', fontWeight: tab === t ? 700 : 500,
              marginBottom: -2, fontSize: 14,
            }}>{t}</button>
          ))}
        </div>

        {/* ── DASHBOARD ── */}
        {tab === 'Dashboard' && dashboard && (
          <div>
            {/* Alert counts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 14, marginBottom: 24 }}>
              {[
                { label: 'Critical Alerts', val: dashboard.alerts?.critical, color: '#dc2626' },
                { label: 'Warnings', val: dashboard.alerts?.warning, color: '#d97706' },
                { label: 'Weather Alerts', val: dashboard.alerts?.weather_unread, color: '#7c3aed' },
                { label: 'Active Pests', val: dashboard.operations?.active_pests, color: '#dc2626' },
                { label: 'Low Stock', val: dashboard.operations?.low_stock_inputs, color: '#d97706' },
                { label: 'Overdue Maint.', val: dashboard.operations?.overdue_maintenance, color: '#6b7280' },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 18px' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color }}>{val ?? 0}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* KPI Grid */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Key Performance Indicators</h2>
              <button onClick={() => openModal('kpi')} style={btn('#16a34a')}><IcoPlus /> Add KPI</button>
            </div>
            {kpis.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 14 }}>
                {kpis.map(k => (
                  <div key={k.kpi_id} style={{ cursor: 'pointer' }} onClick={() => openModal('reading', { kpi_id: k.kpi_id, kpi_name: k.kpi_name })}>
                    <GaugeBar kpi={k} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: '#f9fafb', border: '1px dashed #d1d5db', borderRadius: 10, padding: 40, textAlign: 'center', color: '#6b7280' }}>
                No KPIs yet. Add your first to start tracking farm performance.
              </div>
            )}
          </div>
        )}

        {/* ── KPIs ── */}
        {tab === 'KPIs' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
              <button onClick={() => openModal('kpi')} style={btn('#16a34a')}><IcoPlus /> Add KPI</button>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    {['Name','Category','Unit','Target','Warning','Critical','Latest Value','Status',''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#6b7280', fontWeight: 600, fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {kpis.map(k => {
                    const sc = STATUS_CONFIG[k.status] || STATUS_CONFIG.no_data;
                    return (
                      <tr key={k.kpi_id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>{k.kpi_name}</td>
                        <td style={{ padding: '10px 12px', color: '#374151' }}>{k.kpi_category}</td>
                        <td style={{ padding: '10px 12px', color: '#374151' }}>{k.unit || '—'}</td>
                        <td style={{ padding: '10px 12px' }}>{k.target_value != null ? Number(k.target_value).toLocaleString() : '—'}</td>
                        <td style={{ padding: '10px 12px', color: '#d97706' }}>{k.warning_threshold != null ? Number(k.warning_threshold).toLocaleString() : '—'}</td>
                        <td style={{ padding: '10px 12px', color: '#dc2626' }}>{k.critical_threshold != null ? Number(k.critical_threshold).toLocaleString() : '—'}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 700 }}>{k.latest_value != null ? Number(k.latest_value).toLocaleString() : '—'}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ ...sc, borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{sc.label}</span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={() => openModal('reading', { kpi_id: k.kpi_id, kpi_name: k.kpi_name })} style={{ ...iBtn, color: '#2563eb', fontSize: 12, fontWeight: 600 }}>+Reading</button>
                            <button onClick={() => openModal('kpi', { ...k })} style={iBtn}>✎</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {kpis.length === 0 && (
                    <tr><td colSpan={9} style={{ padding: 32, textAlign: 'center', color: '#6b7280' }}>No KPIs yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ALERTS ── */}
        {tab === 'Alerts' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Farm Alerts</h2>
              <button onClick={() => openModal('alert')} style={btn('#d97706')}><IcoAlert /> Create Alert</button>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {alerts.map(a => (
                <div key={a.alert_id} style={{ background: '#fff', border: `1px solid ${a.severity === 'critical' ? '#fecaca' : a.severity === 'warning' ? '#fed7aa' : '#e5e7eb'}`, borderRadius: 10, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      {sevBadge(a.severity)}
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{a.title}</span>
                      {!a.is_read && <span style={{ width: 7, height: 7, background: '#2563eb', borderRadius: '50%', display: 'inline-block' }} />}
                    </div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>{a.message}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{a.alert_type} · {fmtDate(a.created_at)}</div>
                  </div>
                  <button onClick={() => dismissAlert(a.alert_id)} style={{ ...btn('#6b7280'), padding: '5px 10px', fontSize: 12 }}>
                    <IcoCheck /> Dismiss
                  </button>
                </div>
              ))}
              {alerts.length === 0 && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 32, textAlign: 'center', color: '#166534' }}>
                  No active alerts. Your farm is operating normally.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── WEATHER ALERTS ── */}
        {tab === 'Weather Alerts' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Weather & Crop Alerts</h2>
              <button onClick={() => openModal('weather')} style={btn('#7c3aed')}><IcoPlus /> Add Weather Alert</button>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {weatherAlerts.map(a => (
                <div key={a.weather_alert_id} style={{ background: '#fff', border: `1px solid ${a.severity === 'critical' ? '#fecaca' : '#fed7aa'}`, borderRadius: 10, padding: '14px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                        {sevBadge(a.severity)}
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{a.title}</span>
                      </div>
                      <div style={{ fontSize: 13, color: '#374151' }}>{a.message}</div>
                      {a.recommended_action && (
                        <div style={{ fontSize: 13, color: '#2563eb', marginTop: 6, fontWeight: 600 }}>
                          Action: {a.recommended_action}
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                        {a.alert_type}{a.crop_name ? ` · ${a.crop_name}` : ''} · Valid until: {fmtDate(a.valid_until)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {weatherAlerts.length === 0 && <div style={{ color: '#6b7280', textAlign: 'center', padding: 32 }}>No weather alerts.</div>}
            </div>
          </div>
        )}

        {/* ── P&L REPORT ── */}
        {(tab === 'P&L Report' || tab === 'Yield vs Budget') && (
          <div>
            {/* Year picker + CSV export */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Crop Year:</label>
              <select
                style={{ border: '1px solid #d1d5db', borderRadius: 8, padding: '6px 10px', fontSize: 14 }}
                value={pnlYear}
                onChange={e => { setPnlYear(Number(e.target.value)); setPnl(null); }}
              >
                {[0,1,2,3].map(i => {
                  const y = new Date().getFullYear() - i;
                  return <option key={y} value={y}>{y}</option>;
                })}
              </select>
              <button
                style={{ ...btn('#16a34a'), marginLeft: 'auto' }}
                onClick={() => window.open(`${API}/api/farm-kpi/pnl?business_id=${bid}&crop_year=${pnlYear}&format=csv`, '_blank')}
              >
                Export CSV
              </button>
            </div>

            {!pnl && (
              <div style={{ textAlign: 'center', color: '#6b7280', padding: 40 }}>Loading P&L data…</div>
            )}

            {pnl && tab === 'P&L Report' && (
              <div>
                {/* Totals banner */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12, marginBottom: 24 }}>
                  {[
                    { label: 'Budgeted Revenue', val: pnl.totals.budgeted_revenue, color: '#2563eb' },
                    { label: 'Actual Revenue', val: pnl.totals.actual_revenue, color: '#16a34a' },
                    { label: 'Budgeted Cost', val: pnl.totals.budgeted_cost, color: '#d97706' },
                    { label: 'Actual Cost', val: pnl.totals.total_actual_cost, color: '#dc2626' },
                    { label: 'Budgeted Profit', val: pnl.totals.budgeted_profit, color: '#7c3aed' },
                    { label: 'Actual Profit', val: pnl.totals.actual_profit, color: pnl.totals.actual_profit >= 0 ? '#16a34a' : '#dc2626' },
                  ].map(({ label, val, color }) => (
                    <div key={label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 16px' }}>
                      <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color }}>${Number(val).toLocaleString(undefined, { minimumFractionDigits: 0 })}</div>
                    </div>
                  ))}
                </div>

                {/* Per-crop table */}
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                        {['Crop','Field','Acres','Bud. Revenue','Act. Revenue','Bud. Cost','Act. Cost','Bud. Profit','Act. Profit','Variance'].map(h => (
                          <th key={h} style={{ textAlign: 'right', padding: '9px 12px', color: '#6b7280', fontWeight: 600, fontSize: 11, ':first-child': { textAlign: 'left' } }}
                            {...(h === 'Crop' || h === 'Field' ? { style: { textAlign: 'left', padding: '9px 12px', color: '#6b7280', fontWeight: 600, fontSize: 11 } } : {})}
                          >{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pnl.rows.map((r, i) => (
                        <tr key={r.budget_id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                          <td style={{ padding: '9px 12px', fontWeight: 600 }}>{r.crop_name}</td>
                          <td style={{ padding: '9px 12px', color: '#374151' }}>{r.field_name || '—'}</td>
                          <td style={{ padding: '9px 12px', textAlign: 'right' }}>{r.planted_acres ? Number(r.planted_acres).toFixed(1) : '—'}</td>
                          {[r.budgeted_revenue, r.actual_revenue, r.budgeted_cost, r.total_actual_cost, r.budgeted_profit].map((v, j) => (
                            <td key={j} style={{ padding: '9px 12px', textAlign: 'right' }}>${Number(v).toLocaleString(undefined, { minimumFractionDigits: 0 })}</td>
                          ))}
                          <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 700, color: r.actual_profit >= 0 ? '#16a34a' : '#dc2626' }}>
                            ${Number(r.actual_profit).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                          </td>
                          <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 700, color: r.profit_variance >= 0 ? '#16a34a' : '#dc2626' }}>
                            {r.profit_variance >= 0 ? '+' : ''}{Number(r.profit_variance).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                          </td>
                        </tr>
                      ))}
                      {pnl.rows.length === 0 && (
                        <tr><td colSpan={10} style={{ padding: 32, textAlign: 'center', color: '#6b7280' }}>No crop budget data for {pnlYear}.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {pnl && tab === 'Yield vs Budget' && (
              <div>
                {/* Yield chart */}
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '20px 16px', marginBottom: 20 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px' }}>Yield: Actual vs Expected ({pnlYear})</h3>
                  {pnl.rows.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={pnl.rows.map(r => ({
                        name: r.field_name ? `${r.crop_name} / ${r.field_name}` : r.crop_name,
                        'Expected Yield': Number(r.expected_yield) || 0,
                        'Actual Yield':   Number(r.actual_yield)   || 0,
                      }))} margin={{ top: 4, right: 20, left: 0, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-30} textAnchor="end" interval={0} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={v => Number(v).toLocaleString()} />
                        <Legend verticalAlign="top" />
                        <Bar dataKey="Expected Yield" fill="#93c5fd" radius={[4,4,0,0]} />
                        <Bar dataKey="Actual Yield"   fill="#16a34a" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#6b7280', padding: 40 }}>No yield data for {pnlYear}.</div>
                  )}
                </div>

                {/* Revenue & Profit chart */}
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '20px 16px' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px' }}>Revenue & Profit: Budgeted vs Actual ({pnlYear})</h3>
                  {pnl.rows.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={pnl.rows.map(r => ({
                        name: r.field_name ? `${r.crop_name} / ${r.field_name}` : r.crop_name,
                        'Bud. Revenue': Number(r.budgeted_revenue) || 0,
                        'Act. Revenue': Number(r.actual_revenue)   || 0,
                        'Bud. Profit':  Number(r.budgeted_profit)  || 0,
                        'Act. Profit':  Number(r.actual_profit)    || 0,
                      }))} margin={{ top: 4, right: 20, left: 10, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-30} textAnchor="end" interval={0} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                        <Tooltip formatter={v => `$${Number(v).toLocaleString()}`} />
                        <Legend verticalAlign="top" />
                        <Bar dataKey="Bud. Revenue" fill="#bfdbfe" radius={[4,4,0,0]} />
                        <Bar dataKey="Act. Revenue" fill="#2563eb" radius={[4,4,0,0]} />
                        <Bar dataKey="Bud. Profit"  fill="#d9f99d" radius={[4,4,0,0]} />
                        <Bar dataKey="Act. Profit"  fill="#16a34a" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#6b7280', padding: 40 }}>No financial data for {pnlYear}.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PEST LOG ── */}
        {tab === 'Pest Log' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
              <button onClick={() => openModal('pest')} style={btn('#dc2626')}><IcoBug /> Log Pest Observation</button>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    {['Date','Pest','Type','Field','Crop','Severity','Area','Treatment?','Status'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#6b7280', fontWeight: 600, fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pests.map(p => (
                    <tr key={p.obs_id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 12px' }}>{fmtDate(p.observation_date)}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{p.pest_name}</td>
                      <td style={{ padding: '10px 12px', color: '#374151' }}>{p.pest_type}</td>
                      <td style={{ padding: '10px 12px', color: '#374151' }}>{p.field_name || '—'}</td>
                      <td style={{ padding: '10px 12px', color: '#374151' }}>{p.crop_name || '—'}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          background: p.severity_level === 'critical' ? '#fee2e2' : p.severity_level === 'high' ? '#ffedd5' : p.severity_level === 'medium' ? '#fef3c7' : '#f3f4f6',
                          color: p.severity_level === 'critical' ? '#dc2626' : p.severity_level === 'high' ? '#c2410c' : p.severity_level === 'medium' ? '#92400e' : '#374151',
                          borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 600,
                        }}>{p.severity_level}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>{p.affected_area ? `${p.affected_area} ac` : '—'}</td>
                      <td style={{ padding: '10px 12px' }}>{p.treatment_required ? '✓ Yes' : 'No'}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ background: '#f3f4f6', color: '#374151', borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{p.status}</span>
                      </td>
                    </tr>
                  ))}
                  {pests.length === 0 && (
                    <tr><td colSpan={9} style={{ padding: 32, textAlign: 'center', color: '#6b7280' }}>No pest observations logged.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={closeModal}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 500, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            {modal.type === 'kpi' && (
              <>
                <h3 style={{ marginBottom: 20, fontWeight: 700 }}>{form.kpi_id ? 'Edit' : 'Add'} KPI</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ gridColumn: '1/-1' }}><label style={lbl}>KPI Name *</label><input style={inpS} value={form.kpi_name || ''} onChange={e => f('kpi_name', e.target.value)} /></div>
                  <div><label style={lbl}>Category</label><input style={inpS} value={form.kpi_category || 'production'} onChange={e => f('kpi_category', e.target.value)} placeholder="production, finance, quality…" /></div>
                  <div><label style={lbl}>Unit</label><input style={inpS} value={form.unit || ''} onChange={e => f('unit', e.target.value)} placeholder="bu/ac, %, $/ac…" /></div>
                  <div><label style={lbl}>Target Value</label><input style={inpS} type="number" value={form.target_value || ''} onChange={e => f('target_value', e.target.value)} /></div>
                  <div><label style={lbl}>Warning Threshold</label><input style={inpS} type="number" value={form.warning_threshold || ''} onChange={e => f('warning_threshold', e.target.value)} /></div>
                  <div><label style={lbl}>Critical Threshold</label><input style={inpS} type="number" value={form.critical_threshold || ''} onChange={e => f('critical_threshold', e.target.value)} /></div>
                  <div><label style={lbl}>Alert Direction</label><select style={inpS} value={form.threshold_direction || 'below'} onChange={e => f('threshold_direction', e.target.value)}><option value="below">Alert when below</option><option value="above">Alert when above</option></select></div>
                </div>
                <div style={mBtns}><button onClick={closeModal} style={btn('#6b7280')}>Cancel</button><button onClick={saveKPI} style={btn('#16a34a')}>Save KPI</button></div>
              </>
            )}
            {modal.type === 'reading' && (
              <>
                <h3 style={{ marginBottom: 20, fontWeight: 700 }}>Add Reading: {form.kpi_name}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label style={lbl}>Value *</label><input style={inpS} type="number" step="any" value={form.value || ''} onChange={e => f('value', e.target.value)} /></div>
                  <div><label style={lbl}>Date</label><input style={inpS} type="date" value={form.reading_date || new Date().toISOString().slice(0, 10)} onChange={e => f('reading_date', e.target.value)} /></div>
                  <div><label style={lbl}>Source</label><input style={inpS} value={form.source || ''} onChange={e => f('source', e.target.value)} placeholder="manual, sensor…" /></div>
                  <div style={{ gridColumn: '1/-1' }}><label style={lbl}>Notes</label><textarea style={{ ...inpS, height: 50 }} value={form.notes || ''} onChange={e => f('notes', e.target.value)} /></div>
                </div>
                <div style={mBtns}><button onClick={closeModal} style={btn('#6b7280')}>Cancel</button><button onClick={addReading} style={btn('#2563eb')}>Add Reading</button></div>
              </>
            )}
            {modal.type === 'pest' && (
              <>
                <h3 style={{ marginBottom: 20, fontWeight: 700 }}>Log Pest Observation</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label style={lbl}>Pest Name *</label><input style={inpS} value={form.pest_name || ''} onChange={e => f('pest_name', e.target.value)} /></div>
                  <div><label style={lbl}>Pest Type</label><select style={inpS} value={form.pest_type || 'insect'} onChange={e => f('pest_type', e.target.value)}>{['insect','weed','disease','fungus','rodent','other'].map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                  <div><label style={lbl}>Severity</label><select style={inpS} value={form.severity_level || 'low'} onChange={e => f('severity_level', e.target.value)}>{['low','medium','high','critical'].map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                  <div><label style={lbl}>Observation Date</label><input style={inpS} type="date" value={form.observation_date || new Date().toISOString().slice(0, 10)} onChange={e => f('observation_date', e.target.value)} /></div>
                  <div><label style={lbl}>Field Name</label><input style={inpS} value={form.field_name || ''} onChange={e => f('field_name', e.target.value)} /></div>
                  <div><label style={lbl}>Crop</label><input style={inpS} value={form.crop_name || ''} onChange={e => f('crop_name', e.target.value)} /></div>
                  <div><label style={lbl}>Affected Area (acres)</label><input style={inpS} type="number" step="0.1" value={form.affected_area || ''} onChange={e => f('affected_area', e.target.value)} /></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 20 }}>
                    <input type="checkbox" id="treat" checked={!!form.treatment_required} onChange={e => f('treatment_required', e.target.checked)} />
                    <label htmlFor="treat" style={{ fontSize: 14, fontWeight: 600 }}>Treatment Required</label>
                  </div>
                  <div style={{ gridColumn: '1/-1' }}><label style={lbl}>Notes</label><textarea style={{ ...inpS, height: 60 }} value={form.notes || ''} onChange={e => f('notes', e.target.value)} /></div>
                </div>
                <div style={mBtns}><button onClick={closeModal} style={btn('#6b7280')}>Cancel</button><button onClick={savePest} style={btn('#dc2626')}>Log Observation</button></div>
              </>
            )}
            {modal.type === 'weather' && (
              <>
                <h3 style={{ marginBottom: 20, fontWeight: 700 }}>Add Weather / Crop Alert</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label style={lbl}>Type</label><select style={inpS} value={form.alert_type || 'frost'} onChange={e => f('alert_type', e.target.value)}>{['frost','heat','drought','flood','hail','wind','disease_risk','other'].map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                  <div><label style={lbl}>Severity</label><select style={inpS} value={form.severity || 'warning'} onChange={e => f('severity', e.target.value)}>{['info','warning','critical'].map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                  <div style={{ gridColumn: '1/-1' }}><label style={lbl}>Title *</label><input style={inpS} value={form.title || ''} onChange={e => f('title', e.target.value)} /></div>
                  <div style={{ gridColumn: '1/-1' }}><label style={lbl}>Message *</label><textarea style={{ ...inpS, height: 70 }} value={form.message || ''} onChange={e => f('message', e.target.value)} /></div>
                  <div><label style={lbl}>Crop</label><input style={inpS} value={form.crop_name || ''} onChange={e => f('crop_name', e.target.value)} /></div>
                  <div><label style={lbl}>Valid Until</label><input style={inpS} type="date" value={form.valid_until || ''} onChange={e => f('valid_until', e.target.value)} /></div>
                  <div style={{ gridColumn: '1/-1' }}><label style={lbl}>Recommended Action</label><input style={inpS} value={form.recommended_action || ''} onChange={e => f('recommended_action', e.target.value)} /></div>
                </div>
                <div style={mBtns}><button onClick={closeModal} style={btn('#6b7280')}>Cancel</button><button onClick={async () => { try { await apiFetch('/api/farm-kpi/weather-alerts', { method: 'POST', body: JSON.stringify({ ...form, business_id: bid }) }); loadTab('Weather Alerts'); closeModal(); } catch { alert('Failed'); }}} style={btn('#7c3aed')}>Save Alert</button></div>
              </>
            )}
          </div>
        </div>
      )}</AccountLayout>
  );
}

const btn = (bg) => ({ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', background: bg, color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' });
const iBtn = { background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '2px 4px' };
const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 3 };
const inpS = { width: '100%', border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 10px', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
const mBtns = { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 };
