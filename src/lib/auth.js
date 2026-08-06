/** Lightweight auth helpers for Livestock of America. */

export function isLoggedIn() {
  if (typeof window === 'undefined') return false;
  return !!(
    localStorage.getItem('access_token') ||
    localStorage.getItem('AccessToken')
  );
}

/** Entire LOA app is the Phase-1 Livestock of America experience. */
export function isPhase1PublicMode() {
  return true;
}

export function logout() {
  const peopleId =
    localStorage.getItem('people_id') || localStorage.getItem('PeopleID') || '';
  [
    'access_token',
    'AccessToken',
    'people_id',
    'PeopleID',
    'first_name',
    'last_name',
    'access_level',
    'AccessLevel',
  ].forEach((k) => localStorage.removeItem(k));
  // Drop Saige thread keys so the next login starts a fresh conversation.
  try {
    const prefixes = [
      `loa_saige_thread_${peopleId || ''}`,
      'loa_saige_thread_anon',
    ];
    Object.keys(localStorage)
      .filter((k) => prefixes.some((p) => k === p || k.startsWith(`${p}_`)))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

export function getToken() {
  return (
    localStorage.getItem('access_token') ||
    localStorage.getItem('AccessToken') ||
    ''
  );
}

export function getPeopleId() {
  if (typeof window === 'undefined') return null;
  const raw =
    localStorage.getItem('people_id') || localStorage.getItem('PeopleID') || '';
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}
