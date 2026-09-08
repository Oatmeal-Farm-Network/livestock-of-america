// Ported from Oatmeal Farm Network (src/BuyerCRM.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
// ThaiymeChat, the Thaiyme agent widget, is not ported: it needs
// AgentBadge and LanguageContext. It is a floating chat panel, not
// part of this page's function.

const API = import.meta.env.VITE_LIVESTOCK_API_URL || 'http://localhost:8000';
function tok() { return localStorage.getItem('access_token'); }
function auth() { return { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` }; }

const BUYER_TYPES = ['Wholesale','Retail','Restaurant','Direct','Distributor','Export','Other'];
const INTERACTION_TYPES = ['Call','Email','Visit','Order','Meeting','Follow-up','Note'];

const TYPE_COLOR = {
  Wholesale: '#dbeafe', Retail: '#fce7f3', Restaurant: '#fef3c7',
  Direct: '#d1fae5', Distributor: '#ede9fe', Export: '#e0f2fe', Other: '#f3f4f6',
};

function fmt(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-AU', { day:'numeric', month:'short', year:'numeric' });
}

function ContactModal({ contact, onClose, onSaved, bid }) {
  const [form, setForm] = useState(contact || {
    contact_name:'', company:'', email:'', phone:'',
    buyer_type:'Wholesale', preferred_crops:'', notes:'',
  });
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const save = async () => {
    if (!form.contact_name) return;
    setSaving(true);
    const method = contact ? 'PUT' : 'POST';
    const url = contact
      ? `${API}/api/buyer-crm/contacts/${contact.contact_id}?business_id=${bid}`
      : `${API}/api/buyer-crm/contacts?business_id=${bid}`;
    await fetch(url, { method, headers: auth(), body: JSON.stringify(form) });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{contact ? 'Edit Contact' : 'Add Buyer Contact'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div className="p-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Contact Name *</label>
              <input value={form.contact_name} onChange={e=>set('contact_name',e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Full name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
              <input value={form.company||''} onChange={e=>set('company',e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Restaurant / Store name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Buyer Type</label>
              <select value={form.buyer_type||'Wholesale'} onChange={e=>set('buyer_type',e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
                {BUYER_TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email||''} onChange={e=>set('email',e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
              <input value={form.phone||''} onChange={e=>set('phone',e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Preferred Crops</label>
              <input value={form.preferred_crops||''} onChange={e=>set('preferred_crops',e.target.value)}
                placeholder="e.g. Tomatoes, Lettuce, Herbs"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
              <textarea rows={2} value={form.notes||''} onChange={e=>set('notes',e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none" />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
          <button onClick={save} disabled={saving||!form.contact_name}
            className="px-4 py-2 text-sm bg-gray-900 text-white rounded-xl hover:bg-gray-700 disabled:opacity-50">
            {saving ? 'Saving…' : contact ? 'Save Changes' : 'Add Contact'}
          </button>
        </div>
      </div>
    </div>
  );
}

function InteractionModal({ contacts, onClose, onSaved, bid, preContactId }) {
  const [form, setForm] = useState({
    contact_id: preContactId || (contacts[0]?.contact_id || ''),
    interaction_date: new Date().toISOString().slice(0,10),
    interaction_type: 'Note', notes: '', follow_up_date: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const save = async () => {
    if (!form.notes || !form.contact_id) return;
    setSaving(true);
    await fetch(`${API}/api/buyer-crm/interactions?business_id=${bid}`, {
      method:'POST', headers:auth(), body:JSON.stringify(form),
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Log Interaction</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div className="p-6 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Contact *</label>
            <select value={form.contact_id} onChange={e=>set('contact_id',parseInt(e.target.value))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
              {contacts.map(c=><option key={c.contact_id} value={c.contact_id}>{c.contact_name}{c.company ? ` (${c.company})` : ''}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={form.interaction_date} onChange={e=>set('interaction_date',e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
              <select value={form.interaction_type} onChange={e=>set('interaction_type',e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
                {INTERACTION_TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes *</label>
            <textarea rows={3} value={form.notes} onChange={e=>set('notes',e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none" placeholder="What was discussed…" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Follow-up Date</label>
            <input type="date" value={form.follow_up_date} onChange={e=>set('follow_up_date',e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
          <button onClick={save} disabled={saving||!form.notes||!form.contact_id}
            className="px-4 py-2 text-sm bg-gray-900 text-white rounded-xl hover:bg-gray-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Log It'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PricingModal({ contacts, onClose, onSaved, bid }) {
  const [form, setForm] = useState({
    contact_id: contacts[0]?.contact_id || '',
    crop_name:'', variety:'', price_per_unit:'', unit:'kg',
    season:'', valid_from:'', valid_to:'', notes:'',
  });
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const save = async () => {
    if (!form.crop_name || !form.price_per_unit || !form.contact_id) return;
    setSaving(true);
    await fetch(`${API}/api/buyer-crm/pricing?business_id=${bid}`, {
      method:'POST', headers:auth(), body:JSON.stringify(form),
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Add Pricing Agreement</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div className="p-6 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Buyer *</label>
            <select value={form.contact_id} onChange={e=>set('contact_id',parseInt(e.target.value))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
              {contacts.map(c=><option key={c.contact_id} value={c.contact_id}>{c.contact_name}{c.company?` (${c.company})`:''}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Crop *</label>
              <input value={form.crop_name} onChange={e=>set('crop_name',e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Tomatoes" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Variety</label>
              <input value={form.variety} onChange={e=>set('variety',e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Price/Unit *</label>
              <input type="number" step="0.01" value={form.price_per_unit} onChange={e=>set('price_per_unit',e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="2.50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
              <select value={form.unit} onChange={e=>set('unit',e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
                {['kg','lb','tonne','box','crate','bunch','dozen','each'].map(u=><option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Valid From</label>
              <input type="date" value={form.valid_from} onChange={e=>set('valid_from',e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Valid To</label>
              <input type="date" value={form.valid_to} onChange={e=>set('valid_to',e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Season / Notes</label>
            <input value={form.notes} onChange={e=>set('notes',e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="e.g. Summer 2025, minimum 100kg" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
          <button onClick={save} disabled={saving||!form.crop_name||!form.price_per_unit||!form.contact_id}
            className="px-4 py-2 text-sm bg-gray-900 text-white rounded-xl hover:bg-gray-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Add Agreement'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BuyerCRM() {
  const [params] = useSearchParams();
  const bid = params.get('BusinessID');
  const [tab, setTab] = useState('contacts');
  const [contacts, setContacts] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [pricing, setPricing] = useState([]);
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [showContactModal, setShowContactModal] = useState(false);
  const [editContact, setEditContact] = useState(null);
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!bid) return;
    setLoading(true);
    Promise.all([
      fetch(`${API}/api/buyer-crm/contacts?business_id=${bid}`, {headers:auth()}).then(r=>r.json()),
      fetch(`${API}/api/buyer-crm/interactions?business_id=${bid}`, {headers:auth()}).then(r=>r.json()),
      fetch(`${API}/api/buyer-crm/pricing?business_id=${bid}`, {headers:auth()}).then(r=>r.json()),
      fetch(`${API}/api/buyer-crm/summary?business_id=${bid}`, {headers:auth()}).then(r=>r.json()),
    ]).then(([c,i,p,s])=>{ setContacts(c); setInteractions(i); setPricing(p); setSummary(s); })
      .catch(()=>{}).finally(()=>setLoading(false));
  };

  useEffect(()=>{ load(); },[bid]);

  const delContact = async (id) => {
    if (!confirm('Delete this contact and all their interactions?')) return;
    await fetch(`${API}/api/buyer-crm/contacts/${id}?business_id=${bid}`,{method:'DELETE',headers:auth()});
    load();
  };
  const delInteraction = async (id) => {
    await fetch(`${API}/api/buyer-crm/interactions/${id}?business_id=${bid}`,{method:'DELETE',headers:auth()});
    load();
  };
  const delPricing = async (id) => {
    await fetch(`${API}/api/buyer-crm/pricing/${id}?business_id=${bid}`,{method:'DELETE',headers:auth()});
    load();
  };

  const filteredContacts = contacts.filter(c => {
    const matchSearch = !search || c.contact_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.company||'').toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'All' || c.buyer_type === typeFilter;
    return matchSearch && matchType;
  });

  const TABS = [
    { key:'contacts', label:`Contacts (${contacts.length})` },
    { key:'interactions', label:'Interaction Log' },
    { key:'pricing', label:'Pricing Agreements' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">Buyer & Customer CRM</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage buyer relationships, log interactions, and track pricing agreements</p>
      </div>

      {/* Summary bar */}
      {summary && (
        <div className="bg-white border-b px-6 py-3 flex gap-6 text-sm">
          {[
            ['Contacts', summary.total_contacts],
            ['Interactions (30d)', summary.interactions_30d],
            ['Follow-ups Due', summary.follow_ups_due, summary.follow_ups_due > 0 ? 'text-orange-600 font-semibold' : ''],
            ['Active Agreements', summary.active_agreements],
          ].map(([label, val, cls='']) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="text-gray-500">{label}:</span>
              <span className={`font-medium text-gray-900 ${cls}`}>{val ?? '—'}</span>
            </div>
          ))}
        </div>
      )}

      <div className="px-6 pt-4">
        <div className="flex gap-1 border-b border-gray-200">
          {TABS.map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab===t.key?'border-gray-900 text-gray-900':'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 max-w-5xl">
        {/* ── Contacts ── */}
        {tab === 'contacts' && (
          <>
            {showContactModal && (
              <ContactModal bid={bid} contact={editContact}
                onClose={()=>{setShowContactModal(false);setEditContact(null);}}
                onSaved={()=>{setShowContactModal(false);setEditContact(null);load();}} />
            )}
            <div className="flex gap-3 mb-4 flex-wrap">
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Search name or company…"
                className="flex-1 min-w-[200px] border border-gray-200 rounded-xl px-3 py-2 text-sm" />
              <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm">
                <option value="All">All Types</option>
                {BUYER_TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
              <button onClick={()=>{setEditContact(null);setShowContactModal(true);}}
                className="px-3 py-2 text-xs bg-gray-900 text-white rounded-xl hover:bg-gray-700">+ Add Contact</button>
            </div>

            {loading ? <p className="text-sm text-gray-400">Loading…</p>
            : filteredContacts.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-2">🤝</div>
                <p className="text-sm">No contacts yet. Add your first buyer.</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredContacts.map(c=>(
                  <div key={c.contact_id} className="bg-white rounded-2xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm truncate">{c.contact_name}</div>
                        {c.company && <div className="text-xs text-gray-500 truncate">{c.company}</div>}
                        <div className="flex items-center gap-2 mt-1.5">
                          <span style={{background: TYPE_COLOR[c.buyer_type]||'#f3f4f6'}}
                            className="text-xs px-2 py-0.5 rounded-full text-gray-700 font-medium">
                            {c.buyer_type}
                          </span>
                          {c.preferred_crops && (
                            <span className="text-xs text-gray-400 truncate">{c.preferred_crops}</span>
                          )}
                        </div>
                        <div className="flex gap-3 mt-2 text-xs text-gray-500">
                          {c.email && <a href={`mailto:${c.email}`} className="hover:text-blue-600">{c.email}</a>}
                          {c.phone && <span>{c.phone}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={()=>{setEditContact(c);setShowContactModal(true);}}
                          className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 border border-gray-200 rounded-lg">Edit</button>
                        <button onClick={()=>delContact(c.contact_id)}
                          className="text-xs text-gray-300 hover:text-red-500 px-2 py-1">Del</button>
                      </div>
                    </div>
                    {c.notes && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{c.notes}</p>}
                    <button onClick={()=>{setTab('interactions');setShowInteractionModal(true);}}
                      className="mt-3 text-xs text-gray-500 hover:text-gray-800 underline">+ Log interaction</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Interactions ── */}
        {tab === 'interactions' && (
          <>
            {showInteractionModal && (
              <InteractionModal contacts={contacts} bid={bid}
                onClose={()=>setShowInteractionModal(false)}
                onSaved={()=>{setShowInteractionModal(false);load();}} />
            )}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-gray-700">Recent Interactions</h3>
              <button onClick={()=>setShowInteractionModal(true)}
                className="px-3 py-1.5 text-xs bg-gray-900 text-white rounded-xl hover:bg-gray-700">
                + Log Interaction
              </button>
            </div>
            {interactions.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-2">💬</div>
                <p className="text-sm">No interactions logged yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {interactions.map(i=>(
                  <div key={i.interaction_id} className="bg-white rounded-2xl border border-gray-200 px-5 py-3 flex gap-4 items-start">
                    <div className="w-20 shrink-0">
                      <div className="text-xs font-medium text-gray-900">{fmt(i.interaction_date)}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{i.interaction_type}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800">{i.contact_name}{i.company ? ` · ${i.company}` : ''}</div>
                      <div className="text-sm text-gray-600 mt-0.5">{i.notes}</div>
                      {i.follow_up_date && (
                        <div className="text-xs text-orange-600 mt-1">Follow-up: {fmt(i.follow_up_date)}</div>
                      )}
                    </div>
                    <button onClick={()=>delInteraction(i.interaction_id)} className="text-gray-300 hover:text-red-500 text-xs shrink-0">Del</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Pricing Agreements ── */}
        {tab === 'pricing' && (
          <>
            {showPricingModal && (
              <PricingModal contacts={contacts} bid={bid}
                onClose={()=>setShowPricingModal(false)}
                onSaved={()=>{setShowPricingModal(false);load();}} />
            )}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-gray-700">Pricing Agreements</h3>
              <button onClick={()=>setShowPricingModal(true)}
                className="px-3 py-1.5 text-xs bg-gray-900 text-white rounded-xl hover:bg-gray-700">
                + Add Agreement
              </button>
            </div>
            {pricing.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-2">💰</div>
                <p className="text-sm">No pricing agreements yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                      <th className="text-left px-4 py-3 font-medium">Buyer</th>
                      <th className="text-left px-4 py-3 font-medium">Crop</th>
                      <th className="text-left px-4 py-3 font-medium">Price</th>
                      <th className="text-left px-4 py-3 font-medium">Valid</th>
                      <th className="text-left px-4 py-3 font-medium">Notes</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {pricing.map(p=>(
                      <tr key={p.agreement_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{p.contact_name}</div>
                          {p.company && <div className="text-xs text-gray-400">{p.company}</div>}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{p.crop_name}{p.variety ? ` — ${p.variety}` : ''}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">${parseFloat(p.price_per_unit||0).toFixed(2)}/{p.unit}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{fmt(p.valid_from)} – {fmt(p.valid_to)}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{p.notes||'—'}</td>
                        <td className="px-4 py-3">
                          <button onClick={()=>delPricing(p.agreement_id)} className="text-gray-300 hover:text-red-500 text-xs">Del</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div></div>
  );
}
