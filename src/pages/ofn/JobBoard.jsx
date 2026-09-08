// Ported from Oatmeal Farm Network (src/JobBoard.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
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

const JOB_TYPES = ['seasonal', 'part-time', 'full-time', 'internship', 'apprenticeship', 'contract'];
const CATEGORIES = ['Crop Production', 'Livestock', 'Equipment Operation', 'Irrigation', 'Harvesting',
  'Agronomy / Scouting', 'Farm Management', 'CSA / Market Farming', 'Winery / Orchard', 'General Labor', 'Other'];
const PAY_PERIODS = ['hour', 'day', 'week', 'month', 'season', 'year'];

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function typeBadge(jt) {
  const colors = {
    seasonal: 'bg-orange-100 text-orange-700',
    'full-time': 'bg-blue-100 text-blue-700',
    'part-time': 'bg-purple-100 text-purple-700',
    internship: 'bg-teal-100 text-teal-700',
    apprenticeship: 'bg-yellow-100 text-yellow-700',
    contract: 'bg-gray-100 text-gray-600',
  };
  return <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${colors[jt] || 'bg-gray-100 text-gray-600'}`}>{jt}</span>;
}

// ── Browse ────────────────────────────────────────────────────────────────────
// Defined at module scope: if this lived inside MyJobListings it would be a new
// component type on every render, remounting its inputs and dropping focus after
// each keystroke.
const F = ({ label, children }) => (
  <div><label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>{children}</div>
);

export default function JobBoard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState('');
  const [jobType, setJobType] = useState('');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyForm, setApplyForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [applying, setApplying] = useState(false);
  const [appliedOk, setAppliedOk] = useState(false);

  const load = () => {
    const params = new URLSearchParams();
    if (state) params.set('state', state);
    if (jobType) params.set('job_type', jobType);
    if (q) params.set('q', q);
    setLoading(true);
    fetch(`${API}/api/jobs?${params}`).then(r => r.json()).then(d => { setJobs(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(load, [state, jobType]);

  const apply = async () => {
    if (!applyForm.name || !applyForm.email) return;
    setApplying(true);
    const r = await fetch(`${API}/api/jobs/${selected.JobID}/apply`, {
      method: 'POST', headers: authHeaders(), body: JSON.stringify({ ...applyForm }),
    });
    setApplying(false);
    if (r.ok) { setAppliedOk(true); setTimeout(() => { setApplyOpen(false); setAppliedOk(false); }, 2000); }
  };

  return (
    <div style={{ backgroundColor: '#f7f2e8', minHeight: '100vh' }}>
      <PageMeta title="Farm Job Board — Oatmeal Farm Network" description="Find seasonal, part-time, and full-time farm jobs across the network." />
      <Header />
      <div style={{ background: 'linear-gradient(90deg,rgba(255,255,255,0.93) 0%,rgba(255,255,255,0) 100%)', borderBottom: '1px solid #e5e7eb' }}>
        <div className="max-w-5xl mx-auto px-6 py-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Breadcrumbs items={[{ label: 'Farm Job Board' }]} />
            <h1 className="text-3xl font-bold text-gray-900 mt-1" style={{ fontFamily: "'Lora','Times New Roman',serif" }}>Farm Job Board</h1>
            <p className="text-gray-500 text-sm mt-1">Seasonal labor, apprenticeships, and full-time farm positions.</p>
          </div>
          <Link to="/jobs/post" className="px-4 py-2 rounded-lg text-white font-bold text-sm" style={{ backgroundColor: NAV_BG }}>
            Post a Job
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" value={jobType} onChange={e => setJobType(e.target.value)}>
            <option value="">All Types</option>
            {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" placeholder="State (e.g. Iowa)" value={state} onChange={e => setState(e.target.value)} style={{ width: 160 }} />
          <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white flex-1" style={{ minWidth: 200 }} placeholder="Search jobs…" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} />
          <button onClick={load} className="px-4 py-2 rounded-lg text-white text-sm font-bold" style={{ backgroundColor: GREEN }}>Search</button>
        </div>

        {loading ? <p className="text-gray-400">Loading…</p> : jobs.length === 0 ? (
          <div className="text-center py-20 text-gray-400">No jobs found. Try adjusting your filters.</div>
        ) : (
          <div className="space-y-3">
            {jobs.map(job => (
              <button key={job.JobID} onClick={() => { setSelected(job); setApplyOpen(false); }}
                className="w-full text-left bg-white rounded-xl border border-gray-200 px-5 py-4 hover:shadow-md transition">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-gray-900 text-base">{job.Title}</div>
                    <div className="text-sm text-gray-500 mt-0.5">{job.BusinessName} · {job.City}{job.StateProvince ? `, ${job.StateProvince}` : ''}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {typeBadge(job.JobType)}
                    {job.PayRate && <span className="text-sm font-semibold text-gray-700">${job.PayRate}/{job.PayPeriod || 'hr'}</span>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                  {job.HousingProvided ? <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Housing</span> : null}
                  {job.MealsProvided ? <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Meals</span> : null}
                  {job.SeasonStart && <span>Starts {fmtDate(job.SeasonStart)}</span>}
                  {job.ApplyDeadline && <span>Apply by {fmtDate(job.ApplyDeadline)}</span>}
                  {job.HoursPerWeek && <span>{job.HoursPerWeek} hrs/wk</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Job detail side panel */}
      {selected && (
        <div className="fixed inset-0 z-40 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} onClick={() => setSelected(null)}>
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ backgroundColor: NAV_BG }}>
              <span className="text-white font-bold">{selected.BusinessName}</span>
              <button onClick={() => setSelected(null)} className="text-white hover:bg-white/20 rounded-full p-1">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Lora','Times New Roman',serif" }}>{selected.Title}</h2>
                <div className="flex items-center gap-2 mt-1">{typeBadge(selected.JobType)}
                  <span className="text-sm text-gray-500">{selected.City}{selected.StateProvince ? `, ${selected.StateProvince}` : ''}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {selected.PayRate && <div><span className="font-semibold text-gray-600">Pay:</span> ${selected.PayRate}/{selected.PayPeriod || 'hr'}</div>}
                {selected.HoursPerWeek && <div><span className="font-semibold text-gray-600">Hours:</span> {selected.HoursPerWeek}/wk</div>}
                {selected.SeasonStart && <div><span className="font-semibold text-gray-600">Starts:</span> {fmtDate(selected.SeasonStart)}</div>}
                {selected.SeasonEnd && <div><span className="font-semibold text-gray-600">Ends:</span> {fmtDate(selected.SeasonEnd)}</div>}
                <div><span className="font-semibold text-gray-600">Housing:</span> {selected.HousingProvided ? 'Yes' : 'No'}</div>
                <div><span className="font-semibold text-gray-600">Meals:</span> {selected.MealsProvided ? 'Yes' : 'No'}</div>
                {selected.ApplyDeadline && <div className="col-span-2"><span className="font-semibold text-gray-600">Apply by:</span> {fmtDate(selected.ApplyDeadline)}</div>}
                {selected.ContactEmail && <div className="col-span-2"><span className="font-semibold text-gray-600">Contact:</span> <a href={`mailto:${selected.ContactEmail}`} className="text-green-700 underline">{selected.ContactEmail}</a></div>}
              </div>
              {selected.Description && <p className="text-sm text-gray-700 whitespace-pre-wrap">{selected.Description}</p>}
              {!applyOpen ? (
                <button onClick={() => setApplyOpen(true)} className="w-full py-3 rounded-xl text-white font-bold" style={{ backgroundColor: GREEN }}>
                  Apply Now
                </button>
              ) : (
                <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="font-semibold text-gray-800">Your Application</div>
                  {appliedOk ? (
                    <div className="text-center text-green-700 font-bold py-4">Application submitted!</div>
                  ) : (
                    <>
                      <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Your name *" value={applyForm.name} onChange={e => setApplyForm(f => ({ ...f, name: e.target.value }))} />
                      <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Email address *" value={applyForm.email} onChange={e => setApplyForm(f => ({ ...f, email: e.target.value }))} />
                      <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Phone (optional)" value={applyForm.phone} onChange={e => setApplyForm(f => ({ ...f, phone: e.target.value }))} />
                      <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" rows={4} placeholder="Cover message (optional)" value={applyForm.message} onChange={e => setApplyForm(f => ({ ...f, message: e.target.value }))} />
                      <button onClick={apply} disabled={applying || !applyForm.name || !applyForm.email}
                        className="w-full py-2.5 rounded-lg text-white font-bold text-sm disabled:opacity-40"
                        style={{ backgroundColor: GREEN }}>{applying ? 'Submitting…' : 'Submit Application'}</button>
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

// ── Post / Manage jobs ────────────────────────────────────────────────────────
export function MyJobListings() {
  const { BusinessID } = useAccount();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankForm());
  const [saving, setSaving] = useState(false);
  const [apps, setApps] = useState(null);
  const [appsJob, setAppsJob] = useState(null);

  function blankForm() {
    return { title: '', description: '', job_type: 'seasonal', category: '', pay_rate: '', pay_period: 'hour',
      housing_provided: false, meals_provided: false, season_start: '', season_end: '',
      apply_deadline: '', hours_per_week: '', city: '', state_province: '', contact_email: '' };
  }

  const load = () => {
    if (!BusinessID) return;
    fetch(`${API}/api/jobs/business/${BusinessID}`, { headers: authHeaders() })
      .then(r => r.json()).then(d => setJobs(Array.isArray(d) ? d : []));
  };
  useEffect(load, [BusinessID]);

  const save = async () => {
    setSaving(true);
    const body = { ...form, pay_rate: form.pay_rate ? parseFloat(form.pay_rate) : null, hours_per_week: form.hours_per_week ? parseInt(form.hours_per_week) : null };
    const url = editing ? `${API}/api/jobs/${editing}` : `${API}/api/jobs/business/${BusinessID}`;
    const method = editing ? 'PUT' : 'POST';
    await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
    setSaving(false);
    setEditing(null); setForm(blankForm()); load();
  };

  const del = async (id) => {
    if (!confirm('Remove this listing?')) return;
    await fetch(`${API}/api/jobs/${id}`, { method: 'DELETE', headers: authHeaders() });
    load();
  };

  const viewApps = (job) => {
    setAppsJob(job);
    fetch(`${API}/api/jobs/${job.JobID}/applications`, { headers: authHeaders() })
      .then(r => r.json()).then(setApps);
  };

  const startEdit = (job) => {
    setEditing(job.JobID);
    setForm({ title: job.Title || '', description: job.Description || '', job_type: job.JobType || 'seasonal',
      category: job.Category || '', pay_rate: job.PayRate || '', pay_period: job.PayPeriod || 'hour',
      housing_provided: !!job.HousingProvided, meals_provided: !!job.MealsProvided,
      season_start: job.SeasonStart ? job.SeasonStart.split('T')[0] : '',
      season_end: job.SeasonEnd ? job.SeasonEnd.split('T')[0] : '',
      apply_deadline: job.ApplyDeadline ? job.ApplyDeadline.split('T')[0] : '',
      hours_per_week: job.HoursPerWeek || '', city: job.City || '',
      state_province: job.StateProvince || '', contact_email: job.ContactEmail || '' });
  };

  const inp = (key, props = {}) => (
    <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
      value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} {...props} />
  );

  return (
    <div style={{ backgroundColor: '#f7f2e8', minHeight: '100vh' }}>
      <Header />
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Breadcrumbs items={[{ label: 'Job Board', to: '/jobs' }, { label: 'My Listings' }]} />
        <div className="flex items-center justify-between mt-2 mb-6">
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Lora','Times New Roman',serif" }}>My Job Listings</h1>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="font-bold text-gray-800 mb-4">{editing ? 'Edit Listing' : 'Post a New Job'}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <F label="Job Title *"><div className="col-span-2">{inp('title', { placeholder: 'e.g. Seasonal Harvest Worker' })}</div></F>
            <F label="Job Type">
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.job_type} onChange={e => setForm(f => ({ ...f, job_type: e.target.value }))}>
                {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </F>
            <F label="Category">
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                <option value="">Select…</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </F>
            <F label="Pay Rate">{inp('pay_rate', { type: 'number', placeholder: '15.00' })}</F>
            <F label="Pay Period">
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.pay_period} onChange={e => setForm(f => ({ ...f, pay_period: e.target.value }))}>
                {PAY_PERIODS.map(p => <option key={p} value={p}>per {p}</option>)}
              </select>
            </F>
            <F label="Season Start">{inp('season_start', { type: 'date' })}</F>
            <F label="Season End">{inp('season_end', { type: 'date' })}</F>
            <F label="Apply Deadline">{inp('apply_deadline', { type: 'date' })}</F>
            <F label="Hours per Week">{inp('hours_per_week', { type: 'number', placeholder: '40' })}</F>
            <F label="City">{inp('city')}</F>
            <F label="State">{inp('state_province', { placeholder: 'Iowa' })}</F>
            <F label="Contact Email">{inp('contact_email', { type: 'email' })}</F>
          </div>
          <div className="flex gap-6 mt-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.housing_provided} onChange={e => setForm(f => ({ ...f, housing_provided: e.target.checked }))} className="accent-green-700" />
              Housing provided
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.meals_provided} onChange={e => setForm(f => ({ ...f, meals_provided: e.target.checked }))} className="accent-green-700" />
              Meals provided
            </label>
          </div>
          <div className="mt-3">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
            <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" rows={4}
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the role, requirements, and what makes your farm special…" />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={save} disabled={saving || !form.title}
              className="px-5 py-2.5 rounded-lg text-white font-bold text-sm disabled:opacity-40"
              style={{ backgroundColor: GREEN }}>{saving ? 'Saving…' : editing ? 'Update' : 'Post Job'}</button>
            {editing && <button onClick={() => { setEditing(null); setForm(blankForm()); }} className="px-5 py-2.5 rounded-lg text-sm bg-gray-100 text-gray-600">Cancel</button>}
          </div>
        </div>

        {/* Listings */}
        {jobs.length === 0 ? <p className="text-gray-400 text-center py-8">No job listings yet.</p> : (
          <div className="space-y-3">
            {jobs.map(job => (
              <div key={job.JobID} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-gray-900">{job.Title}</div>
                    <div className="flex items-center gap-2 mt-1">{typeBadge(job.JobType)}
                      <span className="text-xs text-gray-400">{job.ApplicationCount ?? 0} application{job.ApplicationCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => viewApps(job)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">Applications</button>
                    <button onClick={() => startEdit(job)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">Edit</button>
                    <button onClick={() => del(job.JobID)} className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50">Remove</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Applications modal */}
        {appsJob && apps && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ backgroundColor: NAV_BG }}>
                <span className="text-white font-bold">Applications — {appsJob.Title}</span>
                <button onClick={() => { setAppsJob(null); setApps(null); }} className="text-white">✕</button>
              </div>
              <div className="overflow-y-auto p-5 space-y-3">
                {apps.length === 0 ? <p className="text-gray-400 text-center py-6">No applications yet.</p> : apps.map(a => (
                  <div key={a.ApplicationID} className="border border-gray-200 rounded-xl px-4 py-3">
                    <div className="font-semibold text-gray-800">{a.ApplicantName}</div>
                    <div className="text-xs text-gray-500">{a.ApplicantEmail} {a.Phone ? `· ${a.Phone}` : ''}</div>
                    {a.Message && <p className="text-sm text-gray-700 mt-2">{a.Message}</p>}
                    <div className="text-xs text-gray-400 mt-1">{new Date(a.CreatedAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
