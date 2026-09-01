// Ported from Oatmeal Farm Network (src/Permissions.jsx). The page logic is
// unchanged; only the router package, the AccountLayout path, the API base
// env var and the token accessor differ. The LOA backend already serves the
// same /api/rbac and /api/audit routes this calls.
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router';
import AccountLayout from '../components/AccountLayout';
import { getToken } from '../lib/auth';
import { useAccount } from '../lib/AccountContext';

const API_URL = import.meta.env.VITE_LIVESTOCK_API_URL || '';

const FEATURE_KEYS = [
  'precision_ag','farm_kpi','nursery_management','outgrower_management','procurement',
  'work_orders','packhouse_qc','plant_tagging','export_compliance',
  'livestock','farm_2_table','products','services','events','accounting',
  'my_website','blog','certifications','supplier_directory','csa_management',
  'job_board','land_leasing','grants_programs','education_center','cold_chain',
  'farmer_settlement','supply_chain','hr_management','farm_inputs',
  'crop_budgets','traceability','food_aggregation','forums','testimonials',
];

const SEVERITY_COLOR = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-green-100 text-green-700',
};

const ACTION_COLOR = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  VIEW:   'bg-gray-100 text-gray-600',
};

function apiFetch(path, options = {}) {
  const token = getToken();
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  }).then(async r => {
    // Throw on error responses. Previously this returned the error body
    // ({detail: "..."}) straight into list state, so a later .map() threw and
    // took the whole page down to a blank screen.
    let data = null;
    try { data = await r.json(); } catch { data = null; }
    if (!r.ok) {
      const msg = (data && (data.detail || data.message)) || `Request failed (${r.status})`;
      throw new Error(typeof msg === 'string' ? msg : `Request failed (${r.status})`);
    }
    return data;
  });
}

// Never let a non-array response reach .map()
const asArray = (v) => (Array.isArray(v) ? v : []);

// ─── Roles Tab ────────────────────────────────────────────────────────────────

