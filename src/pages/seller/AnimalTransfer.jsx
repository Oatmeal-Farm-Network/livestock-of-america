// src/pages/seller/AnimalTransfer.jsx
// Move an animal to another business you hold — /seller/animals/transfer
// With no AnimalID this is a chooser; with one it is the confirm step.
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from '../../lib/i18n';
import { useAccount } from '../../lib/AccountContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import Breadcrumbs from '../../components/Breadcrumbs';
import { endpoints } from '../../config/api';
import { getToken } from '../../lib/auth';

const CREAM = '#f7f2e8';
const OLIVE = '#3d6b34';
const RUST = '#8b3a2b';
const INK = '#2c2c2c';
const MUTED = '#6b6b6b';
const LORA = "'Lora', 'Times New Roman', serif";

const bizId = (b) => b?.BusinessID ?? b?.businessId ?? b?.id ?? null;

export default function AnimalTransfer() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const BusinessID = searchParams.get('BusinessID');
  const AnimalID = searchParams.get('AnimalID');
  const navigate = useNavigate();
  const { businesses = [] } = useAccount() || {};

  const [animal, setAnimal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [destination, setDestination] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [done, setDone] = useState(null);

  const [herd, setHerd] = useState([]);
  const [herdLoading, setHerdLoading] = useState(false);
  const [herdQuery, setHerdQuery] = useState('');

  const token = getToken();
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;
  const animalsHref = `/seller/animals${BusinessID ? `?BusinessID=${BusinessID}` : ''}`;

  // Chooser mode — load the herd so they can pick which animal to move.
  useEffect(() => {
    if (AnimalID || !BusinessID) return;
    setHerdLoading(true);
    fetch(endpoints.authAnimals(BusinessID), { headers: authHeaders })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setHerd(Array.isArray(d) ? d : []))
      .catch(() => setHerd([]))
      .finally(() => setHerdLoading(false));
  }, [AnimalID, BusinessID, token]);

  // Confirm mode — load the one animal.
  useEffect(() => {
    if (!AnimalID) {
      setLoading(false);
      return;
    }
    fetch(endpoints.animal(AnimalID), { headers: authHeaders })
      .then((r) => (r.ok ? r.json() : null))
      .then((a) => {
        setAnimal(a);
        setLoading(false);
      })
      .catch(() => {
        setError(t('animal_transfer.err_load', 'Could not load this animal.'));
        setLoading(false);
      });
  }, [AnimalID, token]);

  // Anywhere but where it already lives.
  const targets = businesses.filter((b) => String(bizId(b)) !== String(BusinessID));

  const handleTransfer = async () => {
    if (!destination) {
      setError(t('animal_transfer.err_pick_destination', 'Choose where this animal is going.'));
      return;
    }
    setTransferring(true);
    setError(null);
    try {
      const res = await fetch(endpoints.animalTransfer(AnimalID), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(authHeaders || {}) },
        body: JSON.stringify({ ToBusinessID: Number(destination) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || t('animal_transfer.err_generic', 'Could not transfer this animal.'));
      setDone(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setTransferring(false);
    }
  };

  const shell = (children) => (
    <div className="min-h-screen font-sans flex flex-col" style={{ background: CREAM }}>
      <PageMeta title="Transfer Animal | Livestock of America" noIndex />
      <Header />
      <main className="grow w-full max-w-[700px] mx-auto px-4 md:px-6 py-6 md:py-8">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'Dashboard', to: '/account' },
            { label: t('seller_animals.title', 'My Animals'), to: animalsHref },
            { label: t('animal_transfer.page_title', 'Transfer Animal') },
          ]}
        />
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-5 md:p-6">{children}</div>
      </main>
      <Footer />
    </div>
  );

  // ── Chooser view ────────────────────────────────────────────────────────
  if (!AnimalID) {
    const q = herdQuery.trim().toLowerCase();
    const shown = q
      ? herd.filter(
          (a) =>
            (a.FullName || '').toLowerCase().includes(q) ||
            (a.Category || '').toLowerCase().includes(q) ||
            (a.SpeciesName || '').toLowerCase().includes(q),
        )
      : herd;

    return shell(
      <>
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: LORA, color: INK }}>
          {t('animal_transfer.pick_heading', 'Transfer an animal')}
        </h1>
        <p className="text-sm mb-5" style={{ color: MUTED }}>
          {t('animal_transfer.pick_subtitle', 'Move an animal to another business on your account. Choose which one to move.')}
        </p>

        {!BusinessID ? (
          <p className="text-sm" style={{ color: MUTED }}>
            {t('animal_transfer.pick_no_business', 'Choose a business to see its animals.')}
          </p>
        ) : herdLoading ? (
          <p className="text-sm" style={{ color: MUTED }}>{t('animal_transfer.loading', 'Loading…')}</p>
        ) : herd.length === 0 ? (
          <p className="text-sm" style={{ color: MUTED }}>
            {t('animal_transfer.pick_empty', 'This business has no animals on file.')}
          </p>
        ) : (
          <>
            {herd.length > 8 && (
              <input
                type="text"
                value={herdQuery}
                onChange={(e) => setHerdQuery(e.target.value)}
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none mb-3"
                style={{ borderColor: 'rgba(0,0,0,0.15)' }}
                placeholder={t('animal_transfer.pick_search', 'Search your animals…')}
              />
            )}
            <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.1)' }}>
              {shown.map((a) => (
                <div
                  key={a.AnimalID}
                  className="flex items-center justify-between gap-3 px-3 py-2.5"
                  style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate" style={{ color: INK }}>
                      {a.FullName || t('animal_transfer.unnamed', 'Unnamed animal')}
                    </div>
                    <div className="text-xs" style={{ color: MUTED }}>
                      {[a.SpeciesName, a.Category].filter(Boolean).join(' · ') || '—'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/seller/animals/transfer?BusinessID=${BusinessID}&AnimalID=${a.AnimalID}`)
                    }
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shrink-0"
                    style={{ background: OLIVE }}
                  >
                    {t('animal_transfer.btn_choose', 'Transfer…')}
                  </button>
                </div>
              ))}
              {shown.length === 0 && (
                <div className="px-3 py-3 text-sm" style={{ color: MUTED }}>
                  {t('animal_transfer.pick_no_match', 'No animals match that search.')}
                </div>
              )}
            </div>
          </>
        )}
      </>,
    );
  }

  // ── Done ────────────────────────────────────────────────────────────────
  if (done) {
    return shell(
      <>
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: LORA, color: INK }}>
          {t('animal_transfer.done_heading', 'Animal transferred')}
        </h1>
        <p className="text-sm mb-5" style={{ color: MUTED }}>
          {t('animal_transfer.done_body', '{name} now belongs to {business}.', {
            name: animal?.FullName || t('animal_transfer.unnamed', 'The animal'),
            business: done.ToBusinessName || t('animal_transfer.the_business', 'the new business'),
          })}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(`/seller/animals?BusinessID=${done.ToBusinessID}`)}
            className="px-5 py-2.5 rounded-lg font-semibold text-sm text-white"
            style={{ background: OLIVE }}
          >
            {t('animal_transfer.btn_view_there', 'View animals there')}
          </button>
          <button
            type="button"
            onClick={() => navigate(animalsHref)}
            className="px-5 py-2.5 rounded-lg font-semibold text-sm"
            style={{ background: '#f2ebe3', color: INK, border: '1px solid rgba(0,0,0,0.12)' }}
          >
            {t('seller_animals.title', 'My Animals')}
          </button>
        </div>
      </>,
    );
  }

  // ── Confirm view ────────────────────────────────────────────────────────
  return shell(
    <>
      <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: LORA, color: INK }}>
        {t('animal_transfer.heading', 'Transfer this animal')}
      </h1>
      <p className="text-sm mb-5" style={{ color: MUTED }}>
        {t('animal_transfer.subtitle', 'The animal keeps its records and photos; only the business it belongs to changes.')}
      </p>

      {loading ? (
        <p className="text-sm" style={{ color: MUTED }}>{t('animal_transfer.loading', 'Loading…')}</p>
      ) : (
        <>
          {animal && (
            <div className="rounded-xl p-4 mb-5" style={{ background: '#faf7f1', border: '1px solid rgba(0,0,0,0.08)' }}>
              <div className="font-bold text-lg" style={{ color: INK }}>
                {animal.FullName || t('animal_transfer.unnamed', 'Unnamed animal')}
              </div>
              {animal.SpeciesName && (
                <div className="text-xs mt-0.5" style={{ color: MUTED }}>{animal.SpeciesName}</div>
              )}
            </div>
          )}

          <label className="block text-sm font-semibold mb-1.5" style={{ color: INK }}>
            {t('animal_transfer.lbl_destination', 'Transfer to')}
          </label>
          {targets.length === 0 ? (
            <p className="text-sm mb-5" style={{ color: MUTED }}>
              {t('animal_transfer.no_targets', 'You only have one business, so there is nowhere to transfer this animal yet.')}
            </p>
          ) : (
            <select
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value);
                setError(null);
              }}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none mb-5"
              style={{ borderColor: 'rgba(0,0,0,0.15)' }}
            >
              <option value="">{t('animal_transfer.select_placeholder', 'Choose a business…')}</option>
              {targets.map((b) => (
                <option key={bizId(b)} value={bizId(b)}>
                  {b.BusinessName || `Business #${bizId(b)}`}
                </option>
              ))}
            </select>
          )}

          {error && (
            <div className="text-sm font-semibold mb-4" style={{ color: RUST }}>{error}</div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleTransfer}
              disabled={transferring || targets.length === 0}
              className="px-6 py-2.5 rounded-lg font-bold text-sm text-white"
              style={{
                background: OLIVE,
                opacity: transferring || targets.length === 0 ? 0.6 : 1,
                cursor: transferring || targets.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {transferring
                ? t('animal_transfer.btn_transferring', 'Transferring…')
                : t('animal_transfer.btn_transfer', 'Transfer animal')}
            </button>
            <button
              type="button"
              onClick={() => navigate(animalsHref)}
              disabled={transferring}
              className="px-5 py-2.5 rounded-lg font-semibold text-sm"
              style={{ background: '#f2ebe3', color: INK, border: '1px solid rgba(0,0,0,0.12)' }}
            >
              {t('animal_transfer.btn_cancel', 'Cancel')}
            </button>
          </div>
        </>
      )}
    </>,
  );
}
