// Ported from Oatmeal Farm Network (src/SupplierScorecard.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import AccountLayout from '../../components/AccountLayout';
// ThaiymeChat, the Thaiyme agent widget, is not ported: it needs
// AgentBadge and LanguageContext. It is a floating chat panel, not
// part of this page's function.

const API = import.meta.env.VITE_LIVESTOCK_API_URL || '';

function ScoreRing({ score }) {
  const color = score >= 75 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626';
  const label = score >= 75 ? 'Good' : score >= 50 ? 'Fair' : 'At Risk';
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3.5" />
          <circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3.5"
            strokeDasharray={`${score} ${100 - score}`} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold" style={{ color }}>
          {score}
        </span>
      </div>
      <span className="text-xs font-medium" style={{ color }}>{label}</span>
    </div>
  );
}

function KpiCard({ label, value, color = 'text-gray-800', sub }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function SupplierScorecard() {
  const [params] = useSearchParams();
  const businessId = params.get('BusinessID');
  const authHdr = { Authorization: `Bearer ${localStorage.getItem('access_token')}` };

  const [summary, setSummary] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const [sRes, vRes] = await Promise.all([
        fetch(`${API}/api/supplier-scorecard/summary?business_id=${businessId}`, { headers: authHdr }),
        fetch(`${API}/api/supplier-scorecard/vendors?business_id=${businessId}`, { headers: authHdr }),
      ]);
      if (sRes.ok) setSummary(await sRes.json());
      if (vRes.ok) setVendors(await vRes.json());
    } catch {}
    setLoading(false);
  }, [businessId]);

  useEffect(() => { load(); }, [load]);

  const loadDetail = async (vendor) => {
    setSelected(vendor);
    setDetail([]);
    try {
      const res = await fetch(
        `${API}/api/supplier-scorecard/vendor/${encodeURIComponent(vendor.supplier_name)}?business_id=${businessId}`,
        { headers: authHdr }
      );
      if (res.ok) setDetail(await res.json());
    } catch {}
  };

  const filtered = vendors.filter(v =>
    !search || v.supplier_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AccountLayout pageTitle="Supplier Scorecard">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supplier Scorecard</h1>
          <p className="text-sm text-gray-500">On-time delivery rate, spend, and performance by vendor</p>
        </div>

        {/* KPI strip */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard label="Vendors" value={summary.vendor_count} />
            <KpiCard label="Total POs" value={summary.total_pos} />
            <KpiCard label="Total Spend"
              value={`$${(summary.total_spend || 0).toLocaleString()}`}
              color="text-blue-600" />
            <KpiCard label="On-Time Delivery"
              value={summary.on_time_pct != null ? `${summary.on_time_pct}%` : '—'}
              color={summary.on_time_pct >= 80 ? 'text-green-600' : summary.on_time_pct >= 60 ? 'text-amber-600' : 'text-red-600'}
              sub={`${summary.pending_approval} awaiting approval`} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vendor list */}
          <div className="lg:col-span-1 space-y-3">
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="Search vendor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="space-y-2">
              {loading && <p className="text-sm text-gray-400 text-center py-6">Loading…</p>}
              {!loading && filtered.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">No vendors found. Record receipts on your purchase orders to populate scores.</p>
              )}
              {filtered.map(v => (
                <button key={v.supplier_name}
                  onClick={() => loadDetail(v)}
                  className={`w-full text-left bg-white rounded-xl border p-4 transition-all hover:border-green-400 ${selected?.supplier_name === v.supplier_name ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <ScoreRing score={v.score} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{v.supplier_name}</p>
                      <p className="text-xs text-gray-500">{v.total_pos} POs · ${(v.total_spend).toLocaleString()}</p>
                      {v.on_time_pct != null && (
                        <p className="text-xs text-gray-500">{v.on_time_pct}% on-time
                          {v.avg_days_late > 0 && <span className="text-amber-600"> · avg {v.avg_days_late}d late</span>}
                          {v.avg_days_late <= 0 && <span className="text-green-600"> · avg {Math.abs(v.avg_days_late)}d early</span>}
                        </p>
                      )}
                      {v.pending_approval > 0 && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700">
                          {v.pending_approval} pending approval
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-2">
            {!selected && (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
                <p className="text-4xl mb-3">📊</p>
                <p>Select a vendor to view their PO history</p>
              </div>
            )}

            {selected && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start gap-4">
                    <ScoreRing score={selected.score} />
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-gray-900">{selected.supplier_name}</h2>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Total POs</p>
                          <p className="font-bold text-gray-800">{selected.total_pos}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Total Spend</p>
                          <p className="font-bold text-blue-600">${(selected.total_spend).toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">On-Time %</p>
                          <p className={`font-bold ${selected.on_time_pct >= 80 ? 'text-green-600' : selected.on_time_pct >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                            {selected.on_time_pct != null ? `${selected.on_time_pct}%` : '—'}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Avg Days Late</p>
                          <p className={`font-bold ${selected.avg_days_late > 3 ? 'text-red-600' : selected.avg_days_late > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                            {selected.avg_days_late != null ? (selected.avg_days_late > 0 ? `+${selected.avg_days_late}` : selected.avg_days_late) : '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PO history table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-800 text-sm">Purchase Order History</h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {['PO #', 'Order Date', 'Expected', 'Received', 'Amount', 'Status', 'On Time'].map(h => (
                          <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {detail.length === 0 && (
                        <tr><td colSpan={7} className="text-center py-8 text-gray-400 text-sm">No PO history found</td></tr>
                      )}
                      {detail.map(po => (
                        <tr key={po.po_id} className="hover:bg-gray-50">
                          <td className="px-3 py-3 font-mono text-xs text-blue-600">{po.po_number}</td>
                          <td className="px-3 py-3 text-gray-600">{po.order_date || '—'}</td>
                          <td className="px-3 py-3 text-gray-600">{po.expected_delivery || '—'}</td>
                          <td className="px-3 py-3 text-gray-600">{po.received_date || '—'}</td>
                          <td className="px-3 py-3 font-medium">${(po.total_amount || 0).toLocaleString()}</td>
                          <td className="px-3 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              po.status === 'received' ? 'bg-green-100 text-green-700'
                              : po.status === 'pending_approval' ? 'bg-amber-100 text-amber-700'
                              : 'bg-gray-100 text-gray-600'
                            }`}>{po.status}</span>
                          </td>
                          <td className="px-3 py-3">
                            {po.on_time === null ? <span className="text-gray-400 text-xs">—</span>
                              : po.on_time ? <span className="text-green-600 text-xs font-medium">✓ On Time</span>
                              : <span className="text-red-600 text-xs font-medium">+{po.days_late}d Late</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div></AccountLayout>
  );
}
