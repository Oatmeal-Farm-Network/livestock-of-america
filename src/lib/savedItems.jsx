import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { endpoints } from '../config/api';
import { getToken, isLoggedIn } from './auth';

const SavedItemsContext = createContext(null);

function emptyIds() {
  return { animals: new Set(), studs: new Set(), ranches: new Set() };
}

export function SavedItemsProvider({ children }) {
  const [ids, setIds] = useState(emptyIds);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!isLoggedIn()) {
      setIds(emptyIds());
      setLoaded(true);
      return;
    }
    try {
      const res = await fetch(endpoints.marketplaceSavedIds(), {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setIds({
        animals: new Set(data.animals || []),
        studs: new Set(data.studs || []),
        ranches: new Set(data.ranches || []),
      });
    } catch {
      /* keep prior state */
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isSaved = useCallback(
    (itemType, id) => {
      const n = Number(id);
      if (!Number.isFinite(n)) return false;
      if (itemType === 'stud') return ids.studs.has(n);
      if (itemType === 'ranch') return ids.ranches.has(n);
      return ids.animals.has(n);
    },
    [ids],
  );

  const toggle = useCallback(
    async (itemType, id) => {
      if (!isLoggedIn()) return { ok: false, needLogin: true };
      const n = Number(id);
      if (!Number.isFinite(n)) return { ok: false };
      const currently = isSaved(itemType, n);
      const body =
        itemType === 'ranch'
          ? { item_type: 'ranch', business_id: n }
          : { item_type: itemType, animal_id: n };

      // Optimistic update
      setIds((prev) => {
        const next = {
          animals: new Set(prev.animals),
          studs: new Set(prev.studs),
          ranches: new Set(prev.ranches),
        };
        const bucket =
          itemType === 'stud' ? next.studs : itemType === 'ranch' ? next.ranches : next.animals;
        if (currently) bucket.delete(n);
        else bucket.add(n);
        return next;
      });

      try {
        const url =
          currently
            ? `${endpoints.marketplaceSaved()}?item_type=${encodeURIComponent(itemType)}&${
                itemType === 'ranch' ? `business_id=${n}` : `animal_id=${n}`
              }`
            : endpoints.marketplaceSaved();
        const res = await fetch(url, {
          method: currently ? 'DELETE' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: currently ? undefined : JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return { ok: true, saved: !currently };
      } catch {
        // Revert
        setIds((prev) => {
          const next = {
            animals: new Set(prev.animals),
            studs: new Set(prev.studs),
            ranches: new Set(prev.ranches),
          };
          const bucket =
            itemType === 'stud' ? next.studs : itemType === 'ranch' ? next.ranches : next.animals;
          if (currently) bucket.add(n);
          else bucket.delete(n);
          return next;
        });
        return { ok: false };
      }
    },
    [isSaved],
  );

  const value = useMemo(
    () => ({ loaded, isSaved, toggle, refresh }),
    [loaded, isSaved, toggle, refresh],
  );

  return <SavedItemsContext.Provider value={value}>{children}</SavedItemsContext.Provider>;
}

export function useSavedItems() {
  const ctx = useContext(SavedItemsContext);
  if (!ctx) {
    return {
      loaded: false,
      isSaved: () => false,
      toggle: async () => ({ ok: false }),
      refresh: async () => {},
    };
  }
  return ctx;
}
