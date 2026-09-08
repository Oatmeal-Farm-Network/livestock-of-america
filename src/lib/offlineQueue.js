// Ported from Oatmeal Farm Network (src/offlineQueue.js). Self-contained: it
// queues writes in localStorage while offline and replays them on reconnect.
/**
 * Offline-aware fetch helper. Try the network; on failure (or if offline),
 * hand the request to the service worker's bg-sync queue and return a
 * synthetic 202 Accepted so the calling UI can flow as if it succeeded.
 *
 * Usage:
 *   import { queuedFetch } from './offlineQueue';
 *   const r = await queuedFetch('/api/events/1/leads/scan', {
 *     method: 'POST', headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify(payload),
 *     queueWhenOffline: true,
 *   });
 */

export async function queuedFetch(url, opts = {}) {
  const { queueWhenOffline = false, ...init } = opts;
  try {
    const r = await fetch(url, init);
    return r;
  } catch (e) {
    if (!queueWhenOffline) throw e;
    await enqueue({ url, ...init });
    return new Response(JSON.stringify({ queued: true, offline: true }), {
      status: 202, headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function enqueue(payload) {
  if (!('serviceWorker' in navigator)) return false;
  const reg = await navigator.serviceWorker.ready;
  if (!reg.active) return false;

  reg.active.postMessage({ type: 'bg-queue', payload });

  // Hint the browser to schedule a sync when connectivity returns
  if ('sync' in reg) {
    try { await reg.sync.register('ofn-bg-sync'); } catch {}
  }
  return true;
}

/** Force the service worker to drain the queue right now. Useful for a
 *  "Retry pending uploads" button. */
export function flushQueue() {
  return new Promise((resolve) => {
    if (!('serviceWorker' in navigator)) return resolve({ ok: 0, failed: 0 });
    const ch = new MessageChannel();
    ch.port1.onmessage = (e) => resolve(e.data || { ok: 0, failed: 0 });
    navigator.serviceWorker.ready.then(reg => {
      reg.active?.postMessage({ type: 'flush-queue' }, [ch.port2]);
    });
    setTimeout(() => resolve({ ok: 0, failed: 0, timeout: true }), 8000);
  });
}

/** Show "online / offline" UI hint. */
export function onConnectivityChange(cb) {
  const fire = () => cb(navigator.onLine);
  window.addEventListener('online',  fire);
  window.addEventListener('offline', fire);
  fire();
  return () => {
    window.removeEventListener('online',  fire);
    window.removeEventListener('offline', fire);
  };
}
