// Ported from Oatmeal Farm Network (src/FarmSafety.jsx). Mechanical adaptations
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

const SEVERITY_COLOR = {
  Low:      { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
  Medium:   { bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
  High:     { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
  Critical: { bg: '#fce7f3', text: '#9d174d', border: '#f9a8d4' },
};

const STATUS_COLOR = {
  Open:                  { bg: '#fee2e2', text: '#991b1b' },
  'Under Investigation': { bg: '#fef9c3', text: '#854d0e' },
  Closed:                { bg: '#d1fae5', text: '#065f46' },
};

const HAZARD_COLORS = {
  'Flammable':       '#fee2e2',
  'Toxic':           '#fce7f3',
  'Corrosive':       '#fef9c3',
  'Oxidising':       '#e0f2fe',
  'Irritant':        '#ede9fe',
  'Environmental':   '#d1fae5',
  'Other':           '#f3f4f6',
};

function SeverityBadge({ level }) {
  const c = SEVERITY_COLOR[level] || { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' };
  return (
    <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
      className="text-xs font-medium px-2 py-0.5 rounded-full">
      {level}
    </span>
  );
}

function StatusBadge({ status }) {
  const c = STATUS_COLOR[status] || { bg: '#f3f4f6', text: '#374151' };
  return (
    <span style={{ background: c.bg, color: c.text }}
      className="text-xs font-medium px-2 py-0.5 rounded-full">
      {status}
    </span>
  );
}

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Incident Modal ────────────────────────────────────────────────────────────
function IncidentModal({ onClose, onSaved, bid }) {
  const [form, setForm] = useState({
    incident_date: new Date().toISOString().slice(0, 10),
    incident_type: 'Near Miss',
    severity: 'Low',
    location: '',
    description: '',
    injured_person: '',
    witness_names: '',
    immediate_action: '',
    corrective_action: '',
    reported_by: '',
    investigation_due: '',
    status: 'Open',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.description || !form.location) return;
    setSaving(true);
    await fetch(`${API}/api/farm-safety/incidents?business_id=${bid}`, {
      method: 'POST', headers: auth(), body: JSON.stringify(form),
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Log Safety Incident</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
              <input type="date" value={form.incident_date} onChange={e => set('incident_date', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Incident Type</label>
              <select value={form.incident_type} onChange={e => set('incident_type', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
                {['Near Miss','Injury','Property Damage','Environmental','Chemical Exposure','Fire','Other'].map(t => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Severity</label>
              <select value={form.severity} onChange={e => set('severity', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
                {['Low','Medium','High','Critical'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Location *</label>
              <input value={form.location} onChange={e => set('location', e.target.value)}
                placeholder="Block 3 / Shed B" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description *</label>
            <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Describe what happened…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Injured Person</label>
              <input value={form.injured_person} onChange={e => set('injured_person', e.target.value)}
                placeholder="Name (if applicable)" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Witnesses</label>
              <input value={form.witness_names} onChange={e => set('witness_names', e.target.value)}
                placeholder="Names separated by comma" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Immediate Action Taken</label>
            <textarea rows={2} value={form.immediate_action} onChange={e => set('immediate_action', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Corrective Action Required</label>
            <textarea rows={2} value={form.corrective_action} onChange={e => set('corrective_action', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Reported By</label>
              <input value={form.reported_by} onChange={e => set('reported_by', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Investigation Due</label>
              <input type="date" value={form.investigation_due} onChange={e => set('investigation_due', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
                {['Open','Under Investigation','Closed'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={save} disabled={saving || !form.description || !form.location}
            className="px-4 py-2 text-sm bg-gray-900 text-white rounded-xl hover:bg-gray-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Log Incident'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Checklist Run Modal ───────────────────────────────────────────────────────
function RunChecklistModal({ checklist, onClose, onSaved, bid }) {
  const items = JSON.parse(checklist.items_json || '[]');
  const [results, setResults] = useState(() => items.map(item => ({ item, pass: null, note: '' })));
  const [operator, setOperator] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const toggle = (i, pass) => setResults(r => r.map((x, j) => j === i ? { ...x, pass } : x));
  const setNote = (i, note) => setResults(r => r.map((x, j) => j === i ? { ...x, note } : x));

  const allAnswered = results.every(r => r.pass !== null);
  const overallPass = results.every(r => r.pass === true);

  const save = async () => {
    setSaving(true);
    await fetch(`${API}/api/farm-safety/checklists/${checklist.checklist_id}/run?business_id=${bid}`, {
      method: 'POST', headers: auth(),
      body: JSON.stringify({ operator, results_json: JSON.stringify(results), overall_pass: overallPass, notes }),
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{checklist.checklist_name}</h3>
            <p className="text-xs text-gray-500">{checklist.checklist_type}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Operator</label>
            <input value={operator} onChange={e => setOperator(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Your name" />
          </div>
          <div className="space-y-2">
            {results.map((r, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-3">
                <p className="text-sm text-gray-800 mb-2">{r.item}</p>
                <div className="flex gap-2 items-center">
                  <button onClick={() => toggle(i, true)}
                    className={`px-3 py-1 text-xs rounded-lg border font-medium ${r.pass === true ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 text-gray-600 hover:bg-green-50'}`}>
                    ✓ Pass
                  </button>
                  <button onClick={() => toggle(i, false)}
                    className={`px-3 py-1 text-xs rounded-lg border font-medium ${r.pass === false ? 'bg-red-500 text-white border-red-500' : 'border-gray-200 text-gray-600 hover:bg-red-50'}`}>
                    ✗ Fail
                  </button>
                  {r.pass === false && (
                    <input value={r.note} onChange={e => setNote(i, e.target.value)}
                      placeholder="Note…" className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-xs" />
                  )}
                </div>
              </div>
            ))}
          </div>
          {allAnswered && (
            <div className={`rounded-xl px-4 py-3 text-sm font-medium text-center ${overallPass ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              Overall: {overallPass ? '✓ PASS' : '✗ FAIL'}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={save} disabled={saving || !allAnswered || !operator}
            className="px-4 py-2 text-sm bg-gray-900 text-white rounded-xl hover:bg-gray-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Submit Run'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── New Checklist Modal ───────────────────────────────────────────────────────
function NewChecklistModal({ onClose, onSaved, bid }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('Daily Pre-Start');
  const [items, setItems] = useState(['']);
  const [saving, setSaving] = useState(false);

  const addItem = () => setItems(i => [...i, '']);
  const setItem = (i, v) => setItems(arr => arr.map((x, j) => j === i ? v : x));
  const removeItem = (i) => setItems(arr => arr.filter((_, j) => j !== i));

  const save = async () => {
    const validItems = items.filter(x => x.trim());
    if (!name || validItems.length === 0) return;
    setSaving(true);
    await fetch(`${API}/api/farm-safety/checklists?business_id=${bid}`, {
      method: 'POST', headers: auth(),
      body: JSON.stringify({ checklist_name: name, checklist_type: type, items_json: JSON.stringify(validItems) }),
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">New Checklist</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Checklist Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Tractor Pre-Start Check"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
            <select value={type} onChange={e => setType(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
              {['Daily Pre-Start','Weekly Inspection','Monthly Safety Review','Chemical Handling','Emergency Drill','Other'].map(t => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Checklist Items</label>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input value={item} onChange={e => setItem(i, e.target.value)}
                    placeholder={`Item ${i + 1}`}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                  {items.length > 1 && (
                    <button onClick={() => removeItem(i)} className="text-gray-400 hover:text-red-500 px-2">×</button>
                  )}
                </div>
              ))}
              <button onClick={addItem} className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1">
                <span>+</span> Add item
              </button>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={save} disabled={saving || !name || items.filter(x => x.trim()).length === 0}
            className="px-4 py-2 text-sm bg-gray-900 text-white rounded-xl hover:bg-gray-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Create Checklist'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SDS Modal ─────────────────────────────────────────────────────────────────
function SDSModal({ onClose, onSaved, bid }) {
  const [form, setForm] = useState({
    product_name: '', manufacturer: '', hazard_class: 'Irritant',
    active_ingredient: '', ppe_required: '', first_aid: '',
    storage_reqs: '', emergency_contact: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.product_name) return;
    setSaving(true);
    await fetch(`${API}/api/farm-safety/sds?business_id=${bid}`, {
      method: 'POST', headers: auth(), body: JSON.stringify(form),
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Add Safety Data Sheet</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Product Name *</label>
              <input value={form.product_name} onChange={e => set('product_name', e.target.value)}
                placeholder="e.g. Glyphosate 360"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Manufacturer</label>
              <input value={form.manufacturer} onChange={e => set('manufacturer', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Hazard Class</label>
              <select value={form.hazard_class} onChange={e => set('hazard_class', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
                {Object.keys(HAZARD_COLORS).map(h => <option key={h}>{h}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Active Ingredient</label>
              <input value={form.active_ingredient} onChange={e => set('active_ingredient', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">PPE Required</label>
            <input value={form.ppe_required} onChange={e => set('ppe_required', e.target.value)}
              placeholder="e.g. Gloves, goggles, respirator"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">First Aid</label>
            <textarea rows={2} value={form.first_aid} onChange={e => set('first_aid', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Storage Requirements</label>
            <input value={form.storage_reqs} onChange={e => set('storage_reqs', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Emergency Contact</label>
            <input value={form.emergency_contact} onChange={e => set('emergency_contact', e.target.value)}
              placeholder="Poisons hotline / manufacturer number"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={save} disabled={saving || !form.product_name}
            className="px-4 py-2 text-sm bg-gray-900 text-white rounded-xl hover:bg-gray-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Add SDS'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Incidents Tab ─────────────────────────────────────────────────────────────
function IncidentsTab({ bid }) {
  const [incidents, setIncidents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/api/farm-safety/incidents?business_id=${bid}`, { headers: auth() }).then(r => r.json()),
      fetch(`${API}/api/farm-safety/summary?business_id=${bid}`, { headers: auth() }).then(r => r.json()),
    ])
      .then(([inc, sum]) => { setIncidents(inc); setSummary(sum); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (bid) load(); }, [bid]);

  const updateStatus = async (id, status) => {
    await fetch(`${API}/api/farm-safety/incidents/${id}/status?business_id=${bid}`, {
      method: 'PATCH', headers: auth(), body: JSON.stringify({ status }),
    });
    load();
  };

  const del = async (id) => {
    if (!confirm('Delete this incident?')) return;
    await fetch(`${API}/api/farm-safety/incidents/${id}?business_id=${bid}`, {
      method: 'DELETE', headers: auth(),
    });
    load();
  };

  return (
    <>
      {showModal && (
        <IncidentModal bid={bid} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />
      )}

      {/* Summary banner */}
      {summary && (
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Open Incidents', value: summary.open_incidents ?? 0, color: '#fee2e2', text: '#991b1b' },
            { label: 'Under Investigation', value: summary.under_investigation ?? 0, color: '#fef9c3', text: '#854d0e' },
            { label: 'Closed (12 mo)', value: summary.closed_12mo ?? 0, color: '#d1fae5', text: '#065f46' },
            { label: 'Overdue Reviews', value: summary.overdue_investigations ?? 0, color: summary.overdue_investigations > 0 ? '#fee2e2' : '#f3f4f6', text: summary.overdue_investigations > 0 ? '#991b1b' : '#374151' },
          ].map(s => (
            <div key={s.label} style={{ background: s.color }} className="rounded-xl p-3 text-center">
              <div style={{ color: s.text }} className="text-2xl font-bold">{s.value}</div>
              <div style={{ color: s.text }} className="text-xs font-medium opacity-80">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Incident Register</h3>
        <button onClick={() => setShowModal(true)}
          className="px-3 py-1.5 text-xs bg-gray-900 text-white rounded-xl hover:bg-gray-700">
          + Log Incident
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : incidents.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">🦺</div>
          <p className="text-sm">No incidents recorded. Stay safe!</p>
          <button onClick={() => setShowModal(true)} className="mt-3 text-sm text-gray-600 underline">
            Log your first incident
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Severity</th>
                <th className="text-left px-4 py-3 font-medium">Location</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Inv. Due</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {incidents.map(inc => (
                <tr key={inc.incident_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">{fmt(inc.incident_date)}</td>
                  <td className="px-4 py-3 text-gray-800 font-medium">{inc.incident_type}</td>
                  <td className="px-4 py-3"><SeverityBadge level={inc.severity} /></td>
                  <td className="px-4 py-3 text-gray-600">{inc.location}</td>
                  <td className="px-4 py-3">
                    <select value={inc.status}
                      onChange={e => updateStatus(inc.incident_id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white">
                      {['Open','Under Investigation','Closed'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{fmt(inc.investigation_due)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => del(inc.incident_id)} className="text-gray-300 hover:text-red-500 text-xs">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ── Checklists Tab ────────────────────────────────────────────────────────────
function ChecklistsTab({ bid }) {
  const [checklists, setChecklists] = useState([]);
  const [runs, setRuns] = useState({});
  const [showNewModal, setShowNewModal] = useState(false);
  const [runModal, setRunModal] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadChecklists = () => {
    setLoading(true);
    fetch(`${API}/api/farm-safety/checklists?business_id=${bid}`, { headers: auth() })
      .then(r => r.json())
      .then(setChecklists)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (bid) loadChecklists(); }, [bid]);

  const loadRuns = (checklistId) => {
    fetch(`${API}/api/farm-safety/checklists/${checklistId}/runs?business_id=${bid}`, { headers: auth() })
      .then(r => r.json())
      .then(data => setRuns(r => ({ ...r, [checklistId]: data })))
      .catch(() => {});
  };

  const toggleExpand = (id) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!runs[id]) loadRuns(id);
  };

  const del = async (id) => {
    if (!confirm('Delete this checklist and all its history?')) return;
    await fetch(`${API}/api/farm-safety/checklists/${id}?business_id=${bid}`, {
      method: 'DELETE', headers: auth(),
    });
    loadChecklists();
  };

  return (
    <>
      {showNewModal && (
        <NewChecklistModal bid={bid} onClose={() => setShowNewModal(false)}
          onSaved={() => { setShowNewModal(false); loadChecklists(); }} />
      )}
      {runModal && (
        <RunChecklistModal checklist={runModal} bid={bid}
          onClose={() => setRunModal(null)}
          onSaved={() => { setRunModal(null); setRuns(r => ({ ...r, [runModal.checklist_id]: undefined })); loadRuns(runModal.checklist_id); }} />
      )}

      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Safety Checklists</h3>
        <button onClick={() => setShowNewModal(true)}
          className="px-3 py-1.5 text-xs bg-gray-900 text-white rounded-xl hover:bg-gray-700">
          + New Checklist
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : checklists.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-sm">No checklists yet. Create a daily pre-start or safety inspection checklist.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {checklists.map(cl => {
            const items = JSON.parse(cl.items_json || '[]');
            const isExpanded = expanded === cl.checklist_id;
            const clRuns = runs[cl.checklist_id] || [];
            return (
              <div key={cl.checklist_id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="flex items-center px-5 py-4 gap-3">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-sm">{cl.checklist_name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{cl.checklist_type} · {items.length} items</div>
                  </div>
                  <button onClick={() => setRunModal(cl)}
                    className="px-3 py-1.5 text-xs bg-gray-900 text-white rounded-xl hover:bg-gray-700">
                    ▶ Run
                  </button>
                  <button onClick={() => toggleExpand(cl.checklist_id)}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600">
                    {isExpanded ? 'Hide History' : 'History'}
                  </button>
                  <button onClick={() => del(cl.checklist_id)} className="text-gray-300 hover:text-red-500 text-xs">
                    Delete
                  </button>
                </div>
                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-3">
                    {clRuns.length === 0 ? (
                      <p className="text-xs text-gray-400">No runs recorded yet.</p>
                    ) : (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-gray-400 uppercase tracking-wide text-left">
                            <th className="pb-2 font-medium">Date</th>
                            <th className="pb-2 font-medium">Operator</th>
                            <th className="pb-2 font-medium">Result</th>
                            <th className="pb-2 font-medium">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {clRuns.map(run => (
                            <tr key={run.run_id}>
                              <td className="py-2 text-gray-600">{fmt(run.run_date)}</td>
                              <td className="py-2 text-gray-800">{run.operator}</td>
                              <td className="py-2">
                                <span className={`font-medium ${run.overall_pass ? 'text-green-600' : 'text-red-600'}`}>
                                  {run.overall_pass ? '✓ Pass' : '✗ Fail'}
                                </span>
                              </td>
                              <td className="py-2 text-gray-500">{run.notes || '—'}</td>
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
      )}
    </>
  );
}

// ── Chemical SDS Tab ──────────────────────────────────────────────────────────
function SDSTab({ bid }) {
  const [sdsList, setSdsList] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch(`${API}/api/farm-safety/sds?business_id=${bid}`, { headers: auth() })
      .then(r => r.json())
      .then(setSdsList)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (bid) load(); }, [bid]);

  const del = async (id) => {
    if (!confirm('Delete this SDS record?')) return;
    await fetch(`${API}/api/farm-safety/sds/${id}?business_id=${bid}`, {
      method: 'DELETE', headers: auth(),
    });
    load();
  };

  const filtered = sdsList.filter(s =>
    !search || s.product_name.toLowerCase().includes(search.toLowerCase()) ||
    (s.active_ingredient || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {showModal && (
        <SDSModal bid={bid} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />
      )}

      <div className="flex justify-between items-center mb-3 gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search products or ingredients…"
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm" />
        <button onClick={() => setShowModal(true)}
          className="px-3 py-2 text-xs bg-gray-900 text-white rounded-xl hover:bg-gray-700 shrink-0">
          + Add SDS
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">⚗️</div>
          <p className="text-sm">{search ? 'No matching products found.' : 'No chemical SDS records yet.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(sds => {
            const isExpanded = expanded === sds.sds_id;
            const hazardBg = HAZARD_COLORS[sds.hazard_class] || '#f3f4f6';
            return (
              <div key={sds.sds_id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="flex items-center px-5 py-4 gap-3">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-sm">{sds.product_name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {sds.manufacturer || 'Unknown manufacturer'}
                      {sds.active_ingredient && ` · ${sds.active_ingredient}`}
                    </div>
                  </div>
                  <span style={{ background: hazardBg }} className="text-xs font-medium px-2 py-0.5 rounded-full text-gray-700">
                    {sds.hazard_class}
                  </span>
                  <button onClick={() => setExpanded(isExpanded ? null : sds.sds_id)}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600">
                    {isExpanded ? 'Hide' : 'View'}
                  </button>
                  <button onClick={() => del(sds.sds_id)} className="text-gray-300 hover:text-red-500 text-xs">
                    Delete
                  </button>
                </div>
                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-4 grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                    {[
                      ['PPE Required', sds.ppe_required],
                      ['Emergency Contact', sds.emergency_contact],
                      ['First Aid', sds.first_aid],
                      ['Storage', sds.storage_reqs],
                    ].map(([label, val]) => val ? (
                      <div key={label}>
                        <div className="text-xs font-medium text-gray-500 mb-0.5">{label}</div>
                        <div className="text-gray-800">{val}</div>
                      </div>
                    ) : null)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FarmSafety() {
  const [params] = useSearchParams();
  const bid = params.get('BusinessID');
  const [tab, setTab] = useState('incidents');

  const TABS = [
    { key: 'incidents',  label: 'Incidents' },
    { key: 'checklists', label: 'Checklists' },
    { key: 'sds',        label: 'Chemical SDS' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">Farm Safety & Incident Log</h1>
        <p className="text-sm text-gray-500 mt-0.5">Incidents, safety checklists, and chemical safety data sheets</p>
      </div>

      <div className="px-6 pt-4">
        <div className="flex gap-1 border-b border-gray-200">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 max-w-5xl">
        {tab === 'incidents'  && <IncidentsTab bid={bid} />}
        {tab === 'checklists' && <ChecklistsTab bid={bid} />}
        {tab === 'sds'        && <SDSTab bid={bid} />}
      </div></div>
  );
}
