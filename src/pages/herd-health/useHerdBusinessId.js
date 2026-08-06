// src/pages/herd-health/useHerdBusinessId.js
import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAccount } from '../../lib/AccountContext';

function bizIdOf(b) {
  if (!b) return null;
  const id = b.BusinessID ?? b.businessId ?? b.id;
  const n = parseInt(id, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function bizNameOf(b) {
  return b?.BusinessName || b?.businessName || b?.Name || b?.name || `Business #${bizIdOf(b)}`;
}

/**
 * Read/set BusinessID from the query string for Herd Health pages.
 * If the URL has no BusinessID but AccountContext / storage does, sync it into the URL.
 */
export function useHerdBusinessId() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { businesses = [], BusinessID: ctxBiz } = useAccount() || {};

  const fromUrl = (() => {
    const n = parseInt(searchParams.get('BusinessID') || '', 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  })();

  const fromStore = (() => {
    const n = parseInt(localStorage.getItem('selected_business_id') || '', 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  })();

  const businessId = fromUrl || (ctxBiz ? Number(ctxBiz) : null) || fromStore || null;

  const setBusinessId = (id) => {
    const next = new URLSearchParams(searchParams);
    if (id) next.set('BusinessID', String(id));
    else next.delete('BusinessID');
    setSearchParams(next, { replace: true });
    if (id) localStorage.setItem('selected_business_id', String(id));
  };

  // Keep BusinessID in the URL so nav / refresh / deep links stay scoped.
  useEffect(() => {
    if (!businessId || fromUrl) return;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (next.get('BusinessID') === String(businessId)) return prev;
      next.set('BusinessID', String(businessId));
      return next;
    }, { replace: true });
  }, [businessId, fromUrl, setSearchParams]);

  const options = useMemo(
    () =>
      (businesses || [])
        .map((b) => ({ id: bizIdOf(b), name: bizNameOf(b) }))
        .filter((o) => o.id),
    [businesses],
  );

  const qs = businessId ? `?BusinessID=${businessId}` : '';

  return { businessId, setBusinessId, options, qs, businesses };
}

export { bizIdOf, bizNameOf };
