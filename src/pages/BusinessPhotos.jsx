// Photo gallery for a business — /account/photos. What is uploaded here is what
// appears in the Photos tab of the business's public directory listing.
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from '../lib/i18n';
import AccountLayout from '../components/AccountLayout';
import { useBusinessId } from '../lib/useBusinessId';

const API_URL = import.meta.env.VITE_LIVESTOCK_API_URL || '';

const MAX_PHOTOS = 12;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export default function BusinessPhotos() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { businessId, resolving } = useBusinessId();

  const [photos, setPhotos] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const token = () => localStorage.getItem('access_token');

  useEffect(() => {
    if (!token()) { navigate('/login'); return; }
    if (resolving) return;
    if (!businessId) { setPhotos([]); return; }
    fetch(`${API_URL}/api/businesses/${businessId}/photos`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(d => setPhotos(Array.isArray(d) ? d : []))
      .catch(() => { setPhotos([]); setError(t('business_photos.err_load')); });
  }, [businessId, resolving]);

  const rejectReason = (file) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return t('business_photos.err_type');
    if (file.size > MAX_IMAGE_BYTES) return t('business_photos.err_size');
    return null;
  };

  // Uploaded one at a time rather than in parallel: SortOrder is assigned from
  // the current maximum, so concurrent inserts would race for the same slot.
  const uploadMany = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length || !businessId) return;
    const room = MAX_PHOTOS - (photos?.length || 0);
    if (room <= 0) { setError(t('business_photos.err_full', { max: MAX_PHOTOS })); return; }

    const taking = files.slice(0, room);
    setError(files.length > taking.length
      ? t('business_photos.err_no_room', { skipped: files.length - taking.length, free: room })
      : null);

    setUploading(true);
    for (const file of taking) {
      const bad = rejectReason(file);
      if (bad) { setError(bad); continue; }
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch(`${API_URL}/api/businesses/${businessId}/photos/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token()}` },
          body: fd,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.detail || t('business_photos.err_upload'));
        setPhotos(ps => [...(ps || []), data]);
      } catch (e) {
        setError(e.message || t('business_photos.err_upload'));
      }
    }
    setUploading(false);
  };

  const setCaption = (id, val) =>
    setPhotos(ps => ps.map(p => (p.BusinessPhotoID === id ? { ...p, Caption: val } : p)));

  const saveCaption = async (photo) => {
    setSavingId(photo.BusinessPhotoID);
    setError(null);
    try {
      const res = await fetch(
        `${API_URL}/api/businesses/${businessId}/photos/${photo.BusinessPhotoID}/caption`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ caption: photo.Caption || '' }),
        });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      setError(t('business_photos.err_caption'));
    }
    setSavingId(null);
  };

  const removePhoto = async (photo) => {
    if (!window.confirm(t('business_photos.confirm_delete'))) return;
    setError(null);
    try {
      const res = await fetch(
        `${API_URL}/api/businesses/${businessId}/photos/${photo.BusinessPhotoID}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token()}` },
        });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setPhotos(ps => ps.filter(p => p.BusinessPhotoID !== photo.BusinessPhotoID));
    } catch {
      setError(t('business_photos.err_delete'));
    }
  };

  const move = async (photo, delta) => {
    const list = [...photos];
    const i = list.findIndex(p => p.BusinessPhotoID === photo.BusinessPhotoID);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    setPhotos(list);
    try {
      const res = await fetch(`${API_URL}/api/businesses/${businessId}/photos/reorder`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: list.map(p => p.BusinessPhotoID) }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      setError(t('business_photos.err_reorder'));
    }
  };

  const used = photos ? photos.length : 0;
  const full = used >= MAX_PHOTOS;

  const dropzone = {
    onDragEnter: e => { e.preventDefault(); setDragging(true); },
    onDragOver: e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setDragging(true); },
    onDragLeave: e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false); },
    onDrop: e => { e.preventDefault(); setDragging(false); uploadMany(e.dataTransfer.files); },
  };

  return (
    <AccountLayout
      pageTitle={t('business_photos.page_title')}
      breadcrumbs={[
        { label: t('business_photos.breadcrumb_dashboard'), to: '/dashboard' },
        { label: t('business_photos.page_title') },
      ]}
    >
      <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-green-700 mb-1">{t('business_photos.heading')}</h2>
        <p className="text-sm text-gray-500 mb-1">{t('business_photos.subtitle')}</p>
        <p className="text-xs mb-5" style={{ color: '#8b7355' }}>
          {t('business_photos.used', { used, max: MAX_PHOTOS })}
        </p>

        {!businessId && !resolving ? (
          <p className="text-gray-500 text-sm">{t('business_photos.no_business')}</p>
        ) : (
          <>
            <div
              {...dropzone}
              onClick={() => !full && inputRef.current?.click()}
              onKeyDown={e => {
                if (full) return;
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); }
              }}
              role="button"
              tabIndex={full ? -1 : 0}
              aria-label={t('business_photos.dropzone_aria')}
              style={{
                border: `2px dashed ${dragging ? '#3b82f6' : '#d9cbb8'}`,
                borderRadius: 12,
                padding: '24px 16px',
                textAlign: 'center',
                cursor: full ? 'not-allowed' : 'pointer',
                background: dragging ? '#eff6ff' : '#faf7f4',
                transition: 'all 0.15s',
                marginBottom: 20,
                opacity: full ? 0.6 : 1,
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }} aria-hidden="true">🖼</div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: dragging ? '#2563eb' : '#5a3e2b' }}>
                {full
                  ? t('business_photos.full', { max: MAX_PHOTOS })
                  : dragging
                    ? t('business_photos.drop_now')
                    : t('business_photos.dropzone')}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 11, color: '#8b7355' }}>
                {t('business_photos.dropzone_hint', { max: MAX_PHOTOS })}
              </p>
              {uploading && (
                <p style={{ margin: '6px 0 0', fontSize: 12, color: '#3b82f6' }}>
                  {t('business_photos.uploading')}
                </p>
              )}
              <input
                ref={inputRef}
                type="file"
                multiple
                accept={ACCEPTED_IMAGE_TYPES.join(',')}
                style={{ display: 'none' }}
                onChange={e => { uploadMany(e.target.files); e.target.value = ''; }}
              />
            </div>

            {error && <p className="text-sm mb-4" style={{ color: '#c0392b' }}>{error}</p>}

            {photos === null ? (
              <p className="text-gray-400 text-sm">{t('business_photos.loading')}</p>
            ) : photos.length === 0 ? (
              <p className="text-gray-500 text-sm">{t('business_photos.empty')}</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 18 }}>
                {photos.map((photo, i) => (
                  <div key={photo.BusinessPhotoID}
                    style={{ border: '1px solid #e8e0d5', borderRadius: 10, padding: 14, background: '#faf7f4' }}>
                    <img
                      src={photo.PhotoUrl}
                      alt={photo.Caption
                        ? t('business_photos.alt_captioned', { caption: photo.Caption })
                        : t('business_photos.alt', { n: i + 1 })}
                      style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 6, marginBottom: 10 }}
                    />

                    <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                      <input
                        value={photo.Caption || ''}
                        onChange={e => setCaption(photo.BusinessPhotoID, e.target.value)}
                        maxLength={256}
                        placeholder={t('business_photos.caption_placeholder')}
                        style={{ flex: 1, minWidth: 0, fontSize: 12, padding: '5px 8px',
                                 border: '1px solid #d9cbb8', borderRadius: 5 }}
                      />
                      <button
                        onClick={() => saveCaption(photo)}
                        disabled={savingId === photo.BusinessPhotoID}
                        style={{ background: '#5a3e2b', color: '#fff', border: 'none', borderRadius: 5,
                                 padding: '5px 10px', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        {savingId === photo.BusinessPhotoID
                          ? t('business_photos.btn_saving')
                          : t('business_photos.btn_save')}
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => move(photo, -1)} disabled={i === 0}
                        style={{ flex: 1, background: 'none', border: '1px solid #d9cbb8', borderRadius: 5,
                                 padding: '4px 0', fontSize: 12, cursor: i === 0 ? 'default' : 'pointer',
                                 opacity: i === 0 ? 0.4 : 1 }}>
                        {t('business_photos.btn_up')}
                      </button>
                      <button onClick={() => move(photo, 1)} disabled={i === photos.length - 1}
                        style={{ flex: 1, background: 'none', border: '1px solid #d9cbb8', borderRadius: 5,
                                 padding: '4px 0', fontSize: 12,
                                 cursor: i === photos.length - 1 ? 'default' : 'pointer',
                                 opacity: i === photos.length - 1 ? 0.4 : 1 }}>
                        {t('business_photos.btn_down')}
                      </button>
                      <button onClick={() => removePhoto(photo)}
                        style={{ flex: 1, background: 'none', border: '1px solid #e0b0b0', borderRadius: 5,
                                 padding: '4px 0', fontSize: 12, color: '#c0392b', cursor: 'pointer' }}>
                        {t('business_photos.btn_remove')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AccountLayout>
  );
}
