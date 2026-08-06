import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import { isLoggedIn } from '../lib/auth';
import { openSaigeChat } from '../components/SaigeWidget';
import ListingPhoto from '../components/ListingPhoto';

const API_URL = import.meta.env.VITE_LIVESTOCK_API_URL || '';
const CREAM = '#f7f2e8';
const OLIVE = '#3d6b34';
const RUST = '#8b3a2b';
const INK = '#2c2c2c';
const MUTED = '#6b6b6b';
const LORA = "'Lora', 'Times New Roman', serif";
const HERO_IMAGE = '/images/home-hero-livestock.png';
const HERO_IMAGE_FALLBACK = '/images/CattleHeader.webp';

const SPECIES_SPOTLIGHT = [
  { slug: 'cattle', label: 'Cattle', img: '/images/CattleHeader.webp' },
  { slug: 'sheep', label: 'Sheep', img: '/images/SheepHeader.webp' },
  { slug: 'horses', label: 'Horses', img: '/images/HorsesHeader.webp' },
  { slug: 'goats', label: 'Goats', img: '/images/Goats.webp' },
  { slug: 'alpacas', label: 'Alpacas', img: '/images/AlpacasHeader.webp' },
  { slug: 'pigs', label: 'Pigs', img: '/images/PigHeader.webp' },
  { slug: 'chickens', label: 'Chickens', img: '/images/ChickenHeader.webp' },
  { slug: 'bison', label: 'Bison', img: '/images/BisonHeader.png' },
];

const PATHWAYS = [
  {
    title: 'For Sale',
    body: 'Browse animals listed by ranchers and breeders across the country.',
    to: '/marketplaces/livestock/cattle',
    img: '/images/CattleHeader.webp',
  },
  {
    title: 'Stud Services',
    body: 'Find quality stud animals and breeding opportunities.',
    to: '/marketplaces/livestock/studs/cattle',
    img: '/images/HorsesHeader.webp',
  },
  {
    title: 'Ranches',
    body: 'Explore operations, contact sellers, and discover new bloodlines.',
    to: '/marketplaces/livestock/ranches/cattle',
    img: '/images/cowboy2.webp',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Browse',
    body: 'Search livestock for sale, studs, and ranch profiles — as a guest or signed in.',
    img: '/images/CattleHeader.webp',
    to: '/animals',
    cta: 'Browse marketplace',
  },
  {
    n: '02',
    title: 'Research',
    body: 'Open breed pages for origins, traits, and farming notes before you buy or breed.',
    img: '/images/KBHeroLivestock.png',
    to: '/livestock',
    cta: 'Explore breeds',
  },
  {
    n: '03',
    title: 'Connect',
    body: 'Reach sellers directly, list your own animals, and grow your ranch presence.',
    img: '/images/cowboy2.webp',
    to: '/signup',
    toLoggedIn: '/account',
    cta: 'Create account',
    ctaLoggedIn: 'Go to account',
  },
];

