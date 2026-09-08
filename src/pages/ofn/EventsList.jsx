// Ported from Oatmeal Farm Network (src/EventsList.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from '../../lib/i18n';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import Breadcrumbs from '../../components/Breadcrumbs';
import { useLanguage } from '../../lib/LanguageContext';
import { useAccount } from '../../lib/AccountContext';
import { getPeopleId } from '../../lib/auth';

const API = import.meta.env.VITE_LIVESTOCK_API_URL || '';
const CREAM = '#f7f2e8';
const OLIVE = '#5b7044';
const INK = '#2c2c2c';
const MUTED = '#6b6b6b';
const RUST = '#8b3a2b';
const FALLBACK_IMG = '/images/EventsHeroFarmDinner.jpg';
const CARD_FALLBACK = '/images/EventsHeroFarmDinner.jpg';
const HERO_BY_TAB = {
  browse: '/images/EventsHeroFarmDinner.jpg',
  mine: '/images/EventsHeroMyEvents.png',
  registrations: '/images/EventsHeroRegistrations.png',
};
const HERO_DEFAULTS = {
  browse: {
    badge: 'Featured Event',
    title: 'The Autumn Heritage Harvest Symposium',
    desc: 'Join growers, chefs, and community leaders for an evening of farm-to-table dining, workshops, and autumn celebration under open skies.',
    primary: { label: 'Secure Your Spot', action: 'browse' },
    secondary: { label: 'View Itinerary', action: 'browse' },
  },
  mine: {
    badge: 'Featured Event',
    title: 'Host Your Farm Event',
    desc: 'Create tours, harvest dinners, and open houses — manage registrations, check-in, and day-of details from My Events.',
    primary: { label: 'Create Event', action: 'create' },
    secondary: { label: 'Browse Events', action: 'browse' },
  },
  registrations: {
    badge: 'Featured Event',
    title: 'Your Event Registrations',
    desc: 'Track tickets, check-in status, and upcoming farm workshops you have registered for across the network.',
    primary: { label: 'Secure Your Spot', action: 'browse' },
    secondary: { label: 'Browse Events', action: 'browse' },
  },
};

function formatCardDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  return dt
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .toUpperCase();
}

function locationLine(ev) {
  const parts = [
    ev.EventLocationName,
    [ev.EventLocationCity, ev.EventLocationState].filter(Boolean).join(', '),
  ].filter(Boolean);
  return parts.join(', ') || parts[0] || '';
}

function priceLabel(ev) {
  if (ev.IsFree) return 'Free';
  if (ev.LowestPrice != null && ev.LowestPrice !== '') {
    const n = parseFloat(ev.LowestPrice);
    if (!Number.isNaN(n)) return `$${n.toFixed(2)}`;
  }
  if (ev.Price != null && ev.Price !== '') {
    const n = parseFloat(ev.Price);
    if (!Number.isNaN(n)) return n === 0 ? 'Free' : `$${n.toFixed(2)}`;
  }
  return 'See details';
}

