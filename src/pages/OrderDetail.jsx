// Ported from Oatmeal Farm Network (src/OrderDetail.jsx). Page logic is unchanged
// except where LOA's backend serves a different shape; those are marked
// inline. Router package, i18n hook, component paths, API base env var and
// the people-id accessor differ as in the other ported pages.
// src/OrderDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router';
import { useTranslation } from '../lib/i18n';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';

const API = import.meta.env.VITE_LIVESTOCK_API_URL || '';

const statusColors = {
  pending: '#fbbf24', confirmed: '#22c55e', partially_confirmed: '#3b82f6',
  rejected: '#ef4444', shipped: '#6366f1', delivered: '#059669',
  cancelled: '#9ca3af', processing: '#f59e0b', paid: '#22c55e', failed: '#ef4444',
};

export default function OrderDetail() {
  const { t } = useTranslation();
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isNew = searchParams.get('new') === 'true';
  const showPay = searchParams.get('pay') === 'true';

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/marketplace/orders/${orderId}`);
        if (res.ok) setOrder(await res.json());
      } catch {} finally { setLoading(false); }
    };
    if (orderId) load();
  }, [orderId]);

  // Buyer-confirms-delivery is not available on LOA: the backend has no
  // /orders/{id}/deliver route, so the control is not rendered below.

  const Badge = ({ status }) => (
    <span style={{
      backgroundColor: statusColors[status] || '#9ca3af',
      color: '#fff', fontSize: '0.65rem', fontWeight: 700,
      padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase'
    }}>
      {status?.replace('_', ' ')}
    </span>
  );

  if (loading) return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Header />
      <div className="text-center py-20 text-gray-400">{t('order_detail.loading')}</div>
      <Footer />
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Header />
      <div className="text-center py-20 text-gray-400">{t('order_detail.not_found')}</div>
      <Footer />
    </div>
  );

  const deliveryLabel = order.DeliveryMethod === 'pickup'
    ? t('order_detail.delivery_pickup')
    : order.DeliveryMethod === 'local_delivery'
      ? t('order_detail.delivery_local')
      : t('order_detail.delivery_shipping');

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <PageMeta
        title={`Order #${order.order_id || orderId} | Livestock Of America`}
        description={t('order_detail.meta_description')}
        noIndex
      />
      <Header />

      <div className="flex-grow py-8">
        <div className="max-w-3xl mx-auto px-4 space-y-6">
          <Breadcrumbs items={[
            { label: t('order_detail.breadcrumb_home'), to: '/' },
            { label: t('order_detail.breadcrumb_orders'), to: '/orders' },
            { label: t('order_detail.breadcrumb_order', { n: order.order_id || orderId }) },
          ]} />
          <button onClick={() => navigate('/orders')} className="text-sm text-[#819360] font-semibold hover:underline">{t('order_detail.btn_all_orders')}</button>

          {isNew && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-green-700 font-bold text-lg">{t('order_detail.order_placed_heading')}</p>
              <p className="text-green-600 text-sm">{t('order_detail.order_placed_body')}</p>
            </div>
          )}

          {/* Order header */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold text-gray-800">{order.OrderNumber}</h1>
                <p className="text-sm text-gray-400">{new Date(order.CreatedAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div className="text-right">
                <Badge status={order.OrderStatus} />
                <p className="text-2xl font-bold text-[#819360] mt-1">${parseFloat(order.TotalAmount).toFixed(2)}</p>
                <p className="text-xs text-gray-400">{t('order_detail.payment_label')} <Badge status={order.PaymentStatus} /></p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 text-sm text-gray-600">
              <div><span className="text-gray-400">{t('order_detail.delivery_label')}</span> {deliveryLabel}</div>
              {order.DeliveryAddress && <div><span className="text-gray-400">{t('order_detail.address_label')}</span> {order.DeliveryAddress}</div>}
              {order.RequestedDeliveryDate && <div><span className="text-gray-400">{t('order_detail.requested_label')}</span> {new Date(order.RequestedDeliveryDate).toLocaleDateString()}</div>}
            </div>
          </div>

          {/* Payment action */}
          {(showPay || order.PaymentStatus === 'authorized') && order.OrderStatus !== 'cancelled' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
              <p className="font-bold text-amber-800 mb-2">{t('order_detail.payment_required_heading')}</p>
              <p className="text-sm text-amber-600 mb-4">{t('order_detail.payment_required_body')}</p>
              <button className="bg-[#819360] text-white font-bold px-8 py-3 rounded-xl hover:bg-[#3D6B35]"
                onClick={() => alert(t('order_detail.stripe_placeholder'))}>
                {t('order_detail.btn_pay', { amount: parseFloat(order.TotalAmount).toFixed(2) })}
              </button>
            </div>
          )}

          {/* Order items */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="font-bold text-gray-700">{t('order_detail.order_items_heading')}</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {(order.items || []).map(item => (
                <div key={item.OrderItemID} className="p-5">
                  <div className="flex items-start gap-4">
                    {item.ImageURL ? (
                      <img
                        src={item.ImageURL}
                        alt={item.ProductTitle}
                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-gray-100"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0" />
                    )}
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-800">{item.ProductTitle}</p>
                          <p className="text-sm text-gray-500">{item.BusinessName || item.SellerName}</p>
                          {item.SellerBusinessID && (
                            <a
                              href={`/provenance/${item.SellerBusinessID}?productTitle=${encodeURIComponent(item.ProductTitle || '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-[#3D6B34] hover:underline mt-1"
                              title="Printable 'Sourced From' card for menus and social"
                            >
                              {t('order_detail.sourcing_card')}
                            </a>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold">${parseFloat(item.LineTotal).toFixed(2)}</p>
                          <p className="text-xs text-gray-400">{item.Quantity} × ${parseFloat(item.UnitPrice).toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge status={item.SellerStatus} />
                        {item.TrackingNumber && <span className="text-xs text-gray-500">{t('order_detail.tracking', { n: item.TrackingNumber })}</span>}
                        {item.EstimatedDeliveryDate && <span className="text-xs text-gray-400">{t('order_detail.est_delivery', { date: new Date(item.EstimatedDeliveryDate).toLocaleDateString() })}</span>}
                      </div>
                      {item.RejectionReason && (
                        <p className="text-sm text-red-500 mt-2 bg-red-50 px-3 py-1 rounded">{t('order_detail.rejection_reason', { reason: item.RejectionReason })}</p>
                      )}
                      {/* OFN shows a "confirm delivery" button here. LOA's backend
                          has no /orders/{id}/deliver route, so the button would
                          post into a 404 and reload, looking like a silent
                          failure. Restore it once that endpoint exists. */}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">{t('order_detail.subtotal')}</span><span>${parseFloat(order.Subtotal).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('order_detail.service_fee')}</span><span>${parseFloat(order.PlatformFee).toFixed(2)}</span></div>
              <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-lg">
                <span>{t('order_detail.total')}</span><span className="text-[#819360]">${parseFloat(order.TotalAmount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Status history */}
          {order.history && order.history.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-bold text-gray-700 mb-3">{t('order_detail.timeline_heading')}</h3>
              <div className="space-y-3">
                {order.history.map((h, i) => (
                  <div key={h.HistoryID || i} className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: statusColors[h.NewStatus] || '#9ca3af' }} />
                    <div>
                      <p className="text-sm font-semibold text-gray-700 capitalize">{h.NewStatus?.replace('_', ' ')}</p>
                      <p className="text-xs text-gray-400">{new Date(h.CreatedAt).toLocaleString()} · {h.ChangedByRole}</p>
                      {h.Notes && <p className="text-xs text-gray-500">{h.Notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
