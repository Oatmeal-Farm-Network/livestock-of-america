import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import { endpoints } from '../config/api';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from
    ? location.state.from.pathname + (location.state.from.search || '')
    : '/account';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(endpoints.login(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Email: email, Password: password }),
      });
      const text = await response.text();
      const data = text ? JSON.parse(text) : {};
      if (!response.ok) {
        const detail = data.detail;
        setError(
          Array.isArray(detail)
            ? detail.map((d) => d.msg).join(', ')
            : detail || t('auth.login_failed', { status: response.status }),
        );
        return;
      }
      localStorage.setItem('access_token', data.AccessToken || data.access_token || '');
      if (data.PeopleID != null) localStorage.setItem('people_id', data.PeopleID);
      if (data.PeopleFirstName) localStorage.setItem('first_name', data.PeopleFirstName);
      if (data.PeopleLastName) localStorage.setItem('last_name', data.PeopleLastName);
      if (data.AccessLevel != null) localStorage.setItem('access_level', data.AccessLevel);
      navigate(from, { replace: true });
    } catch {
      setError(t('auth.server_error', 'Unable to reach the server. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-sans flex flex-col">
      <PageMeta title="Sign In | Livestock of America" description="Sign in to Livestock of America." noIndex />
      <Header />
      <section className="py-16 px-4 flex-1">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden">
            <div className="bg-[#819360] px-8 py-8 text-center">
              <img
                src="/images/loa-header-logo.webp"
                alt="Livestock of America"
                className="h-12 mx-auto mb-4 w-auto"
              />
              <h1 className="text-white text-2xl font-bold m-0" style={{ fontFamily: "'Lora', serif" }}>
                {t('auth.login_welcome', 'Welcome back')}
              </h1>
              <p className="text-white/80 text-sm mt-1">{t('auth.login_subtitle', 'Sign in to your account')}</p>
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
                    {t('auth.field_email', 'Email')}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#819360]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {t('auth.field_password', 'Password')}
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#819360]"
                  />
                  <div className="text-right mt-1.5">
                    <Link to="/forgot-password" className="text-xs text-[#819360] font-medium">
                      {t('auth.forgot_password', 'Forgot password?')}
                    </Link>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#819360] hover:bg-[#4d734d] text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-50"
                >
                  {loading ? t('auth.signing_in', 'Signing in…') : t('auth.sign_in', 'Sign In')}
                </button>
              </form>
              <p className="text-center text-sm text-gray-600 mt-6 mb-0">
                {t('auth.no_account', "Don't have an account?")}{' '}
                <Link to="/signup" className="text-[#819360] font-semibold">
                  {t('auth.create_one', 'Create one')}
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
