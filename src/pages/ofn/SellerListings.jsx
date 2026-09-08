// Ported from Oatmeal Farm Network (src/SellerListings.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
// src/SellerListings.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation } from '../../lib/i18n';
import AccountLayout from '../../components/AccountLayout';
import { useAccount } from '../../lib/AccountContext';
import { getPeopleId } from '../../lib/auth';

const API = import.meta.env.VITE_LIVESTOCK_API_URL || '';

const inp = "border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-[#819360]";
const lbl = "block text-xs font-medium text-gray-500 mb-1";

// ── Categories that show fiber content fields ────────────────────────────────
const FIBER_CATEGORIES = ['Yarn & Fiber', 'Clothing'];

const EMPTY_SF = {
  prodName: '', prodShortDescription: '', prodDescription: '',
  prodPrice: '', SalePrice: '', prodSaleIsActive: false,
  prodCallforPrice: false, prodCustomorder: false,
  ProdQuantityAvailable: '',
  prodWeight: '', weightUnit: 'oz',
  prodLength: '', prodWidth: '', prodHeight: '', ProdDimensions: '',
  prodMadeIn: '', madeInUSA: false,
  prodShip: false,
  prodCategoryId: '', prodSubCategoryId: '',
  Materials: '',
  ProdAnimalID: '', ProdAnimalID2: '', ProdAnimalID3: '',
  FiberType1: '', FiberPercent1: '', FiberType2: '', FiberPercent2: '',
  FiberType3: '', FiberPercent3: '', FiberType4: '', FiberPercent4: '',
  FiberType5: '', FiberPercent5: '',
  images: ['', '', '', '', '', '', '', ''],
};

