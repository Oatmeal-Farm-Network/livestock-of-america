// src/pages/seller/AnimalEdit.jsx
// Slim "edit animal basics" form — /seller/animals/edit?BusinessID=&AnimalID=
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router';
import { useTranslation } from '../../lib/i18n';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import Breadcrumbs from '../../components/Breadcrumbs';
import { endpoints } from '../../config/api';
import { getToken } from '../../lib/auth';

const CREAM = '#f7f2e8';
const OLIVE = '#3d6b34';
const INK = '#2c2c2c';
const MUTED = '#6b6b6b';

const inputClass = 'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2';
const inputStyle = { borderColor: 'rgba(0,0,0,0.15)' };
const labelClass = 'block text-sm font-semibold mb-1.5';

function dobToDateString(animal) {
  const y = animal?.DOBYear;
  const m = animal?.DOBMonth;
  const d = animal?.DOBDay;
  if (!y || !m || !d) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${y}-${pad(m)}-${pad(d)}`;
}

export default function AnimalEdit() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const BusinessID = searchParams.get('BusinessID');
  const AnimalID = searchParams.get('AnimalID');

  const [species, setSpecies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [breeds, setBreeds] = useState([]);

  const [animal, setAnimal] = useState(null);
  const [form, setForm] = useState({
    Name: '',
    SpeciesID: '',
    SpeciesCategoryID: '',
    BreedID: '',
    DOB: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!AnimalID) {
      setLoading(false);
      return;
    }
    fetch(endpoints.animalGet(AnimalID))
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setAnimal(data);
        setForm({
          Name: data.FullName || '',
          SpeciesID: data.SpeciesID || '',
          SpeciesCategoryID: data.SpeciesCategoryID || '',
          BreedID: data.BreedID || '',
          DOB: dobToDateString(data),
        });
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [AnimalID]);

  useEffect(() => {
    fetch(endpoints.authSpecies())
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setSpecies(Array.isArray(data) ? data : []))
      .catch(() => setSpecies([]));
  }, []);

  useEffect(() => {
    if (!form.SpeciesID) {
      setCategories([]);
      setBreeds([]);
      return;
    }
    fetch(endpoints.animalCategories(form.SpeciesID))
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
    fetch(endpoints.authBreeds(form.SpeciesID))
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setBreeds(Array.isArray(data) ? data : []))
      .catch(() => setBreeds([]));
  }, [form.SpeciesID]);

  const onChange = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!AnimalID) return;
    if (!form.Name.trim()) {
      setError(t('seller_animal_edit.err_name', 'Please enter a name.'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      const token = getToken();
      const [dobYear, dobMonth, dobDay] = form.DOB ? form.DOB.split('-') : ['', '', ''];
      const fd = new FormData();
      fd.append('Name', form.Name.trim());
      if (form.SpeciesID) fd.append('SpeciesID', form.SpeciesID);
      if (form.SpeciesCategoryID) fd.append('Category', form.SpeciesCategoryID);
      if (form.BreedID) fd.append('BreedID', form.BreedID);
      if (dobDay) fd.append('DOBDay', dobDay);
      if (dobMonth) fd.append('DOBMonth', dobMonth);
      if (dobYear) fd.append('DOBYear', dobYear);

      // Preserve fields the slim UI doesn't expose so this endpoint's full-row
      // UPDATE doesn't null out existing detail data on the animal.
      if (animal) {
        const preserve = [
          ['BreedID2', animal.BreedID2],
          ['BreedID3', animal.BreedID3],
          ['BreedID4', animal.BreedID4],
          ['Height', animal.Height],
          ['Weight', animal.Weight],
          ['Gaited', animal.Gaited],
          ['Warmblood', animal.Warmblooded],
          ['Horns', animal.Horns],
          ['Temperment', animal.Temperment],
          ['Vaccinations', animal.Vaccinations],
          ['AncestryDescription', animal.AncestryDescription],
          ['Color1', animal.Color1],
          ['Color2', animal.Color2],
          ['Color3', animal.Color3],
          ['Color4', animal.Color4],
          ['Color5', animal.Color5],
        ];
        preserve.forEach(([key, value]) => {
          if (value !== null && value !== undefined) fd.append(key, value);
        });
      }

      const res = await fetch(endpoints.animalUpdateBasics(AnimalID), {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      navigate(`/seller/animals?BusinessID=${BusinessID}`);
    } catch {
      setError(t('seller_animal_edit.err_save', 'Could not save changes. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  if (!AnimalID || notFound) {
    return (
      <div className="min-h-screen font-sans flex flex-col" style={{ background: CREAM }}>
        <PageMeta title="Edit Animal" noIndex />
        <Header />
        <main className="grow w-full max-w-[700px] mx-auto px-4 md:px-6 py-10 text-center">
          <p style={{ color: MUTED }}>
            {t('seller_animal_edit.not_found', "This animal couldn't be found.")}
          </p>
          <Link to={`/seller/animals?BusinessID=${BusinessID || ''}`} className="inline-block mt-4 font-semibold" style={{ color: OLIVE }}>
            {t('seller_animals.title', 'My Animals')}
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ background: CREAM }}>
      <PageMeta title="Edit Animal | Livestock of America" noIndex />
      <Header />

      <main className="grow w-full max-w-[700px] mx-auto px-4 md:px-6 py-6 md:py-8">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'Dashboard', to: '/account' },
            { label: t('seller_animals.title', 'My Animals'), to: `/seller/animals?BusinessID=${BusinessID}` },
            { label: t('seller_animal_edit.title', 'Edit Animal') },
          ]}
        />

        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-5 md:p-6">
          <h1
            className="text-2xl font-bold mb-1"
            style={{ fontFamily: "'Lora', 'Times New Roman', serif", color: INK }}
          >
            {t('seller_animal_edit.title', 'Edit Animal')}
          </h1>
          <p className="text-sm mb-5" style={{ color: MUTED }}>
            {t('seller_animal_edit.subtitle', 'Update the basics for this animal.')}
          </p>

          {loading ? (
            <p className="text-sm" style={{ color: MUTED }}>
              {t('seller_animal_edit.loading', 'Loading…')}
            </p>
          ) : (
            <>
              {error && (
                <div
                  className="rounded-lg border px-3 py-2 text-sm mb-4"
                  style={{ borderColor: '#f5c2c0', background: '#fef2f2', color: '#b91c1c' }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className={labelClass} style={{ color: INK }}>
                    {t('seller_animal_edit.lbl_name', 'Name')} *
                  </label>
                  <input
                    type="text"
                    className={inputClass}
                    style={inputStyle}
                    value={form.Name}
                    onChange={(e) => onChange('Name', e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass} style={{ color: INK }}>
                      {t('seller_animal_edit.lbl_species', 'Species')}
                    </label>
                    <select
                      className={inputClass}
                      style={inputStyle}
                      value={form.SpeciesID}
                      onChange={(e) => onChange('SpeciesID', e.target.value)}
                    >
                      <option value="">{t('seller_animal_edit.opt_select', 'Select…')}</option>
                      {species.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.singular || s.plural}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass} style={{ color: INK }}>
                      {t('seller_animal_edit.lbl_category', 'Category')}
                    </label>
                    <select
                      className={inputClass}
                      style={inputStyle}
                      value={form.SpeciesCategoryID}
                      onChange={(e) => onChange('SpeciesCategoryID', e.target.value)}
                      disabled={!form.SpeciesID || categories.length === 0}
                    >
                      <option value="">{t('seller_animal_edit.opt_select', 'Select…')}</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass} style={{ color: INK }}>
                      {t('seller_animal_edit.lbl_breed', 'Breed')}
                    </label>
                    <select
                      className={inputClass}
                      style={inputStyle}
                      value={form.BreedID}
                      onChange={(e) => onChange('BreedID', e.target.value)}
                      disabled={!form.SpeciesID || breeds.length === 0}
                    >
                      <option value="">{t('seller_animal_edit.opt_select', 'Select…')}</option>
                      {breeds.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass} style={{ color: INK }}>
                      {t('seller_animal_edit.lbl_dob', 'Date of Birth')}
                    </label>
                    <input
                      type="date"
                      className={inputClass}
                      style={inputStyle}
                      value={form.DOB}
                      max={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => onChange('DOB', e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center rounded-xl px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60 cursor-pointer hover:opacity-90"
                    style={{ background: OLIVE, border: 'none' }}
                  >
                    {saving ? t('seller_animal_edit.btn_saving', 'Saving…') : t('seller_animal_edit.btn_save', 'Save Changes')}
                  </button>
                  <Link
                    to={`/seller/animals?BusinessID=${BusinessID}`}
                    className="text-sm font-semibold no-underline"
                    style={{ color: MUTED }}
                  >
                    {t('seller_animal_edit.btn_cancel', 'Cancel')}
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
