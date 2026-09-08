// Ported from Oatmeal Farm Network (src/EventAdminLayout.jsx). Supporting component for
// the events admin pages; mechanical adaptations only.
import React, { useEffect, useState } from 'react';
import AccountLayout from './AccountLayout';
import EventAdminMenu, { EVENT_MENU_WIDTH_EXPANDED, EVENT_MENU_WIDTH_COLLAPSED } from './EventAdminMenu';

const API = import.meta.env.VITE_LIVESTOCK_API_URL || '';

export default function EventAdminLayout({ eventId, children }) {
  const [ev, setEv] = useState(null);
  const [menuExpanded, setMenuExpanded] = useState(() =>
    localStorage.getItem('event_admin_menu_expanded') !== 'false'
  );

  useEffect(() => {
    localStorage.setItem('event_admin_menu_expanded', String(menuExpanded));
  }, [menuExpanded]);

  useEffect(() => {
    if (!eventId) { setEv(null); return; }
    let alive = true;
    fetch(`${API}/api/events/${eventId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (alive) setEv(d); })
      .catch(() => { if (alive) setEv(null); });
    return () => { alive = false; };
  }, [eventId]);

  const menuWidth = menuExpanded ? EVENT_MENU_WIDTH_EXPANDED : EVENT_MENU_WIDTH_COLLAPSED;

  return (
    <AccountLayout>
      {eventId && (
        <EventAdminMenu
          eventId={eventId}
          eventType={ev?.EventType}
          businessId={ev?.BusinessID}
          menuExpanded={menuExpanded}
          setMenuExpanded={setMenuExpanded}
        />
      )}
      <div
        className="transition-all duration-300"
        style={{ marginLeft: eventId ? menuWidth : 0 }}
      >
        {children}
      </div>
    </AccountLayout>
  );
}
