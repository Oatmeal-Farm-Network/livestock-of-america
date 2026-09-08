// Ported from Oatmeal Farm Network (src/FarmerSettlement.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import Breadcrumbs from '../../components/Breadcrumbs';
// ThaiymeChat, the Thaiyme agent widget, is not ported: it needs
// AgentBadge and LanguageContext. It is a floating chat panel, not
// part of this page's function.

const API = import.meta.env.VITE_LIVESTOCK_API_URL || '';

function authHeaders() {
  const t = localStorage.getItem('access_token') || '';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` };
}

function fmt(n) {
  if (n == null) return '—';
  return `$${parseFloat(n).toFixed(2)}`;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function StatusBadge({ status }) {
  const colors = { Pending: 'bg-yellow-100 text-yellow-700', Paid: 'bg-green-100 text-green-700', Cancelled: 'bg-gray-100 text-gray-500' };
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${colors[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
}

const BLANK_SETTLEMENT = { FarmerName: '', FarmerPhone: '', FarmerUPI: '', CommissionPct: 0, LogisticsCost: 0, OtherDeductions: 0, Notes: '' };
const BLANK_ITEM = { ItemName: '', Qty: 1, Unit: 'lbs', UnitPrice: 0 };

export default function FarmerSettlement() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const businessId = params.get('BusinessID');

  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK_SETTLEMENT);
  const [formSaving, setFormSaving] = useState(false);

  const [itemForm, setItemForm] = useState(BLANK_ITEM);
  const [itemSaving, setItemSaving] = useState(false);

  const [payRef, setPayRef] = useState('');
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [paying, setPaying] = useState(false);

  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { navigate('/login'); return; }
    if (!businessId) return;
    loadSettlements();
  }, [businessId]);

  const loadSettlements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/farmer-settlement/settlements?business_id=${businessId}`, { headers: authHeaders() });
      if (res.ok) setSettlements(await res.json());
    } catch { setError('Failed to load settlements.'); }
    finally { setLoading(false); }
  }, [businessId]);

  const loadDetail = useCallback(async (id) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`${API}/api/farmer-settlement/settlements/${id}`, { headers: authHeaders() });
      if (res.ok) setSelected(await res.json());
    } catch { setError('Failed to load settlement detail.'); }
    finally { setDetailLoading(false); }
  }, []);

  const createSettlement = async () => {
    if (!form.FarmerName.trim()) { setError('Farmer name is required.'); return; }
    setFormSaving(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/farmer-settlement/settlements`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ...form, BusinessID: parseInt(businessId) }),
      });
      if (!res.ok) throw new Error('Save failed');
      const { SettlementID } = await res.json();
      setShowForm(false);
      setForm(BLANK_SETTLEMENT);
      await loadSettlements();
      await loadDetail(SettlementID);
    } catch (e) { setError(e.message || 'Save failed.'); }
    finally { setFormSaving(false); }
  };

  const addItem = async () => {
    if (!selected || selected.Status !== 'Pending') return;
    if (!itemForm.ItemName.trim()) { setError('Item name is required.'); return; }
    setItemSaving(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/farmer-settlement/settlements/${selected.SettlementID}/items`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ...itemForm, Qty: parseFloat(itemForm.Qty), UnitPrice: parseFloat(itemForm.UnitPrice) }),
      });
      if (!res.ok) throw new Error('Save failed');
      setItemForm(BLANK_ITEM);
      await loadDetail(selected.SettlementID);
      await loadSettlements();
    } catch (e) { setError(e.message || 'Save failed.'); }
    finally { setItemSaving(false); }
  };

  const deleteItem = async (itemId) => {
    try {
      await fetch(`${API}/api/farmer-settlement/items/${itemId}`, { method: 'DELETE', headers: authHeaders() });
      await loadDetail(selected.SettlementID);
      await loadSettlements();
    } catch { setError('Delete failed.'); }
  };

  const markPaid = async () => {
    setPaying(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/farmer-settlement/settlements/${selected.SettlementID}/mark-paid`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ PaymentRef: payRef }),
      });
      if (!res.ok) throw new Error('Failed');
      setPayModalOpen(false);
      setPayRef('');
      setFlash('Payment recorded successfully.');
      await loadDetail(selected.SettlementID);
      await loadSettlements();
    } catch (e) { setError(e.message || 'Failed.'); }
    finally { setPaying(false); }
  };

  const cancelSettlement = async (id) => {
    if (!window.confirm('Cancel this settlement?')) return;
    try {
      await fetch(`${API}/api/farmer-settlement/settlements/${id}/cancel`, { method: 'POST', headers: authHeaders() });
      await loadDetail(id);
      await loadSettlements();
    } catch { setError('Cancel failed.'); }
  };

  const deleteSettlement = async (id) => {
    if (!window.confirm('Delete this settlement? This cannot be undone for paid settlements.')) return;
    try {
      await fetch(`${API}/api/farmer-settlement/settlements/${id}`, { method: 'DELETE', headers: authHeaders() });
      setSelected(null);
      await loadSettlements();
    } catch { setError('Delete failed.'); }
  };

  return (
    <div className="min-h-screen font-sans">
      <PageMeta title="Farmer Settlement | Livestock Of America" description="Calculate and manage farmer payment settlements." noIndex />
      <Header />
      <div className="container mx-auto px-4 py-8" style={{ maxWidth: 1300 }}>
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Farmer Settlement' }]} />
        <div className="flex items-center justify-between mb-6 pb-3 border-b-2 border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Farmer Settlement & Pay</h2>
          <button onClick={() => { setForm(BLANK_SETTLEMENT); setShowForm(true); }} className="regsubmit2" style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}>
            + New Settlement
          </button>
        </div>

        {flash && (
          <div className="bg-green-50 border border-green-300 text-green-700 rounded px-4 py-2 text-sm mb-4">
            {flash} <button onClick={() => setFlash('')} className="ml-2 font-bold">✕</button>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 rounded px-4 py-2 text-sm mb-4">
            {error} <button onClick={() => setError('')} className="ml-2 font-bold">✕</button>
          </div>
        )}

        <div className="flex gap-6" style={{ alignItems: 'flex-start' }}>
          {/* List */}
          <div style={{ width: 300, flexShrink: 0 }}>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Settlements</h3>
            {loading ? (
              <p className="text-gray-400 text-sm">Loading…</p>
            ) : settlements.length === 0 ? (
              <p className="text-gray-400 text-sm">No settlements yet.</p>
            ) : (
              <div className="space-y-2">
                {settlements.map(s => (
                  <div
                    key={s.SettlementID}
                    onClick={() => loadDetail(s.SettlementID)}
                    className={`rounded-lg border p-3 cursor-pointer transition-all ${selected?.SettlementID === s.SettlementID ? 'border-[#3D6B34] bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <p className="font-semibold text-gray-800 text-sm">{s.FarmerName}</p>
                      <StatusBadge status={s.Status} />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{fmtDate(s.CreatedAt)}</p>
                    <p className="text-sm font-semibold text-[#3D6B34] mt-1">Net: {fmt(s.NetPayment)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail */}
          <div className="flex-1">
            {!selected ? (
              <div className="text-center py-20 text-gray-400">Select a settlement to view details</div>
            ) : detailLoading ? (
              <p className="text-gray-400 text-sm">Loading…</p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{selected.FarmerName}</h3>
                    {selected.FarmerPhone && <p className="text-xs text-gray-500">{selected.FarmerPhone}</p>}
                    {selected.FarmerUPI && <p className="text-xs text-gray-500">UPI / ACH: {selected.FarmerUPI}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={selected.Status} />
                    {selected.Status === 'Pending' && (
                      <>
                        <button onClick={() => setPayModalOpen(true)} className="regsubmit2" style={{ fontSize: '0.82rem', padding: '0.35rem 0.9rem' }}>
                          Mark Paid
                        </button>
                        <button onClick={() => cancelSettlement(selected.SettlementID)} className="border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
                          Cancel
                        </button>
                      </>
                    )}
                    <button onClick={() => deleteSettlement(selected.SettlementID)} className="border border-red-300 text-red-600 rounded px-3 py-1.5 text-sm hover:bg-red-50">
                      Delete
                    </button>
                  </div>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 gap-3 mb-5 sm:grid-cols-4">
                  {[
                    { label: 'Gross Sales', value: fmt(selected.GrossSales), color: 'text-gray-800' },
                    { label: `Commission (${selected.CommissionPct}%)`, value: fmt(parseFloat(selected.GrossSales) * parseFloat(selected.CommissionPct) / 100), color: 'text-red-600' },
                    { label: 'Logistics Cost', value: fmt(selected.LogisticsCost), color: 'text-red-600' },
                    { label: 'Net Payment', value: fmt(selected.NetPayment), color: 'text-green-700 font-bold text-base' },
                  ].map(c => (
                    <div key={c.label} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">{c.label}</p>
                      <p className={`text-sm ${c.color}`}>{c.value}</p>
                    </div>
                  ))}
                </div>

                {selected.OtherDeductions > 0 && (
                  <p className="text-xs text-gray-500 mb-4">Other deductions: {fmt(selected.OtherDeductions)}</p>
                )}
                {selected.Notes && <p className="text-sm text-gray-600 mb-4 italic">{selected.Notes}</p>}
                {selected.PaidAt && (
                  <p className="text-xs text-green-600 mb-4">Paid {fmtDate(selected.PaidAt)}{selected.PaymentRef ? ` — Ref: ${selected.PaymentRef}` : ''}</p>
                )}

                {/* Line items */}
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Line Items</h4>
                {selected.items?.length === 0 ? (
                  <p className="text-gray-400 text-sm mb-4">No items yet.</p>
                ) : (
                  <div className="overflow-auto rounded-lg border border-gray-200 mb-4">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr className="bg-gray-50">
                          {['Item', 'Qty', 'Unit', 'Unit Price', 'Line Total', ''].map(h => (
                            <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E5E7EB' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selected.items.map((item, i) => (
                          <tr key={item.ItemID} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #F3F4F6' }}>
                            <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}>{item.ItemName}</td>
                            <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}>{item.Qty}</td>
                            <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', color: '#6B7280' }}>{item.Unit || '—'}</td>
                            <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}>{fmt(item.UnitPrice)}</td>
                            <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', fontWeight: 600 }}>{fmt(item.LineTotal)}</td>
                            <td style={{ padding: '0.5rem 0.75rem' }}>
                              {selected.Status === 'Pending' && (
                                <button onClick={() => deleteItem(item.ItemID)} className="text-red-400 hover:text-red-600 text-xs">Remove</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Add item form */}
                {selected.Status === 'Pending' && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Add Line Item</h4>
                    <div className="grid grid-cols-2 gap-3 mb-3 sm:grid-cols-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Item Name *</label>
                        <input type="text" value={itemForm.ItemName}
                          onChange={e => setItemForm(f => ({ ...f, ItemName: e.target.value }))}
                          className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full" placeholder="e.g. Tomatoes" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Qty</label>
                        <input type="number" step="0.001" value={itemForm.Qty}
                          onChange={e => setItemForm(f => ({ ...f, Qty: e.target.value }))}
                          className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
                        <input type="text" value={itemForm.Unit}
                          onChange={e => setItemForm(f => ({ ...f, Unit: e.target.value }))}
                          className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full" placeholder="lbs, kg, box…" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Unit Price ($)</label>
                        <input type="number" step="0.01" value={itemForm.UnitPrice}
                          onChange={e => setItemForm(f => ({ ...f, UnitPrice: e.target.value }))}
                          className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full" />
                      </div>
                      <div className="flex items-end">
                        <button onClick={addItem} disabled={itemSaving} className="regsubmit2 disabled:opacity-50 w-full" style={{ fontSize: '0.82rem', padding: '0.35rem 0.9rem' }}>
                          {itemSaving ? 'Adding…' : 'Add Item'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* New settlement modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !formSaving && setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">New Settlement</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Farmer Name *</label>
                <input type="text" value={form.FarmerName}
                  onChange={e => setForm(f => ({ ...f, FarmerName: e.target.value }))}
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                  <input type="text" value={form.FarmerPhone}
                    onChange={e => setForm(f => ({ ...f, FarmerPhone: e.target.value }))}
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">UPI / ACH / Pay Ref</label>
                  <input type="text" value={form.FarmerUPI}
                    onChange={e => setForm(f => ({ ...f, FarmerUPI: e.target.value }))}
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Commission %</label>
                  <input type="number" step="0.01" value={form.CommissionPct}
                    onChange={e => setForm(f => ({ ...f, CommissionPct: e.target.value }))}
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Logistics Cost ($)</label>
                  <input type="number" step="0.01" value={form.LogisticsCost}
                    onChange={e => setForm(f => ({ ...f, LogisticsCost: e.target.value }))}
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Other Deductions ($)</label>
                  <input type="number" step="0.01" value={form.OtherDeductions}
                    onChange={e => setForm(f => ({ ...f, OtherDeductions: e.target.value }))}
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea value={form.Notes}
                  onChange={e => setForm(f => ({ ...f, Notes: e.target.value }))}
                  rows={2} className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">You can add line items after creating the settlement.</p>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowForm(false)} disabled={formSaving} className="border border-gray-300 rounded px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
              <button onClick={createSettlement} disabled={formSaving} className="regsubmit2 disabled:opacity-50" style={{ fontSize: '0.85rem', padding: '0.4rem 1.2rem' }}>
                {formSaving ? 'Creating…' : 'Create Settlement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark paid modal */}
      {payModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !paying && setPayModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Record Payment</h3>
            <p className="text-sm text-gray-600 mb-4">Net payable: <strong>{fmt(selected?.NetPayment)}</strong> to {selected?.FarmerName}</p>
            <label className="block text-xs font-medium text-gray-600 mb-1">Payment Reference (transaction ID, UTR, etc.)</label>
            <input type="text" value={payRef} onChange={e => setPayRef(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full mb-4" placeholder="Optional" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setPayModalOpen(false)} disabled={paying} className="border border-gray-300 rounded px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
              <button onClick={markPaid} disabled={paying} className="regsubmit2 disabled:opacity-50" style={{ fontSize: '0.85rem', padding: '0.4rem 1.2rem' }}>
                {paying ? 'Saving…' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer /></div>
  );
}
