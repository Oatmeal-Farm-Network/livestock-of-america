import React from 'react';

const OLIVE = '#3D6B34';
const RUST = '#8b3a2b';
const CREAM = '#f7f2e8';

/**
 * Shared Knowledgebases landing hero — Food System Directory style:
 * full image, centered white title, quote + stats, search.
 */
export default function KnowledgebaseLandingHero({
  image,
  alt,
  title,
  description,
  quote = 'The Catalog of nature is never finished, only expanded by those who observe.',
  stats = [],
  searchPlaceholder = 'Search…',
  searchValue = '',
  onSearchChange,
  onSearchSubmit,
}) {
  return (
    <>
      <div className="relative w-full overflow-hidden rounded-xl min-h-[220px] md:min-h-[300px] flex items-center justify-center">
        <img
          src={image}
          alt={alt || title}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
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
            className="text-3xl md:text-4xl font-bold leading-tight mb-3 drop-shadow-md"
            style={{ fontFamily: "'Lora', 'Times New Roman', serif", color: '#ffffff' }}
          >
            {title}
          </h1>
          {description && (
            <p
              className="text-sm md:text-[0.95rem] leading-relaxed drop-shadow"
              style={{ color: 'rgba(255,255,255,0.92)' }}
            >
              {description}
            </p>
          )}
        </div>
      </div>

      <div
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 py-8"
        style={{ background: CREAM }}
      >
        <p
          className="text-base md:text-lg italic max-w-md leading-snug"
          style={{ fontFamily: "'Lora', 'Times New Roman', serif", color: OLIVE }}
        >
          “{quote}”
        </p>
        {stats.length > 0 && (
          <div className="flex flex-wrap gap-8 md:gap-12">
            {stats.map((s, i) => (
              <div key={s.label}>
                <div
                  className="text-3xl md:text-4xl font-bold leading-none"
                  style={{ color: i === 0 ? OLIVE : RUST }}
                >
                  {s.value}
                </div>
                <div className="text-xs mt-1.5" style={{ color: '#6b6b6b' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
              className="w-full rounded-lg pl-10 pr-4 py-3 text-sm border border-black/10 bg-white focus:outline-none focus:ring-2 focus:ring-[#3D6B34]/30"
              style={{ color: '#2c2c2c' }}
            />
          </div>
          <button
            type="submit"
            className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-bold hover:opacity-90"
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
