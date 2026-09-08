// Ported from Oatmeal Farm Network (src/PriceList.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
import { useState, useEffect, useCallback } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
// ThaiymeChat, the Thaiyme agent widget, is not ported: it needs
// AgentBadge and LanguageContext. It is a floating chat panel, not
// part of this page's function.
import { useSearchParams } from 'react-router';

const API = import.meta.env.VITE_LIVESTOCK_API_URL ?? '';

const TIERS = ['Wholesale','Retail','Direct-to-Consumer','Restaurant','Export'];
const QUOTE_STATUSES = ['Draft','Sent','Accepted','Declined','Expired'];
const UNITS = ['kg','g','lb','tonne','box','crate','each','dozen','litre'];

const TIER_COLOR = {
  'Wholesale':            'bg-blue-100 text-blue-800',
  'Retail':               'bg-purple-100 text-purple-800',
  'Direct-to-Consumer':   'bg-green-100 text-green-800',
  'Restaurant':           'bg-orange-100 text-orange-800',
  'Export':               'bg-indigo-100 text-indigo-800',
};
const QUOTE_STATUS_COLOR = {
  'Draft':    'bg-gray-100 text-gray-700',
  'Sent':     'bg-blue-100 text-blue-800',
  'Accepted': 'bg-green-100 text-green-800',
  'Declined': 'bg-red-100 text-red-800',
  'Expired':  'bg-yellow-100 text-yellow-800',
};

function fmt(v) { return `$${Number(v || 0).toFixed(2)}`; }

