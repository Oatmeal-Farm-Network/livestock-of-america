// Ported from Oatmeal Farm Network (src/SellerOrders.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
// src/SellerOrders.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation } from '../../lib/i18n';
import AccountLayout from '../../components/AccountLayout';
import { useAccount } from '../../lib/AccountContext';
import { getPeopleId } from '../../lib/auth';

const API = import.meta.env.VITE_LIVESTOCK_API_URL || '';

export default function SellerOrders() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const BusinessID = searchParams.get('BusinessID');
  const PeopleID = getPeopleId();
  const { Business, LoadBusiness } = useAccount();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [processingId, setProcessingId] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [showDash, setShowDash] = useState(true);

  useEffect(() => { if (BusinessID) LoadBusiness(BusinessID); }, [BusinessID]);

  useEffect(() => {
    if (!BusinessID) return;
    fetch(`${API}/api/marketplace/seller/analytics?business_id=${BusinessID}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setAnalytics(d))
      .catch(() => {});
  }, [BusinessID]);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.set('status', filter);
      const res = await fetch(`${API}/api/marketplace/orders/seller/${BusinessID}?${params}`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { if (BusinessID) load(); }, [BusinessID, filter]);

  const confirmItem = async (orderItemId, estimatedDate) => {
    setProcessingId(orderItemId);
    try {
      await fetch(`${API}/api/marketplace/orders/seller/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ OrderItemID: orderItemId, Status: 'confirmed', EstimatedDeliveryDate: estimatedDate || null }),
      });
      load();
    } catch {} finally { setProcessingId(null); }
  };

  const rejectItem = async (orderItemId) => {
    const reason = prompt(t('seller_orders.prompt_reject'));
    if (!reason) return;
    setProcessingId(orderItemId);
    try {
      await fetch(`${API}/api/marketplace/orders/seller/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ OrderItemID: orderItemId, Status: 'rejected', RejectionReason: reason }),
      });
      load();
    } catch {} finally { setProcessingId(null); }
  };

  const shipItem = async (orderItemId) => {
    const tracking = prompt(t('seller_orders.prompt_tracking'));
    setProcessingId(orderItemId);
    try {
      await fetch(`${API}/api/marketplace/orders/seller/ship`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ OrderItemID: orderItemId, TrackingNumber: tracking || null }),
      });
      load();
    } catch {} finally { setProcessingId(null); }
  };

  const statusBadge = (status) => {
    const map = {
      pending: { bg: '#fef3c7', color: '#92400e' },
      confirmed: { bg: '#d1fae5', color: '#065f46' },
      rejected: { bg: '#fee2e2', color: '#991b1b' },
      shipped: { bg: '#e0e7ff', color: '#3730a3' },
      delivered: { bg: '#d1fae5', color: '#065f46' },
    };
    const s = map[status] || map.pending;
    return <span style={{ backgroundColor: s.bg, color: s.color, fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>{status}</span>;
  };

  const FILTERS = ['pending', 'confirmed', 'shipped', 'delivered', ''];

  return (
    <AccountLayout Business={Business} BusinessID={BusinessID} PeopleID={PeopleID}
      pageTitle={t('seller_orders.page_title')}
      breadcrumbs={[
        { label: t('seller_orders.crumb_dashboard'), to: '/dashboard' },
        { label: t('seller_orders.crumb_marketplace') },
        { label: t('seller_orders.page_title') },
      ]}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">{t('seller_orders.heading')}</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDash(v => !v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${showDash ? 'bg-[#3D6B34] text-white border-[#3D6B34]' : 'bg-white text-[#3D6B34] border-[#3D6B34] hover:bg-[#e8f0dc]'}`}
            >
              Dashboard
            </button>
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${filter === f ? 'bg-[#819360] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {f ? t('seller_orders.filter_' + f) : t('seller_orders.filter_all')}
              </button>
            ))}
          </div>
        </div>

        {/* ── Revenue Dashboard ── */}
        {showDash && analytics && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow p-6 space-y-5">
            <h2 className="text-base font-bold text-gray-800">Performance Summary</h2>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Revenue', value: `$${analytics.overall.TotalRevenue.toFixed(2)}`, color: '#3D6B34' },
                { label: 'This Month', value: `$${analytics.overall.RevenueThisMonth.toFixed(2)}`, color: '#3D6B34' },
                { label: 'Total Orders', value: analytics.overall.TotalOrders, color: '#1d4ed8' },
                { label: 'Repeat Rate', value: `${analytics.repeatRate}%`, color: analytics.repeatRate >= 30 ? '#3D6B34' : '#92400e' },
              ].map(kpi => (
                <div key={kpi.label} className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">{kpi.label}</p>
                  <p className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
                </div>
              ))}
            </div>

            {/* Monthly Revenue Bar Chart */}
            {analytics.monthly.length > 0 && (() => {
              const maxRev = Math.max(...analytics.monthly.map(m => m.Revenue), 1);
              const BAR_H = 80;
              const BAR_W = 28;
              const GAP = 8;
              const months = analytics.monthly;
              const svgW = months.length * (BAR_W + GAP) + 24;
              const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
              return (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Monthly Revenue</p>
                  <div className="overflow-x-auto">
                    <svg width={svgW} height={BAR_H + 36} style={{ display: 'block' }}>
                      {months.map((m, i) => {
                        const barH = Math.max(2, Math.round((m.Revenue / maxRev) * BAR_H));
                        const x = 12 + i * (BAR_W + GAP);
                        const y = BAR_H - barH;
                        return (
                          <g key={`${m.yr}-${m.mo}`}>
                            <rect x={x} y={y} width={BAR_W} height={barH} rx="3" fill="#3D6B34" opacity="0.85" />
                            {m.Revenue > 0 && (
                              <text x={x + BAR_W / 2} y={y - 3} textAnchor="middle" fontSize="8" fill="#374151">${m.Revenue >= 1000 ? `${(m.Revenue/1000).toFixed(1)}k` : m.Revenue.toFixed(0)}</text>
                            )}
                            <text x={x + BAR_W / 2} y={BAR_H + 14} textAnchor="middle" fontSize="9" fill="#9CA3AF">{MONTH_NAMES[m.mo - 1]}</text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>
              );
            })()}

            {/* Top Buyers */}
            {analytics.topBuyers.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Top Buyers</p>
                <div className="space-y-2">
                  {analytics.topBuyers.map((b, i) => (
                    <div key={b.email} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#e8f0dc] text-[#3D6B34] text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{b.name}</p>
                          <p className="text-xs text-gray-400">{b.orders} order{b.orders !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <span className="font-bold text-[#3D6B34]">${b.spend.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}


        {loading ? <div className="text-center py-12 text-gray-400">{t('seller_orders.loading')}</div> :
          orders.length === 0 ? <div className="text-center py-12 text-gray-400">{t('seller_orders.empty', { filter: filter || '' })}</div> :
          <div className="space-y-4">
            {orders.map(o => (
              <div key={o.OrderItemID} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="font-bold text-gray-700 mr-2">{o.OrderNumber}</span>
                    {statusBadge(o.SellerStatus)}
                    <p className="text-sm text-gray-500 mt-1">{o.BuyerName} · {o.BuyerEmail}</p>
                    {o.BuyerPhone && <p className="text-xs text-gray-400">{o.BuyerPhone}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-[#819360]">${parseFloat(o.LineTotal).toFixed(2)}</p>
                    <p className="text-xs text-gray-400">{t('seller_orders.your_payout', { amount: parseFloat(o.SellerPayout).toFixed(2) })}</p>
                    <p className="text-xs text-gray-400">{new Date(o.CreatedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="text-sm font-semibold text-gray-700">{o.ProductTitle}</p>
                  <p className="text-xs text-gray-500">{t('seller_orders.qty_line', { qty: o.Quantity, price: parseFloat(o.UnitPrice).toFixed(2), type: o.ProductType })}</p>
                  {o.Notes && <p className="text-xs text-gray-400 mt-1">{t('seller_orders.notes_label')} {o.Notes}</p>}
                  {o.DeliveryMethod && <p className="text-xs text-gray-400">{t('seller_orders.delivery_label')} {o.DeliveryMethod} {o.DeliveryAddress ? `- ${o.DeliveryAddress}` : ''}</p>}
                  {o.RequestedDeliveryDate && <p className="text-xs text-gray-400">{t('seller_orders.requested_date_label')} {new Date(o.RequestedDeliveryDate).toLocaleDateString()}</p>}
                </div>

                <div className="flex gap-2">
                  {o.SellerStatus === 'pending' && (
                    <>
                      <button onClick={() => confirmItem(o.OrderItemID)} disabled={processingId === o.OrderItemID}
                        className="bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">
                        {t('seller_orders.btn_confirm')}
                      </button>
                      <button onClick={() => rejectItem(o.OrderItemID)} disabled={processingId === o.OrderItemID}
                        className="bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50">
                        {t('seller_orders.btn_reject')}
                      </button>
                    </>
                  )}
                  {o.SellerStatus === 'confirmed' && (
                    <button onClick={() => shipItem(o.OrderItemID)} disabled={processingId === o.OrderItemID}
                      className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                      {t('seller_orders.btn_ship')}
                    </button>
                  )}
                  {o.SellerStatus === 'shipped' && o.TrackingNumber && (
                    <span className="text-sm text-gray-500">{t('seller_orders.tracking_label')} {o.TrackingNumber}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        }
      </div>
    </AccountLayout>
  );
}
