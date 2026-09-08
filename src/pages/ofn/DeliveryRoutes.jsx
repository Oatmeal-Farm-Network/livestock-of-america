// Ported from Oatmeal Farm Network (src/DeliveryRoutes.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import AccountSidebar from '../../components/AccountSidebar';
// ThaiymeChat (the Thaiyme agent widget) is not ported: it needs AgentBadge
// and LanguageContext, a chain worth more than an embedded chat panel.

const API = (path) => `/api/delivery${path}`;

const STOP_STATUSES = ['Pending','In Transit','Delivered','Attempted','Skipped'];
const ROUTE_STATUSES = ['Planned','In Progress','Completed','Cancelled'];

const STATUS_COLORS = {
  Pending:     'bg-gray-100 text-gray-700',
  'In Transit':'bg-blue-100 text-blue-700',
  Delivered:   'bg-green-100 text-green-700',
  Attempted:   'bg-yellow-100 text-yellow-700',
  Skipped:     'bg-red-100 text-red-700',
  Planned:     'bg-gray-100 text-gray-700',
  Completed:   'bg-green-100 text-green-700',
  Cancelled:   'bg-red-100 text-red-700',
};

function authHdr() {
  const t = localStorage.getItem('access_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function apiFetch(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...authHdr(), ...(opts.headers || {}) },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Modals ────────────────────────────────────────────────────────────────────

function RouteModal({ initial, onSave, onClose }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    route_name: '', route_date: today, driver_name: '', vehicle_info: '',
    status: 'Planned', notes: '', ...initial,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center p-5 border-b">
          <h3 className="font-semibold text-gray-800">{initial?.route_id ? 'Edit Route' : 'New Delivery Route'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Route Name *</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.route_name}
              onChange={e => set('route_name', e.target.value)} placeholder="e.g. Monday Restaurants" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.route_date} onChange={e => set('route_date', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.status} onChange={e => set('status', e.target.value)}>
                {ROUTE_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Driver Name</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.driver_name || ''}
              onChange={e => set('driver_name', e.target.value)} placeholder="Driver name" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.vehicle_info || ''}
              onChange={e => set('vehicle_info', e.target.value)} placeholder="e.g. White Ford Transit — OFN 123" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} value={form.notes || ''}
              onChange={e => set('notes', e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-5 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={() => onSave(form)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            {initial?.route_id ? 'Save Changes' : 'Create Route'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StopModal({ routeId, initial, onSave, onClose }) {
  const [form, setForm] = useState({
    contact_name: '', address: '', expected_time: '', stop_order: '',
    notes: '', route_id: routeId, ...initial,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-5 border-b">
          <h3 className="font-semibold text-gray-800">{initial?.stop_id ? 'Edit Stop' : 'Add Stop'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Contact / Customer *</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.contact_name}
              onChange={e => set('contact_name', e.target.value)} placeholder="Restaurant or customer name" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.address || ''}
              onChange={e => set('address', e.target.value)} placeholder="Full delivery address" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Expected Time</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.expected_time || ''}
                onChange={e => set('expected_time', e.target.value)} placeholder="08:30" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Stop Order</label>
              <input type="number" min={1} className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.stop_order || ''} onChange={e => set('stop_order', e.target.value)}
                placeholder="Auto" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} value={form.notes || ''}
              onChange={e => set('notes', e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-5 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={() => onSave(form)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            {initial?.stop_id ? 'Save Stop' : 'Add Stop'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StopStatusModal({ stop, onSave, onClose }) {
  const [form, setForm] = useState({
    status: stop.status, actual_time: stop.actual_time || '',
    proof_of_delivery: stop.proof_of_delivery || '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex justify-between items-center p-5 border-b">
          <h3 className="font-semibold text-gray-800">Update Stop — {stop.contact_name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <div className="grid grid-cols-2 gap-2">
              {STOP_STATUSES.map(s => (
                <button key={s} onClick={() => set('status', s)}
                  className={`py-2 text-sm rounded-lg border font-medium transition-colors
                    ${form.status === s ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Actual Arrival Time</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.actual_time}
              onChange={e => set('actual_time', e.target.value)} placeholder="09:15" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Proof of Delivery Note</label>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2}
              value={form.proof_of_delivery} onChange={e => set('proof_of_delivery', e.target.value)}
              placeholder="Signed by, left at door, etc." />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-5 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={() => onSave(form)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Update Status
          </button>
        </div>
      </div>
    </div>
  );
}

function AddItemModal({ stopId, businessId, onSave, onClose }) {
  const [form, setForm] = useState({ product_name: '', qty: '', unit: 'kg', notes: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex justify-between items-center p-5 border-b">
          <h3 className="font-semibold text-gray-800">Add Delivery Item</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Product *</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.product_name}
              onChange={e => set('product_name', e.target.value)} placeholder="e.g. Mixed Tomatoes" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Quantity *</label>
              <input type="number" min={0} step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.qty} onChange={e => set('qty', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.unit} onChange={e => set('unit', e.target.value)}>
                {['kg','lb','box','bag','crate','unit','dozen','litre'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.notes}
              onChange={e => set('notes', e.target.value)} placeholder="Special handling notes" />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-5 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={() => onSave({ ...form, stop_id: stopId })}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Add Item
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Stop row with expandable items ───────────────────────────────────────────

function StopRow({ stop, businessId, routeStatus, onStatusUpdate, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [items, setItems] = useState(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const loadItems = useCallback(async () => {
    const data = await apiFetch(`${API(`/stops/${stop.stop_id}/items`)}?business_id=${businessId}`);
    setItems(data);
  }, [stop.stop_id, businessId]);

  const toggleExpand = () => {
    if (!expanded && items === null) loadItems();
    setExpanded(e => !e);
  };

  const addItem = async (body) => {
    await apiFetch(`${API('/stop-items')}?business_id=${businessId}`, { method: 'POST', body: JSON.stringify(body) });
    setShowAddItem(false);
    loadItems();
  };

  const deleteItem = async (itemId) => {
    await apiFetch(`${API(`/stop-items/${itemId}`)}?business_id=${businessId}`, { method: 'DELETE' });
    loadItems();
  };

  const handleStatusSave = async (body) => {
    await onStatusUpdate(stop.stop_id, body);
    setShowStatusModal(false);
  };

  const isActive = routeStatus === 'In Progress';

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 p-3 bg-white">
          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
            {stop.stop_order}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-gray-900 truncate">{stop.contact_name}</div>
            {stop.address && <div className="text-xs text-gray-500 truncate">{stop.address}</div>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {stop.expected_time && (
              <span className="text-xs text-gray-500">ETA {stop.expected_time}</span>
            )}
            {stop.actual_time && (
              <span className="text-xs text-green-600">✓ {stop.actual_time}</span>
            )}
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[stop.status] || 'bg-gray-100 text-gray-700'}`}>
              {stop.status}
            </span>
            {isActive && (
              <button onClick={() => setShowStatusModal(true)}
                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">
                Update
              </button>
            )}
            <button onClick={toggleExpand}
              className="text-xs border rounded px-2 py-1 hover:bg-gray-50 text-gray-600">
              {expanded ? '▲ Hide' : '▼ Items'}
            </button>
            <button onClick={() => onEdit(stop)}
              className="text-xs border rounded px-2 py-1 hover:bg-gray-50 text-gray-600">Edit</button>
            <button onClick={() => onDelete(stop.stop_id)}
              className="text-xs border border-red-200 text-red-600 rounded px-2 py-1 hover:bg-red-50">✕</button>
          </div>
        </div>

        {stop.proof_of_delivery && (
          <div className="px-3 pb-2 text-xs text-gray-500 bg-green-50 border-t">
            POD: {stop.proof_of_delivery}
          </div>
        )}
        {stop.notes && (
          <div className="px-3 pb-2 text-xs text-gray-500 bg-gray-50 border-t">
            {stop.notes}
          </div>
        )}

        {expanded && (
          <div className="border-t bg-gray-50 p-3">
            {items === null ? (
              <div className="text-xs text-gray-400">Loading…</div>
            ) : items.length === 0 ? (
              <div className="text-xs text-gray-400">No items yet</div>
            ) : (
              <table className="w-full text-xs mb-2">
                <thead>
                  <tr className="text-gray-500">
                    <th className="text-left pb-1">Product</th>
                    <th className="text-right pb-1">Qty</th>
                    <th className="text-left pb-1 pl-2">Unit</th>
                    <th className="text-left pb-1 pl-2">Notes</th>
                    <th className="pb-1"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map(it => (
                    <tr key={it.item_id}>
                      <td className="py-1 font-medium text-gray-800">{it.product_name}</td>
                      <td className="py-1 text-right">{it.qty}</td>
                      <td className="py-1 pl-2 text-gray-500">{it.unit}</td>
                      <td className="py-1 pl-2 text-gray-400">{it.notes}</td>
                      <td className="py-1 pl-2">
                        <button onClick={() => deleteItem(it.item_id)}
                          className="text-red-400 hover:text-red-600">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button onClick={() => setShowAddItem(true)}
              className="text-xs border border-dashed border-blue-400 text-blue-600 rounded px-3 py-1 hover:bg-blue-50">
              + Add Item
            </button>
          </div>
        )}
      </div>

      {showStatusModal && (
        <StopStatusModal stop={stop} onSave={handleStatusSave} onClose={() => setShowStatusModal(false)} />
      )}
      {showAddItem && (
        <AddItemModal stopId={stop.stop_id} businessId={businessId}
          onSave={addItem} onClose={() => setShowAddItem(false)} />
      )}
    </>
  );
}

// ── Route detail panel ────────────────────────────────────────────────────────

function RouteDetail({ route, businessId, onBack, onRouteUpdate }) {
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStopModal, setShowStopModal] = useState(false);
  const [editingStop, setEditingStop] = useState(null);

  const loadStops = useCallback(async () => {
    setLoading(true);
    const data = await apiFetch(`${API(`/routes/${route.route_id}/stops`)}?business_id=${businessId}`);
    setStops(data);
    setLoading(false);
  }, [route.route_id, businessId]);

  useEffect(() => { loadStops(); }, [loadStops]);

  const saveStop = async (body) => {
    if (editingStop) {
      await apiFetch(`${API(`/stops/${editingStop.stop_id}`)}?business_id=${businessId}`,
        { method: 'PUT', body: JSON.stringify(body) });
    } else {
      await apiFetch(`${API('/stops')}?business_id=${businessId}`,
        { method: 'POST', body: JSON.stringify({ ...body, route_id: route.route_id }) });
    }
    setShowStopModal(false);
    setEditingStop(null);
    loadStops();
  };

  const deleteStop = async (stopId) => {
    if (!window.confirm('Delete this stop and its items?')) return;
    await apiFetch(`${API(`/stops/${stopId}`)}?business_id=${businessId}`, { method: 'DELETE' });
    loadStops();
  };

  const updateStopStatus = async (stopId, body) => {
    await apiFetch(`${API(`/stops/${stopId}/status`)}?business_id=${businessId}`,
      { method: 'PATCH', body: JSON.stringify(body) });
    loadStops();
  };

  const startRoute = async () => {
    await onRouteUpdate({ ...route, status: 'In Progress' });
  };

  const completeRoute = async () => {
    await onRouteUpdate({ ...route, status: 'Completed' });
  };

  const delivered = stops.filter(s => s.status === 'Delivered').length;
  const total = stops.length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-white">
        <button onClick={onBack} className="text-blue-600 hover:underline text-sm">← All Routes</button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900">{route.route_name}</h2>
          <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
            <span>📅 {route.route_date}</span>
            {route.driver_name && <span>🚗 {route.driver_name}</span>}
            {route.vehicle_info && <span>🚐 {route.vehicle_info}</span>}
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[route.status] || 'bg-gray-100 text-gray-700'}`}>
          {route.status}
        </span>
        {route.status === 'Planned' && (
          <button onClick={startRoute}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Start Route
          </button>
        )}
        {route.status === 'In Progress' && (
          <button onClick={completeRoute}
            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
            Complete Route
          </button>
        )}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-b">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>{delivered} of {total} stops delivered</span>
            <span>{Math.round((delivered / total) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${(delivered / total) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Stops */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium text-gray-800 text-sm">Delivery Stops</h3>
          <button onClick={() => { setEditingStop(null); setShowStopModal(true); }}
            className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
            + Add Stop
          </button>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-8">Loading stops…</div>
        ) : stops.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">📍</div>
            <div className="text-sm">No stops yet — add your first delivery stop</div>
          </div>
        ) : (
          <div className="space-y-2">
            {stops.map(stop => (
              <StopRow key={stop.stop_id} stop={stop} businessId={businessId}
                routeStatus={route.status}
                onStatusUpdate={updateStopStatus}
                onEdit={(s) => { setEditingStop(s); setShowStopModal(true); }}
                onDelete={deleteStop} />
            ))}
          </div>
        )}
      </div>

      {showStopModal && (
        <StopModal routeId={route.route_id} initial={editingStop}
          onSave={saveStop} onClose={() => { setShowStopModal(false); setEditingStop(null); }} />
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DeliveryRoutes() {
  const [searchParams] = useSearchParams();
  const businessId = Number(searchParams.get('BusinessID'));

  const [routes, setRoutes] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [filter, setFilter] = useState('all');

  const loadData = useCallback(async () => {
    setLoading(true);
    const [r, s] = await Promise.all([
      apiFetch(`${API('/routes')}?business_id=${businessId}`),
      apiFetch(`${API('/summary')}?business_id=${businessId}`),
    ]);
    setRoutes(r);
    setSummary(s);
    setLoading(false);
  }, [businessId]);

  useEffect(() => { if (businessId) loadData(); }, [loadData, businessId]);

  const saveRoute = async (body) => {
    if (editingRoute) {
      await apiFetch(`${API(`/routes/${editingRoute.route_id}`)}?business_id=${businessId}`,
        { method: 'PUT', body: JSON.stringify(body) });
    } else {
      await apiFetch(`${API('/routes')}?business_id=${businessId}`,
        { method: 'POST', body: JSON.stringify(body) });
    }
    setShowRouteModal(false);
    setEditingRoute(null);
    loadData();
  };

  const deleteRoute = async (routeId) => {
    if (!window.confirm('Delete this route and all its stops?')) return;
    await apiFetch(`${API(`/routes/${routeId}`)}?business_id=${businessId}`, { method: 'DELETE' });
    loadData();
  };

  const updateRouteStatus = async (route) => {
    await apiFetch(`${API(`/routes/${route.route_id}`)}?business_id=${businessId}`,
      { method: 'PUT', body: JSON.stringify(route) });
    loadData();
    setSelectedRoute(prev => prev ? { ...prev, status: route.status } : prev);
  };

  const filtered = filter === 'all' ? routes
    : routes.filter(r => r.status.toLowerCase().replace(' ', '_') === filter || r.status === filter);

  if (selectedRoute) {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <AccountSidebar />
        <div className="flex-1 overflow-hidden flex flex-col">
          <RouteDetail
            route={selectedRoute}
            businessId={businessId}
            onBack={() => { setSelectedRoute(null); loadData(); }}
            onRouteUpdate={updateRouteStatus}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <AccountSidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Delivery Route Planner</h1>
              <p className="text-sm text-gray-500 mt-1">Plan and track farm delivery routes</p>
            </div>
            <button onClick={() => { setEditingRoute(null); setShowRouteModal(true); }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
              + New Route
            </button>
          </div>

          {/* Summary */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Active Routes', value: summary.active_routes, color: 'text-blue-600' },
                { label: 'Upcoming (7 days)', value: summary.upcoming_routes, color: 'text-purple-600' },
                { label: "Stops Today", value: summary.stops_today, color: 'text-orange-600' },
                { label: 'Delivered (7d)', value: summary.delivered_7d, color: 'text-green-600' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white rounded-xl p-4 border shadow-sm">
                  <div className={`text-2xl font-bold ${color}`}>{value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Filter tabs */}
          <div className="flex gap-2 mb-4">
            {['all','Planned','In Progress','Completed'].map(s => (
              <button key={s} onClick={() => setFilter(s === 'all' ? 'all' : s)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors
                  ${filter === s || (filter === 'all' && s === 'all')
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white hover:bg-gray-50'}`}>
                {s === 'all' ? 'All Routes' : s}
              </button>
            ))}
          </div>

          {/* Routes list */}
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-3">🚐</div>
              <div className="text-base font-medium">No routes found</div>
              <div className="text-sm mt-1">Create a route to get started</div>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(route => (
                <div key={route.route_id}
                  className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  <div className="flex items-center gap-4 p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{route.route_name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[route.status] || 'bg-gray-100 text-gray-700'}`}>
                          {route.status}
                        </span>
                      </div>
                      <div className="flex gap-4 text-xs text-gray-500 mt-1">
                        <span>📅 {route.route_date}</span>
                        {route.driver_name && <span>👤 {route.driver_name}</span>}
                        {route.vehicle_info && <span>🚐 {route.vehicle_info}</span>}
                      </div>
                    </div>

                    <div className="text-center flex-shrink-0">
                      <div className="text-lg font-bold text-gray-800">
                        {route.delivered_count}/{route.stop_count}
                      </div>
                      <div className="text-xs text-gray-400">stops delivered</div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => setSelectedRoute(route)}
                        className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
                        {route.status === 'In Progress' ? 'Manage' : 'View'}
                      </button>
                      <button onClick={() => { setEditingRoute(route); setShowRouteModal(true); }}
                        className="text-sm border rounded-lg px-3 py-1.5 hover:bg-gray-50">Edit</button>
                      <button onClick={() => deleteRoute(route.route_id)}
                        className="text-sm border border-red-200 text-red-600 rounded-lg px-2 py-1.5 hover:bg-red-50">✕</button>
                    </div>
                  </div>

                  {route.stop_count > 0 && (
                    <div className="px-4 pb-3">
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="bg-green-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${route.stop_count ? (route.delivered_count / route.stop_count) * 100 : 0}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showRouteModal && (
        <RouteModal initial={editingRoute}
          onSave={saveRoute}
          onClose={() => { setShowRouteModal(false); setEditingRoute(null); }} />
      )}
    </div>
  );
}