function RolesTab({ businessId }) {
  const [roles, setRoles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [perms, setPerms] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ RoleName: '', Description: '' });
  const [saving, setSaving] = useState(false);
  const [seeded, setSeeded] = useState(false);

  const [loadError, setLoadError] = useState('');
  const loadRoles = useCallback(() =>
    apiFetch(`/api/rbac/roles?business_id=${businessId}`)
      .then(d => { setRoles(asArray(d)); setLoadError(''); })
      .catch(e => { setRoles([]); setLoadError(e.message || 'Could not load roles.'); }),
    [businessId]);

  useEffect(() => { loadRoles(); }, [loadRoles]);

  function selectRole(role) {
    setSelected(role);
    apiFetch(`/api/rbac/roles/${role.RoleID}/permissions?business_id=${businessId}`)
      .then(setPerms);
  }

  async function seedDefaults() {
    await apiFetch(`/api/rbac/roles/seed-defaults?business_id=${businessId}`, { method: 'POST' });
    setSeeded(true);
    loadRoles();
  }

  async function createRole() {
    setSaving(true);
    await apiFetch('/api/rbac/roles', {
      method: 'POST',
      body: JSON.stringify({ business_id: businessId, ...form }),
    });
    setForm({ RoleName: '', Description: '' });
    setShowCreate(false);
    setSaving(false);
    loadRoles();
  }

  async function deleteRole(roleId) {
    if (!confirm('Delete this role?')) return;
    await apiFetch(`/api/rbac/roles/${roleId}?business_id=${businessId}`, { method: 'DELETE' });
    if (selected?.RoleID === roleId) setSelected(null);
    loadRoles();
  }

  async function togglePerm(fk, field, val) {
    const existing = perms.find(p => p.FeatureKey === fk);
    const base = existing
      ? { can_view: existing.CanView, can_edit: existing.CanEdit, can_delete: existing.CanDelete }
      : { can_view: false, can_edit: false, can_delete: false };
    base[field] = val;
    await apiFetch(`/api/rbac/roles/${selected.RoleID}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({
        business_id: businessId,
        permissions: [{ feature_key: fk, ...base }],
      }),
    });
    apiFetch(`/api/rbac/roles/${selected.RoleID}/permissions?business_id=${businessId}`)
      .then(setPerms);
  }

  function perm(fk, field) {
    const p = perms.find(x => x.FeatureKey === fk);
    if (!p) return false;
    return field === 'view' ? !!p.CanView : field === 'edit' ? !!p.CanEdit : !!p.CanDelete;
  }

  return (
    <div className="flex gap-6">
      {/* Role list */}
      <div className="w-64 shrink-0">
        {loadError && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            {loadError}
          </div>
        )}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700">Roles ({roles.length})</span>
          <div className="flex gap-2">
            {roles.length === 0 && (
              <button onClick={seedDefaults}
                className="text-xs px-2 py-1 bg-amber-500 text-white rounded hover:bg-amber-600">
                Seed Defaults
              </button>
            )}
            <button onClick={() => setShowCreate(true)}
              className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">
              + New
            </button>
          </div>
        </div>

        {seeded && (
          <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
            Default roles seeded.
          </div>
        )}

        {showCreate && (
          <div className="mb-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
            <input className="w-full border rounded px-2 py-1.5 text-sm mb-2"
              placeholder="Role name" value={form.RoleName}
              onChange={e => setForm(f => ({ ...f, RoleName: e.target.value }))} />
            <input className="w-full border rounded px-2 py-1.5 text-sm mb-2"
              placeholder="Description" value={form.Description}
              onChange={e => setForm(f => ({ ...f, Description: e.target.value }))} />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowCreate(false)}
                className="text-xs px-2 py-1 border rounded text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={createRole} disabled={saving || !form.RoleName}
                className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">
                {saving ? 'Saving…' : 'Create'}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-1">
          {roles.map(r => (
            <div key={r.RoleID}
              onClick={() => selectRole(r)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${selected?.RoleID === r.RoleID ? 'bg-green-600 text-white' : 'bg-white hover:bg-gray-50 border border-gray-200'}`}>
              <div>
                <div className="text-sm font-medium">{r.RoleName}</div>
                <div className={`text-xs ${selected?.RoleID === r.RoleID ? 'text-green-100' : 'text-gray-400'}`}>
                  {r.MemberCount} member{r.MemberCount !== 1 ? 's' : ''}
                </div>
              </div>
              {!r.IsSystem && (
                <button onClick={e => { e.stopPropagation(); deleteRole(r.RoleID); }}
                  className={`text-xs ${selected?.RoleID === r.RoleID ? 'text-green-200 hover:text-white' : 'text-red-400 hover:text-red-600'}`}>
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Permission matrix */}
      <div className="flex-1 min-w-0">
        {!selected ? (
          <div className="text-center text-gray-400 py-20">Select a role to manage its permissions.</div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-base font-semibold text-gray-800">{selected.RoleName}</h2>
              {selected.IsSystem && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">System</span>
              )}
              <span className="text-xs text-gray-400">{selected.Description}</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 w-1/2">Feature</th>
                    <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-600">View</th>
                    <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-600">Edit</th>
                    <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-600">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {FEATURE_KEYS.map(fk => (
                    <tr key={fk} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-700 capitalize">{fk.replace(/_/g, ' ')}</td>
                      {['view', 'edit', 'delete'].map(f => (
                        <td key={f} className="px-3 py-2 text-center">
                          <input type="checkbox" checked={perm(fk, f)}
                            onChange={e => togglePerm(fk, `can_${f}`, e.target.checked)}
                            className="accent-green-600 w-4 h-4 cursor-pointer" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Members Tab ──────────────────────────────────────────────────────────────

function MembersTab({ businessId }) {
  const [members, setMembers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showAssign, setShowAssign] = useState(false);
  const [assignForm, setAssignForm] = useState({ PeopleID: '', RoleID: '' });
  const [saving, setSaving] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [searching, setSearching] = useState(false);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(() => Promise.all([
    apiFetch(`/api/rbac/members?business_id=${businessId}`)
      .then(d => { setMembers(asArray(d)); setLoadError(''); })
      .catch(e => { setMembers([]); setLoadError(e.message || 'Could not load members.'); }),
    apiFetch(`/api/rbac/roles?business_id=${businessId}`)
      .then(d => setRoles(asArray(d))).catch(() => setRoles([])),
  ]), [businessId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (searchQ.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await apiFetch(`/api/rbac/people-search?business_id=${businessId}&q=${encodeURIComponent(searchQ)}`);
        setSearchResults(results);
      } catch (_) {}
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQ, businessId]);

  function selectPerson(p) {
    setSelectedPerson(p);
    setAssignForm(f => ({ ...f, PeopleID: p.people_id }));
    setSearchQ(p.full_name);
    setSearchResults([]);
  }

  async function removeMember(userRoleId) {
    if (!confirm('Remove this role assignment?')) return;
    await apiFetch(`/api/rbac/members/${userRoleId}?business_id=${businessId}`, { method: 'DELETE' });
    load();
  }

  async function assignMember() {
    if (!assignForm.PeopleID || !assignForm.RoleID) return;
    setSaving(true);
    await apiFetch('/api/rbac/members', {
      method: 'POST',
      body: JSON.stringify({ business_id: businessId, ...assignForm }),
    });
    setAssignForm({ PeopleID: '', RoleID: '' });
    setSelectedPerson(null);
    setSearchQ('');
    setShowAssign(false);
    setSaving(false);
    load();
  }

  return (
    <div>
      {loadError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          Couldn’t load team members: {loadError}
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-gray-700">Team Members ({members.length})</span>
        <button onClick={() => { setShowAssign(s => !s); setSelectedPerson(null); setSearchQ(''); setSearchResults([]); }}
          className="text-sm px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700">
          + Assign Role
        </button>
      </div>

      {showAssign && (
        <div className="mb-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
          <h3 className="text-sm font-semibold mb-3 text-gray-700">Assign Role to Team Member</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="relative">
              <label className="block text-xs text-gray-500 mb-1">Search by Name or Email</label>
              <input className="w-full border rounded px-2 py-1.5 text-sm"
                placeholder="Type name or email…"
                value={searchQ}
                onChange={e => { setSearchQ(e.target.value); setSelectedPerson(null); setAssignForm(f => ({ ...f, PeopleID: '' })); }} />
              {searching && <div className="absolute right-2 top-7 text-xs text-gray-400">…</div>}
              {searchResults.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {searchResults.map(p => (
                    <button key={p.people_id} onClick={() => selectPerson(p)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                      <div className="text-sm font-medium text-gray-800">{p.full_name}</div>
                      <div className="text-xs text-gray-400">{p.email}</div>
                    </button>
                  ))}
                </div>
              )}
              {selectedPerson && (
                <div className="mt-1 text-xs text-green-700 font-medium">
                  ✓ {selectedPerson.full_name} (#{selectedPerson.people_id})
                </div>
              )}
              {!selectedPerson && assignForm.PeopleID === '' && (
                <div className="mt-1">
                  <label className="text-xs text-gray-400">or enter People ID directly: </label>
                  <input type="number" className="border rounded px-2 py-1 text-xs w-24 ml-1"
                    placeholder="ID"
                    onChange={e => setAssignForm(f => ({ ...f, PeopleID: e.target.value }))} />
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Role</label>
              <select className="w-full border rounded px-2 py-1.5 text-sm"
                value={assignForm.RoleID}
                onChange={e => setAssignForm(f => ({ ...f, RoleID: e.target.value }))}>
                <option value="">Select role…</option>
                {roles.map(r => <option key={r.RoleID} value={r.RoleID}>{r.RoleName}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAssign(false)}
              className="text-sm px-3 py-1.5 border rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={assignMember} disabled={saving || !assignForm.PeopleID || !assignForm.RoleID}
              className="text-sm px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              {saving ? 'Saving…' : 'Assign'}
            </button>
          </div>
        </div>
      )}

      {members.length === 0 ? (
        <div className="text-center text-gray-400 py-16">No role assignments yet.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600">Member</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600">Email</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600">Role</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600">Assigned</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map(m => (
                <tr key={m.UserRoleID} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-800">{m.MemberName || `#${m.PeopleID}`}</td>
                  <td className="px-4 py-2.5 text-gray-500">{m.Email || '—'}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-block bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                      {m.RoleName}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs">
                    {m.AssignedAt ? new Date(m.AssignedAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => removeMember(m.UserRoleID)}
                      className="text-xs text-red-400 hover:text-red-600">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Audit Log Tab ────────────────────────────────────────────────────────────

function AuditTab({ businessId }) {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filter, setFilter] = useState({ resource: '', action: '', people_id: '' });
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ business_id: businessId, limit: 200 });
    if (filter.resource) params.set('resource', filter.resource);
    if (filter.action) params.set('action', filter.action);
    if (filter.people_id) params.set('people_id', filter.people_id);
    Promise.all([
      apiFetch(`/api/audit/logs?${params}`),
      apiFetch(`/api/audit/summary?business_id=${businessId}`),
    ]).then(([l, s]) => {
      setLogs(l);
      setSummary(s);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [businessId, filter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      {/* Summary strip */}
      {summary && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-2xl font-bold text-gray-800">{summary.total_events?.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-1">Total Events</div>
          </div>
          {(summary.last_30_days || []).slice(0, 3).map((s, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-2xl font-bold text-gray-800">{s.count}</div>
              <div className="text-xs text-gray-500 mt-1 capitalize">{s.action} {s.resource}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input className="border rounded-lg px-3 py-1.5 text-sm w-40"
          placeholder="Resource…" value={filter.resource}
          onChange={e => setFilter(f => ({ ...f, resource: e.target.value }))} />
        <select className="border rounded-lg px-3 py-1.5 text-sm"
          value={filter.action}
          onChange={e => setFilter(f => ({ ...f, action: e.target.value }))}>
          <option value="">All actions</option>
          {['CREATE','UPDATE','DELETE','VIEW','LOGIN','ASSIGN','REMOVE'].map(a =>
            <option key={a}>{a}</option>)}
        </select>
        <input type="number" className="border rounded-lg px-3 py-1.5 text-sm w-36"
          placeholder="People ID…" value={filter.people_id}
          onChange={e => setFilter(f => ({ ...f, people_id: e.target.value }))} />
        <button onClick={load}
          className="px-3 py-1.5 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-800">
          {loading ? 'Loading…' : 'Filter'}
        </button>
      </div>

      {logs.length === 0 && !loading ? (
        <div className="text-center text-gray-400 py-16">No audit events found.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600">When</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600">Actor</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600">Action</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600">Resource</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map(l => (
                <tr key={l.LogID} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(l.CreatedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-gray-700">
                    {l.ActorName || (l.PeopleID ? `#${l.PeopleID}` : '—')}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ACTION_COLOR[l.Action] || 'bg-gray-100 text-gray-600'}`}>
                      {l.Action}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 capitalize">
                    {l.Resource}{l.ResourceID ? ` #${l.ResourceID}` : ''}
                  </td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs max-w-xs truncate">
                    {l.Details ? (typeof l.Details === 'object' ? JSON.stringify(l.Details) : l.Details) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = ['Roles', 'Members', 'Audit Log'];

export default function Permissions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { BusinessID: selectedBusinessID, businesses, businessesLoaded } = useAccount() || {};

  // Resolving the business has to match what the workspace actually shows.
  //
  // AccountContext only adopts a business when the URL names one, so on any
  // page load without ?BusinessID both Business and BusinessID are null. The
  // sidebar header hides that: it falls back to businesses[0].BusinessName, so
  // an account looks active while the context holds nothing. Reading the query
  // string alone — or even the context alone — then reports no business against
  // a workspace that is plainly showing one.
  //
  // So fall back the same way the header does, ending at the first business in
  // the user's own list.
  const urlBusinessID = parseInt(searchParams.get('BusinessID') || '0', 10) || 0;
  const firstOwned = Array.isArray(businesses) && businesses.length
    ? (businesses[0].BusinessID ?? businesses[0].businessId ?? businesses[0].id)
    : null;
  const BusinessID = urlBusinessID || Number(selectedBusinessID) || Number(firstOwned) || 0;

  // Write the resolved id back into the URL so a refresh or a shared link lands
  // on the same business, and so AccountContext — which follows the URL — stays
  // in step instead of being silently disagreed with.
  useEffect(() => {
    if (!urlBusinessID && BusinessID) {
      const next = new URLSearchParams(searchParams);
      next.set('BusinessID', String(BusinessID));
      setSearchParams(next, { replace: true });
    }
  }, [urlBusinessID, BusinessID]); // eslint-disable-line react-hooks/exhaustive-deps

  const tabParam = searchParams.get('tab');
  const activeTab = tabParam === 'members' ? 'Members' : tabParam === 'audit' ? 'Audit Log' : 'Roles';

  function setTab(t) {
    const map = { Roles: null, Members: 'members', 'Audit Log': 'audit' };
    const next = new URLSearchParams(searchParams);
    if (map[t]) next.set('tab', map[t]);
    else next.delete('tab');
    setSearchParams(next);
  }

  // The list arrives asynchronously, so an empty one means "not yet" until it
  // settles. Without this the page flashes the empty state on every load.
  if (!BusinessID && !businessesLoaded) {
    return (
      <AccountLayout>
        <div className="p-8 text-center text-gray-400">Loading…</div>
      </AccountLayout>
    );
  }

  if (!BusinessID) {
    return (
      <AccountLayout>
        <div className="p-8 text-center text-gray-500">
          <p className="m-0 mb-2 font-semibold">No business selected</p>
          <p className="m-0 text-sm text-gray-400">
            Roles, team members and the audit log belong to one business. Choose an
            account from <Link to="/account" className="text-blue-600 no-underline">Accounts</Link>,
            then reopen this page.
          </p>
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage custom roles, feature-level permissions, and team member assignments.
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === t
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {t}
            </button>
          ))}
        </div>

        {activeTab === 'Roles'     && <RolesTab   businessId={BusinessID} />}
        {activeTab === 'Members'   && <MembersTab businessId={BusinessID} />}
        {activeTab === 'Audit Log' && <AuditTab   businessId={BusinessID} />}
      </div>
    </AccountLayout>
  );
}