function Badge({ text, colorMap }) {
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorMap[text] || 'bg-gray-100 text-gray-700'}`}>{text}</span>;
}

// ── Price List Modal ──────────────────────────────────────────────────────────
function PriceListModal({ initial = {}, onClose, onSave }) {
  const [form, setForm] = useState({
    list_name: initial.list_name || '',
    buyer_tier: initial.buyer_tier || 'Wholesale',
    valid_from: initial.valid_from ? initial.valid_from.slice(0,10) : '',
    valid_to: initial.valid_to ? initial.valid_to.slice(0,10) : '',
    is_active: initial.is_active !== false,
    notes: initial.notes || '',
  });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b"><h2 className="text-lg font-semibold">{initial.price_list_id ? 'Edit Price List' : 'New Price List'}</h2></div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">List Name *</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.list_name} onChange={set('list_name')} placeholder="e.g. Wholesale Spring 2026" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Tier</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.buyer_tier} onChange={set('buyer_tier')}>
                {TIERS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 rounded" />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.valid_from} onChange={set('valid_from')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid To</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.valid_to} onChange={set('valid_to')} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" value={form.notes} onChange={set('notes')} />
          </div>
        </div>
        <div className="p-6 border-t flex justify-end gap-3">
          <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 text-sm bg-[#3D6B34] text-white rounded-lg hover:bg-[#2d5227]" onClick={() => onSave(form)}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ── Price Item Modal ──────────────────────────────────────────────────────────
function ItemModal({ priceListId, onClose, onSave }) {
  const [form, setForm] = useState({ crop_name:'', variety:'', unit:'kg', price_per_unit:'', min_qty:'', notes:'' });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b"><h2 className="text-lg font-semibold">Add Item</h2></div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Crop *</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.crop_name} onChange={set('crop_name')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Variety</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.variety} onChange={set('variety')} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.unit} onChange={set('unit')}>
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price / Unit *</label>
              <input type="number" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.price_per_unit} onChange={set('price_per_unit')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Qty</label>
              <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.min_qty} onChange={set('min_qty')} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.notes} onChange={set('notes')} />
          </div>
        </div>
        <div className="p-6 border-t flex justify-end gap-3">
          <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 text-sm bg-[#3D6B34] text-white rounded-lg hover:bg-[#2d5227]"
            onClick={() => onSave({ ...form, price_list_id: priceListId })}>Add</button>
        </div>
      </div>
    </div>
  );
}

// ── Quote Modal ───────────────────────────────────────────────────────────────
function QuoteModal({ onClose, onSave }) {
  const today = new Date().toISOString().slice(0,10);
  const [form, setForm] = useState({ buyer_name:'', quote_date: today, expiry_date:'', status:'Draft', notes:'' });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b"><h2 className="text-lg font-semibold">New Quote</h2></div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Name *</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.buyer_name} onChange={set('buyer_name')} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quote Date</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.quote_date} onChange={set('quote_date')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.expiry_date} onChange={set('expiry_date')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.status} onChange={set('status')}>
                {QUOTE_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" value={form.notes} onChange={set('notes')} />
          </div>
        </div>
        <div className="p-6 border-t flex justify-end gap-3">
          <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 text-sm bg-[#3D6B34] text-white rounded-lg hover:bg-[#2d5227]" onClick={() => onSave(form)}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ── Quote Line Item Modal ─────────────────────────────────────────────────────
function QuoteLineModal({ quoteId, onClose, onSave }) {
  const [form, setForm] = useState({ crop_name:'', variety:'', qty:'', unit:'kg', price_per_unit:'', notes:'' });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const qty = parseFloat(form.qty) || 0;
  const price = parseFloat(form.price_per_unit) || 0;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b"><h2 className="text-lg font-semibold">Add Line Item</h2></div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Crop *</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.crop_name} onChange={set('crop_name')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Variety</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.variety} onChange={set('variety')} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qty *</label>
              <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.qty} onChange={set('qty')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.unit} onChange={set('unit')}>
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price / Unit *</label>
              <input type="number" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.price_per_unit} onChange={set('price_per_unit')} />
            </div>
          </div>
          {qty > 0 && price > 0 && (
            <div className="bg-gray-50 rounded-lg px-4 py-2 text-sm font-medium text-gray-700">
              Line total: {fmt(qty * price)}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.notes} onChange={set('notes')} />
          </div>
        </div>
        <div className="p-6 border-t flex justify-end gap-3">
          <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 text-sm bg-[#3D6B34] text-white rounded-lg hover:bg-[#2d5227]"
            onClick={() => onSave(form)}>Add</button>
        </div>
      </div>
    </div>
  );
}

// ── Price Lists Tab ───────────────────────────────────────────────────────────
function PriceListsTab({ bid }) {
  const [lists, setLists] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [items, setItems] = useState({});
  const [modal, setModal] = useState(null);
  const [itemModal, setItemModal] = useState(null);

  const load = useCallback(() =>
    fetch(`${API}/api/price-list/lists?business_id=${bid}`).then(r => r.json()).then(setLists), [bid]);
  useEffect(() => { load(); }, [load]);

  const loadItems = async id => {
    const data = await fetch(`${API}/api/price-list/lists/${id}/items?business_id=${bid}`).then(r => r.json());
    setItems(m => ({ ...m, [id]: data }));
    setExpanded(id);
  };

  const savePL = async form => {
    if (modal?.price_list_id) {
      await fetch(`${API}/api/price-list/lists/${modal.price_list_id}?business_id=${bid}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
    } else {
      await fetch(`${API}/api/price-list/lists?business_id=${bid}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
    }
    setModal(null); load();
  };

  const delPL = async id => {
    if (!confirm('Delete this price list and all its items?')) return;
    await fetch(`${API}/api/price-list/lists/${id}?business_id=${bid}`, { method: 'DELETE' });
    load();
  };

  const addItem = async form => {
    await fetch(`${API}/api/price-list/items?business_id=${bid}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    setItemModal(null);
    loadItems(form.price_list_id);
  };

  const delItem = async (itemId, listId) => {
    await fetch(`${API}/api/price-list/items/${itemId}?business_id=${bid}`, { method: 'DELETE' });
    loadItems(listId);
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setModal({})} className="px-4 py-2 bg-[#3D6B34] text-white text-sm rounded-lg hover:bg-[#2d5227]">
          + New Price List
        </button>
      </div>
      <div className="space-y-3">
        {lists.length === 0 && (
          <div className="bg-white rounded-xl border p-8 text-center text-gray-400 text-sm">No price lists created</div>
        )}
        {lists.map(pl => {
          const isExpanded = expanded === pl.price_list_id;
          const plItems = items[pl.price_list_id] || [];
          return (
            <div key={pl.price_list_id} className="bg-white rounded-xl border overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-4">
                <Badge text={pl.buyer_tier} colorMap={TIER_COLOR} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{pl.list_name}</span>
                    {!pl.is_active && <span className="text-xs text-gray-400">(inactive)</span>}
                    <span className="text-xs text-gray-400">{pl.item_count} item{pl.item_count !== 1 ? 's' : ''}</span>
                  </div>
                  {(pl.valid_from || pl.valid_to) && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {pl.valid_from?.slice(0,10)} — {pl.valid_to?.slice(0,10) || 'ongoing'}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-xs text-gray-400 hover:text-gray-600"
                    onClick={() => isExpanded ? setExpanded(null) : loadItems(pl.price_list_id)}>
                    {isExpanded ? 'Hide ▲' : 'Items ▼'}
                  </button>
                  <button className="text-blue-500 hover:underline text-xs" onClick={() => setModal(pl)}>Edit</button>
                  <button className="text-red-400 hover:text-red-600 text-xs" onClick={() => delPL(pl.price_list_id)}>Delete</button>
                </div>
              </div>
              {isExpanded && (
                <div className="border-t bg-gray-50 px-4 py-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-gray-500 uppercase">Price Items</span>
                    <button className="text-xs text-[#3D6B34] hover:underline" onClick={() => setItemModal(pl.price_list_id)}>+ Add Item</button>
                  </div>
                  {plItems.length === 0 ? (
                    <p className="text-xs text-gray-400 py-2">No items yet</p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-500">
                          {['Crop','Variety','Unit','Price/Unit','Min Qty','Notes',''].map(h => (
                            <th key={h} className="text-left pb-2 pr-3">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {plItems.map(item => (
                          <tr key={item.item_id}>
                            <td className="py-2 pr-3 font-medium">{item.crop_name}</td>
                            <td className="py-2 pr-3 text-gray-500">{item.variety || '—'}</td>
                            <td className="py-2 pr-3">{item.unit}</td>
                            <td className="py-2 pr-3 font-medium text-[#3D6B34]">{fmt(item.price_per_unit)}</td>
                            <td className="py-2 pr-3">{item.min_qty || '—'}</td>
                            <td className="py-2 pr-3 text-gray-400">{item.notes || '—'}</td>
                            <td className="py-2">
                              <button className="text-red-400 hover:text-red-600"
                                onClick={() => delItem(item.item_id, pl.price_list_id)}>✕</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {modal && <PriceListModal initial={modal} onClose={() => setModal(null)} onSave={savePL} />}
      {itemModal && <ItemModal priceListId={itemModal} onClose={() => setItemModal(null)} onSave={addItem} />}
    </div>
  );
}

// ── Quotes Tab ────────────────────────────────────────────────────────────────
function QuotesTab({ bid }) {
  const [quotes, setQuotes] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [lineItems, setLineItems] = useState({});
  const [modal, setModal] = useState(false);
  const [lineModal, setLineModal] = useState(null);

  const load = useCallback(() =>
    fetch(`${API}/api/price-list/quotes?business_id=${bid}`).then(r => r.json()).then(setQuotes), [bid]);
  useEffect(() => { load(); }, [load]);

  const loadLines = async id => {
    const data = await fetch(`${API}/api/price-list/quotes/${id}/items?business_id=${bid}`).then(r => r.json());
    setLineItems(m => ({ ...m, [id]: data }));
    setExpanded(id);
  };

  const saveQuote = async form => {
    await fetch(`${API}/api/price-list/quotes?business_id=${bid}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    setModal(false); load();
  };

  const updateStatus = async (id, status) => {
    await fetch(`${API}/api/price-list/quotes/${id}/status?business_id=${bid}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    });
    load();
  };

  const delQuote = async id => {
    if (!confirm('Delete this quote?')) return;
    await fetch(`${API}/api/price-list/quotes/${id}?business_id=${bid}`, { method: 'DELETE' });
    load();
  };

  const addLine = async form => {
    await fetch(`${API}/api/price-list/quotes/${lineModal}/items?business_id=${bid}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    setLineModal(null);
    loadLines(lineModal);
    load(); // refresh total
  };

  const delLine = async (lineId, quoteId) => {
    await fetch(`${API}/api/price-list/quote-items/${lineId}?business_id=${bid}`, { method: 'DELETE' });
    loadLines(quoteId);
    load();
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setModal(true)} className="px-4 py-2 bg-[#3D6B34] text-white text-sm rounded-lg hover:bg-[#2d5227]">
          + New Quote
        </button>
      </div>
      <div className="space-y-3">
        {quotes.length === 0 && (
          <div className="bg-white rounded-xl border p-8 text-center text-gray-400 text-sm">No quotes created</div>
        )}
        {quotes.map(q => {
          const isExpanded = expanded === q.quote_id;
          const lines = lineItems[q.quote_id] || [];
          return (
            <div key={q.quote_id} className="bg-white rounded-xl border overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{q.buyer_name || 'Unknown Buyer'}</span>
                    <Badge text={q.status} colorMap={QUOTE_STATUS_COLOR} />
                    <span className="text-xs text-gray-400">#{q.quote_id}</span>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500 mt-1">
                    <span>Date: {q.quote_date?.slice(0,10)}</span>
                    {q.expiry_date && <span>Expires: {q.expiry_date.slice(0,10)}</span>}
                    <span className="font-medium text-gray-700">Total: {fmt(q.total_value)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button className="text-xs text-gray-400 hover:text-gray-600"
                    onClick={() => isExpanded ? setExpanded(null) : loadLines(q.quote_id)}>
                    {isExpanded ? 'Hide ▲' : 'Items ▼'}
                  </button>
                  <select className="border rounded px-2 py-1 text-xs" value={q.status}
                    onChange={e => updateStatus(q.quote_id, e.target.value)}>
                    {QUOTE_STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <button className="text-red-400 hover:text-red-600 text-xs" onClick={() => delQuote(q.quote_id)}>Delete</button>
                </div>
              </div>
              {isExpanded && (
                <div className="border-t bg-gray-50 px-4 py-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-gray-500 uppercase">Line Items</span>
                    <button className="text-xs text-[#3D6B34] hover:underline" onClick={() => setLineModal(q.quote_id)}>+ Add Item</button>
                  </div>
                  {lines.length === 0 ? (
                    <p className="text-xs text-gray-400 py-2">No line items yet</p>
                  ) : (
                    <>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-gray-500">
                            {['Crop','Variety','Qty','Unit','Price/Unit','Total',''].map(h => (
                              <th key={h} className="text-left pb-2 pr-3">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {lines.map(l => (
                            <tr key={l.line_item_id}>
                              <td className="py-2 pr-3 font-medium">{l.crop_name}</td>
                              <td className="py-2 pr-3 text-gray-500">{l.variety || '—'}</td>
                              <td className="py-2 pr-3">{l.qty}</td>
                              <td className="py-2 pr-3">{l.unit}</td>
                              <td className="py-2 pr-3">{fmt(l.price_per_unit)}</td>
                              <td className="py-2 pr-3 font-medium">{fmt(l.line_total)}</td>
                              <td className="py-2">
                                <button className="text-red-400 hover:text-red-600"
                                  onClick={() => delLine(l.line_item_id, q.quote_id)}>✕</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="text-right text-sm font-bold text-gray-800 pt-2 border-t mt-2">
                        Quote Total: {fmt(q.total_value)}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {modal && <QuoteModal onClose={() => setModal(false)} onSave={saveQuote} />}
      {lineModal && <QuoteLineModal quoteId={lineModal} onClose={() => setLineModal(null)} onSave={addLine} />}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PriceList() {
  const [searchParams] = useSearchParams();
  const bid = searchParams.get('BusinessID') || '';
  const [tab, setTab] = useState('lists');
  const [summary, setSummary] = useState({});

  useEffect(() => {
    if (!bid) return;
    fetch(`${API}/api/price-list/summary?business_id=${bid}`).then(r => r.json()).then(setSummary);
  }, [bid]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Price List & Quote Builder</h1>
            <p className="text-sm text-gray-500 mt-1">Manage tiered price lists and build sales quotes</p>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Active Lists', value: summary.active_lists ?? 0, color: 'text-green-600' },
            { label: 'Draft Quotes', value: summary.draft_quotes ?? 0, color: 'text-gray-600' },
            { label: 'Sent Quotes', value: summary.sent_quotes ?? 0, color: 'text-blue-600' },
            { label: 'Accepted (30d)', value: fmt(summary.accepted_value_month ?? 0), color: 'text-[#3D6B34]' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border p-4 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-200 rounded-lg p-1 mb-6 w-fit">
          {[{key:'lists',label:'Price Lists'},{key:'quotes',label:'Quotes'}].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === t.key ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-800'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {!bid ? (
          <div className="bg-white rounded-xl border p-8 text-center text-gray-400">No business account linked.</div>
        ) : (
          <>
            {tab === 'lists' && <PriceListsTab bid={bid} />}
            {tab === 'quotes' && <QuotesTab bid={bid} />}
          </>
        )}
      </main><Footer />
    </div>
  );
}