function formatCount(n) {
  if (n == null || Number.isNaN(n)) return null;
  return Number(n).toLocaleString();
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

function CountUp({ value, fallback }) {
  const [ref, visible] = useInView();
  const [display, setDisplay] = useState(fallback);
  useEffect(() => {
    if (!visible || value == null || Number.isNaN(Number(value))) {
      setDisplay(fallback);
      return undefined;
    }
    const target = Number(value);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setDisplay(formatCount(target));
      return undefined;
    }
    const start = performance.now();
    const dur = 1100;
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(formatCount(Math.round(target * eased)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, value, fallback]);
  return <span ref={ref}>{display}</span>;
}

function FeaturedListingCard({ animal }) {
  const price = animal.price
    ? `$${Math.round(animal.price).toLocaleString()}`
    : 'Call for price';
  const meta = [animal.breeds?.[0], animal.seller].filter(Boolean).join(' · ');

  return (
    <Link
      to={`/marketplaces/livestock/animal/${animal.animal_id}`}
      className="no-underline block group h-full"
      style={{ color: 'inherit' }}
    >
      <article
        className="h-full overflow-hidden rounded-lg border bg-white flex flex-col transition-shadow group-hover:shadow-md"
        style={{ borderColor: '#e5e0d6' }}
      >
        <div className="aspect-[16/10] overflow-hidden bg-[#efe9df]">
          <ListingPhoto
            src={animal.photo}
            alt={animal.full_name || 'Livestock listing'}
            imgClassName="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
        <div className="px-3 py-2.5 flex-1 flex flex-col">
          <h3
            className="m-0 mb-1 text-[13px] font-bold leading-snug line-clamp-2"
            style={{ fontFamily: LORA, color: INK }}
          >
            {animal.full_name}
          </h3>
          {meta && (
            <p className="m-0 mb-2 text-[11px] truncate" style={{ color: MUTED }}>
              {meta}
            </p>
          )}
          <p className="m-0 mt-auto text-xs font-semibold" style={{ color: OLIVE }}>
            {price}
          </p>
        </div>
      </article>
    </Link>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const [heroSrc, setHeroSrc] = useState(HERO_IMAGE);
  const [breedTotal, setBreedTotal] = useState(null);
  const [speciesCount, setSpeciesCount] = useState(null);
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/api/livestock/counts`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setBreedTotal(data.total ?? null);
        const n = data.counts ? Object.keys(data.counts).length : null;
        setSpeciesCount(n);
      })
      .catch(() => {});

    fetch(`${API_URL}/api/marketplace/homepage-listings`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (cancelled) return;
        const rows = Array.isArray(data) ? data : [];
        const seen = new Set();
        const unique = [];
        for (const a of rows) {
          if (a?.animal_id == null || seen.has(a.animal_id)) continue;
          seen.add(a.animal_id);
          unique.push(a);
        }
        setFeatured(unique.slice(0, 6));
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, []);

  const breedFallback = '2,500+';
  const speciesFallback = '29';
  const guest = !isLoggedIn();

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: CREAM }}>
      <PageMeta
        title="Livestock of America by Oatmeal AI | Connecting Ranches Across the United States"
        description="Livestock of America by Oatmeal AI connects ranchers, breeders, and buyers through a dedicated marketplace and livestock breed knowledgebase."
        keywords="livestock of america, oatmeal ai, livestock marketplace, ranchers, breeders, livestock knowledgebase"
        canonical="https://livestockofamerica.com/"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Livestock of America by Oatmeal AI',
          url: 'https://livestockofamerica.com/',
          description:
            'Connecting ranchers, breeders, and buyers across the United States.',
        }}
      />
      <Header />

      {/* Hero */}
      <section className="relative min-h-[calc(100vh-4.5rem)] flex items-end overflow-hidden">
        <img
          src={heroSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-[center_65%] loa-home-hero-media"
          onError={() => setHeroSrc(HERO_IMAGE_FALLBACK)}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(105deg, rgba(44,36,28,0.72) 0%, rgba(44,36,28,0.42) 48%, rgba(44,36,28,0.22) 100%)',
          }}
        />
        <div className="relative z-10 w-full max-w-[1100px] mx-auto px-5 pb-16 pt-24 md:pb-24 loa-home-hero-copy">
          <img
            src="/images/loa-header-logo.png"
            alt="Livestock of America by Oatmeal AI"
            className="h-14 md:h-16 w-auto mb-5 object-contain drop-shadow"
            width="220"
            height="64"
          />
          <p
            className="text-white text-sm md:text-base tracking-wide uppercase mb-3 m-0"
            style={{ fontFamily: LORA, letterSpacing: '0.12em', opacity: 0.92 }}
          >
            Livestock of America by Oatmeal AI
          </p>
          <h1
            className="text-white m-0 mb-4 max-w-3xl"
            style={{
              fontFamily: LORA,
              fontWeight: 700,
              fontSize: 'clamp(2.15rem, 5.4vw, 3.5rem)',
              lineHeight: 1.1,
            }}
          >
            Connecting ranches across the United States
          </h1>
          <p
            className="text-white/90 m-0 mb-8 max-w-xl text-base md:text-lg leading-relaxed"
            style={{ fontFamily: LORA }}
          >
            {t(
              'phase1.about.tagline',
              'Connecting ranchers, buyers, and livestock professionals across America.',
            )}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/animals"
              className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold no-underline text-white loa-home-cta"
              style={{ backgroundColor: OLIVE }}
            >
              Browse Marketplace
            </Link>
            <Link
              to="/livestock"
              className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold no-underline border border-white/70 text-white loa-home-cta"
              style={{ backgroundColor: 'transparent' }}
            >
              Explore Breeds
            </Link>
          </div>
        </div>
        <a
          href="#how-it-works"
          className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 text-white/80 text-xs tracking-widest uppercase no-underline loa-home-scroll"
          style={{ fontFamily: LORA }}
        >
          Scroll
          <span className="block mx-auto mt-1 w-px h-8 bg-white/50 loa-home-scroll-line" />
        </a>
      </section>

      {/* Stats */}
      <section className="border-y" style={{ backgroundColor: '#efe9df', borderColor: '#e0d8cc' }}>
        <div className="max-w-[1100px] mx-auto px-5 py-9 md:py-11 grid grid-cols-1 sm:grid-cols-3 gap-8">
          <Reveal>
            <p className="m-0 text-3xl md:text-4xl font-bold" style={{ fontFamily: LORA, color: RUST }}>
              <CountUp value={breedTotal} fallback={breedFallback} />
            </p>
            <p className="m-0 mt-1 text-sm" style={{ color: MUTED }}>Documented breeds in the knowledgebase</p>
          </Reveal>
          <Reveal delay={80}>
            <p className="m-0 text-3xl md:text-4xl font-bold" style={{ fontFamily: LORA, color: RUST }}>
              <CountUp value={speciesCount} fallback={speciesFallback} />
            </p>
            <p className="m-0 mt-1 text-sm" style={{ color: MUTED }}>Livestock species covered</p>
          </Reveal>
          <Reveal delay={160}>
            <p className="m-0 text-3xl md:text-4xl font-bold" style={{ fontFamily: LORA, color: RUST }}>
              Coast to coast
            </p>
            <p className="m-0 mt-1 text-sm" style={{ color: MUTED }}>Ranchers &amp; buyers finding each other</p>
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{ backgroundColor: CREAM }}>
        <div className="max-w-[1100px] mx-auto px-5 py-12 md:py-14">
          <Reveal>
            <p className="m-0 mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: OLIVE }}>
              How it works
            </p>
            <h2
              className="m-0 mb-8 max-w-xl"
              style={{
                fontFamily: LORA,
                fontWeight: 700,
                fontSize: 'clamp(1.5rem, 3vw, 2.1rem)',
                color: INK,
              }}
            >
              Three steps from pasture to purchase
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0">
            {STEPS.map((step, i) => {
              const href = step.toLoggedIn && !guest ? step.toLoggedIn : step.to;
              const ctaLabel = step.ctaLoggedIn && !guest ? step.ctaLoggedIn : step.cta;
              return (
                <Reveal
                  key={step.n}
                  delay={i * 90}
                  className={`md:px-5 ${i > 0 ? 'md:border-l md:border-[#e0d8cc]' : 'md:pl-0'}`}
                >
                  <div
                    className="mb-4 overflow-hidden"
                    style={{ height: 168, backgroundColor: '#ebe6dc' }}
                  >
                    <img
                      src={step.img}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = '/images/HomepageLivestockDB.webp';
                      }}
                    />
                  </div>
                  <p className="m-0 mb-3 text-sm font-bold tracking-widest" style={{ color: RUST, fontFamily: LORA }}>
                    {step.n}
                  </p>
                  <h3 className="m-0 mb-2 text-xl font-bold" style={{ fontFamily: LORA, color: INK }}>
                    {step.title}
                  </h3>
                  <p className="m-0 mb-4 text-sm leading-relaxed" style={{ color: MUTED }}>
                    {step.body}
                  </p>
                  <Link
                    to={href}
                    className="inline-flex text-sm font-semibold no-underline hover:underline"
                    style={{ color: OLIVE }}
                  >
                    {ctaLabel} →
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pathways */}
      <section style={{ backgroundColor: '#efe9df' }}>
        <div className="max-w-[1100px] mx-auto px-5 py-16 md:py-20">
          <Reveal>
            <p className="m-0 mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: OLIVE }}>
              Marketplace
            </p>
            <h2
              className="m-0 mb-3"
              style={{
                fontFamily: LORA,
                fontWeight: 700,
                fontSize: 'clamp(1.5rem, 3vw, 2.1rem)',
                color: INK,
              }}
            >
              Choose how you want to explore
            </h2>
            <p className="m-0 mb-8 max-w-2xl text-base leading-relaxed" style={{ color: MUTED }}>
              Whether you&apos;re buying, breeding, or scouting operations — start with the path that fits.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PATHWAYS.map((p, i) => (
              <Reveal key={p.title} delay={i * 80}>
                <Link
                  to={p.to}
                  className="group relative block overflow-hidden rounded-xl min-h-[240px] no-underline"
                >
                  <img
                    src={p.img}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(to top, rgba(44,36,28,0.92) 0%, rgba(44,36,28,0.35) 55%, rgba(44,36,28,0.15) 100%)',
                    }}
                  />
                  <div className="relative z-10 flex flex-col justify-end h-full min-h-[240px] p-5">
                    <h3 className="m-0 mb-2 text-white text-xl font-bold" style={{ fontFamily: LORA }}>
                      {p.title}
                    </h3>
                    <p className="m-0 mb-3 text-sm text-white/80 leading-relaxed">{p.body}</p>
                    <span className="text-sm font-semibold text-white">Open →</span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Featured listings */}
      <section style={{ backgroundColor: CREAM }}>
        <div className="max-w-[1100px] mx-auto px-5 py-16 md:py-20">
          <Reveal>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
              <div className="max-w-2xl">
                <p className="m-0 mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: OLIVE }}>
                  Live listings
                </p>
                <h2
                  className="m-0 mb-3"
                  style={{
                    fontFamily: LORA,
                    fontWeight: 700,
                    fontSize: 'clamp(1.5rem, 3vw, 2.1rem)',
                    color: INK,
                  }}
                >
                  Fresh from the marketplace
                </h2>
                <p className="m-0 text-base leading-relaxed" style={{ color: MUTED }}>
                  A rotating look at animals currently for sale — open any card for photos, pedigree, and seller details.
                </p>
              </div>
              <Link to="/animals" className="shrink-0 text-sm font-semibold no-underline" style={{ color: OLIVE }}>
                View all listings →
              </Link>
            </div>
          </Reveal>

          {featured.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {featured.map((animal, i) => (
                <Reveal key={animal.animal_id} delay={i * 50}>
                  <FeaturedListingCard animal={animal} />
                </Reveal>
              ))}
            </div>
          ) : (
            <Reveal>
              <div
                className="rounded-lg border px-5 py-10 text-center"
                style={{ borderColor: '#e5e0d6', backgroundColor: '#fff', color: MUTED }}
              >
                <p className="m-0 mb-4">Explore live listings on the marketplace.</p>
                <Link
                  to="/animals"
                  className="inline-flex rounded-lg px-5 py-2.5 text-sm font-semibold no-underline text-white"
                  style={{ backgroundColor: OLIVE }}
                >
                  Open Marketplace
                </Link>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* Knowledgebase */}
      <section style={{ backgroundColor: '#efe9df' }}>
        <div className="max-w-[1100px] mx-auto px-5 py-16 md:py-20">
          <Reveal>
            <p className="m-0 mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: OLIVE }}>
              Knowledgebase
            </p>
            <h2
              className="m-0 mb-3 max-w-2xl"
              style={{
                fontFamily: LORA,
                fontWeight: 700,
                fontSize: 'clamp(1.5rem, 3vw, 2.1rem)',
                color: INK,
              }}
            >
              Know the breed before you buy the animal
            </h2>
            <p className="m-0 mb-8 max-w-2xl text-base leading-relaxed" style={{ color: MUTED }}>
              Origins, traits, and farming notes for the animals that feed and work America — from cattle and sheep to alpacas, horses, and bees.
            </p>
          </Reveal>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SPECIES_SPOTLIGHT.map((s, i) => (
              <Reveal key={s.slug} delay={i * 40}>
                <Link
                  to={`/livestock/${s.slug}`}
                  className="group no-underline block relative overflow-hidden rounded-lg aspect-[4/5]"
                >
                  <img
                    src={s.img}
                    alt={s.label}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = '/images/HomepageLivestockDB.webp';
                    }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(to top, rgba(44,36,28,0.88) 0%, rgba(44,36,28,0.12) 55%, transparent 100%)',
                    }}
                  />
                  <span
                    className="absolute bottom-0 left-0 right-0 p-3 text-white text-sm font-semibold"
                    style={{ fontFamily: LORA }}
                  >
                    {s.label}
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="mt-8">
              <Link to="/livestock" className="text-sm font-semibold no-underline" style={{ color: OLIVE }}>
                Open the full knowledgebase →
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Pull quote */}
      <section className="relative overflow-hidden" style={{ backgroundColor: RUST }}>
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'url(/images/AboutUs.webp)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="relative max-w-[800px] mx-auto px-5 py-16 md:py-20 text-center">
          <Reveal>
            <p
              className="m-0 mb-6 text-white text-xl md:text-2xl leading-snug"
              style={{ fontFamily: LORA }}
            >
              “From the rugged Pacific coast to the historic shores of Plymouth — we help the people who live off the land succeed.”
            </p>
            <Link
              to="/about"
              className="inline-flex text-sm font-semibold no-underline text-white/90 border-b border-white/40 pb-0.5"
            >
              Our story →
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Community + AI */}
      <section style={{ backgroundColor: CREAM }}>
        <div className="max-w-[1100px] mx-auto px-5 py-16 md:py-20 grid grid-cols-1 gap-10 lg:grid-cols-2">
          {guest ? (
            <>
              <Reveal>
                <div
                  className="h-full rounded-xl border p-6 md:p-8"
                  style={{ borderColor: '#e5e0d6', backgroundColor: '#fff' }}
                >
                  <p className="m-0 mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: RUST }}>
                    For ranchers
                  </p>
                  <h2 className="m-0 mb-3 text-2xl font-bold" style={{ fontFamily: LORA, color: INK }}>
                    List animals. Grow your reach.
                  </h2>
                  <p className="m-0 mb-6 text-sm leading-relaxed" style={{ color: MUTED }}>
                    Create a free account to publish listings, manage animals, and put your ranch in front of serious buyers nationwide.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      to="/signup"
                      className="inline-flex rounded-lg px-5 py-2.5 text-sm font-semibold no-underline text-white loa-home-cta"
                      style={{ backgroundColor: RUST }}
                    >
                      Create free account
                    </Link>
                    <Link
                      to="/login"
                      className="inline-flex rounded-lg px-5 py-2.5 text-sm font-semibold no-underline border loa-home-cta"
                      style={{ borderColor: '#d0c8ba', color: INK }}
                    >
                      Sign in
                    </Link>
                  </div>
                </div>
              </Reveal>
              <Reveal delay={100}>
                <div
                  className="h-full rounded-xl border p-6 md:p-8 relative overflow-hidden"
                  style={{ borderColor: '#e5e0d6', backgroundColor: '#fff' }}
                >
                  <img
                    src="/images/SaigeBanner.webp"
                    alt=""
                    className="absolute right-0 top-0 w-40 h-40 object-cover opacity-30 rounded-bl-full pointer-events-none"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <p className="m-0 mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: OLIVE }}>
                    Ranch advice
                  </p>
                  <h2 className="m-0 mb-3 text-2xl font-bold" style={{ fontFamily: LORA, color: INK }}>
                    Ask Saige while you browse
                  </h2>
                  <p className="m-0 mb-6 text-sm leading-relaxed relative z-10" style={{ color: MUTED }}>
                    Practical AI for livestock questions — breed context, husbandry notes, and guidance that fits how ranchers actually work. Sign in to use Saige.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 relative z-10">
                    <img
                      src="/images/SaigeAIIcon.webp"
                      alt="Saige"
                      className="w-11 h-11 rounded-full object-cover"
                      onError={(e) => { e.currentTarget.src = '/images/SaigeIcon.png'; }}
                    />
                    <Link
                      to="/login"
                      className="inline-flex rounded-lg px-5 py-2.5 text-sm font-semibold no-underline text-white loa-home-cta"
                      style={{ backgroundColor: OLIVE }}
                    >
                      Sign in to use Saige
                    </Link>
                  </div>
                </div>
              </Reveal>
            </>
          ) : (
            <Reveal>
              <button
                type="button"
                onClick={openSaigeChat}
                className="w-full text-left h-full rounded-xl border p-6 md:p-8 relative overflow-hidden cursor-pointer loa-home-cta"
                style={{ borderColor: '#e5e0d6', backgroundColor: '#fff' }}
              >
                <img
                  src="/images/SaigeBanner.webp"
                  alt=""
                  className="absolute right-0 top-0 w-40 h-40 object-cover opacity-30 rounded-bl-full pointer-events-none"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <p className="m-0 mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: OLIVE }}>
                  Ranch advice
                </p>
                <h2 className="m-0 mb-3 text-2xl font-bold" style={{ fontFamily: LORA, color: INK }}>
                  Ask Saige while you browse
                </h2>
                <p className="m-0 mb-6 text-sm leading-relaxed relative z-10" style={{ color: MUTED }}>
                  Practical AI for livestock questions — breed context, husbandry notes, and guidance that fits how ranchers actually work.
                </p>
                <div className="flex items-center gap-3 relative z-10">
                  <img
                    src="/images/SaigeAIIcon.webp"
                    alt="Saige"
                    className="w-11 h-11 rounded-full object-cover"
                    onError={(e) => { e.currentTarget.src = '/images/SaigeIcon.png'; }}
                  />
                  <span className="text-sm font-semibold" style={{ color: INK }}>
                    Open Saige chat →
                  </span>
                </div>
              </button>
            </Reveal>
          )}
        </div>
      </section>

      {/* Events + contact strip */}
      <section style={{ backgroundColor: '#efe9df' }}>
        <div className="max-w-[1100px] mx-auto px-5 py-14 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <Reveal>
            <p className="m-0 mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: OLIVE }}>
              Events
            </p>
            <h2 className="m-0 mb-3 text-2xl font-bold" style={{ fontFamily: LORA, color: INK }}>
              Shows, sales &amp; gatherings
            </h2>
            <p className="m-0 mb-5 text-sm leading-relaxed" style={{ color: MUTED }}>
              Livestock events are coming soon. Until then, meet sellers on the marketplace and stay close to the calendar.
            </p>
            <Link to="/events" className="text-sm font-semibold no-underline" style={{ color: OLIVE }}>
              Events preview →
            </Link>
          </Reveal>
          <Reveal delay={80}>
            <div
              className="rounded-xl px-6 py-7 text-white"
              style={{ backgroundColor: '#2c241c' }}
            >
              <h3 className="m-0 mb-2 text-lg font-bold" style={{ fontFamily: LORA }}>
                Questions about listing or partnering?
              </h3>
              <p className="m-0 mb-4 text-sm text-white/70 leading-relaxed">
                We&apos;re building Livestock of America by Oatmeal AI with ranchers — reach out anytime.
              </p>
              <Link
                to="/contact-us"
                className="inline-flex rounded-lg px-5 py-2.5 text-sm font-semibold no-underline text-white loa-home-cta"
                style={{ backgroundColor: OLIVE }}
              >
                Contact Us
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />

      <style>{`
        .loa-home-hero-media {
          animation: loaHomeFade 1.2s ease-out both;
        }
        .loa-home-hero-copy {
          animation: loaHomeRise 0.95s ease-out 0.12s both;
        }
        .loa-home-cta {
          transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
        }
        .loa-home-cta:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 22px rgba(0,0,0,0.22);
        }
        .loa-home-scroll {
          animation: loaHomePulse 2.2s ease-in-out infinite;
        }
        .loa-home-scroll-line {
          transform-origin: top;
          animation: loaHomeLine 2.2s ease-in-out infinite;
        }
        .loa-reveal {
          opacity: 0;
          transform: translateY(22px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .loa-reveal-in {
          opacity: 1;
          transform: translateY(0);
        }
        @keyframes loaHomeFade {
          from { opacity: 0; transform: scale(1.05); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes loaHomeRise {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes loaHomePulse {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
        @keyframes loaHomeLine {
          0% { transform: scaleY(0.35); opacity: 0.3; }
          50% { transform: scaleY(1); opacity: 0.9; }
          100% { transform: scaleY(0.35); opacity: 0.3; }
        }
        @media (prefers-reduced-motion: reduce) {
          .loa-home-hero-media,
          .loa-home-hero-copy,
          .loa-home-scroll,
          .loa-home-scroll-line,
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
