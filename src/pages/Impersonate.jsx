// src/pages/Impersonate.jsx
// Landing point for the "Open in Livestock of America" button in the
// oatmeal-ai.com admin tools. Takes the one-time token from the URL, swaps it
// for a session, and lands on the account page as that user.
//
// Any account already signed in here is signed out first, so arriving with a
// new token always replaces the previous one rather than layering on top of it.
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { endpoints } from '../config/api';
import { logout } from '../lib/auth';

const CREAM = '#f7f2e8';
const OLIVE = '#3d6b34';
const RUST = '#8b3a2b';
const INK = '#2c2c2c';
const MUTED = '#6b6b6b';
const LORA = "'Lora', 'Times New Roman', serif";

// logout() clears the session keys; the selected business is separate and would
// otherwise carry over from whoever was signed in before.
function clearPreviousSession() {
  logout();
  try {
    localStorage.removeItem('selected_business_id');
  } catch {
    /* storage can be unavailable; the session keys are what matter */
  }
}

export default function Impersonate() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [error, setError] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    // A one-time token must not be spent twice by a double-invoked effect.
    if (ran.current) return;
    ran.current = true;

    if (!token) {
      setError('This link is missing its sign-in token.');
      return;
    }

    // Sign the previous account out before asking for the new one, so a failed
    // handoff never leaves the old session sitting there looking current.
    clearPreviousSession();

    fetch(endpoints.impersonate(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.detail || 'That sign-in link did not work.');
        return data;
      })
      .then((data) => {
        localStorage.setItem('access_token', data.AccessToken || '');
        if (data.PeopleID != null) localStorage.setItem('people_id', data.PeopleID);
        if (data.PeopleFirstName) localStorage.setItem('first_name', data.PeopleFirstName);
        if (data.PeopleLastName) localStorage.setItem('last_name', data.PeopleLastName);
        if (data.AccessLevel != null) localStorage.setItem('access_level', data.AccessLevel);
        // replace: the token is spent, so Back must not return to this URL.
        navigate('/account', { replace: true });
      })
      .catch((e) => setError(e.message));
  }, [token, navigate]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: CREAM }}
    >
      <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 max-w-md w-full text-center">
        {error ? (
          <>
            <h1 className="text-xl font-bold m-0 mb-2" style={{ fontFamily: LORA, color: RUST }}>
              Could not open that account
            </h1>
            <p className="text-sm m-0 mb-4" style={{ color: MUTED }}>{error}</p>
            <p className="text-xs m-0 mb-4" style={{ color: MUTED }}>
              These links are single use and expire after a couple of minutes.
              Go back to the admin page and open the account again.
            </p>
            <button
              type="button"
              onClick={() => navigate('/login', { replace: true })}
              className="px-5 py-2.5 rounded-lg font-semibold text-sm text-white"
              style={{ background: OLIVE }}
            >
              Go to sign in
            </button>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold m-0 mb-2" style={{ fontFamily: LORA, color: INK }}>
              Opening the account…
            </h1>
            <p className="text-sm m-0" style={{ color: MUTED }}>One moment.</p>
          </>
        )}
      </div>
    </div>
  );
}
