// Ported from Oatmeal Farm Network (src/ProductsInventory.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router';
import { useTranslation } from '../../lib/i18n';
import AccountLayout from '../../components/AccountLayout';
import { useAccount } from '../../lib/AccountContext';
import { getPeopleId } from '../../lib/auth';

const API_URL = import.meta.env.VITE_LIVESTOCK_API_URL || '';

export default function ProductsInventory() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const BusinessID = searchParams.get('BusinessID');
  const PeopleID = getPeopleId();
  const { Business, LoadBusiness } = useAccount();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingRow, setSavingRow] = useState(null);
  const [deletingRow, setDeletingRow] = useState(null);
  const [editRows, setEditRows] = useState({});
  const [inlineSaving, setInlineSaving] = useState({});
  const [qtyDrafts, setQtyDrafts] = useState({});
  const [search, setSearch] = useState('');
  const [bulkQty, setBulkQty] = useState('');
  const [bulkBusy, setBulkBusy] = useState(null);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p =>
      (p.Title || '').toLowerCase().includes(q) ||
      (p.CategoryName || '').toLowerCase().includes(q)
    );
  }, [products, search]);

  const allPublished = filteredProducts.length > 0 && filteredProducts.every(p => !!p.Publishproduct);
  const allForSale = filteredProducts.length > 0 && filteredProducts.every(p => !!p.ProdForSale);

  useEffect(() => {
    if (BusinessID) LoadBusiness(BusinessID);
    loadProducts();
  }, [BusinessID]);

  async function loadProducts() {
    setLoading(true);
    const data = await fetch(`${API_URL}/api/sfproducts/seller?business_id=${BusinessID}`)
      .then(r => r.json()).catch(() => []);
    setProducts(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  function startEdit(p) {
    setEditRows(prev => ({
      ...prev,
      [p.ProdID]: {
        prodName: p.Title ?? '',
        prodPrice: p.UnitPrice ?? '',
        SalePrice: p.SalePrice ?? '',
        ProdQuantityAvailable: p.QuantityAvailable ?? '',
        Publishproduct: p.Publishproduct ?? 1,
        ProdForSale: p.ProdForSale ?? 1,
      },
    }));
  }

  function updateEditRow(prodId, field, value) {
    setEditRows(prev => ({
      ...prev,
      [prodId]: { ...prev[prodId], [field]: value },
    }));
  }

  async function handleUpdate(prodId) {
    setSavingRow(prodId);
    const row = editRows[prodId];
    const body = {
      prodName: row.prodName,
      prodPrice: parseFloat(row.prodPrice) || 0,
      SalePrice: row.SalePrice === '' ? null : parseFloat(row.SalePrice),
      ProdQuantityAvailable: parseInt(row.ProdQuantityAvailable, 10) || 0,
      Publishproduct: row.Publishproduct ? 1 : 0,
      ProdForSale: row.ProdForSale ? 1 : 0,
    };
    const res = await fetch(`${API_URL}/api/sfproducts/${prodId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setEditRows(prev => { const n = { ...prev }; delete n[prodId]; return n; });
      await loadProducts();
    }
    setSavingRow(null);
  }

  async function saveInline(prodId, field, value) {
    setInlineSaving(prev => ({ ...prev, [prodId]: field }));
    setProducts(prev => prev.map(p => {
      if (p.ProdID !== prodId) return p;
      if (field === 'ProdQuantityAvailable') return { ...p, QuantityAvailable: value };
      return { ...p, [field]: value };
    }));
    const res = await fetch(`${API_URL}/api/sfproducts/${prodId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });
    if (!res.ok) await loadProducts();
    setInlineSaving(prev => { const n = { ...prev }; delete n[prodId]; return n; });
  }

  async function bulkApply(field, value) {
    if (filteredProducts.length === 0) return;
    setBulkBusy(field);
    const ids = filteredProducts.map(p => p.ProdID);
    setProducts(prev => prev.map(p => {
      if (!ids.includes(p.ProdID)) return p;
      if (field === 'ProdQuantityAvailable') return { ...p, QuantityAvailable: value };
      return { ...p, [field]: value };
    }));
    const results = await Promise.all(
      ids.map(id =>
        fetch(`${API_URL}/api/sfproducts/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [field]: value }),
        }).then(r => r.ok).catch(() => false)
      )
    );
    if (results.some(ok => !ok)) await loadProducts();
    setBulkBusy(null);
  }

  async function handleDelete(prodId) {
    if (!confirm(t('products_inv.confirm_delete'))) return;
    setDeletingRow(prodId);
    await fetch(`${API_URL}/api/sfproducts/${prodId}`, { method: 'DELETE' });
    await loadProducts();
    setDeletingRow(null);
  }

  return (
    <AccountLayout
      Business={Business}
      BusinessID={BusinessID}
      PeopleID={PeopleID}
      pageTitle={t('products_inv.page_title')}
      breadcrumbs={[
        { label: t('products_inv.breadcrumb_dashboard'), to: '/dashboard' },
        { label: t('products_inv.breadcrumb_products') },
        { label: t('products_inv.breadcrumb_my_products') },
      ]}
    >
      <div className="max-w-full mx-auto space-y-6">

        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow border border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">{t('products_inv.heading')}</h1>
            <p className="text-sm text-gray-500">{t('products_inv.subheading')}</p>
          </div>
          <Link
            to={`/products/add?BusinessID=${BusinessID}`}
            className="regsubmit2"
            style={{ minWidth: '160px', textAlign: 'center' }}
          >
            {t('products_inv.btn_add')}
          </Link>
        </div>

        {/* LIST */}
        <div className="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-gray-800">
              {t('products_inv.inventory_heading')}
              <span className="ml-2 text-sm font-normal text-gray-500">
                {search.trim()
                  ? t('products_inv.count_filtered', { filtered: filteredProducts.length, total: products.length })
                  : products.length}
              </span>
            </h2>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('products_inv.placeholder_search')}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#3D6B34]"
              style={{ width: 280, maxWidth: '100%' }}
            />
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">{t('products_inv.loading')}</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              {t('products_inv.empty')}{' '}
              <Link to={`/products/add?BusinessID=${BusinessID}`} className="text-[#3D6B34] font-semibold hover:underline">
                {t('products_inv.btn_add_first')}
              </Link>.
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              {t('products_inv.no_match', { query: search })}{' '}
              <button onClick={() => setSearch('')} className="text-[#3D6B34] hover:underline">
                {t('products_inv.clear_search')}
              </button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F3F4F6' }}>
                  {[
                    t('products_inv.th_image'),
                    t('products_inv.th_name'),
                    t('products_inv.th_category'),
                    t('products_inv.th_price'),
                    t('products_inv.th_sale'),
                  ].map(h => (
                    <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #E5E7EB' }}>{h}</th>
                  ))}
                  {/* Qty header with bulk-set */}
                  <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #E5E7EB' }}>
                    <div>{t('products_inv.th_qty')}</div>
                    <div className="flex items-center gap-1 mt-1" title={t('products_inv.bulk_qty_title')}>
                      <input
                        type="number"
                        min="0"
                        value={bulkQty}
                        onChange={e => setBulkQty(e.target.value)}
                        placeholder={t('products_inv.bulk_qty_placeholder')}
                        disabled={bulkBusy === 'ProdQuantityAvailable'}
                        className="border border-gray-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-[#3D6B34]"
                        style={{ width: 60 }}
                      />
                      <button
                        onClick={() => {
                          const v = parseInt(bulkQty, 10);
                          if (!Number.isFinite(v) || v < 0) return;
                          if (!confirm(t('products_inv.confirm_bulk_qty', { qty: v, count: filteredProducts.length }))) return;
                          bulkApply('ProdQuantityAvailable', v);
                          setBulkQty('');
                        }}
                        disabled={bulkBusy === 'ProdQuantityAvailable' || bulkQty === ''}
                        className="text-xs bg-[#3D6B34] text-white px-2 py-0.5 rounded hover:bg-[#2e5227] disabled:opacity-50"
                      >
                        {bulkBusy === 'ProdQuantityAvailable' ? '...' : t('products_inv.btn_apply')}
                      </button>
                    </div>
                  </th>
                  {/* Published header */}
                  <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center', fontSize: '0.72rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #E5E7EB' }}>
                    <div>{t('products_inv.th_published')}</div>
                    <label className="flex items-center justify-center gap-1 mt-1 font-normal normal-case text-[10px] tracking-normal text-gray-500" title={t('products_inv.bulk_toggle_title')}>
                      <input
                        type="checkbox"
                        checked={allPublished}
                        disabled={bulkBusy === 'Publishproduct' || filteredProducts.length === 0}
                        onChange={e => bulkApply('Publishproduct', e.target.checked ? 1 : 0)}
                      />
                      <span>{t('products_inv.all')}</span>
                    </label>
                  </th>
                  {/* For Sale header */}
                  <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center', fontSize: '0.72rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #E5E7EB' }}>
                    <div>{t('products_inv.th_for_sale')}</div>
                    <label className="flex items-center justify-center gap-1 mt-1 font-normal normal-case text-[10px] tracking-normal text-gray-500" title={t('products_inv.bulk_toggle_title')}>
                      <input
                        type="checkbox"
                        checked={allForSale}
                        disabled={bulkBusy === 'ProdForSale' || filteredProducts.length === 0}
                        onChange={e => bulkApply('ProdForSale', e.target.checked ? 1 : 0)}
                      />
                      <span>{t('products_inv.all')}</span>
                    </label>
                  </th>
                  <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #E5E7EB' }}>
                    {t('products_inv.th_actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p, i) => {
                  const isEditing = !!editRows[p.ProdID];
                  const row = editRows[p.ProdID] || {};
                  return (
                    <tr key={p.ProdID} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #F3F4F6' }}>

                      {/* Image */}
                      <td style={{ padding: '0.5rem 0.75rem', width: 70 }}>
                        {p.ImageURL ? (
                          <img src={p.ImageURL} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} />
                        ) : (
                          <div style={{ width: 48, height: 48, backgroundColor: '#F3F4F6', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 18 }}>📦</div>
                        )}
                      </td>

                      {/* Name */}
                      <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
                        {isEditing ? (
                          <input type="text" value={row.prodName} onChange={e => updateEditRow(p.ProdID, 'prodName', e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none w-full" />
                        ) : (
                          <Link to={`/products/edit/${p.ProdID}?BusinessID=${BusinessID}`} className="hover:underline text-[#3D6B34]">{p.Title}</Link>
                        )}
                      </td>

                      {/* Category */}
                      <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: '#6B7280' }}>
                        {p.CategoryName || '—'}
                      </td>

                      {/* Price */}
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        {isEditing ? (
                          <div className="flex items-center border border-gray-300 rounded overflow-hidden" style={{ maxWidth: '90px' }}>
                            <span className="px-1 text-gray-400 text-xs bg-gray-50 border-r border-gray-300">$</span>
                            <input type="number" value={row.prodPrice} onChange={e => updateEditRow(p.ProdID, 'prodPrice', e.target.value)} className="px-1.5 py-1 text-xs focus:outline-none w-full" step="0.01" />
                          </div>
                        ) : (
                          <span className="text-sm text-gray-700">${parseFloat(p.UnitPrice || 0).toFixed(2)}</span>
                        )}
                      </td>

                      {/* Sale Price */}
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        {isEditing ? (
                          <div className="flex items-center border border-gray-300 rounded overflow-hidden" style={{ maxWidth: '90px' }}>
                            <span className="px-1 text-gray-400 text-xs bg-gray-50 border-r border-gray-300">$</span>
                            <input type="number" value={row.SalePrice} onChange={e => updateEditRow(p.ProdID, 'SalePrice', e.target.value)} className="px-1.5 py-1 text-xs focus:outline-none w-full" step="0.01" />
                          </div>
                        ) : (
                          <span className="text-sm text-gray-700">{p.SalePrice ? `$${parseFloat(p.SalePrice).toFixed(2)}` : '—'}</span>
                        )}
                      </td>

                      {/* Qty */}
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        {isEditing ? (
                          <input type="number" value={row.ProdQuantityAvailable} onChange={e => updateEditRow(p.ProdID, 'ProdQuantityAvailable', e.target.value)} className="border border-gray-300 rounded px-1.5 py-1 text-xs focus:outline-none" style={{ width: 60 }} />
                        ) : (
                          <input
                            type="number"
                            min="0"
                            value={qtyDrafts[p.ProdID] ?? (p.QuantityAvailable ?? 0)}
                            onChange={e => setQtyDrafts(prev => ({ ...prev, [p.ProdID]: e.target.value }))}
                            onBlur={e => {
                              const v = parseInt(e.target.value, 10);
                              const next = Number.isFinite(v) && v >= 0 ? v : 0;
                              setQtyDrafts(prev => { const n = { ...prev }; delete n[p.ProdID]; return n; });
                              if (next !== (p.QuantityAvailable ?? 0)) saveInline(p.ProdID, 'ProdQuantityAvailable', next);
                            }}
                            onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
                            disabled={inlineSaving[p.ProdID] === 'ProdQuantityAvailable'}
                            className="border border-gray-300 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-[#3D6B34]"
                            style={{ width: 60 }}
                          />
                        )}
                      </td>

                      {/* Publish */}
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                        {isEditing ? (
                          <input type="checkbox" checked={!!row.Publishproduct} onChange={e => updateEditRow(p.ProdID, 'Publishproduct', e.target.checked ? 1 : 0)} />
                        ) : (
                          <input
                            type="checkbox"
                            checked={!!p.Publishproduct}
                            disabled={inlineSaving[p.ProdID] === 'Publishproduct'}
                            onChange={e => saveInline(p.ProdID, 'Publishproduct', e.target.checked ? 1 : 0)}
                          />
                        )}
                      </td>

                      {/* For Sale */}
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                        {isEditing ? (
                          <input type="checkbox" checked={!!row.ProdForSale} onChange={e => updateEditRow(p.ProdID, 'ProdForSale', e.target.checked ? 1 : 0)} />
                        ) : (
                          <input
                            type="checkbox"
                            checked={!!p.ProdForSale}
                            disabled={inlineSaving[p.ProdID] === 'ProdForSale'}
                            onChange={e => saveInline(p.ProdID, 'ProdForSale', e.target.checked ? 1 : 0)}
                          />
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <>
                              <button onClick={() => handleUpdate(p.ProdID)} disabled={savingRow === p.ProdID} className="text-xs bg-[#3D6B34] text-white px-2 py-1 rounded hover:bg-[#2e5227] transition-colors disabled:opacity-50">
                                {savingRow === p.ProdID ? '...' : t('products_inv.btn_save')}
                              </button>
                              <button onClick={() => setEditRows(prev => { const n = { ...prev }; delete n[p.ProdID]; return n; })} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded border border-gray-300">
                                {t('products_inv.btn_cancel')}
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEdit(p)} title={t('products_inv.btn_quick_edit')} className="text-gray-500 hover:text-[#3D6B34]">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              </button>
                              <Link to={`/products/edit/${p.ProdID}?BusinessID=${BusinessID}`} className="text-xs text-[#3D6B34] hover:underline">
                                {t('products_inv.btn_full_edit')}
                              </Link>
                              <span className="text-gray-300">|</span>
                              <button onClick={() => handleDelete(p.ProdID)} disabled={deletingRow === p.ProdID} title={t('products_inv.btn_delete')} className="text-gray-500 hover:text-red-600">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                              </button>
                            </>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </AccountLayout>
  );
}
