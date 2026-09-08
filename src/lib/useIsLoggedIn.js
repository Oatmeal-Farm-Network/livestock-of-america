import { useState, useEffect } from 'react';

/**
 * Reactive login state, ported from OFN.
 *
 * lib/auth's isLoggedIn() is a plain read, so a component calling it does not
 * re-render when the user signs in or out in another tab. The pages ported from
 * OFN expect this hook, which re-reads on the storage event.
 *
 * Both key spellings are checked because LOA accounts can still carry the older
 * AccessToken / PeopleID pair.
 */
export function useIsLoggedIn() {
  const read = () => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('AccessToken');
    const pid = localStorage.getItem('people_id') || localStorage.getItem('PeopleID');
    return !!(token && pid);
  };

  const [loggedIn, setLoggedIn] = useState(read);

  useEffect(() => {
    const sync = () => setLoggedIn(read());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  return loggedIn;
}

export default useIsLoggedIn;
