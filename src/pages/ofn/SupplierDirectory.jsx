// Ported from Oatmeal Farm Network (src/SupplierDirectory.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import Breadcrumbs from '../../components/Breadcrumbs';
import { getPeopleId } from '../../lib/auth';

const API = import.meta.env.VITE_LIVESTOCK_API_URL || '';
const GREEN = '#3D6B34';
const NAV_BG = '#516234';

function authHeaders() {
  const t = localStorage.getItem('access_token') || '';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` };
}

function Stars({ rating }) {
  if (!rating) return <span className="text-xs text-gray-400">No reviews</span>;
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i <= Math.round(rating) ? '#f59e0b' : 'none'} stroke="#f59e0b" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
      <span className="text-xs text-gray-500 ml-1">{Number(rating).toFixed(1)}</span>
    </span>
  );
}

export default function SupplierDirectory() {
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [state, setState] = useState('');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const [reviewForm, setReviewForm] = useState({ reviewer_name: '', rating: 5, comment: '' });
  const [reviewing, setReviewing] = useState(false);
  const [reviewedOk, setReviewedOk] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/suppliers/categories`).then(r => r.json()).then(setCategories);
  }, []);

  const load = () => {
    const p = new URLSearchParams();
    if (category) p.set('category', category);
    if (state) p.set('state', state);
    if (q) p.set('q', q);
    setLoading(true);
    fetch(`${API}/api/suppliers?${p}`).then(r => r.json()).then(d => { setSuppliers(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(load, [category, state]);

  const openDetail = (sup) => {
    fetch(`${API}/api/suppliers/${sup.SupplierID}`).then(r => r.json()).then(setSelected);
  };

  const submitReview = async () => {
    if (!reviewForm.reviewer_name) return;
    setReviewing(true);
    const pid = getPeopleId();
    await fetch(`${API}/api/suppliers/${selected.SupplierID}/reviews`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ ...reviewForm, people_id: pid ? parseInt(pid) : null }),
    });
    setReviewing(false); setReviewedOk(true);
    fetch(`${API}/api/suppliers/${selected.SupplierID}`).then(r => r.json()).then(setSelected);
    setTimeout(() => setReviewedOk(false), 2000);
  };

  return (
    <div style={{ backgroundColor: '#f7f2e8', minHeight: '100vh' }}>
      <PageMeta title="Input & Supplier Directory — Livestock Of America" description="Find seeds, feed, fertilizer, equipment dealers, and other agricultural suppliers." />
      <Header />
      <div style={{ background: 'linear-gradient(90deg,rgba(255,255,255,0.93) 0%,rgba(255,255,255,0) 100%)', borderBottom: '1px solid #e5e7eb' }}>
        <div className="max-w-5xl mx-auto px-6 py-10">
          <Breadcrumbs items={[{ label: 'Input & Supplier Directory' }]} />
          <h1 className="text-3xl font-bold text-gray-900 mt-1" style={{ fontFamily: "'Lora','Times New Roman',serif" }}>Input & Supplier Directory</h1>
          <p className="text-gray-500 text-sm mt-1">Seeds, feed, fertilizer, equipment dealers, consultants, and more.</p>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" value={category} onChange={e => setCategory(e.target.value)} style={{ minWidth: 200 }}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" placeholder="State" value={state} onChange={e => setState(e.target.value)} style={{ width: 120 }} />
          <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white flex-1" style={{ minWidth: 180 }} placeholder="Search suppliers…" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} />
          <button onClick={load} className="px-4 py-2 rounded-lg text-white text-sm font-bold" style={{ backgroundColor: GREEN }}>Search</button>
        </div>

        {loading ? <p className="text-gray-400">Loading…</p> : suppliers.length === 0 ? (
          <div className="text-center py-20 text-gray-400">No suppliers found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {suppliers.map(s => (
              <button key={s.SupplierID} onClick={() => openDetail(s)}
                className="text-left bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-gray-900">{s.CompanyName}</div>
                  {s.IsVerified ? <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded shrink-0">✓ Verified</span> : null}
                </div>
                <div className="text-xs font-semibold text-green-700 mt-0.5">{s.Category}</div>
                <div className="text-xs text-gray-500 mt-1">{s.City}{s.StateProvince ? `, ${s.StateProvince}` : ''}</div>
                <div className="mt-2"><Stars rating={s.AvgRating} /></div>
                {s.Description && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{s.Description}</p>}
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-40 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} onClick={() => setSelected(null)}>
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ backgroundColor: NAV_BG }}>
              <span className="text-white font-bold truncate">{selected.CompanyName}</span>
              <button onClick={() => setSelected(null)} className="text-white shrink-0">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="text-xs font-bold text-green-700 mb-1">{selected.Category}</div>
                <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Lora','Times New Roman',serif" }}>{selected.CompanyName}</h2>
                <div className="text-sm text-gray-500">{selected.City}{selected.StateProvince ? `, ${selected.StateProvince}` : ''}</div>
                <div className="mt-1"><Stars rating={selected.AvgRating} />{selected.ReviewCount > 0 && <span className="text-xs text-gray-400 ml-2">({selected.ReviewCount} reviews)</span>}</div>
              </div>
              {selected.Description && <p className="text-sm text-gray-700">{selected.Description}</p>}
              {selected.ProductsServices && <div><div className="text-xs font-semibold text-gray-500 mb-1">Products & Services</div><p className="text-sm text-gray-700">{selected.ProductsServices}</p></div>}
              <div className="grid grid-cols-2 gap-2 text-sm">
                {selected.Phone && <div><span className="font-semibold text-gray-600">Phone:</span> {selected.Phone}</div>}
                {selected.Email && <div><span className="font-semibold text-gray-600">Email:</span> {selected.Email}</div>}
                {selected.Website && <div className="col-span-2"><a href={selected.Website} target="_blank" rel="noopener noreferrer" className="text-green-700 hover:underline">{selected.Website}</a></div>}
                {selected.ServesRadius && <div><span className="font-semibold text-gray-600">Service Area:</span> {selected.ServesRadius} mi</div>}
              </div>
              <hr className="border-gray-100" />
              <div className="font-semibold text-gray-800">Reviews</div>
              {(selected.reviews || []).map(r => (
                <div key={r.ReviewID} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-800">{r.ReviewerName}</span>
                    <Stars rating={r.Rating} />
                  </div>
                  {r.Comment && <p className="text-sm text-gray-600">{r.Comment}</p>}
                </div>
              ))}
              <div className="border border-gray-200 rounded-xl p-4 space-y-2">
                <div className="font-semibold text-gray-700 text-sm">Leave a Review</div>
                {reviewedOk ? <div className="text-green-700 text-sm font-bold text-center py-2">Review submitted!</div> : (
                  <>
                    <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Your name *" value={reviewForm.reviewer_name} onChange={e => setReviewForm(f => ({ ...f, reviewer_name: e.target.value }))} />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 font-semibold">Rating:</span>
                      {[1,2,3,4,5].map(i => (
                        <button key={i} onClick={() => setReviewForm(f => ({ ...f, rating: i }))}
                          className="text-xl leading-none" style={{ color: i <= reviewForm.rating ? '#f59e0b' : '#d1d5db' }}>★</button>
                      ))}
                    </div>
                    <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" rows={2} placeholder="Your experience…" value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))} />
                    <button onClick={submitReview} disabled={reviewing || !reviewForm.reviewer_name}
                      className="w-full py-2 rounded-lg text-white text-sm font-bold disabled:opacity-40"
                      style={{ backgroundColor: GREEN }}>{reviewing ? 'Submitting…' : 'Submit Review'}</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
