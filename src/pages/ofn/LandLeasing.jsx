// Ported from Oatmeal Farm Network (src/LandLeasing.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import Breadcrumbs from '../../components/Breadcrumbs';
import { useAccount } from '../../lib/AccountContext';

const API = import.meta.env.VITE_LIVESTOCK_API_URL || '';
const GREEN = '#3D6B34';
const NAV_BG = '#516234';

function authHeaders() {
  const t = localStorage.getItem('access_token') || '';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` };
}

const TYPES = ['lease', 'cash-rent', 'for-sale', 'trade'];

function typeBadge(lt) {
  const colors = {
    'lease': 'bg-blue-100 text-blue-700',
    'cash-rent': 'bg-orange-100 text-orange-700',
    'for-sale': 'bg-green-100 text-green-700',
    'trade': 'bg-purple-100 text-purple-700',
  };
  const labels = { 'lease': 'Lease', 'cash-rent': 'Cash Rent', 'for-sale': 'For Sale', 'trade': 'Trade' };
  return <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${colors[lt] || 'bg-gray-100 text-gray-600'}`}>{labels[lt] || lt}</span>;
}

export default function LandLeasing() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listingType, setListingType] = useState('');
  const [state, setState] = useState('');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inqForm, setInqForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [inquiring, setInquiring] = useState(false);
  const [inquiredOk, setInquiredOk] = useState(false);

  const load = () => {
    const p = new URLSearchParams();
    if (listingType) p.set('listing_type', listingType);
    if (state) p.set('state', state);
    if (q) p.set('q', q);
    setLoading(true);
    fetch(`${API}/api/land?${p}`).then(r => r.json()).then(d => { setListings(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(load, [listingType, state]);

  const inquire = async () => {
    if (!inqForm.name || !inqForm.email) return;
    setInquiring(true);
    const r = await fetch(`${API}/api/land/${selected.ListingID}/inquire`, {
      method: 'POST', headers: authHeaders(), body: JSON.stringify(inqForm),
    });
    setInquiring(false);
    if (r.ok) { setInquiredOk(true); setTimeout(() => { setInquiryOpen(false); setInquiredOk(false); }, 2000); }
  };

  return (
    <div style={{ backgroundColor: '#f7f2e8', minHeight: '100vh' }}>
      <PageMeta title="Land Leasing — Oatmeal Farm Network" description="Find farmland available for lease, cash rent, and purchase." />
      <Header />
      <div style={{ background: 'linear-gradient(90deg,rgba(255,255,255,0.93) 0%,rgba(255,255,255,0) 100%)', borderBottom: '1px solid #e5e7eb' }}>
        <div className="max-w-5xl mx-auto px-6 py-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Breadcrumbs items={[{ label: 'Land Leasing' }]} />
            <h1 className="text-3xl font-bold text-gray-900 mt-1" style={{ fontFamily: "'Lora','Times New Roman',serif" }}>Land Leasing & For Sale</h1>
            <p className="text-gray-500 text-sm mt-1">Farmland available to lease, cash rent, or purchase.</p>
          </div>
          <a href="/land/my-listings" className="px-4 py-2 rounded-lg text-white font-bold text-sm" style={{ backgroundColor: NAV_BG }}>
            List My Land
          </a>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex gap-2 flex-wrap">
            {['', ...TYPES].map(lt => (
              <button key={lt} onClick={() => setListingType(lt)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition ${listingType === lt ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
                style={listingType === lt ? { backgroundColor: GREEN } : {}}>
                {lt || 'All'}
              </button>
            ))}
          </div>
          <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" placeholder="State" value={state} onChange={e => setState(e.target.value)} style={{ width: 120 }} />
          <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white flex-1" style={{ minWidth: 180 }} placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} />
          <button onClick={load} className="px-4 py-2 rounded-lg text-white text-sm font-bold" style={{ backgroundColor: GREEN }}>Search</button>
        </div>

        {loading ? <p className="text-gray-400">Loading…</p> : listings.length === 0 ? (
          <div className="text-center py-20 text-gray-400">No listings found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {listings.map(l => (
              <button key={l.ListingID} onClick={() => { setSelected(l); setInquiryOpen(false); }}
                className="text-left bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="font-bold text-gray-900 text-sm leading-snug">{l.Title}</div>
                  {typeBadge(l.ListingType)}
                </div>
                <div className="text-sm text-gray-500">{l.City}{l.StateProvince ? `, ${l.StateProvince}` : ''}</div>
                <div className="flex flex-wrap gap-3 mt-3 text-sm">
                  {l.Acreage && <span className="font-semibold text-gray-700">{l.Acreage} acres</span>}
                  {l.PricePerAcre && <span className="text-gray-600">${l.PricePerAcre}/acre</span>}
                  {l.TotalPrice && !l.PricePerAcre && <span className="text-gray-600">${l.TotalPrice.toLocaleString()}</span>}
                  {l.Irrigation ? <span className="text-blue-600 text-xs">Irrigated</span> : null}
                </div>
                {l.LeaseTerm && <div className="text-xs text-gray-400 mt-1">{l.LeaseTerm}</div>}
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-40 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} onClick={() => setSelected(null)}>
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ backgroundColor: NAV_BG }}>
              <span className="text-white font-bold">{selected.BusinessName}</span>
              <button onClick={() => setSelected(null)} className="text-white">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">{typeBadge(selected.ListingType)}</div>
                <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Lora','Times New Roman',serif" }}>{selected.Title}</h2>
                <div className="text-sm text-gray-500">{selected.City}{selected.StateProvince ? `, ${selected.StateProvince}` : ''}</div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {selected.Acreage && <div><span className="font-semibold text-gray-600">Total Acres:</span> {selected.Acreage}</div>}
                {selected.Tillable && <div><span className="font-semibold text-gray-600">Tillable:</span> {selected.Tillable} ac</div>}
                {selected.PricePerAcre && <div><span className="font-semibold text-gray-600">$/Acre:</span> ${selected.PricePerAcre}</div>}
                {selected.TotalPrice && <div><span className="font-semibold text-gray-600">Total Price:</span> ${Number(selected.TotalPrice).toLocaleString()}</div>}
                {selected.SoilType && <div className="col-span-2"><span className="font-semibold text-gray-600">Soil Type:</span> {selected.SoilType}</div>}
                <div><span className="font-semibold text-gray-600">Irrigation:</span> {selected.Irrigation ? 'Yes' : 'No'}</div>
                {selected.LeaseTerm && <div className="col-span-2"><span className="font-semibold text-gray-600">Term:</span> {selected.LeaseTerm}</div>}
                {selected.AvailableDate && <div className="col-span-2"><span className="font-semibold text-gray-600">Available:</span> {selected.AvailableDate?.split('T')[0]}</div>}
              </div>
              {selected.Infrastructure && <div><div className="text-xs font-semibold text-gray-500 mb-1">Infrastructure</div><p className="text-sm text-gray-700">{selected.Infrastructure}</p></div>}
              {selected.Description && <p className="text-sm text-gray-700 whitespace-pre-wrap">{selected.Description}</p>}

              {!inquiryOpen ? (
                <button onClick={() => setInquiryOpen(true)} className="w-full py-3 rounded-xl text-white font-bold" style={{ backgroundColor: GREEN }}>Send Inquiry</button>
              ) : (
                <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="font-semibold text-gray-800">Contact Owner</div>
                  {inquiredOk ? <div className="text-center text-green-700 font-bold py-4">Inquiry sent!</div> : (
                    <>
                      <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Your name *" value={inqForm.name} onChange={e => setInqForm(f => ({ ...f, name: e.target.value }))} />
                      <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Email *" value={inqForm.email} onChange={e => setInqForm(f => ({ ...f, email: e.target.value }))} />
                      <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Phone" value={inqForm.phone} onChange={e => setInqForm(f => ({ ...f, phone: e.target.value }))} />
                      <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" rows={3} placeholder="Message…" value={inqForm.message} onChange={e => setInqForm(f => ({ ...f, message: e.target.value }))} />
                      <button onClick={inquire} disabled={inquiring || !inqForm.name || !inqForm.email}
                        className="w-full py-2.5 rounded-lg text-white font-bold text-sm disabled:opacity-40"
                        style={{ backgroundColor: GREEN }}>{inquiring ? 'Sending…' : 'Send Inquiry'}</button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}

export function MyLandListings() {
  const { BusinessID } = useAccount();
  const [listings, setListings] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank());
  const [saving, setSaving] = useState(false);

  function blank() {
    return { title: '', description: '', listing_type: 'lease', acreage: '', soil_type: '', irrigation: false,
      tillable: '', infrastructure: '', price_per_acre: '', total_price: '', lease_term: '',
      available_date: '', city: '', state_province: '', contact_email: '', contact_phone: '' };
  }

  const load = () => {
    if (!BusinessID) return;
    fetch(`${API}/api/land/business/${BusinessID}`, { headers: authHeaders() })
      .then(r => r.json()).then(d => setListings(Array.isArray(d) ? d : []));
  };
  useEffect(load, [BusinessID]);

  const save = async () => {
    setSaving(true);
    const body = { ...form, acreage: form.acreage || null, tillable: form.tillable || null, price_per_acre: form.price_per_acre || null, total_price: form.total_price || null };
    const url = editing ? `${API}/api/land/${editing}` : `${API}/api/land/business/${BusinessID}`;
    await fetch(url, { method: editing ? 'PUT' : 'POST', headers: authHeaders(), body: JSON.stringify(body) });
    setSaving(false); setEditing(null); setForm(blank()); load();
  };

  const del = async (id) => {
    if (!confirm('Remove listing?')) return;
    await fetch(`${API}/api/land/${id}`, { method: 'DELETE', headers: authHeaders() }); load();
  };

  const inp = (key, props = {}) => (
    <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
      value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} {...props} />
  );

  return (
    <div style={{ backgroundColor: '#f7f2e8', minHeight: '100vh' }}>
      <Header />
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Breadcrumbs items={[{ label: 'Land Leasing', to: '/land' }, { label: 'My Listings' }]} />
        <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-6" style={{ fontFamily: "'Lora','Times New Roman',serif" }}>My Land Listings</h1>
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="font-bold text-gray-800 mb-4">{editing ? 'Edit Listing' : 'Add Land Listing'}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Title *</label>{inp('title', { placeholder: '180 acres, prime corn ground, Story County IA' })}</div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Listing Type</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.listing_type} onChange={e => setForm(f => ({ ...f, listing_type: e.target.value }))}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Total Acres</label>{inp('acreage', { type: 'number' })}</div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Tillable Acres</label>{inp('tillable', { type: 'number' })}</div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">$/Acre (lease/rent)</label>{inp('price_per_acre', { type: 'number' })}</div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Total Price (sale)</label>{inp('total_price', { type: 'number' })}</div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Soil Type</label>{inp('soil_type', { placeholder: 'e.g. Clarion-Nicollet' })}</div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Lease Term</label>{inp('lease_term', { placeholder: 'e.g. 3-year, annual' })}</div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Available Date</label>{inp('available_date', { type: 'date' })}</div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">City</label>{inp('city')}</div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">State</label>{inp('state_province')}</div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Contact Email</label>{inp('contact_email', { type: 'email' })}</div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Contact Phone</label>{inp('contact_phone')}</div>
          </div>
          <label className="flex items-center gap-2 text-sm mt-3 cursor-pointer">
            <input type="checkbox" checked={form.irrigation} onChange={e => setForm(f => ({ ...f, irrigation: e.target.checked }))} className="accent-green-700" />
            Irrigation available
          </label>
          <div className="mt-3"><label className="block text-xs font-semibold text-gray-600 mb-1">Infrastructure / Improvements</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.infrastructure} onChange={e => setForm(f => ({ ...f, infrastructure: e.target.value }))} placeholder="Grain bins, tile drainage, machine shed, etc." />
          </div>
          <div className="mt-3"><label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
            <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          <div className="flex gap-2 mt-4">
            <button onClick={save} disabled={saving || !form.title} className="px-5 py-2.5 rounded-lg text-white font-bold text-sm disabled:opacity-40" style={{ backgroundColor: GREEN }}>{saving ? 'Saving…' : editing ? 'Update' : 'Add Listing'}</button>
            {editing && <button onClick={() => { setEditing(null); setForm(blank()); }} className="px-5 py-2.5 rounded-lg text-sm bg-gray-100 text-gray-600">Cancel</button>}
          </div>
        </div>
        <div className="space-y-3">
          {listings.map(l => (
            <div key={l.ListingID} className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between gap-3">
              <div>
                <div className="font-bold text-gray-900">{l.Title}</div>
                <div className="flex items-center gap-2 mt-1">{typeBadge(l.ListingType)}<span className="text-xs text-gray-400">{l.InquiryCount ?? 0} inquiries</span></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditing(l.ListingID); setForm({ title: l.Title || '', description: l.Description || '', listing_type: l.ListingType || 'lease', acreage: l.Acreage || '', soil_type: l.SoilType || '', irrigation: !!l.Irrigation, tillable: l.Tillable || '', infrastructure: l.Infrastructure || '', price_per_acre: l.PricePerAcre || '', total_price: l.TotalPrice || '', lease_term: l.LeaseTerm || '', available_date: l.AvailableDate?.split('T')[0] || '', city: l.City || '', state_province: l.StateProvince || '', contact_email: l.ContactEmail || '', contact_phone: l.ContactPhone || '' }); }} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">Edit</button>
                <button onClick={() => del(l.ListingID)} className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50">Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
