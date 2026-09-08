// Ported from Oatmeal Farm Network (src/EventsManage.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router';
import { useTranslation } from '../../lib/i18n';
import AccountLayout from '../../components/AccountLayout';
import EventAdminLayout from '../../components/EventAdminLayout';
import { useAccount } from '../../lib/AccountContext';
import RichTextEditor from '../../components/RichTextEditor';
import { getPeopleId } from '../../lib/auth';

const API = import.meta.env.VITE_LIVESTOCK_API_URL || '';
const inp = "border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-[#819360]";
const lbl = "block text-xs font-medium text-gray-500 mb-1";

const EMPTY = {
  EventName: '', EventDescription: '', EventType: '', EventStartDate: '', EventEndDate: '',
  EventImage: '', EventLocationName: '', EventLocationStreet: '', EventLocationCity: '',
  EventLocationState: '', EventLocationZip: '', EventContactEmail: '', EventPhone: '',
  EventWebsite: '', IsPublished: true, IsFree: true, RegistrationRequired: false, MaxAttendees: '',
};

const EVENT_TYPE_META = {
  'Free Event':                          { icon: '🎉' },
  'Basic Event':                         { icon: '📋' },
  'Conference':                          { icon: '🎤' },
  'Seminar':                             { icon: '🎓' },
  'Webinar/Online Class':                { icon: '💻' },
  'Workshop/Clinic':                     { icon: '🛠️' },
  'Networking Event':                    { icon: '🤝' },
  'Dining Event':                        { icon: '🍽️' },
  'Farm Tour/Open House':                { icon: '🚜' },
  'Competition/Judging':                 { icon: '🏆' },
  'Halter Show':                         { icon: '🦙' },
  'Basic Animal or Fleece Show':         { icon: '🐑' },
  'Spin-Off':                            { icon: '🧶' },
  'Alpaca Cottage Industry Fleece Show': { icon: '✂️' },
  'Auction':                             { icon: '💰' },
  'Market/Vendor Fair':                  { icon: '🛍️' },
};
const DEFAULT_META = { icon: '📅' };

const TYPE_KEY_MAP = {
  'Free Event': 'free_event',
  'Basic Event': 'basic_event',
  'Conference': 'conference',
  'Seminar': 'seminar',
  'Webinar/Online Class': 'webinar',
  'Workshop/Clinic': 'workshop',
  'Networking Event': 'networking',
  'Dining Event': 'dining',
  'Farm Tour/Open House': 'farm_tour',
  'Competition/Judging': 'competition',
  'Halter Show': 'halter',
  'Basic Animal or Fleece Show': 'fleece',
  'Spin-Off': 'spinoff',
  'Alpaca Cottage Industry Fleece Show': 'fiber_arts',
  'Auction': 'auction',
  'Market/Vendor Fair': 'vendor_fair',
};

