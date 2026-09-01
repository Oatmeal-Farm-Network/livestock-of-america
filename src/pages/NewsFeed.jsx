// src/NewsFeed.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from '../lib/i18n';
import PageMeta from '../components/PageMeta';
import './NewsFeed.css';
import {
  fetchCommodityQuotes,
  fetchSnapshotSparklines,
  readQuotesCache,
  hasQuoteData,
  refreshCommodityQuotesInBackground,
} from '../lib/commodityQuotes';

const CATEGORIES = ['All', 'Markets', 'Weather', 'Policy', 'AgTech', 'Livestock', 'General'];

const CATEGORY_IMAGES = {
  Markets: '/images/news/news-markets.svg',
  Weather: '/images/news/news-weather.svg',
  Policy: '/images/news/news-policy.svg',
  AgTech: '/images/news/news-agtech.svg',
  Livestock: '/images/news/news-livestock.svg',
  General: '/images/news/news-general.svg',
};

const GREEN_CATS = new Set(['AgTech', 'Livestock', 'Markets']);
const HERO_FALLBACK = '/images/NewsHeroWheat.webp';

/** Snapshot rows — same futures symbols as Commodity Prices page */
const SNAPSHOT_COMMODITIES = [
  { name: 'Wheat', symbol: 'ZW', unit: 'bu' },
  { name: 'Corn', symbol: 'ZC', unit: 'bu' },
  { name: 'Soy', symbol: 'ZS', unit: 'bu' },
];

const API =
  // Shared Oatmeal AI news service. It serves full articles to everyone, and
  // unlike a direct Firestore read it also fetches a missing article body from
  // the publisher on first view, so LOA gets the same text as the other sites.
  import.meta.env.VITE_NEWS_API_URL ||
  'https://oatmeal-ai.com';

