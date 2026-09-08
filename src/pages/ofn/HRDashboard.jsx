// Ported from Oatmeal Farm Network (src/HRDashboard.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
﻿import React, { useEffect, useState, useCallback } from 'react';
// ThaiymeChat, the Thaiyme agent widget, is not ported: it needs
// AgentBadge and LanguageContext. It is a floating chat panel, not
// part of this page's function.
import { useSearchParams, Link } from 'react-router';
import AccountLayout from '../../components/AccountLayout';

const API = import.meta.env.VITE_LIVESTOCK_API_URL || '';

const tok = () => localStorage.getItem('access_token');
const hdrs = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` });

// ─── Icons ────────────────────────────────────────────────────────────────────
const I = ({ children, size = 18, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'}
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
const IcoWorkers  = () => <I><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></I>;
const IcoAttend   = () => <I><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></I>;
const IcoPayroll  = () => <I><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><path d="M9 10h3.5a1.5 1.5 0 1 1 0 3H9"/><path d="M9 13h4.5"/></I>;
const IcoTask     = () => <I><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></I>;
const IcoLeave    = () => <I><path d="M3 12l9-9 9 9"/><path d="M9 21V9h6v12"/></I>;
const IcoPlus     = () => <I size={16}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></I>;
const IcoClock    = () => <I size={16}><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></I>;
const IcoEdit     = () => <I size={16}><path d="M11 4H4a2 2 0 0 0-2 2v14h14v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></I>;
const IcoX        = () => <I size={16}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></I>;
const IcoCheck    = () => <I size={16}><polyline points="20 6 9 17 4 12"/></I>;

const TABS = [
  { key: 'overview',   label: 'Overview',   Icon: IcoWorkers },
  { key: 'workers',    label: 'Workers',    Icon: IcoWorkers },
  { key: 'attendance', label: 'Attendance', Icon: IcoAttend },
  { key: 'payroll',    label: 'Payroll',    Icon: IcoPayroll },
  { key: 'tasks',      label: 'Tasks',      Icon: IcoTask },
  { key: 'leave',      label: 'Leave',      Icon: IcoLeave },
];

const fmt = (n) => n == null ? '—' : Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '—';
const statusBadge = (s, map) => {
  const cfg = map[s] || { bg: '#e5e7eb', color: '#374151' };
  return <span style={{ ...cfg, borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{s}</span>;
};

export default function HRDashboard() {
  const [params] = useSearchParams();
  const businessId = params.get('BusinessID');
  const [tab, setTab]       = useState('overview');
  const [summary, setSummary] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [tasks, setTasks]   = useState([]);
  const [leave, setLeave]   = useState([]);
  const [payPeriods, setPayPeriods] = useState([]);
  const [slips, setSlips]   = useState([]);
  const [selPeriod, setSelPeriod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modal, setModal]   = useState(null); // { type, data? }
  const [form, setForm]     = useState({});

  const bid = businessId;

  const apiFetch = useCallback(async (path, opts) => {
    const r = await fetch(`${API}${path}`, { headers: hdrs(), ...opts });
    if (!r.ok) throw new Error(`${r.status}`);
    return r.json();
  }, []);

  const load = useCallback(async () => {
    if (!bid) return;
    setLoading(true);
    try {
      const [sum, wrk] = await Promise.all([
        apiFetch(`/api/hr/summary?business_id=${bid}`),
        apiFetch(`/api/hr/employees?business_id=${bid}`),
      ]);
      setSummary(sum);
      setWorkers(wrk);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [bid, apiFetch]);

  const loadTab = useCallback(async (t) => {
    if (!bid) return;
    try {
      if (t === 'attendance') {
        const d = await apiFetch(`/api/hr/attendance?business_id=${bid}&limit=50`);
        setAttendance(d);
      } else if (t === 'tasks') {
        const d = await apiFetch(`/api/hr/tasks?business_id=${bid}`);
        setTasks(d);
      } else if (t === 'leave') {
        const d = await apiFetch(`/api/hr/leave?business_id=${bid}`);
        setLeave(d);
      } else if (t === 'payroll') {
        const d = await apiFetch(`/api/hr/pay-periods?business_id=${bid}`);
        setPayPeriods(d);
      }
    } catch (e) { console.error(e); }
  }, [bid, apiFetch]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadTab(tab); }, [tab, loadTab]);

  const handleTabChange = (t) => { setTab(t); };

  const openModal = (type, data = {}) => { setModal({ type }); setForm(data); };
  const closeModal = () => { setModal(null); setForm({}); };

  const saveWorker = async () => {
    try {
      if (form.employee_id) {
        await apiFetch(`/api/hr/employees/${form.employee_id}?business_id=${bid}`, {
          method: 'PUT', body: JSON.stringify({ ...form, business_id: bid }),
        });
      } else {
        await apiFetch(`/api/hr/employees`, {
          method: 'POST', body: JSON.stringify({ ...form, business_id: bid }),
        });
      }
      load();
      closeModal();
    } catch (e) { alert('Save failed: ' + e.message); }
  };

  const saveAttendance = async () => {
    try {
      if (form.attendance_id) {
        await apiFetch(`/api/hr/attendance/${form.attendance_id}`, {
          method: 'PUT', body: JSON.stringify({ ...form, business_id: bid }),
        });
      } else {
        await apiFetch(`/api/hr/attendance`, {
          method: 'POST', body: JSON.stringify({ ...form, business_id: bid }),
        });
      }
      loadTab('attendance');
      closeModal();
    } catch (e) { alert('Save failed: ' + e.message); }
  };

  const saveTask = async () => {
    try {
      if (form.task_id) {
        await apiFetch(`/api/hr/tasks/${form.task_id}`, {
          method: 'PUT', body: JSON.stringify({ ...form, business_id: bid }),
        });
      } else {
        await apiFetch(`/api/hr/tasks`, {
          method: 'POST', body: JSON.stringify({ ...form, business_id: bid }),
        });
      }
      loadTab('tasks');
      closeModal();
    } catch (e) { alert('Save failed: ' + e.message); }
  };

  const saveLeave = async () => {
    try {
      await apiFetch(`/api/hr/leave`, {
        method: 'POST', body: JSON.stringify({ ...form, business_id: bid }),
      });
      loadTab('leave');
      closeModal();
    } catch (e) { alert('Save failed: ' + e.message); }
  };

  const reviewLeave = async (leaveId, status) => {
    try {
      await apiFetch(`/api/hr/leave/${leaveId}/review`, {
        method: 'PUT', body: JSON.stringify({ status, business_id: bid }),
      });
      loadTab('leave');
    } catch (e) { alert('Review failed: ' + e.message); }
  };

  const createPayPeriod = async () => {
    try {
      await apiFetch('/api/hr/pay-periods', {
        method: 'POST', body: JSON.stringify({ ...form, business_id: bid }),
      });
      loadTab('payroll');
      closeModal();
    } catch (e) { alert('Save failed: ' + e.message); }
  };

  const calcPayroll = async (periodId) => {
    try {
      const s = await apiFetch(`/api/hr/pay-periods/${periodId}/calculate?business_id=${bid}`, { method: 'POST', body: '{}' });
      setSlips(s.slips || []);
      setSelPeriod(periodId);
    } catch (e) { alert('Calculation failed: ' + e.message); }
  };

  const confirmPayroll = async (periodId) => {
    if (!window.confirm('Confirm and lock this pay period?')) return;
    try {
      await apiFetch(`/api/hr/pay-periods/${periodId}/confirm?business_id=${bid}`, { method: 'POST', body: '{}' });
      loadTab('payroll');
      setSelPeriod(null);
      setSlips([]);
    } catch (e) { alert('Failed: ' + e.message); }
  };

  const loadSlips = async (periodId) => {
    try {
      const s = await apiFetch(`/api/hr/pay-periods/${periodId}/slips?business_id=${bid}`);
      setSlips(s);
      setSelPeriod(periodId);
    } catch (e) { console.error(e); }
  };

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  if (!bid) return (
    <AccountLayout>
      <div style={{ padding: 40, color: '#ef4444' }}>No BusinessID provided.</div>
    </AccountLayout>
  );

  return (
    <AccountLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>HR & Workforce Management</h1>
          <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>Manage employees, attendance, payroll, tasks, and leave requests.</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid #e5e7eb', marginBottom: 24, flexWrap: 'wrap' }}>
          {TABS.map(({ key, label, Icon }) => (
            <button key={key} onClick={() => handleTabChange(key)} style={{
              padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer',
              borderBottom: tab === key ? '2px solid #16a34a' : '2px solid transparent',
              color: tab === key ? '#16a34a' : '#6b7280',
              fontWeight: tab === key ? 700 : 500, marginBottom: -2,
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 14,
            }}>
              <Icon /> {label}
            </button>
          ))}
        </div>

        {loading && <div style={{ color: '#6b7280', padding: 20 }}>Loading…</div>}

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && summary && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 16, marginBottom: 28 }}>
              {[
                { label: 'Active Employees', val: summary.active_employees, color: '#16a34a' },
                { label: 'Pending Tasks', val: summary.pending_tasks, color: '#d97706' },
                { label: 'Pending Leave', val: summary.pending_leave, color: '#7c3aed' },
                { label: 'Expiring Certs', val: summary.expiring_certs_30d, color: '#dc2626' },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px 20px' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color }}>{val ?? 0}</div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
            <Link to={`/picker-performance?BusinessID=${bid}`}
              style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 10, padding: '14px 18px', textDecoration: 'none', color: '#15803d', fontWeight: 600, fontSize: 14, marginBottom: 16 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/><path d="M6 20v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><polyline points="9 11 11 13 15 9"/>
              </svg>
              Picker Performance → Track picking sessions, piece-rate wages &amp; payroll
            </Link>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20 }}>
              <h3 style={{ fontWeight: 600, marginBottom: 12, color: '#111827' }}>Recent Workers</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb', color: '#6b7280' }}>
                    <th style={{ textAlign: 'left', padding: '6px 8px' }}>Name</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px' }}>Title</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px' }}>Type</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px' }}>Pay Type</th>
                  </tr>
                </thead>
                <tbody>
                  {workers.slice(0, 5).map(w => (
                    <tr key={w.employee_id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '7px 8px', fontWeight: 600, color: '#111827' }}>{w.first_name} {w.last_name}</td>
                      <td style={{ padding: '7px 8px', color: '#374151' }}>{w.job_title || '—'}</td>
                      <td style={{ padding: '7px 8px', color: '#374151' }}>{w.employment_type}</td>
                      <td style={{ padding: '7px 8px', color: '#374151' }}>{w.pay_type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── WORKERS ── */}
        {tab === 'workers' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Employee Directory</h2>
              <button onClick={() => openModal('worker')} style={btnStyle('#16a34a')}>
                <IcoPlus /> Add Employee
              </button>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    {['Name', 'Title', 'Department', 'Type', 'Pay', 'Rate', 'Status', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#6b7280', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {workers.map(w => (
                    <tr key={w.employee_id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{w.first_name} {w.last_name}</td>
                      <td style={{ padding: '10px 12px', color: '#374151' }}>{w.job_title || '—'}</td>
                      <td style={{ padding: '10px 12px', color: '#374151' }}>{w.department || '—'}</td>
                      <td style={{ padding: '10px 12px' }}>{w.employment_type}</td>
                      <td style={{ padding: '10px 12px' }}>{w.pay_type}</td>
                      <td style={{ padding: '10px 12px', color: '#374151' }}>
                        {w.pay_type === 'hourly' ? `$${fmt(w.hourly_rate)}/hr`
                         : w.pay_type === 'salary' ? `$${fmt(w.salary_annual)}/yr`
                         : w.pay_rate ? `$${fmt(w.pay_rate)}/unit` : '—'}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {statusBadge(w.is_active ? 'active' : 'inactive', {
                          active:   { bg: '#dcfce7', color: '#166534' },
                          inactive: { bg: '#f3f4f6', color: '#6b7280' },
                        })}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <button onClick={() => openModal('worker', { ...w })} style={iconBtn}>
                          <IcoEdit />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {workers.length === 0 && (
                    <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: '#6b7280' }}>No employees found. Add your first.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ATTENDANCE ── */}
        {tab === 'attendance' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Attendance & Time Tracking</h2>
              <button onClick={() => openModal('attendance')} style={btnStyle('#16a34a')}>
                <IcoClock /> Log Time
              </button>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    {['Employee', 'Date', 'Check-In', 'Check-Out', 'Hours', 'OT Hours', 'Task', 'Notes', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#6b7280', fontWeight: 600, fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attendance.map(a => (
                    <tr key={a.attendance_id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{a.employee_name}</td>
                      <td style={{ padding: '10px 12px' }}>{fmtDate(a.work_date)}</td>
                      <td style={{ padding: '10px 12px' }}>{a.check_in || '—'}</td>
                      <td style={{ padding: '10px 12px' }}>{a.check_out || '—'}</td>
                      <td style={{ padding: '10px 12px' }}>{a.hours_worked != null ? Number(a.hours_worked).toFixed(2) : '—'}</td>
                      <td style={{ padding: '10px 12px' }}>{a.overtime_hours ? Number(a.overtime_hours).toFixed(2) : '—'}</td>
                      <td style={{ padding: '10px 12px', color: '#374151' }}>{a.task_description || '—'}</td>
                      <td style={{ padding: '10px 12px', color: '#374151', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.notes || '—'}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <button onClick={() => openModal('attendance', { ...a })} style={iconBtn}><IcoEdit /></button>
                      </td>
                    </tr>
                  ))}
                  {attendance.length === 0 && (
                    <tr><td colSpan={9} style={{ padding: 32, textAlign: 'center', color: '#6b7280' }}>No attendance records. Log your first time entry.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── PAYROLL ── */}
        {tab === 'payroll' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Pay Periods</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <a
                  href={`${API}/api/hr/payroll/export?business_id=${bid}${selPeriod ? `&pay_period_id=${selPeriod}` : ''}`}
                  download
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 14px', fontSize: 13, fontWeight: 500, color: '#374151', background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, textDecoration: 'none' }}
                >
                  ↓ Export CSV
                </a>
                <button onClick={() => openModal('payperiod')} style={btnStyle('#16a34a')}>
                  <IcoPlus /> New Pay Period
                </button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
              {/* Pay period list */}
              <div>
                {payPeriods.map(p => (
                  <div key={p.period_id} onClick={() => loadSlips(p.period_id)} style={{
                    background: '#fff', border: selPeriod === p.period_id ? '2px solid #16a34a' : '1px solid #e5e7eb',
                    borderRadius: 10, padding: 16, marginBottom: 10, cursor: 'pointer',
                  }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>
                      {fmtDate(p.period_start)} – {fmtDate(p.period_end)}
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 13, color: '#6b7280' }}>
                      <span>{p.schedule}</span>
                      <span>{statusBadge(p.status, {
                        open:      { bg: '#dbeafe', color: '#1d4ed8' },
                        calculated:{ bg: '#fef3c7', color: '#92400e' },
                        confirmed: { bg: '#dcfce7', color: '#166534' },
                      })}</span>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 13, color: '#374151' }}>
                      Net: <strong>${fmt(p.total_net_pay)}</strong> ({p.employee_count} employees)
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      {p.status !== 'confirmed' && (
                        <button onClick={(e) => { e.stopPropagation(); calcPayroll(p.period_id); }} style={smallBtn('#d97706')}>
                          Calculate
                        </button>
                      )}
                      {p.status === 'calculated' && (
                        <button onClick={(e) => { e.stopPropagation(); confirmPayroll(p.period_id); }} style={smallBtn('#16a34a')}>
                          Confirm & Lock
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {payPeriods.length === 0 && (
                  <div style={{ color: '#6b7280', padding: 20, textAlign: 'center' }}>No pay periods yet.</div>
                )}
              </div>

              {/* Pay slips */}
              <div>
                {slips.length > 0 ? (
                  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                      <thead>
                        <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                          {['Employee', 'Pay Type', 'Gross', 'Fed Tax', 'State Tax', 'SS', 'Medicare', 'Net Pay'].map(h => (
                            <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#6b7280', fontWeight: 600, fontSize: 12 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {slips.map((s, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '10px 12px', fontWeight: 600 }}>{s.employee_name}</td>
                            <td style={{ padding: '10px 12px' }}>{s.pay_type}</td>
                            <td style={{ padding: '10px 12px' }}>${fmt(s.gross_pay)}</td>
                            <td style={{ padding: '10px 12px' }}>${fmt(s.federal_tax)}</td>
                            <td style={{ padding: '10px 12px' }}>${fmt(s.state_tax)}</td>
                            <td style={{ padding: '10px 12px' }}>${fmt(s.ss_tax)}</td>
                            <td style={{ padding: '10px 12px' }}>${fmt(s.medicare_tax)}</td>
                            <td style={{ padding: '10px 12px', fontWeight: 700, color: '#16a34a' }}>${fmt(s.net_pay)}</td>
                          </tr>
                        ))}
                        <tr style={{ background: '#f9fafb', fontWeight: 700 }}>
                          <td colSpan={2} style={{ padding: '10px 12px' }}>Totals</td>
                          <td style={{ padding: '10px 12px' }}>${fmt(slips.reduce((s, r) => s + (r.gross_pay || 0), 0))}</td>
                          <td style={{ padding: '10px 12px' }}>${fmt(slips.reduce((s, r) => s + (r.federal_tax || 0), 0))}</td>
                          <td style={{ padding: '10px 12px' }}>${fmt(slips.reduce((s, r) => s + (r.state_tax || 0), 0))}</td>
                          <td style={{ padding: '10px 12px' }}>${fmt(slips.reduce((s, r) => s + (r.ss_tax || 0), 0))}</td>
                          <td style={{ padding: '10px 12px' }}>${fmt(slips.reduce((s, r) => s + (r.medicare_tax || 0), 0))}</td>
                          <td style={{ padding: '10px 12px', color: '#16a34a' }}>${fmt(slips.reduce((s, r) => s + (r.net_pay || 0), 0))}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ background: '#f9fafb', border: '1px dashed #d1d5db', borderRadius: 10, padding: 40, textAlign: 'center', color: '#6b7280' }}>
                    Select a pay period and click Calculate to view pay slips.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TASKS ── */}
        {tab === 'tasks' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Work Tasks</h2>
              <button onClick={() => openModal('task')} style={btnStyle('#16a34a')}>
                <IcoPlus /> New Task
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {['pending', 'in_progress', 'completed'].map(status => (
                <div key={status}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                    {status.replace('_', ' ')}
                  </div>
                  {tasks.filter(t => t.status === status).map(t => (
                    <div key={t.task_id} style={{
                      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
                      padding: '12px 14px', marginBottom: 8,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#111827', flex: 1, marginRight: 8 }}>{t.title}</div>
                        {statusBadge(t.priority, {
                          high:   { bg: '#fee2e2', color: '#dc2626' },
                          normal: { bg: '#dbeafe', color: '#1d4ed8' },
                          low:    { bg: '#f3f4f6', color: '#6b7280' },
                        })}
                      </div>
                      {t.description && <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{t.description}</div>}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: '#9ca3af' }}>
                        <span>{t.assigned_to_name || 'Unassigned'}</span>
                        <span>{t.due_date ? fmtDate(t.due_date) : ''}</span>
                      </div>
                      <button onClick={() => openModal('task', { ...t })} style={{ ...iconBtn, marginTop: 6 }}><IcoEdit /></button>
                    </div>
                  ))}
                  {tasks.filter(t => t.status === status).length === 0 && (
                    <div style={{ color: '#9ca3af', fontSize: 13, padding: '8px 0' }}>None</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── LEAVE ── */}
        {tab === 'leave' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Leave Requests</h2>
              <button onClick={() => openModal('leave')} style={btnStyle('#16a34a')}>
                <IcoPlus /> New Request
              </button>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    {['Employee', 'Type', 'From', 'To', 'Days', 'Status', 'Reason', 'Actions'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#6b7280', fontWeight: 600, fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leave.map(l => (
                    <tr key={l.leave_id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{l.employee_name}</td>
                      <td style={{ padding: '10px 12px' }}>{l.leave_type}</td>
                      <td style={{ padding: '10px 12px' }}>{fmtDate(l.start_date)}</td>
                      <td style={{ padding: '10px 12px' }}>{fmtDate(l.end_date)}</td>
                      <td style={{ padding: '10px 12px' }}>{l.days_requested}</td>
                      <td style={{ padding: '10px 12px' }}>
                        {statusBadge(l.status, {
                          pending:  { bg: '#fef3c7', color: '#92400e' },
                          approved: { bg: '#dcfce7', color: '#166534' },
                          denied:   { bg: '#fee2e2', color: '#dc2626' },
                        })}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#374151', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.reason || '—'}</td>
                      <td style={{ padding: '10px 12px' }}>
                        {l.status === 'pending' && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => reviewLeave(l.leave_id, 'approved')} style={{ ...iconBtn, color: '#16a34a' }} title="Approve"><IcoCheck /></button>
                            <button onClick={() => reviewLeave(l.leave_id, 'denied')} style={{ ...iconBtn, color: '#dc2626' }} title="Deny"><IcoX /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {leave.length === 0 && (
                    <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: '#6b7280' }}>No leave requests.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── MODALS ── */}
      {modal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }} onClick={closeModal}>
          <div style={{
            background: '#fff', borderRadius: 12, padding: 28, width: 520, maxWidth: '95vw',
            maxHeight: '90vh', overflowY: 'auto',
          }} onClick={e => e.stopPropagation()}>

            {/* Worker Modal */}
            {modal.type === 'worker' && (
              <>
                <h3 style={{ marginBottom: 20, fontWeight: 700 }}>{form.employee_id ? 'Edit' : 'Add'} Employee</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={lbl}>First Name *</label>
                    <input style={inp} value={form.first_name || ''} onChange={e => f('first_name', e.target.value)} />
                  </div>
                  <div>
                    <label style={lbl}>Last Name *</label>
                    <input style={inp} value={form.last_name || ''} onChange={e => f('last_name', e.target.value)} />
                  </div>
                  <div>
                    <label style={lbl}>Job Title</label>
                    <input style={inp} value={form.job_title || ''} onChange={e => f('job_title', e.target.value)} />
                  </div>
                  <div>
                    <label style={lbl}>Department</label>
                    <input style={inp} value={form.department || ''} onChange={e => f('department', e.target.value)} />
                  </div>
                  <div>
                    <label style={lbl}>Employment Type</label>
                    <select style={inp} value={form.employment_type || 'full_time'} onChange={e => f('employment_type', e.target.value)}>
                      {['full_time','part_time','seasonal','contractor'].map(v => <option key={v} value={v}>{v.replace('_',' ')}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Pay Type</label>
                    <select style={inp} value={form.pay_type || 'hourly'} onChange={e => f('pay_type', e.target.value)}>
                      {['hourly','salary','piece_rate'].map(v => <option key={v} value={v}>{v.replace('_',' ')}</option>)}
                    </select>
                  </div>
                  {(form.pay_type === 'hourly' || !form.pay_type) && (
                    <div>
                      <label style={lbl}>Hourly Rate ($)</label>
                      <input style={inp} type="number" step="0.01" value={form.hourly_rate || ''} onChange={e => f('hourly_rate', e.target.value)} />
                    </div>
                  )}
                  {form.pay_type === 'salary' && (
                    <div>
                      <label style={lbl}>Annual Salary ($)</label>
                      <input style={inp} type="number" step="100" value={form.salary_annual || ''} onChange={e => f('salary_annual', e.target.value)} />
                    </div>
                  )}
                  {form.pay_type === 'piece_rate' && (
                    <div>
                      <label style={lbl}>Rate per Unit ($)</label>
                      <input style={inp} type="number" step="0.01" value={form.pay_rate || ''} onChange={e => f('pay_rate', e.target.value)} />
                    </div>
                  )}
                  <div>
                    <label style={lbl}>Pay Schedule</label>
                    <select style={inp} value={form.pay_schedule || 'biweekly'} onChange={e => f('pay_schedule', e.target.value)}>
                      {['weekly','biweekly','monthly'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Hire Date</label>
                    <input style={inp} type="date" value={form.hire_date || ''} onChange={e => f('hire_date', e.target.value)} />
                  </div>
                  <div>
                    <label style={lbl}>Phone</label>
                    <input style={inp} value={form.phone || ''} onChange={e => f('phone', e.target.value)} />
                  </div>
                  <div>
                    <label style={lbl}>Email</label>
                    <input style={inp} type="email" value={form.email || ''} onChange={e => f('email', e.target.value)} />
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <label style={lbl}>Notes</label>
                  <textarea style={{ ...inp, height: 60 }} value={form.notes || ''} onChange={e => f('notes', e.target.value)} />
                </div>
                <div style={modalBtns}>
                  <button onClick={closeModal} style={btnStyle('#6b7280')}>Cancel</button>
                  <button onClick={saveWorker} style={btnStyle('#16a34a')}>Save Employee</button>
                </div>
              </>
            )}

            {/* Attendance Modal */}
            {modal.type === 'attendance' && (
              <>
                <h3 style={{ marginBottom: 20, fontWeight: 700 }}>{form.attendance_id ? 'Edit' : 'Log'} Attendance</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={lbl}>Employee</label>
                    <select style={inp} value={form.employee_id || ''} onChange={e => f('employee_id', e.target.value)}>
                      <option value="">Select…</option>
                      {workers.map(w => <option key={w.employee_id} value={w.employee_id}>{w.first_name} {w.last_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Work Date</label>
                    <input style={inp} type="date" value={form.work_date || ''} onChange={e => f('work_date', e.target.value)} />
                  </div>
                  <div>
                    <label style={lbl}>Check-In</label>
                    <input style={inp} type="time" value={form.check_in || ''} onChange={e => f('check_in', e.target.value)} />
                  </div>
                  <div>
                    <label style={lbl}>Check-Out</label>
                    <input style={inp} type="time" value={form.check_out || ''} onChange={e => f('check_out', e.target.value)} />
                  </div>
                  <div>
                    <label style={lbl}>Hours Worked (manual)</label>
                    <input style={inp} type="number" step="0.25" value={form.hours_worked || ''} onChange={e => f('hours_worked', e.target.value)} />
                  </div>
                  <div>
                    <label style={lbl}>OT Hours</label>
                    <input style={inp} type="number" step="0.25" value={form.overtime_hours || ''} onChange={e => f('overtime_hours', e.target.value)} />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={lbl}>Task Description</label>
                    <input style={inp} value={form.task_description || ''} onChange={e => f('task_description', e.target.value)} />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={lbl}>Notes</label>
                    <textarea style={{ ...inp, height: 60 }} value={form.notes || ''} onChange={e => f('notes', e.target.value)} />
                  </div>
                </div>
                <div style={modalBtns}>
                  <button onClick={closeModal} style={btnStyle('#6b7280')}>Cancel</button>
                  <button onClick={saveAttendance} style={btnStyle('#16a34a')}>Save</button>
                </div>
              </>
            )}

            {/* Task Modal */}
            {modal.type === 'task' && (
              <>
                <h3 style={{ marginBottom: 20, fontWeight: 700 }}>{form.task_id ? 'Edit' : 'New'} Task</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={lbl}>Title *</label>
                    <input style={inp} value={form.title || ''} onChange={e => f('title', e.target.value)} />
                  </div>
                  <div>
                    <label style={lbl}>Assigned To</label>
                    <select style={inp} value={form.assigned_to || ''} onChange={e => f('assigned_to', e.target.value)}>
                      <option value="">Unassigned</option>
                      {workers.map(w => <option key={w.employee_id} value={w.employee_id}>{w.first_name} {w.last_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Priority</label>
                    <select style={inp} value={form.priority || 'normal'} onChange={e => f('priority', e.target.value)}>
                      {['high','normal','low'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Due Date</label>
                    <input style={inp} type="date" value={form.due_date || ''} onChange={e => f('due_date', e.target.value)} />
                  </div>
                  <div>
                    <label style={lbl}>Status</label>
                    <select style={inp} value={form.status || 'pending'} onChange={e => f('status', e.target.value)}>
                      {['pending','in_progress','completed','cancelled'].map(v => <option key={v} value={v}>{v.replace('_',' ')}</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={lbl}>Description</label>
                    <textarea style={{ ...inp, height: 70 }} value={form.description || ''} onChange={e => f('description', e.target.value)} />
                  </div>
                </div>
                <div style={modalBtns}>
                  <button onClick={closeModal} style={btnStyle('#6b7280')}>Cancel</button>
                  <button onClick={saveTask} style={btnStyle('#16a34a')}>Save Task</button>
                </div>
              </>
            )}

            {/* Leave Modal */}
            {modal.type === 'leave' && (
              <>
                <h3 style={{ marginBottom: 20, fontWeight: 700 }}>New Leave Request</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={lbl}>Employee</label>
                    <select style={inp} value={form.employee_id || ''} onChange={e => f('employee_id', e.target.value)}>
                      <option value="">Select…</option>
                      {workers.map(w => <option key={w.employee_id} value={w.employee_id}>{w.first_name} {w.last_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Leave Type</label>
                    <select style={inp} value={form.leave_type || 'vacation'} onChange={e => f('leave_type', e.target.value)}>
                      {['vacation','sick','personal','family','unpaid','other'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Start Date</label>
                    <input style={inp} type="date" value={form.start_date || ''} onChange={e => f('start_date', e.target.value)} />
                  </div>
                  <div>
                    <label style={lbl}>End Date</label>
                    <input style={inp} type="date" value={form.end_date || ''} onChange={e => f('end_date', e.target.value)} />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={lbl}>Reason</label>
                    <textarea style={{ ...inp, height: 70 }} value={form.reason || ''} onChange={e => f('reason', e.target.value)} />
                  </div>
                </div>
                <div style={modalBtns}>
                  <button onClick={closeModal} style={btnStyle('#6b7280')}>Cancel</button>
                  <button onClick={saveLeave} style={btnStyle('#16a34a')}>Submit Request</button>
                </div>
              </>
            )}

            {/* Pay Period Modal */}
            {modal.type === 'payperiod' && (
              <>
                <h3 style={{ marginBottom: 20, fontWeight: 700 }}>New Pay Period</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={lbl}>Period Start *</label>
                    <input style={inp} type="date" value={form.period_start || ''} onChange={e => f('period_start', e.target.value)} />
                  </div>
                  <div>
                    <label style={lbl}>Period End *</label>
                    <input style={inp} type="date" value={form.period_end || ''} onChange={e => f('period_end', e.target.value)} />
                  </div>
                  <div>
                    <label style={lbl}>Pay Schedule</label>
                    <select style={inp} value={form.schedule || 'biweekly'} onChange={e => f('schedule', e.target.value)}>
                      {['weekly','biweekly','monthly'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Payment Date</label>
                    <input style={inp} type="date" value={form.payment_date || ''} onChange={e => f('payment_date', e.target.value)} />
                  </div>
                </div>
                <div style={modalBtns}>
                  <button onClick={closeModal} style={btnStyle('#6b7280')}>Cancel</button>
                  <button onClick={createPayPeriod} style={btnStyle('#16a34a')}>Create Pay Period</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}</AccountLayout>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const btnStyle = (bg) => ({
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '8px 16px', borderRadius: 8, border: 'none',
  background: bg, color: '#fff', fontWeight: 600, fontSize: 13,
  cursor: 'pointer',
});
const smallBtn = (bg) => ({
  padding: '4px 10px', borderRadius: 6, border: 'none',
  background: bg, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
});
const iconBtn = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: '#6b7280', padding: '2px 4px', borderRadius: 4,
};
const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 };
const inp = {
  width: '100%', border: '1px solid #d1d5db', borderRadius: 8,
  padding: '8px 10px', fontSize: 14, outline: 'none', boxSizing: 'border-box',
};
const modalBtns = { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 };
