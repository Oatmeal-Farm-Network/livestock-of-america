import React, { useEffect, useState } from 'react';

/**
 * True when the URL is the old "Missing Livestock Photo" stock image
 * (or otherwise not a real animal photo).
 */
export function isMissingLivestockPhoto(url) {
  if (!url) return true;
  const u = String(url).toLowerCase();
  return (
    u.includes('missinglivestock') ||
    u.includes('missing%20livestock') ||
    u.includes('missing+livestock') ||
    u.includes('missing livestock')
  );
}

/** Return a usable listing photo URL, or null when missing / placeholder stock. */
export function resolveListingPhoto(url) {
  if (!url || isMissingLivestockPhoto(url)) return null;
  return url;
}

/** Empty slot reserved for a real photo later. */
export function ListingPhotoPlaceholder({ className = '', label = 'No image' }) {
  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center gap-1.5 select-none ${className}`}
      style={{ backgroundColor: '#ebe6dc' }}
      aria-hidden
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b5ae9f" strokeWidth="1.5">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="8.5" cy="10" r="1.5" fill="#b5ae9f" stroke="none" />
        <path d="M3 16l5-5 3 3 4-4 6 6" />
      </svg>
      <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: '#9a9285' }}>
        {label}
      </span>
    </div>
  );
}

/**
 * Listing card image: real photo when present; empty placeholder otherwise.
 * Never falls back to the "Missing Livestock Photo" stock image.
 */
export default function ListingPhoto({
  src,
  alt = '',
  className = '',
  imgClassName = 'w-full h-full object-cover',
  loading = 'lazy',
}) {
  const resolved = resolveListingPhoto(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [resolved]);

  if (!resolved || failed) {
    return <ListingPhotoPlaceholder className={className} />;
  }

  return (
    <img
      src={resolved}
      alt={alt}
      loading={loading}
      className={imgClassName}
      onError={() => setFailed(true)}
    />
  );
}
