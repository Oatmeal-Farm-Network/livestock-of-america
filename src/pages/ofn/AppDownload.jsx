// Ported from Oatmeal Farm Network (src/AppDownload.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
// Public "Get the app" landing page. The Oatmeal Farm Network app is a PWA —
// there is no App Store / Play Store build — so this page detects the visitor's
// platform and either fires the native install prompt (Chrome/Edge/Android) or
// shows the manual "Add to Home Screen" steps (iOS/Safari).
//
// Route: /app  (alias: /download)
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';

const GREEN = '#14532d';
const GREEN_MID = '#3D6B34';
const CREAM = '#f7f7f2';

const isIOS = () =>
  typeof navigator !== 'undefined' &&
  /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

const isAndroid = () =>
  typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent);

const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true);

const FEATURES = [
  { icon: '🏠', title: 'Its own home-screen icon', body: 'Opens fullscreen like a native app — no browser bars.' },
  { icon: '⚡', title: 'Fast & always up to date', body: 'Loads instantly and updates itself. Nothing to re-download, ever.' },
  { icon: '📴', title: 'Works offline', body: 'Key screens and forms keep working with no signal; changes sync when you are back online.' },
  { icon: '🔔', title: 'Push notifications', body: 'Order updates, standing-order reminders and alerts land on your phone.' },
  { icon: '🛰️', title: 'Field & herd tools', body: 'Precision-ag maps, livestock records, marketplace and accounting in your pocket.' },
  { icon: '🔒', title: 'No app store needed', body: 'Installs straight from the web in a couple of taps. No account with Apple or Google required.' },
];

