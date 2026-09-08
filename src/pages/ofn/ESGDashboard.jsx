// Ported from Oatmeal Farm Network (src/ESGDashboard.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
// src/ESGDashboard.jsx
// ESG (Environmental, Social, Governance) intelligence dashboard.
// Pulls live sustainability metrics from the ESG Reports API and displays
// them in a printable, investor/auditor-ready format. Quantifies resource
// efficiency, sourcing transparency, cold-chain integrity, and residue testing
// to support grant applications, enterprise buyer onboarding, and ESG narratives.
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import { useAccount } from '../../lib/AccountContext';

const API   = import.meta.env.VITE_LIVESTOCK_API_URL || '';
const GREEN  = '#3D6B34';
const GREEN_DARK  = '#2c4f25';
const GREEN_LIGHT = '#f0f7ee';
const GREEN_BORDER = '#c7dfc2';

function pct(num, den) {
  if (!den || den === 0) return null;
  return Math.round((num / den) * 100);
}

function ScoreRing({ value, label, color }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const dash = value != null ? circ * (1 - value / 100) : circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width="76" height="76" viewBox="0 0 76 76">
        <circle cx="38" cy="38" r={r} fill="none" stroke="#e5e7eb" strokeWidth="7"/>
        <circle cx="38" cy="38" r={r} fill="none" stroke={color || GREEN}
          strokeWidth="7" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={dash}
          transform="rotate(-90 38 38)"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <text x="38" y="43" textAnchor="middle" fontSize="15" fontWeight="700" fill="#111827">
          {value != null ? `${value}%` : '—'}
        </text>
      </svg>
      <span style={{ fontSize: 11, color: '#6b7280', textAlign: 'center', maxWidth: 80 }}>{label}</span>
    </div>
  );
}

