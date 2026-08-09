// Ported from Oatmeal Farm Network (src/AccountNew.jsx), with the Cassia chat
// step replaced by a subscription picker driven by SubscriptionPackage.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from '../lib/i18n';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';

const API_URL      = import.meta.env.VITE_LIVESTOCK_API_URL || '';
// Over The Fence is an Oatmeal Farm Network integration with no counterpart
// on the LOA backend. Its one call site is inside try/catch, so leaving this
// unset simply makes it inert. Set VITE_OTF_API_URL to enable.
const OTF_API      = import.meta.env.VITE_OTF_API_URL || '';
const FORM_MAX_WIDTH = '860px';

const C = {
  sage:       '#4A5C43',
  sageBg:     '#EEF1EC',
  sageBorder: '#C8D5C2',
  text:       '#111827',
  textSec:    '#6b7280',
  border:     '#e5e7eb',
  green:      '#16a34a',
  red:        '#dc2626',
};

// ── OTF community auto-creation ───────────────────────────────────────────────
async function createOTFCommunity(businessId, businessName, knownPeopleId) {
  try {
    const token    = localStorage.getItem('access_token') || '';
    const peopleId = String(
      knownPeopleId ||
      localStorage.getItem('people_id') ||
      localStorage.getItem('PeopleID') ||
      new URLSearchParams(window.location.search).get('PeopleID') ||
      '0'
    );
    if (!peopleId || peopleId === '0') return;
    await fetch(`${OTF_API}/api/admin/mill/communities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'x-people-id': peopleId },
      body: JSON.stringify({
        name: `${businessName || 'My Org'} — Over The Fence`,
        linkedBusinessId: businessId,
        isPublic: false,
        iconEmoji: '🌾',
      }),
    });
  } catch {}
}

// ── Main component ────────────────────────────────────────────────────────────
// ── SubscriptionStep (step 2 — plans for the chosen business type) ───────────
/**
 * Subscription options read from the SubscriptionPackage table, the same source
 * as the admin subscriptions screen. `business_type_id` filters server-side.
 *
 * Packages with a NULL BusinessTypeID are treated as unassigned rather than
 * universal: showing "Food Aggregator" to a ranch would be noise. Tag a package
 * with a business type for it to appear here.
 */
function SubscriptionStep({ businessTypeId, onBack, onSelect }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    if (!businessTypeId) return;
    setLoading(true);
    fetch(`${API_URL}/api/platform-subscriptions/packages?business_type_id=${businessTypeId}`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(d => {
        const list = Array.isArray(d?.packages) ? d.packages : [];
        setPackages(list.filter(p => String(p.BusinessTypeID) === String(businessTypeId)));
      })
      .catch(() => setError('Could not load subscription options. Please try again.'))
      .finally(() => setLoading(false));
  }, [businessTypeId]);

  const money = (n) => `$${Number(n).toFixed(2)}`;

  return (
    <div>
      <h3 className="text-lg font-bold mb-1" style={{ color: C.text }}>Choose your plan</h3>
      <p className="text-sm text-gray-500 mb-5">
        Plans available for the account type you selected.
      </p>

      {loading && <p className="text-sm text-gray-500 py-6">Loading plans…</p>}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>
      )}
      {!loading && !error && packages.length === 0 && (
        <div className="border border-gray-200 rounded-xl px-4 py-6 text-sm text-gray-500 mb-4">
          No subscription plans are configured for this account type yet.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {packages.map(p => (
          <div key={p.PackageID} className="border border-gray-200 rounded-xl p-5 flex flex-col bg-white">
            <h4 className="m-0 mb-1 text-base font-bold" style={{ color: C.text }}>{p.PackageName}</h4>
            <p className="m-0 mb-3 text-sm font-semibold" style={{ color: C.sage }}>
              {Number(p.MonthlyPrice) > 0
                ? <>{money(p.MonthlyPrice)}<span className="font-normal text-gray-500"> / month</span></>
                : <span style={{ color: C.green }}>Free</span>}
              {Number(p.YearlyPrice) > 0 && (
                <span className="font-normal text-gray-500"> · {money(p.YearlyPrice)} / year</span>
              )}
            </p>
            {p.Description && (
              <div className="text-sm text-gray-600 leading-relaxed mb-3 grow"
                dangerouslySetInnerHTML={{ __html: p.Description }} />
            )}

            {/* A null allowance means unlimited, so only capped plans list one. */}
            {[['Livestock for sale', p.MaxForSaleListings],
              ['Stud listings',      p.MaxStudListings],
              ['Directory listings', p.MaxDirectoryListings]]
              .filter(([, n]) => n !== null && n !== undefined).length > 0 && (
              <ul className="text-sm text-gray-600 mb-4 space-y-1 list-none p-0">
                {[['Livestock for sale', p.MaxForSaleListings],
                  ['Stud listings',      p.MaxStudListings],
                  ['Directory listings', p.MaxDirectoryListings]]
                  .filter(([, n]) => n !== null && n !== undefined)
                  .map(([lbl, n]) => (
                    <li key={lbl}>
                      <span style={{ color: n === 0 ? '#b91c1c' : C.sage }} className="font-semibold">
                        {n === 0 ? 'Not included' : `Up to ${n}`}
                      </span>{n === 0 ? ' — ' : ' '}{lbl.toLowerCase()}
                    </li>
                  ))}
              </ul>
            )}
            <button type="button" onClick={() => onSelect(p)} className="regsubmit2 mt-auto">
              Select {p.PackageName}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <button onClick={onBack}
          className="border border-gray-300 rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
          ← Back
        </button>
      </div>
    </div>
  );
}

// ── CheckoutPanel (step 3 — review the plan and pick a billing cycle) ────────
function CheckoutPanel({ data, onBack, onContinue }) {
  const monthly = Number(data?.monthly || 0);
  const yearly  = Number(data?.yearly || 0);
  const paid    = monthly > 0 || yearly > 0;
  const money   = (n) => `$${Number(n).toFixed(2)}`;

  // Default to whichever cycle the plan actually offers.
  const [cycle, setCycle] = useState(monthly > 0 ? 'monthly' : 'yearly');

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">
        {paid
          ? 'Review your plan and choose how you would like to be billed.'
          : 'Review your plan before finishing setup.'}
      </p>

      <div style={{ background: '#fff', border: `1px solid ${C.sageBorder}`, borderRadius: 12, padding: '1.25rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: C.sage,
          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          Selected plan
        </div>
        <h3 className="m-0 mb-2 text-lg font-bold" style={{ color: C.text }}>{data.tier}</h3>

        {paid ? (
          <div className="flex flex-wrap gap-4 mb-3">
            {monthly > 0 && (
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="cycle" checked={cycle === 'monthly'}
                  onChange={() => setCycle('monthly')} />
                {money(monthly)} / month
              </label>
            )}
            {yearly > 0 && (
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="cycle" checked={cycle === 'yearly'}
                  onChange={() => setCycle('yearly')} />
                {money(yearly)} / year
              </label>
            )}
          </div>
        ) : (
          <p className="m-0 mb-3 text-sm font-semibold" style={{ color: C.green }}>Free</p>
        )}

        {data.description && (
          <div className="text-sm text-gray-600 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: data.description }} />
        )}
      </div>

      <div className="flex justify-between items-center">
        <button onClick={onBack}
          className="border border-gray-300 rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
          ← Back
        </button>
        <button onClick={() => onContinue(cycle)} className="regsubmit2">
          {paid ? 'Continue to payment' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

// ── PaymentStep (step 4) ─────────────────────────────────────────────────────
/**
 * Free plans are granted straight away through /assign-package -- there is
 * nothing to charge, so the step exists only to say so and finish.
 *
 * Paid plans go out to Stripe Checkout. The card is never handled here: the
 * backend creates a Checkout Session and this redirects to Stripe's hosted
 * page, so no card data touches Livestock of America. Stripe returns the member
 * to this same URL with ?paid=1, and the subscription is confirmed by the
 * checkout.session.completed webhook rather than by that redirect, which a
 * member could otherwise fabricate by editing the address bar.
 */
function PaymentStep({ data, businessId, peopleId, cycle, onBack }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState('');
  const [clientSecret, setClientSecret] = useState(null);

  const amount = Number(cycle === 'yearly' ? data?.yearly : data?.monthly) || 0;
  const paid   = amount > 0;
  const money  = (n) => `$${Number(n).toFixed(2)}`;
  const token  = () => localStorage.getItem('access_token') || localStorage.getItem('AccessToken') || '';

  const finishFree = async () => {
    setBusy(true); setErr('');
    try {
      const res = await fetch(`${API_URL}/api/platform-subscriptions/assign-package/${businessId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ package_id: data.packageId, billing_cycle: cycle }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || 'Could not activate your plan. Please try again.');
      }
      clearProgress(peopleId);
      navigate(`/account?PeopleID=${peopleId}&BusinessID=${businessId}&subscribed=1`);
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  // Stripe.js is loaded once per publishable key. The key comes from the server
  // rather than a build-time variable so it always matches the mode the backend
  // is transacting in — a live key against a test session simply fails.
  const [stripePromise, setStripePromise] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const beginPayment = async () => {
    setBusy(true); setErr('');
    try {
      const res = await fetch(`${API_URL}/api/platform-subscriptions/package-checkout/${businessId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          package_id: data.packageId,
          billing_cycle: cycle,
          return_url: `${window.location.origin}/accounts/new`,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.client_secret) {
        throw new Error(body.detail || 'Could not start checkout. Please try again.');
      }
      if (!body.publishable_key) {
        throw new Error('Stripe is missing a publishable key. Ask an admin to add one.');
      }
      setStripePromise(loadStripe(body.publishable_key));
      setClientSecret(body.client_secret);
      setShowForm(true);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (showForm && clientSecret && stripePromise) {
    return (
      <div className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h3 className="m-0 text-lg font-bold" style={{ color: C.text }}>{data.tier}</h3>
          <span className="text-sm font-semibold" style={{ color: C.text }}>
            {money(amount)} / {cycle === 'yearly' ? 'year' : 'month'}
          </span>
        </div>

        {/* Stripe renders the card fields inside this iframe. The member stays
            on livestockofamerica.com and the card never reaches our server. */}
        <div style={{ border: `1px solid ${C.sageBorder}`, borderRadius: 12, overflow: 'hidden' }}>
          <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>

        <button
          onClick={() => { setShowForm(false); setClientSecret(null); }}
          className="border border-gray-300 rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div style={{ background: '#fff', border: `1px solid ${C.sageBorder}`, borderRadius: 12, padding: '1.25rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: C.sage,
          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          {paid ? 'Amount due today' : 'No payment required'}
        </div>
        <h3 className="m-0 mb-1 text-lg font-bold" style={{ color: C.text }}>{data.tier}</h3>
        {paid ? (
          <>
            <p className="m-0 text-2xl font-bold" style={{ color: C.text }}>
              {money(amount)}
              <span className="text-sm font-normal text-gray-500">
                {' '}/ {cycle === 'yearly' ? 'year' : 'month'}
              </span>
            </p>
            <p className="mt-3 mb-0 text-sm text-gray-500">
              Payment is processed securely by Stripe without leaving this page.
              Your card details go directly to Stripe and are never stored on our
              servers.
            </p>
          </>
        ) : (
          <>
            <p className="m-0 text-2xl font-bold" style={{ color: C.green }}>Free</p>
            <p className="mt-3 mb-0 text-sm text-gray-500">
              This plan costs nothing, so there is no payment to make. Finish setup
              and your account is ready to use.
            </p>
          </>
        )}
      </div>

      {err && <div className="bg-red-50 border border-red-300 text-red-700 rounded px-4 py-3 text-sm">{err}</div>}

      <div className="flex justify-between items-center">
        <button onClick={onBack} disabled={busy}
          className="border border-gray-300 rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
          ← Back
        </button>
        <button onClick={paid ? beginPayment : finishFree} disabled={busy} className="regsubmit2">
          {busy
            ? (paid ? 'Preparing payment…' : 'Finishing…')
            : (paid ? `Pay ${money(amount)}` : 'Finish setup')}
        </button>
      </div>
    </div>
  );
}

const DEFAULT_FORM = {
  BusinessTypeID:           '',
  BusinessName:             '',
  BusinessWebsite:          '',
  AddressStreet:            '',
  AddressApt:               '',
  AddressCity:              '',
  country:                  '',
  StateIndex:               '',
  AddressZip:               '',
  PeoplePhone:              '',
  Permission:               true,
  LivestockLegalDisclaimer: false,
  SalesLegalDisclaimer:     false,
};

// ── Wizard progress persistence ───────────────────────────────────────────────
/**
 * Step 1 creates the Business row, so a refresh on step 2 or 3 must not drop the
 * member back to a form that would create a second one. Progress is kept in
 * sessionStorage (per tab, cleared when the tab closes) keyed by PeopleID, so
 * two people setting up accounts on one machine never inherit each other's
 * half-finished wizard.
 */
const progressKey = (peopleId) => `loa_account_new_${peopleId || 'anon'}`;

function loadProgress(peopleId) {
  try {
    const raw = sessionStorage.getItem(progressKey(peopleId));
    if (!raw) return null;
    const saved = JSON.parse(raw);
    // Step 2 needs the business to exist; step 3 also needs a chosen package.
    // Anything inconsistent falls back rather than rendering a broken step.
    if (!saved.businessId) return null;
    if (saved.step === 3 && !saved.checkoutData) return { ...saved, step: 2 };
    return saved;
  } catch {
    return null;
  }
}

function saveProgress(peopleId, data) {
  try {
    sessionStorage.setItem(progressKey(peopleId), JSON.stringify(data));
  } catch { /* private browsing / quota — the wizard still works, just not across refreshes */ }
}

function clearProgress(peopleId) {
  try { sessionStorage.removeItem(progressKey(peopleId)); } catch { /* nothing to clean up */ }
}

export default function AccountNew() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const peopleId = localStorage.getItem('people_id') ||
                   localStorage.getItem('PeopleID') ||
                   new URLSearchParams(window.location.search).get('PeopleID');

  // Read once, lazily, so a refresh renders the restored step immediately
  // instead of flashing step 1 before an effect corrects it.
  const [restored] = useState(() => loadProgress(peopleId));

  const [step,              setStep]              = useState(restored?.step ?? 1);
  // LOA takes ranch and association accounts only for now. The label here also
  // overrides the database name, which is how "Farm / Ranch" shows as "Ranch"
  // without renaming a lookup row Oatmeal Farm Network also reads.
  const ENABLED_BUSINESS_TYPES = { 8: 'Ranch', 1: 'Agricultural Association' };
  // Exact strings /api/businesses/countries returns — the US is stored as 'USA'.
  const ENABLED_COUNTRIES = ['USA', 'Canada', 'Greenland'];

  const [businessTypes,     setBusinessTypes]     = useState([]);
  const [countries,         setCountries]         = useState([]);
  const [states,            setStates]            = useState([]);
  const [errors,            setErrors]            = useState({});
  const [submitting,        setSubmitting]        = useState(false);
  const [createdBusinessId, setCreatedBusinessId] = useState(restored?.businessId ?? null);
  const [checkoutData,      setCheckoutData]      = useState(restored?.checkoutData ?? null);
  const [billingCycle,      setBillingCycle]      = useState(restored?.billingCycle ?? 'monthly');

  const [form, setForm] = useState({
    ...DEFAULT_FORM,
    ...(restored?.form ?? {}),
    // Never restored: accepting the legal disclaimers is a deliberate act the
    // member has to repeat, not something a page refresh re-asserts for them.
    LivestockLegalDisclaimer: false,
    SalesLegalDisclaimer:     false,
  });

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { navigate('/login'); return; }

    fetch(`${API_URL}/api/businesses/types`)
      .then(r => r.json())
      .then(data => setBusinessTypes(Array.isArray(data) ? data : []))
      .catch(() => {});

    fetch(`${API_URL}/api/businesses/countries`)
      .then(r => r.json())
      .then(data => {
        const list = (Array.isArray(data) ? data : [])
          .filter(c => ENABLED_COUNTRIES.includes(c));
        setCountries(list);
        const us = list.find(c => c === 'USA' || c === 'United States');
        if (us) setForm(f => ({ ...f, country: us }));
      })
      .catch(() => {});
  }, [navigate]);

  useEffect(() => {
    if (!form.country) return;
    setStates([]);
    fetch(`${API_URL}/api/businesses/states?country=${encodeURIComponent(form.country)}`)
      .then(r => r.json())
      .then(data => setStates(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [form.country]);

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const validateStep1 = () => {
    const e = {};
    if (!form.BusinessTypeID) e.BusinessTypeID = t('account_new.err_type');
    else if (!ENABLED_BUSINESS_TYPES[form.BusinessTypeID]) {
      e.BusinessTypeID = 'That account type is not available yet. Choose Ranch or Agricultural Association.';
    }
    if (form.country && !ENABLED_COUNTRIES.includes(form.country)) {
      e.country = 'Accounts are currently limited to the USA, Canada, and Greenland.';
    }
    if (!form.StateIndex)     e.StateIndex     = t('account_new.err_state');
    if (String(form.BusinessTypeID) === '8') {
      if (!form.LivestockLegalDisclaimer) e.LivestockLegalDisclaimer = t('account_new.err_livestock_disclaimer');
      if (!form.SalesLegalDisclaimer)     e.SalesLegalDisclaimer     = t('account_new.err_sales_disclaimer');
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Stripe sends the member back here with ?session_id= once the embedded form
  // completes. Confirm against the API rather than trusting the URL, then finish.
  const [returned, setReturned] = useState(null);
  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get('session_id');
    if (!sessionId) return;
    (async () => {
      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('AccessToken') || '';
        const res = await fetch(
          `${API_URL}/api/platform-subscriptions/checkout-session/${sessionId}`,
          { headers: { Authorization: `Bearer ${token}` } });
        const body = await res.json().catch(() => ({}));
        if (res.ok && body.status === 'complete') {
          setReturned({ ok: true, packageName: body.package_name });
          clearProgress(peopleId);
        } else {
          // Session still open or expired: leave the wizard where it was so the
          // member can try again rather than being told something went wrong.
          setReturned({ ok: false });
        }
      } catch {
        setReturned({ ok: false });
      }
    })();
  }, [peopleId]);

  // Only worth persisting once the Business exists — before that a refresh has
  // nothing to resume and step 1 is the correct place to land.
  useEffect(() => {
    if (!createdBusinessId) return;
    saveProgress(peopleId, { step, businessId: createdBusinessId, checkoutData, billingCycle, form });
  }, [step, createdBusinessId, checkoutData, billingCycle, form, peopleId]);

  const handleCreateAccount = async () => {
    // The business is already created, so this is a return trip through step 1
    // rather than a submission; the disclaimers were accepted the first time and
    // re-validating would strand the member on a form that no longer saves.
    if (createdBusinessId) { setStep(2); return; }
    if (!validateStep1()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/businesses/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        body: JSON.stringify({ ...form, PeopleID: peopleId }),
      });
      const data = await res.json();
      if (res.ok) {
        setCreatedBusinessId(data.BusinessID);
        createOTFCommunity(data.BusinessID, form.BusinessName || '', peopleId);
        setStep(2);
      } else {
        setErrors({ submit: data.detail || t('account_new.err_generic') });
      }
    } catch {
      setErrors({ submit: t('account_new.err_generic') });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#819360]';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
  const errorClass = 'text-red-600 text-xs mt-1';

  const STEP_LABELS = ['Your Details', 'Choose Your Plan', 'Confirm', 'Payment'];

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <PageMeta
        title="Add an Account | Oatmeal Farm Network"
        description="Create a new farm, ranch, or business account on Oatmeal Farm Network."
        noIndex
      />
      <Header />

      <style>{`
        }
      `}</style>

      <div style={{ maxWidth: FORM_MAX_WIDTH, margin: '2rem auto', padding: '0 1rem 3rem' }}>
        <Breadcrumbs items={[
          { label: t('nav.home'), to: '/' },
          { label: t('accounts.heading'), to: '/accounts' },
          { label: t('account_new.breadcrumb') },
        ]} />

        <div className="bg-white rounded-xl shadow border border-gray-100 p-8">

          <h1 className="text-2xl font-bold text-gray-800 mb-2">{STEP_LABELS[step - 1]}</h1>

          {/* 3-step progress indicator */}
          <div className="flex items-center gap-2 mb-7">
            {[1, 2, 3].map((n, i) => (
              <React.Fragment key={n}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  ${step > n ? 'bg-[#4A5C43] text-white' : step === n ? 'bg-[#4A5C43] text-white ring-4 ring-[#C8D5C2]' : 'bg-gray-200 text-gray-500'}`}>
                  {step > n ? '✓' : n}
                </div>
                {i < 2 && <div className={`flex-1 h-1 rounded ${step > n ? 'bg-[#4A5C43]' : 'bg-gray-200'}`} />}
              </React.Fragment>
            ))}
          </div>

          {/* ── STEP 1: account details ──────────────────────────────────────── */}
          {returned?.ok && (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">✓</div>
              <h2 className="text-xl font-bold mb-2" style={{ color: C.text }}>Payment received</h2>
              <p className="text-sm text-gray-500 mb-6">
                {returned.packageName ? `${returned.packageName} is being activated.` : 'Your plan is being activated.'}
                {' '}A receipt is on its way by email.
              </p>
              <button
                onClick={() => navigate(`/account?PeopleID=${peopleId}&BusinessID=${createdBusinessId || ''}`)}
                className="regsubmit2">
                Go to my account
              </button>
            </div>
          )}

          {!returned?.ok && step === 1 && (
            <div className="space-y-5">

              <div>
                <label className={labelClass}>{t('account_new.label_type')}</label>
                <select value={form.BusinessTypeID} onChange={e => update('BusinessTypeID', e.target.value)} className={inputClass}>
                  <option value="">{t('account_new.select_type')}</option>
                  {businessTypes
                    .filter(b => ENABLED_BUSINESS_TYPES[b.BusinessTypeID])
                    .map(b => (
                      <option key={b.BusinessTypeID} value={b.BusinessTypeID}>
                        {ENABLED_BUSINESS_TYPES[b.BusinessTypeID]}
                      </option>
                    ))}
                </select>
                {errors.BusinessTypeID && <p className={errorClass}>{errors.BusinessTypeID}</p>}
              </div>

              <div>
                <label className={labelClass}>
                  {t('account_new.label_name')} <span className="text-gray-400 font-normal">({t('account_new.optional')})</span>
                </label>
                <input type="text" value={form.BusinessName} onChange={e => update('BusinessName', e.target.value)}
                  className={inputClass} placeholder={t('account_new.placeholder_name')} />
              </div>

              <div>
                <label className={labelClass}>
                  {t('account_new.label_website')} <span className="text-gray-400 font-normal">({t('account_new.optional')})</span>
                </label>
                <input type="text" value={form.BusinessWebsite} onChange={e => update('BusinessWebsite', e.target.value)}
                  className={inputClass} placeholder="https://yourwebsite.com" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    {t('account_new.label_street')} <span className="text-gray-400 font-normal">({t('account_new.optional')})</span>
                  </label>
                  <input type="text" value={form.AddressStreet} onChange={e => update('AddressStreet', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>
                    {t('account_new.label_apt')} <span className="text-gray-400 font-normal">({t('account_new.optional')})</span>
                  </label>
                  <input type="text" value={form.AddressApt} onChange={e => update('AddressApt', e.target.value)} className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    {t('account_new.label_city')} <span className="text-gray-400 font-normal">({t('account_new.optional')})</span>
                  </label>
                  <input type="text" value={form.AddressCity} onChange={e => update('AddressCity', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>
                    {t('account_new.label_zip')} <span className="text-gray-400 font-normal">({t('account_new.optional')})</span>
                  </label>
                  <input type="text" value={form.AddressZip} onChange={e => update('AddressZip', e.target.value)} className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{t('account_new.label_country')}</label>
                  <select value={form.country} onChange={e => {
                    setForm(f => ({ ...f, country: e.target.value, StateIndex: '' }));
                  }} className={inputClass}>
                    <option value="">{t('account_new.select_country')}</option>
                    {countries.map((c, i) => <option key={i} value={c}>{c}</option>)}
                  </select>
                  {errors.country && <p className={errorClass}>{errors.country}</p>}
                </div>
                <div>
                  <label className={labelClass}>{t('account_new.label_state')}</label>
                  <select value={form.StateIndex} onChange={e => update('StateIndex', e.target.value)}
                    className={inputClass} disabled={!form.country}>
                    <option value="">{form.country ? t('account_new.select_state') : t('account_new.select_country_first')}</option>
                    {states.map(s => <option key={s.StateIndex} value={s.StateIndex}>{s.name}</option>)}
                  </select>
                  {errors.StateIndex && <p className={errorClass}>{errors.StateIndex}</p>}
                </div>
              </div>

              <div>
                <label className={labelClass}>{t('account_new.label_phone')} <span className="text-gray-400 font-normal">(optional)</span></label>
                <input type="text" value={form.PeoplePhone}
                  onChange={e => update('PeoplePhone', e.target.value.replace(/[^0-9()-.\s]/g, ''))}
                  className={inputClass} placeholder="(555) 555-5555" />
                {errors.PeoplePhone && <p className={errorClass}>{errors.PeoplePhone}</p>}
              </div>

              {/* ── Permissions / disclaimers ─────────────────────────────── */}
              <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.Permission} onChange={e => update('Permission', e.target.checked)} className="mt-1" />
                {t('account_new.permission_text')}
              </label>

              {String(form.BusinessTypeID) === '8' && (
                <>
                  <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={form.LivestockLegalDisclaimer}
                      onChange={e => update('LivestockLegalDisclaimer', e.target.checked)} className="mt-1" />
                    <span><strong>{t('account_new.livestock_disclaimer_title')}</strong> {t('account_new.livestock_disclaimer_body')}</span>
                  </label>
                  {errors.LivestockLegalDisclaimer && <p className={errorClass}>{errors.LivestockLegalDisclaimer}</p>}

                  <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={form.SalesLegalDisclaimer}
                      onChange={e => update('SalesLegalDisclaimer', e.target.checked)} className="mt-1" />
                    <span><strong>{t('account_new.sales_disclaimer_title')}</strong> {t('account_new.sales_disclaimer_body')}</span>
                  </label>
                  {errors.SalesLegalDisclaimer && <p className={errorClass}>{errors.SalesLegalDisclaimer}</p>}
                </>
              )}

              {errors.submit && (
                <div className="bg-red-50 border border-red-300 text-red-700 rounded px-4 py-3 text-sm">
                  {errors.submit}
                </div>
              )}

              <div className="flex justify-end gap-3 mt-2">
                <button onClick={handleCreateAccount} disabled={submitting} className="regsubmit2">
                  {submitting ? t('account_new.btn_creating') : 'Next'}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: choose a subscription plan ───────────────────────────── */}
          {!returned?.ok && step === 2 && (
            <SubscriptionStep
              businessTypeId={form.BusinessTypeID}
              onBack={() => setStep(1)}
              onSelect={(pkg) => {
                setCheckoutData({
                  tier: pkg.PackageName,
                  packageId: pkg.PackageID,
                  monthly: pkg.MonthlyPrice,
                  yearly: pkg.YearlyPrice,
                  description: pkg.Description,
                });
                setStep(3);
              }}
            />
          )}

          {/* ── STEP 3: checkout ─────────────────────────────────────────────── */}
          {!returned?.ok && step === 3 && checkoutData && (
            <CheckoutPanel
              data={checkoutData}
              onBack={() => setStep(2)}
              onContinue={(cycle) => { setBillingCycle(cycle); setStep(4); }}
            />
          )}

          {!returned?.ok && (step === 3 || step === 4) && !checkoutData && (
            <div className="text-center py-8 text-gray-500 text-sm">
              No plan selected yet.{' '}
              <button onClick={() => setStep(2)} className="text-[#4A5C43] underline">Go back to plans</button>
            </div>
          )}

          {/* ── STEP 4: payment ──────────────────────────────────────────────── */}
          {!returned?.ok && step === 4 && checkoutData && (
            <PaymentStep
              data={checkoutData}
              businessId={createdBusinessId}
              peopleId={peopleId}
              cycle={billingCycle}
              onBack={() => setStep(3)}
            />
          )}

        </div>
      </div>

      <Footer />
    </div>
  );
}
