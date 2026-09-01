import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from '../../lib/i18n';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import SaveButton from '../../components/SaveButton';
import ListingPhoto from '../../components/ListingPhoto';
import { useAccount } from '../../lib/AccountContext';
import { getToken, isLoggedIn } from '../../lib/auth';
import { useSavedItems } from '../../lib/savedItems';
import { endpoints } from '../../config/api';

const CREAM = '#f7f2e8';
const OLIVE = '#3d6b34';
const INK = '#2c2c2c';
const MUTED = '#6b6b6b';
const LORA = "'Lora', 'Times New Roman', serif";

function SavedAnimalCard({ item }) {
  const animal = item.animal;
  if (!animal) {
    return (
      <div className="rounded-xl border bg-white p-4 text-sm" style={{ borderColor: '#e5e0d6', color: MUTED }}>
        Saved {item.item_type} #{item.animal_id} is no longer available.
        <div className="mt-2">
          <SaveButton itemType={item.item_type} itemId={item.animal_id} size={18} />
        </div>
      </div>
    );
  }
  const price =
    item.item_type === 'stud'
      ? animal.stud_fee
      : animal.price;
  const priceLabel =
    item.item_type === 'stud'
      ? (price ? `Stud fee $${Math.round(price).toLocaleString()}` : 'Stud · Call for fee')
      : (price ? `$${Math.round(price).toLocaleString()}` : 'Call for price');
  const detailUrl = `/marketplaces/livestock/animal/${animal.animal_id}`;

  return (
    <article className="flex gap-3 rounded-xl border bg-white overflow-hidden" style={{ borderColor: '#e5e0d6' }}>
      <Link to={detailUrl} className="shrink-0 block bg-[#efe9df] overflow-hidden" style={{ width: 110, height: 110 }}>
        <ListingPhoto
          src={animal.photo}
          alt={animal.full_name}
          imgClassName="w-full h-full object-cover"
        />
      </Link>
      <div className="flex-1 min-w-0 py-3 pr-3 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="m-0 text-[10px] font-bold uppercase tracking-wide" style={{ color: OLIVE }}>
              {item.item_type === 'stud' ? 'Saved stud' : 'Saved listing'}
            </p>
            <Link
              to={detailUrl}
              className="font-bold text-sm no-underline line-clamp-2"
              style={{ color: INK, fontFamily: LORA }}
            >
              {animal.full_name}
            </Link>
            <p className="m-0 mt-0.5 text-xs truncate" style={{ color: MUTED }}>
              {[animal.breeds?.join(' · '), animal.seller, animal.location].filter(Boolean).join(' · ')}
            </p>
            <p className="m-0 mt-1 text-xs font-semibold" style={{ color: OLIVE }}>{priceLabel}</p>
          </div>
          <SaveButton itemType={item.item_type} itemId={animal.animal_id} size={18} />
        </div>
        <Link to={detailUrl} className="mt-auto text-xs font-bold no-underline" style={{ color: OLIVE }}>
          View details →
        </Link>
      </div>
    </article>
  );
}

function SavedRanchCard({ item }) {
  const ranch = item.ranch;
  if (!ranch) {
    return (
      <div className="rounded-xl border bg-white p-4 text-sm" style={{ borderColor: '#e5e0d6', color: MUTED }}>
        Saved ranch #{item.business_id} is no longer available.
        <div className="mt-2">
          <SaveButton itemType="ranch" itemId={item.business_id} size={18} />
        </div>
      </div>
    );
  }
  const profileUrl = `/marketplaces/livestock/ranch/${ranch.business_id}`;
  const location = [ranch.city, ranch.state, ranch.country].filter(Boolean).join(', ');

  return (
    <article className="flex gap-3 rounded-xl border bg-white overflow-hidden" style={{ borderColor: '#e5e0d6' }}>
      <Link
        to={profileUrl}
        className="shrink-0 flex items-center justify-center bg-[#efe9df] p-2"
        style={{ width: 110, height: 110 }}
      >
        {ranch.logo ? (
          <img src={ranch.logo} alt={ranch.business_name} className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs text-center px-2" style={{ color: MUTED }}>No logo</span>
        )}
      </Link>
      <div className="flex-1 min-w-0 py-3 pr-3 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="m-0 text-[10px] font-bold uppercase tracking-wide" style={{ color: OLIVE }}>
              Saved ranch
            </p>
            <Link
              to={profileUrl}
              className="font-bold text-sm no-underline line-clamp-2"
              style={{ color: INK, fontFamily: LORA }}
            >
              {ranch.business_name}
            </Link>
            {location && (
              <p className="m-0 mt-0.5 text-xs" style={{ color: MUTED }}>{location}</p>
            )}
          </div>
          <SaveButton itemType="ranch" itemId={ranch.business_id} size={18} />
        </div>
        <Link to={profileUrl} className="mt-auto text-xs font-bold no-underline" style={{ color: OLIVE }}>
          View ranch →
        </Link>
      </div>
    </article>
  );
}

