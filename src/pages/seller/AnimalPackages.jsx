// src/pages/seller/AnimalPackages.jsx
// Bundle animals into a priced package — /seller/animals/packages?BusinessID=
// Ported from OatmealFarmNetwork's AnimalPackages.jsx.
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router';
import { useTranslation } from '../../lib/i18n';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import Breadcrumbs from '../../components/Breadcrumbs';
import { endpoints } from '../../config/api';
import { getToken } from '../../lib/auth';

const CREAM = '#f7f2e8';
const OLIVE = '#3d6b34';
const RUST = '#8b3a2b';
const INK = '#2c2c2c';
const MUTED = '#6b6b6b';
const STUD = '#2f5d8a';
const LORA = "'Lora', 'Times New Roman', serif";

const fmt = (n) => {
  if (!n && n !== 0) return '$0';
  return Number(n).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
};

// A package line is worth its stud fee when included as stud, otherwise its sale price.
const lineValue = (item) =>
  item.IncludeType === 'stud' ? Number(item.StudFee || 0) : Number(item.Price || 0);

export default function AnimalPackages() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const BusinessID = searchParams.get('BusinessID');

  const [packages, setPackages] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [packagePrice, setPackagePrice] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [animalQuery, setAnimalQuery] = useState('');

  const token = getToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const animalsHref = `/seller/animals${BusinessID ? `?BusinessID=${BusinessID}` : ''}`;

  const loadPackages = () => {
    if (!BusinessID) {
      setLoading(false);
      return;
    }
    fetch(endpoints.animalPackages(BusinessID), { headers })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setPackages(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const loadAnimals = () => {
    if (!BusinessID) return;
    fetch(endpoints.authAnimals(BusinessID), { headers })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setAnimals(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  useEffect(() => {
    loadPackages();
    loadAnimals();
  }, [BusinessID]);

  const totalValue = useMemo(
    () => selectedItems.reduce((sum, item) => sum + lineValue(item), 0),
    [selectedItems],
  );

  const selectedIds = useMemo(
    () => new Set(selectedItems.map((i) => i.AnimalID)),
    [selectedItems],
  );

  const filteredAnimals = useMemo(() => {
    let list = animals.filter((a) => !selectedIds.has(a.AnimalID));
    const q = animalQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          (a.FullName || '').toLowerCase().includes(q) ||
          (a.Category || '').toLowerCase().includes(q) ||
          (a.SpeciesName || '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [animals, selectedIds, animalQuery]);

  const clearForm = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setPackagePrice('');
    setSelectedItems([]);
    setAnimalQuery('');
    setSaveError(null);
  };

  const startEdit = (pkg) => {
    setEditingId(pkg.PackageID);
    setTitle(pkg.Title || '');
    setDescription(pkg.Description || '');
    setPackagePrice(pkg.PackagePrice ? String(pkg.PackagePrice) : '');
    setSelectedItems(
      (pkg.Items || []).map((it) => ({
        AnimalID: it.AnimalID,
        IncludeType: it.IncludeType || 'sale',
        FullName: it.FullName,
        Price: it.Price || 0,
        StudFee: it.StudFee || 0,
      })),
    );
    setAnimalQuery('');
    setSaveError(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addAnimal = (animal, includeType = 'sale') => {
    const price = animal.SalePrice > 0 ? animal.SalePrice : animal.Price || 0;
    setSelectedItems((prev) => [
      ...prev,
      {
        AnimalID: animal.AnimalID,
        IncludeType: includeType,
        FullName: animal.FullName,
        Price: price,
        StudFee: animal.StudFee || 0,
      },
    ]);
  };

  const removeItem = (animalId) =>
    setSelectedItems((prev) => prev.filter((i) => i.AnimalID !== animalId));

  const toggleType = (animalId) =>
    setSelectedItems((prev) =>
      prev.map((i) =>
        i.AnimalID === animalId
          ? { ...i, IncludeType: i.IncludeType === 'sale' ? 'stud' : 'sale' }
          : i,
      ),
    );

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(endpoints.animalPackageSave(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          PackageID: editingId,
          BusinessID,
          Title: title,
          Description: description,
          PackagePrice: packagePrice ? Number(packagePrice) : 0,
          Items: selectedItems.map((i) => ({
            AnimalID: i.AnimalID,
            IncludeType: i.IncludeType,
          })),
        }),
      });
      if (!res.ok) throw new Error(t('animal_packages.save_error', 'Could not save this package.'));
      clearForm();
      setShowForm(false);
      loadPackages();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pkgId) => {
    if (!window.confirm(t('animal_packages.confirm_delete', 'Delete this package?'))) return;
    await fetch(endpoints.animalPackageDelete(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ PackageID: pkgId }),
    });
    loadPackages();
  };

  const savingsNote = (savings, base) =>
    t('animal_packages.savings_label', 'Save {amount} ({pct}%)', {
      amount: fmt(savings),
      pct: base > 0 ? Math.round((savings / base) * 100) : 0,
    });

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ background: CREAM }}>
      <PageMeta title="Animal Packages | Livestock of America" noIndex />
      <Header />

      <main className="grow w-full max-w-[900px] mx-auto px-4 md:px-6 py-6 md:py-8">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'Dashboard', to: '/account' },
            { label: t('seller_animals.title', 'My Animals'), to: animalsHref },
            { label: t('animal_packages.crumb_packages', 'Packages') },
          ]}
        />

        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-5 md:p-6">
          <div className="flex justify-between items-center gap-3 mb-4">
            <div>
              <h1 className="text-2xl font-bold m-0" style={{ fontFamily: LORA, color: INK }}>
                {t('animal_packages.heading', 'Animal packages')}
              </h1>
              <p className="text-sm m-0 mt-0.5" style={{ color: MUTED }}>
                {t('animal_packages.subtitle', 'Group animals together and sell them at a bundle price.')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                clearForm();
                setShowForm((v) => !v);
              }}
              className="px-4 py-2 rounded-lg font-semibold text-sm text-white shrink-0"
              style={{ background: showForm ? MUTED : OLIVE }}
            >
              {showForm
                ? t('animal_packages.btn_cancel', 'Cancel')
                : t('animal_packages.btn_create', 'New package')}
            </button>
          </div>

          {!BusinessID ? (
            <p className="text-sm" style={{ color: MUTED }}>
              {t('animal_packages.no_business', 'Choose a business to manage its packages.')}
            </p>
          ) : (
            <>
              {showForm && (
                <form
                  onSubmit={handleSave}
                  className="mb-6 rounded-xl p-4 space-y-4"
                  style={{ background: '#faf7f1', border: '1px solid rgba(0,0,0,0.08)' }}
                >
                  <h2 className="text-lg font-bold m-0" style={{ fontFamily: LORA, color: INK }}>
                    {editingId
                      ? t('animal_packages.form_heading_edit', 'Edit package')
                      : t('animal_packages.form_heading_new', 'New package')}
                  </h2>

                  {saveError && (
                    <div
                      className="p-3 rounded-lg text-sm"
                      style={{ background: '#fff2f0', color: RUST }}
                    >
                      {saveError}
                    </div>
                  )}

                  <div className="max-w-lg">
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: INK }}>
                      {t('animal_packages.lbl_title', 'Package title')}
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none"
                      style={{ borderColor: 'rgba(0,0,0,0.15)' }}
                      placeholder={t('animal_packages.placeholder_title', 'Starter flock')}
                    />
                  </div>

                  <div className="max-w-lg">
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: INK }}>
                      {t('animal_packages.lbl_description', 'Description')}
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none resize-y"
                      style={{ borderColor: 'rgba(0,0,0,0.15)' }}
                      placeholder={t(
                        'animal_packages.placeholder_description',
                        'What the buyer gets and why it works together.',
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: INK }}>
                      {t('animal_packages.lbl_add_animals', 'Add animals')}
                    </label>
                    <input
                      type="text"
                      value={animalQuery}
                      onChange={(e) => setAnimalQuery(e.target.value)}
                      className="w-full max-w-lg px-3 py-2.5 border rounded-lg text-sm focus:outline-none mb-2"
                      style={{ borderColor: 'rgba(0,0,0,0.15)' }}
                      placeholder={t('animal_packages.placeholder_animal_search', 'Search your animals…')}
                    />
                    {filteredAnimals.length > 0 && (
                      <div
                        className="rounded-lg max-h-48 overflow-y-auto bg-white"
                        style={{ border: '1px solid rgba(0,0,0,0.1)' }}
                      >
                        {filteredAnimals.map((a) => {
                          const price = a.SalePrice > 0 ? a.SalePrice : a.Price || 0;
                          const hasStud = a.StudFee > 0;
                          return (
                            <div
                              key={a.AnimalID}
                              className="flex items-center justify-between gap-2 px-3 py-2"
                              style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}
                            >
                              <div className="min-w-0">
                                <span className="font-semibold text-sm" style={{ color: INK }}>
                                  {a.FullName}
                                </span>
                                <span className="text-xs ml-2" style={{ color: MUTED }}>
                                  {a.Category || a.SpeciesName}
                                </span>
                                <span className="text-xs ml-2" style={{ color: MUTED }}>
                                  {fmt(price)}
                                </span>
                                {hasStud && (
                                  <span className="text-xs ml-2" style={{ color: STUD }}>
                                    {t('animal_packages.type_stud_fee', 'Stud fee')}: {fmt(a.StudFee)}
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => addAnimal(a, 'sale')}
                                  className="px-2 py-1 text-xs rounded text-white font-semibold"
                                  style={{ background: OLIVE }}
                                >
                                  {t('animal_packages.btn_add_sale', 'Sale')}
                                </button>
                                {hasStud && (
                                  <button
                                    type="button"
                                    onClick={() => addAnimal(a, 'stud')}
                                    className="px-2 py-1 text-xs rounded text-white font-semibold"
                                    style={{ background: STUD }}
                                  >
                                    {t('animal_packages.btn_add_stud', 'Stud')}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {selectedItems.length > 0 && (
                    <div>
                      <label className="block text-sm font-semibold mb-1.5" style={{ color: INK }}>
                        {t('animal_packages.lbl_package_animals', 'In this package')}
                      </label>
                      <div
                        className="rounded-lg bg-white overflow-x-auto"
                        style={{ border: '1px solid rgba(0,0,0,0.1)' }}
                      >
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-xs uppercase" style={{ color: MUTED }}>
                              <th className="px-3 py-2">{t('animal_packages.th_animal', 'Animal')}</th>
                              <th className="px-3 py-2">{t('animal_packages.th_type', 'Type')}</th>
                              <th className="px-3 py-2 text-right">
                                {t('animal_packages.th_value', 'Value')}
                              </th>
                              <th className="px-3 py-2 w-10" />
                            </tr>
                          </thead>
                          <tbody>
                            {selectedItems.map((item) => (
                              <tr key={item.AnimalID} style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                                <td className="px-3 py-2 font-semibold" style={{ color: INK }}>
                                  {item.FullName}
                                </td>
                                <td className="px-3 py-2">
                                  <button
                                    type="button"
                                    onClick={() => item.StudFee > 0 && toggleType(item.AnimalID)}
                                    className="px-2 py-0.5 text-xs rounded font-semibold"
                                    style={{
                                      background: item.IncludeType === 'stud' ? '#e8f0f8' : '#eaf2e6',
                                      color: item.IncludeType === 'stud' ? STUD : OLIVE,
                                      cursor: item.StudFee > 0 ? 'pointer' : 'default',
                                    }}
                                    title={
                                      item.StudFee > 0
                                        ? t('animal_packages.toggle_title', 'Switch between sale and stud')
                                        : ''
                                    }
                                  >
                                    {item.IncludeType === 'stud'
                                      ? t('animal_packages.type_stud_fee', 'Stud fee')
                                      : t('animal_packages.type_sale', 'Sale')}
                                  </button>
                                </td>
                                <td className="px-3 py-2 text-right" style={{ color: INK }}>
                                  {fmt(lineValue(item))}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => removeItem(item.AnimalID)}
                                    className="text-lg leading-none"
                                    style={{ color: RUST }}
                                    aria-label={t('animal_packages.btn_remove', 'Remove')}
                                  >
                                    &times;
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr style={{ borderTop: '2px solid rgba(0,0,0,0.1)', background: '#faf7f1' }}>
                              <td className="px-3 py-2 font-semibold" colSpan={2} style={{ color: INK }}>
                                {t('animal_packages.total_animal_value', 'Individual value')}
                              </td>
                              <td className="px-3 py-2 text-right font-bold" style={{ color: OLIVE }}>
                                {fmt(totalValue)}
                              </td>
                              <td />
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="max-w-lg">
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: INK }}>
                      {t('animal_packages.lbl_package_price', 'Package price')}
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-2.5 text-sm" style={{ color: MUTED }}>
                          $
                        </span>
                        <input
                          type="number"
                          value={packagePrice}
                          onChange={(e) => setPackagePrice(e.target.value)}
                          min={0}
                          step="0.01"
                          className="w-full pl-7 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none"
                          style={{ borderColor: 'rgba(0,0,0,0.15)' }}
                          placeholder="0"
                        />
                      </div>
                      {packagePrice && totalValue > 0 && Number(packagePrice) < totalValue && (
                        <span
                          className="text-sm font-semibold whitespace-nowrap"
                          style={{ color: OLIVE }}
                        >
                          {savingsNote(totalValue - Number(packagePrice), totalValue)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2.5 rounded-lg font-semibold text-sm text-white"
                      style={{ background: OLIVE, opacity: saving ? 0.6 : 1 }}
                    >
                      {saving
                        ? t('animal_packages.btn_saving', 'Saving…')
                        : editingId
                          ? t('animal_packages.btn_update', 'Update package')
                          : t('animal_packages.btn_save', 'Save package')}
                    </button>
                  </div>
                </form>
              )}

              {loading ? (
                <p className="text-sm" style={{ color: MUTED }}>
                  {t('animal_packages.loading', 'Loading…')}
                </p>
              ) : packages.length === 0 && !showForm ? (
                <p className="text-sm" style={{ color: MUTED }}>
                  {t('animal_packages.empty_packages', 'No packages yet.')}
                </p>
              ) : (
                <div className="space-y-4">
                  {packages.map((pkg) => {
                    const itemValue = (pkg.Items || []).reduce(
                      (sum, it) => sum + lineValue(it),
                      0,
                    );
                    const savings = itemValue - (pkg.PackagePrice || 0);
                    return (
                      <div
                        key={pkg.PackageID}
                        className="rounded-xl p-4"
                        style={{ border: '1px solid rgba(0,0,0,0.08)' }}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="min-w-0">
                            <h3 className="text-lg font-bold m-0" style={{ fontFamily: LORA, color: INK }}>
                              {pkg.Title}
                            </h3>
                            {pkg.Description && (
                              <p className="text-sm mt-1 m-0" style={{ color: MUTED }}>
                                {pkg.Description}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xl font-bold m-0" style={{ color: OLIVE }}>
                              {fmt(pkg.PackagePrice)}
                            </p>
                            {savings > 0 && (
                              <p className="text-xs m-0" style={{ color: OLIVE }}>
                                {savingsNote(savings, itemValue)}
                              </p>
                            )}
                          </div>
                        </div>

                        {(pkg.Items || []).length > 0 && (
                          <div className="mt-3">
                            <div className="flex flex-wrap gap-2">
                              {pkg.Items.map((it) => (
                                <span
                                  key={it.AnimalID}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold"
                                  style={{
                                    background: it.IncludeType === 'stud' ? '#e8f0f8' : '#eaf2e6',
                                    color: it.IncludeType === 'stud' ? STUD : OLIVE,
                                  }}
                                >
                                  {it.FullName}
                                  <span style={{ color: MUTED }}>
                                    {it.IncludeType === 'stud'
                                      ? `(${t('animal_packages.type_stud_fee', 'Stud fee')}: ${fmt(it.StudFee)})`
                                      : `(${fmt(it.Price)})`}
                                  </span>
                                </span>
                              ))}
                            </div>
                            <p className="text-xs mt-2 m-0" style={{ color: MUTED }}>
                              {t('animal_packages.individual_value', 'Individual value: {amount}', {
                                amount: fmt(itemValue),
                              })}
                            </p>
                          </div>
                        )}

                        <div className="flex gap-3 mt-3">
                          <button
                            type="button"
                            onClick={() => startEdit(pkg)}
                            className="text-xs font-semibold hover:underline"
                            style={{ color: INK }}
                          >
                            {t('animal_packages.btn_edit', 'Edit')}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(pkg.PackageID)}
                            className="text-xs font-semibold hover:underline"
                            style={{ color: RUST }}
                          >
                            {t('animal_packages.btn_delete', 'Delete')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-6">
                <Link to={animalsHref} className="text-sm font-semibold" style={{ color: OLIVE }}>
                  ← {t('seller_animals.title', 'My Animals')}
                </Link>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
