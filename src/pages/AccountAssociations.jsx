// Ported from Oatmeal Farm Network (src/AccountAssociations.jsx). Logic is unchanged;
// only the router package, i18n hook, component paths and API base differ.
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router';
import { useTranslation } from '../lib/i18n';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';

const API_URL = import.meta.env.VITE_LIVESTOCK_API_URL || '';

export default function AccountAssociations() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const BusinessID = parseInt(params.get('BusinessID') || '0', 10);
  const peopleId = parseInt(localStorage.getItem('people_id') || '0', 10);

  const [allAssociations, setAllAssociations] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [favorite, setFavorite] = useState(null);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [savedMessage, setSavedMessage] = useState(null);

  useEffect(() => {
    if (!peopleId) { navigate('/login'); return; }
    if (!BusinessID) {
      setError(t('acct_assoc.err_missing_id'));
      setLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [listRes, memRes] = await Promise.all([
          fetch(`${API_URL}/api/associations/list`),
          fetch(`${API_URL}/api/associations/my-memberships?PeopleID=${peopleId}&BusinessID=${BusinessID}`),
        ]);
        const list = listRes.ok ? await listRes.json() : [];
        const mem  = memRes.ok  ? await memRes.json()  : { memberships: [], favorite: null };
        if (cancelled) return;
        setAllAssociations(Array.isArray(list) ? list : []);
        setMemberships(mem.memberships || []);
        setFavorite(mem.favorite || null);
        setSelected(mem.favorite ? String(mem.favorite.AssociationID) : '');
      } catch {
        if (!cancelled) setError(t('acct_assoc.err_load'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [peopleId, BusinessID, navigate]);

  const filteredOptions = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return allAssociations;
    return allAssociations.filter(a => a.AssociationName.toLowerCase().includes(q));
  }, [allAssociations, filter]);

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    setSavedMessage(null);
    try {
      const res = await fetch(`${API_URL}/api/associations/set-favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ PeopleID: peopleId, BusinessID, AssociationID: parseInt(selected, 10) }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || t('acct_assoc.err_save'));
      }
      const data = await res.json();
      setFavorite({ AssociationID: data.FavoriteAssociationID, AssociationName: data.FavoriteAssociationName });
      setSavedMessage(t('acct_assoc.saved_fav'));
    } catch (e) {
      setError(e.message || t('acct_assoc.err_save_generic'));
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    setError(null);
    setSavedMessage(null);
    try {
      const res = await fetch(`${API_URL}/api/associations/clear-favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ PeopleID: peopleId, BusinessID }),
      });
      if (!res.ok) throw new Error(t('acct_assoc.err_clear'));
      setFavorite(null);
      setSelected('');
      setSavedMessage(t('acct_assoc.cleared'));
    } catch (e) {
      setError(e.message || t('acct_assoc.err_clear_generic'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen font-sans">
      <PageMeta title={t('acct_assoc.meta_title')} noIndex />
      <Header />

      <div className="container mx-auto px-4 py-8" style={{ maxWidth: '900px' }}>
        <Breadcrumbs items={[
          { label: t('acct_assoc.breadcrumb_home'), to: '/' },
          { label: t('acct_assoc.breadcrumb_dashboard'), to: '/dashboard' },
          { label: t('acct_assoc.breadcrumb_associations') },
        ]} />

        <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('acct_assoc.heading')}</h1>
        <p className="text-gray-600 mb-6 text-sm">{t('acct_assoc.subheading')}</p>

        {loading ? (
          <p className="text-gray-500">{t('acct_assoc.loading')}</p>
        ) : (
          <>
            <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-6">
              <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">{t('acct_assoc.current_fav_label')}</div>
              {favorite ? (
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="text-lg font-semibold text-gray-800">{favorite.AssociationName}</div>
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={saving}
                    className="text-sm text-red-600 hover:underline disabled:opacity-50"
                  >
                    {t('acct_assoc.btn_clear')}
                  </button>
                </div>
              ) : (
                <div className="text-gray-500">{t('acct_assoc.none_set')}</div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {t('acct_assoc.filter_label')}
              </label>
              <input
                type="text"
                value={filter}
                onChange={e => setFilter(e.target.value)}
                placeholder={t('acct_assoc.filter_placeholder')}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {t('acct_assoc.select_label', { filtered: filteredOptions.length, total: allAssociations.length })}
              </label>
              <select
                value={selected}
                onChange={e => setSelected(e.target.value)}
                size={12}
                className="w-full border border-gray-300 rounded px-2 py-2 text-sm"
              >
                <option value="">{t('acct_assoc.select_placeholder')}</option>
                {filteredOptions.map(a => (
                  <option key={a.AssociationID} value={a.AssociationID}>
                    {a.AssociationName}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-300 text-red-700 rounded px-3 py-2 text-sm mb-4">
                {error}
              </div>
            )}
            {savedMessage && (
              <div className="bg-green-50 border border-green-300 text-green-700 rounded px-3 py-2 text-sm mb-4">
                {savedMessage}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Link to="/dashboard" className="border border-gray-300 rounded px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                {t('acct_assoc.btn_back')}
              </Link>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !selected}
                className="bg-[#3D6B34] hover:bg-[#2f5427] text-white rounded px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                {saving ? t('acct_assoc.btn_saving') : t('acct_assoc.btn_set_fav')}
              </button>
            </div>

            {memberships.length > 0 && (
              <div className="mt-8">
                <h2 className="text-sm font-semibold text-gray-700 mb-2">{t('acct_assoc.memberships_heading')}</h2>
                <ul className="text-sm text-gray-600 space-y-1">
                  {memberships.map(m => (
                    <li key={m.associationmemberID}>
                      {m.AssociationName || t('acct_assoc.assoc_number', { id: m.AssociationID })}
                      {m.Favorite === 1 && (
                        <span className="ml-2 text-[#3D6B34] font-semibold">{t('acct_assoc.fav_badge')}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
