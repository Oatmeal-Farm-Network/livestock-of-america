import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import { getToken } from '../../lib/auth';
import { endpoints } from '../../config/api';

const CREAM = '#f7f2e8';
const OLIVE = '#3d6b34';
const INK = '#2c2c2c';
const LORA = "'Lora', 'Times New Roman', serif";

export default function AnimalAdd() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const BusinessID = searchParams.get('BusinessID');
  const [species, setSpecies] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    Name: '',
    SpeciesID: '',
    BreedID: '',
    DOBMonth: '',
    DOBDay: '',
    DOBYear: '',
    ForSale: true,
    Price: '',
  });

  useEffect(() => {
    fetch(endpoints.authSpecies(), {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setSpecies(Array.isArray(data) ? data : []))
      .catch(() => setSpecies([]));
  }, []);

  useEffect(() => {
    if (!form.SpeciesID) {
      setBreeds([]);
      return;
    }
    fetch(endpoints.authBreeds(form.SpeciesID), {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setBreeds(Array.isArray(data) ? data : []))
      .catch(() => setBreeds([]));
  }, [form.SpeciesID]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!BusinessID) {
      setError('Missing BusinessID.');
      return;
    }
    if (!form.Name.trim() || !form.SpeciesID) {
      setError('Name and species are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const body = new FormData();
      body.append('BusinessID', BusinessID);
      body.append('Name', form.Name.trim());
      body.append('SpeciesID', form.SpeciesID);
      if (form.BreedID) body.append('BreedID', form.BreedID);
      if (form.DOBMonth) body.append('DOBMonth', form.DOBMonth);
      if (form.DOBDay) body.append('DOBDay', form.DOBDay);
      if (form.DOBYear) body.append('DOBYear', form.DOBYear);
      body.append('ForSale', form.ForSale ? 'Yes' : 'No');
      if (form.Price) body.append('Price', form.Price);

      const res = await fetch(endpoints.authAnimalsAdd(), {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      navigate(`/seller/animals?BusinessID=${BusinessID}`);
    } catch (err) {
      setError(err.message || 'Failed to add animal.');
    } finally {
      setSaving(false);
    }
  };

  const field = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #ddd8cc',
    fontSize: 14,
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: CREAM }}>
      <PageMeta title="Add Animal | Livestock of America" noIndex />
      <Header />
      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-8">
        <p className="text-sm">
          <Link to={`/seller/animals?BusinessID=${BusinessID}`} style={{ color: OLIVE }}>
            ← My Animals
          </Link>
        </p>
        <h1 className="text-2xl font-bold mt-2" style={{ fontFamily: LORA, color: INK }}>
          Add Animal
        </h1>
        <form
          onSubmit={onSubmit}
          className="mt-6 bg-white rounded-2xl border p-6 space-y-4 shadow-sm"
          style={{ borderColor: '#e5e0d6' }}
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
              {error}
            </div>
          )}
          <label className="block text-sm font-semibold" style={{ color: INK }}>
            Name *
            <input
              style={field}
              className="mt-1"
              value={form.Name}
              onChange={(e) => set('Name', e.target.value)}
              required
            />
          </label>
          <label className="block text-sm font-semibold" style={{ color: INK }}>
            Species *
            <select
              style={field}
              className="mt-1"
              value={form.SpeciesID}
              onChange={(e) => set('SpeciesID', e.target.value)}
              required
            >
              <option value="">Select species</option>
              {species.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.plural || s.singular}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold" style={{ color: INK }}>
            Breed
            <select
              style={field}
              className="mt-1"
              value={form.BreedID}
              onChange={(e) => set('BreedID', e.target.value)}
              disabled={!breeds.length}
            >
              <option value="">Select breed</option>
              {breeds.map((b) => (
                <option key={b.BreedLookupID || b.id} value={b.BreedLookupID || b.id}>
                  {b.Breed || b.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              ['DOBMonth', 'Month'],
              ['DOBDay', 'Day'],
              ['DOBYear', 'Year'],
            ].map(([key, label]) => (
              <label key={key} className="block text-sm font-semibold" style={{ color: INK }}>
                {label}
                <input
                  style={field}
                  className="mt-1"
                  inputMode="numeric"
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                />
              </label>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: INK }}>
            <input
              type="checkbox"
              checked={form.ForSale}
              onChange={(e) => set('ForSale', e.target.checked)}
            />
            List for sale
          </label>
          {form.ForSale && (
            <label className="block text-sm font-semibold" style={{ color: INK }}>
              Price (USD)
              <input
                style={field}
                className="mt-1"
                inputMode="decimal"
                value={form.Price}
                onChange={(e) => set('Price', e.target.value)}
              />
            </label>
          )}
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg py-3 text-sm font-semibold text-white border-0 cursor-pointer"
            style={{ backgroundColor: OLIVE, opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Saving…' : 'Add Animal'}
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
