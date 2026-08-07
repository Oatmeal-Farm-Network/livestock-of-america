import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import ListingPhoto from '../components/ListingPhoto';
import FlagBackdrop from '../components/FlagBackdrop';
import { endpoints } from '../config/api';

const CREAM = '#f7f2e8';
const OLIVE = '#3d6b34';
const RUST = '#8b3a2b';
const AMBER = '#c9781f';
const INK = '#2c2c2c';
const MUTED = '#6b6b6b';
const LINE = '#e5e0d6';
const LORA = "'Lora', 'Times New Roman', serif";

const BANNER = '/images/LOAwebbanner1898x360.webp';

const ANIMAL_PATH = (id) => `/marketplaces/livestock/animal/${id}`;

function money(n) {
  if (n == null || Number.isNaN(Number(n))) return null;
  return `$${Math.round(Number(n)).toLocaleString()}`;
}

/** Legacy rows store Category as a bare numeric code — only show real labels. */
function categoryLabel(value) {
  const v = (value || '').trim();
  if (!v || /^\d+$/.test(v)) return '';
  return v;
}

function speciesLabel(slug) {
  if (!slug) return '';
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Short uppercase kicker above a card title, built from real listing data. */
function kicker(animal) {
  return (animal?.breeds?.[0] || speciesLabel(animal?.species_slug) || 'Livestock').toUpperCase();
}

function useInView(options = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12, ...options },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function Reveal({ children, className = '', delay = 0 }) {
  const [ref, visible] = useInView();
  return (
    <div
      ref={ref}
      className={`loa-reveal ${visible ? 'loa-reveal-in' : ''} ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
}

function SectionHead({ title, blurb, divider = false }) {
  return (
    <Reveal>
      <div
        className={divider ? 'pt-9 border-t' : ''}
        style={divider ? { borderColor: LINE } : undefined}
      >
        <h2
          className="m-0 mb-1.5"
          style={{
            fontFamily: LORA,
            fontWeight: 700,
            fontSize: 'clamp(1.35rem, 2.6vw, 1.85rem)',
            color: INK,
          }}
        >
          {title}
        </h2>
        <p className="m-0 mb-6 max-w-2xl text-[13px] leading-relaxed" style={{ color: MUTED }}>
          {blurb}
        </p>
      </div>
    </Reveal>
  );
}

function Badge({ children, tone = 'amber' }) {
  const bg = tone === 'olive' ? OLIVE : AMBER;
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-bold uppercase text-white"
      style={{ backgroundColor: bg, letterSpacing: '0.09em' }}
    >
      {children}
    </span>
  );
}

function Kicker({ children, color = OLIVE }) {
  return (
    <p
      className="m-0 mb-2 text-[10px] font-bold uppercase"
      style={{ color, letterSpacing: '0.14em' }}
    >
      {children}
    </p>
  );
}

/** Large lead card in the Heritage Breed Sales row. */
function HeritageLeadCard({ animal }) {
  const price = money(animal.price);
  const meta = [categoryLabel(animal.category), animal.breeds?.[0], animal.location]
    .filter(Boolean)
    .join(' · ');

  return (
    <Link to={ANIMAL_PATH(animal.animal_id)} className="no-underline block group h-full" style={{ color: 'inherit' }}>
      <article
        className="h-full overflow-hidden rounded-lg border bg-white flex flex-col transition-shadow group-hover:shadow-lg"
        style={{ borderColor: LINE }}
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-[#efe9df]">
          <ListingPhoto
            src={animal.photo}
            alt={animal.full_name}
            imgClassName="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute top-3 left-3">
            <Badge>Featured Listing</Badge>
          </div>
        </div>
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-4">
            <h3
              className="m-0 mb-2 text-xl font-bold leading-snug"
              style={{ fontFamily: LORA, color: INK }}
            >
              {animal.full_name}
            </h3>
            <span
              className="shrink-0 rounded-md border px-3 py-1.5 text-xs font-semibold"
              style={{ borderColor: LINE, color: price ? OLIVE : MUTED, backgroundColor: '#faf7f1' }}
            >
              {price || 'Call for price'}
            </span>
          </div>
          {animal.description && (
            <p className="m-0 text-[13px] leading-relaxed line-clamp-2" style={{ color: MUTED }}>
              {animal.description}
            </p>
          )}
          {meta && (
            <p
              className="m-0 mt-auto pt-4 text-[11px] uppercase"
              style={{ color: '#9a9285', letterSpacing: '0.08em' }}
            >
              {meta}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}

/** Compact side card in the Heritage Breed Sales row. */
function HeritageSideCard({ animal }) {
  const price = money(animal.price);
  return (
    <Link to={ANIMAL_PATH(animal.animal_id)} className="no-underline block group h-full" style={{ color: 'inherit' }}>
      <article
        className="h-full rounded-lg border bg-white p-4 flex flex-col transition-shadow group-hover:shadow-md"
        style={{ borderColor: LINE }}
      >
        <Kicker>{kicker(animal)}</Kicker>
        <h3
          className="m-0 mb-1.5 text-[15px] font-bold leading-snug"
          style={{ fontFamily: LORA, color: INK }}
        >
          {animal.full_name}
        </h3>
        {animal.description && (
          <p className="m-0 mb-3 text-[12px] leading-relaxed line-clamp-3" style={{ color: MUTED }}>
            {animal.description}
          </p>
        )}
        <div className="mt-auto flex items-end justify-between gap-3">
          <span className="text-[13px] font-semibold" style={{ color: price ? OLIVE : MUTED }}>
            {price || 'Call for price'}
          </span>
          <span
            className="loa-arrow shrink-0 grid place-items-center w-7 h-7 rounded-full border text-xs transition-colors group-hover:text-white"
            style={{ borderColor: LINE, color: MUTED }}
          >
            →
          </span>
        </div>
      </article>
    </Link>
  );
}

/** Featured Animal for Sale — image left, detail panel right. */
function FeaturedForSaleCard({ animal }) {
  const price = money(animal.price);
  return (
    <article
      className="overflow-hidden rounded-lg border bg-white grid grid-cols-1 md:grid-cols-2"
      style={{ borderColor: LINE }}
    >
      <div className="relative min-h-[240px] bg-[#efe9df]">
        <ListingPhoto
          src={animal.photo}
          alt={animal.full_name}
          imgClassName="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3">
          <Badge tone="olive">Featured for Sale</Badge>
        </div>
      </div>
      <div className="p-6 md:p-8 flex flex-col">
        <Kicker>{kicker(animal)}</Kicker>
        <h3
          className="m-0 mb-3"
          style={{ fontFamily: LORA, fontWeight: 700, fontSize: 'clamp(1.3rem,2.4vw,1.7rem)', color: INK }}
        >
          {animal.full_name}
        </h3>
        {animal.description && (
          <p className="m-0 mb-6 text-[13px] leading-relaxed line-clamp-4" style={{ color: MUTED }}>
            {animal.description}
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-4">
          <div>
            <p
              className="m-0 mb-1 text-[10px] font-bold uppercase"
              style={{ color: '#9a9285', letterSpacing: '0.14em' }}
            >
              Investment
            </p>
            <p className="m-0 text-2xl font-bold" style={{ fontFamily: LORA, color: RUST }}>
              {price || 'Call for price'}
            </p>
          </div>
          <Link
            to={ANIMAL_PATH(animal.animal_id)}
            className="inline-flex items-center rounded-md px-5 py-2.5 text-xs font-bold uppercase no-underline text-white loa-home-cta"
            style={{ backgroundColor: OLIVE, letterSpacing: '0.09em' }}
          >
            Inquire Now
          </Link>
        </div>
        {(animal.seller || animal.location) && (
          <p className="m-0 mt-4 text-[11px]" style={{ color: '#9a9285' }}>
            {[animal.seller, animal.location].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
    </article>
  );
}

/** Featured Stud Breeding — narrow image left, stat row right. */
function FeaturedStudCard({ animal }) {
  const fee = money(animal.stud_fee);
  const stats = [
    { label: 'Stud Fee', value: fee || 'Contact for fee' },
    { label: 'Breed', value: animal.breeds?.[0] || speciesLabel(animal.species_slug) || '—' },
    { label: 'Location', value: animal.location || animal.seller || '—' },
  ];

  return (
    <article
      className="overflow-hidden rounded-lg border bg-white grid grid-cols-1 md:grid-cols-[minmax(0,300px)_1fr]"
      style={{ borderColor: LINE }}
    >
      <div className="relative min-h-[220px] bg-[#efe9df]">
        <ListingPhoto
          src={animal.photo}
          alt={animal.full_name}
          imgClassName="absolute inset-0 w-full h-full object-cover"
        />
      </div>
      <div className="p-6 md:p-8 flex flex-col">
        <div className="mb-3">
          <Badge>★ Featured Stud</Badge>
        </div>
        <h3
          className="m-0 mb-3"
          style={{ fontFamily: LORA, fontWeight: 700, fontSize: 'clamp(1.25rem,2.2vw,1.6rem)', color: INK }}
        >
          {animal.full_name}
        </h3>
        {animal.description && (
          <p className="m-0 mb-6 text-[13px] leading-relaxed line-clamp-3" style={{ color: MUTED }}>
            {animal.description}
          </p>
        )}
        <div className="grid grid-cols-3 gap-4 mb-5">
          {stats.map((s) => (
            <div key={s.label}>
              <p
                className="m-0 mb-1 text-[10px] font-bold uppercase"
                style={{ color: '#9a9285', letterSpacing: '0.12em' }}
              >
                {s.label}
              </p>
              <p className="m-0 text-[13px] font-semibold" style={{ color: INK }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-auto pt-4 border-t" style={{ borderColor: LINE }}>
          <Link
            to={ANIMAL_PATH(animal.animal_id)}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase no-underline"
            style={{ color: OLIVE, letterSpacing: '0.1em' }}
          >
            View Stud Details →
          </Link>
        </div>
      </div>
    </article>
  );
}

/** Placeholder shown when a section has no publishable record yet. */
function EmptyPanel({ message, cta, to }) {
  return (
    <div
      className="rounded-lg border bg-white px-5 py-10 text-center text-[13px]"
      style={{ borderColor: LINE, color: MUTED }}
    >
      <p className="m-0 mb-4">{message}</p>
      <Link
        to={to}
        className="inline-flex rounded-md px-5 py-2.5 text-xs font-bold uppercase no-underline text-white"
        style={{ backgroundColor: OLIVE, letterSpacing: '0.09em' }}
      >
        {cta}
      </Link>
    </div>
  );
}

export default function Home() {
  const [featured, setFeatured] = useState({ for_sale: null, stud: null, heritage: [] });

  useEffect(() => {
    let cancelled = false;
    fetch(endpoints.homepageFeatured())
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setFeatured({
          for_sale: data.for_sale || null,
          stud: data.stud || null,
          heritage: Array.isArray(data.heritage) ? data.heritage : [],
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const heritageCards = featured.heritage;

  return (
    <div className="min-h-screen font-sans flex flex-col relative">
      <PageMeta
        title="Livestock of America by Oatmeal AI | Connecting Ranches Across the United States"
        description="Heritage breed sales, featured livestock for sale, and championship stud breeding services from ranchers and breeders across America."
        keywords="livestock of america, oatmeal ai, livestock marketplace, heritage breeds, stud services, ranchers, breeders"
        canonical="https://livestockofamerica.com/"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Livestock of America by Oatmeal AI',
          url: 'https://livestockofamerica.com/',
          description: 'Connecting ranchers, buyers, and livestock professionals across the United States.',
        }}
      />
      <FlagBackdrop />
      <Header />

      <main className="flex-1">
        <div className="max-w-[1100px] mx-auto px-5 pt-6 pb-16">
          {/* Collage banner */}
          <Reveal>
            <img
              src={BANNER}
              alt="Livestock of America — farms, ranches and livestock across the United States"
              className="w-full h-auto rounded-lg object-cover"
              width="1898"
              height="360"
            />
          </Reveal>

          {/* Heritage Breed Sales */}
          <section className="pt-10">
            <SectionHead
              title="Heritage Breed Sales"
              blurb="Curated lineages preserved for generations, offering vigour, genetic integrity, and historical significance."
            />
            {heritageCards.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-4">
                <Reveal className="h-full">
                  <HeritageLeadCard animal={heritageCards[0]} />
                </Reveal>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  {heritageCards.slice(1).map((a, i) => (
                    <Reveal key={a.animal_id} className="h-full" delay={(i + 1) * 80}>
                      <HeritageSideCard animal={a} />
                    </Reveal>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyPanel
                message="Heritage listings are on their way."
                cta="Browse Marketplace"
                to="/animals"
              />
            )}
          </section>

          {/* Featured Animal for Sale */}
          <section className="pt-12">
            <SectionHead
              divider
              title="Featured Animal for Sale"
              blurb="Exceptional specimens representing the pinnacle of heritage breeding and genetic excellence."
            />
            <Reveal>
              {featured.for_sale ? (
                <FeaturedForSaleCard animal={featured.for_sale} />
              ) : (
                <EmptyPanel
                  message="No animals are published for sale right now."
                  cta="Browse Marketplace"
                  to="/animals"
                />
              )}
            </Reveal>
          </section>

          {/* Featured Stud Breeding */}
          <section className="pt-12">
            <SectionHead
              divider
              title="Featured Stud Breeding"
              blurb="Secure the future of your lineage with world-class genetic contributions."
            />
            <Reveal>
              {featured.stud ? (
                <FeaturedStudCard animal={featured.stud} />
              ) : (
                <EmptyPanel
                  message="No stud services are published right now."
                  cta="Browse Stud Services"
                  to="/marketplaces/livestock/studs/cattle"
                />
              )}
            </Reveal>
          </section>
        </div>
      </main>

      <Footer />

      <style>{`
        .loa-home-cta {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .loa-home-cta:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 22px rgba(0,0,0,0.18);
        }
        .loa-reveal {
          opacity: 0;
          transform: translateY(18px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .loa-reveal-in {
          opacity: 1;
          transform: translateY(0);
        }
        .group:hover .loa-arrow {
          background-color: ${OLIVE};
          border-color: ${OLIVE};
        }
        @media (prefers-reduced-motion: reduce) {
          .loa-home-cta,
          .loa-reveal {
            animation: none !important;
            transition: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}
