// Ported from Oatmeal Farm Network (src/EventAdminMenu.jsx). Supporting component for
// the events admin pages; mechanical adaptations only.
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useTranslation } from '../lib/i18n';
import { useAccount } from '../lib/AccountContext';

const API = import.meta.env.VITE_LIVESTOCK_API_URL || '';

export const EVENT_MENU_WIDTH_EXPANDED = 208; // w-52
export const EVENT_MENU_WIDTH_COLLAPSED = 56;  // w-14

function Row({ to, href, icon, label, expanded, active }) {
  const cls = `flex items-center gap-3 px-3 py-2 rounded-lg transition-all no-underline ${
    active
      ? 'bg-[#3D6B34] text-white font-semibold'
      : 'text-gray-700 hover:bg-white/50'
  }`;
  const style = active ? { color: '#fff' } : undefined;
  const content = (
    <>
      <span className="w-5 flex items-center justify-center shrink-0">{icon}</span>
      {expanded && <span className="text-sm whitespace-nowrap truncate">{label}</span>}
    </>
  );
  if (href) return <a href={href} className={cls} style={style} title={!expanded ? label : undefined}>{content}</a>;
  return <Link to={to} className={cls} style={style} title={!expanded ? label : undefined}>{content}</Link>;
}

function SubRow({ to, label, expanded, active }) {
  if (!expanded) return null;
  return (
    <Link
      to={to}
      className={`flex items-center px-3 py-1.5 ml-4 rounded-lg text-xs transition-all no-underline ${
        active ? 'bg-[#3D6B34]/15 text-[#3D6B34] font-semibold' : 'text-gray-600 hover:bg-white/50'
      }`}
    >
      {label}
    </Link>
  );
}

