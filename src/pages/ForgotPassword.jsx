import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import { endpoints } from '../config/api';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(endpoints.forgotPassword(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Email: email }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.detail || 'Request failed');
        return;
      }
      setSent(true);
    } catch {
      setError(t('auth.server_error', 'Unable to reach the server. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-sans flex flex-col">
      <PageMeta title="Forgot Password | Livestock of America" noIndex />
      <Header />
      <section className="py-16 px-4 flex-1">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden">
            <div className="bg-[#819360] px-8 py-8 text-center">
              <img src="/images/loa-header-logo.webp" alt="Livestock of America" className="h-12 mx-auto mb-4 w-auto" />
              <h1 className="text-white text-2xl font-bold m-0" style={{ fontFamily: "'Lora', serif" }}>
                {t('forgot.title', 'Forgot Password')}
              </h1>
              <p className="text-white/80 text-sm mt-1">{t('forgot.subtitle', 'We will email reset instructions')}</p>
            </div>
            <div className="px-8 py-8">
              {sent ? (
                <div className="text-center space-y-4">
                  <p className="text-sm text-gray-600">
                    If an account exists for <strong>{email}</strong>, reset instructions were sent.
                  </p>
                  <Link to="/login" className="inline-block bg-[#819360] text-white font-bold py-2.5 px-6 rounded-xl text-sm">
                    {t('forgot.go_to_login', 'Go to Login')}
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
                  )}
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm"
                  />
                  <button type="submit" disabled={loading} className="w-full bg-[#819360] text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-50">
                    {loading ? 'Sending…' : 'Send Reset Link'}
                  </button>
                  <p className="text-center text-sm mb-0">
                    <Link to="/login" className="text-[#819360] font-semibold">Back to login</Link>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
