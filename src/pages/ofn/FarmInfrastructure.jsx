// Ported from Oatmeal Farm Network (src/FarmInfrastructure.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
﻿import React, { useEffect, useState, useCallback } from 'react';
// ThaiymeChat, the Thaiyme agent widget, is not ported: it needs
// AgentBadge and LanguageContext. It is a floating chat panel, not
// part of this page's function.
import { useSearchParams, Link } from 'react-router';
import AccountLayout from '../../components/AccountLayout';

const API = import.meta.env.VITE_LIVESTOCK_API_URL || '';
const hdrs = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('access_token')}` });
const apiFetch = async (path, opts) => {
  const r = await fetch(`${API}${path}`, { headers: hdrs(), ...opts });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
};

const I = ({ children, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
const IcoPlus   = () => <I size={15}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></I>;
const IcoEdit   = () => <I size={14}><path d="M11 4H4a2 2 0 0 0-2 2v14h14v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></I>;
const IcoWrench = () => <I size={14}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></I>;

const fmt = (n) => n == null ? '—' : Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

const ASSET_TYPES = ['equipment','vehicle','tool','irrigation','storage','building','technology','other'];
const TABS = ['Assets','Maintenance','Schedules','Structures'];

export default function FarmInfrastructure() {
  const [params] = useSearchParams();
  const bid = params.get('BusinessID');
  const [tab, setTab]         = useState('Assets');
  const [assets, setAssets]   = useState([]);
  const [maint, setMaint]     = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [structures, setStructures] = useState([]);
  const [summary, setSummary] = useState(null);
  const [modal, setModal]     = useState(null);
  const [form, setForm]       = useState({});
  const [typeFilter, setTypeFilter] = useState('');

  const load = useCallback(async () => {
    if (!bid) return;
    try {
      const [a, s] = await Promise.all([
        apiFetch(`/api/farm-infrastructure/assets?business_id=${bid}${typeFilter ? '&asset_type=' + typeFilter : ''}`),
        apiFetch(`/api/farm-infrastructure/summary?business_id=${bid}`),
      ]);
      setAssets(a);
      setSummary(s);
    } catch (e) { console.error(e); }
  }, [bid, typeFilter]);

  const loadTab = useCallback(async (t) => {
    if (!bid) return;
    try {
      if (t === 'Maintenance') {
        const d = await apiFetch(`/api/farm-infrastructure/maintenance?business_id=${bid}`);
        setMaint(d);
      } else if (t === 'Schedules') {
        const d = await apiFetch(`/api/farm-infrastructure/schedules?business_id=${bid}`);
        setSchedules(d);
      } else if (t === 'Structures') {
        const d = await apiFetch(`/api/farm-infrastructure/structures?business_id=${bid}`);
        setStructures(d);
      }
    } catch (e) { console.error(e); }
  }, [bid]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadTab(tab); }, [tab, loadTab]);

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const openModal = (type, data = {}) => { setModal({ type }); setForm(data); };
  const closeModal = () => { setModal(null); setForm({}); };

  const saveAsset = async () => {
    try {
      if (form.asset_id) {
        await apiFetch(`/api/farm-infrastructure/assets/${form.asset_id}`, { method: 'PUT', body: JSON.stringify({ ...form, business_id: bid }) });
      } else {
        await apiFetch('/api/farm-infrastructure/assets', { method: 'POST', body: JSON.stringify({ ...form, business_id: bid }) });
      }
      load();
      closeModal();
    } catch (e) { alert('Save failed'); }
  };

  const logMaintenance = async () => {
    try {
      await apiFetch('/api/farm-infrastructure/maintenance', { method: 'POST', body: JSON.stringify({ ...form, business_id: bid }) });
      loadTab('Maintenance');
      load();
      closeModal();
    } catch (e) { alert('Failed'); }
  };

  const addSchedule = async () => {
    try {
      await apiFetch('/api/farm-infrastructure/schedules', { method: 'POST', body: JSON.stringify({ ...form, business_id: bid }) });
      loadTab('Schedules');
      closeModal();
    } catch (e) { alert('Failed'); }
  };

  const saveStructure = async () => {
    try {
      if (form.structure_id) {
        await apiFetch(`/api/farm-infrastructure/structures/${form.structure_id}`, { method: 'PUT', body: JSON.stringify({ ...form, business_id: bid }) });
      } else {
        await apiFetch('/api/farm-infrastructure/structures', { method: 'POST', body: JSON.stringify({ ...form, business_id: bid }) });
      }
      loadTab('Structures');
      closeModal();
    } catch (e) { alert('Failed'); }
  };

  return (
    <AccountLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Farm Infrastructure & Equipment</h1>
            <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>Asset registry, maintenance logs, scheduled maintenance, and structure inventory.</p>
          </div>
          <Link to={`/grain-bin?BusinessID=${bid}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: 8, padding: '7px 14px', textDecoration: 'none', color: '#92400e', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="8" cy="4" rx="6" ry="2"/><path d="M2 4v12c0 1.1 2.7 2 6 2s6-.9 6-2V4"/>
            </svg>
            Grain Bin Monitor
          </Link>
        </div>

        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'Total Assets', val: summary.total_assets, color: '#2563eb' },
              { label: 'Active', val: summary.active_assets, color: '#16a34a' },
              { label: 'Needs Repair', val: summary.needs_repair, color: '#dc2626' },
              { label: 'Overdue Maint.', val: summary.overdue_maintenance, color: '#d97706' },
              { label: 'Asset Value', val: `$${fmt(summary.total_asset_value)}`, color: '#7c3aed' },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 18px' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color }}>{val}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid #e5e7eb', marginBottom: 24 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '7px 16px', border: 'none', background: 'none', cursor: 'pointer',
              borderBottom: tab === t ? '2px solid #16a34a' : '2px solid transparent',
              color: tab === t ? '#16a34a' : '#6b7280', fontWeight: tab === t ? 700 : 500,
              marginBottom: -2, fontSize: 14,
            }}>{t}</button>
          ))}
        </div>

        {/* ── ASSETS ── */}
        {tab === 'Assets' && (
          <div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', marginBottom: 14 }}>
              <select style={sel} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="">All Types</option>
                {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => openModal('maint')} style={btn('#d97706')}><IcoWrench /> Log Maintenance</button>
                <button onClick={() => openModal('asset')} style={btn('#16a34a')}><IcoPlus /> Add Asset</button>
              </div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    {['Name','Type','Make/Model','Year','Value','Status','Last Maint.','Next Due',''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#6b7280', fontWeight: 600, fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {assets.map(a => (
                    <tr key={a.asset_id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{a.asset_name}</td>
                      <td style={{ padding: '10px 12px', color: '#374151' }}>{a.asset_type}</td>
                      <td style={{ padding: '10px 12px', color: '#374151' }}>{[a.make, a.model].filter(Boolean).join(' ') || '—'}</td>
                      <td style={{ padding: '10px 12px' }}>{a.year || '—'}</td>
                      <td style={{ padding: '10px 12px' }}>{a.current_value ? `$${fmt(a.current_value)}` : '—'}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          background: a.status === 'active' ? '#dcfce7' : a.status === 'needs_repair' ? '#fee2e2' : '#f3f4f6',
                          color: a.status === 'active' ? '#166534' : a.status === 'needs_repair' ? '#dc2626' : '#374151',
                          borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 600,
                        }}>{a.status}</span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#6b7280' }}>{fmtDate(a.last_maintenance_date)}</td>
                      <td style={{ padding: '10px 12px', color: a.next_maintenance_due && new Date(a.next_maintenance_due) < new Date() ? '#dc2626' : '#374151', fontWeight: a.next_maintenance_due && new Date(a.next_maintenance_due) < new Date() ? 700 : 400 }}>
                        {fmtDate(a.next_maintenance_due)}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <button onClick={() => openModal('asset', { ...a })} style={iBtn}><IcoEdit /></button>
                      </td>
                    </tr>
                  ))}
                  {assets.length === 0 && (
                    <tr><td colSpan={9} style={{ padding: 32, textAlign: 'center', color: '#6b7280' }}>No assets. Add your first.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── MAINTENANCE ── */}
        {tab === 'Maintenance' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
              <button onClick={() => openModal('maint')} style={btn('#d97706')}><IcoWrench /> Log Maintenance</button>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    {['Asset','Type','Description','Date','Cost','Hours','Next Due','Status'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#6b7280', fontWeight: 600, fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {maint.map(m => (
                    <tr key={m.log_id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{m.asset_name}</td>
                      <td style={{ padding: '10px 12px' }}>{m.maintenance_type}</td>
                      <td style={{ padding: '10px 12px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.description}</td>
                      <td style={{ padding: '10px 12px' }}>{fmtDate(m.performed_date)}</td>
                      <td style={{ padding: '10px 12px' }}>{m.cost ? `$${Number(m.cost).toFixed(2)}` : '—'}</td>
                      <td style={{ padding: '10px 12px' }}>{m.hours_logged || '—'}</td>
                      <td style={{ padding: '10px 12px' }}>{fmtDate(m.next_due_date)}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ background: m.status === 'completed' ? '#dcfce7' : '#fef3c7', color: m.status === 'completed' ? '#166534' : '#92400e', borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{m.status}</span>
                      </td>
                    </tr>
                  ))}
                  {maint.length === 0 && (
                    <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: '#6b7280' }}>No maintenance logs.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── SCHEDULES ── */}
        {tab === 'Schedules' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
              <button onClick={() => openModal('schedule')} style={btn('#16a34a')}><IcoPlus /> Add Schedule</button>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {schedules.map(s => (
                <div key={s.schedule_id} style={{ background: '#fff', border: `1px solid ${s.is_overdue ? '#fecaca' : '#e5e7eb'}`, borderRadius: 10, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{s.task_name}</div>
                    <div style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>
                      Asset: {s.asset_name} · Every {s.frequency_value} {s.frequency_type}
                      {s.assigned_to ? ` · Assigned: ${s.assigned_to}` : ''}
                      {s.estimated_cost ? ` · Est. $${Number(s.estimated_cost).toFixed(0)}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Next Due</div>
                    <div style={{ fontWeight: 700, color: s.is_overdue ? '#dc2626' : '#374151', fontSize: 15 }}>{fmtDate(s.next_due_date)}</div>
                    {s.is_overdue && <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>OVERDUE</div>}
                  </div>
                </div>
              ))}
              {schedules.length === 0 && <div style={{ color: '#6b7280', textAlign: 'center', padding: 32 }}>No maintenance schedules.</div>}
            </div>
          </div>
        )}

        {/* ── STRUCTURES ── */}
        {tab === 'Structures' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
              <button onClick={() => openModal('structure')} style={btn('#16a34a')}><IcoPlus /> Add Structure</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
              {structures.map(s => (
                <div key={s.structure_id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontWeight: 700 }}>{s.structure_name}</div>
                    <span style={{ background: '#f3f4f6', borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 600, color: '#374151' }}>{s.structure_type}</span>
                  </div>
                  {[
                    ['Capacity', s.capacity ? `${s.capacity} ${s.capacity_unit || ''}` : '—'],
                    ['Sq. Ft.', s.square_footage ? `${Number(s.square_footage).toLocaleString()} sqft` : '—'],
                    ['Built', s.built_year || '—'],
                    ['Condition', s.condition || '—'],
                    ['Insurance Value', s.insurance_value ? `$${fmt(s.insurance_value)}` : '—'],
                    ['Last Inspected', fmtDate(s.last_inspected)],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid #f3f4f6', padding: '4px 0' }}>
                      <span style={{ color: '#6b7280' }}>{k}</span>
                      <span style={{ fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                  <button onClick={() => openModal('structure', { ...s })} style={{ ...iBtn, marginTop: 10, color: '#2563eb', fontSize: 12, fontWeight: 600 }}>Edit</button>
                </div>
              ))}
              {structures.length === 0 && <div style={{ color: '#6b7280', padding: 32 }}>No structures yet.</div>}
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={closeModal}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 520, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            {modal.type === 'asset' && (
              <>
                <h3 style={{ marginBottom: 20, fontWeight: 700 }}>{form.asset_id ? 'Edit' : 'Add'} Asset</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ gridColumn: '1/-1' }}><label style={lbl}>Asset Name *</label><input style={inpS} value={form.asset_name || ''} onChange={e => f('asset_name', e.target.value)} /></div>
                  <div><label style={lbl}>Type</label><select style={inpS} value={form.asset_type || 'equipment'} onChange={e => f('asset_type', e.target.value)}>{ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                  <div><label style={lbl}>Make</label><input style={inpS} value={form.make || ''} onChange={e => f('make', e.target.value)} /></div>
                  <div><label style={lbl}>Model</label><input style={inpS} value={form.model || ''} onChange={e => f('model', e.target.value)} /></div>
                  <div><label style={lbl}>Year</label><input style={inpS} type="number" value={form.year || ''} onChange={e => f('year', e.target.value)} /></div>
                  <div><label style={lbl}>Serial #</label><input style={inpS} value={form.serial_number || ''} onChange={e => f('serial_number', e.target.value)} /></div>
                  <div><label style={lbl}>Purchase Date</label><input style={inpS} type="date" value={form.purchase_date || ''} onChange={e => f('purchase_date', e.target.value)} /></div>
                  <div><label style={lbl}>Purchase Price ($)</label><input style={inpS} type="number" value={form.purchase_price || ''} onChange={e => f('purchase_price', e.target.value)} /></div>
                  <div><label style={lbl}>Current Value ($)</label><input style={inpS} type="number" value={form.current_value || ''} onChange={e => f('current_value', e.target.value)} /></div>
                  <div><label style={lbl}>Status</label><select style={inpS} value={form.status || 'active'} onChange={e => f('status', e.target.value)}>{['active','inactive','needs_repair','decommissioned'].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                  <div><label style={lbl}>Warranty Expiry</label><input style={inpS} type="date" value={form.warranty_expiry || ''} onChange={e => f('warranty_expiry', e.target.value)} /></div>
                  <div><label style={lbl}>Insurance Expiry</label><input style={inpS} type="date" value={form.insurance_expiry || ''} onChange={e => f('insurance_expiry', e.target.value)} /></div>
                  <div><label style={lbl}>Location</label><input style={inpS} value={form.location || ''} onChange={e => f('location', e.target.value)} /></div>
                </div>
                <div style={mBtns}><button onClick={closeModal} style={btn('#6b7280')}>Cancel</button><button onClick={saveAsset} style={btn('#16a34a')}>Save</button></div>
              </>
            )}
            {modal.type === 'maint' && (
              <>
                <h3 style={{ marginBottom: 20, fontWeight: 700 }}>Log Maintenance</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label style={lbl}>Asset *</label><select style={inpS} value={form.asset_id || ''} onChange={e => f('asset_id', e.target.value)}><option value="">Select…</option>{assets.map(a => <option key={a.asset_id} value={a.asset_id}>{a.asset_name}</option>)}</select></div>
                  <div><label style={lbl}>Type</label><select style={inpS} value={form.maintenance_type || 'routine'} onChange={e => f('maintenance_type', e.target.value)}>{['routine','repair','inspection','emergency','upgrade'].map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                  <div style={{ gridColumn: '1/-1' }}><label style={lbl}>Description *</label><input style={inpS} value={form.description || ''} onChange={e => f('description', e.target.value)} /></div>
                  <div><label style={lbl}>Performed By</label><input style={inpS} value={form.performed_by || ''} onChange={e => f('performed_by', e.target.value)} /></div>
                  <div><label style={lbl}>Date *</label><input style={inpS} type="date" value={form.performed_date || ''} onChange={e => f('performed_date', e.target.value)} /></div>
                  <div><label style={lbl}>Cost ($)</label><input style={inpS} type="number" value={form.cost || ''} onChange={e => f('cost', e.target.value)} /></div>
                  <div><label style={lbl}>Hours Logged</label><input style={inpS} type="number" value={form.hours_logged || ''} onChange={e => f('hours_logged', e.target.value)} /></div>
                  <div><label style={lbl}>Next Due Date</label><input style={inpS} type="date" value={form.next_due_date || ''} onChange={e => f('next_due_date', e.target.value)} /></div>
                </div>
                <div style={mBtns}><button onClick={closeModal} style={btn('#6b7280')}>Cancel</button><button onClick={logMaintenance} style={btn('#d97706')}>Log</button></div>
              </>
            )}
            {modal.type === 'schedule' && (
              <>
                <h3 style={{ marginBottom: 20, fontWeight: 700 }}>Maintenance Schedule</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label style={lbl}>Asset *</label><select style={inpS} value={form.asset_id || ''} onChange={e => f('asset_id', e.target.value)}><option value="">Select…</option>{assets.map(a => <option key={a.asset_id} value={a.asset_id}>{a.asset_name}</option>)}</select></div>
                  <div><label style={lbl}>Task Name *</label><input style={inpS} value={form.task_name || ''} onChange={e => f('task_name', e.target.value)} placeholder="e.g. Oil Change" /></div>
                  <div><label style={lbl}>Every</label><input style={inpS} type="number" value={form.frequency_value || 90} onChange={e => f('frequency_value', e.target.value)} /></div>
                  <div><label style={lbl}>Period</label><select style={inpS} value={form.frequency_type || 'days'} onChange={e => f('frequency_type', e.target.value)}>{['days','weeks','months','hours'].map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                  <div><label style={lbl}>Next Due Date</label><input style={inpS} type="date" value={form.next_due_date || ''} onChange={e => f('next_due_date', e.target.value)} /></div>
                  <div><label style={lbl}>Est. Cost ($)</label><input style={inpS} type="number" value={form.estimated_cost || ''} onChange={e => f('estimated_cost', e.target.value)} /></div>
                  <div><label style={lbl}>Assigned To</label><input style={inpS} value={form.assigned_to || ''} onChange={e => f('assigned_to', e.target.value)} /></div>
                </div>
                <div style={mBtns}><button onClick={closeModal} style={btn('#6b7280')}>Cancel</button><button onClick={addSchedule} style={btn('#16a34a')}>Save</button></div>
              </>
            )}
            {modal.type === 'structure' && (
              <>
                <h3 style={{ marginBottom: 20, fontWeight: 700 }}>{form.structure_id ? 'Edit' : 'Add'} Structure</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label style={lbl}>Name *</label><input style={inpS} value={form.structure_name || ''} onChange={e => f('structure_name', e.target.value)} /></div>
                  <div><label style={lbl}>Type *</label><input style={inpS} value={form.structure_type || ''} onChange={e => f('structure_type', e.target.value)} placeholder="barn, silo, greenhouse…" /></div>
                  <div><label style={lbl}>Capacity</label><input style={inpS} type="number" value={form.capacity || ''} onChange={e => f('capacity', e.target.value)} /></div>
                  <div><label style={lbl}>Capacity Unit</label><input style={inpS} value={form.capacity_unit || ''} onChange={e => f('capacity_unit', e.target.value)} placeholder="bu, tons, head…" /></div>
                  <div><label style={lbl}>Sq. Footage</label><input style={inpS} type="number" value={form.square_footage || ''} onChange={e => f('square_footage', e.target.value)} /></div>
                  <div><label style={lbl}>Built Year</label><input style={inpS} type="number" value={form.built_year || ''} onChange={e => f('built_year', e.target.value)} /></div>
                  <div><label style={lbl}>Condition</label><select style={inpS} value={form.condition || 'good'} onChange={e => f('condition', e.target.value)}>{['excellent','good','fair','poor'].map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                  <div><label style={lbl}>Insurance Value ($)</label><input style={inpS} type="number" value={form.insurance_value || ''} onChange={e => f('insurance_value', e.target.value)} /></div>
                </div>
                <div style={mBtns}><button onClick={closeModal} style={btn('#6b7280')}>Cancel</button><button onClick={saveStructure} style={btn('#16a34a')}>Save</button></div>
              </>
            )}
          </div>
        </div>
      )}</AccountLayout>
  );
}

const btn = (bg) => ({ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', background: bg, color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' });
const sel = { border: '1px solid #d1d5db', borderRadius: 8, padding: '7px 10px', fontSize: 14, background: '#fff' };
const iBtn = { background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '2px 4px' };
const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 3 };
const inpS = { width: '100%', border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 10px', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
const mBtns = { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 };
