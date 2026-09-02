import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { useAccount } from './AccountContext';

/**
 * The business a workspace page should act on.
 *
 * Pages ported from OFN read ?BusinessID and nothing else, because over there
 * every route into them carried it. On LOA that assumption breaks: AccountContext
 * adopts a business only when the URL names one, so any load without the param
 * leaves the context empty — while the sidebar header still shows
 * businesses[0].BusinessName, so an account looks active when none is selected.
 * Pages then hang on a spinner or bounce to the dashboard.
 *
 * Resolution order matches what the workspace displays:
 *   1. ?BusinessID          — explicit, wins
 *   2. AccountContext       — a real selection
 *   3. businesses[0]        — what the sidebar header is already showing
 *
 * The resolved id is written back into the URL so a refresh or a shared link
 * lands on the same business, and so AccountContext — which follows the URL —
 * adopts it for real rather than silently disagreeing.
 *
 * `resolving` is true only while the answer is genuinely unknown: the list
 * arrives asynchronously and starts as [], which is indistinguishable from "this
 * user has none". Callers must wait on it before redirecting or reporting that
 * no business is selected.
 */
export function useBusinessId() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { BusinessID: selected, businesses, businessesLoaded } = useAccount() || {};

  const fromUrl = parseInt(searchParams.get('BusinessID') || '0', 10) || 0;
  const firstOwned = Array.isArray(businesses) && businesses.length
    ? (businesses[0].BusinessID ?? businesses[0].businessId ?? businesses[0].id)
    : null;

  const businessId = fromUrl || Number(selected) || Number(firstOwned) || 0;

  useEffect(() => {
    if (!fromUrl && businessId) {
      const next = new URLSearchParams(searchParams);
      next.set('BusinessID', String(businessId));
      setSearchParams(next, { replace: true });
    }
  }, [fromUrl, businessId]); // eslint-disable-line react-hooks/exhaustive-deps

  return { businessId, resolving: !businessId && !businessesLoaded };
}

export default useBusinessId;