export default function AnimalsHome() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  // A URL can carry the literal strings "null" or "undefined" when a link was
  // built from an unset value. Those are not ids, and passing one to the API
  // returns an error that reads as "your animals failed to load" rather than
  // "no business selected" — so normalise them away before anything uses it.
  const rawBusinessID = searchParams.get('BusinessID');
  const BusinessID =
    rawBusinessID && rawBusinessID !== 'null' && rawBusinessID !== 'undefined' && /^\d+$/.test(rawBusinessID)
      ? rawBusinessID
      : null;
  const tabParam = searchParams.get('tab');
  const { Business, LoadBusiness, businesses } = useAccount();
  const { refresh: refreshSavedIds, isSaved } = useSavedItems();

  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [publishing, setPublishing] = useState({});
  const [collapsed, setCollapsed] = useState({});

  const [savedItems, setSavedItems] = useState([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [savedFilter, setSavedFilter] = useState('all'); // all | animal | stud | ranch

  const defaultTab = BusinessID ? 'herd' : 'saved';
  const tab = tabParam === 'herd' || tabParam === 'saved' ? tabParam : defaultTab;

  const setTab = (next) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', next);
    setSearchParams(params, { replace: true });
  };

  // Landing here without a usable id is normal (a stale link, or the sidebar
  // before the account finished loading). Adopt the member's own business and
  // correct the URL instead of showing an error.
  useEffect(() => {
    if (BusinessID || !businesses?.length) return;
    const first = businesses[0].BusinessID ?? businesses[0].businessId ?? businesses[0].id;
    if (first == null) return;
    const params = new URLSearchParams(searchParams);
    params.set('BusinessID', String(first));
    setSearchParams(params, { replace: true });
  }, [BusinessID, businesses, searchParams, setSearchParams]);

  useEffect(() => {
    if (!BusinessID) {
      setLoading(false);
      return;
    }
    LoadBusiness(BusinessID);
    const token = getToken();
    setError(false);
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

  const loadSaved = () => {
    if (!isLoggedIn()) {
      setSavedItems([]);
      setSavedLoading(false);
      return;
    }
    setSavedLoading(true);
    fetch(endpoints.marketplaceSaved(), {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setSavedItems(Array.isArray(data.items) ? data.items : []);
        setSavedLoading(false);
        refreshSavedIds();
      })
      .catch(() => {
        setSavedItems([]);
        setSavedLoading(false);
      });
  };

  useEffect(() => {
    loadSaved();
  }, []);

  // Reload saved list when returning to the saved tab (e.g. after toggling elsewhere)
  useEffect(() => {
    if (tab === 'saved') loadSaved();
  }, [tab]);

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
      if (!res.ok) {
        // 402 carries the plan-limit explanation; show it verbatim so the member
        // knows which allowance they hit and what to do about it.
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `HTTP ${res.status}`);
      }
    } catch (e) {
      setAnimals((list) =>
        list.map((a) =>
          a.AnimalID === animal.AnimalID ? { ...a, PublishForSale: next ? 0 : 1 } : a,
        ),
      );
      alert(e?.message || t('animals_home.err_publish', 'Could not update publish status.'));
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
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `HTTP ${res.status}`);
      }
    } catch (e) {
      setAnimals((list) =>
        list.map((a) =>
          a.AnimalID === animal.AnimalID ? { ...a, PublishStud: next ? 0 : 1 } : a,
        ),
      );
      alert(e?.message || t('animals_home.err_stud_publish', 'Could not update stud status.'));
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

  const visibleSaved = useMemo(() => {
    const stillSaved = savedItems.filter((i) => {
      if (i.item_type === 'ranch') return isSaved('ranch', i.business_id);
      return isSaved(i.item_type, i.animal_id);
    });
    if (savedFilter === 'all') return stillSaved;
    return stillSaved.filter((i) => i.item_type === savedFilter);
  }, [savedItems, savedFilter, isSaved]);

  const firstBizId = businesses?.[0]
    ? (businesses[0].BusinessID ?? businesses[0].businessId ?? businesses[0].id)
    : null;
  const herdBizId = BusinessID || firstBizId;

  const tabBtn = (id, label) => {
    const active = tab === id;
    return (
      <button
        type="button"
        onClick={() => setTab(id)}
        className="rounded-full px-4 py-1.5 text-xs font-semibold border cursor-pointer"
        style={{
          backgroundColor: active ? OLIVE : '#fff',
          color: active ? '#fff' : INK,
          borderColor: active ? OLIVE : '#e0d8cc',
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: CREAM }}>
      <PageMeta title="My Animals | Livestock of America" noIndex />
      <Header />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <p className="text-sm m-0" style={{ color: MUTED }}>
              <Link to="/account" style={{ color: OLIVE }}>Dashboard</Link>
              {' › '}
              My Animals
            </p>
            <h1 className="text-2xl md:text-3xl font-bold m-0 mt-1" style={{ fontFamily: LORA, color: INK }}>
              My Animals
            </h1>
            <p className="m-0 mt-1 text-sm" style={{ color: MUTED }}>
              Manage your herd listings and saved marketplace animals, studs, and ranches.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {herdBizId && (
              <>
                <Link
                  to={`/herd-health?BusinessID=${herdBizId}`}
                  className="rounded-lg px-4 py-2 text-sm font-semibold no-underline border"
                  style={{ color: OLIVE, borderColor: OLIVE }}
                >
                  Herd Health
                </Link>
                <Link
                  to={`/seller/animals/add?BusinessID=${herdBizId}`}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white no-underline"
                  style={{ backgroundColor: OLIVE }}
                >
                  Add Animal
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {tabBtn('saved', `Saved (${savedItems.length})`)}
          {tabBtn('herd', 'My herd')}
        </div>

        {tab === 'saved' && (
          <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: '#e5e0d6' }}>
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { id: 'all', label: 'All' },
                { id: 'animal', label: 'For sale' },
                { id: 'stud', label: 'Studs' },
                { id: 'ranch', label: 'Ranches' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSavedFilter(f.id)}
                  className="rounded-full px-3 py-1 text-xs font-semibold border cursor-pointer"
                  style={{
                    backgroundColor: savedFilter === f.id ? '#eef3e7' : '#fff',
                    color: savedFilter === f.id ? OLIVE : INK,
                    borderColor: savedFilter === f.id ? OLIVE : '#e0d8cc',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {savedLoading ? (
              <p style={{ color: MUTED }}>Loading saved items…</p>
            ) : visibleSaved.length === 0 ? (
              <div className="py-8 text-center">
                <p className="m-0 mb-3" style={{ color: MUTED }}>
                  Nothing saved yet. Browse the marketplace and tap the bookmark icon on listings, studs, or ranches.
                </p>
                <Link
                  to="/animals"
                  className="inline-flex rounded-lg px-4 py-2.5 text-sm font-semibold no-underline text-white"
                  style={{ backgroundColor: OLIVE }}
                >
                  Open marketplace
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {visibleSaved.map((item) =>
                  item.item_type === 'ranch' ? (
                    <SavedRanchCard key={`ranch-${item.saved_id}`} item={item} />
                  ) : (
                    <SavedAnimalCard key={`${item.item_type}-${item.saved_id}`} item={item} />
                  ),
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'herd' && (
          <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: '#e5e0d6' }}>
            {!BusinessID ? (
              <div className="py-6">
                <p className="m-0 mb-3" style={{ color: MUTED }}>
                  Select a business to manage your own herd listings.
                </p>
                {firstBizId ? (
                  <button
                    type="button"
                    className="rounded-lg px-4 py-2 text-sm font-semibold text-white border-0 cursor-pointer"
                    style={{ backgroundColor: OLIVE }}
                    onClick={() => {
                      const params = new URLSearchParams(searchParams);
                      params.set('BusinessID', String(firstBizId));
                      params.set('tab', 'herd');
                      setSearchParams(params);
                    }}
                  >
                    Open {businesses[0]?.BusinessName || 'my ranch'}
                  </button>
                ) : (
                  <Link to="/account" style={{ color: OLIVE }}>Go to dashboard →</Link>
                )}
              </div>
            ) : loading ? (
              <p style={{ color: MUTED }}>Loading animals…</p>
            ) : error ? (
              <p className="text-red-600">Unable to load animals. Please try again.</p>
            ) : (
              <>
                <p className="m-0 mb-4 text-sm font-semibold" style={{ color: INK, fontFamily: LORA }}>
                  {Business?.BusinessName || 'My herd'}
                </p>
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
                  <p style={{ color: MUTED }}>
                    No animals yet.{' '}
                    <Link to={`/seller/animals/add?BusinessID=${BusinessID}`} style={{ color: OLIVE }}>
                      Add your first animal
                    </Link>
                  </p>
                ) : filtered.length === 0 ? (
                  <p style={{ color: MUTED }}>No animals match “{search}”.</p>
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
        )}
      </main>
      <Footer />
    </div>
  );
}
