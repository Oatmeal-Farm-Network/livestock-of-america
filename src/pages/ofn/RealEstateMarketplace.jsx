// Ported from Oatmeal Farm Network (src/RealEstateMarketplace.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
// src/RealEstateMarketplace.jsx
// Route: /marketplaces/real-estate
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import Breadcrumbs from '../../components/Breadcrumbs';

const API = import.meta.env.VITE_LIVESTOCK_API_URL || '';
const ACCENT = '#3D6B34';
const NAV_BG = '#516234';

function authHeaders() {
  const token = localStorage.getItem('access_token') || '';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function PriceBadge({ acreage, pricePerAcre, totalPrice }) {
  if (totalPrice) return (
    <span className="text-lg font-bold" style={{ color: ACCENT }}>
      ${Number(totalPrice).toLocaleString()}
    </span>
  );
  if (pricePerAcre) return (
    <span className="text-lg font-bold" style={{ color: ACCENT }}>
      ${Number(pricePerAcre).toLocaleString()}<span className="text-xs font-normal text-gray-500">/acre</span>
    </span>
  );
  return <span className="text-sm text-gray-400">Price on request</span>;
}

function ListingCard({ listing, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-[#819360] transition-all duration-200 flex flex-col"
    >
      <div className="w-full flex items-center justify-center" style={{ height: '120px', backgroundColor: '#f0f7ed' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#819360" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-bold text-sm text-gray-900 leading-snug line-clamp-2">{listing.Title}</h3>
        {(listing.City || listing.StateProvince) && (
          <p className="text-xs text-gray-500">{[listing.City, listing.StateProvince].filter(Boolean).join(', ')}</p>
        )}
        <div className="flex flex-wrap gap-2 items-center">
          {listing.Acreage && (
            <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
              {listing.Acreage} acres
            </span>
          )}
          {listing.Irrigation ? (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#e0f0ff', color: '#1d4e89' }}>Irrigated</span>
          ) : null}
          {listing.SoilType && (
            <span className="text-xs text-gray-400 truncate">{listing.SoilType}</span>
          )}
        </div>
        <div className="mt-auto pt-1">
          <PriceBadge acreage={listing.Acreage} pricePerAcre={listing.PricePerAcre} totalPrice={listing.TotalPrice} />
        </div>
        {listing.BusinessName && (
          <p className="text-xs text-gray-400 truncate">{listing.BusinessName}</p>
        )}
      </div>
    </button>
  );
}

export default function RealEstateMarketplace() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState('');
  const [q, setQ] = useState('');
  const [qInput, setQInput] = useState('');
  const [selected, setSelected] = useState(null);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inqForm, setInqForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [inquiring, setInquiring] = useState(false);
  const [inquiredOk, setInquiredOk] = useState(false);
  const [inqError, setInqError] = useState('');

  function load() {
    setLoading(true);
    const p = new URLSearchParams({ listing_type: 'for-sale' });
    if (state) p.set('state', state);
    if (q) p.set('q', q);
    fetch(`${API}/api/land?${p}`)
      .then(r => r.json())
      .then(d => setListings(Array.isArray(d) ? d : []))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [state, q]);

  async function submitInquiry() {
    if (!inqForm.name || !inqForm.email || !selected) return;
    setInquiring(true); setInqError('');
    try {
      const r = await fetch(`${API}/api/land/${selected.ListingID}/inquire`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(inqForm),
      });
      if (!r.ok) throw new Error();
      setInquiredOk(true);
      setTimeout(() => { setInquiryOpen(false); setInquiredOk(false); setInqForm({ name: '', email: '', phone: '', message: '' }); }, 2500);
    } catch {
      setInqError('Failed to send. Please try again.');
    } finally {
      setInquiring(false);
    }
  }

  function openListing(listing) {
    setSelected(listing);
    setInquiryOpen(false);
    setInquiredOk(false);
    setInqForm({ name: '', email: '', phone: '', message: '' });
    setInqError('');
  }

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f7f2e8' }}>
      <PageMeta
        title="Farmland & Real Estate For Sale | Oatmeal Farm Network"
        description="Browse farmland and agricultural real estate for sale. Filter by state, acreage, and price. Contact sellers directly through OFN."
        canonical="https://oatmealfarmnetwork.com/marketplaces/real-estate"
      />
      <Header />

      <div className="mx-auto px-4 pt-4" style={{ maxWidth: '1300px' }}>
        <Breadcrumbs items={[
          { label: 'Home', to: '/' },
          { label: 'Marketplaces' },
          { label: 'Real Estate For Sale' },
        ]} />
      </div>

      {/* Hero */}
      <div className="mx-auto px-4 pt-2" style={{ maxWidth: '1300px' }}>
        <div className="relative w-full overflow-hidden rounded-xl">
          <img
            src="/images/CoreFeaturesPrecisionAg.webp"
            alt="Farmland For Sale"
            className="w-full object-cover"
            style={{ height: '220px', display: 'block' }}
            loading="eager"
            onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }}
          />
          <div className="absolute inset-0"
               style={{ background: 'linear-gradient(to right, rgba(20,60,35,0.92) 0%, rgba(20,60,35,0.75) 45%, rgba(20,60,35,0) 78%)' }} />
          <div className="absolute inset-0 flex flex-col justify-center px-8 py-6" style={{ maxWidth: '720px' }}>
            <h1 style={{ color: '#fff', fontFamily: "'Lora','Times New Roman',serif", fontSize: '1.9rem', fontWeight: 'bold', margin: '0 0 8px', lineHeight: 1.2 }}>
              Farmland &amp; Real Estate For Sale
            </h1>
            <p style={{ color: '#fff', fontSize: '0.9rem', margin: '0 0 14px', lineHeight: 1.6 }}>
              Browse agricultural properties listed for sale by farmers and landowners across the country.
            </p>
            <Link to="/land/my-listings"
              className="inline-flex items-center gap-2 font-bold px-4 py-2 rounded-lg text-sm w-fit transition hover:opacity-90"
              style={{ backgroundColor: 'rgba(255,255,255,0.18)', color: '#fff', border: '2px solid rgba(255,255,255,0.6)' }}>
              + List My Property
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 py-6" style={{ maxWidth: '1300px' }}>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <form onSubmit={e => { e.preventDefault(); setQ(qInput.trim()); }} className="flex gap-2 flex-1 min-w-[220px]">
            <input
              type="text"
              value={qInput}
              onChange={e => setQInput(e.target.value)}
              placeholder="Search by title, soil type, county…"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
            />
            <button type="submit"
              className="px-4 py-1.5 rounded-lg text-white text-sm font-semibold"
              style={{ backgroundColor: ACCENT }}>
              Search
            </button>
          </form>
          <input
            type="text"
            value={state}
            onChange={e => setState(e.target.value)}
            placeholder="State (e.g. IA)"
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white w-36"
          />
          {(state || q) && (
            <button
              onClick={() => { setState(''); setQ(''); setQInput(''); }}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-500 mb-4">
          {loading ? 'Loading…' : `${listings.length.toLocaleString()} listing${listings.length !== 1 ? 's' : ''}`}
        </p>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl h-56 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <svg className="mx-auto mb-3 opacity-30" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <p className="font-semibold">No properties found</p>
            <p className="text-sm mt-1">Try adjusting your filters or <Link to="/land/my-listings" className="underline" style={{ color: ACCENT }}>list your property</Link>.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {listings.map(l => (
              <ListingCard key={l.ListingID} listing={l} onClick={() => openListing(l)} />
            ))}
          </div>
        )}

        <div className="mt-8 text-sm text-gray-500">
          Looking to lease land instead? <Link to="/land" className="underline" style={{ color: ACCENT }}>Browse land leasing listings</Link>.
        </div>
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-40 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }} onClick={() => setSelected(null)}>
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ backgroundColor: NAV_BG }}>
              <span className="text-white font-bold truncate pr-4">{selected.BusinessName || 'Property Listing'}</span>
              <button onClick={() => setSelected(null)} className="text-white text-lg leading-none">✕</button>
            </div>
            <div className="p-6 space-y-5 flex-1 overflow-y-auto">
              <div>
                <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-2" style={{ backgroundColor: '#e6f4ea', color: '#2d6a38' }}>For Sale</span>
                <h2 style={{ fontFamily: "'Lora','Times New Roman',serif" }} className="text-xl font-bold text-gray-900 leading-snug">{selected.Title}</h2>
                {(selected.City || selected.StateProvince) && (
                  <p className="text-sm text-gray-500 mt-1">{[selected.City, selected.StateProvince].filter(Boolean).join(', ')}</p>
                )}
              </div>

              <div>
                <PriceBadge acreage={selected.Acreage} pricePerAcre={selected.PricePerAcre} totalPrice={selected.TotalPrice} />
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 rounded-xl p-4">
                {selected.Acreage    && <><dt className="text-gray-500 font-medium">Total Acres</dt><dd className="font-semibold text-gray-900">{selected.Acreage}</dd></>}
                {selected.Tillable   && <><dt className="text-gray-500 font-medium">Tillable</dt><dd className="font-semibold text-gray-900">{selected.Tillable} ac</dd></>}
                {selected.PricePerAcre && <><dt className="text-gray-500 font-medium">Price/Acre</dt><dd className="font-semibold text-gray-900">${Number(selected.PricePerAcre).toLocaleString()}</dd></>}
                {selected.TotalPrice && <><dt className="text-gray-500 font-medium">Total Price</dt><dd className="font-semibold text-gray-900">${Number(selected.TotalPrice).toLocaleString()}</dd></>}
                {selected.SoilType   && <><dt className="text-gray-500 font-medium col-span-2">Soil Type</dt><dd className="font-semibold text-gray-900 col-span-2">{selected.SoilType}</dd></>}
                <dt className="text-gray-500 font-medium">Irrigation</dt><dd className="font-semibold text-gray-900">{selected.Irrigation ? 'Yes' : 'No'}</dd>
                {selected.AvailableDate && <><dt className="text-gray-500 font-medium col-span-2">Available</dt><dd className="font-semibold text-gray-900 col-span-2">{selected.AvailableDate?.split('T')[0]}</dd></>}
              </div>

              {selected.Infrastructure && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Infrastructure</p>
                  <p className="text-sm text-gray-700">{selected.Infrastructure}</p>
                </div>
              )}
              {selected.Description && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selected.Description}</p>
                </div>
              )}

              {/* Inquiry */}
              {!inquiryOpen ? (
                <button
                  onClick={() => setInquiryOpen(true)}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm transition hover:opacity-90"
                  style={{ backgroundColor: ACCENT }}>
                  Contact Seller
                </button>
              ) : (
                <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <p className="font-semibold text-gray-800 text-sm">Send an Inquiry</p>
                  {inquiredOk ? (
                    <div className="text-center font-bold py-4 rounded-lg" style={{ backgroundColor: '#e6f4ea', color: '#2d6a38' }}>
                      Inquiry sent!
                    </div>
                  ) : (
                    <>
                      <input
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        placeholder="Your name *"
                        value={inqForm.name}
                        onChange={e => setInqForm(f => ({ ...f, name: e.target.value }))}
                      />
                      <input
                        type="email"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        placeholder="Email *"
                        value={inqForm.email}
                        onChange={e => setInqForm(f => ({ ...f, email: e.target.value }))}
                      />
                      <input
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        placeholder="Phone"
                        value={inqForm.phone}
                        onChange={e => setInqForm(f => ({ ...f, phone: e.target.value }))}
                      />
                      <textarea
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
                        rows={3}
                        placeholder="I'm interested in this property…"
                        value={inqForm.message}
                        onChange={e => setInqForm(f => ({ ...f, message: e.target.value }))}
                      />
                      {inqError && <p className="text-sm text-red-600">{inqError}</p>}
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setInquiryOpen(false)}
                          className="px-4 py-2 rounded-lg text-sm text-gray-600 bg-gray-100 hover:bg-gray-200">
                          Cancel
                        </button>
                        <button
                          onClick={submitInquiry}
                          disabled={inquiring || !inqForm.name || !inqForm.email}
                          className="px-5 py-2 rounded-lg text-white font-bold text-sm disabled:opacity-40 transition hover:opacity-90"
                          style={{ backgroundColor: ACCENT }}>
                          {inquiring ? 'Sending…' : 'Send Inquiry'}
                        </button>
                      </div>
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
