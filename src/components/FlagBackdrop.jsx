import React from 'react';

const CREAM = '#f7f2e8';

/** Photographic flag backdrop. Replace this file to change the image. */
export const FLAG_IMAGE = '/images/loa-flag-bg.webp';

/**
 * Faded stars-and-stripes page backdrop — sits behind the banner and all page
 * content, below the sticky header. Fixed, so it stays put while scrolling.
 *
 * The source photo is very close to white, so at 1:1 over a cream page it is
 * almost imperceptible. `contrast` / `saturate` pull the stripes and canton
 * back out; raise them to make the flag read more strongly, lower them to
 * make it recede. `veil` adds a cream wash on top if text needs more
 * separation (0 = none).
 */
export default function FlagBackdrop({
  opacity = 1,
  contrast = 1.45,
  saturate = 1.8,
  veil = 0,
}) {
  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none"
      aria-hidden
      style={{ backgroundColor: CREAM }}
    >
      <img
        src={FLAG_IMAGE}
        alt=""
        className="w-full h-full object-cover"
        style={{
          opacity,
          filter: `contrast(${contrast}) saturate(${saturate})`,
        }}
      />
      {veil > 0 && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: `rgba(247,242,232,${veil})` }}
        />
      )}
    </div>
  );
}
