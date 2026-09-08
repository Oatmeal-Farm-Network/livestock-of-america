// Ported from Oatmeal Farm Network (src/ProductEdit.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router';
import { useTranslation } from '../../lib/i18n';
import AccountLayout from '../../components/AccountLayout';
import { useAccount } from '../../lib/AccountContext';
import { getPeopleId } from '../../lib/auth';

const API_URL = import.meta.env.VITE_LIVESTOCK_API_URL || '';

const EMPTY_FORM = {
  prodName: '',
  prodShortDescription: '',
  prodDescription: '',
  prodPrice: '',
  SalePrice: '',
  prodSaleIsActive: 0,
  prodCallforPrice: 0,
  prodCustomorder: 0,
  prodMadeIn: '',
  prodCategoryId: '',
  prodSubCategoryId: '',
  ProdQuantityAvailable: '',
  Materials: '',
  prodWeight: '',
  prodShip: 0,
  prodLength: '',
  prodWidth: '',
  prodHeight: '',
  ProdDimensions: '',
  Publishproduct: 1,
  ProdForSale: 1,
};

const EMPTY_PHOTOS = {
  ProductImage1: '',
  ProductImage2: '',
  ProductImage3: '',
  ProductImage4: '',
  ProductImage5: '',
  ProductImage6: '',
  ProductImage7: '',
  ProductImage8: '',
};

