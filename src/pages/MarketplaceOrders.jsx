// Ported from Oatmeal Farm Network (src/MarketplaceOrders.jsx). Page logic is unchanged
// except where LOA's backend serves a different shape; those are marked
// inline. Router package, i18n hook, component paths, API base env var and
// the people-id accessor differ as in the other ported pages.
// src/MarketplaceOrders.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from '../lib/i18n';
import AccountLayout from '../components/AccountLayout';
import { useAccount } from '../lib/AccountContext';
import { getPeopleId } from '../lib/auth';

const API = import.meta.env.VITE_LIVESTOCK_API_URL || '';

const STATUS_BG = {
  pending:              { bg: '#fef3c7', text: '#92400e' },
  confirmed:            { bg: '#d1fae5', text: '#065f46' },
  partially_confirmed:  { bg: '#dbeafe', text: '#1e40af' },
  rejected:             { bg: '#fee2e2', text: '#991b1b' },
  shipped:              { bg: '#e0e7ff', text: '#3730a3' },
  delivered:            { bg: '#d1fae5', text: '#065f46' },
  cancelled:            { bg: '#f3f4f6', text: '#6b7280' },
  processing:           { bg: '#fef3c7', text: '#92400e' },
};

const FILTERS = ['', 'pending', 'confirmed', 'shipped', 'delivered'];

export default function MarketplaceOrders() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const peopleId = getPeopleId();
  const businessId = new URLSearchParams(window.location.search).get('BusinessID');
  const { Business } = useAccount();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!peopleId) return;
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filter) params.set('status', filter);
        const res = await fetch(`${API}/api/marketplace/orders?buyer_people_id=${peopleId}?${params}`);
        const data = await res.json();
        setOrders(data.orders || []);
      } catch {} finally { setLoading(false); }
    };
    load();
  }, [peopleId, filter]);

  function Badge({ status }) {
    const { t } = useTranslation();
    const s = STATUS_BG[status] || STATUS_BG.pending;
    return (
      <span style={{ backgroundColor: s.bg, color: s.text, fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
        {t('marketplace_orders.status_' + status, { defaultValue: status })}
      </span>
    );
  }

  const content = (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">{t('marketplace_orders.page_title')}</h1>
        <div className="flex gap-2">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${filter === f ? 'bg-[#819360] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f ? t('marketplace_orders.status_' + f, { defaultValue: f }) : t('marketplace_orders.filter_all')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">{t('marketplace_orders.loading')}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg mb-4">{t('marketplace_orders.empty')}</p>
          <button onClick={() => navigate('/marketplaces/farm-to-table')}
            className="bg-[#819360] text-white font-semibold px-6 py-3 rounded-xl">
            {t('marketplace_orders.btn_browse')}
          </button>
        </div>
      ) : orders.map(order => (
        <div key={order.OrderID} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex justify-between items-center bg-gray-50 px-5 py-3 border-b border-gray-200">
            <div>
              <span className="font-bold text-gray-700 mr-3">{order.OrderNumber}</span>
              <Badge status={order.OrderStatus} />
            </div>
            <div className="text-right">
              <span className="font-bold text-[#819360] text-lg">${parseFloat(order.TotalAmount).toFixed(2)}</span>
              <p className="text-xs text-gray-400">{new Date(order.CreatedAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {(order.items || []).map(item => (
              <div key={item.OrderItemID} className="flex items-center gap-4 px-5 py-3">
                <span className="flex items-center">{item.ProductType === 'meat'
                  ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M18.6 6.62a2.5 2.5 0 0 1-3.53 3.53L5 20a2 2 0 0 1-2.83-2.83l10.16-10.16a2.5 2.5 0 0 1 3.53-3.53"/><path d="m15.5 5.5-3 3"/></svg>
                  : item.ProductType === 'processed_food'
                  ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2h8l1 7H7L8 2z"/><path d="M7 9c0 7 2 11 5 11s5-4 5-11"/></svg>
                  : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8C8 10 5.9 16.17 3.82 22"/><path d="M9.5 9.5s1-3 4.5-5c0 0 1 3-1 7"/><path d="M3.82 22s1.5-3.5 8.18-4.5"/></svg>
                }</span>
                <div className="grow">
                  <p className="font-semibold text-sm text-gray-800">{item.ProductTitle}</p>
                  <p className="text-xs text-gray-400">
                    {item.SellerName || item.BusinessName} · {item.Quantity} × ${parseFloat(item.UnitPrice).toFixed(2)}
                  </p>
                </div>
                <Badge status={item.SellerStatus} />
                <span className="font-bold text-sm">${parseFloat(item.LineTotal).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 bg-gray-50 flex justify-between items-center border-t border-gray-200">
            <span className="text-xs text-gray-400">
              {t('marketplace_orders.delivery_' + order.DeliveryMethod, { defaultValue: order.DeliveryMethod })}
            </span>
            <button onClick={() => navigate(`/orders/${order.OrderID}`)}
              className="text-sm text-[#819360] font-semibold hover:underline">
              {t('marketplace_orders.btn_view_details')}
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  if (businessId) {
    return (
      <AccountLayout
        Business={Business}
        BusinessID={businessId}
        PeopleID={peopleId}
        pageTitle={t('marketplace_orders.page_title')}
        breadcrumbs={[
          { label: t('marketplace_orders.breadcrumb_dashboard'), to: '/dashboard' },
          { label: t('marketplace_orders.breadcrumb_marketplace') },
          { label: t('marketplace_orders.breadcrumb_orders') },
        ]}
      >
        {content}
      </AccountLayout>
    );
  }
  return content;
}
