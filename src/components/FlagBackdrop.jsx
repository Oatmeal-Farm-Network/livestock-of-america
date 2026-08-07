import React, { useState } from 'react';

const CREAM = '#f7f2e8';

/**
 * Path to the photographic flag backdrop. Drop the image at
 * `public/images/loa-flag-bg.webp` and it is used automatically; until then
 * the CSS-drawn flag below stands in. Change this constant to point at a
 * different filename.
 */
export const FLAG_IMAGE = '/images/loa-flag-bg.webp';

/**
 * Faded stars-and-stripes page backdrop, sitting behind the banner and all
 * page content (below the sticky header). Fixed, so it stays put while the
 * page scrolls.
 */
export default function FlagBackdrop() {
  const [usePhoto, setUsePhoto] = useState(true);

  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none"
      aria-hidden
      style={{ backgroundColor: CREAM }}
    >
      {usePhoto ? (
        <img
          src={FLAG_IMAGE}
          alt=""
          className="w-full h-full object-cover"
          style={{ opacity: 0.5 }}
          onError={() => setUsePhoto(false)}
        />
      ) : (
        <>
          {/* Stripes: warm, low-contrast red on cream. */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'repeating-linear-gradient(177deg, rgba(178,54,60,0.085) 0 3.85%, rgba(178,54,60,0) 3.85% 7.7%)',
            }}
          />
          {/* Canton: muted navy block with a soft star field. */}
          <div
            className="absolute left-0 top-0"
            style={{
              width: '44%',
              height: '54%',
              backgroundColor: 'rgba(60,64,110,0.07)',
              backgroundImage:
                'radial-gradient(circle, rgba(255,255,255,0.95) 1px, rgba(255,255,255,0) 1.5px)',
              backgroundSize: '5.5% 9.8%',
            }}
          />
          {/* Soften the whole thing so it reads as a wash, not a graphic. */}
          <div
            className="absolute inset-0"
            style={{ backdropFilter: 'blur(1.5px)', WebkitBackdropFilter: 'blur(1.5px)' }}
          />
        </>
      )}
      {/* Cream veil: keeps text readable over either the photo or the CSS flag. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(115deg, rgba(247,242,232,0.60) 0%, rgba(247,242,232,0.84) 55%, rgba(247,242,232,0.94) 100%)',
        }}
      />
    </div>
  );
}
