// src/pages/herd-health/herdLive.js
/** Cross-page signal so dashboard refreshes right after any herd-health mutation. */

export const HERD_HEALTH_CHANGED = 'loa:herd-health-changed';

export function notifyHerdHealthChanged(detail = {}) {
  try {
    const payload = { at: Date.now(), ...detail };
    localStorage.setItem(HERD_HEALTH_CHANGED, String(payload.at));
    window.dispatchEvent(new CustomEvent(HERD_HEALTH_CHANGED, { detail: payload }));
  } catch {
    /* ignore storage errors */
  }
}

export function subscribeHerdHealthChanged(handler) {
  const onCustom = (e) => handler(e.detail || {});
  const onStorage = (e) => {
    if (e.key === HERD_HEALTH_CHANGED) handler({ at: Number(e.newValue) || Date.now() });
  };
  const onFocus = () => handler({ at: Date.now(), source: 'focus' });
  const onVisible = () => {
    if (document.visibilityState === 'visible') handler({ at: Date.now(), source: 'visible' });
  };

  window.addEventListener(HERD_HEALTH_CHANGED, onCustom);
  window.addEventListener('storage', onStorage);
  window.addEventListener('focus', onFocus);
  document.addEventListener('visibilitychange', onVisible);

  return () => {
    window.removeEventListener(HERD_HEALTH_CHANGED, onCustom);
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('focus', onFocus);
    document.removeEventListener('visibilitychange', onVisible);
  };
}
