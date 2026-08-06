// Shared commodity futures quotes fetch + localStorage cache for fast paint.

const CACHE_KEY = 'ofn_commodity_quotes_v1';
const CACHE_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes

const API_BASE = import.meta.env.VITE_LIVESTOCK_API_URL || '';

const YF_SYMBOLS = ['ZC=F', 'ZS=F', 'ZW=F', 'LE=F', 'GF=F', 'HE=F', 'DC=F', 'CT=F'];
/** Grain futures on Yahoo are US cents/bushel — show as $/bu */
const GRAIN_CENTS = new Set(['ZC=F', 'ZS=F', 'ZW=F']);

/** Futures symbols used in the News Feed market snapshot widget */
export const SNAPSHOT_YF_SYMBOLS = {
  ZW: 'ZW=F',
  ZC: 'ZC=F',
  ZS: 'ZS=F',
};

export function readQuotesCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.quotes || typeof parsed.quotes !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeQuotesCache(quotes, fetchedAt) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        quotes: quotes || {},
        fetched_at: fetchedAt || new Date().toISOString(),
        cached_at: Date.now(),
      })
    );
  } catch {
    /* ignore quota */
  }
}

export function isQuotesCacheFresh(cache) {
  if (!cache?.cached_at) return false;
  return Date.now() - cache.cached_at < CACHE_MAX_AGE_MS;
}

export function hasQuoteData(quotes) {
  return quotes && typeof quotes === 'object' && Object.keys(quotes).length > 0;
}

/**
 * Direct Yahoo Finance chart API via same-origin /yf proxy (Vite / nginx).
 * Used when the OFN backend returns empty quotes.
 */
async function fetchQuotesViaYahooProxy(signal) {
  const out = {};
  await Promise.all(
    YF_SYMBOLS.map(async (sym) => {
      try {
        const url = `/yf/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=5d`;
        const r = await fetch(url, {
          signal,
          headers: { Accept: 'application/json' },
        });
        if (!r.ok) return;
        const data = await r.json();
        const result = data?.chart?.result?.[0];
        const meta = result?.meta;
        if (!meta || meta.regularMarketPrice == null) return;
        let price = Number(meta.regularMarketPrice);
        let prev = Number(meta.chartPreviousClose ?? meta.previousClose ?? 0);
        if (GRAIN_CENTS.has(sym)) {
          price /= 100;
          prev /= 100;
        }
        const change = prev ? price - prev : 0;
        const pct = prev ? (change / prev) * 100 : 0;
        out[sym] = {
          price: Math.round(price * 10000) / 10000,
          change: Math.round(change * 10000) / 10000,
          pct: Math.round(pct * 100) / 100,
          prev: Math.round(prev * 10000) / 10000,
          name: sym,
        };
      } catch {
        /* skip symbol */
      }
    })
  );
  return out;
}

/** Prefer Cloud Run API, then same-origin /api, then Yahoo /yf proxy. */
export async function fetchCommodityQuotes({ timeoutMs = 8000, preferCache = true } = {}) {
  const cached = preferCache ? readQuotesCache() : null;
  if (cached && isQuotesCacheFresh(cached) && hasQuoteData(cached.quotes)) {
    return { quotes: cached.quotes, fetched_at: cached.fetched_at, fromCache: true, stale: false };
  }

  const bases = [API_BASE, ''].filter((b, i, arr) => arr.indexOf(b) === i);

  // Backend attempts — short timeout so we can fall back to Yahoo quickly
  const backendTimeout = Math.min(timeoutMs, 4000);
  for (const base of bases) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), backendTimeout);
    try {
      const r = await fetch(`${base}/api/commodity-prices/quotes`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      if (!r.ok) continue;
      const d = await r.json();
      const quotes = d?.quotes || {};
      if (hasQuoteData(quotes)) {
        writeQuotesCache(quotes, d.fetched_at);
        return {
          quotes,
          fetched_at: d.fetched_at || null,
          fromCache: false,
          stale: !!d.stale,
        };
      }
    } catch {
      /* try next / Yahoo */
    } finally {
      clearTimeout(timer);
    }
  }

  // Backend empty/down — pull delayed futures via Yahoo proxy (fresh timeout)
  const yfController = new AbortController();
  const yfTimer = setTimeout(() => yfController.abort(), Math.max(timeoutMs, 10000));
  try {
    const yahooQuotes = await fetchQuotesViaYahooProxy(yfController.signal);
    if (hasQuoteData(yahooQuotes)) {
      const fetchedAt = new Date().toISOString();
      writeQuotesCache(yahooQuotes, fetchedAt);
      return {
        quotes: yahooQuotes,
        fetched_at: fetchedAt,
        fromCache: false,
        stale: false,
      };
    }
  } catch {
    /* fall through to cache */
  } finally {
    clearTimeout(yfTimer);
  }

  if (cached && hasQuoteData(cached.quotes)) {
    return {
      quotes: cached.quotes,
      fetched_at: cached.fetched_at,
      fromCache: true,
      stale: true,
    };
  }

  return { quotes: {}, fetched_at: null, fromCache: false, stale: false };
}

/** Background refresh — updates cache without blocking UI */
export function refreshCommodityQuotesInBackground() {
  fetchCommodityQuotes({ preferCache: false, timeoutMs: 15000 }).catch(() => {});
}

/**
 * Fetch recent daily closes for snapshot sparklines (Wheat, Corn, Soy).
 * Returns { ZW: number[], ZC: number[], ZS: number[] } — prices in $/bu.
 */
export async function fetchSnapshotSparklines({ signal, range = '5d' } = {}) {
  const out = {};
  await Promise.all(
    Object.entries(SNAPSHOT_YF_SYMBOLS).map(async ([key, sym]) => {
      try {
        const url = `/yf/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=${range}`;
        const r = await fetch(url, {
          signal,
          headers: { Accept: 'application/json' },
        });
        if (!r.ok) return;
        const data = await r.json();
        const result = data?.chart?.result?.[0];
        const closes = (result?.indicators?.quote?.[0]?.close || []).filter(
          (p) => p != null && Number.isFinite(Number(p))
        );
        if (closes.length < 2) return;
        out[key] = GRAIN_CENTS.has(sym)
          ? closes.map((p) => Number(p) / 100)
          : closes.map((p) => Number(p));
      } catch {
        /* skip symbol */
      }
    })
  );
  return out;
}
