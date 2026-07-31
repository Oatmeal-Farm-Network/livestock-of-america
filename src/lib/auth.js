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
}

export function getToken() {
  return (
    localStorage.getItem('access_token') ||
    localStorage.getItem('AccessToken') ||
    ''
  );
}
