import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from '../lib/i18n';
import Header from '../components/Header';
import Breadcrumbs from '../components/Breadcrumbs';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import { endpoints } from '../config/api';

const FIELD_CLASS =
  'w-full border border-gray-300 rounded-xl px-4 py-3 text-sm ' +
  'focus:outline-none focus:border-[#819360] focus:ring-2 focus:ring-[#819360]/20 transition-all';

/** Eye / eye-with-slash, sized to sit inside the field. */
function EyeIcon({ off }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M3 3l18 18" />}
    </svg>
  );
}

/**
 * Password field with a show/hide toggle.
 *
 * The button is type="button" so it never submits the form, and is marked
 * aria-pressed so screen readers announce the current state rather than just
 * "button". Padding on the right keeps typed text clear of the icon.
 */
function PasswordField({ id, label, value, onChange, placeholder, shown, onToggle }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={shown ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          required
          autoComplete="new-password"
          placeholder={placeholder}
          className={`${FIELD_CLASS} pr-12`}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={shown}
          aria-label={shown ? 'Hide password' : 'Show password'}
          title={shown ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-500 hover:text-[#819360] bg-transparent border-0 cursor-pointer"
        >
          <EyeIcon off={shown} />
        </button>
      </div>
    </div>
  );
}

/**
 * Ported from the Oatmeal Farm Network signup page, with one deliberate
 * difference: registration is always open here. OFN gates its form behind a
 * `signup_open` flag from /auth/site-settings and defaults to closed; Livestock
 * of America accepts sign-ups directly, so that gate is not carried over.
 */
export default function Signup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Each field toggles independently — revealing one shouldn't reveal both.
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('auth.passwords_mismatch', 'Passwords do not match.'));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(endpoints.signup(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          PeopleFirstName: firstName,
          PeopleLastName: lastName,
          Email: email,
          Password: password,
        }),
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        const detail = data.detail;
        setError(
          Array.isArray(detail)
            ? detail.map((d) => d.msg).join(', ')
            : detail || t('auth.signup_failed', 'Signup failed. Please try again.'),
        );
        return;
      }

      // Same session shape the rest of the app reads back.
      const token = data.AccessToken || data.access_token;
      if (token) localStorage.setItem('access_token', token);
      if (data.PeopleID != null) localStorage.setItem('people_id', data.PeopleID);
      if (data.PeopleFirstName) localStorage.setItem('first_name', data.PeopleFirstName);
      if (data.PeopleLastName) localStorage.setItem('last_name', data.PeopleLastName);
      localStorage.setItem('access_level', data.AccessLevel ?? 0);

      navigate('/account', { replace: true });
    } catch {
      setError(t('auth.server_error', 'Unable to reach the server. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-sans flex flex-col">
      <PageMeta
        title="Create Account | Livestock of America"
        description="Join Livestock of America to list your animals, browse the marketplace, and connect with ranchers and breeders across the country."
        noIndex
      />
      <Header />

      {/* Breadcrumbs sit directly under the header on every page but Home. */}
      <div className="mx-auto w-full px-4" style={{ maxWidth: '440px' }}>
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'Create Account' },
          ]}
        />
      </div>

      <section className="py-16 px-4 flex-1">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden">
            <div className="bg-[#819360] px-8 py-8 text-center">
              <img
                src="/images/loa-header-logo.png"
                alt="Livestock of America by Oatmeal AI"
                className="h-12 mx-auto mb-4 w-auto"
              />
              <h1 className="text-white text-2xl font-bold m-0" style={{ fontFamily: "'Lora', serif" }}>
                {t('auth.create_account', 'Create Account')}
              </h1>
              <p className="text-white/80 text-sm mt-1">
                {t('auth.join_network', 'Join Livestock of America by Oatmeal AI')}
              </p>
            </div>

            <div className="px-8 py-8">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {t('auth.field_first_name', 'First Name')}
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    autoComplete="given-name"
                    placeholder={t('auth.first_name_placeholder', 'Your first name')}
                    className={FIELD_CLASS}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {t('auth.field_last_name', 'Last Name')}
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    autoComplete="family-name"
                    placeholder={t('auth.last_name_placeholder', 'Your last name')}
                    className={FIELD_CLASS}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {t('auth.field_email', 'Email')}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder={t('auth.email_placeholder', 'you@example.com')}
                    className={FIELD_CLASS}
                  />
                </div>

                <PasswordField
                  id="signup-password"
                  label={t('auth.field_password', 'Password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.password_placeholder', 'Choose a password')}
                  shown={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                />

                <PasswordField
                  id="signup-confirm-password"
                  label={t('auth.field_confirm_password', 'Confirm Password')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('auth.password_placeholder', 'Choose a password')}
                  shown={showConfirm}
                  onToggle={() => setShowConfirm((v) => !v)}
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#819360] hover:bg-[#4d734d] text-white font-bold py-3 px-6 rounded-xl transition-colors duration-200 text-sm uppercase tracking-wider disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading
                    ? t('auth.creating_account', 'Creating account…')
                    : t('auth.sign_up', 'Sign Up')}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6 mb-0">
                {t('auth.already_account', 'Already have an account?')}{' '}
                <Link to="/login" className="text-[#819360] font-semibold hover:text-[#4d734d]">
                  {t('auth.sign_in', 'Sign in')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
