// Ported from Oatmeal Farm Network (src/ComplianceAudit.jsx). Mechanical adaptations
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

const STANDARDS = ['GlobalGAP','SQF','Organic','HACCP','BRC','ISO 22000','Other'];
const AUDIT_STATUSES = ['Scheduled','In Progress','Passed','Failed','Pending CAR'];
const CAR_STATUSES = ['Open','In Progress','Closed'];
const SEVERITIES = ['Minor','Major','Critical'];

const STD_COLOR = {
  'GlobalGAP': 'bg-green-100 text-green-800',
  'SQF':       'bg-blue-100 text-blue-800',
  'Organic':   'bg-emerald-100 text-emerald-800',
  'HACCP':     'bg-orange-100 text-orange-800',
  'BRC':       'bg-purple-100 text-purple-800',
  'ISO 22000': 'bg-indigo-100 text-indigo-800',
  'Other':     'bg-gray-100 text-gray-700',
};
const AUDIT_STATUS_COLOR = {
  'Scheduled':   'bg-blue-100 text-blue-800',
  'In Progress': 'bg-yellow-100 text-yellow-800',
  'Passed':      'bg-green-100 text-green-800',
  'Failed':      'bg-red-100 text-red-800',
  'Pending CAR': 'bg-orange-100 text-orange-800',
};
const SEV_COLOR = {
  'Minor':    'bg-yellow-100 text-yellow-800',
  'Major':    'bg-orange-100 text-orange-800',
  'Critical': 'bg-red-100 text-red-800',
};
const CAR_STATUS_COLOR = {
  'Open':        'bg-red-100 text-red-800',
  'In Progress': 'bg-yellow-100 text-yellow-800',
  'Closed':      'bg-green-100 text-green-800',
};

function Badge({ text, colorMap }) {
  const cls = colorMap[text] || 'bg-gray-100 text-gray-700';
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{text}</span>;
}

// ── Audit Modal ───────────────────────────────────────────────────────────────
function AuditModal({ onClose, onSave, initial = {} }) {
  const [form, setForm] = useState({
    standard_name: initial.standard_name || 'GlobalGAP',
    audit_name: initial.audit_name || '',
    audit_date: initial.audit_date ? initial.audit_date.slice(0,10) : '',
    auditor_name: initial.auditor_name || '',
    status: initial.status || 'Scheduled',
    score: initial.score ?? '',
    notes: initial.notes || '',
  });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">{initial.audit_id ? 'Edit Audit' : 'New Audit'}</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Standard</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.standard_name} onChange={set('standard_name')}>
                {STANDARDS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.status} onChange={set('status')}>
                {AUDIT_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Audit Name *</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.audit_name} onChange={set('audit_name')} placeholder="e.g. Annual GlobalGAP Certification 2026" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Audit Date *</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.audit_date} onChange={set('audit_date')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Score (%)</label>
              <input type="number" min="0" max="100" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.score} onChange={set('score')} placeholder="0-100" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Auditor / Body</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.auditor_name} onChange={set('auditor_name')} placeholder="Certifying body or auditor name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows={3} className="w-full border rounded-lg px-3 py-2 text-sm" value={form.notes} onChange={set('notes')} />
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