function appendBiz(path, businessId) {
  if (!businessId) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}BusinessID=${businessId}`;
}

function isAbsolute(url) {
  return /^https?:\/\//.test(url) || url?.startsWith('/api/');
}

export default function EventAdminMenu({
  eventId, eventType, businessId,
  menuExpanded, setMenuExpanded,
}) {
  const { t } = useTranslation();
  const { Expanded: accountExpanded } = useAccount() || {};
  const loc = useLocation();
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);

  // Module sub-tab definitions — inside component so t() is accessible
  const MODULE_TABS = {
    fiber_arts_module: [
      ['config',     t('event_admin_menu.tab_config')],
      ['categories', t('event_admin_menu.tab_classes_categories')],
      ['entries',    t('event_admin_menu.tab_entries_judging')],
    ],
    halter_module: [
      ['config',        t('event_admin_menu.tab_config')],
      ['classes',       t('event_admin_menu.tab_classes')],
      ['registrations', t('event_admin_menu.tab_registrations')],
      ['judging',       t('event_admin_menu.tab_judging')],
    ],
    auction_module: [
      ['config', t('event_admin_menu.tab_config')],
      ['lots',   t('event_admin_menu.tab_lots')],
      ['bids',   t('event_admin_menu.tab_bids')],
    ],
    vendor_fair_module: [
      ['config', t('event_admin_menu.tab_config')],
      ['apps',   t('event_admin_menu.tab_applications')],
    ],
    dining_module: [
      ['config',        t('event_admin_menu.tab_config')],
      ['menu',          t('event_admin_menu.tab_menu')],
      ['tables',        t('event_admin_menu.tab_tables')],
      ['registrations', t('event_admin_menu.tab_registrations')],
      ['seating',       t('event_admin_menu.tab_seating')],
    ],
    tour_module: [
      ['config',        t('event_admin_menu.tab_config')],
      ['slots',         t('event_admin_menu.tab_time_slots')],
      ['addons',        t('event_admin_menu.tab_addons')],
      ['registrations', t('event_admin_menu.tab_registrations')],
    ],
    conference_module: [
      ['config',   t('event_admin_menu.tab_config')],
      ['tracks',   t('event_admin_menu.tab_tracks')],
      ['rooms',    t('event_admin_menu.tab_rooms')],
      ['speakers', t('event_admin_menu.tab_speakers')],
      ['sessions', t('event_admin_menu.tab_sessions')],
      ['regs',     t('event_admin_menu.tab_registrations')],
    ],
    competition_module: [
      ['config',      t('event_admin_menu.tab_config')],
      ['categories',  t('event_admin_menu.tab_categories_rubric')],
      ['judges',      t('event_admin_menu.tab_judges')],
      ['entries',     t('event_admin_menu.tab_entries_scoring')],
      ['leaderboard', t('event_admin_menu.tab_leaderboard')],
    ],
    simple_module: [
      ['config',        t('event_admin_menu.tab_config')],
      ['registrations', t('event_admin_menu.tab_registrations')],
    ],
    fleece_module: [
      ['config',   t('event_admin_menu.tab_config')],
      ['entries',  t('event_admin_menu.tab_fleece_entries')],
      ['judging',  t('event_admin_menu.tab_judging_results')],
    ],
    spinoff_module: [
      ['config',   t('event_admin_menu.tab_config')],
      ['entries',  t('event_admin_menu.tab_spinoff_entries')],
      ['judging',  t('event_admin_menu.tab_judging_results')],
    ],
  };

  useEffect(() => {
    if (!eventId) return;
    let alive = true;
    setLoading(true);
    fetch(`${API}/api/events/${eventId}/features`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('features load failed')))
      .then(d => { if (alive) setFeatures(Array.isArray(d?.features) ? d.features : []); })
      .catch(() => { if (alive) setFeatures([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [eventId]);

  const leftOffset = accountExpanded ? 208 : 64;
  const width = menuExpanded ? EVENT_MENU_WIDTH_EXPANDED : EVENT_MENU_WIDTH_COLLAPSED;

  const dashboardPath = `/events/${eventId}/dashboard`;
  const activeTab = new URLSearchParams(loc.search).get('tab') || 'config';

  const core = features.filter(f => f.IsCoreModule && f.AdminPath);
  const tools = features.filter(f => !f.IsCoreModule && f.AdminPath && !isAbsolute(f.AdminPath));
  const exports = features.filter(f => f.AdminPath && isAbsolute(f.AdminPath));

  return (
    <aside
      className="fixed top-[72px] bottom-0 z-30 flex flex-col transition-all duration-300 border-r border-gray-300/50 overflow-hidden"
      style={{ left: leftOffset, width: width, backgroundColor: '#f3ecdc' }}
    >
      <button
        onClick={() => setMenuExpanded(!menuExpanded)}
        className="flex items-center justify-center py-2 text-gray-400 hover:text-gray-600 hover:bg-white/20 transition-all border-b border-gray-300/30 shrink-0"
        title={menuExpanded ? t('event_admin_menu.collapse') : t('event_admin_menu.expand')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          {menuExpanded ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
        </svg>
      </button>

      {menuExpanded && (
        <div className="px-3 py-3 border-b border-gray-300/50 shrink-0">
          <p className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">{t('event_admin_menu.event_admin')}</p>
          <p className="text-gray-800 text-xs truncate mt-0.5">{eventType || t('event_admin_menu.event_label')}</p>
        </div>
      )}

      <nav className="flex flex-col gap-0.5 p-2 flex-grow overflow-y-auto">
        <Row
          to={dashboardPath}
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
          label={t('event_admin_menu.dashboard')}
          expanded={menuExpanded}
          active={loc.pathname === dashboardPath}
        />

        {core.map(f => {
          const base = f.AdminPath.split('?')[0];
          const tabs = MODULE_TABS[f.FeatureKey] || [];
          return (
            <div key={f.FeatureID} className="mt-2">
              <Row
                to={appendBiz(`${base}?tab=config`, businessId)}
                icon={f.Icon || '📦'} label={f.FeatureName}
                expanded={menuExpanded}
                active={loc.pathname === base}
              />
              {tabs.map(([tabId, tabLabel]) => (
                <SubRow
                  key={tabId}
                  to={appendBiz(`${base}?tab=${tabId}`, businessId)}
                  label={tabLabel}
                  expanded={menuExpanded}
                  active={loc.pathname === base && activeTab === tabId}
                />
              ))}
            </div>
          );
        })}

        {tools.length > 0 && (
          <div className="mt-2">
            {menuExpanded && (
              <div className="text-[10px] uppercase tracking-wide text-gray-400 px-3 pt-2 pb-1">{t('event_admin_menu.section_tools')}</div>
            )}
            {tools.map(f => (
              <Row key={f.FeatureID}
                to={f.AdminPath} icon={f.Icon || '•'} label={f.FeatureName}
                expanded={menuExpanded}
                active={loc.pathname === f.AdminPath.split('?')[0]}
              />
            ))}
          </div>
        )}

        {exports.length > 0 && (
          <div className="mt-2">
            {menuExpanded && (
              <div className="text-[10px] uppercase tracking-wide text-gray-400 px-3 pt-2 pb-1">{t('event_admin_menu.section_exports')}</div>
            )}
            {exports.map(f => (
              <Row key={f.FeatureID}
                href={`${API}${f.AdminPath}`} icon={f.Icon || '⬇️'} label={f.FeatureName}
                expanded={menuExpanded}
              />
            ))}
          </div>
        )}

        {!loading && features.length === 0 && menuExpanded && (
          <div className="text-[11px] text-gray-400 px-3 py-2 italic">
            {t('event_admin_menu.no_features')}
          </div>
        )}

        <div className="mt-2">
          {menuExpanded && (
            <div className="text-[10px] uppercase tracking-wide text-gray-400 px-3 pt-2 pb-1">{t('event_admin_menu.section_money')}</div>
          )}
          <Row to={`/events/${eventId}/admin/registrations`}
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}
            label={t('event_admin_menu.registrations_carts')}
            expanded={menuExpanded}
            active={loc.pathname === `/events/${eventId}/admin/registrations`} />
          <Row to={`/events/${eventId}/admin/meals`}
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>}
            label={t('event_admin_menu.meal_tickets')}
            expanded={menuExpanded}
            active={loc.pathname === `/events/${eventId}/admin/meals`} />
          <Row to={`/events/${eventId}/admin/promo-codes`}
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>}
            label={t('event_admin_menu.promo_codes')}
            expanded={menuExpanded}
            active={loc.pathname === `/events/${eventId}/admin/promo-codes`} />
          <Row to={`/events/${eventId}/admin/waitlist`}
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
            label={t('event_admin_menu.waitlist')}
            expanded={menuExpanded}
            active={loc.pathname === `/events/${eventId}/admin/waitlist`} />
          <Row to={`/events/${eventId}/admin/abandoned-carts`}
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>}
            label={t('event_admin_menu.abandoned_carts')}
            expanded={menuExpanded}
            active={loc.pathname === `/events/${eventId}/admin/abandoned-carts`} />
          <Row to={`/events/${eventId}/admin/sponsorship`}
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
            label={t('event_admin_menu.sponsorship')}
            expanded={menuExpanded}
            active={loc.pathname === `/events/${eventId}/admin/sponsorship`} />
          <Row to={appendBiz(`/events/${eventId}/leads`, businessId)}
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
            label={t('event_admin_menu.my_leads')}
            expanded={menuExpanded}
            active={loc.pathname === `/events/${eventId}/leads`} />
          <Row to={`/events/${eventId}/admin/floor-plan`}
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>}
            label={t('event_admin_menu.floor_plan')}
            expanded={menuExpanded}
            active={loc.pathname === `/events/${eventId}/admin/floor-plan`} />
          <Row to={`/events/${eventId}/admin/booth-services`}
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>}
            label={t('event_admin_menu.booth_services')}
            expanded={menuExpanded}
            active={loc.pathname === `/events/${eventId}/admin/booth-services`} />
          <Row to={`/events/${eventId}/admin/coi`}
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
            label={t('event_admin_menu.coi')}
            expanded={menuExpanded}
            active={loc.pathname === `/events/${eventId}/admin/coi`} />
        </div>

        <div className="mt-2">
          {menuExpanded && (
            <div className="text-[10px] uppercase tracking-wide text-gray-400 px-3 pt-2 pb-1">{t('event_admin_menu.section_comms')}</div>
          )}
          <Row to={`/events/${eventId}/admin/mailing-list`}
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></svg>}
            label={t('event_admin_menu.mailing_list')}
            expanded={menuExpanded}
            active={loc.pathname === `/events/${eventId}/admin/mailing-list`} />
          <Row to={`/events/${eventId}/admin/exports`}
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}
            label={t('event_admin_menu.exports_schedules')}
            expanded={menuExpanded}
            active={loc.pathname === `/events/${eventId}/admin/exports`} />
          <Row to={`/events/${eventId}/admin/print`}
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>}
            label={t('event_admin_menu.printouts')}
            expanded={menuExpanded}
            active={loc.pathname.startsWith(`/events/${eventId}/admin/print`)} />
        </div>

        <div className="mt-2 pb-4">
          {menuExpanded && (
            <div className="text-[10px] uppercase tracking-wide text-gray-400 px-3 pt-2 pb-1">{t('event_admin_menu.section_event')}</div>
          )}
          <Row to={`/events/${eventId}`}
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
            label={t('event_admin_menu.public_page')}
            expanded={menuExpanded} />
          <Row to={appendBiz(`/events/manage?edit=${eventId}`, businessId)}
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>}
            label={t('event_admin_menu.edit_details')}
            expanded={menuExpanded} />
          <Row to={appendBiz('/events/manage', businessId)}
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>}
            label={t('event_admin_menu.all_events')}
            expanded={menuExpanded} />
        </div>

      </nav>
    </aside>
  );
}
