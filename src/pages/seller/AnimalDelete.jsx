// src/pages/seller/AnimalDelete.jsx
// Confirm-and-delete an animal — /seller/animals/delete?BusinessID=&AnimalID=
// Ported from OatmealFarmNetwork's AnimalDelete.jsx.
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router';
import { useTranslation } from '../../lib/i18n';
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

export default function AnimalDelete() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const BusinessID = searchParams.get('BusinessID');
  const AnimalID = searchParams.get('AnimalID');
  const navigate = useNavigate();

  const [animal, setAnimal] = useState(null);
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = getToken();
  const animalsHref = `/seller/animals${BusinessID ? `?BusinessID=${BusinessID}` : ''}`;

  useEffect(() => {
    if (!AnimalID) {
      setLoading(false);
      return;
    }
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;
    Promise.all([
      fetch(endpoints.animal(AnimalID), { headers: authHeaders }).then((r) =>
        r.ok ? r.json() : null,
      ),
      fetch(endpoints.animalPhotos(AnimalID), { headers: authHeaders })
        .then((r) => (r.ok ? r.json() : {}))
        .catch(() => ({})),
    ])
      .then(([a, photos]) => {
        setAnimal(a);
        setCoverPhoto(photos?.list_page_image || null);
        setLoading(false);
      })
      .catch(() => {
        setError(t('animal_delete.err_load', 'Could not load this animal.'));
        setLoading(false);
      });
  }, [AnimalID, token]);

  const handleDelete = async () => {
    if (!confirmed) {
      setError(t('animal_delete.err_confirm_required', 'Tick the box to confirm before deleting.'));
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(endpoints.animal(AnimalID), {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (res.ok) {
        navigate(animalsHref, {
          state: { deleted: animal?.FullName || t('animal_delete.animal_fallback', 'the animal') },
        });
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || t('animal_delete.err_generic', 'Could not delete this animal.'));
      }
    } catch {
      setError(t('animal_delete.err_generic', 'Could not delete this animal.'));
    }
    setDeleting(false);
  };

  if (!AnimalID) {
    return (
      <div className="min-h-screen font-sans flex flex-col" style={{ background: CREAM }}>
        <PageMeta title="Delete Animal" noIndex />
        <Header />
        <main className="grow w-full max-w-[700px] mx-auto px-4 md:px-6 py-10 text-center">
          <p style={{ color: MUTED }}>
            {t('animal_delete.not_found', "This animal couldn't be found.")}
          </p>
          <Link to={animalsHref} className="inline-block mt-4 font-semibold" style={{ color: OLIVE }}>
            {t('seller_animals.title', 'My Animals')}
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ background: CREAM }}>
      <PageMeta title="Delete Animal | Livestock of America" noIndex />
      <Header />

      <main className="grow w-full max-w-[700px] mx-auto px-4 md:px-6 py-6 md:py-8">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'Dashboard', to: '/account' },
            { label: t('seller_animals.title', 'My Animals'), to: animalsHref },
            { label: t('animal_delete.page_title', 'Delete Animal') },
          ]}
        />

        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-5 md:p-6">
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: LORA, color: INK }}>
            {t('animal_delete.heading', 'Delete this animal?')}
          </h1>
          <p className="text-sm mb-5" style={{ color: MUTED }}>
            {t('animal_delete.subtitle', 'Removing an animal takes it off the marketplace for good.')}
          </p>

          {loading ? (
            <p className="text-sm" style={{ color: MUTED }}>
              {t('animal_delete.loading', 'Loading…')}
            </p>
          ) : (
            <>
              {animal && (
                <div
                  className="rounded-xl p-4 mb-5 flex gap-4 items-start"
                  style={{ background: '#fff8f6', border: '1px solid rgba(139,58,43,0.25)' }}
                >
                  {coverPhoto && (
                    <img
                      src={coverPhoto}
                      alt={animal.FullName || ''}
                      className="w-[120px] h-[120px] object-cover rounded-lg shrink-0"
                      style={{ border: '1px solid rgba(139,58,43,0.2)' }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-lg mb-0.5" style={{ color: INK }}>
                      {animal.FullName || t('animal_delete.unnamed', 'Unnamed animal')}
                    </div>
                    {animal.SpeciesName && (
                      <div className="text-xs mb-2" style={{ color: MUTED }}>
                        {animal.SpeciesName}
                      </div>
                    )}
                    {animal.Description ? (
                      <div
                        className="text-xs leading-relaxed max-h-[120px] overflow-hidden"
                        style={{
                          color: INK,
                          maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                          WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                        }}
                        dangerouslySetInnerHTML={{ __html: animal.Description }}
                      />
                    ) : (
                      <div className="text-xs italic" style={{ color: MUTED }}>
                        {t('animal_delete.no_description', 'No description on file.')}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <p className="text-sm mb-5 leading-relaxed" style={{ color: INK }}>
                {t(
                  'animal_delete.warning_body',
                  'This removes the animal, its photos and its listing history.',
                )}{' '}
                <strong>{t('animal_delete.cannot_undo', 'This cannot be undone.')}</strong>
              </p>

              <label className="flex items-center gap-2.5 mb-5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => {
                    setConfirmed(e.target.checked);
                    setError(null);
                  }}
                  className="w-4 h-4 shrink-0 cursor-pointer"
                />
                <span className="text-sm font-semibold" style={{ color: INK }}>
                  {t('animal_delete.confirm_label', 'Yes, permanently delete this animal.')}
                </span>
              </label>

              {error && (
                <div className="text-sm font-semibold mb-4" style={{ color: RUST }}>
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-6 py-2.5 rounded-lg font-bold text-sm text-white"
                  style={{
                    background: RUST,
                    opacity: deleting ? 0.6 : 1,
                    cursor: deleting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {deleting
                    ? t('animal_delete.btn_deleting', 'Deleting…')
                    : t('animal_delete.btn_delete', 'Delete animal')}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(animalsHref)}
                  disabled={deleting}
                  className="px-5 py-2.5 rounded-lg font-semibold text-sm"
                  style={{ background: '#f2ebe3', color: INK, border: '1px solid rgba(0,0,0,0.12)' }}
                >
                  {t('animal_delete.btn_cancel', 'Cancel')}
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