function EventTypePicker({ onSelect, onCancel }) {
  const { t } = useTranslation();
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetch(`${API}/api/events/types`)
      .then(r => r.ok ? r.json() : [])
      .then(d => { setEventTypes(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = eventTypes.filter(et =>
    !filter || et.EventType.toLowerCase().includes(filter.toLowerCase())
  );

  const typeDesc = (typeName) =>
    t(`events_manage.type_desc_${TYPE_KEY_MAP[typeName] || 'default'}`);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-bold text-gray-700 text-lg mb-1">{t('events_manage.type_picker_heading')}</h2>
          <p className="text-sm text-gray-500">{t('events_manage.type_picker_desc')}</p>
        </div>
        <div className="text-xs text-gray-400">
          <span className="text-[#3D6B34] font-semibold">{t('events_manage.step_1_of_2')}</span> · {t('events_manage.step_1_label')}
        </div>
      </div>

      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder={t('events_manage.placeholder_search_types')}
        className={inp + " max-w-md"}
      />

      {loading ? (
        <div className="text-gray-400 text-sm py-8 text-center">{t('events_manage.loading_types')}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(et => {
            const meta = EVENT_TYPE_META[et.EventType] || DEFAULT_META;
            return (
              <button
                key={et.EventTypeID}
                type="button"
                onClick={() => onSelect(et.EventType)}
                className="text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-[#3D6B34] hover:shadow-sm transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 group-hover:text-[#3D6B34]">{et.EventType}</div>
                    <div className="text-xs text-gray-500 mt-1 leading-snug">{typeDesc(et.EventType)}</div>
                  </div>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full text-sm text-gray-400 text-center py-8">{t('events_manage.no_matching_types')}</div>
          )}
        </div>
      )}

      <div className="flex justify-start pt-2">
        <button type="button" onClick={onCancel}
          className="px-5 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
          {t('events_manage.btn_cancel')}
        </button>
      </div>
    </div>
  );
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function EventForm({ initial, onSave, onCancel, onChangeType, saving }) {
  const { t } = useTranslation();
  const hydrate = (src) => {
    const merged = { ...EMPTY, ...(src || {}) };
    for (const k of Object.keys(EMPTY)) {
      if (merged[k] == null && typeof EMPTY[k] === 'string') merged[k] = '';
    }
    return merged;
  };
  const [form, setForm] = useState(() => hydrate(initial));
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const setB = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.checked }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-5">
      {form.EventType && (
        <div className="bg-[#f6f8f3] border border-[#3D6B34]/20 rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-500 uppercase tracking-wide">{t('events_manage.lbl_event_type')}</div>
            <div className="font-semibold text-gray-800">{form.EventType}</div>
          </div>
          {onChangeType && (
            <button type="button" onClick={onChangeType}
              className="text-xs text-[#3D6B34] hover:underline font-semibold shrink-0">
              {t('events_manage.btn_change_type')}
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className={lbl}>{t('events_manage.lbl_event_name')}</label>
          <input value={form.EventName} onChange={set('EventName')} className={inp} required placeholder={t('events_manage.placeholder_event_name')} />
        </div>
        <div className="md:col-span-2">
          <label className={lbl}>{t('events_manage.lbl_event_image')}</label>
          <input value={form.EventImage} onChange={set('EventImage')} className={inp} placeholder={t('events_manage.placeholder_url')} />
        </div>
        <div>
          <label className={lbl}>{t('events_manage.lbl_start_date')}</label>
          <input type="date" value={form.EventStartDate ? form.EventStartDate.substring(0,10) : ''} onChange={set('EventStartDate')} className={inp} />
        </div>
        <div>
          <label className={lbl}>{t('events_manage.lbl_end_date')}</label>
          <input type="date" value={form.EventEndDate ? form.EventEndDate.substring(0,10) : ''} onChange={set('EventEndDate')} className={inp} />
        </div>
        <div className="md:col-span-2">
          <label className={lbl}>{t('events_manage.lbl_description')}</label>
          <RichTextEditor value={form.EventDescription}
            onChange={(v) => setForm(f => ({ ...f, EventDescription: v }))} minHeight={180} />
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">{t('events_manage.section_location')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className={lbl}>{t('events_manage.lbl_venue')}</label>
            <input value={form.EventLocationName} onChange={set('EventLocationName')} className={inp} placeholder={t('events_manage.placeholder_venue')} />
          </div>
          <div className="md:col-span-2">
            <label className={lbl}>{t('events_manage.lbl_street')}</label>
            <input value={form.EventLocationStreet} onChange={set('EventLocationStreet')} className={inp} />
          </div>
          <div>
            <label className={lbl}>{t('events_manage.lbl_city')}</label>
            <input value={form.EventLocationCity} onChange={set('EventLocationCity')} className={inp} />
          </div>
          <div>
            <label className={lbl}>{t('events_manage.lbl_state')}</label>
            <input value={form.EventLocationState} onChange={set('EventLocationState')} className={inp} placeholder={t('events_manage.placeholder_state')} />
          </div>
          <div>
            <label className={lbl}>{t('events_manage.lbl_zip')}</label>
            <input value={form.EventLocationZip} onChange={set('EventLocationZip')} className={inp} />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">{t('events_manage.section_contact')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className={lbl}>{t('events_manage.lbl_email')}</label>
            <input type="email" value={form.EventContactEmail} onChange={set('EventContactEmail')} className={inp} />
          </div>
          <div>
            <label className={lbl}>{t('events_manage.lbl_phone')}</label>
            <input value={form.EventPhone} onChange={set('EventPhone')} className={inp} />
          </div>
          <div>
            <label className={lbl}>{t('events_manage.lbl_website')}</label>
            <input value={form.EventWebsite} onChange={set('EventWebsite')} className={inp} placeholder={t('events_manage.placeholder_url')} />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">{t('events_manage.section_settings')}</h3>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.IsPublished} onChange={setB('IsPublished')} className="w-4 h-4 accent-green-600" />
            {t('events_manage.lbl_published')}
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.IsFree} onChange={setB('IsFree')} className="w-4 h-4 accent-green-600" />
            {t('events_manage.lbl_free')}
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.RegistrationRequired} onChange={setB('RegistrationRequired')} className="w-4 h-4 accent-green-600" />
            {t('events_manage.lbl_reg_required')}
          </label>
          <div>
            <label className={lbl}>{t('events_manage.lbl_max_attendees')}</label>
            <input type="number" min="1" value={form.MaxAttendees} onChange={set('MaxAttendees')} className={`${inp} w-28`} placeholder={t('events_manage.placeholder_unlimited')} />
          </div>
        </div>
      </div>

      <div className="flex justify-end items-center gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="px-5 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
          {t('events_manage.btn_cancel')}
        </button>
        <button type="submit" disabled={saving}
          className="bg-[#3D6B34] text-white font-semibold px-6 py-2 rounded-lg hover:bg-[#2d5226] disabled:opacity-50">
          {saving ? t('events_manage.btn_saving') : (initial?.EventID ? t('events_manage.btn_save_changes') : t('events_manage.btn_save_event'))}
        </button>
      </div>
    </form>
  );
}

function DateSlotsEditor({ eventId }) {
  const { t } = useTranslation();
  const [dates, setDates] = useState([]);
  const [adding, setAdding] = useState(false);
  const [newDate, setNewDate] = useState({ EventDate: '', StartTime: '', EndTime: '' });

  const load = () =>
    fetch(`${API}/api/events/${eventId}/dates`)
      .then(r => r.json()).then(d => setDates(Array.isArray(d) ? d : [])).catch(() => {});

  useEffect(() => { load(); }, [eventId]);

  const add = async () => {
    if (!newDate.EventDate) return;
    await fetch(`${API}/api/events/${eventId}/dates`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDate),
    });
    setNewDate({ EventDate: '', StartTime: '', EndTime: '' });
    setAdding(false);
    load();
  };

  const del = async (id) => {
    if (!confirm(t('events_manage.confirm_remove_date'))) return;
    await fetch(`${API}/api/events/dates/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide">{t('events_manage.dates_heading')}</h3>
        <button onClick={() => setAdding(true)} className="text-xs text-[#3D6B34] hover:underline font-semibold">{t('events_manage.btn_add_date')}</button>
      </div>

      {dates.length === 0 && !adding && (
        <p className="text-sm text-gray-400">{t('events_manage.no_dates')}</p>
      )}

      <div className="space-y-1.5">
        {dates.map(d => (
          <div key={d.DateID} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2 text-sm">
            <span className="font-medium text-gray-800">{formatDate(d.EventDate)}</span>
            {(d.StartTime || d.EndTime) && (
              <span className="text-gray-500">{d.StartTime}{d.EndTime ? ` – ${d.EndTime}` : ''}</span>
            )}
            <button onClick={() => del(d.DateID)} className="ml-auto text-xs text-red-400 hover:text-red-600">✕</button>
          </div>
        ))}
      </div>

      {adding && (
        <div className="mt-3 bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className={lbl}>{t('events_manage.lbl_date')}</label>
              <input type="date" value={newDate.EventDate}
                onChange={e => setNewDate(d => ({ ...d, EventDate: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className={lbl}>{t('events_manage.lbl_start_time')}</label>
              <input type="time" value={newDate.StartTime}
                onChange={e => setNewDate(d => ({ ...d, StartTime: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className={lbl}>{t('events_manage.lbl_end_time')}</label>
              <input type="time" value={newDate.EndTime}
                onChange={e => setNewDate(d => ({ ...d, EndTime: e.target.value }))} className={inp} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={add} className="text-sm bg-[#3D6B34] text-white px-4 py-1.5 rounded-lg hover:bg-[#2d5226]">{t('events_manage.btn_add')}</button>
            <button onClick={() => setAdding(false)} className="text-sm border border-gray-200 px-4 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100">{t('events_manage.btn_cancel')}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function OptionsEditor({ eventId }) {
  const { t } = useTranslation();
  const [opts, setOpts] = useState([]);
  const [adding, setAdding] = useState(false);
  const [newOpt, setNewOpt] = useState({ OptionName: '', OptionDescription: '', Price: '', MaxQty: '' });

  const load = () =>
    fetch(`${API}/api/events/${eventId}/options`)
      .then(r => r.json()).then(d => setOpts(Array.isArray(d) ? d : [])).catch(() => {});

  useEffect(() => { load(); }, [eventId]);

  const add = async () => {
    if (!newOpt.OptionName) return;
    await fetch(`${API}/api/events/${eventId}/options`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newOpt, Price: parseFloat(newOpt.Price) || 0, MaxQty: parseInt(newOpt.MaxQty) || null }),
    });
    setNewOpt({ OptionName: '', OptionDescription: '', Price: '', MaxQty: '' });
    setAdding(false);
    load();
  };

  const del = async (id) => {
    if (!confirm(t('events_manage.confirm_delete_option'))) return;
    await fetch(`${API}/api/events/options/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide">{t('events_manage.opts_heading')}</h3>
        <button onClick={() => setAdding(true)} className="text-xs text-[#3D6B34] hover:underline font-semibold">{t('events_manage.btn_add_option')}</button>
      </div>

      {opts.length === 0 && !adding && (
        <p className="text-sm text-gray-400">{t('events_manage.no_options')}</p>
      )}

      <div className="space-y-2">
        {opts.map(opt => (
          <div key={opt.OptionID} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
            <div className="flex-grow">
              <span className="text-sm font-medium text-gray-800">{opt.OptionName}</span>
              {opt.OptionDescription && <span className="text-xs text-gray-500 ml-2">{opt.OptionDescription}</span>}
            </div>
            <span className="text-sm font-bold text-[#3D6B34] shrink-0">
              {parseFloat(opt.Price) === 0 ? t('events_manage.price_free') : `$${parseFloat(opt.Price).toFixed(2)}`}
            </span>
            {opt.MaxQty && <span className="text-xs text-gray-400">{t('events_manage.max_qty', { n: opt.MaxQty })}</span>}
            <button onClick={() => del(opt.OptionID)} className="text-xs text-red-400 hover:text-red-600">✕</button>
          </div>
        ))}
      </div>

      {adding && (
        <div className="mt-3 bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input value={newOpt.OptionName} onChange={e => setNewOpt(o => ({ ...o, OptionName: e.target.value }))} className={inp} placeholder={t('events_manage.placeholder_opt_name')} />
            <input value={newOpt.OptionDescription} onChange={e => setNewOpt(o => ({ ...o, OptionDescription: e.target.value }))} className={inp} placeholder={t('events_manage.placeholder_opt_desc')} />
            <input type="number" step="0.01" min="0" value={newOpt.Price} onChange={e => setNewOpt(o => ({ ...o, Price: e.target.value }))} className={inp} placeholder={t('events_manage.placeholder_price')} />
            <input type="number" min="1" value={newOpt.MaxQty} onChange={e => setNewOpt(o => ({ ...o, MaxQty: e.target.value }))} className={inp} placeholder={t('events_manage.placeholder_max_qty')} />
          </div>
          <div className="flex gap-2">
            <button onClick={add} className="text-sm bg-[#3D6B34] text-white px-4 py-1.5 rounded-lg hover:bg-[#2d5226]">{t('events_manage.btn_add')}</button>
            <button onClick={() => setAdding(false)} className="text-sm border border-gray-200 px-4 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100">{t('events_manage.btn_cancel')}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function RegistrationsList({ eventId }) {
  const { t } = useTranslation();
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddresses, setShowAddresses] = useState(false);
  const [expandedReg, setExpandedReg] = useState(null);
  const printRef = useRef(null);

  const load = () =>
    fetch(`${API}/api/events/${eventId}/registrations`)
      .then(r => r.json()).then(d => { setRegs(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));

  useEffect(() => { load(); }, [eventId]);

  const markPaid = async (regId) => {
    await fetch(`${API}/api/events/registrations/${regId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ PaymentStatus: 'paid' }),
    });
    load();
  };

  const markPending = async (regId) => {
    await fetch(`${API}/api/events/registrations/${regId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ PaymentStatus: 'pending' }),
    });
    load();
  };

  const deleteReg = async (regId) => {
    if (!confirm(t('events_manage.confirm_delete_reg'))) return;
    await fetch(`${API}/api/events/registrations/${regId}`, { method: 'DELETE' });
    load();
  };

  const printList = () => {
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>${t('events_manage.print_title')}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th { background: #f0f0f0; text-align: left; padding: 6px 8px; border-bottom: 2px solid #ccc; font-size: 11px; text-transform: uppercase; }
        td { padding: 6px 8px; border-bottom: 1px solid #eee; vertical-align: top; }
        .items { font-size: 11px; color: #555; }
        .total-row { font-weight: bold; background: #f8f8f8; }
        h2 { margin-bottom: 4px; }
        .meta { color: #666; font-size: 11px; margin-bottom: 12px; }
      </style></head><body>
      <h2>${t('events_manage.print_title')}</h2>
      <div class="meta">${t('events_manage.print_printed', { date: new Date().toLocaleDateString() })}</div>
      <table>
        <tr>
          <th>${t('events_manage.col_date')}</th><th>${t('events_manage.col_name')}</th><th>${t('events_manage.lbl_email')}</th><th>${t('events_manage.lbl_phone')}</th>
          <th>${t('events_manage.col_items')}</th><th>${t('events_manage.col_total')}</th><th>${t('events_manage.col_status')}</th>
        </tr>
        ${regs.map(r => `
          <tr>
            <td>${new Date(r.RegDate).toLocaleDateString()}</td>
            <td>${r.AttendeeFirstName} ${r.AttendeeLastName}</td>
            <td>${r.AttendeeEmail || ''}</td>
            <td>${r.AttendeePhone || ''}</td>
            <td class="items">${(r.items || []).map(i => `${i.Quantity}× ${i.OptionName}`).join('<br>')}</td>
            <td>$${parseFloat(r.TotalAmount || 0).toFixed(2)}</td>
            <td>${r.PaymentStatus}</td>
          </tr>
        `).join('')}
        <tr class="total-row">
          <td colspan="5" style="text-align:right">${t('events_manage.total_income')}</td>
          <td>$${regs.reduce((s, r) => s + parseFloat(r.TotalAmount || 0), 0).toFixed(2)}</td>
          <td></td>
        </tr>
      </table>
      </body></html>
    `);
    w.document.close();
    w.print();
  };

  if (loading) return <div className="text-gray-400 text-sm py-4">{t('events_manage.loading_regs')}</div>;

  const totalIncome = regs.reduce((s, r) => s + parseFloat(r.TotalAmount || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide">
          {t('events_manage.regs_heading', { n: regs.length })}
        </h3>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
            <input type="checkbox" checked={showAddresses} onChange={e => setShowAddresses(e.target.checked)} className="w-3.5 h-3.5" />
            {t('events_manage.show_contact')}
          </label>
          <button onClick={printList} className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-2 py-1 rounded hover:bg-gray-50">
            {t('events_manage.btn_print_export')}
          </button>
        </div>
      </div>

      {regs.length === 0 ? (
        <p className="text-sm text-gray-400">{t('events_manage.no_regs')}</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase">
                  <th className="text-left py-2 px-3">{t('events_manage.col_name')}</th>
                  {showAddresses && <th className="text-left py-2 px-3">{t('events_manage.col_contact')}</th>}
                  <th className="text-left py-2 px-3">{t('events_manage.col_items')}</th>
                  <th className="text-right py-2 px-3">{t('events_manage.col_total')}</th>
                  <th className="text-left py-2 px-3">{t('events_manage.col_status')}</th>
                  <th className="text-left py-2 px-3">{t('events_manage.col_date')}</th>
                  <th className="py-2 px-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {regs.map(r => (
                  <React.Fragment key={r.RegID}>
                    <tr className="hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium text-gray-800">
                        <button onClick={() => setExpandedReg(expandedReg === r.RegID ? null : r.RegID)}
                          className="text-left hover:text-[#3D6B34]">
                          {r.AttendeeFirstName} {r.AttendeeLastName}
                        </button>
                      </td>
                      {showAddresses && (
                        <td className="py-2 px-3 text-gray-500 text-xs">
                          <div>{r.AttendeeEmail}</div>
                          {r.AttendeePhone && <div>{r.AttendeePhone}</div>}
                        </td>
                      )}
                      <td className="py-2 px-3 text-gray-500 text-xs">
                        {(r.items || []).length > 0
                          ? (r.items || []).map(i => `${i.Quantity}× ${i.OptionName}`).join(', ')
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-2 px-3 font-bold text-[#3D6B34] text-right">
                        ${parseFloat(r.TotalAmount || 0).toFixed(2)}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          r.PaymentStatus === 'paid' ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                        }`}>
                          {r.PaymentStatus}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-400 text-xs">{new Date(r.RegDate).toLocaleDateString()}</td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1">
                          {r.PaymentStatus !== 'paid' ? (
                            <button onClick={() => markPaid(r.RegID)}
                              className="text-xs text-green-600 hover:underline whitespace-nowrap">{t('events_manage.btn_mark_paid')}</button>
                          ) : (
                            <button onClick={() => markPending(r.RegID)}
                              className="text-xs text-gray-400 hover:text-gray-600 whitespace-nowrap">{t('events_manage.btn_unmark')}</button>
                          )}
                          <span className="text-gray-200">|</span>
                          <button onClick={() => deleteReg(r.RegID)}
                            className="text-xs text-red-400 hover:text-red-600">{t('events_manage.btn_delete')}</button>
                        </div>
                      </td>
                    </tr>
                    {expandedReg === r.RegID && (
                      <tr>
                        <td colSpan={showAddresses ? 7 : 6} className="bg-blue-50 px-4 py-3 text-sm border-y border-blue-100">
                          <div className="flex flex-wrap gap-6">
                            <div>
                              <p className="text-xs font-bold text-gray-500 uppercase mb-1">{t('events_manage.detail_contact_label')}</p>
                              <p className="text-gray-800">{r.AttendeeFirstName} {r.AttendeeLastName}</p>
                              <p className="text-gray-600">{r.AttendeeEmail}</p>
                              {r.AttendeePhone && <p className="text-gray-600">{r.AttendeePhone}</p>}
                            </div>
                            {(r.items || []).length > 0 && (
                              <div>
                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">{t('events_manage.detail_items_label')}</p>
                                {r.items.map((item, i) => (
                                  <p key={i} className="text-gray-700">
                                    {item.Quantity}× {item.OptionName}
                                    {parseFloat(item.UnitPrice) > 0 && <span className="text-gray-400 ml-1">(${parseFloat(item.UnitPrice).toFixed(2)} ea.)</span>}
                                  </p>
                                ))}
                              </div>
                            )}
                            {r.Notes && (
                              <div>
                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">{t('events_manage.detail_notes_label')}</p>
                                <p className="text-gray-700">{r.Notes}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
              {totalIncome > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td colSpan={showAddresses ? 3 : 2} className="py-2 px-3 text-xs font-bold text-gray-500 text-right uppercase">{t('events_manage.total_income')}</td>
                    <td className="py-2 px-3 font-bold text-[#3D6B34] text-right">${totalIncome.toFixed(2)}</td>
                    <td colSpan={showAddresses ? 3 : 2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default function EventsManage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const BusinessID = searchParams.get('BusinessID');
  const PeopleID = getPeopleId();
  const { Business, LoadBusiness } = useAccount();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formStep, setFormStep] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [draftType, setDraftType] = useState('');
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [activeTab, setActiveTab] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    if (!BusinessID) { setLoading(false); return; }
    LoadBusiness(BusinessID);
    loadEvents();
  }, [BusinessID]);

  const editId = searchParams.get('edit');
  useEffect(() => {
    if (!editId) return;
    fetch(`${API}/api/events/${editId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setEditingEvent(d); setFormStep('details'); } })
      .catch(() => {});
  }, [editId]);

  const loadEvents = () => {
    setLoading(true);
    fetch(`${API}/api/my-events?business_id=${BusinessID}`)
      .then(r => r.json()).then(d => { setEvents(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const openAdd = () => {
    setEditingEvent(null);
    setDraftType('');
    setFormStep('type');
  };

  const openEdit = async (ev) => {
    const res = await fetch(`${API}/api/events/${ev.EventID}`);
    const d = await res.json();
    setEditingEvent(d);
    setFormStep('details');
  };

  const closeForm = () => {
    setFormStep(null);
    setEditingEvent(null);
    setDraftType('');
  };

  const pickType = (type) => {
    setDraftType(type);
    setFormStep('details');
  };

  const save = async (form) => {
    if (!BusinessID) { alert(t('events_manage.err_no_org')); return; }
    setSaving(true);
    try {
      const payload = { ...form, BusinessID: parseInt(BusinessID), PeopleID: PeopleID ? parseInt(PeopleID) : null };
      if (editingEvent) {
        await fetch(`${API}/api/events/${editingEvent.EventID}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
      } else {
        const res = await fetch(`${API}/api/events`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
        const data = await res.json();
        setExpandedEvent(data.EventID);
      }
      closeForm();
      loadEvents();
    } catch (err) { alert(err.message); }
    setSaving(false);
  };

  const deleteEvent = (ev) => setConfirmDelete(ev);

  const doDelete = async () => {
    const ev = confirmDelete;
    setConfirmDelete(null);
    if (!ev) return;
    await fetch(`${API}/api/events/${ev.EventID}`, { method: 'DELETE' });
    loadEvents();
  };

  const cloneEvent = async (ev) => {
    const name = prompt(t('events_manage.prompt_clone'), `${ev.EventName} (Copy)`);
    if (!name) return;
    const res = await fetch(`${API}/api/events/${ev.EventID}/clone`, {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ EventName: name }),
    });
    if (res.ok) loadEvents();
    else alert(t('events_manage.err_clone_failed'));
  };

  const getTab = (eventId) => activeTab[eventId] || 'registrations';
  const setTab = (eventId, tab) => setActiveTab(prev => ({ ...prev, [eventId]: tab }));

  const editingId = editingEvent?.EventID || editId;
  const Wrapper = editingId ? EventAdminLayout : AccountLayout;
  const wrapperProps = editingId
    ? { eventId: String(editingId) }
    : { Business, BusinessID, PeopleID, pageTitle: t('events_manage.my_events_heading'), breadcrumbs: [{ label: t('events_manage.breadcrumb_dashboard'), to: '/dashboard' }, { label: t('events_manage.breadcrumb_events') }, { label: t('events_manage.breadcrumb_manage') }] };

  return (
    <Wrapper {...wrapperProps}>
      <div className="max-w-5xl mx-auto space-y-6">

        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-gray-800">
            {editingEvent ? t('events_manage.edit_page_title', { name: editingEvent.EventName }) : t('events_manage.my_events_heading')}
          </h1>
          {!editingEvent && (
            <div className="flex gap-2">
              <Link to="/events" className="border border-gray-200 text-sm text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 no-underline">
                {t('events_manage.btn_browse')}
              </Link>
              <Link to="/events/analytics" className="border border-indigo-200 text-sm text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-50 no-underline">
                {t('events_manage.btn_analytics')}
              </Link>
              <Link to={`/events/add?BusinessID=${BusinessID || ''}`}
                style={{ color: '#fff' }}
                className="bg-[#3D6B34] font-semibold px-5 py-2 rounded-lg hover:bg-[#2d5226] no-underline">
                {t('events_manage.btn_create_event')}
              </Link>
            </div>
          )}
          {editingEvent && (
            <Link to={`/events/${editingEvent.EventID}/dashboard`}
              className="text-sm text-gray-500 hover:text-gray-700 no-underline">
              {t('events_manage.btn_back_to_dashboard')}
            </Link>
          )}
        </div>

        {formStep === 'type' && !editingEvent && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <EventTypePicker
              onSelect={pickType}
              onCancel={closeForm}
            />
          </div>
        )}

        {formStep === 'details' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
              <h2 className="font-bold text-gray-700 text-lg">
                {editingEvent
                  ? t('events_manage.edit_event_heading', { name: editingEvent.EventName })
                  : t('events_manage.new_event_heading')}
              </h2>
              {!editingEvent && (
                <div className="text-xs text-gray-400">
                  <span className="text-[#3D6B34] font-semibold">{t('events_manage.step_2_of_2')}</span> · {t('events_manage.step_2_label')}
                </div>
              )}
            </div>
            <EventForm
              initial={editingEvent || { ...EMPTY, EventType: draftType }}
              onSave={save}
              onCancel={closeForm}
              onChangeType={editingEvent ? null : () => setFormStep('type')}
              saving={saving}
            />
          </div>
        )}

        {!editingEvent && (
        loading ? (
          <div className="text-center py-12 text-gray-400">{t('events_manage.loading')}</div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
            <p className="mb-4">{t('events_manage.no_events')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map(ev => (
              <div key={ev.EventID} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 flex items-center gap-4 flex-wrap">
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <h3 className="font-bold text-gray-800">{ev.EventName}</h3>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ev.IsPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {ev.IsPublished ? t('events_manage.status_published') : t('events_manage.status_draft')}
                      </span>
                      {ev.EventType && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{ev.EventType}</span>}
                    </div>
                    <div className="text-xs text-gray-500 flex gap-3 flex-wrap">
                      {ev.EventStartDate && (
                        <span>{formatDate(ev.EventStartDate)}{ev.EventEndDate && ev.EventEndDate !== ev.EventStartDate ? ` – ${formatDate(ev.EventEndDate)}` : ''}</span>
                      )}
                      {ev.EventLocationCity && <span>{[ev.EventLocationCity, ev.EventLocationState].filter(Boolean).join(', ')}</span>}
                      <span>{ev.AttendeeCount || 0} {t('events_manage.registered_suffix')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link to={`/events/${ev.EventID}/dashboard`}
                      style={{ color: '#fff' }}
                      className="text-xs bg-[#3D6B34] font-semibold px-3 py-1.5 rounded-lg hover:bg-[#2d5226] no-underline">
                      {t('events_manage.btn_dashboard')}
                    </Link>
                    <Link to={`/events/${ev.EventID}`} target="_blank"
                      className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 no-underline">
                      {t('events_manage.btn_preview')}
                    </Link>
                    {ev.EventType === 'Alpaca Cottage Industry Fleece Show' && (
                      <Link to={`/events/${ev.EventID}/admin/fiber-arts?BusinessID=${BusinessID}`}
                        className="text-xs text-purple-600 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-50 no-underline">
                        {t('events_manage.btn_fiber_arts_admin')}
                      </Link>
                    )}
                    {ev.EventType === 'Halter Show' && (
                      <Link to={`/events/${ev.EventID}/admin/halter?BusinessID=${BusinessID}`}
                        className="text-xs text-purple-600 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-50 no-underline">
                        {t('events_manage.btn_halter_admin')}
                      </Link>
                    )}
                    {ev.EventType === 'Basic Animal or Fleece Show' && (
                      <Link to={`/events/${ev.EventID}/admin/fleece?BusinessID=${BusinessID}`}
                        className="text-xs text-purple-600 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-50 no-underline">
                        {t('events_manage.btn_fleece_admin')}
                      </Link>
                    )}
                    {ev.EventType === 'Spin-Off' && (
                      <Link to={`/events/${ev.EventID}/admin/spinoff?BusinessID=${BusinessID}`}
                        className="text-xs text-purple-600 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-50 no-underline">
                        {t('events_manage.btn_spinoff_admin')}
                      </Link>
                    )}
                    {ev.EventType === 'Auction' && (
                      <Link to={`/events/${ev.EventID}/admin/auction?BusinessID=${BusinessID}`}
                        className="text-xs text-purple-600 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-50 no-underline">
                        {t('events_manage.btn_auction_admin')}
                      </Link>
                    )}
                    {ev.EventType === 'Market/Vendor Fair' && (
                      <Link to={`/events/${ev.EventID}/admin/vendor-fair?BusinessID=${BusinessID}`}
                        className="text-xs text-purple-600 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-50 no-underline">
                        {t('events_manage.btn_vendor_fair_admin')}
                      </Link>
                    )}
                    {ev.EventType === 'Dining Event' && (
                      <Link to={`/events/${ev.EventID}/admin/dining?BusinessID=${BusinessID}`}
                        className="text-xs text-purple-600 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-50 no-underline">
                        {t('events_manage.btn_dining_admin')}
                      </Link>
                    )}
                    {ev.EventType === 'Farm Tour/Open House' && (
                      <Link to={`/events/${ev.EventID}/admin/tour?BusinessID=${BusinessID}`}
                        className="text-xs text-purple-600 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-50 no-underline">
                        {t('events_manage.btn_tour_admin')}
                      </Link>
                    )}
                    {['Seminar', 'Free Event', 'Basic Event', 'Workshop/Clinic', 'Webinar/Online Class', 'Networking Event'].includes(ev.EventType) && (
                      <Link to={`/events/${ev.EventID}/admin/simple?BusinessID=${BusinessID}`}
                        className="text-xs text-purple-600 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-50 no-underline">
                        {t('events_manage.btn_type_admin', { type: ev.EventType })}
                      </Link>
                    )}
                    {ev.EventType === 'Conference' && (
                      <Link to={`/events/${ev.EventID}/admin/conference?BusinessID=${BusinessID}`}
                        className="text-xs text-purple-600 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-50 no-underline">
                        {t('events_manage.btn_conference_admin')}
                      </Link>
                    )}
                    {ev.EventType === 'Competition/Judging' && (
                      <Link to={`/events/${ev.EventID}/admin/competition?BusinessID=${BusinessID}`}
                        className="text-xs text-purple-600 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-50 no-underline">
                        {t('events_manage.btn_competition_admin')}
                      </Link>
                    )}
                    <Link to={`/events/${ev.EventID}/checkin`}
                      className="text-xs text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-50 no-underline">
                      {t('events_manage.btn_checkin')}
                    </Link>
                    <Link to={`/events/${ev.EventID}/broadcast`}
                      className="text-xs text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-50 no-underline">
                      {t('events_manage.btn_broadcast')}
                    </Link>
                    <Link to={`/events/${ev.EventID}/analytics`}
                      className="text-xs text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 no-underline">
                      {t('events_manage.btn_analytics')}
                    </Link>
                    <a href={`${API}/api/events/${ev.EventID}/attendees.csv`}
                      className="text-xs text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 no-underline">
                      {t('events_manage.btn_csv')}
                    </a>
                    <button onClick={() => cloneEvent(ev)}
                      className="text-xs text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">
                      {t('events_manage.btn_clone')}
                    </button>
                    <button onClick={() => openEdit(ev)}
                      className="text-xs text-blue-600 border border-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-50">
                      {t('events_manage.btn_edit')}
                    </button>
                    <button onClick={() => setExpandedEvent(expandedEvent === ev.EventID ? null : ev.EventID)}
                      className="text-xs text-[#3D6B34] border border-[#3D6B34]/20 px-3 py-1.5 rounded-lg hover:bg-[#3D6B34]/5">
                      {expandedEvent === ev.EventID ? t('events_manage.btn_close_panel') : t('events_manage.btn_manage_panel')}
                    </button>
                    <button onClick={() => deleteEvent(ev)}
                      className="text-xs text-white px-3 py-1.5 rounded-lg" style={{ background: '#C0382B' }}>
                      {t('events_manage.btn_delete')}
                    </button>
                  </div>
                </div>

                {expandedEvent === ev.EventID && (
                  <div className="border-t border-gray-100 bg-gray-50">
                    <div className="flex border-b border-gray-200 bg-white">
                      {[
                        { id: 'registrations', label: t('events_manage.tab_registrations', { n: ev.AttendeeCount || 0 }) },
                        { id: 'options', label: t('events_manage.tab_options') },
                        { id: 'dates', label: t('events_manage.tab_dates') },
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setTab(ev.EventID, tab.id)}
                          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                            getTab(ev.EventID) === tab.id
                              ? 'border-[#3D6B34] text-[#3D6B34]'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="p-4">
                      {getTab(ev.EventID) === 'registrations' && <RegistrationsList eventId={ev.EventID} />}
                      {getTab(ev.EventID) === 'options' && <OptionsEditor eventId={ev.EventID} />}
                      {getTab(ev.EventID) === 'dates' && <DateSlotsEditor eventId={ev.EventID} />}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
             onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5"
               onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-2">{t('events_manage.confirm_delete_heading')}</h3>
            <p className="text-sm text-gray-600 mb-5"
               dangerouslySetInnerHTML={{ __html: t('events_manage.confirm_delete_body', { name: confirmDelete.EventName }) }} />
            <div className="flex justify-end items-center gap-3">
              <button onClick={() => setConfirmDelete(null)}
                      className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                {t('events_manage.btn_cancel')}
              </button>
              <button onClick={doDelete}
                      className="bg-red-600 text-white font-semibold px-5 py-2 rounded-lg text-sm hover:bg-red-700">
                {t('events_manage.btn_delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </Wrapper>
  );
}