function stripHtml(html) {
  if (!html) return '';
  return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function lookupQuote(quotes, symbol) {
  if (!quotes || typeof quotes !== 'object') return null;
  return quotes[`${symbol}=F`] || quotes[symbol] || quotes[`${symbol}=F.CME`] || null;
}

function sparkPointsFromPrices(prices, width = 58, height = 16) {
  if (!prices || prices.length < 2) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const n = prices.length;
  return prices
    .map((p, i) => {
      const x = 2 + (i / (n - 1)) * width;
      const y = height - ((p - min) / range) * (height - 2) - 1;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

/** Wavy sparkline when only price + change are available (not a straight 2-point line). */
function sparkWaveSynthetic(price, change, pct, seed = 0) {
  if (!Number.isFinite(price)) return null;
  let start = Number.isFinite(change) ? price - change : null;
  if (start == null && Number.isFinite(pct)) start = price / (1 + pct / 100);
  if (start == null || !Number.isFinite(start)) start = price * 0.992;

  const end = price;
  const n = 12;
  const trend = end - start;
  const amp = Math.max(Math.abs(trend) * 0.5, end * 0.007);
  const phase = seed * 0.65;
  const prices = [];

  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const linear = start + trend * t;
    const wave =
      Math.sin(t * Math.PI * 2.4 + phase) * amp +
      Math.sin(t * Math.PI * 5.2 + phase * 1.4) * amp * 0.38;
    prices.push(linear + wave * (1 - t * 0.15));
  }
  prices[0] = start;
  prices[n - 1] = end;
  return sparkPointsFromPrices(prices);
}

function sparkForCommodity(price, change, pct, symbol, sparkHistory) {
  const hist = sparkHistory?.[symbol];
  if (hist && hist.length >= 3) {
    return sparkPointsFromPrices(hist);
  }
  const seed = symbol.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return sparkWaveSynthetic(price, change, pct, seed);
}

function buildMarketRows(quotes, sparkHistory = {}) {
  return SNAPSHOT_COMMODITIES.map((c) => {
    const q = lookupQuote(quotes, c.symbol);
    if (!q || !Number.isFinite(Number(q.price))) {
      return {
        name: c.name,
        price: '—',
        change: '—',
        up: false,
        down: false,
        spark: null,
        empty: true,
      };
    }
    const price = Number(q.price);
    const pct = Number.isFinite(Number(q.pct)) ? Number(q.pct) : null;
    const change = Number.isFinite(Number(q.change)) ? Number(q.change) : null;
    const move = pct != null ? pct : change;
    const up = move != null && move > 0;
    const down = move != null && move < 0;
    return {
      name: c.name,
      price: `$${price.toFixed(2)}`,
      change:
        pct != null
          ? `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`
          : change != null
            ? `${change > 0 ? '+' : ''}${change.toFixed(2)}`
            : '—',
      up,
      down,
      spark: sparkForCommodity(price, change, pct, c.symbol, sparkHistory),
      empty: false,
    };
  });
}

const NewsFeed = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('Newest');
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [prefs, setPrefs] = useState({ categories: [], emailFrequency: 'off', preferredHour: 7 });
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsMsg, setPrefsMsg] = useState('');
  const [email, setEmail] = useState('');
  const [marketRows, setMarketRows] = useState(() => {
    const cached = readQuotesCache();
    return cached && hasQuoteData(cached.quotes) ? buildMarketRows(cached.quotes, {}) : [];
  });
  const [marketLoading, setMarketLoading] = useState(() => {
    const cached = readQuotesCache();
    return !(cached && hasQuoteData(cached.quotes));
  });

  const peopleId = localStorage.getItem('people_id') || '';
  const accessLevel = parseInt(localStorage.getItem('access_level') || '0', 10);
  const isSignedIn = !!peopleId;
  const isAdmin = accessLevel > 2;

  const authHeaders = () => {
    const h = { 'Content-Type': 'application/json' };
    if (peopleId) h['x-people-id'] = peopleId;
    if (accessLevel) h['x-access-level'] = String(accessLevel);
    return h;
  };

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`${API}/api/news`);
        if (!response.ok) throw new Error('Failed to fetch news');
        const data = await response.json();
        setArticles(data.articles || []);
      } catch (err) {
        console.error('News fetch error:', err);
        setError(t('news.error'));
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
    fetch(`${API}/api/news/sync/status`)
      .then((r) => r.json())
      .then(setSyncStatus)
      .catch(() => {});
  }, [t]);

  // Market Snapshot — paint from cache, then refresh quotes + wave sparklines
  useEffect(() => {
    let cancelled = false;

    const loadMarket = async () => {
      const hadCache = marketRows.length > 0 && marketRows.some((r) => !r.empty);
      if (!hadCache) setMarketLoading(true);

      const sparkCtrl = new AbortController();
      const sparkPromise = fetchSnapshotSparklines({ signal: sparkCtrl.signal }).catch(() => ({}));

      const result = await fetchCommodityQuotes({
        preferCache: !hadCache,
        timeoutMs: 6000,
      });
      const sparkHistory = await sparkPromise;
      if (cancelled) return;

      if (hasQuoteData(result.quotes)) {
        setMarketRows(buildMarketRows(result.quotes, sparkHistory));
        setMarketLoading(false);
        if (result.fromCache) refreshCommodityQuotesInBackground();
      } else if (!hadCache) {
        setMarketRows(buildMarketRows({}, sparkHistory));
        setMarketLoading(false);
      } else {
        setMarketLoading(false);
      }
    };

    loadMarket();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only
  }, []);

  const openPrefs = async () => {
    setPrefsOpen(true);
    setPrefsMsg('');
    if (!isSignedIn) return;
    try {
      const r = await fetch(`${API}/api/news/prefs/me`, { headers: authHeaders() });
      if (r.ok) {
        const data = await r.json();
        setPrefs({
          categories: Array.isArray(data.categories) ? data.categories : [],
          emailFrequency: data.emailFrequency || 'off',
          preferredHour: typeof data.preferredHour === 'number' ? data.preferredHour : 7,
          lastSentAt: data.lastSentAt,
        });
      }
    } catch {
      /* ignore */
    }
  };

  const savePrefs = async () => {
    setPrefsSaving(true);
    setPrefsMsg('');
    try {
      const r = await fetch(`${API}/api/news/prefs/me`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(prefs),
      });
      if (!r.ok) throw new Error('Save failed');
      setPrefsMsg(t('news.prefs_saved_msg'));
    } catch {
      setPrefsMsg(t('news.prefs_error_msg'));
    } finally {
      setPrefsSaving(false);
    }
  };

  const sendPreview = async () => {
    setPrefsSaving(true);
    setPrefsMsg('');
    try {
      const r = await fetch(`${API}/api/news/digest/send-now`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || 'Failed');
      setPrefsMsg(t('news.preview_sent', { to: data.to }));
    } catch (err) {
      setPrefsMsg(err.message || t('news.prefs_error_msg'));
    } finally {
      setPrefsSaving(false);
    }
  };

  const toggleCategory = (cat) => {
    setPrefs((p) => ({
      ...p,
      categories: p.categories.includes(cat)
        ? p.categories.filter((c) => c !== cat)
        : [...p.categories, cat],
    }));
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch(`${API}/api/news/sync`, { method: 'POST' });
      const response = await fetch(`${API}/api/news`);
      const data = await response.json();
      setArticles(data.articles || []);
      const status = await fetch(`${API}/api/news/sync/status`).then((r) => r.json());
      setSyncStatus(status);
    } catch {
      /* ignore */
    } finally {
      setSyncing(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = articles.filter(
      (a) =>
        (category === 'All' || a.category === category) &&
        (!q ||
          a.title?.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q) ||
          a.source?.toLowerCase().includes(q))
    );
    result.sort((a, b) => {
      const da = new Date(a.pubDate).getTime();
      const db = new Date(b.pubDate).getTime();
      return sort === 'Newest' ? db - da : da - db;
    });
    return result;
  }, [articles, query, category, sort]);

  const featured = filtered[0] || articles[0] || null;
  const dispatchList = useMemo(() => filtered, [filtered]);

  // Latest Dispatches mirrored into Trending Topics (newest first, top 8)
  const trendingDispatches = useMemo(() => {
    const source = (dispatchList.length ? dispatchList : articles).slice(0, 8);
    return source.map((a) => ({
      id: a.id,
      title: a.title,
      category: a.category || 'General',
      source: a.source,
    }));
  }, [dispatchList, articles]);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '';
    return date
      .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      .toUpperCase();
  };

  const formatRelative = (dateStr) => {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '';
    const diffMs = Date.now() - date.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} Min${mins === 1 ? '' : 's'} Ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} Hour${hours === 1 ? '' : 's'} Ago`;
    const days = Math.floor(hours / 24);
    return `${days} Day${days === 1 ? '' : 's'} Ago`;
  };

  const getArticleImage = (article) => {
    const img = article?.image?.trim();
    if (img && !img.endsWith('.svg')) return img;
    return article?.placeholderImage || CATEGORY_IMAGES[article?.category] || CATEGORY_IMAGES.General;
  };

  // The hero is the newest article in the feed — the same one it links to.
  // Static copy is only a fallback for before the feed loads or if it is empty.
  const heroTitle =
    featured?.title?.trim() || 'Agricultural news, gathered in one feed';
  const heroDesc =
    featured?.description?.trim() ||
    'Live updates from USDA, Farm Journal, Brownfield Ag, AGDAILY and more — markets, weather, policy, and AgTech in one feed.';
  const heroSource = featured
    ? `Source: ${featured.source || 'USDA'}${featured.pubDate ? ` • ${formatRelative(featured.pubDate)}` : ''}`
    : 'Source: USDA • Just now';

  return (
    <div className="news-page" style={{ background: '#f7f2e8', margin: '0', padding: '1.5rem 1.5rem 2rem', minHeight: 'calc(100vh - 120px)' }}>
      <PageMeta
        title="Agricultural News & Farm Market Updates"
        description="Stay current with agricultural news covering markets, weather, policy, AgTech, and livestock. Curated daily for farmers, ranchers, and food producers."
        keywords="farm news, agricultural news, commodity markets, farm policy, AgTech news, livestock news, weather alerts, crop markets"
        canonical="https://livestockofamerica.com/news"
        image="/images/NewsHeroWheat.webp"
        imageAlt="Livestock of America Newsroom"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Agricultural News & Farm Market Updates',
            description: 'Curated agricultural news for farmers, ranchers, and food producers.',
            url: 'https://livestockofamerica.com/news',
          },
          articles.length > 0
            ? {
                '@context': 'https://schema.org',
                '@type': 'ItemList',
                url: 'https://livestockofamerica.com/news',
                itemListElement: articles.slice(0, 10).map((a, i) => ({
                  '@type': 'ListItem',
                  position: i + 1,
                  url: `https://livestockofamerica.com/news/${a.id}`,
                  name: a.title,
                })),
              }
            : null,
        ].filter(Boolean)}
      />

      <div className="news-wrap">
        {/* Featured hero */}
        <section
          className="news-featured"
          onClick={() => featured && navigate(`/news/${featured.id}`)}
          role={featured ? 'link' : undefined}
          tabIndex={featured ? 0 : undefined}
          onKeyDown={(e) => {
            if (featured && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              navigate(`/news/${featured.id}`);
            }
          }}
        >
          <img
            className="news-featured__img"
            src={HERO_FALLBACK}
            alt=""
            loading="eager"
          />
          <div className="news-featured__overlay" aria-hidden />
          <div className="news-featured__body">
            <h1 className="news-featured__title">{heroTitle}</h1>
            <p className="news-featured__desc">{heroDesc}</p>
            <div className="news-featured__actions">
              <button
                type="button"
                className="news-featured__cta"
                onClick={(e) => {
                  e.stopPropagation();
                  if (featured) navigate(`/news/${featured.id}`);
                  else openPrefs();
                }}
              >
                Read Full Report
              </button>
              <span className="news-featured__source">{heroSource}</span>
            </div>
            {syncStatus?.lastSync && isAdmin && (
              <div className="news-admin-sync">
                {t('news.last_synced')} {new Date(syncStatus.lastSync).toLocaleString()} ·{' '}
                {syncStatus.articleCount} articles
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSync();
                  }}
                  disabled={syncing}
                  style={{
                    marginLeft: '0.5rem',
                    fontSize: '0.7rem',
                    padding: '1px 6px',
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '4px',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  {syncing ? t('news.syncing') : t('news.sync_now')}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Search + filters */}
        <div className="news-toolbar">
          <div className="news-toolbar__search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9a9a9a" strokeWidth="2" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              className="news-input"
              placeholder={t('news.search_placeholder', 'Search headlines, topics, or regions…')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select className="news-input" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="All">All Sources</option>
            {CATEGORIES.filter((c) => c !== 'All').map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select className="news-input" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="Newest">Newest First</option>
            <option value="Oldest">Oldest First</option>
          </select>
        </div>

        <div className="news-layout">
          <div>
            <h2 className="news-section-title">Latest Dispatches</h2>

            {loading && <div className="news-empty">{t('news.loading')}</div>}
            {error && (
              <div className="news-empty" style={{ color: '#b91c1c' }}>
                {error}
              </div>
            )}
            {!loading && !error && dispatchList.length === 0 && filtered.length === 0 && (
              <div className="news-empty">{t('news.no_articles')}</div>
            )}

            {!loading && !error && dispatchList.length > 0 && (
              <div className="news-dispatch-grid">
                {dispatchList.map((a, i) => (
                  <article
                    key={`${a.id}-${i}`}
                    className="news-card"
                    onClick={() => navigate(`/news/${a.id}`)}
                  >
                    <div className="news-card__img-wrap">
                      <img
                        className="news-card__img"
                        src={getArticleImage(a)}
                        alt={a.title}
                        loading={i < 4 ? 'eager' : 'lazy'}
                        onError={(e) => {
                          const fallback = CATEGORY_IMAGES[a.category] || CATEGORY_IMAGES.General;
                          if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                        }}
                      />
                    </div>
                    <div className="news-card__body">
                      <div className="news-card__meta">
                        <span className={`news-card__cat${GREEN_CATS.has(a.category) ? ' is-green' : ''}`}>
                          {(a.category || 'General').replace('AgTech', 'Ag-Tech').toUpperCase()}
                        </span>
                        <span className="news-card__date">{formatDate(a.pubDate)}</span>
                      </div>
                      <h3 className="news-card__title">{a.title}</h3>
                      <p className="news-card__snippet">{stripHtml(a.description)}</p>
                      <div className="news-card__source">{a.source}</div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className="news-sidebar">
            <div className="news-widget">
              <h3 className="news-widget__title">Market Snapshot</h3>
              {marketLoading ? (
                <p className="news-trend-empty">Loading commodity prices…</p>
              ) : (
                marketRows.map((row) => (
                  <div key={row.name} className="news-market-row">
                    <span className="news-market-row__name">{row.name}</span>
                    {row.spark ? (
                      <svg className="news-market-row__spark" viewBox="0 0 60 18" aria-hidden>
                        <polyline
                          fill="none"
                          stroke={row.up ? '#3d6b34' : row.down ? '#b91c1c' : '#9ca3af'}
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={row.spark}
                        />
                      </svg>
                    ) : (
                      <span className="news-market-row__spark" aria-hidden />
                    )}
                    <span className="news-market-row__vals">
                      <span className="news-market-row__price">{row.price}</span>
                      <span
                        className={`news-market-row__chg ${
                          row.empty ? '' : row.up ? 'up' : row.down ? 'down' : ''
                        }`}
                      >
                        {row.change}
                      </span>
                    </span>
                  </div>
                ))
              )}
              {!marketLoading && marketRows.every((r) => r.empty) && (
                <p className="news-trend-empty" style={{ marginTop: 4 }}>
                  Live quotes unavailable right now.
                </p>
              )}
              <button type="button" className="news-market-all" onClick={() => navigate('/news')}>
                View All Commodities
              </button>
            </div>

            <div className="news-widget">
              <h3 className="news-widget__title">Trending Topics</h3>
              {trendingDispatches.length === 0 ? (
                <p className="news-trend-empty">
                  {loading ? 'Loading latest dispatches…' : 'No dispatches yet.'}
                </p>
              ) : (
                <ul className="news-trend-list">
                  {trendingDispatches.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className="news-trend-item"
                        onClick={() => navigate(`/news/${item.id}`)}
                      >
                        <span
                          className={`news-trend-item__cat${GREEN_CATS.has(item.category) ? ' is-green' : ''}`}
                        >
                          {(item.category || 'General').replace('AgTech', 'Ag-Tech').toUpperCase()}
                        </span>
                        <span className="news-trend-item__title">{item.title}</span>
                        {item.source && (
                          <span className="news-trend-item__source">{item.source}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="news-newsletter">
              <h3 className="news-newsletter__title">The Field Report</h3>
              <p className="news-newsletter__body">
                Weekly farm intel — markets, weather, and policy — delivered to your inbox.
              </p>
              <input
                className="news-newsletter__input"
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                type="button"
                className="news-newsletter__btn"
                onClick={() => (isSignedIn ? openPrefs() : navigate('/login'))}
              >
                Subscribe
              </button>
            </div>
          </aside>
        </div>
      </div>

      {prefsOpen && (
        <div
          onClick={() => setPrefsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '12px',
              maxWidth: '520px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.75rem',
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.35rem', color: '#111827' }}>{t('news.prefs_title')}</h2>
              <button
                type="button"
                onClick={() => setPrefsOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#9ca3af', cursor: 'pointer', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            {!isSignedIn ? (
              <div>
                <p style={{ color: '#4b5563', lineHeight: 1.6 }}>{t('news.prefs_signin_body')}</p>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.6rem 1.5rem',
                    backgroundColor: '#819360',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                >
                  {t('news.prefs_signin_btn')}
                </button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#111827', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    {t('news.prefs_categories_label')}
                  </label>
                  <p style={{ margin: '0 0 0.6rem', color: '#6b7280', fontSize: '0.8rem' }}>
                    {t('news.prefs_categories_hint')}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => {
                      const on = prefs.categories.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleCategory(c)}
                          style={{
                            padding: '0.35rem 0.85rem',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            border: `1px solid ${on ? '#819360' : '#d1d5db'}`,
                            backgroundColor: on ? '#819360' : '#fff',
                            color: on ? '#fff' : '#4b5563',
                            borderRadius: '999px',
                            cursor: 'pointer',
                          }}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#111827', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    {t('news.prefs_digest_label')}
                  </label>
                  <select
                    value={prefs.emailFrequency}
                    onChange={(e) => setPrefs((p) => ({ ...p, emailFrequency: e.target.value }))}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.9rem', border: '1px solid #d1d5db', borderRadius: '6px', background: '#fff' }}
                  >
                    <option value="off">{t('news.digest_off')}</option>
                    <option value="daily">{t('news.digest_daily')}</option>
                    <option value="weekly">{t('news.digest_weekly')}</option>
                  </select>
                </div>

                {prefs.emailFrequency !== 'off' && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontWeight: 600, color: '#111827', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      {t('news.prefs_hour_label')}
                    </label>
                    <select
                      value={prefs.preferredHour}
                      onChange={(e) => setPrefs((p) => ({ ...p, preferredHour: parseInt(e.target.value, 10) }))}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.9rem', border: '1px solid #d1d5db', borderRadius: '6px', background: '#fff' }}
                    >
                      {Array.from({ length: 24 }, (_, h) => (
                        <option key={h} value={h}>
                          {String(h).padStart(2, '0')}:00 UTC
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {prefs.lastSentAt && (
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '1rem' }}>
                    {t('news.last_digest_sent')} {new Date(prefs.lastSentAt).toLocaleString()}
                  </div>
                )}

                {prefsMsg && (
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: prefsMsg.startsWith('Could') || prefsMsg.startsWith('Failed') ? '#b91c1c' : '#047857',
                      marginBottom: '0.75rem',
                    }}
                  >
                    {prefsMsg}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  {prefs.emailFrequency !== 'off' && (
                    <button
                      type="button"
                      onClick={sendPreview}
                      disabled={prefsSaving}
                      style={{
                        padding: '0.55rem 1.1rem',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        border: '1px solid #819360',
                        backgroundColor: '#fff',
                        color: '#819360',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      {t('news.prefs_preview')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPrefsOpen(false)}
                    style={{
                      padding: '0.55rem 1.1rem',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      border: '1px solid #d1d5db',
                      backgroundColor: '#fff',
                      color: '#4b5563',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    {t('news.prefs_cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={savePrefs}
                    disabled={prefsSaving}
                    style={{
                      padding: '0.55rem 1.4rem',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      border: 'none',
                      backgroundColor: '#819360',
                      color: '#fff',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    {prefsSaving ? t('news.prefs_saving') : t('news.prefs_save')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsFeed;
