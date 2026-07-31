import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from '../../lib/i18n';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import { useAccount } from '../../lib/AccountContext';
import { getToken } from '../../lib/auth';
import { endpoints } from '../../config/api';

const CREAM = '#f7f2e8';
const OLIVE = '#3d6b34';
const INK = '#2c2c2c';
const LORA = "'Lora', 'Times New Roman', serif";

export default function AnimalsHome() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const BusinessID = searchParams.get('BusinessID');
  const { Business, LoadBusiness } = useAccount();
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [publishing, setPublishing] = useState({});
  const [collapsed, setCollapsed] = useState({});

  useEffect(() => {
    if (!BusinessID) return;
    LoadBusiness(BusinessID);
    const token = getToken();
    setLoading(true);
    fetch(endpoints.authAnimals(BusinessID), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setAnimals(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [BusinessID]);

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const togglePublish = async (animal) => {
    const next = !animal.PublishForSale;
    setPublishing((p) => ({ ...p, [animal.AnimalID]: true }));
    setAnimals((list) =>
      list.map((a) =>
        a.AnimalID === animal.AnimalID ? { ...a, PublishForSale: next ? 1 : 0 } : a,
      ),
    );
    try {
      const res = await fetch(endpoints.animalPublish(animal.AnimalID), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ publish: next }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      setAnimals((list) =>
        list.map((a) =>
          a.AnimalID === animal.AnimalID ? { ...a, PublishForSale: next ? 0 : 1 } : a,
        ),
      );
      alert(t('animals_home.err_publish', 'Could not update publish status.'));
    } finally {
      setPublishing((p) => {
        const n = { ...p };
        delete n[animal.AnimalID];
        return n;
      });
    }
  };

  const togglePublishStud = async (animal) => {
    const next = !animal.PublishStud;
    const key = `stud_${animal.AnimalID}`;
    setPublishing((p) => ({ ...p, [key]: true }));
    setAnimals((list) =>
      list.map((a) =>
        a.AnimalID === animal.AnimalID ? { ...a, PublishStud: next ? 1 : 0 } : a,
      ),
    );
    try {
      const res = await fetch(endpoints.animalPublishStud(animal.AnimalID), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ publish: next }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      setAnimals((list) =>
        list.map((a) =>
          a.AnimalID === animal.AnimalID ? { ...a, PublishStud: next ? 0 : 1 } : a,
        ),
      );
      alert(t('animals_home.err_stud_publish', 'Could not update stud status.'));
    } finally {
      setPublishing((p) => {
        const n = { ...p };
        delete n[key];
        return n;
      });
    }
  };

  const filtered = search.trim()
    ? animals.filter(
        (a) =>
          (a.FullName || '').toLowerCase().includes(search.toLowerCase()) ||
          (a.SpeciesName || '').toLowerCase().includes(search.toLowerCase()) ||
          (a.Category || '').toLowerCase().includes(search.toLowerCase()),
      )
    : animals;

  const grouped = useMemo(() => {
    const map = new Map();
    for (const a of filtered) {
      const key = a.SpeciesName || t('animals_home.unknown_species', 'Unknown species');
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(a);
    }
    return [...map.entries()];
  }, [filtered, t]);

  if (!BusinessID) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: CREAM }}>
        <Header />
        <main className="flex-1 max-w-3xl mx-auto px-4 py-16">
          <p style={{ color: INK }}>Select a business from your dashboard to manage animals.</p>
          <Link to="/account" style={{ color: OLIVE }}>Go to dashboard →</Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: CREAM }}>
      <PageMeta title="My Animals | Livestock of America" noIndex />
      <Header />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <p className="text-sm m-0" style={{ color: '#6b6b6b' }}>
              <Link to="/account" style={{ color: OLIVE }}>Dashboard</Link>
              {' › '}
              My Animals
            </p>
            <h1 className="text-2xl md:text-3xl font-bold m-0 mt-1" style={{ fontFamily: LORA, color: INK }}>
              {Business?.BusinessName || 'My Animals'}
            </h1>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link
              to={`/herd-health?BusinessID=${BusinessID}`}
              className="rounded-lg px-4 py-2 text-sm font-semibold no-underline border"
              style={{ color: OLIVE, borderColor: OLIVE }}
            >
              Herd Health
            </Link>
            <Link
              to={`/seller/animals/add?BusinessID=${BusinessID}`}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white no-underline"
              style={{ backgroundColor: OLIVE }}
            >
              Add Animal
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: '#e5e0d6' }}>
          {loading ? (
            <p style={{ color: '#6b6b6b' }}>Loading animals…</p>
          ) : error ? (
            <p className="text-red-600">Unable to load animals. Please try again.</p>
          ) : (
            <>
              {animals.length > 0 && (
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, species, or category…"
                  className="w-full md:w-80 px-3 py-2 border rounded-lg text-sm mb-4"
                  style={{ borderColor: '#ddd8cc' }}
                />
              )}

              {animals.length === 0 ? (
                <p style={{ color: '#6b6b6b' }}>
                  No animals yet.{' '}
                  <Link to={`/seller/animals/add?BusinessID=${BusinessID}`} style={{ color: OLIVE }}>
                    Add your first animal
                  </Link>
                </p>
              ) : filtered.length === 0 ? (
                <p style={{ color: '#6b6b6b' }}>No animals match “{search}”.</p>
              ) : (
                grouped.map(([species, list]) => (
                  <div key={species} className="mb-6">
                    <button
                      type="button"
                      onClick={() => setCollapsed((c) => ({ ...c, [species]: !c[species] }))}
                      className="flex items-center gap-2 w-full text-left mb-2 bg-transparent border-0 cursor-pointer"
                    >
                      <span className="text-xs text-gray-400">
                        {collapsed[species] ? '▸' : '▾'}
                      </span>
                      <h2 className="text-lg font-semibold m-0" style={{ color: '#5a3e2b', fontFamily: LORA }}>
                        {species}
                      </h2>
                      <span className="text-sm text-gray-400">({list.length})</span>
                    </button>
                    {!collapsed[species] && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b-2 border-gray-200">
                              <th className="text-left py-3 px-2">Listing</th>
                              <th className="text-left py-3 px-2 hidden md:table-cell">Category</th>
                              <th className="text-right py-3 px-2">Price</th>
                              <th className="text-center py-3 px-2">Options</th>
                            </tr>
                          </thead>
                          <tbody>
                            {list.map((animal) => (
                              <tr key={animal.AnimalID} className="border-b border-gray-100">
                                <td className="py-3 px-2">
                                  <button
                                    type="button"
                                    className="bg-transparent border-0 underline cursor-pointer p-0"
                                    style={{ color: '#5a3e2b' }}
                                    onClick={() =>
                                      navigate(
                                        `/seller/animals/edit?BusinessID=${BusinessID}&AnimalID=${animal.AnimalID}`,
                                      )
                                    }
                                  >
                                    {animal.FullName || 'Unnamed'}
                                  </button>
                                </td>
                                <td className="py-3 px-2 hidden md:table-cell text-gray-600">
                                  {animal.Category || '—'}
                                </td>
                                <td className="py-3 px-2 text-right text-gray-600">
                                  {formatCurrency(animal.Price) || '—'}
                                </td>
                                <td className="py-3 px-2">
                                  <div className="flex justify-center gap-2 flex-wrap">
                                    <button
                                      type="button"
                                      disabled={!!publishing[animal.AnimalID]}
                                      onClick={() => togglePublish(animal)}
                                      className="text-xs font-semibold px-3 py-1 rounded-full border cursor-pointer"
                                      style={{
                                        backgroundColor: animal.PublishForSale ? '#dcfce7' : '#f3f4f6',
                                        color: animal.PublishForSale ? '#15803d' : '#4b5563',
                                        borderColor: animal.PublishForSale ? '#bbf7d0' : '#e5e7eb',
                                      }}
                                    >
                                      {animal.PublishForSale ? 'For sale ✓' : 'Publish sale'}
                                    </button>
                                    <button
                                      type="button"
                                      disabled={!!publishing[`stud_${animal.AnimalID}`]}
                                      onClick={() => togglePublishStud(animal)}
                                      className="text-xs font-semibold px-3 py-1 rounded-full border cursor-pointer"
                                      style={{
                                        backgroundColor: animal.PublishStud ? '#dbeafe' : '#f3f4f6',
                                        color: animal.PublishStud ? '#1d4ed8' : '#4b5563',
                                        borderColor: animal.PublishStud ? '#bfdbfe' : '#e5e7eb',
                                      }}
                                    >
                                      {animal.PublishStud ? 'Stud ✓' : 'Publish stud'}
                                    </button>
                                    <button
                                      type="button"
                                      className="text-xs underline bg-transparent border-0 cursor-pointer"
                                      style={{ color: '#5a3e2b' }}
                                      onClick={() =>
                                        navigate(
                                          `/seller/animals/edit?BusinessID=${BusinessID}&AnimalID=${animal.AnimalID}`,
                                        )
                                      }
                                    >
                                      Edit
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