export default function SellerListings() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const BusinessID = searchParams.get('BusinessID');
  const PeopleID   = getPeopleId();
  const { Business, LoadBusiness } = useAccount();

  // ── SF Products ────────────────────────────────────────────────────────────
  const [products,        setProducts]        = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [showForm,        setShowForm]        = useState(false);
  const [editingProduct,  setEditingProduct]  = useState(null);
  const [form,            setForm]            = useState(EMPTY_SF);
  const [saving,          setSaving]          = useState(false);

  // Categories / subcategories
  const [categories,    setCategories]    = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  // Dynamic size / color rows
  const [sizeRows,  setSizeRows]  = useState([]);
  const [colorRows, setColorRows] = useState([]);

  // Which category name is selected (for fiber content display)
  const selectedCatName = categories.find(c => String(c.CatID) === String(form.prodCategoryId))?.CatName || '';
  const showFiber = FIBER_CATEGORIES.includes(selectedCatName);

  // Fiber total
  const fiberTotal = [1,2,3,4,5].reduce((sum, i) => {
    const p = parseFloat(form[`FiberPercent${i}`]);
    return sum + (isNaN(p) ? 0 : p);
  }, 0);

  useEffect(() => {
    if (BusinessID) {
      LoadBusiness(BusinessID);
      loadProducts();
    }
  }, [BusinessID]);

  // Load categories on mount
  useEffect(() => {
    fetch(`${API}/api/sfproducts/categories`)
      .then(r => r.json())
      .then(d => setCategories(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // Load subcategories when category changes
  useEffect(() => {
    if (!form.prodCategoryId) { setSubcategories([]); return; }
    fetch(`${API}/api/sfproducts/categories/${form.prodCategoryId}/subcategories`)
      .then(r => r.json())
      .then(d => setSubcategories(Array.isArray(d) ? d : []))
      .catch(() => setSubcategories([]));
  }, [form.prodCategoryId]);

  // ── SF Products ────────────────────────────────────────────────────────────
  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const res  = await fetch(`${API}/api/sfproducts/seller?business_id=${BusinessID}`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch { setProducts([]); } finally { setProductsLoading(false); }
  };

  const loadSizesAndColors = async (prodId) => {
    const [sizesRes, colorsRes] = await Promise.all([
      fetch(`${API}/api/sfproducts/${prodId}/sizes`),
      fetch(`${API}/api/sfproducts/${prodId}/colors`),
    ]);
    const sizes  = await sizesRes.json();
    const colors = await colorsRes.json();
    setSizeRows(Array.isArray(sizes)  ? sizes.map(s  => ({ ...s, _saved: true }))  : []);
    setColorRows(Array.isArray(colors) ? colors.map(c => ({ ...c, _saved: true })) : []);
  };

  const openAdd = () => {
    setEditingProduct(null);
    setForm(EMPTY_SF);
    setSizeRows([]);
    setColorRows([]);
    setShowForm(true);
  };

  const openEdit = async (p) => {
    setEditingProduct(p);
    let detail = p;
    try {
      const res = await fetch(`${API}/api/sfproducts/${p.ProdID}`);
      if (res.ok) detail = await res.json();
    } catch {}

    setForm({
      prodName:             detail.prodName || detail.Title || '',
      prodShortDescription: detail.prodShortDescription || '',
      prodDescription:      detail.prodDescription || detail.Description || '',
      prodPrice:            detail.prodPrice ?? detail.UnitPrice ?? '',
      SalePrice:            detail.SalePrice ?? '',
      prodSaleIsActive:     !!detail.prodSaleIsActive,
      prodCallforPrice:     !!detail.prodCallforPrice,
      prodCustomorder:      !!detail.prodCustomorder,
      ProdQuantityAvailable: detail.ProdQuantityAvailable ?? detail.QuantityAvailable ?? '',
      prodWeight:           detail.prodWeight ?? '',
      weightUnit:           'oz',
      prodLength:           detail.prodLength ?? '',
      prodWidth:            detail.prodWidth ?? '',
      prodHeight:           detail.prodHeight ?? '',
      ProdDimensions:       detail.ProdDimensions || '',
      prodMadeIn:           detail.prodMadeIn || '',
      madeInUSA:            /^(usa|us|america)$/i.test(detail.prodMadeIn || ''),
      prodShip:             !!detail.prodShip,
      prodCategoryId:       detail.prodCategoryId || detail.prodCategoryId || '',
      prodSubCategoryId:    detail.prodSubCategoryId || '',
      Materials:            detail.Materials || '',
      ProdAnimalID:         detail.ProdAnimalID || '',
      ProdAnimalID2:        detail.ProdAnimalID2 || '',
      ProdAnimalID3:        detail.ProdAnimalID3 || '',
      FiberType1:           detail.FiberType1 || '',    FiberPercent1: detail.FiberPercent1 || '',
      FiberType2:           detail.FiberType2 || '',    FiberPercent2: detail.FiberPercent2 || '',
      FiberType3:           detail.FiberType3 || '',    FiberPercent3: detail.FiberPercent3 || '',
      FiberType4:           detail.FiberType4 || '',    FiberPercent4: detail.FiberPercent4 || '',
      FiberType5:           detail.FiberType5 || '',    FiberPercent5: detail.FiberPercent5 || '',
      images: [
        detail.ProductImage1 || detail.photos?.[0] || '',
        detail.ProductImage2 || detail.photos?.[1] || '',
        detail.ProductImage3 || detail.photos?.[2] || '',
        detail.ProductImage4 || detail.photos?.[3] || '',
        detail.ProductImage5 || detail.photos?.[4] || '',
        detail.ProductImage6 || detail.photos?.[5] || '',
        detail.ProductImage7 || detail.photos?.[6] || '',
        detail.ProductImage8 || detail.photos?.[7] || '',
      ],
    });

    await loadSizesAndColors(p.ProdID);
    setShowForm(true);
  };

  const setImg = (idx, val) => setForm(f => {
    const imgs = [...f.images];
    imgs[idx] = val;
    return { ...f, images: imgs };
  });

  const pf  = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));
  const pb  = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.checked }));

  const handleMadeInUSA = (e) => {
    const checked = e.target.checked;
    setForm(f => ({ ...f, madeInUSA: checked, prodMadeIn: checked ? 'USA' : '' }));
  };

  const handleCatChange = (e) => {
    setForm(f => ({ ...f, prodCategoryId: e.target.value, prodSubCategoryId: '' }));
  };

  // Size row helpers
  const addSizeRow  = () => setSizeRows(r => [...r, { Size: '', ExtraCost: '', _saved: false }]);
  const removeSizeRow = async (idx) => {
    const row = sizeRows[idx];
    if (row._saved && row.SizeID && editingProduct) {
      await fetch(`${API}/api/sfproducts/sizes/${row.SizeID}`, { method: 'DELETE' });
    }
    setSizeRows(r => r.filter((_, i) => i !== idx));
  };
  const setSizeField = (idx, key, val) => setSizeRows(r => r.map((row, i) => i === idx ? { ...row, [key]: val } : row));

  // Color row helpers
  const addColorRow  = () => setColorRows(r => [...r, { Color: '', _saved: false }]);
  const removeColorRow = async (idx) => {
    const row = colorRows[idx];
    if (row._saved && row.ColorID && editingProduct) {
      await fetch(`${API}/api/sfproducts/colors/${row.ColorID}`, { method: 'DELETE' });
    }
    setColorRows(r => r.filter((_, i) => i !== idx));
  };
  const setColorField = (idx, val) => setColorRows(r => r.map((row, i) => i === idx ? { ...row, Color: val } : row));

  const saveProduct = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        BusinessID:          parseInt(BusinessID),
        PeopleID:            parseInt(PeopleID),
        prodName:            form.prodName,
        prodShortDescription: form.prodShortDescription || null,
        prodDescription:     form.prodDescription || null,
        prodPrice:           parseFloat(form.prodPrice) || 0,
        SalePrice:           form.SalePrice ? parseFloat(form.SalePrice) : null,
        prodSaleIsActive:    form.prodSaleIsActive ? 1 : 0,
        prodCallforPrice:    form.prodCallforPrice ? 1 : 0,
        prodCustomorder:     form.prodCustomorder ? 1 : 0,
        ProdQuantityAvailable: parseInt(form.ProdQuantityAvailable) || 0,
        prodWeight:          form.prodWeight ? parseFloat(form.prodWeight) : null,
        prodShip:            form.prodShip ? 1 : 0,
        prodLength:          form.prodLength ? parseFloat(form.prodLength) : null,
        prodWidth:           form.prodWidth ? parseFloat(form.prodWidth) : null,
        prodHeight:          form.prodHeight ? parseFloat(form.prodHeight) : null,
        ProdDimensions:      form.ProdDimensions || null,
        prodMadeIn:          form.prodMadeIn || null,
        prodCategoryId:      form.prodCategoryId ? parseInt(form.prodCategoryId) : null,
        prodSubCategoryId:   form.prodSubCategoryId ? parseInt(form.prodSubCategoryId) : null,
        Materials:           form.Materials || null,
        ProdAnimalID:        form.ProdAnimalID ? parseInt(form.ProdAnimalID) : null,
        ProdAnimalID2:       form.ProdAnimalID2 ? parseInt(form.ProdAnimalID2) : null,
        ProdAnimalID3:       form.ProdAnimalID3 ? parseInt(form.ProdAnimalID3) : null,
        FiberType1:    form.FiberType1 || null,    FiberPercent1: form.FiberPercent1 ? parseFloat(form.FiberPercent1) : null,
        FiberType2:    form.FiberType2 || null,    FiberPercent2: form.FiberPercent2 ? parseFloat(form.FiberPercent2) : null,
        FiberType3:    form.FiberType3 || null,    FiberPercent3: form.FiberPercent3 ? parseFloat(form.FiberPercent3) : null,
        FiberType4:    form.FiberType4 || null,    FiberPercent4: form.FiberPercent4 ? parseFloat(form.FiberPercent4) : null,
        FiberType5:    form.FiberType5 || null,    FiberPercent5: form.FiberPercent5 ? parseFloat(form.FiberPercent5) : null,
        Publishproduct: 1,
        ProdForSale:   1,
      };

      let prodId = editingProduct?.ProdID;

      if (editingProduct) {
        await fetch(`${API}/api/sfproducts/${prodId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        const res  = await fetch(`${API}/api/sfproducts`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        prodId = data.ProdID;
      }

      // Save photos
      const photosPayload = {};
      form.images.forEach((url, i) => {
        photosPayload[`ProductImage${i + 1}`] = url || null;
      });
      await fetch(`${API}/api/sfproducts/${prodId}/photos`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(photosPayload),
      });

      // Save new size rows
      for (const row of sizeRows) {
        if (!row._saved && row.Size) {
          await fetch(`${API}/api/sfproducts/${prodId}/sizes`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Size: row.Size, ExtraCost: parseFloat(row.ExtraCost) || 0, PeopleID: parseInt(PeopleID) }),
          });
        }
      }

      // Save new color rows
      for (const row of colorRows) {
        if (!row._saved && row.Color) {
          await fetch(`${API}/api/sfproducts/${prodId}/colors`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Color: row.Color, PeopleID: parseInt(PeopleID) }),
          });
        }
      }

      setShowForm(false);
      setEditingProduct(null);
      setForm(EMPTY_SF);
      setSizeRows([]);
      setColorRows([]);
      loadProducts();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  const deleteProduct = async (p) => {
    if (!confirm(t('seller_listings.confirm_delete', { title: p.Title }))) return;
    await fetch(`${API}/api/sfproducts/${p.ProdID}`, { method: 'DELETE' });
    loadProducts();
  };

  const togglePublish = async (p) => {
    const newVal = p.Publishproduct ? 0 : 1;
    await fetch(`${API}/api/sfproducts/${p.ProdID}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Publishproduct: newVal }),
    });
    loadProducts();
  };

  const optLbl = <span className="text-xs text-gray-400 font-normal"> {t('seller_listings.lbl_optional')}</span>;

  return (
    <AccountLayout Business={Business} BusinessID={BusinessID} PeopleID={PeopleID} pageTitle={t('seller_listings.page_title')} breadcrumbs={[{ label: t('common.dashboard'), to: '/dashboard' }, { label: t('seller_listings.breadcrumb_marketplace') }, { label: t('seller_listings.page_title') }]}>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-gray-800">{t('seller_listings.heading')}</h1>
          <button onClick={openAdd}
            className="bg-[#3D6B34] text-white font-semibold px-5 py-2 rounded-lg hover:bg-[#2d5226]">
            {t('seller_listings.btn_add_product')}
          </button>
        </div>

        {/* ── PRODUCTS ─────────────────────────────────────────────── */}
        <div>
            {/* Add / Edit form */}
            {showForm && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h2 className="font-bold text-gray-700 mb-5 text-lg">
                  {editingProduct ? t('seller_listings.form_heading_edit', { title: editingProduct.Title }) : t('seller_listings.form_heading_new')}
                </h2>
                <form onSubmit={saveProduct}>

                  {/* ── BASIC INFO ── */}
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-600 mb-3 uppercase tracking-wide">{t('seller_listings.section_basic')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-3">
                        <label className={lbl}>{t('seller_listings.lbl_title')}</label>
                        <input value={form.prodName} onChange={pf('prodName')} className={inp} required placeholder={t('seller_listings.placeholder_title')} />
                      </div>

                      {/* Category */}
                      <div>
                        <label className={lbl}>{t('seller_listings.lbl_category')}{optLbl}</label>
                        <select value={form.prodCategoryId} onChange={handleCatChange} className={inp}>
                          <option value="">{t('seller_listings.select_category')}</option>
                          {categories.map(c => (
                            <option key={c.CatID} value={c.CatID}>{c.CatName}</option>
                          ))}
                        </select>
                      </div>

                      {/* Subcategory */}
                      <div>
                        <label className={lbl}>{t('seller_listings.lbl_subcategory')}{optLbl}</label>
                        <select value={form.prodSubCategoryId} onChange={pf('prodSubCategoryId')} className={inp} disabled={!subcategories.length}>
                          <option value="">{t('seller_listings.select_subcategory')}</option>
                          {subcategories.map(s => (
                            <option key={s.SubCatID} value={s.SubCatID}>{s.SubCatName}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className={lbl}>{t('seller_listings.lbl_short_description')}{optLbl}</label>
                        <input value={form.prodShortDescription} onChange={pf('prodShortDescription')} className={inp} placeholder={t('seller_listings.placeholder_short_desc')} />
                      </div>

                      <div className="md:col-span-3">
                        <label className={lbl}>{t('seller_listings.lbl_full_description')}{optLbl}</label>
                        <textarea value={form.prodDescription} onChange={pf('prodDescription')} className={inp} rows={4} placeholder={t('seller_listings.placeholder_full_desc')} />
                      </div>

                      {/* Made In */}
                      <div>
                        <label className={lbl}>{t('seller_listings.lbl_made_in')}{optLbl}</label>
                        <input value={form.prodMadeIn} onChange={pf('prodMadeIn')} className={inp} placeholder={t('seller_listings.placeholder_made_in')} />
                      </div>
                      <div className="flex items-center pt-5">
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <input type="checkbox" checked={form.madeInUSA} onChange={handleMadeInUSA} className="w-4 h-4 accent-green-600" />
                          {t('seller_listings.lbl_made_in_usa')}
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* ── PRICING ── */}
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-600 mb-3 uppercase tracking-wide">{t('seller_listings.section_pricing')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className={lbl}>{t('seller_listings.lbl_retail_price')}</label>
                        <input type="number" step="0.01" min="0" value={form.prodPrice} onChange={pf('prodPrice')} className={inp} required placeholder="0.00" />
                      </div>
                      <div>
                        <label className={lbl}>{t('seller_listings.lbl_sale_price')}{optLbl}</label>
                        <input type="number" step="0.01" min="0" value={form.SalePrice} onChange={pf('SalePrice')} className={inp} placeholder="0.00" />
                      </div>
                      <div className="flex flex-col justify-end pb-2 gap-2">
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <input type="checkbox" checked={form.prodSaleIsActive} onChange={pb('prodSaleIsActive')} className="w-4 h-4 accent-green-600" />
                          {t('seller_listings.lbl_sale_active')}
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <input type="checkbox" checked={form.prodCallforPrice} onChange={pb('prodCallforPrice')} className="w-4 h-4 accent-green-600" />
                          {t('seller_listings.lbl_call_for_price')}
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* ── INVENTORY ── */}
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-600 mb-3 uppercase tracking-wide">{t('seller_listings.section_inventory')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className={lbl}>{t('seller_listings.lbl_qty')}</label>
                        <input type="number" min="0" value={form.ProdQuantityAvailable} onChange={pf('ProdQuantityAvailable')} className={inp} placeholder="0" />
                      </div>
                      <div className="flex items-center pt-5">
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <input type="checkbox" checked={form.prodCustomorder} onChange={pb('prodCustomorder')} className="w-4 h-4 accent-green-600" />
                          {t('seller_listings.lbl_custom_orders')}
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* ── PHYSICAL ── */}
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-600 mb-3 uppercase tracking-wide">{t('seller_listings.section_physical')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-3">
                        <label className={lbl}>{t('seller_listings.lbl_materials')}{optLbl}</label>
                        <input value={form.Materials} onChange={pf('Materials')} className={inp} placeholder={t('seller_listings.placeholder_materials')} />
                      </div>
                      <div>
                        <label className={lbl}>{t('seller_listings.lbl_weight')}{optLbl}</label>
                        <input type="number" step="0.01" min="0" value={form.prodWeight} onChange={pf('prodWeight')} className={inp} placeholder="0.00" />
                      </div>
                      <div>
                        <label className={lbl}>{t('seller_listings.lbl_weight_unit')}{optLbl}</label>
                        <select value={form.weightUnit} onChange={pf('weightUnit')} className={inp}>
                          {['oz', 'lb', 'g', 'kg'].map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                      <div className="flex items-center pt-5">
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <input type="checkbox" checked={form.prodShip} onChange={pb('prodShip')} className="w-4 h-4 accent-green-600" />
                          {t('seller_listings.lbl_ships')}
                        </label>
                      </div>
                      <div>
                        <label className={lbl}>{t('seller_listings.lbl_length')}{optLbl}</label>
                        <input type="number" step="0.01" min="0" value={form.prodLength} onChange={pf('prodLength')} className={inp} placeholder="0.00" />
                      </div>
                      <div>
                        <label className={lbl}>{t('seller_listings.lbl_width')}{optLbl}</label>
                        <input type="number" step="0.01" min="0" value={form.prodWidth} onChange={pf('prodWidth')} className={inp} placeholder="0.00" />
                      </div>
                      <div>
                        <label className={lbl}>{t('seller_listings.lbl_height')}{optLbl}</label>
                        <input type="number" step="0.01" min="0" value={form.prodHeight} onChange={pf('prodHeight')} className={inp} placeholder="0.00" />
                      </div>
                      <div className="md:col-span-3">
                        <label className={lbl}>{t('seller_listings.lbl_dimensions')}{optLbl}</label>
                        <input value={form.ProdDimensions} onChange={pf('ProdDimensions')} className={inp} placeholder='e.g. 12" x 8" x 4"' />
                      </div>
                    </div>
                  </div>

                  {/* ── FIBER CONTENT (Yarn & Fiber / Clothing only) ── */}
                  {showFiber && (
                    <div className="mb-6">
                      <h3 className="text-sm font-bold text-gray-600 mb-3 uppercase tracking-wide">
                        {t('seller_listings.section_fiber')}
                        {fiberTotal > 0 && (
                          <span className={`ml-2 font-normal text-xs ${fiberTotal === 100 ? 'text-green-600' : fiberTotal > 100 ? 'text-red-500' : 'text-amber-500'}`}>
                            {t('seller_listings.fiber_total', { total: fiberTotal })}
                          </span>
                        )}
                      </h3>
                      <div className="space-y-2">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className="flex gap-3 items-center">
                            <input value={form[`FiberType${i}`]} onChange={pf(`FiberType${i}`)} className={`${inp} flex-grow`} placeholder={t('seller_listings.placeholder_fiber', { n: i })} />
                            <div className="flex items-center gap-1 w-28 shrink-0">
                              <input type="number" min="0" max="100" step="0.1" value={form[`FiberPercent${i}`]} onChange={pf(`FiberPercent${i}`)} className={inp} placeholder="%" />
                              <span className="text-sm text-gray-400">%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── ANIMAL LINKAGE ── */}
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-600 mb-3 uppercase tracking-wide">{t('seller_listings.section_animal')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className={lbl}>{t('seller_listings.lbl_animal_id1')}{optLbl}</label>
                        <input value={form.ProdAnimalID} onChange={pf('ProdAnimalID')} className={inp} placeholder={t('seller_listings.placeholder_animal_id')} />
                      </div>
                      <div>
                        <label className={lbl}>{t('seller_listings.lbl_animal_id2')}{optLbl}</label>
                        <input value={form.ProdAnimalID2} onChange={pf('ProdAnimalID2')} className={inp} placeholder={t('seller_listings.placeholder_animal_id')} />
                      </div>
                      <div>
                        <label className={lbl}>{t('seller_listings.lbl_animal_id3')}{optLbl}</label>
                        <input value={form.ProdAnimalID3} onChange={pf('ProdAnimalID3')} className={inp} placeholder={t('seller_listings.placeholder_animal_id')} />
                      </div>
                    </div>
                  </div>

                  {/* ── IMAGES ── */}
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-600 mb-3 uppercase tracking-wide">{t('seller_listings.section_images')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {form.images.map((url, idx) => (
                        <div key={idx} className="flex gap-2 items-start">
                          <div className="flex-grow">
                            <label className={lbl}>{t('seller_listings.lbl_image', { n: idx + 1 })}</label>
                            <input value={url} onChange={e => setImg(idx, e.target.value)} className={inp} placeholder="https://…" />
                          </div>
                          {url && (
                            <img src={url} alt={t('seller_listings.lbl_image', { n: idx + 1 })}
                              className="w-12 h-12 rounded-lg object-cover border border-gray-200 mt-5 shrink-0"
                              onError={e => { e.target.style.display = 'none'; }} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── SIZES ── */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide">{t('seller_listings.section_sizes')}</h3>
                      <button type="button" onClick={addSizeRow}
                        className="text-xs text-[#3D6B34] hover:underline font-semibold">{t('seller_listings.btn_add_size')}</button>
                    </div>
                    {sizeRows.length === 0 && (
                      <p className="text-xs text-gray-400">{t('seller_listings.sizes_empty')}</p>
                    )}
                    <div className="space-y-2">
                      {sizeRows.map((row, idx) => (
                        <div key={idx} className="flex gap-3 items-center">
                          <input value={row.Size} onChange={e => setSizeField(idx, 'Size', e.target.value)}
                            className={`${inp} flex-grow`} placeholder={t('seller_listings.placeholder_size')} />
                          <div className="flex items-center gap-1 w-36 shrink-0">
                            <span className="text-sm text-gray-400">+$</span>
                            <input type="number" step="0.01" min="0" value={row.ExtraCost} onChange={e => setSizeField(idx, 'ExtraCost', e.target.value)}
                              className={inp} placeholder="0.00" />
                          </div>
                          <button type="button" onClick={() => removeSizeRow(idx)} className="text-red-400 hover:text-red-600 text-sm px-1">✕</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── COLORS ── */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide">{t('seller_listings.section_colors')}</h3>
                      <button type="button" onClick={addColorRow}
                        className="text-xs text-[#3D6B34] hover:underline font-semibold">{t('seller_listings.btn_add_color')}</button>
                    </div>
                    {colorRows.length === 0 && (
                      <p className="text-xs text-gray-400">{t('seller_listings.colors_empty')}</p>
                    )}
                    <div className="space-y-2">
                      {colorRows.map((row, idx) => (
                        <div key={idx} className="flex gap-3 items-center">
                          <input value={row.Color} onChange={e => setColorField(idx, e.target.value)}
                            className={`${inp} flex-grow`} placeholder={t('seller_listings.placeholder_color')} />
                          <button type="button" onClick={() => removeColorRow(idx)} className="text-red-400 hover:text-red-600 text-sm px-1">✕</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-5">
                    <button type="button" onClick={() => { setShowForm(false); setEditingProduct(null); }}
                      className="px-5 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                      {t('seller_listings.btn_cancel')}
                    </button>
                    <button type="submit" disabled={saving}
                      className="bg-[#3D6B34] text-white font-semibold px-6 py-2 rounded-lg hover:bg-[#2d5226] disabled:opacity-50">
                      {saving ? t('seller_listings.btn_saving') : editingProduct ? t('seller_listings.btn_save_changes') : t('seller_listings.btn_create')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Products table */}
            {productsLoading ? (
              <div className="text-center py-12 text-gray-400">{t('seller_listings.loading')}</div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
                <div className="flex justify-center mb-2"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg></div>
                <p className="mb-3">{t('seller_listings.empty_msg')}</p>
                <button onClick={openAdd}
                  className="bg-[#3D6B34] text-white font-semibold px-5 py-2 rounded-lg hover:bg-[#2d5226] text-sm">
                  {t('seller_listings.btn_add_first')}
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
                      <th className="px-4 py-3">{t('seller_listings.th_product')}</th>
                      <th className="px-4 py-3">{t('seller_listings.th_category')}</th>
                      <th className="px-4 py-3">{t('seller_listings.th_price')}</th>
                      <th className="px-4 py-3">{t('seller_listings.th_qty')}</th>
                      <th className="px-4 py-3">{t('seller_listings.th_status')}</th>
                      <th className="px-4 py-3">{t('seller_listings.th_actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.map(p => (
                      <tr key={p.ProdID} className={!p.Publishproduct ? 'opacity-50' : ''}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {p.ImageURL
                              ? <img src={p.ImageURL} alt={p.Title} className="w-10 h-10 rounded-lg object-cover" />
                              : <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg">🛍️</div>}
                            <div>
                              <p className="font-semibold text-sm text-gray-800">{p.Title}</p>
                              {p.prodCustomorder && <p className="text-xs text-amber-600">{t('seller_listings.custom_orders')}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{p.CategoryName || '—'}</td>
                        <td className="px-4 py-3 text-sm font-bold text-[#3D6B34]">
                          {p.prodCallforPrice ? (
                            <span className="text-xs font-normal text-gray-500">{t('seller_listings.call_for_price')}</span>
                          ) : (
                            <>
                              ${parseFloat(p.UnitPrice || 0).toFixed(2)}
                              {p.prodSaleIsActive && p.SalePrice && (
                                <span className="ml-1 text-xs font-normal text-red-500 line-through">${parseFloat(p.SalePrice).toFixed(2)}</span>
                              )}
                            </>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{p.QuantityAvailable}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${p.Publishproduct ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {p.Publishproduct ? t('seller_listings.status_published') : t('seller_listings.status_draft')}
                          </span>
                        </td>
                        <td className="px-4 py-3 flex items-center gap-3">
                          <button onClick={() => openEdit(p)} className="text-xs text-blue-600 hover:underline">{t('seller_listings.btn_edit')}</button>
                          <button onClick={() => togglePublish(p)} className="text-xs text-gray-500 hover:underline">
                            {p.Publishproduct ? t('seller_listings.btn_unpublish') : t('seller_listings.btn_publish')}
                          </button>
                          <button onClick={() => deleteProduct(p)} className="text-xs text-red-500 hover:underline">{t('seller_listings.btn_delete')}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
      </div>
    </AccountLayout>
  );
}
