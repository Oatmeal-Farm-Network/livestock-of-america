import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import { endpoints } from '../config/api';

export default function Signup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    Email: '',
    Password: '',
    PeopleFirstName: '',
    PeopleLastName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(endpoints.signup(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const text = await response.text();
      const data = text ? JSON.parse(text) : {};
      if (!response.ok) {
        const detail = data.detail;
        setError(
          Array.isArray(detail)
            ? detail.map((d) => d.msg).join(', ')
            : detail || 'Signup failed',
        );
        return;
      }
      if (data.AccessToken || data.access_token) {
        localStorage.setItem('access_token', data.AccessToken || data.access_token);
      }
      navigate('/', { replace: true });
    } catch {
      setError(t('auth.server_error', 'Unable to reach the server. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-sans flex flex-col">
      <PageMeta title="Create Account | Livestock of America" noIndex />
      <Header />
      <section className="py-16 px-4 flex-1">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden">
            <div className="bg-[#819360] px-8 py-8 text-center">
              <img src="/images/loa-header-logo.png" alt="Livestock of America" className="h-12 mx-auto mb-4 w-auto" />
              <h1 className="text-white text-2xl font-bold m-0" style={{ fontFamily: "'Lora', serif" }}>
                {t('auth.create_account', 'Create Account')}
              </h1>
              <p className="text-white/80 text-sm mt-1">{t('auth.join_network', 'Join Livestock of America')}</p>
            </div>
            <div className="px-8 py-8">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm">{error}</div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <input required placeholder="First name" value={form.PeopleFirstName} onChange={set('PeopleFirstName')} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm" />
                <input required placeholder="Last name" value={form.PeopleLastName} onChange={set('PeopleLastName')} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm" />
                <input required type="email" placeholder="Email" value={form.Email} onChange={set('Email')} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm" />
                <input required type="password" placeholder="Password" value={form.Password} onChange={set('Password')} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm" />
                <button type="submit" disabled={loading} className="w-full bg-[#819360] hover:bg-[#4d734d] text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-50">
                  {loading ? 'Creating…' : t('auth.create_account', 'Create Account')}
                </button>
              </form>
              <p className="text-center text-sm text-gray-600 mt-6 mb-0">
                Already have an account?{' '}
                <Link to="/login" className="text-[#819360] font-semibold">Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
