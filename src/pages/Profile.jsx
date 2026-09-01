import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';
import { endpoints } from '../config/api';
import { getPeopleId, getToken, isLoggedIn } from '../lib/auth';

const CREAM = '#f7f2e8';
const OLIVE = '#3d6b34';
const INK = '#2c2c2c';
const MUTED = '#6b6b6b';
const LORA = "'Lora', 'Times New Roman', serif";
const BORDER = '#e0d8cc';

const emptyForm = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  current_password: '',
  new_password: '',
  confirm_password: '',
};

function Field({ label, children }) {
  return (
    <label className="block mb-4">
      <span className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: MUTED }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function ReadRow({ label, value }) {
  return (
    <div className="py-3 border-b last:border-b-0" style={{ borderColor: BORDER }}>
      <p className="m-0 text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: MUTED }}>
        {label}
      </p>
      <p className="m-0 text-sm break-words" style={{ color: INK, fontFamily: LORA }}>
        {value || '—'}
      </p>
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border px-3 py-2.5 text-sm bg-white outline-none focus:ring-2';
const inputStyle = { borderColor: BORDER, color: INK, fontFamily: LORA };

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profile, setProfile] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const authHeaders = useCallback(() => {
    const token = getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  const load = useCallback(async () => {
    if (!isLoggedIn()) {
      navigate('/login', { state: { from: { pathname: '/account/settings' } } });
      return;
    }

    setLoading(true);
    setError('');
    try {
      const meRes = await fetch(endpoints.me(), { headers: authHeaders() });
      if (meRes.status === 401) {
        navigate('/login', { state: { from: { pathname: '/account/settings' } } });
        return;
      }
      if (!meRes.ok) throw new Error('Could not load your profile.');
      const me = await meRes.json();
      setProfile(me);

      const peopleId = me.PeopleID || getPeopleId();
      if (peopleId) {
        const bizRes = await fetch(endpoints.myBusinesses(peopleId), { headers: authHeaders() });
        if (bizRes.ok) {
          const list = await bizRes.json();
          setBusinesses(Array.isArray(list) ? list : []);
        } else {
          setBusinesses([]);
        }
      }
    } catch (e) {
      setError(e.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, [authHeaders, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const startEdit = () => {
    if (!profile) return;
    setForm({
      first_name: profile.PeopleFirstName || '',
      last_name: profile.PeopleLastName || '',
      email: profile.PeopleEmail || '',
      phone: profile.PeoplePhone || '',
      current_password: '',
      new_password: '',
      confirm_password: '',
    });
    setError('');
    setSuccess('');
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setError('');
    setSuccess('');
    setForm(emptyForm);
  };

  const onChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.new_password || form.confirm_password || form.current_password) {
      if (!form.current_password) {
        setError('Enter your current password to change it.');
        return;
      }
      if (!form.new_password || form.new_password.length < 6) {
        setError('New password must be at least 6 characters.');
        return;
      }
      if (form.new_password !== form.confirm_password) {
        setError('New password and confirmation do not match.');
        return;
      }
    }

    setSaving(true);
    try {
      const body = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      };
      if (form.new_password) {
        body.current_password = form.current_password;
        body.new_password = form.new_password;
      }

      const res = await fetch(endpoints.updateLogin(), {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = data.detail;
        const msg = Array.isArray(detail)
          ? detail.map((d) => d.msg || JSON.stringify(d)).join(' ')
          : detail || data.message || 'Could not save profile.';
        throw new Error(msg);
      }

      const next = {
        ...profile,
        PeopleFirstName: data.PeopleFirstName ?? body.first_name,
        PeopleLastName: data.PeopleLastName ?? body.last_name,
        PeopleEmail: data.PeopleEmail ?? body.email,
        PeoplePhone: data.PeoplePhone ?? body.phone,
      };
      setProfile(next);
      if (next.PeopleFirstName) localStorage.setItem('first_name', next.PeopleFirstName);
      if (next.PeopleLastName) localStorage.setItem('last_name', next.PeopleLastName);
      setSuccess('Profile updated successfully.');
      setEditing(false);
      setForm(emptyForm);
    } catch (err) {
      setError(typeof err.message === 'string' ? err.message : 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const fullName = profile
    ? [profile.PeopleFirstName, profile.PeopleLastName].filter(Boolean).join(' ')
    : '';

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: CREAM }}>
      <PageMeta title="Profile | Livestock Of America" noIndex />
      <Header />

      <div className="flex-1 w-full max-w-[900px] mx-auto px-4 md:px-6 py-6 md:py-8">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', to: '/account' },
            { label: 'Profile' },
          ]}
        />

        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <p className="m-0 mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: OLIVE }}>
              Account
            </p>
            <h1
              className="m-0 text-2xl md:text-3xl font-bold"
              style={{ fontFamily: LORA, color: INK }}
            >
              Profile
            </h1>
            <p className="m-0 mt-2 text-sm" style={{ color: MUTED }}>
              View and edit your personal details. Changes save to your Livestock of America account.
            </p>
          </div>
          {!loading && profile && !editing && (
            <button
              type="button"
              onClick={startEdit}
              className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white border-0 cursor-pointer"
              style={{ backgroundColor: OLIVE }}
            >
              Edit profile
            </button>
          )}
        </div>

        {error && (
          <div
            className="mb-4 rounded-lg px-4 py-3 text-sm"
            style={{ background: '#f8e8e4', color: '#8b3a2b', border: '1px solid #e8cfc8' }}
          >
            {error}
          </div>
        )}
        {success && (
          <div
            className="mb-4 rounded-lg px-4 py-3 text-sm"
            style={{ background: '#eef3e7', color: OLIVE, border: `1px solid ${BORDER}` }}
          >
            {success}
          </div>
        )}

        {loading ? (
          <p className="text-sm" style={{ color: MUTED }}>
            Loading profile…
          </p>
        ) : !profile ? (
          <p className="text-sm" style={{ color: MUTED }}>
            Unable to load profile.
          </p>
        ) : (
          <div className="space-y-6">
            <section
              className="rounded-xl bg-white px-5 py-5 md:px-6 md:py-6"
              style={{ border: `1px solid ${BORDER}` }}
            >
              <h2 className="m-0 mb-4 text-lg font-bold" style={{ fontFamily: LORA, color: INK }}>
                Personal details
              </h2>

              {editing ? (
                <form onSubmit={save}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                    <Field label="First name">
                      <input
                        className={inputCls}
                        style={inputStyle}
                        value={form.first_name}
                        onChange={onChange('first_name')}
                        required
                        autoComplete="given-name"
                      />
                    </Field>
                    <Field label="Last name">
                      <input
                        className={inputCls}
                        style={inputStyle}
                        value={form.last_name}
                        onChange={onChange('last_name')}
                        required
                        autoComplete="family-name"
                      />
                    </Field>
                  </div>
                  <Field label="Email">
                    <input
                      type="email"
                      className={inputCls}
                      style={inputStyle}
                      value={form.email}
                      onChange={onChange('email')}
                      required
                      autoComplete="email"
                    />
                  </Field>
                  <Field label="Phone number">
                    <input
                      type="tel"
                      className={inputCls}
                      style={inputStyle}
                      value={form.phone}
                      onChange={onChange('phone')}
                      autoComplete="tel"
                      placeholder="Optional"
                    />
                  </Field>

                  <div
                    className="mt-2 mb-4 rounded-lg px-4 py-4"
                    style={{ background: '#f7f2e8', border: `1px solid ${BORDER}` }}
                  >
                    <p className="m-0 mb-3 text-sm font-semibold" style={{ color: INK, fontFamily: LORA }}>
                      Change password
                    </p>
                    <p className="m-0 mb-3 text-xs" style={{ color: MUTED }}>
                      Leave blank to keep your current password.
                    </p>
                    <Field label="Current password">
                      <input
                        type="password"
                        className={inputCls}
                        style={inputStyle}
                        value={form.current_password}
                        onChange={onChange('current_password')}
                        autoComplete="current-password"
                      />
                    </Field>
                    <Field label="New password">
                      <input
                        type="password"
                        className={inputCls}
                        style={inputStyle}
                        value={form.new_password}
                        onChange={onChange('new_password')}
                        autoComplete="new-password"
                      />
                    </Field>
                    <Field label="Confirm new password">
                      <input
                        type="password"
                        className={inputCls}
                        style={inputStyle}
                        value={form.confirm_password}
                        onChange={onChange('confirm_password')}
                        autoComplete="new-password"
                      />
                    </Field>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white border-0 cursor-pointer disabled:opacity-60"
                      style={{ backgroundColor: OLIVE }}
                    >
                      {saving ? 'Saving…' : 'Save changes'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={saving}
                      className="rounded-lg px-5 py-2.5 text-sm font-semibold border cursor-pointer bg-white"
                      style={{ color: INK, borderColor: BORDER }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <ReadRow label="Full name" value={fullName} />
                  <ReadRow label="Email" value={profile.PeopleEmail} />
                  <ReadRow label="Phone number" value={profile.PeoplePhone} />
                  <ReadRow label="Customer ID" value={profile.PeopleID != null ? String(profile.PeopleID) : ''} />
                  <ReadRow label="Password" value="••••••••" />
                </div>
              )}
            </section>

            <section
              className="rounded-xl bg-white px-5 py-5 md:px-6 md:py-6"
              style={{ border: `1px solid ${BORDER}` }}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
                <h2 className="m-0 text-lg font-bold" style={{ fontFamily: LORA, color: INK }}>
                  Businesses
                </h2>
                <p className="m-0 text-sm" style={{ color: MUTED }}>
                  {businesses.length} {businesses.length === 1 ? 'business' : 'businesses'}
                </p>
              </div>

              {businesses.length === 0 ? (
                <div>
                  <p className="m-0 mb-4 text-sm" style={{ color: MUTED }}>
                    You don&apos;t have any businesses yet.
                  </p>
                  <Link
                    to="/accounts/new"
                    className="inline-flex rounded-lg px-5 py-2.5 text-sm font-semibold text-white no-underline"
                    style={{ backgroundColor: OLIVE }}
                  >
                    Add a business
                  </Link>
                </div>
              ) : (
                <ul className="m-0 p-0 list-none divide-y" style={{ borderColor: BORDER }}>
                  {businesses.map((b) => {
                    const id = b.BusinessID ?? b.businessId ?? b.id;
                    const name = b.BusinessName || b.business_name || 'Untitled business';
                    const loc = [b.AddressCity, b.AddressState].filter(Boolean).join(', ');
                    const type = b.BusinessType || '';
                    return (
                      <li
                        key={id}
                        className="py-4 first:pt-0 last:pb-0 flex flex-wrap items-center justify-between gap-3"
                        style={{ borderColor: BORDER }}
                      >
                        <div className="min-w-0">
                          <p className="m-0 font-semibold text-sm" style={{ color: INK, fontFamily: LORA }}>
                            {name}
                          </p>
                          <p className="m-0 mt-1 text-xs" style={{ color: MUTED }}>
                            ID {id}
                            {type ? ` · ${type}` : ''}
                            {loc ? ` · ${loc}` : ''}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 shrink-0">
                          <Link
                            to={`/account/profile?BusinessID=${id}`}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold no-underline border bg-white"
                            style={{ color: INK, borderColor: BORDER }}
                          >
                            Edit business
                          </Link>
                          <Link
                            to={`/herd-health?BusinessID=${id}`}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold no-underline text-white"
                            style={{ backgroundColor: OLIVE }}
                          >
                            Herd Health
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