function StatCard({ label, value, unit, color, sub }) {
  return (
    <div style={{
      background: '#fff', border: `1px solid ${GREEN_BORDER}`, borderRadius: 12,
      padding: '14px 16px', flex: '1 1 140px',
    }}>
      <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || '#111827' }}>
        {value != null ? value : '—'}
        {value != null && unit && <span style={{ fontSize: 13, fontWeight: 400, color: '#9ca3af', marginLeft: 3 }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: GREEN_DARK, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, borderBottom: `2px solid ${GREEN_BORDER}`, paddingBottom: 6 }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function ESGDashboard() {
  const { businesses: ctxBusinesses } = useAccount();
  const isLoggedIn = !!localStorage.getItem('access_token');
  const [businessId, setBusinessId] = useState(null);
  const [snapshot, setSnapshot]     = useState(null);
  const [metrics, setMetrics]       = useState([]);
  const [reports, setReports]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [generating, setGenerating] = useState(false);
  const [period, setPeriod]         = useState('90');

  const token = () => localStorage.getItem('access_token');

  // Pick first business from context once it loads
  useEffect(() => {
    if (!ctxBusinesses?.length || businessId) return;
    const first = ctxBusinesses[0];
    setBusinessId(first.BusinessID ?? first.businessId ?? first.id);
  }, [ctxBusinesses]);

  const loadData = useCallback(() => {
    if (!businessId) return;
    setLoading(true);
    const days = parseInt(period, 10) || 90;
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - days);
    const fmt = d => d.toISOString().slice(0, 10);

    Promise.allSettled([
      fetch(`${API}/api/esg/${businessId}/live?start=${fmt(start)}&end=${fmt(end)}`)
        .then(r => r.ok ? r.json() : null),
      fetch(`${API}/api/esg/${businessId}/metrics`, { headers: { Authorization: `Bearer ${token()}` } })
        .then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/esg/${businessId}/reports`, { headers: { Authorization: `Bearer ${token()}` } })
        .then(r => r.ok ? r.json() : []),
    ]).then(([snap, mets, reps]) => {
      if (snap.value) setSnapshot(snap.value);
      if (mets.value) setMetrics(Array.isArray(mets.value) ? mets.value : []);
      if (reps.value) setReports(Array.isArray(reps.value) ? reps.value : []);
    }).finally(() => setLoading(false));
  }, [businessId, period]);

  useEffect(() => { loadData(); }, [loadData]);

  async function generateReport() {
    if (!businessId) return;
    setGenerating(true);
    const days = parseInt(period, 10) || 90;
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - days);
    const fmt = d => d.toISOString().slice(0, 10);
    try {
      const res = await fetch(`${API}/api/esg/${businessId}/reports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ period_start: fmt(start), period_end: fmt(end), title: `ESG Report — ${fmt(end)}` }),
      });
      if (res.ok) loadData();
    } catch (e) { console.warn(e); }
    finally { setGenerating(false); }
  }

  if (!isLoggedIn) {
    return (
      <div>
        <Header />
        <div style={{ minHeight: '60vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Montserrat, system-ui, sans-serif' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#6b7280', marginBottom: 12 }}>Please log in to view your ESG dashboard.</p>
            <Link to="/login" style={{ color: GREEN, fontWeight: 700 }}>Log In →</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // API returns { business_id, live: { sourcing, procurement, cold_chain, ... }, manual_metrics }
  const live = snapshot?.live || {};
  const src  = live.sourcing     || {};
  const proc = live.procurement  || {};
  const cc   = live.cold_chain   || {};
  const certPct      = src.farms_certified != null && src.active_farms > 0
    ? pct(src.farms_certified, src.active_farms) : null;
  const residuePct   = proc.purchase_count > 0
    ? pct(proc.residue_passed, proc.purchase_count) : null;
  const coldChainPct = cc.dispatches > 0
    ? pct((cc.dispatches - (cc.breaches || 0)), cc.dispatches) : null;

  return (
    <div>
      <PageMeta title="ESG Dashboard" description="Environmental, social, and governance intelligence for your farm or food business." />
      <Header />
      <main style={{ minHeight: '80vh', background: '#f9fafb', fontFamily: 'Montserrat, system-ui, sans-serif' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px' }}>

          {/* Page header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
              </svg>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>ESG Dashboard</h1>
            </div>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
              Environmental, social &amp; governance metrics — audit-ready, investor-facing.
            </p>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            {(ctxBusinesses?.length ?? 0) > 1 && (
              <select
                value={businessId || ''}
                onChange={e => setBusinessId(Number(e.target.value))}
                style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, fontFamily: 'inherit' }}
              >
                {ctxBusinesses.map(b => (
                  <option key={b.BusinessID ?? b.id} value={b.BusinessID ?? b.id}>
                    {b.BusinessName ?? b.name}
                  </option>
                ))}
              </select>
            )}
            <select
              value={period}
              onChange={e => setPeriod(e.target.value)}
              style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, fontFamily: 'inherit' }}
            >
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="180">Last 6 months</option>
              <option value="365">Last year</option>
            </select>
            <button
              onClick={loadData}
              style={{ padding: '7px 16px', borderRadius: 8, border: `1px solid ${GREEN_BORDER}`, background: GREEN_LIGHT, color: GREEN_DARK, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
            >
              Refresh
            </button>
            <button
              onClick={generateReport}
              disabled={generating || !businessId}
              style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: GREEN, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: generating ? 0.7 : 1 }}
            >
              {generating ? 'Generating…' : 'Save Snapshot'}
            </button>
            <button
              onClick={() => window.print()}
              style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', color: '#374151', fontSize: 13, cursor: 'pointer' }}
            >
              Print / Export
            </button>
          </div>

          {loading && (
            <p style={{ color: '#9ca3af', fontSize: 13 }}>Loading ESG data…</p>
          )}

          {!loading && !snapshot && businessId && (
            <div style={{ background: GREEN_LIGHT, border: `1px solid ${GREEN_BORDER}`, borderRadius: 12, padding: 20, color: '#374151', fontSize: 13 }}>
              No ESG data available yet. This dashboard uses your food aggregator sourcing, residue testing,
              cold-chain logistics, and IoT sensor data. Start by registering your supplier farms and running
              purchase orders through the platform.
            </div>
          )}

          {snapshot && (
            <>
              {/* Key score rings */}
              <Section title="Sustainability Scores">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center', marginBottom: 8 }}>
                  <ScoreRing value={certPct} label="Certified Farm Sourcing" color={GREEN} />
                  <ScoreRing value={residuePct} label="Residue Test Pass Rate" color="#16a34a" />
                  <ScoreRing value={coldChainPct} label="Cold-Chain Integrity" color="#0284c7" />
                </div>
                <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 8 }}>
                  Based on {parseInt(period, 10)}-day period · {src.active_farms || 0} supplier farms
                </p>
              </Section>

              {/* Sourcing transparency */}
              <Section title="Sourcing Transparency">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  <StatCard label="Active Farms" value={src.active_farms} color={GREEN} />
                  <StatCard label="Certified Farms" value={src.farms_certified} color={GREEN}
                    sub={certPct != null ? `${certPct}% of supply base` : null} />
                  <StatCard label="Purchases" value={proc.purchase_count} color="#374151"
                    sub={proc.kg_received ? `${parseFloat(proc.kg_received).toLocaleString()} kg` : null} />
                  <StatCard label="Total Spend" value={proc.spend ? `$${parseFloat(proc.spend).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : null} color="#374151" />
                </div>
                {src.certifications?.length > 0 && (
                  <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {src.certifications.map(c => (
                      <span key={c.Certification} style={{
                        fontSize: 11, background: GREEN_LIGHT, border: `1px solid ${GREEN_BORDER}`,
                        borderRadius: 20, padding: '3px 10px', color: GREEN_DARK, fontWeight: 600,
                      }}>
                        {c.Certification} · {c.N}
                      </span>
                    ))}
                  </div>
                )}
              </Section>

              {/* Residue & cold chain */}
              <Section title="Quality &amp; Cold-Chain Integrity">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  <StatCard label="Residue Tests" value={proc.purchase_count} />
                  <StatCard label="Tests Passed" value={proc.residue_passed} color="#16a34a"
                    sub={residuePct != null ? `${residuePct}% pass rate` : null} />
                  <StatCard label="Tests Failed" value={proc.residue_failed} color={(proc.residue_failed || 0) > 0 ? '#dc2626' : '#6b7280'} />
                  <StatCard label="Cold-Chain Dispatches" value={cc.dispatches} />
                  <StatCard label="No Breach" value={cc.dispatches != null ? (cc.dispatches - (cc.breaches || 0)) : null} color="#0284c7"
                    sub={coldChainPct != null ? `${coldChainPct}% integrity` : null} />
                  <StatCard label="Breaches" value={cc.breaches} color={(cc.breaches || 0) > 0 ? '#f59e0b' : '#6b7280'} />
                </div>
              </Section>

              {/* Manual metrics */}
              {metrics.length > 0 && (
                <Section title="Manual Sustainability Metrics">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {metrics.map(m => (
                      <div key={m.MetricID || m.metricid} style={{
                        background: '#fff', border: `1px solid ${GREEN_BORDER}`, borderRadius: 10,
                        padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 12,
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>
                            {m.Label || m.label}
                          </div>
                          {(m.PeriodStart || m.periodstart) && (
                            <div style={{ fontSize: 10, color: '#9ca3af' }}>
                              {String(m.PeriodStart || m.periodstart).slice(0, 10)} – {String(m.PeriodEnd || m.periodend).slice(0, 10)}
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: GREEN, textAlign: 'right' }}>
                          {m.Value || m.value}
                          {(m.Unit || m.unit) && <span style={{ fontSize: 11, fontWeight: 400, color: '#9ca3af', marginLeft: 3 }}>{m.Unit || m.unit}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Saved reports */}
              {reports.length > 0 && (
                <Section title="Saved ESG Reports">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {reports.slice(0, 6).map(r => (
                      <div key={r.ReportID || r.reportid} style={{
                        background: '#fff', border: `1px solid #e5e7eb`, borderRadius: 10,
                        padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                            {r.Title || r.title || 'ESG Snapshot'}
                          </div>
                          <div style={{ fontSize: 10, color: '#9ca3af' }}>
                            {String(r.PeriodStart || r.periodstart || '').slice(0, 10)} – {String(r.PeriodEnd || r.periodend || '').slice(0, 10)}
                            · Generated {String(r.GeneratedDate || r.generateddate || '').slice(0, 10)}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <a
                            href={`${API}/api/esg/reports/${r.ReportID || r.reportid}/html`}
                            target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: 11, color: GREEN, fontWeight: 600, textDecoration: 'none' }}
                          >
                            HTML ↗
                          </a>
                          <a
                            href={`${API}/api/esg/reports/${r.ReportID || r.reportid}/pdf`}
                            target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textDecoration: 'none', marginLeft: 8 }}
                          >
                            PDF ↗
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Narrative helper */}
              <div style={{
                background: GREEN_LIGHT, border: `1px solid ${GREEN_BORDER}`,
                borderRadius: 12, padding: '14px 18px', marginTop: 8,
              }}>
                <p style={{ fontSize: 12, color: GREEN_DARK, margin: 0, lineHeight: 1.6 }}>
                  <strong>Using this data:</strong> Certified farm sourcing % and residue test pass rate are the two
                  most commonly requested ESG metrics by enterprise food buyers and EU CSRD auditors. Export a saved
                  snapshot as PDF for grant applications or investor decks. Ask{' '}
                  <Link to="/app/thaiyme" style={{ color: GREEN, fontWeight: 700 }}>Thaiyme</Link>{' '}
                  to summarize or draft an ESG narrative from this data.
                </p>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />

      <style>{`
        @media print {
          header, nav, button, .print-hide { display: none !important; }
          main { background: white !important; }
          @page { margin: 0.75in; }
        }
      `}</style>
    </div>
  );
}
