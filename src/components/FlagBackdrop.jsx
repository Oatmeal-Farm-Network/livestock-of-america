import React, { useState } from 'react';

const CREAM = '#f7f2e8';

/**
 * Backdrop image sources, tried in order.
 *
 * The first entry is the photographic flag: drop your photo at
 * `public/images/loa-flag-bg.webp` and it is used automatically. Until that
 * file exists the request 404s and we fall through to the SVG flag shipped in
 * `public/images/`, which is always present.
 */
export const FLAG_SOURCES = [
  '/images/loa-flag-bg.webp',
  '/images/loa-flag-bg.svg',
];

/**
 * Faded stars-and-stripes page backdrop — sits behind the banner and all page
 * content, below the sticky header. Fixed, so it stays put while scrolling.
 *
 * `opacity` (0-1) tunes how strongly the flag reads; `veil` is the cream
 * overlay that keeps text legible on top of it.
 */
export default function FlagBackdrop({ opacity, veil }) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const src = FLAG_SOURCES[sourceIndex];

  // The supplied photo is already washed out, so it needs no help. The drawn
  // SVG fallback is more saturated and does need toning down — hence the
  // different defaults per source.
  const usingPhoto = sourceIndex === 0;
  const imgOpacity = opacity ?? (usingPhoto ? 1 : 0.85);
  const veilAlpha = veil ?? (usingPhoto ? 0.06 : 0.32);

  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none"
      aria-hidden
      style={{ backgroundColor: CREAM }}
    >
      {src && (
        <img
          src={src}
          alt=""
          className="w-full h-full object-cover"
          style={{ opacity: imgOpacity }}
          // Fall through to the next source (photo -> bundled SVG).
          onError={() => setSourceIndex((i) => i + 1)}
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          background:
            `linear-gradient(115deg, rgba(247,242,232,${veilAlpha * 0.7}) 0%,` +
            ` rgba(247,242,232,${veilAlpha}) 55%,` +
            ` rgba(247,242,232,${Math.min(veilAlpha * 1.4, 1)}) 100%)`,
        }}
      />
    </div>
  );
}
