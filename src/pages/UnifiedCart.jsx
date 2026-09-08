// Ported from Oatmeal Farm Network (src/UnifiedCart.jsx). Page logic is unchanged
// except where LOA's backend serves a different shape; those are marked
// inline. Router package, i18n hook, component paths, API base env var and
// the people-id accessor differ as in the other ported pages.
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useTranslation } from '../lib/i18n';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';
import { getPeopleId } from '../lib/auth';

const API = import.meta.env.VITE_LIVESTOCK_API_URL || '';

const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;
const niceDate = (d) => d ? new Date(d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : '';

export default function UnifiedCart() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const peopleId = getPeopleId();
  const businessId = new URLSearchParams(window.location.search).get('BusinessID');

  const [marketplaceCart, setMarketplaceCart] = useState(null);
  const [eventCarts, setEventCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!peopleId) { navigate('/login'); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Event carts are not served on LOA (no /api/people router, and
        // events are hidden), so only the marketplace cart is fetched.
        const mRes = await fetch(`${API}/api/marketplace/cart/${peopleId}`);
        const m = mRes.ok ? await mRes.json() : { sellers: [], itemCount: 0, subtotal: 0, platformFee: 0, total: 0 };
        const e = [];
        if (!cancelled) {
          setMarketplaceCart(m);
          setEventCarts(e);
        }
      } catch {
        if (!cancelled) setError(t('unified_cart.err_load_failed'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [peopleId]);

  const mpHasItems = (marketplaceCart?.itemCount || 0) > 0;
  const hasEventCarts = eventCarts.length > 0;
  const empty = !loading && !mpHasItems && !hasEventCarts;
  const totalItems = (marketplaceCart?.itemCount || 0) + eventCarts.length;

  const goToMarketplaceCart = () => {
    const qs = businessId ? `?BusinessID=${businessId}` : '';
    navigate(`/marketplaces/cart${qs}`);
  };

  const resumeEventCart = (c) => {
    navigate(`/events/${c.EventID}/register/wizard?cartId=${c.CartID}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <PageMeta title="Your Cart | Livestock Of America" noIndex />
      <Header />

      <div className="max-w-5xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ label: t('unified_cart.breadcrumb_home'), to: '/' }, { label: t('unified_cart.breadcrumb_cart') }]} />

        <div className="flex items-baseline justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{t('unified_cart.heading')}</h1>
          <p className="text-sm text-gray-500">
            {t('unified_cart.items_in_progress', { count: totalItems })}
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-300 text-red-700 rounded px-4 py-3 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-400">{t('unified_cart.loading')}</div>
        ) : empty ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <p className="text-gray-500 text-lg mb-4">{t('unified_cart.empty')}</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link to="/marketplaces/farm-to-table" className="bg-[#819360] text-white! font-semibold px-5 py-2.5 rounded-lg hover:bg-[#3D6B35]">
                {t('unified_cart.btn_browse_marketplace')}
              </Link>
              <Link to="/events" className="bg-[#819360] text-white! font-semibold px-5 py-2.5 rounded-lg hover:bg-[#3D6B35]">
                {t('unified_cart.btn_find_events')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">

            {/* Marketplace cart card */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-800">{t('unified_cart.marketplace_heading')}</h2>
                  <p className="text-xs text-gray-500">{t('unified_cart.marketplace_subtitle')}</p>
                </div>
                <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-1 rounded">
                  {t('unified_cart.item_count', { count: marketplaceCart?.itemCount || 0 })}
                </span>
              </div>

              {mpHasItems ? (
                <div className="grow">
                  {marketplaceCart.sellers.map(s => (
                    <div key={s.SellerBusinessID} className="px-5 py-3 border-b border-gray-50 last:border-0">
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">{s.SellerName}</p>
                      <ul className="mt-1 space-y-1">
                        {s.items.map(it => (
                          <li key={it.CartItemID} className="flex justify-between text-sm">
                            <span className="text-gray-700">
                              {it.Quantity} × {it.Title}
                            </span>
                            <span className="text-gray-700 font-medium">{fmt(it.lineTotal)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 text-sm space-y-1">
                    <div className="flex justify-between text-gray-600">
                      <span>{t('unified_cart.subtotal')}</span><span>{fmt(marketplaceCart.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>{t('unified_cart.platform_fee')}</span><span>{fmt(marketplaceCart.platformFee)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base text-gray-800 pt-1 border-t border-gray-200">
                      <span>{t('unified_cart.total')}</span><span className="text-[#819360]">{fmt(marketplaceCart.total)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="px-5 py-10 text-center text-sm text-gray-400 grow flex items-center justify-center">
                  {t('unified_cart.marketplace_empty')}
                </div>
              )}

              <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
                <button
                  onClick={goToMarketplaceCart}
                  disabled={!mpHasItems}
                  className="bg-[#819360] hover:bg-[#3D6B35] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-lg"
                >
                  {mpHasItems ? t('unified_cart.btn_checkout') : t('unified_cart.btn_empty')}
                </button>
              </div>
            </div>

            {/* Event carts card */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-800">{t('unified_cart.events_heading')}</h2>
                  <p className="text-xs text-gray-500">{t('unified_cart.events_subtitle')}</p>
                </div>
                <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-1 rounded">
                  {t('unified_cart.cart_count', { count: eventCarts.length })}
                </span>
              </div>

              {hasEventCarts ? (
                <ul className="grow divide-y divide-gray-100">
                  {eventCarts.map(c => (
                    <li key={c.CartID} className="px-5 py-3 flex items-center gap-3">
                      <div className="grow min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">{c.EventName || t('unified_cart.event_fallback', { id: c.EventID })}</p>
                        <p className="text-xs text-gray-500">
                          {niceDate(c.EventStartDate)}
                          {c.ItemCount ? <> · {t('unified_cart.item_count', { count: c.ItemCount })}</> : null}
                          {c.Status === 'pending_payment' && <span className="ml-2 inline-block bg-amber-100 text-amber-800 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded">{t('unified_cart.awaiting_payment')}</span>}
                        </p>
                      </div>
                      <button
                        onClick={() => resumeEventCart(c)}
                        className="bg-[#7C5CBF] hover:bg-[#684aa6] text-white text-sm font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap"
                      >
                        {t('unified_cart.btn_resume')}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-5 py-10 text-center text-sm text-gray-400 grow flex items-center justify-center">
                  {t('unified_cart.events_empty')}
                </div>
              )}

              <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
                <Link
                  to="/events"
                  className="bg-[#819360] hover:bg-[#3D6B35] text-white text-sm font-semibold px-4 py-2 rounded-lg"
                >
                  {t('unified_cart.btn_find_events')}
                </Link>
              </div>
            </div>

          </div>
        )}

        <p className="mt-6 text-xs text-gray-400 text-center">
          {t('unified_cart.footer_note')}
        </p>
      </div>

      <Footer />
    </div>
  );
}