function StepList({ steps }) {
  return (
    <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {steps.map((s, i) => (
        <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{
            flexShrink: 0, width: 26, height: 26, borderRadius: '50%', background: GREEN,
            color: '#fff', fontWeight: 700, fontSize: 13, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>{i + 1}</span>
          <span style={{ fontSize: 15, lineHeight: 1.5, color: '#374151', paddingTop: 2 }}>{s}</span>
        </li>
      ))}
    </ol>
  );
}

export default function AppDownload() {
  const [deferred, setDeferred] = useState(
    typeof window !== 'undefined' ? window.deferredInstallPrompt || null : null
  );
  const [installed, setInstalled] = useState(isStandalone());
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);

    // The browser may fire beforeinstallprompt before this page mounts, so we
    // both read the globally-stashed event (see main.jsx) and listen for new
    // ones / the ready signal it dispatches.
    const onBefore = (e) => { e.preventDefault(); setDeferred(e); };
    const onReady = () => setDeferred(window.deferredInstallPrompt || null);
    const onInstalled = () => { setInstalled(true); setDeferred(null); window.deferredInstallPrompt = null; };

    window.addEventListener('beforeinstallprompt', onBefore);
    window.addEventListener('ofn:installready', onReady);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBefore);
      window.removeEventListener('ofn:installready', onReady);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferred) return;
    setInstalling(true);
    try {
      deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === 'accepted') setInstalled(true);
      setDeferred(null);
      window.deferredInstallPrompt = null;
    } catch { /* user dismissed */ }
    setInstalling(false);
  };

  const ios = isIOS();
  const android = isAndroid();
  const desktop = !ios && !android;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: CREAM, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <PageMeta
        title="Get the App | Livestock Of America"
        description="Install the Livestock Of America app on your phone or computer — no app store needed. Add it to your home screen in a couple of taps."
      />
      <Header />

      <main className="grow">
        {/* Hero */}
        <section style={{ background: `linear-gradient(160deg, ${GREEN} 0%, ${GREEN_MID} 100%)`, color: '#fff' }}>
          <div className="max-w-5xl mx-auto px-6 py-16 md:py-20 flex flex-col md:flex-row items-center gap-10">
            <div style={{ flex: 1 }}>
              <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: 999, padding: '5px 14px', fontSize: 13, fontWeight: 600, marginBottom: 18 }}>
                No app store required
              </div>
              <h1 style={{ fontSize: 'clamp(30px, 5vw, 46px)', fontWeight: 800, lineHeight: 1.1, margin: 0 }}>
                Get the Livestock Of America app
              </h1>
              <p style={{ fontSize: 18, lineHeight: 1.6, marginTop: 16, color: 'rgba(255,255,255,0.9)', maxWidth: 520 }}>
                Install it straight from the web — it lives on your home screen, opens
                fullscreen, works offline and updates itself. Your farm, marketplace and
                records, right in your pocket.
              </p>

              {/* Primary action */}
              <div style={{ marginTop: 26 }}>
                {installed ? (
                  <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '16px 18px', maxWidth: 460 }}>
                    <div style={{ fontWeight: 700, fontSize: 17 }}>✓ You're all set</div>
                    <div style={{ fontSize: 14, marginTop: 4, color: 'rgba(255,255,255,0.9)' }}>
                      Looks like the app is already installed on this device — open it from your home screen.
                    </div>
                  </div>
                ) : deferred ? (
                  <button
                    onClick={install}
                    disabled={installing}
                    style={{
                      background: '#fff', color: GREEN, border: 'none', borderRadius: 12,
                      padding: '15px 30px', fontSize: 17, fontWeight: 800, cursor: 'pointer',
                      boxShadow: '0 10px 24px rgba(0,0,0,0.2)', display: 'inline-flex', alignItems: 'center', gap: 10,
                    }}
                  >
                    <span style={{ fontSize: 20 }}>⬇️</span>
                    {installing ? 'Opening installer…' : 'Install the app'}
                  </button>
                ) : (
                  <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '14px 18px', maxWidth: 480, fontSize: 15 }}>
                    Follow the quick steps below for your device — it only takes a moment.
                  </div>
                )}
              </div>
            </div>

            {/* Phone mockup */}
            <div style={{ flexShrink: 0 }}>
              <div style={{
                width: 210, height: 420, borderRadius: 34, background: '#0b2a17',
                padding: 10, boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
              }}>
                <div style={{ width: '100%', height: '100%', borderRadius: 26, background: CREAM, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 20, textAlign: 'center' }}>
                  <img src="/images/OFNFavico.png" alt="Livestock Of America icon"
                    style={{ width: 84, height: 84, borderRadius: 20, boxShadow: '0 8px 20px rgba(0,0,0,0.15)' }}
                    onError={(e) => { e.target.style.display = 'none'; }} />
                  <div style={{ fontWeight: 800, color: GREEN, fontSize: 18 }}>Livestock Of America</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Tap to open · works offline</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Install instructions per platform */}
        <section className="max-w-5xl mx-auto px-6 py-14">
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111827', textAlign: 'center', marginBottom: 8 }}>
            How to install
          </h2>
          <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: 28, fontSize: 15 }}>
            {ios ? 'Steps for your iPhone or iPad.' : android ? 'Steps for your Android device.' : 'Steps for your device.'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {/* iOS */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 22, border: `1px solid #e5e7eb`, boxShadow: ios ? `0 0 0 2px ${GREEN_MID}` : 'none' }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: GREEN, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span></span> iPhone &amp; iPad {ios && <span style={{ fontSize: 12, background: '#dcfce7', color: GREEN, padding: '2px 8px', borderRadius: 999 }}>your device</span>}
              </div>
              <StepList steps={[
                'Open livestockofamerica.com in Safari.',
                'Tap the Share button (the square with an up-arrow).',
                'Scroll down and tap “Add to Home Screen”.',
                'Tap “Add” — the OFN icon appears on your home screen.',
              ]} />
            </div>

            {/* Android */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 22, border: `1px solid #e5e7eb`, boxShadow: android ? `0 0 0 2px ${GREEN_MID}` : 'none' }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: GREEN, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🤖</span> Android {android && <span style={{ fontSize: 12, background: '#dcfce7', color: GREEN, padding: '2px 8px', borderRadius: 999 }}>your device</span>}
              </div>
              <StepList steps={[
                'Open livestockofamerica.com in Chrome.',
                deferred ? 'Tap the “Install the app” button above.' : 'Tap the ⋮ menu (top-right).',
                deferred ? 'Confirm “Install” in the pop-up.' : 'Tap “Install app” / “Add to Home screen”.',
                'The OFN icon appears in your app drawer.',
              ]} />
            </div>

            {/* Desktop */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 22, border: `1px solid #e5e7eb`, boxShadow: desktop ? `0 0 0 2px ${GREEN_MID}` : 'none' }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: GREEN, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>💻</span> Computer {desktop && <span style={{ fontSize: 12, background: '#dcfce7', color: GREEN, padding: '2px 8px', borderRadius: 999 }}>your device</span>}
              </div>
              <StepList steps={[
                'Open livestockofamerica.com in Chrome or Edge.',
                deferred ? 'Click the “Install the app” button above.' : 'Click the install icon (⊕) in the address bar.',
                'Confirm “Install”.',
                'OFN opens in its own window and pins to your taskbar/dock.',
              ]} />
            </div>
          </div>
        </section>

        {/* Why install */}
        <section style={{ background: '#fff', borderTop: '1px solid #eee', borderBottom: '1px solid #eee' }}>
          <div className="max-w-5xl mx-auto px-6 py-14">
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111827', textAlign: 'center', marginBottom: 28 }}>
              Why install it
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 22 }}>
              {FEATURES.map((f) => (
                <div key={f.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 26, lineHeight: 1 }}>{f.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>{f.title}</div>
                    <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.5, marginTop: 3 }}>{f.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Closing */}
        <section className="max-w-3xl mx-auto px-6 py-14 text-center">
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>Not ready to install?</h2>
          <p style={{ color: '#6b7280', fontSize: 15, marginTop: 8, marginBottom: 22 }}>
            Everything works in your browser too — you can install the app any time.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/dashboard" style={{ background: GREEN, color: '#fff', borderRadius: 10, padding: '12px 24px', fontWeight: 700, textDecoration: 'none', fontSize: 15 }}>
              Open the web app
            </Link>
            <Link to="/signup" style={{ background: '#fff', color: GREEN, border: `1.5px solid ${GREEN}`, borderRadius: 10, padding: '12px 24px', fontWeight: 700, textDecoration: 'none', fontSize: 15 }}>
              Create an account
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