// ── Checklist Builder Modal ───────────────────────────────────────────────────
function ChecklistModal({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [standard, setStandard] = useState('GlobalGAP');
  const [items, setItems] = useState(['']);
  const addItem = () => setItems(i => [...i, '']);
  const updateItem = (idx, val) => setItems(i => i.map((x, j) => j === idx ? val : x));
  const removeItem = idx => setItems(i => i.filter((_, j) => j !== idx));
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex-shrink-0">
          <h2 className="text-lg font-semibold">New Checklist</h2>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Standard</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={standard} onChange={e => setStandard(e.target.value)}>
                {STANDARDS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Checklist Name *</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Pre-Audit Internal Check" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Checklist Items</label>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input className="flex-1 border rounded-lg px-3 py-2 text-sm" value={item} onChange={e => updateItem(i, e.target.value)} placeholder={`Item ${i + 1}`} />
                  {items.length > 1 && (
                    <button className="text-red-400 hover:text-red-600 text-sm px-2" onClick={() => removeItem(i)}>✕</button>
                  )}
                </div>
              ))}
            </div>
            <button className="mt-2 text-sm text-[#3D6B34] hover:underline" onClick={addItem}>+ Add item</button>
          </div>
        </div>
        <div className="p-6 border-t flex justify-end gap-3 flex-shrink-0">
          <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 text-sm bg-[#3D6B34] text-white rounded-lg hover:bg-[#2d5227]"
            onClick={() => onSave({ checklist_name: name, standard_name: standard, items_json: JSON.stringify(items.filter(Boolean)) })}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Run Checklist Modal ───────────────────────────────────────────────────────
function RunChecklistModal({ checklist, audits, onClose, onSave }) {
  const items = JSON.parse(checklist.items_json || '[]');
  const [results, setResults] = useState(items.map(text => ({ text, pass: true })));
  const [operator, setOperator] = useState('');
  const [auditId, setAuditId] = useState('');
  const [notes, setNotes] = useState('');
  const toggle = idx => setResults(r => r.map((x, j) => j === idx ? { ...x, pass: !x.pass } : x));
  const nonConf = results.filter(r => !r.pass).length;
  const overallPass = nonConf === 0;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex-shrink-0">
          <h2 className="text-lg font-semibold">Run: {checklist.checklist_name}</h2>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Operator</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={operator} onChange={e => setOperator(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link to Audit (optional)</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={auditId} onChange={e => setAuditId(e.target.value)}>
                <option value="">— None —</option>
                {audits.map(a => <option key={a.audit_id} value={a.audit_id}>{a.audit_name}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            {results.map((r, i) => (
              <label key={i} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${r.pass ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <input type="checkbox" checked={r.pass} onChange={() => toggle(i)} className="w-4 h-4 rounded" />
                <span className="text-sm flex-1">{r.text}</span>
                <span className={`text-xs font-medium ${r.pass ? 'text-green-700' : 'text-red-700'}`}>{r.pass ? 'Pass' : 'Fail'}</span>
              </label>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <div className={`p-3 rounded-lg text-sm font-medium ${overallPass ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            Overall: {overallPass ? 'Pass' : `Fail — ${nonConf} non-conformance${nonConf !== 1 ? 's' : ''}`}
          </div>
        </div>
        <div className="p-6 border-t flex justify-end gap-3 flex-shrink-0">
          <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 text-sm bg-[#3D6B34] text-white rounded-lg hover:bg-[#2d5227]"
            onClick={() => onSave({
              results_json: JSON.stringify(results),
              overall_pass: overallPass,
              non_conformances: nonConf,
              operator, notes,
              audit_id: auditId || null,
            })}>
            Save Run
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CAR Modal ─────────────────────────────────────────────────────────────────
function CARModal({ audits, onClose, onSave }) {
  const [form, setForm] = useState({
    audit_id: '', finding: '', severity: 'Minor',
    assigned_to: '', due_date: '', notes: '',
  });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">New Corrective Action</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Linked Audit</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.audit_id} onChange={set('audit_id')}>
              <option value="">— None —</option>
              {audits.map(a => <option key={a.audit_id} value={a.audit_id}>{a.audit_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Finding / Non-Conformance *</label>
            <textarea rows={3} className="w-full border rounded-lg px-3 py-2 text-sm" value={form.finding} onChange={set('finding')} placeholder="Describe the non-conformance found" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.severity} onChange={set('severity')}>
                {SEVERITIES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.assigned_to} onChange={set('assigned_to')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.due_date} onChange={set('due_date')} />
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

// ── Audits Tab ────────────────────────────────────────────────────────────────
function AuditsTab({ bid }) {
  const [audits, setAudits] = useState([]);
  const [modal, setModal] = useState(null);
  const load = useCallback(() =>
    fetch(`${API}/api/compliance/audits?business_id=${bid}`).then(r => r.json()).then(setAudits), [bid]);
  useEffect(() => { load(); }, [load]);

  const save = async form => {
    const method = form.audit_id ? 'PUT' : 'POST';
    const url = form.audit_id
      ? `${API}/api/compliance/audits/${form.audit_id}?business_id=${bid}`
      : `${API}/api/compliance/audits?business_id=${bid}`;
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setModal(null); load();
  };
  const del = async id => {
    if (!confirm('Delete this audit?')) return;
    await fetch(`${API}/api/compliance/audits/${id}?business_id=${bid}`, { method: 'DELETE' });
    load();
  };
  const updateStatus = async (id, status) => {
    await fetch(`${API}/api/compliance/audits/${id}/status?business_id=${bid}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    });
    load();
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setModal('new')} className="px-4 py-2 bg-[#3D6B34] text-white text-sm rounded-lg hover:bg-[#2d5227]">
          + New Audit
        </button>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Standard','Audit Name','Date','Auditor','Score','Status',''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {audits.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">No audits recorded</td></tr>
            )}
            {audits.map(a => (
              <tr key={a.audit_id} className="hover:bg-gray-50">
                <td className="px-4 py-3"><Badge text={a.standard_name} colorMap={STD_COLOR} /></td>
                <td className="px-4 py-3 font-medium">{a.audit_name}</td>
                <td className="px-4 py-3 text-gray-600">{a.audit_date?.slice(0,10)}</td>
                <td className="px-4 py-3 text-gray-600">{a.auditor_name || '—'}</td>
                <td className="px-4 py-3">{a.score != null ? `${a.score}%` : '—'}</td>
                <td className="px-4 py-3">
                  <select className="border rounded px-2 py-1 text-xs" value={a.status}
                    onChange={e => updateStatus(a.audit_id, e.target.value)}>
                    {AUDIT_STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button className="text-blue-500 hover:underline text-xs" onClick={() => setModal(a)}>Edit</button>
                    <button className="text-red-400 hover:text-red-600 text-xs" onClick={() => del(a.audit_id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal === 'new' && <AuditModal onClose={() => setModal(null)} onSave={save} />}
      {modal && modal !== 'new' && <AuditModal initial={modal} onClose={() => setModal(null)} onSave={d => save({ ...d, audit_id: modal.audit_id })} />}
    </div>
  );
}

// ── Checklists Tab ────────────────────────────────────────────────────────────
function ChecklistsTab({ bid }) {
  const [lists, setLists] = useState([]);
  const [audits, setAudits] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [runs, setRuns] = useState({});
  const [modal, setModal] = useState(null);
  const [runModal, setRunModal] = useState(null);

  const load = useCallback(() =>
    fetch(`${API}/api/compliance/checklists?business_id=${bid}`).then(r => r.json()).then(setLists), [bid]);
  const loadAudits = useCallback(() =>
    fetch(`${API}/api/compliance/audits?business_id=${bid}`).then(r => r.json()).then(setAudits), [bid]);

  useEffect(() => { load(); loadAudits(); }, [load, loadAudits]);

  const loadRuns = async id => {
    const data = await fetch(`${API}/api/compliance/checklists/${id}/runs?business_id=${bid}`).then(r => r.json());
    setRuns(r => ({ ...r, [id]: data }));
    setExpanded(id);
  };

  const saveChecklist = async form => {
    await fetch(`${API}/api/compliance/checklists?business_id=${bid}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    setModal(null); load();
  };

  const saveRun = async form => {
    await fetch(`${API}/api/compliance/checklists/${runModal.checklist_id}/run?business_id=${bid}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    setRunModal(null);
    loadRuns(runModal.checklist_id);
  };

  const del = async id => {
    if (!confirm('Delete this checklist?')) return;
    await fetch(`${API}/api/compliance/checklists/${id}?business_id=${bid}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setModal(true)} className="px-4 py-2 bg-[#3D6B34] text-white text-sm rounded-lg hover:bg-[#2d5227]">
          + New Checklist
        </button>
      </div>
      <div className="space-y-3">
        {lists.length === 0 && (
          <div className="bg-white rounded-xl border p-8 text-center text-gray-400 text-sm">No checklists created</div>
        )}
        {lists.map(cl => {
          const clRuns = runs[cl.checklist_id];
          const isExpanded = expanded === cl.checklist_id;
          const items = JSON.parse(cl.items_json || '[]');
          return (
            <div key={cl.checklist_id} className="bg-white rounded-xl border overflow-hidden">
              <div className="flex items-center justify-between px-4 py-4">
                <div className="flex items-center gap-3">
                  <Badge text={cl.standard_name} colorMap={STD_COLOR} />
                  <span className="font-medium text-sm">{cl.checklist_name}</span>
                  <span className="text-xs text-gray-400">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                    onClick={() => setRunModal(cl)}>Run</button>
                  <button className="text-xs text-gray-400 hover:text-gray-600"
                    onClick={() => isExpanded ? setExpanded(null) : loadRuns(cl.checklist_id)}>
                    {isExpanded ? 'Hide history ▲' : 'Show history ▼'}
                  </button>
                  <button className="text-red-400 hover:text-red-600 text-xs" onClick={() => del(cl.checklist_id)}>Delete</button>
                </div>
              </div>
              {isExpanded && clRuns && (
                <div className="border-t bg-gray-50 px-4 py-3">
                  {clRuns.length === 0 ? (
                    <p className="text-xs text-gray-400 py-2">No runs yet</p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-500">
                          {['Date','Operator','Result','Non-Conf','Notes'].map(h => (
                            <th key={h} className="text-left pb-2 pr-4">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {clRuns.map(r => (
                          <tr key={r.run_id}>
                            <td className="py-2 pr-4">{r.run_date?.slice(0,10)}</td>
                            <td className="py-2 pr-4">{r.operator || '—'}</td>
                            <td className="py-2 pr-4">
                              <span className={`px-2 py-0.5 rounded-full font-medium ${r.overall_pass ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {r.overall_pass ? 'Pass' : 'Fail'}
                              </span>
                            </td>
                            <td className="py-2 pr-4">{r.non_conformances ?? 0}</td>
                            <td className="py-2">{r.notes || '—'}</td>
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
      {modal && <ChecklistModal onClose={() => setModal(null)} onSave={saveChecklist} />}
      {runModal && <RunChecklistModal checklist={runModal} audits={audits} onClose={() => setRunModal(null)} onSave={saveRun} />}
    </div>
  );
}

// ── Corrective Actions Tab ────────────────────────────────────────────────────
function CARsTab({ bid }) {
  const [cars, setCars] = useState([]);
  const [audits, setAudits] = useState([]);
  const [modal, setModal] = useState(false);

  const load = useCallback(() =>
    fetch(`${API}/api/compliance/corrective-actions?business_id=${bid}`).then(r => r.json()).then(setCars), [bid]);
  const loadAudits = useCallback(() =>
    fetch(`${API}/api/compliance/audits?business_id=${bid}`).then(r => r.json()).then(setAudits), [bid]);

  useEffect(() => { load(); loadAudits(); }, [load, loadAudits]);

  const save = async form => {
    await fetch(`${API}/api/compliance/corrective-actions?business_id=${bid}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    setModal(false); load();
  };
  const updateStatus = async (id, status) => {
    await fetch(`${API}/api/compliance/corrective-actions/${id}/status?business_id=${bid}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    });
    load();
  };
  const del = async id => {
    if (!confirm('Delete this corrective action?')) return;
    await fetch(`${API}/api/compliance/corrective-actions/${id}?business_id=${bid}`, { method: 'DELETE' });
    load();
  };
  const today = new Date().toISOString().slice(0,10);
  const auditMap = Object.fromEntries(audits.map(a => [a.audit_id, a.audit_name]));

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setModal(true)} className="px-4 py-2 bg-[#3D6B34] text-white text-sm rounded-lg hover:bg-[#2d5227]">
          + New CAR
        </button>
      </div>
      <div className="space-y-3">
        {cars.length === 0 && (
          <div className="bg-white rounded-xl border p-8 text-center text-gray-400 text-sm">No corrective actions recorded</div>
        )}
        {cars.map(c => {
          const overdue = c.status !== 'Closed' && c.due_date && c.due_date.slice(0,10) < today;
          return (
            <div key={c.car_id} className={`bg-white rounded-xl border p-4 ${overdue ? 'border-red-300' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge text={c.severity} colorMap={SEV_COLOR} />
                    <Badge text={c.status} colorMap={CAR_STATUS_COLOR} />
                    {overdue && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Overdue</span>}
                    {c.audit_id && <span className="text-xs text-gray-400">Audit: {auditMap[c.audit_id] || c.audit_id}</span>}
                  </div>
                  <p className="text-sm text-gray-800 mb-2">{c.finding}</p>
                  <div className="flex gap-4 text-xs text-gray-500">
                    {c.assigned_to && <span>Assigned: <strong>{c.assigned_to}</strong></span>}
                    {c.due_date && <span className={overdue ? 'text-red-600 font-medium' : ''}>Due: {c.due_date.slice(0,10)}</span>}
                  </div>
                  {c.notes && <p className="text-xs text-gray-400 mt-1">{c.notes}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <select className="border rounded px-2 py-1 text-xs" value={c.status}
                    onChange={e => updateStatus(c.car_id, e.target.value)}>
                    {CAR_STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <button className="text-red-400 hover:text-red-600 text-xs" onClick={() => del(c.car_id)}>Delete</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {modal && <CARModal audits={audits} onClose={() => setModal(false)} onSave={save} />}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ComplianceAudit() {
  const [searchParams] = useSearchParams();
  const bid = searchParams.get('BusinessID') || '';
  const [tab, setTab] = useState('audits');
  const [summary, setSummary] = useState({});

  useEffect(() => {
    if (!bid) return;
    fetch(`${API}/api/compliance/summary?business_id=${bid}`).then(r => r.json()).then(setSummary);
  }, [bid]);

  const tabs = [
    { key: 'audits', label: 'Audits' },
    { key: 'checklists', label: 'Checklists' },
    { key: 'cars', label: 'Corrective Actions' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Compliance & Audit Manager</h1>
            <p className="text-sm text-gray-500 mt-1">Track certifications, run checklists, and manage corrective actions</p>
          </div>
        </div>

        {/* Summary banner */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Scheduled', value: summary.scheduled ?? 0, color: 'text-blue-600' },
            { label: 'Passed', value: summary.passed ?? 0, color: 'text-green-600' },
            { label: 'Failed', value: summary.failed ?? 0, color: 'text-red-600' },
            { label: 'Open CARs', value: summary.open_cars ?? 0, color: 'text-orange-600' },
            { label: 'Overdue CARs', value: summary.overdue_cars ?? 0, color: 'text-red-700' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border p-4 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-200 rounded-lg p-1 mb-6 w-fit">
          {tabs.map(t => (
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
            {tab === 'audits' && <AuditsTab bid={bid} />}
            {tab === 'checklists' && <ChecklistsTab bid={bid} />}
            {tab === 'cars' && <CARsTab bid={bid} />}
          </>
        )}
      </main><Footer />
    </div>
  );
}
