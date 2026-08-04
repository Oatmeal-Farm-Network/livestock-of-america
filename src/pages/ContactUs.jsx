import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';

const CREAM = '#f7f2e8';
const OLIVE = '#3d6b34';
const RUST = '#8b3a2b';
const INK = '#2c2c2c';
const MUTED = '#6b6b6b';

const CONTACT_RECIPIENT_EMAIL =
  import.meta.env.VITE_CONTACT_EMAIL || import.meta.env.VITE_CONTACT_RECIPIENT_EMAIL || 'livestockoftheworld@gmail.com';

const TOPICS = [
  { value: 'general', label: 'General question' },
  { value: 'listing', label: 'Get listed in the directory' },
  { value: 'marketplace', label: 'Marketplace / buying & selling' },
  { value: 'events', label: 'Events & registrations' },
  { value: 'ai', label: 'AI advisors & tools' },
  { value: 'support', label: 'Account or technical support' },
  { value: 'partnership', label: 'Partnerships & press' },
];

const newQuestion = () => {
  const left = Math.floor(Math.random() * 9) + 1;
  const right = Math.floor(Math.random() * 9) + 1;
  return { left, right, answer: left + right };
};

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ContactUs() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [captcha, setCaptcha] = useState(() => newQuestion());
  const [formData, setFormData] = useState({
    FName: '',
    LName: '',
    BizName: '',
    Email: '',
    Topic: 'general',
    CommentText: '',
    fieldX: '',
    shoesize: '',
  });

  useEffect(() => {
    const email = localStorage.getItem('email') || localStorage.getItem('user_email') || '';
    const first = localStorage.getItem('first_name') || '';
    const last = localStorage.getItem('last_name') || '';
    if (email || first || last) {
      setFormData((prev) => ({
        ...prev,
        Email: prev.Email || email,
        FName: prev.FName || first,
        LName: prev.LName || last,
      }));
    }
  }, []);

  const topicLabel = useMemo(
    () => TOPICS.find((tpc) => tpc.value === formData.Topic)?.label || 'General question',
    [formData.Topic]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    setError('');
  };

  const validate = () => {
    const next = {};
    if (!formData.FName.trim()) next.FName = 'First name is required.';
    if (!formData.LName.trim()) next.LName = 'Last name is required.';
    if (!formData.Email.trim()) next.Email = 'Email is required.';
    else if (!isValidEmail(formData.Email.trim())) next.Email = 'Enter a valid email address.';
    if (!formData.CommentText.trim()) next.CommentText = 'Please tell us how we can help.';
    else if (formData.CommentText.trim().length < 10) {
      next.CommentText = 'Please add a bit more detail (at least 10 characters).';
    }
    if (!formData.fieldX.trim()) next.fieldX = 'Answer the verification question.';
    else if (Number(formData.fieldX) !== captcha.answer) {
      next.fieldX = 'That answer is incorrect.';
    }
    setFieldErrors(next);
    return next;
  };

  const focusFirstError = (errors) => {
    const order = ['FName', 'LName', 'Email', 'CommentText', 'fieldX'];
    const first = order.find((key) => errors[key]);
    if (!first) return;
    requestAnimationFrame(() => {
      const el = document.getElementById(first);
      if (el) {
        el.focus({ preventScroll: true });
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  };

  const refreshCaptcha = () => {
    setCaptcha(newQuestion());
    setFormData((prev) => ({ ...prev, fieldX: '' }));
    setFieldErrors((prev) => ({ ...prev, fieldX: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (formData.shoesize.trim().length > 0) {
      setError('Submission blocked.');
      return;
    }

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      if (Number(formData.fieldX) !== captcha.answer && formData.fieldX.trim()) {
        setCaptcha(newQuestion());
        setFormData((prev) => ({ ...prev, fieldX: '' }));
      }
      focusFirstError(errors);
      return;
    }

    try {
      setLoading(true);
      const payload = {
        FName: formData.FName.trim(),
        LName: formData.LName.trim(),
        BizName: formData.BizName.trim(),
        Email: formData.Email.trim(),
        Topic: topicLabel,
        CommentText: formData.CommentText.trim(),
      };

      const postData = new FormData();
      postData.append('_subject', `[LOA Contact] ${payload.Topic}: ${payload.FName} ${payload.LName}`);
      postData.append('_captcha', 'false');
      postData.append('_template', 'table');
      postData.append('First Name', payload.FName);
      postData.append('Last Name', payload.LName);
      postData.append('Organization / Farm Name', payload.BizName || 'N/A');
      postData.append('Email', payload.Email);
      postData.append('Topic', payload.Topic);
      postData.append('Message', payload.CommentText);

      const response = await fetch(`https://formsubmit.co/ajax/${CONTACT_RECIPIENT_EMAIL}`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: postData,
      });

      let result = {};
      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (!response.ok || (result.success !== 'true' && result.success !== true)) {
        throw new Error(result.message || 'Unable to send message at this time. Please try again.');
      }

      navigate('/contact-us/confirm', {
        state: {
          submittedAt: new Date().toISOString(),
          payload,
        },
      });
    } catch (submitError) {
      setError(submitError?.message || 'Unable to send message at this time. Please try again.');
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full rounded-xl border bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3d6b34]/30 focus:border-[#3d6b34]';
  const fieldBorder = (name) =>
    fieldErrors[name] ? 'border-[#c45c4a]' : 'border-black/10';
  const labelCls = 'block text-sm font-semibold mb-1.5';
  const errCls = 'mt-1 text-xs font-medium';

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ background: CREAM }}>
      <PageMeta
        title="Contact Us | Livestock of America by Oatmeal AI"
        description="Get in touch with the Livestock of America by Oatmeal AI team. We're here to help with questions about your farm listing, marketplace, or platform features."
        keywords="contact livestock of america, oatmeal ai, support, farm platform help, get listed, farm directory contact"
        canonical="https://livestockofamerica.com/contact-us"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          name: 'Contact Livestock of America by Oatmeal AI',
          url: 'https://livestockofamerica.com/contact-us',
        }}
      />
      <Header />

      <main className="grow w-full max-w-[1100px] mx-auto px-4 md:px-6 py-6 md:py-8">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Contact Us' }]} />

        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl min-h-[220px] md:min-h-[280px] flex items-end mb-8">
          <img
            src="/images/ContactHeroFarm.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(105deg, rgba(20,20,20,0.72) 0%, rgba(20,20,20,0.4) 55%, rgba(20,20,20,0.15) 100%)',
            }}
            aria-hidden
          />
          <div className="relative z-[1] p-6 md:p-10 max-w-2xl">
            <p
              className="text-[10px] font-bold tracking-[0.16em] uppercase mb-2"
              style={{ color: 'rgba(255,255,255,0.85)' }}
            >
              We&apos;re here to help
            </p>
            <h1
              className="text-3xl md:text-4xl font-bold leading-tight mb-3"
              style={{ fontFamily: "'Lora', 'Times New Roman', serif", color: '#ffffff' }}
            >
              {t('contact.title', 'Contact Livestock of America by Oatmeal AI')}
            </h1>
            <p className="text-sm md:text-[0.95rem] leading-relaxed" style={{ color: 'rgba(255,255,255,0.92)' }}>
              {t(
                'contact.subtitle',
                'Have questions about Livestock of America by Oatmeal AI or our AI advisors? Send a note and our team will get back to you shortly.'
              )}
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-6 lg:gap-8 items-start">
          {/* Side info */}
          <aside className="space-y-4">
            <div className="rounded-2xl bg-white border border-black/5 p-5 shadow-sm">
              <h2
                className="text-lg font-bold mb-3"
                style={{ fontFamily: "'Lora', 'Times New Roman', serif", color: OLIVE }}
              >
                Reach us
              </h2>
              <ul className="space-y-3 text-sm" style={{ color: MUTED }}>
                <li>
                  <div className="font-semibold mb-0.5" style={{ color: INK }}>
                    Email
                  </div>
                  <a
                    href={`mailto:${CONTACT_RECIPIENT_EMAIL}`}
                    className="hover:underline"
                    style={{ color: OLIVE }}
                  >
                    {CONTACT_RECIPIENT_EMAIL}
                  </a>
                </li>
                <li>
                  <div className="font-semibold mb-0.5" style={{ color: INK }}>
                    Response time
                  </div>
                  Usually within 1–2 business days
                </li>
                <li>
                  <div className="font-semibold mb-0.5" style={{ color: INK }}>
                    Best for
                  </div>
                  Listings, marketplace, events, AI advisors, and account help
                </li>
              </ul>
            </div>

            <div
              className="rounded-2xl p-5 text-white"
              style={{ background: OLIVE }}
            >
              <h3
                className="text-base font-bold mb-2"
                style={{ fontFamily: "'Lora', 'Times New Roman', serif" }}
              >
                Prefer self-serve?
              </h3>
              <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.88)' }}>
                Browse the marketplace or knowledgebase while you wait.
              </p>
              <div className="flex flex-col gap-2">
                <Link
                  to="/directory"
                  className="text-center text-sm font-bold rounded-lg py-2.5 no-underline hover:opacity-95"
                  style={{ background: '#fff', color: OLIVE }}
                >
                  Browse Directory
                </Link>
                <Link
                  to="/livestock"
                  className="text-center text-sm font-bold rounded-lg py-2.5 no-underline hover:bg-white/10"
                  style={{ border: '1.5px solid rgba(255,255,255,0.7)', color: '#fff' }}
                >
                  Livestock Knowledgebase
                </Link>
              </div>
            </div>
          </aside>

          {/* Form */}
          <section className="rounded-2xl bg-white border border-black/5 p-5 md:p-8 shadow-sm">
            <h2
              className="text-xl md:text-2xl font-bold mb-1"
              style={{ fontFamily: "'Lora', 'Times New Roman', serif", color: INK }}
            >
              Send a message
            </h2>
            <p className="text-sm mb-6" style={{ color: MUTED }}>
              Fields marked with * are required.
            </p>

            {error && (
              <div
                className="mb-5 rounded-xl border px-4 py-3 text-sm"
                style={{ borderColor: '#f5c2c0', background: '#fef2f2', color: '#b91c1c' }}
                role="alert"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls} style={{ color: INK }} htmlFor="FName">
                    First name *
                  </label>
                  <input
                    id="FName"
                    type="text"
                    name="FName"
                    value={formData.FName}
                    onChange={handleChange}
                    autoComplete="given-name"
                    className={`${inputCls} ${fieldBorder('FName')}`}
                    aria-invalid={!!fieldErrors.FName}
                    aria-describedby={fieldErrors.FName ? 'FName-error' : undefined}
                  />
                  {fieldErrors.FName && (
                    <p id="FName-error" className={errCls} style={{ color: RUST }}>
                      {fieldErrors.FName}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelCls} style={{ color: INK }} htmlFor="LName">
                    Last name *
                  </label>
                  <input
                    id="LName"
                    type="text"
                    name="LName"
                    value={formData.LName}
                    onChange={handleChange}
                    autoComplete="family-name"
                    className={`${inputCls} ${fieldBorder('LName')}`}
                    aria-invalid={!!fieldErrors.LName}
                    aria-describedby={fieldErrors.LName ? 'LName-error' : undefined}
                  />
                  {fieldErrors.LName && (
                    <p id="LName-error" className={errCls} style={{ color: RUST }}>
                      {fieldErrors.LName}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className={labelCls} style={{ color: INK }} htmlFor="Email">
                  Email *
                </label>
                <input
                  id="Email"
                  type="email"
                  name="Email"
                  value={formData.Email}
                  onChange={handleChange}
                  autoComplete="email"
                  className={`${inputCls} ${fieldBorder('Email')}`}
                  aria-invalid={!!fieldErrors.Email}
                  aria-describedby={fieldErrors.Email ? 'Email-error' : undefined}
                />
                {fieldErrors.Email && (
                  <p id="Email-error" className={errCls} style={{ color: RUST }}>
                    {fieldErrors.Email}
                  </p>
                )}
              </div>

              <div>
                <label className={labelCls} style={{ color: INK }} htmlFor="BizName">
                  Organization / farm name{' '}
                  <span className="font-normal" style={{ color: MUTED }}>
                    (optional)
                  </span>
                </label>
                <input
                  id="BizName"
                  type="text"
                  name="BizName"
                  value={formData.BizName}
                  onChange={handleChange}
                  placeholder="e.g. Sunny Valley Farm"
                  autoComplete="organization"
                  className={`${inputCls} border-black/10`}
                />
              </div>

              <div>
                <label className={labelCls} style={{ color: INK }} htmlFor="Topic">
                  What is this about? *
                </label>
                <select
                  id="Topic"
                  name="Topic"
                  value={formData.Topic}
                  onChange={handleChange}
                  className={`${inputCls} border-black/10`}
                >
                  {TOPICS.map((tpc) => (
                    <option key={tpc.value} value={tpc.value}>
                      {tpc.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls} style={{ color: INK }} htmlFor="CommentText">
                  How can we help? *
                </label>
                <textarea
                  id="CommentText"
                  name="CommentText"
                  value={formData.CommentText}
                  onChange={handleChange}
                  placeholder="Tell us about your farm, listing, event, or question…"
                  rows={5}
                  className={`${inputCls} ${fieldBorder('CommentText')} resize-y min-h-[120px]`}
                  aria-invalid={!!fieldErrors.CommentText}
                  aria-describedby={fieldErrors.CommentText ? 'CommentText-error' : undefined}
                />
                {fieldErrors.CommentText && (
                  <p id="CommentText-error" className={errCls} style={{ color: RUST }}>
                    {fieldErrors.CommentText}
                  </p>
                )}
              </div>

              <div
                className="rounded-xl p-4 md:p-5"
                style={{ background: '#f0ece4' }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="text-sm font-bold" style={{ color: INK }}>
                      Quick verification
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                      Helps keep spam out of our inbox.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    className="text-xs font-bold underline shrink-0"
                    style={{ color: OLIVE }}
                  >
                    New question
                  </button>
                </div>
                <label className={labelCls} style={{ color: INK }} htmlFor="fieldX">
                  What is {captcha.left} + {captcha.right}? *
                </label>
                <input
                  id="fieldX"
                  type="text"
                  name="fieldX"
                  inputMode="numeric"
                  value={formData.fieldX}
                  onChange={handleChange}
                  className={`${inputCls} ${fieldBorder('fieldX')} w-28`}
                  aria-invalid={!!fieldErrors.fieldX}
                  aria-describedby={fieldErrors.fieldX ? 'fieldX-error' : undefined}
                  autoComplete="off"
                />
                {fieldErrors.fieldX && (
                  <p id="fieldX-error" className={errCls} style={{ color: RUST }}>
                    {fieldErrors.fieldX}
                  </p>
                )}
              </div>

              {/* Honeypot */}
              <input
                type="text"
                name="shoesize"
                value={formData.shoesize}
                onChange={handleChange}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="hidden"
              />

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                <p className="text-xs" style={{ color: MUTED }}>
                  By sending, you agree we may reply to the email you provide.
                </p>
                <button
                  type="submit"
                  disabled={loading}
                  className="shrink-0 rounded-xl px-8 py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: OLIVE }}
                >
                  {loading ? t('contact.sending', 'Sending...') : t('contact.send_btn', 'Send Message')}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
