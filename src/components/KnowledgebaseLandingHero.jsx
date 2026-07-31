import React from 'react';

const OLIVE = '#3D6B34';
const RUST = '#8b3a2b';
const CREAM = '#f7f2e8';
const LORA = "'Lora', 'Times New Roman', serif";

/**
 * Shared Knowledgebases landing hero — matches Plant Knowledgebase layout:
 * full image banner, quote + three stats, then search.
 */
export default function KnowledgebaseLandingHero({
  image,
  alt,
  title,
  description,
  quote = 'the Catalog of nature is never finished, only expanded by those who observe.',
  stats = [],
  searchPlaceholder = 'Search…',
  searchValue = '',
  onSearchChange,
  onSearchSubmit,
}) {
  return (
    <>
      {/* Hero banner */}
      <div className="relative w-full overflow-hidden rounded-xl min-h-[240px] md:min-h-[320px] flex items-center justify-center">
        <img
          src={image}
          alt={alt || title}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          onError={(e) => {
            e.target.src = '/images/HomepageLivestockDB.webp';
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(20,20,20,0.42) 0%, rgba(20,20,20,0.35) 50%, rgba(20,20,20,0.5) 100%)',
          }}
          aria-hidden
        />
        <div className="relative z-[1] text-center px-6 py-12 md:py-16 max-w-3xl mx-auto">
          <h1
            className="leading-tight mb-3 drop-shadow-md"
            style={{
              fontFamily: LORA,
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
            }}
          >
            {title}
          </h1>
          {description && (
            <p
              className="text-sm md:text-[0.95rem] leading-relaxed drop-shadow mx-auto max-w-2xl"
              style={{ color: 'rgba(255,255,255,0.92)' }}
            >
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Quote + three stats (same layout as Plant Knowledgebase) */}
      <div
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 py-8 px-1"
        style={{ background: CREAM }}
      >
        <p
          className="text-base md:text-lg italic max-w-lg leading-snug m-0"
          style={{ fontFamily: LORA, color: OLIVE }}
        >
          “{quote}”
        </p>

        {stats.length > 0 && (
          <div className="flex flex-wrap items-start gap-10 md:gap-14 shrink-0">
            {stats.map((s, i) => (
              <div key={s.label} className="min-w-[7rem]">
                <div
                  className="leading-none"
                  style={{
                    fontFamily: LORA,
                    fontWeight: 700,
                    fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
                    color: i === 0 ? OLIVE : RUST,
                  }}
                >
                  {s.value}
                </div>
                <div
                  className="mt-2 text-[11px] md:text-xs tracking-wide"
                  style={{ color: '#555555', fontWeight: 500 }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search */}
      {onSearchChange && (
        <form
          className="flex flex-col sm:flex-row gap-3 pb-2"
          onSubmit={(e) => {
            e.preventDefault();
            onSearchSubmit?.();
          }}
        >
          <div className="relative flex-1">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9a9a9a"
              strokeWidth="2"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg pl-10 pr-4 py-3 text-sm border border-black/10 bg-white focus:outline-none focus:ring-2 focus:ring-[#3D6B34]/30 shadow-sm"
              style={{ color: '#2c2c2c' }}
            />
          </div>
          <button
            type="submit"
            className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-bold hover:opacity-90 shadow-sm"
            style={{ background: OLIVE, color: '#ffffff' }}
          >
            Search
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M4 6h16M7 12h10M10 18h4" />
            </svg>
          </button>
        </form>
      )}
    </>
  );
}
