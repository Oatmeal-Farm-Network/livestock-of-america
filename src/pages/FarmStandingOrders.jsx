// Ported from Oatmeal Farm Network (src/FarmStandingOrders.jsx). Page logic is unchanged;
// router package, i18n hook, component paths, API base env var and the
// people-id accessor differ, as in the other ported pages.
// Farm-side view of incoming recurring orders from restaurants.
// Route: /farm/standing-orders
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from '../lib/i18n';
import AccountLayout from '../components/AccountLayout';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';
import { useAccount } from '../lib/AccountContext';
import { getPeopleId } from '../lib/auth';

const API = import.meta.env.VITE_LIVESTOCK_API_URL || '';

const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function FarmStandingOrders() {
  const { t } = useTranslation();
  const { Business, BusinessID, businesses } = useAccount() || {};
  const PeopleID = getPeopleId() || getPeopleId();

  const FREQUENCY_LABELS = {
    weekly: t('farm_standing_orders.freq_weekly'),
    biweekly: t('farm_standing_orders.freq_biweekly'),
    monthly: t('farm_standing_orders.freq_monthly'),
  };

  // Business types that can receive standing orders from restaurants. This was
  // locked to 8 (Farm / Ranch), which hid Food Aggregators, Food Hubs and
  // Artisan Food Producers — all of which legitimately supply recurring orders.
  const SUPPLIER_TYPES = [8, 10, 11, 36];

  const farmBusinesses = useMemo(() =>
    (Array.isArray(businesses) ? businesses : [])
      .filter(b => SUPPLIER_TYPES.includes(Number(b.BusinessTypeID))),
    [businesses]
  );

  const [selectedFarmId, setSelectedFarmId] = useState(null);
  useEffect(() => {
    if (selectedFarmId) return;
    // Prefer the business the user is currently working in, then fall back.
    const active = farmBusinesses.find(b => Number(b.BusinessID) === Number(BusinessID));
    if (active) setSelectedFarmId(active.BusinessID);
    else if (farmBusinesses[0]) setSelectedFarmId(farmBusinesses[0].BusinessID);
  }, [farmBusinesses, selectedFarmId, BusinessID]);

  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState('');

  const load = async () => {
    if (!selectedFarmId) { setLoading(false); return; }
    setLoading(true); setErr('');
    try {
      const r = await fetch(`${API}/api/marketplace/standing-orders?farm_business_id=${selectedFarmId}`);
      if (!r.ok) throw new Error(`${r.status}`);
      const data = await r.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setErr(t('farm_standing_orders.err_load'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [selectedFarmId]);

  const markFulfilled = async (order) => {
    const qtyInput = window.prompt(
      t('farm_standing_orders.prompt_fulfill', {
        product: order.ProductTitle || t('farm_standing_orders.standing_order_default'),
        buyer: order.BuyerName || t('farm_standing_orders.restaurant_default'),
        unit: order.UnitLabel || t('farm_standing_orders.unit_default'),
      }),
      String(order.Quantity ?? '')
    );
    if (qtyInput === null) return;
    const qty = parseFloat(qtyInput);
    if (!(qty > 0)) { alert(t('farm_standing_orders.alert_positive_qty')); return; }
    const notes = window.prompt(t('farm_standing_orders.prompt_notes'), '') || null;
    try {
      const r = await fetch(`${API}/api/marketplace/standing-orders/${order.StandingOrderID}/fulfill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ DeliveredQuantity: qty, Notes: notes }),
      });
      if (!r.ok) throw new Error(`${r.status}`);
      await load();
    } catch {
      alert(t('farm_standing_orders.alert_err_delivery'));
    }
  };

  const skipNext = async (order) => {
    const next = order.NextDeliveryDate || t('farm_standing_orders.no_date');
    if (!window.confirm(t('farm_standing_orders.confirm_skip', {
      date: next,
      buyer: order.BuyerName || t('farm_standing_orders.restaurant_default'),
    }))) return;
    const reason = window.prompt(t('farm_standing_orders.prompt_skip_reason'), '') || null;
    try {
      const r = await fetch(`${API}/api/marketplace/standing-orders/${order.StandingOrderID}/skip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Reason: reason, InitiatedBy: 'farm' }),
      });
      if (!r.ok) throw new Error(`${r.status}`);
      await load();
    } catch {
      alert(t('farm_standing_orders.alert_err_skip'));
    }
  };

  const reschedule = async (order) => {
    const current = order.NextDeliveryDate || '';
    const newDate = window.prompt(
      t('farm_standing_orders.prompt_reschedule', { buyer: order.BuyerName || t('farm_standing_orders.restaurant_default') }),
      current
    );
    if (newDate === null) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate.trim())) { alert(t('farm_standing_orders.alert_date_format')); return; }
    const reason = window.prompt(t('farm_standing_orders.prompt_reschedule_reason'), '') || null;
    try {
      const r = await fetch(`${API}/api/marketplace/standing-orders/${order.StandingOrderID}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ NewDate: newDate.trim(), Reason: reason, InitiatedBy: 'farm' }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.detail || `${r.status}`);
      }
      await load();
    } catch (e) {
      alert(t('farm_standing_orders.alert_err_reschedule', { msg: e.message }));
    }
  };

  return (
    <AccountLayout
      Business={Business}
      BusinessID={BusinessID}
      PeopleID={PeopleID}
      pageTitle={t('farm_standing_orders.page_title')}
      breadcrumbs={[
        { label: t('farm_standing_orders.crumb_dashboard'), to: '/dashboard' },
        { label: t('farm_standing_orders.crumb_f2t') },
        { label: t('farm_standing_orders.crumb_standing_orders') },
      ]}
    >
      <PageMeta
        title={t('farm_standing_orders.meta_title')}
        description={t('farm_standing_orders.meta_desc')}
      />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Lora','Times New Roman',serif" }}>
            {t('farm_standing_orders.heading')}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {t('farm_standing_orders.subheading')}
          </p>
        </div>
        {farmBusinesses.length > 1 && (
          <select
            value={selectedFarmId || ''}
            onChange={e => setSelectedFarmId(parseInt(e.target.value, 10))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {farmBusinesses.map(b => (
              <option key={b.BusinessID} value={b.BusinessID}>{b.BusinessName}</option>
            ))}
          </select>
        )}
      </div>

      {farmBusinesses.length === 0 ? (
        <EmptyState
          title={t('farm_standing_orders.empty_no_farm_title')}
          body={t('farm_standing_orders.empty_no_farm_body')}
          cta={<Link to="/account" className="text-[#3D6B34] underline font-semibold">{t('farm_standing_orders.go_to_account')}</Link>}
        />
      ) : loading ? (
        <div className="text-center py-16 text-gray-400">{t('farm_standing_orders.loading')}</div>
      ) : err ? (
        <div className="text-center py-16 text-red-500">{err}</div>
      ) : orders.length === 0 ? (
        <EmptyState
          title={t('farm_standing_orders.empty_no_orders_title')}
          body={t('farm_standing_orders.empty_no_orders_body')}
          cta={null}
        />
      ) : (
        <div className="space-y-3">
          {orders.map(o => (
            <OrderRow
              key={o.StandingOrderID}
              order={o}
              frequencyLabels={FREQUENCY_LABELS}
              onFulfill={() => markFulfilled(o)}
              onSkip={() => skipNext(o)}
              onReschedule={() => reschedule(o)}
            />
          ))}
        </div>
      )}
    </AccountLayout>
  );
}

function OrderRow({ order: o, frequencyLabels, onFulfill, onSkip, onReschedule }) {
  const { t } = useTranslation();
  const status = o.Status || 'active';
  const isOverdue = status === 'overdue';
  const isActive  = status === 'active' || isOverdue;
  const next = o.NextDeliveryDate
    ? new Date(o.NextDeliveryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div
      className="bg-white rounded-xl border p-4 flex flex-wrap items-start gap-4 shadow-sm"
      style={{ borderColor: isOverdue ? '#dc2626' : '#e5e7eb', opacity: isActive ? 1 : 0.65 }}
    >
      <div className="grow min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h3 className="font-bold text-gray-900 truncate">{o.ProductTitle || `${o.ListingType} #${o.ListingSourceID}`}</h3>
          {isOverdue  && <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">{t('farm_standing_orders.badge_overdue')}</span>}
          {status === 'paused'    && <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">{t('farm_standing_orders.badge_paused')}</span>}
          {status === 'cancelled' && <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">{t('farm_standing_orders.badge_cancelled')}</span>}
        </div>
        <div className="text-sm text-[#3D6B34] font-medium">{o.BuyerName || `Buyer #${o.BuyerBusinessID}`}</div>
        <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
          <span>{o.Quantity} {o.UnitLabel || t('farm_standing_orders.unit_default')}</span>
          <span>{frequencyLabels[o.Frequency] || o.Frequency}</span>
          {o.DayOfWeek != null && <span>{DAY_NAMES[o.DayOfWeek]}</span>}
          {next && <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>{t('farm_standing_orders.next_label', { date: next })}</span>}
        </div>
        {o.Notes && <p className="text-xs italic text-gray-600 mt-2">"{o.Notes}"</p>}
      </div>

      {isActive && (
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button onClick={onFulfill}
            className="text-xs font-semibold text-white bg-[#3D6B34] hover:bg-[#2d5225] px-3 py-1.5 rounded transition">
            {t('farm_standing_orders.btn_fulfilled')}
          </button>
          <button onClick={onSkip}
            className="text-xs font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded transition">
            {t('farm_standing_orders.btn_skip')}
          </button>
          <button onClick={onReschedule}
            className="text-xs font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded transition">
            {t('farm_standing_orders.btn_reschedule')}
          </button>
        </div>
      )}
    </div>
  );
}

function EmptyState({ title, body, cta }) {
  return (
    <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
      <p className="text-lg font-bold text-gray-700">{title}</p>
      <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">{body}</p>
      {cta && <div className="mt-4">{cta}</div>}
    </div>
  );
}
