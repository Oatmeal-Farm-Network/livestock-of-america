import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { endpoints } from '../config/api';

const AccountContext = createContext(null);

// Coerce anything → a valid numeric BusinessID, or null. Treats 'null',
// 'undefined', empty string, NaN, and 0 as null — any caller that hands
// us garbage gets a clean rejection instead of a poisoned downstream URL.
function toValidBusinessID(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s || s === 'null' || s === 'undefined') return null;
  const n = parseInt(s, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function AccountProvider({ children }) {
  const [Business, setBusiness] = useState(null);
  const [BusinessID, setBusinessID] = useState(null);
  const [OpenSections, setOpenSections] = useState({});
  const [Expanded, setExpanded] = useState(true);
  const [businesses, setBusinesses] = useState([]);
  const [websiteSlug, setWebsiteSlug] = useState(null);
  const location = useLocation();

  // Boot-time scrub: a previous bad LoadBusiness(null) call may have written
  // the literal string "null" to localStorage. Clear it so downstream readers
  // (which treat "null" as truthy) don't fire fetches with business_id=null.
  useEffect(() => {
    const v = localStorage.getItem('selected_business_id');
    if (v === 'null' || v === 'undefined' || v === '') {
      localStorage.removeItem('selected_business_id');
    }
  }, []);

  // Read BusinessID from URL so the context follows page navigation instead of
  // sticking on whichever business happened to be first in the list.
  const urlBusinessID = (() => {
    const p = parseInt(new URLSearchParams(location.search).get('BusinessID') || '', 10);
    return Number.isFinite(p) ? p : null;
  })();

  // Fetch user's businesses once on app load, then auto-load either the URL's
  // BusinessID, the previously-selected one, or the first in the list.
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const peopleId = localStorage.getItem('people_id');
    if (!token || !peopleId) return;
    fetch(endpoints.myBusinesses(peopleId))
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setBusinesses(list);
        if (list.length === 0) return;
        // Only auto-load if the URL explicitly specifies a BusinessID.
        // No fallback to stored or list[0] — user must select an account after login.
        const pick = list.find(b => (b.BusinessID ?? b.businessId ?? b.id) === urlBusinessID);
        if (pick) {
          const id = pick.BusinessID ?? pick.businessId ?? pick.id;
          if (id) LoadBusiness(id);
        }
      })
      .catch(() => {});
  }, []);

  // If the URL's BusinessID changes (e.g. user navigates to a different account's
  // page), swap the context so the sidebar re-renders against the right business.
  // Only swap if the user actually owns that business — never load a foreign business
  // from a stale URL (e.g. after login as a different user).
  useEffect(() => {
    if (!urlBusinessID || urlBusinessID === BusinessID) return;
    if (businesses.length > 0) {
      const owns = businesses.some(b => (b.BusinessID ?? b.businessId ?? b.id) === urlBusinessID);
      if (owns) LoadBusiness(urlBusinessID);
    }
  }, [urlBusinessID, businesses]);

  const clearBusiness = () => {
    setBusiness(null);
    setBusinessID(null);
    setBusinesses([]);
    localStorage.removeItem('selected_business_id');
  };

const LoadBusiness = (ID, Force = false) => {
    const validID = toValidBusinessID(ID);
    if (!validID) return; // null/undefined/'null'/0 → no-op (prevents 422 spam)
    if (validID === BusinessID && Business && !Force) return;
    setBusinessID(validID);
    localStorage.setItem('selected_business_id', String(validID));
    fetch(endpoints.accountHome(validID))
      .then(Res => {
        if (!Res.ok) throw new Error(`HTTP ${Res.status}`);
        return Res.json();
      })
      .then(Data => setBusiness(Data))
      .catch(err => console.error('LoadBusiness failed:', err));
  };

  return (
    <AccountContext.Provider value={{
      Business,
      setBusiness,
      BusinessID,
      LoadBusiness,
      clearBusiness,
      OpenSections,
      setOpenSections,
      Expanded,
      setExpanded,
      businesses,
      setBusinesses,
      websiteSlug,
      setWebsiteSlug,
    }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  return useContext(AccountContext);
}