function stripHtml(html) {
  if (!html) return '';
  if (typeof window === 'undefined' || !window.DOMParser) {
    return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const doc = new DOMParser().parseFromString(String(html), 'text/html');
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
}

function TabPill({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-5 py-2 rounded-full text-sm font-semibold transition-colors"
      style={
        active
          ? { background: OLIVE, color: '#fff' }
          : { background: '#e8e4dc', color: '#4a4a4a' }
      }
    >
      {children}
    </button>
  );
}

function ActionMenu({ label, items }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold bg-white border border-black/10 hover:bg-gray-50"
        style={{ color: INK, borderLeft: `3px solid ${OLIVE}` }}
      >
        {label}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-30 min-w-[180px] bg-white rounded-lg shadow-lg border border-black/10 py-1">
          {items.map((it) =>
            it.href ? (
              <Link
                key={it.label}
                to={it.href}
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-sm no-underline hover:bg-gray-50"
                style={{ color: INK }}
              >
                {it.label}
              </Link>
            ) : (
              <button
                key={it.label}
                type="button"
                onClick={() => {
                  setOpen(false);
                  it.onClick?.();
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                style={{ color: INK }}
              >
                {it.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

function QuickAction({ to, onClick, label, color, children, danger }) {
  const cls =
    'flex flex-col items-center justify-center gap-1 w-[68px] h-[62px] rounded-lg border text-[9px] font-bold tracking-wide uppercase no-underline transition-colors hover:bg-gray-50';
  const style = {
    borderColor: danger ? '#f5c2c0' : `${color}44`,
    color: danger ? '#C0382B' : color,
    background: '#fff',
  };
  const inner = (
    <>
      <span style={{ color: danger ? '#C0382B' : color }}>{children}</span>
      <span>{label}</span>
    </>
  );
  if (to) {
    return (
      <Link to={to} className={cls} style={style}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls} style={style}>
      {inner}
    </button>
  );
}

function money(v) {
  const n = parseFloat(v);
  if (Number.isNaN(n)) return '$0.00';
  return `$${n.toFixed(2)}`;
}

function MyEventManageCard({ ev, businessId, onDeleted }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const loc = [ev.EventLocationCity, ev.EventLocationState].filter(Boolean).join(', ');
  const regs = ev.RegistrationCount ?? ev.AttendeeCount ?? 0;
  const attendees = ev.TotalAttendees ?? ev.AttendeeCount ?? regs;
  const checkedIn = ev.CheckedInCount ?? 0;
  const revAll = ev.RevenueAll ?? ev.Revenue ?? 0;
  const revPaid = ev.RevenuePaid ?? 0;
  const editHref = `/events/manage?edit=${ev.EventID}${businessId ? `&BusinessID=${businessId}` : ''}`;

  const doDelete = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem('access_token');
      await fetch(`${API}/api/events/${ev.EventID}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      onDeleted?.(ev.EventID);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <article className="bg-white rounded-xl border border-black/5 shadow-sm p-4 md:p-5">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-5">
        {/* Thumb */}
        <div
          className="w-full lg:w-28 h-28 rounded-lg shrink-0 overflow-hidden bg-gray-100"
          style={{ background: '#ebe8e2' }}
        >
          {ev.EventImage ? (
            <img
              src={ev.EventImage}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : null}
        </div>

        {/* Info + metrics */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-base md:text-lg font-bold" style={{ color: INK }}>
              {ev.EventName}
            </h3>
            <span
              className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded"
              style={{
                background: ev.IsPublished !== false ? '#e8f0e3' : '#eee',
                color: ev.IsPublished !== false ? OLIVE : MUTED,
              }}
            >
              {ev.IsPublished !== false ? 'Published' : 'Draft'}
            </span>
            {ev.EventType && (
              <span
                className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded"
                style={{ background: '#e8f1f8', color: '#3a6d8c', border: '1px solid #c5d9e8' }}
              >
                {ev.EventType}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mb-4" style={{ color: MUTED }}>
            {ev.EventStartDate && (
              <span className="inline-flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
                {formatCardDate(ev.EventStartDate)}
              </span>
            )}
            {loc && (
              <span className="inline-flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 21s-6-5.3-6-10a6 6 0 1112 0c0 4.7-6 10-6 10z" />
                  <circle cx="12" cy="11" r="2" />
                </svg>
                {loc}
              </span>
            )}
            <span>
              {regs} registration{regs === 1 ? '' : 's'}
              {ev.RegistrationRequired ? ' · Registration required' : ''}
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-2">
            {[
              ['Registrations', regs],
              ['Total Attendees', attendees],
              ['Checked In', checkedIn],
            ].map(([label, val]) => (
              <div key={label}>
                <div className="text-[9px] font-bold tracking-[0.12em] uppercase" style={{ color: MUTED }}>
                  {label}
                </div>
                <div className="text-xl font-bold" style={{ color: INK }}>
                  {val}
                </div>
              </div>
            ))}
            <div>
              <div className="text-[9px] font-bold tracking-[0.12em] uppercase" style={{ color: MUTED }}>
                Revenue (All)
              </div>
              <div className="text-base font-bold" style={{ color: INK }}>
                {money(revAll)}
              </div>
            </div>
            <div>
              <div className="text-[9px] font-bold tracking-[0.12em] uppercase" style={{ color: MUTED }}>
                Revenue (Paid)
              </div>
              <div className="text-base font-bold" style={{ color: INK }}>
                {money(revPaid)}
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="lg:w-[230px] shrink-0">
          <div className="text-[9px] font-bold tracking-[0.14em] uppercase mb-2" style={{ color: MUTED }}>
            Quick Actions
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <QuickAction to={`/events/${ev.EventID}/dashboard`} label="Admin" color="#7c5cbf">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 13h8V3H3v10zm10 8h8V11h-8v10zM3 21h8v-6H3v6zm10-18v6h8V3h-8z" />
              </svg>
            </QuickAction>
            <QuickAction to={`/events/${ev.EventID}/checkin`} label="Check-In" color="#3d8f5a">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </QuickAction>
            <QuickAction to={`/events/${ev.EventID}/broadcast`} label="Email" color="#d97706">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </QuickAction>
            <QuickAction to={`/events/${ev.EventID}/analytics`} label="Analytics" color="#4f6bed">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 19V5M10 19V9M16 19v-6M22 19V7" />
              </svg>
            </QuickAction>
            <QuickAction danger label="Delete" color="#C0382B" onClick={() => setConfirmDelete(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
              </svg>
            </QuickAction>
            <QuickAction
              to={editHref}
              label="Edit"
              color="#2563eb"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </QuickAction>
            <QuickAction to={`/events/${ev.EventID}/admin/registrations`} label="Registrations" color="#0d9488">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
            </QuickAction>
            <QuickAction
              to={editHref}
              label="Ticket Options"
              color="#7c3aed"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 9a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 00-1.5 1.9 2 2 0 001.5 1.9V17a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 001.5-1.9A2 2 0 003 11V9z" />
              </svg>
            </QuickAction>
            <QuickAction
              to={editHref}
              label="Date Slots"
              color="#0891b2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </QuickAction>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setConfirmDelete(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold mb-2" style={{ color: INK }}>
              Delete event?
            </h3>
            <p className="text-sm mb-5" style={{ color: MUTED }}>
              Delete <strong>{ev.EventName}</strong>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={doDelete}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ background: '#C0382B' }}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function RegistrationCard({ reg }) {
  const amount = parseFloat(reg.TotalAmount);
  const paid = reg.PaymentStatus === 'paid';

  return (
    <article className="bg-white rounded-xl border border-black/5 shadow-sm p-5 flex gap-4">
      <div
        className="w-16 h-16 rounded-lg shrink-0 overflow-hidden flex items-center justify-center"
        style={{ background: '#ebe8e2' }}
      >
        {reg.EventImage ? (
          <img
            src={reg.EventImage}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : null}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <Link
              to={`/events/${reg.EventID}`}
              className="font-bold no-underline hover:opacity-80"
              style={{ color: INK }}
            >
              {reg.EventName}
            </Link>
            {(reg.OrganizerName || reg.BusinessName) && (
              <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                Hosted by {reg.OrganizerName || reg.BusinessName}
              </p>
            )}
          </div>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
            style={
              paid
                ? { background: '#e8f0e3', color: OLIVE }
                : { background: '#fef3c7', color: '#92400e' }
            }
          >
            {reg.PaymentStatus || 'pending'}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-2" style={{ color: MUTED }}>
          {reg.EventStartDate && <span>{formatCardDate(reg.EventStartDate)}</span>}
          {(reg.EventLocationCity || reg.EventLocationState) && (
            <span>{[reg.EventLocationCity, reg.EventLocationState].filter(Boolean).join(', ')}</span>
          )}
          {reg.RegID && <span>Reg #{reg.RegID}</span>}
        </div>
      </div>
      <div className="text-right shrink-0">
        {!Number.isNaN(amount) && amount > 0 ? (
          <p className="font-bold" style={{ color: OLIVE }}>
            ${amount.toFixed(2)}
          </p>
        ) : (
          <p className="text-xs font-semibold" style={{ color: OLIVE }}>
            Free
          </p>
        )}
      </div>
    </article>
  );
}

function EventCard({ ev }) {
  const img = ev.EventImage || CARD_FALLBACK;
  const loc = locationLine(ev);
  const desc = stripHtml(ev.EventDescription);

  return (
    <Link
      to={`/events/${ev.EventID}`}
      className="group bg-white rounded-xl overflow-hidden border border-black/5 shadow-sm hover:shadow-md transition-shadow no-underline flex flex-col h-full"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
        <img
          src={img}
          alt={ev.EventName || 'Event'}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.src = CARD_FALLBACK;
          }}
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {ev.RegistrationRequired ? (
            <span
              className="text-[9px] font-bold tracking-wide uppercase px-2 py-1 rounded"
              style={{ background: 'rgba(255,255,255,0.92)', color: '#555' }}
            >
              Registration Required
            </span>
          ) : null}
          {ev.EventType ? (
            <span
              className="text-[9px] font-bold tracking-wide uppercase px-2 py-1 rounded text-white"
              style={{ background: OLIVE }}
            >
              {ev.EventType}
            </span>
          ) : (
            <span
              className="text-[9px] font-bold tracking-wide uppercase px-2 py-1 rounded text-white"
              style={{ background: OLIVE }}
            >
              Network Exclusive
            </span>
          )}
        </div>
      </div>

      <div className="p-4 flex flex-col grow">
        {ev.EventStartDate && (
          <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide mb-2" style={{ color: MUTED }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            {formatCardDate(ev.EventStartDate)}
          </div>
        )}

        <h3
          className="text-lg font-bold leading-snug mb-1 group-hover:opacity-80"
          style={{ fontFamily: "'Lora', 'Times New Roman', serif", color: INK }}
        >
          {ev.EventName}
        </h3>

        {ev.BusinessName && (
          <p className="text-xs mb-2" style={{ color: MUTED }}>
            Host : {ev.BusinessName}
          </p>
        )}

        {desc && (
          <p className="text-sm leading-relaxed line-clamp-2 mb-4 grow" style={{ color: '#7a7a7a' }}>
            {desc}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-2 border-t border-gray-100">
          <div className="flex items-start gap-1.5 text-xs min-w-0" style={{ color: MUTED }}>
            {loc ? (
              <>
                <svg className="shrink-0 mt-0.5" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M12 21s-6-5.3-6-10a6 6 0 1112 0c0 4.7-6 10-6 10z" />
                  <circle cx="12" cy="11" r="2" />
                </svg>
                <span className="truncate">{loc}</span>
              </>
            ) : (
              <span />
            )}
          </div>
          <span className="text-sm font-bold shrink-0" style={{ color: INK }}>
            {priceLabel(ev)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function EventsList() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { BusinessID } = useAccount();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'browse';
  const [tab, setTab] = useState(
    ['browse', 'mine', 'registrations'].includes(initialTab) ? initialTab : 'browse'
  );

  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | published | draft
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const peopleId = typeof window !== 'undefined' ? getPeopleId() : null;

  const switchTab = (next) => {
    setTab(next);
    setSearchParams(next === 'browse' ? {} : { tab: next }, { replace: true });
  };

  useEffect(() => {
    setLoading(true);
    if (tab === 'browse') {
      fetch(`${API}/api/events?lang=${language}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((d) => {
          setEvents(Array.isArray(d) ? d : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
      return;
    }
    if (!token) {
      setLoading(false);
      return;
    }
    if (tab === 'mine') {
      const q = BusinessID ? `?business_id=${BusinessID}` : '';
      fetch(`${API}/api/my-events${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : []))
        .then((d) => {
          setMyEvents(Array.isArray(d) ? d : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
      return;
    }
    if (tab === 'registrations' && peopleId) {
      fetch(`${API}/api/my-registrations?people_id=${peopleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : []))
        .then((d) => {
          setRegs(Array.isArray(d) ? d : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [tab, language, BusinessID, token, peopleId]);

  const listSource = tab === 'browse' ? events : tab === 'mine' ? myEvents : regs.map((r) => ({
    ...r,
    BusinessName: r.OrganizerName || r.BusinessName,
  }));

  const filtered = useMemo(() => {
    let rows = listSource;
    if (tab === 'mine' && statusFilter === 'published') {
      rows = rows.filter((e) => e.IsPublished !== false);
    } else if (tab === 'mine' && statusFilter === 'draft') {
      rows = rows.filter((e) => e.IsPublished === false);
    }
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (e) =>
        e.EventName?.toLowerCase().includes(q) ||
        e.EventType?.toLowerCase().includes(q) ||
        e.EventLocationCity?.toLowerCase().includes(q) ||
        e.BusinessName?.toLowerCase().includes(q) ||
        e.OrganizerName?.toLowerCase().includes(q)
    );
  }, [listSource, filter, tab, statusFilter]);

  const featured = useMemo(() => {
    const pool = tab === 'mine' ? myEvents : tab === 'browse' ? events : [];
    if (!pool.length) return null;
    return (
      pool.find((e) => e.IsFeatured || e.Featured) ||
      pool.find((e) => e.EventImage) ||
      pool[0]
    );
  }, [events, myEvents, tab]);

  const heroCopy = HERO_DEFAULTS[tab] || HERO_DEFAULTS.browse;
  const heroImg = HERO_BY_TAB[tab] || FALLBACK_IMG;
  const heroTitle = featured?.EventName || heroCopy.title;
  const heroDesc = featured?.EventDescription
    ? stripHtml(featured.EventDescription)
    : heroCopy.desc;

  const createHref = BusinessID
    ? `/events/add?BusinessID=${BusinessID}`
    : token
      ? '/events/manage'
      : '/login';

  const crumbItems =
    tab === 'mine'
      ? [
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Events', to: '/events' },
          { label: 'My Events' },
        ]
      : tab === 'registrations'
        ? [
            { label: 'Dashboard', to: '/dashboard' },
            { label: 'Events', to: '/events' },
            { label: 'Registrations' },
          ]
        : [
            { label: 'Dashboard', to: '/dashboard' },
            { label: 'Events' },
          ];

  const removeMyEvent = (id) => setMyEvents((prev) => prev.filter((e) => e.EventID !== id));

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ background: CREAM }}>
      <PageMeta
        title="Farm Events & Agricultural Workshops"
        description="Discover upcoming farm events, agricultural workshops, farm tours, and food industry conferences near you."
        keywords="farm events, agricultural workshops, farm tours, farmers market events, livestock shows"
        canonical="https://oatmealfarmnetwork.com/events"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Farm Events & Agricultural Workshops',
          url: 'https://oatmealfarmnetwork.com/events',
        }}
      />
      <Header />

      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6 grow w-full">
        <Breadcrumbs items={crumbItems} />

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <TabPill active={tab === 'browse'} onClick={() => switchTab('browse')}>
            Browse Events
          </TabPill>
          <TabPill active={tab === 'mine'} onClick={() => switchTab('mine')}>
            My Events
          </TabPill>
          <TabPill active={tab === 'registrations'} onClick={() => switchTab('registrations')}>
            Registrations
          </TabPill>
        </div>

        {/* Featured / AI hero — all tabs */}
        <section
          className="relative rounded-2xl overflow-hidden mb-8 min-h-[280px] md:min-h-[320px] flex items-end"
          style={{
            backgroundImage: `url('${heroImg}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(20,20,20,0.55) 0%, rgba(20,20,20,0.28) 55%, rgba(20,20,20,0.12) 100%)',
            }}
            aria-hidden
          />
          <div className="relative z-[1] p-6 md:p-10 max-w-2xl">
            <span
              className="inline-block text-[10px] font-bold tracking-[0.14em] uppercase px-2.5 py-1 rounded mb-3"
              style={{ background: RUST, color: '#ffffff' }}
            >
              {heroCopy.badge}
            </span>
            <h1
              className="text-3xl md:text-4xl font-bold leading-tight mb-3 drop-shadow-md"
              style={{ fontFamily: "'Lora', 'Times New Roman', serif", color: '#ffffff' }}
            >
              {heroTitle}
            </h1>
            {heroDesc && (
              <p
                className="text-sm md:text-[0.95rem] leading-relaxed mb-5 line-clamp-3 drop-shadow"
                style={{ color: 'rgba(255,255,255,0.92)' }}
              >
                {heroDesc}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              {featured ? (
                <>
                  <Link
                    to={`/events/${featured.EventID}`}
                    className="inline-flex items-center px-5 py-2.5 rounded-md text-sm font-bold no-underline hover:opacity-90"
                    style={{ background: OLIVE, color: '#ffffff' }}
                  >
                    Secure Your Spot
                  </Link>
                  <Link
                    to={`/events/${featured.EventID}`}
                    className="inline-flex items-center px-5 py-2.5 rounded-md text-sm font-bold no-underline hover:bg-white/10"
                    style={{
                      color: '#ffffff',
                      border: '1.5px solid rgba(255,255,255,0.85)',
                      background: 'transparent',
                    }}
                  >
                    View Itinerary
                  </Link>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      heroCopy.primary.action === 'create'
                        ? navigate(createHref)
                        : switchTab('browse')
                    }
                    className="inline-flex items-center px-5 py-2.5 rounded-md text-sm font-bold hover:opacity-90"
                    style={{ background: OLIVE, color: '#ffffff' }}
                  >
                    {heroCopy.primary.label}
                  </button>
                  <button
                    type="button"
                    onClick={() => switchTab('browse')}
                    className="inline-flex items-center px-5 py-2.5 rounded-md text-sm font-bold hover:bg-white/10"
                    style={{
                      color: '#ffffff',
                      border: '1.5px solid rgba(255,255,255,0.85)',
                      background: 'transparent',
                    }}
                  >
                    {heroCopy.secondary.label}
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Browse: search + create | My Events (signed in): action menus + create */}
        {tab === 'mine' && token ? (
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-8">
            <div className="flex flex-wrap gap-2 flex-1">
              <ActionMenu
                label="My Events"
                items={[
                  { label: 'All my events', onClick: () => setStatusFilter('all') },
                  { label: 'Published only', onClick: () => setStatusFilter('published') },
                  { label: 'Drafts only', onClick: () => setStatusFilter('draft') },
                  { label: 'Open manage page', href: `/events/manage${BusinessID ? `?BusinessID=${BusinessID}` : ''}` },
                ]}
              />
              <ActionMenu
                label="Operations"
                items={[
                  { label: 'Create event', href: createHref },
                  { label: 'Event analytics', href: '/events/analytics' },
                  { label: 'Browse public events', href: '/events' },
                ]}
              />
              <ActionMenu
                label="Communication"
                items={[
                  { label: 'Open manage page', href: `/events/manage${BusinessID ? `?BusinessID=${BusinessID}` : ''}` },
                  { label: 'Browse events', href: '/events' },
                ]}
              />
              <ActionMenu
                label="Insights"
                items={[
                  { label: 'All-events analytics', href: '/events/analytics' },
                  { label: 'Manage events', href: `/events/manage${BusinessID ? `?BusinessID=${BusinessID}` : ''}` },
                ]}
              />
            </div>
            <button
              type="button"
              onClick={() => navigate(createHref)}
              className="shrink-0 px-6 py-2.5 rounded-lg text-sm font-bold hover:opacity-90"
              style={{ background: OLIVE, color: '#ffffff' }}
            >
              Create Event
            </button>
          </div>
        ) : tab === 'browse' ? (
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#9a9a9a"
                strokeWidth="2"
                aria-hidden
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search events, workshops, or speakers..."
                className="w-full rounded-lg pl-10 pr-4 py-3 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-[#5b7044]/35"
                style={{ background: '#eceae6', color: INK }}
              />
            </div>
            <button
              type="button"
              onClick={() => navigate(createHref)}
              className="shrink-0 px-6 py-3 rounded-lg text-sm font-bold hover:opacity-90"
              style={{ background: OLIVE, color: '#ffffff' }}
            >
              Create Event
            </button>
          </div>
        ) : tab === 'registrations' && token ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h1
              className="text-3xl md:text-[2rem] font-bold leading-tight"
              style={{ fontFamily: "'Lora', 'Times New Roman', serif", color: OLIVE }}
            >
              My Registrations
            </h1>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => switchTab('browse')}
                className="px-4 py-2 rounded-lg text-sm font-semibold border border-black/10 hover:bg-white/60"
                style={{ background: '#ebe6dc', color: OLIVE }}
              >
                Browse Events
              </button>
              <Link
                to="/events/analytics"
                className="px-4 py-2 rounded-lg text-sm font-semibold no-underline hover:bg-white"
                style={{ color: OLIVE, border: '1px solid #c5d0e8', background: '#fff' }}
              >
                Analytics
              </Link>
              <button
                type="button"
                onClick={() => navigate(createHref)}
                className="px-5 py-2 rounded-lg text-sm font-bold hover:opacity-90"
                style={{ background: OLIVE, color: '#ffffff' }}
              >
                + Create Event
              </button>
            </div>
          </div>
        ) : null}

        {/* Auth gates for mine / registrations */}
        {!token && tab !== 'browse' ? (
          <div className="bg-white rounded-xl border border-black/5 shadow-sm p-12 text-center">
            <p className="text-sm mb-4" style={{ color: MUTED }}>
              Sign in to view {tab === 'mine' ? 'events you manage' : 'your registrations'}.
            </p>
            <Link
              to="/login"
              className="inline-flex px-5 py-2.5 rounded-md text-sm font-bold no-underline"
              style={{ background: OLIVE, color: '#ffffff' }}
            >
              Log In
            </Link>
          </div>
        ) : loading ? (
          <div className="text-center py-20" style={{ color: MUTED }}>
            {t('events.loading')}
          </div>
        ) : filtered.length === 0 ? (
          tab === 'registrations' ? (
            <div
              className="bg-white rounded-xl border border-black/5 shadow-sm px-6 py-20 text-center"
              style={{ color: '#9a9a9a' }}
            >
              No events yet. Create your first event to get started.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-black/5 p-16 text-center" style={{ color: MUTED }}>
              {filter && tab !== 'mine'
                ? t('events.no_match')
                : tab === 'mine'
                  ? 'You have not created any events yet.'
                  : t('events.no_events')}
              {tab === 'mine' && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => navigate(createHref)}
                    className="px-5 py-2.5 rounded-md text-sm font-bold"
                    style={{ background: OLIVE, color: '#ffffff' }}
                  >
                    Create Event
                  </button>
                </div>
              )}
            </div>
          )
        ) : tab === 'mine' ? (
          <div className="space-y-4">
            {filtered.map((ev) => (
              <MyEventManageCard
                key={ev.EventID}
                ev={ev}
                businessId={BusinessID}
                onDeleted={removeMyEvent}
              />
            ))}
          </div>
        ) : tab === 'registrations' ? (
          <div className="space-y-4">
            {filtered.map((reg) => (
              <RegistrationCard key={reg.RegID || reg.EventID} reg={reg} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((ev) => (
              <EventCard key={ev.EventID || ev.RegID} ev={ev} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
