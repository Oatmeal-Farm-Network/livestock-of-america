import React from 'react';

const CREAM = '#f7f2e8';

/** Photographic flag backdrop. Replace this file to change the image. */
export const FLAG_IMAGE = '/images/loa-flag-bg.webp';

/**
 * Flag band across the top of the home page, sitting directly under the
 * header and behind the banner. Not fixed and not full-page — it scrolls away
 * with the rest of the content.
 *
 * Centred and capped at `maxWidth` rather than bleeding to the viewport edges.
 * It runs wider than the 1100px body column, so the flag extends a little past
 * the banner and cards on either side.
 *
 * Must be placed inside a `position: relative` parent, with the page content
 * given `relative z-10` so it stacks above the band.
 *
 * The source photo is close to white, so `contrast` / `saturate` pull the
 * stripes and canton back out; raise them to make it read more strongly.
 */
export default function FlagBackdrop({
  offsetTop = 0,
  height = 560,
  maxWidth = 1400,
  opacity = 1,
  contrast = 1.45,
  saturate = 1.8,
}) {
  return (
    <div
      className="absolute inset-x-0 z-0 pointer-events-none"
      style={{ top: offsetTop, height }}
      aria-hidden
    >
      {/* Matches the body wrapper: max-w-[1100px] mx-auto px-5 */}
      <div className="mx-auto h-full px-5" style={{ maxWidth }}>
        <div className="relative h-full overflow-hidden">
          <img
            src={FLAG_IMAGE}
            alt=""
            className="w-full h-full object-cover"
            style={{ opacity, filter: `contrast(${contrast}) saturate(${saturate})` }}
          />
          {/* Fade into the page colour so the band has no visible bottom edge. */}
          <div
            className="absolute inset-0"
            style={{
              background:
                `linear-gradient(to bottom, rgba(247,242,232,0) 45%, ${CREAM} 100%)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