export default function ProductEdit() {
  const { t } = useTranslation();
  const { prodId } = useParams(); // undefined for /products/add
  const [searchParams] = useSearchParams();
  const BusinessID = searchParams.get('BusinessID');
  const PeopleID = getPeopleId();
  const navigate = useNavigate();
  const { Business, LoadBusiness } = useAccount();

  const isNew = !prodId;
  const [form, setForm] = useState(EMPTY_FORM);
  const [photos, setPhotos] = useState(EMPTY_PHOTOS);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    if (BusinessID) LoadBusiness(BusinessID);
    loadCategories();
    if (!isNew) loadProduct();
  }, [prodId, BusinessID]);

  useEffect(() => {
    if (form.prodCategoryId) loadSubcategories(form.prodCategoryId);
    else setSubcategories([]);
  }, [form.prodCategoryId]);

  async function loadCategories() {
    const data = await fetch(`${API_URL}/api/sfproducts/categories`).then(r => r.json()).catch(() => []);
    setCategories(Array.isArray(data) ? data : []);
  }

  async function loadSubcategories(catId) {
    const data = await fetch(`${API_URL}/api/sfproducts/categories/${catId}/subcategories`).then(r => r.json()).catch(() => []);
    setSubcategories(Array.isArray(data) ? data : []);
  }

  async function loadProduct() {
    setLoading(true);
    const data = await fetch(`${API_URL}/api/sfproducts/${prodId}`).then(r => r.ok ? r.json() : null).catch(() => null);
    if (data) {
      setForm({
        prodName: data.prodName ?? '',
        prodShortDescription: data.prodShortDescription ?? '',
        prodDescription: data.prodDescription ?? '',
        prodPrice: data.prodPrice ?? '',
        SalePrice: data.SalePrice ?? '',
        prodSaleIsActive: data.prodSaleIsActive ?? 0,
        prodCallforPrice: data.prodCallforPrice ?? 0,
        prodCustomorder: data.prodCustomorder ?? 0,
        prodMadeIn: data.prodMadeIn ?? '',
        prodCategoryId: data.prodCategoryId ?? '',
        prodSubCategoryId: data.prodSubCategoryId ?? '',
        ProdQuantityAvailable: data.ProdQuantityAvailable ?? '',
        Materials: data.Materials ?? '',
        prodWeight: data.prodWeight ?? '',
        prodShip: data.prodShip ?? 0,
        prodLength: data.prodLength ?? '',
        prodWidth: data.prodWidth ?? '',
        prodHeight: data.prodHeight ?? '',
        ProdDimensions: data.ProdDimensions ?? '',
        Publishproduct: data.Publishproduct ?? 1,
        ProdForSale: data.ProdForSale ?? 1,
      });
      const p = Array.isArray(data.photos) ? data.photos : [];
      setPhotos({
        ProductImage1: p[0] || '',
        ProductImage2: p[1] || '',
        ProductImage3: p[2] || '',
        ProductImage4: p[3] || '',
        ProductImage5: p[4] || '',
        ProductImage6: p[5] || '',
        ProductImage7: p[6] || '',
        ProductImage8: p[7] || '',
      });
    }
    setLoading(false);
  }

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function numOrNull(v) {
    if (v === '' || v === null || v === undefined) return null;
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  }
  function intOrNull(v) {
    if (v === '' || v === null || v === undefined) return null;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSavedMsg('');

    const basePayload = {
      prodName: form.prodName,
      prodShortDescription: form.prodShortDescription || null,
      prodDescription: form.prodDescription || null,
      prodPrice: numOrNull(form.prodPrice) ?? 0.0,
      SalePrice: numOrNull(form.SalePrice),
      prodSaleIsActive: form.prodSaleIsActive ? 1 : 0,
      prodCallforPrice: form.prodCallforPrice ? 1 : 0,
      prodCustomorder: form.prodCustomorder ? 1 : 0,
      prodMadeIn: form.prodMadeIn || null,
      prodCategoryId: intOrNull(form.prodCategoryId),
      prodSubCategoryId: intOrNull(form.prodSubCategoryId),
      ProdQuantityAvailable: intOrNull(form.ProdQuantityAvailable) ?? 0,
      Materials: form.Materials || null,
      prodWeight: numOrNull(form.prodWeight),
      prodShip: form.prodShip ? 1 : 0,
      prodLength: numOrNull(form.prodLength),
      prodWidth: numOrNull(form.prodWidth),
      prodHeight: numOrNull(form.prodHeight),
      ProdDimensions: form.ProdDimensions || null,
      Publishproduct: form.Publishproduct ? 1 : 0,
      ProdForSale: form.ProdForSale ? 1 : 0,
    };

    let activeProdId = prodId;

    if (isNew) {
      const createBody = { ...basePayload, BusinessID: parseInt(BusinessID, 10), PeopleID: parseInt(PeopleID, 10) };
      const res = await fetch(`${API_URL}/api/sfproducts/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createBody),
      });
      if (!res.ok) { setSaving(false); alert(t('product_edit.err_create_failed')); return; }
      const created = await res.json();
      activeProdId = created.ProdID;
    } else {
      const res = await fetch(`${API_URL}/api/sfproducts/${prodId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(basePayload),
      });
      if (!res.ok) { setSaving(false); alert(t('product_edit.err_save_failed')); return; }
    }

    // Save photos (even if empty, to keep in sync)
    if (activeProdId) {
      await fetch(`${API_URL}/api/sfproducts/${activeProdId}/photos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(photos),
      });
    }

    setSaving(false);
    setSavedMsg(t('product_edit.saved'));
    if (isNew && activeProdId) {
      navigate(`/products/edit/${activeProdId}?BusinessID=${BusinessID}`, { replace: true });
    }
  }

  const inputCls = "border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#819360] w-full";
  const labelCls = "block text-xs font-medium text-gray-500 mb-1";

  return (
    <AccountLayout
      Business={Business}
      BusinessID={BusinessID}
      PeopleID={PeopleID}
      pageTitle={isNew ? t('product_edit.page_title_add') : t('product_edit.page_title_edit')}
      breadcrumbs={[
        { label: t('product_edit.breadcrumb_dashboard'), to: '/dashboard' },
        { label: t('product_edit.breadcrumb_products'), to: `/products?BusinessID=${BusinessID}` },
        { label: isNew ? t('product_edit.breadcrumb_add') : t('product_edit.breadcrumb_edit') },
      ]}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {loading ? (
          <div className="text-center py-12 text-gray-400">{t('product_edit.loading')}</div>
        ) : (
        <form onSubmit={handleSave} className="space-y-6">

          {/* Basics */}
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">{t('product_edit.section_basics')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelCls}>{t('product_edit.lbl_name')}</label>
                <input required type="text" value={form.prodName} onChange={e => set('prodName', e.target.value)} className={inputCls} />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>{t('product_edit.lbl_short_description')}</label>
                <input type="text" value={form.prodShortDescription} onChange={e => set('prodShortDescription', e.target.value)} className={inputCls} maxLength={255} />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>{t('product_edit.lbl_description')}</label>
                <textarea value={form.prodDescription} onChange={e => set('prodDescription', e.target.value)} className={`${inputCls} min-h-[120px]`} />
              </div>
              <div>
                <label className={labelCls}>{t('product_edit.lbl_category')}</label>
                <select value={form.prodCategoryId} onChange={e => { set('prodCategoryId', e.target.value); set('prodSubCategoryId', ''); }} className={inputCls}>
                  <option value="">{t('product_edit.option_select_category')}</option>
                  {categories.map(c => (
                    <option key={c.CatID} value={c.CatID}>{c.CatName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>{t('product_edit.lbl_subcategory')}</label>
                <select value={form.prodSubCategoryId} onChange={e => set('prodSubCategoryId', e.target.value)} className={inputCls} disabled={!subcategories.length}>
                  <option value="">{t('product_edit.option_select_subcategory')}</option>
                  {subcategories.map(s => (
                    <option key={s.SubCatID} value={s.SubCatID}>{s.SubCatName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>{t('product_edit.lbl_made_in')}</label>
                <input type="text" value={form.prodMadeIn} onChange={e => set('prodMadeIn', e.target.value)} className={inputCls} placeholder="e.g. Oregon, USA" />
              </div>
              <div>
                <label className={labelCls}>{t('product_edit.lbl_materials')}</label>
                <input type="text" value={form.Materials} onChange={e => set('Materials', e.target.value)} className={inputCls} placeholder="e.g. 100% wool" />
              </div>
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">{t('product_edit.section_pricing')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>{t('product_edit.lbl_price')}</label>
                <div className="flex items-center border border-gray-300 rounded overflow-hidden focus-within:border-[#819360]">
                  <span className="px-2 text-gray-400 text-sm bg-gray-50 border-r border-gray-300">$</span>
                  <input required type="number" value={form.prodPrice} onChange={e => set('prodPrice', e.target.value)} className="px-2 py-1.5 text-sm focus:outline-none w-full" step="0.01" min="0" />
                </div>
              </div>
              <div>
                <label className={labelCls}>{t('product_edit.lbl_sale_price')}</label>
                <div className="flex items-center border border-gray-300 rounded overflow-hidden focus-within:border-[#819360]">
                  <span className="px-2 text-gray-400 text-sm bg-gray-50 border-r border-gray-300">$</span>
                  <input type="number" value={form.SalePrice} onChange={e => set('SalePrice', e.target.value)} className="px-2 py-1.5 text-sm focus:outline-none w-full" step="0.01" min="0" />
                </div>
              </div>
              <div>
                <label className={labelCls}>{t('product_edit.lbl_quantity')}</label>
                <input type="number" value={form.ProdQuantityAvailable} onChange={e => set('ProdQuantityAvailable', e.target.value)} className={inputCls} min="0" />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input id="saleActive" type="checkbox" checked={!!form.prodSaleIsActive} onChange={e => set('prodSaleIsActive', e.target.checked ? 1 : 0)} />
                <label htmlFor="saleActive" className="text-sm text-gray-700">{t('product_edit.chk_sale_active')}</label>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input id="callForPrice" type="checkbox" checked={!!form.prodCallforPrice} onChange={e => set('prodCallforPrice', e.target.checked ? 1 : 0)} />
                <label htmlFor="callForPrice" className="text-sm text-gray-700">{t('product_edit.chk_call_for_price')}</label>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input id="customOrder" type="checkbox" checked={!!form.prodCustomorder} onChange={e => set('prodCustomorder', e.target.checked ? 1 : 0)} />
                <label htmlFor="customOrder" className="text-sm text-gray-700">{t('product_edit.chk_custom_order')}</label>
              </div>
            </div>
          </div>

          {/* Shipping & Handling */}
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">{t('product_edit.section_shipping')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="col-span-2 md:col-span-5 flex items-center gap-2">
                <input id="prodShip" type="checkbox" checked={!!form.prodShip} onChange={e => set('prodShip', e.target.checked ? 1 : 0)} />
                <label htmlFor="prodShip" className="text-sm text-gray-700">{t('product_edit.chk_ships')}</label>
              </div>
              <div>
                <label className={labelCls}>{t('product_edit.lbl_weight')}</label>
                <input type="number" value={form.prodWeight} onChange={e => set('prodWeight', e.target.value)} className={inputCls} step="0.01" min="0" />
              </div>
              <div>
                <label className={labelCls}>{t('product_edit.lbl_length')}</label>
                <input type="number" value={form.prodLength} onChange={e => set('prodLength', e.target.value)} className={inputCls} step="0.1" min="0" />
              </div>
              <div>
                <label className={labelCls}>{t('product_edit.lbl_width')}</label>
                <input type="number" value={form.prodWidth} onChange={e => set('prodWidth', e.target.value)} className={inputCls} step="0.1" min="0" />
              </div>
              <div>
                <label className={labelCls}>{t('product_edit.lbl_height')}</label>
                <input type="number" value={form.prodHeight} onChange={e => set('prodHeight', e.target.value)} className={inputCls} step="0.1" min="0" />
              </div>
              <div>
                <label className={labelCls}>{t('product_edit.lbl_dimensions')}</label>
                <input type="text" value={form.ProdDimensions} onChange={e => set('ProdDimensions', e.target.value)} className={inputCls} placeholder='e.g. 12" x 8" x 4"' />
              </div>
            </div>
          </div>

          {/* Photos */}
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">{t('product_edit.section_photos')}</h2>
            <p className="text-xs text-gray-500 mb-3">{t('product_edit.photos_hint')}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[1,2,3,4,5,6,7,8].map(n => {
                const key = `ProductImage${n}`;
                const val = photos[key];
                return (
                  <div key={n} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-6">{n}.</span>
                    <input
                      type="url"
                      value={val}
                      onChange={e => setPhotos(p => ({ ...p, [key]: e.target.value }))}
                      className={inputCls}
                      placeholder="https://..."
                    />
                    {val ? (
                      <img src={val} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4, border: '1px solid #E5E7EB' }} onError={e => { e.target.style.display = 'none'; }} />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Visibility */}
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">{t('product_edit.section_visibility')}</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input id="publish" type="checkbox" checked={!!form.Publishproduct} onChange={e => set('Publishproduct', e.target.checked ? 1 : 0)} />
                <label htmlFor="publish" className="text-sm text-gray-700">{t('product_edit.chk_publish')}</label>
              </div>
              <div className="flex items-center gap-2">
                <input id="forSale" type="checkbox" checked={!!form.ProdForSale} onChange={e => set('ProdForSale', e.target.checked ? 1 : 0)} />
                <label htmlFor="forSale" className="text-sm text-gray-700">{t('product_edit.chk_for_sale')}</label>
              </div>
              <p className="text-xs text-gray-500">{t('product_edit.visibility_note')}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end items-center gap-3">
            {savedMsg && <span className="text-sm text-green-700">{savedMsg}</span>}
            <button type="button" onClick={() => navigate(`/products?BusinessID=${BusinessID}`)} className="text-sm px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50">
              {t('product_edit.btn_cancel')}
            </button>
            <button type="submit" disabled={saving} className="regsubmit2" style={{ minWidth: '160px' }}>
              {saving ? t('product_edit.btn_saving') : isNew ? t('product_edit.btn_create') : t('product_edit.btn_save')}
            </button>
          </div>

        </form>
        )}
      </div>
    </AccountLayout>
  );
}
