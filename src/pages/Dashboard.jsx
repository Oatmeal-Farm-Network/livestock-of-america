import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useTranslation } from '../lib/i18n';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';
import { useAccount } from '../lib/AccountContext';
import { endpoints } from '../config/api';
const CREAM = '#f7f2e8';
const OLIVE = '#3d6b34';
const RUST = '#8b3a2b';
const INK = '#2c2c2c';
const MUTED = '#6b6b6b';

const IcoUsers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IcoEdit = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IcoDel = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);

function buildServiceLinks(businessId, features, t) {
  if (!features) return null;
  const links = [];
  const on = (key) => features[key] === true;

  if (on('blog')) links.push({ label: t('dashboard.svc_blog'), to: `/blog/manage?BusinessID=${businessId}` });
  if (on('precision_ag')) links.push({ label: t('dashboard.svc_precision_ag'), to: `/precision-ag/fields?BusinessID=${businessId}` });
  if (on('farm_2_table')) links.push({ label: t('dashboard.svc_farm_2_table'), to: `/seller/orders?BusinessID=${businessId}` });
  if (on('restaurant_sourcing')) links.push({ label: t('dashboard.svc_restaurant'), to: '/marketplaces/farm-to-table' });
  if (on('livestock')) {
    links.push({ label: t('dashboard.svc_livestock'), to: `/seller/animals?BusinessID=${businessId}` });
    links.push({ label: 'Herd Health', to: `/herd-health?BusinessID=${businessId}` });
  }
  if (on('products')) links.push({ label: t('dashboard.svc_products'), to: `/products?BusinessID=${businessId}` });
  if (on('services')) links.push({ label: t('dashboard.svc_services'), to: `/services?BusinessID=${businessId}` });
  if (on('events')) links.push({ label: t('dashboard.svc_events'), to: `/events/manage?BusinessID=${businessId}` });
  if (on('properties')) links.push({ label: t('dashboard.svc_properties'), to: `/properties?BusinessID=${businessId}` });
  if (on('associations')) links.push({ label: t('dashboard.svc_associations'), to: `/association/create?BusinessID=${businessId}` });
  if (on('my_website')) links.push({ label: t('dashboard.svc_my_website'), to: `/website/builder?BusinessID=${businessId}&view=manage-pages` });
  if (on('accounting')) links.push({ label: t('dashboard.svc_accounting'), to: `/accounting?BusinessID=${businessId}` });
  if (on('testimonials')) links.push({ label: t('dashboard.svc_testimonials'), to: `/testimonials/manage?BusinessID=${businessId}` });
  if (on('chef_dashboard')) links.push({ label: t('dashboard.svc_chef_dashboard'), to: `/chef?BusinessID=${businessId}` });
  if (on('pairsley')) links.push({ label: t('dashboard.svc_pairsley'), to: `/platform/pairsley?BusinessID=${businessId}` });
  if (on('rosemarie')) links.push({ label: t('dashboard.svc_rosemarie'), to: `/platform/rosemarie?BusinessID=${businessId}` });
  if (on('provenance')) links.push({ label: t('dashboard.svc_provenance'), to: `/provenance/${businessId}` });
  if (on('cold_chain')) links.push({ label: 'Cold Chain Tracking', to: `/cold-chain?BusinessID=${businessId}` });
  if (on('farmer_settlement')) links.push({ label: 'Farmer Settlement', to: `/farmer-settlement?BusinessID=${businessId}` });
  if (on('enterprise_supply_chain')) links.push({ label: 'Supply Chain Intelligence', to: `/supply-chain?BusinessID=${businessId}` });
  return links;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_LIVESTOCK_API_URL || '';
  const { setBusinesses: setContextBusinesses } = useAccount();
  const [user, setUser] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featuresByBusiness, setFeaturesByBusiness] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    const peopleId = localStorage.getItem('people_id');
    setUser({
      firstName: localStorage.getItem('first_name'),
      lastName: localStorage.getItem('last_name'),
      peopleId,
      accessLevel: parseInt(localStorage.getItem('access_level') || '0', 10),
    });

    if (peopleId) {
      fetch(endpoints.myBusinesses(peopleId))
        .then((r) => r.json())
        .then((data) => {
          const list = Array.isArray(data) ? data : [];
          setBusinesses(list);
          setContextBusinesses(list);
        })
        .catch(() => setBusinesses([]))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [navigate, API_URL, setContextBusinesses]);

  useEffect(() => {
    if (!businesses.length) return;
    businesses.forEach((b) => {
      fetch(`${API_URL}/api/company/features?business_id=${b.BusinessID}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((rows) => {
          const map = {};
          (Array.isArray(rows) ? rows : []).forEach((f) => {
            map[f.feature_key] = f.is_enabled;
          });
          setFeaturesByBusiness((prev) => ({ ...prev, [b.BusinessID]: map }));
        })
        .catch(() => {
          setFeaturesByBusiness((prev) => ({ ...prev, [b.BusinessID]: {} }));
        });
    });
  }, [businesses, API_URL]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`${API_URL}/api/businesses/delete/${confirmDelete.BusinessID}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Could not delete account.');
      }
      setBusinesses((prev) => prev.filter((b) => b.BusinessID !== confirmDelete.BusinessID));
      setContextBusinesses((prev) => prev.filter((b) => b.BusinessID !== confirmDelete.BusinessID));
      setConfirmDelete(null);
    } catch (e) {
      setDeleteError(e.message || 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  };

  if (!user) return null;
  const peopleId = user.peopleId;
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'there';
  const featuresStillLoading =
    businesses.length > 0 &&
    businesses.some((b) => featuresByBusiness[b.BusinessID] === undefined);

  const actionBtn =
    'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold no-underline transition-colors border';

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ background: CREAM }}>
      <PageMeta
        title="Dashboard | Livestock of America"
        description="Your Livestock Of America dashboard — manage your ranch accounts and livestock tools."
        noIndex
      />
      <Header />

      <main className="grow w-full max-w-[1100px] mx-auto px-4 md:px-6 py-6 md:py-8">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Dashboard' }]} />

        {/* Welcome header */}
        <section className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p
              className="text-[10px] font-bold tracking-[0.16em] uppercase mb-2"
              style={{ color: OLIVE }}
            >
              Your workspace
            </p>
            <h1
              className="text-3xl md:text-4xl font-bold leading-tight mb-2"
              style={{ fontFamily: "'Lora', 'Times New Roman', serif", color: INK }}
            >
              {t('dashboard.heading')}
            </h1>
            <p className="text-sm md:text-[0.95rem] leading-relaxed max-w-xl" style={{ color: MUTED }}>
              Welcome back, {displayName}. Manage your ranch accounts and livestock workspace from here.
            </p>
          </div>
          <Link
            to={`/accounts/new?PeopleID=${peopleId}`}
            className="shrink-0 inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold no-underline hover:opacity-90"
            style={{ background: OLIVE, color: '#ffffff' }}
          >
            {t('dashboard.add_account')}
          </Link>
        </section>

        {/* Summary strip */}
        {!loading && businesses.length > 0 && (
          <div
            className="mb-5 rounded-xl border border-black/5 px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm"
            style={{ background: 'rgba(255,255,255,0.65)' }}
          >
            <span style={{ color: INK }}>
              <strong>{businesses.length}</strong>{' '}
              {businesses.length === 1 ? 'account' : 'accounts'}
            </span>
            {featuresStillLoading && (
              <span style={{ color: MUTED }}>{t('dashboard.svc_loading')}</span>
            )}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-black/5 bg-white p-6 animate-pulse"
              >
                <div className="h-5 w-48 rounded bg-black/10 mb-3" />
                <div className="h-3 w-28 rounded bg-black/5 mb-6" />
                <div className="flex gap-2">
                  <div className="h-8 w-20 rounded-lg bg-black/5" />
                  <div className="h-8 w-20 rounded-lg bg-black/5" />
                  <div className="h-8 w-20 rounded-lg bg-black/5" />
                </div>
              </div>
            ))}
            <p className="text-sm text-center pt-2" style={{ color: MUTED }}>
              {t('dashboard.loading')}
            </p>
          </div>
        ) : businesses.length === 0 ? (
          <div className="rounded-2xl bg-white border border-black/5 shadow-sm px-6 py-14 text-center">
            <div
              className="mx-auto mb-4 w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: '#e8f0e3' }}
              aria-hidden
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={OLIVE} strokeWidth="1.8">
                <path d="M3 21h18" />
                <path d="M5 21V10l7-5 7 5v11" />
                <path d="M9 21v-6h6v6" />
              </svg>
            </div>
            <h2
              className="text-xl font-bold mb-2"
              style={{ fontFamily: "'Lora', 'Times New Roman', serif", color: INK }}
            >
              {t('dashboard.no_accounts')}
            </h2>
            <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: MUTED }}>
              Create your first ranch or business account to list animals and manage your Livestock Of America presence.
            </p>
            <Link
              to={`/accounts/new?PeopleID=${peopleId}`}
              className="inline-flex items-center rounded-xl px-6 py-3 text-sm font-bold no-underline hover:opacity-90"
              style={{ background: OLIVE, color: '#ffffff' }}
            >
              {t('dashboard.add_first_account')}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {businesses.map((b) => {
              const features = featuresByBusiness[b.BusinessID];
              const serviceLinks = true
                ? []
                : buildServiceLinks(b.BusinessID, features, t);

              return (
                <article
                  key={b.BusinessID}
                  className="rounded-2xl bg-white border border-black/5 shadow-sm overflow-hidden"
                >
                  <div className="p-5 md:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <Link
                            to={`/account?PeopleID=${peopleId}&BusinessID=${b.BusinessID}`}
                            className="text-lg md:text-xl font-bold no-underline hover:underline"
                            style={{
                              fontFamily: "'Lora', 'Times New Roman', serif",
                              color: OLIVE,
                            }}
                          >
                            {b.BusinessName}
                          </Link>
                          {b.BusinessType && (
                            <span
                              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                              style={{ background: '#f0ece4', color: MUTED }}
                            >
                              {b.BusinessType}
                            </span>
                          )}
                        </div>

                        <div className="text-sm" style={{ color: MUTED }}>
                          {b.BusinessTypeID === 1 ? (
                            <span>—</span>
                          ) : (
                            <span className="flex items-center gap-2 flex-wrap">
                              <span style={{ color: INK }}>
                                {b.FavoriteAssociationName || t('dashboard.assoc_none')}
                              </span>
                              <Link
                                to={`/account/associations?BusinessID=${b.BusinessID}`}
                                className="text-xs font-semibold no-underline hover:underline"
                                style={{ color: OLIVE }}
                              >
                                {b.FavoriteAssociationName
                                  ? t('dashboard.assoc_change')
                                  : t('dashboard.assoc_set')}
                              </Link>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <Link
                          to={`/account/users?PeopleID=${peopleId}&BusinessID=${b.BusinessID}`}
                          title={t('dashboard.ico_users')}
                          className={`${actionBtn} hover:bg-[#e8f0e3]`}
                          style={{ borderColor: 'rgba(61,107,52,0.25)', color: OLIVE }}
                        >
                          <IcoUsers />
                          Team
                        </Link>
                        <Link
                          to={`/account/profile?BusinessID=${b.BusinessID}`}
                          title={t('dashboard.ico_edit')}
                          className={`${actionBtn} hover:bg-[#e8f0e3]`}
                          style={{ borderColor: 'rgba(61,107,52,0.25)', color: OLIVE }}
                        >
                          <IcoEdit />
                          Edit
                        </Link>
                        <button
                          type="button"
                          title={t('dashboard.ico_delete')}
                          onClick={() => {
                            setDeleteError(null);
                            setConfirmDelete({
                              BusinessID: b.BusinessID,
                              BusinessName: b.BusinessName,
                            });
                          }}
                          className={`${actionBtn} hover:bg-[#fdf2f0] cursor-pointer`}
                          style={{ borderColor: 'rgba(139,58,43,0.3)', color: RUST, background: 'transparent' }}
                        >
                          <IcoDel />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Feature shortcuts — hidden in Phase 1 logged-in nav mode */}
                  {!true && (
                  <div
                    className="px-5 md:px-6 py-3.5 border-t border-black/5"
                    style={{ background: '#faf8f4' }}
                  >
                    {serviceLinks === null ? (
                      <p className="text-xs m-0" style={{ color: MUTED }}>
                        {t('dashboard.svc_loading')}
                      </p>
                    ) : serviceLinks.length === 0 ? (
                      <p className="text-xs m-0" style={{ color: MUTED }}>
                        {t('dashboard.svc_none')}
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {serviceLinks.map((link) => (
                          <Link
                            key={link.label}
                            to={link.to}
                            className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold no-underline hover:opacity-90"
                            style={{ background: '#e8f0e3', color: OLIVE }}
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>

      <Footer />

      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(44,44,44,0.45)' }}
          onClick={() => !deleting && setConfirmDelete(null)}
          role="presentation"
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 md:p-7 border border-black/5"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dash-delete-title"
          >
            <div
              className="mb-4 w-11 h-11 rounded-full flex items-center justify-center"
              style={{ background: '#fdf2f0' }}
              aria-hidden
            >
              <span style={{ color: RUST }}>
                <IcoDel />
              </span>
            </div>
            <h3
              id="dash-delete-title"
              className="text-xl font-bold mb-2"
              style={{ fontFamily: "'Lora', 'Times New Roman', serif", color: INK }}
            >
              {t('dashboard.delete_title')}
            </h3>
            <p className="text-sm leading-relaxed mb-5" style={{ color: MUTED }}>
              {t('dashboard.delete_body', {
                name: confirmDelete.BusinessName || t('dashboard.delete_this_account'),
              })}
            </p>
            {deleteError && (
              <div
                className="rounded-xl border px-3 py-2 text-sm mb-4"
                style={{ borderColor: '#f5c2c0', background: '#fef2f2', color: '#b91c1c' }}
                role="alert"
              >
                {deleteError}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirmDelete(null)}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50 cursor-pointer"
                style={{ border: '1.5px solid rgba(0,0,0,0.12)', color: INK, background: '#fff' }}
              >
                {t('dashboard.btn_cancel')}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 cursor-pointer hover:opacity-90"
                style={{ background: RUST, border: 'none' }}
              >
                {deleting ? t('dashboard.btn_deleting') : t('dashboard.btn_delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
