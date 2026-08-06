import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from '../lib/i18n';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';
import { isLoggedIn } from '../lib/auth';

const API_URL = import.meta.env.VITE_LIVESTOCK_API_URL || '';
const CREAM = '#f7f2e8';
const OLIVE = '#3d6b34';
const RUST = '#8b3a2b';
const INK = '#2c2c2c';
const MUTED = '#6b6b6b';
const LORA = "'Lora', 'Times New Roman', serif";

const SPECIES = [
  { slug: 'alpacas', label: 'Alpacas', img: '/images/Alpaca.webp', desc: 'Alpacas are soft-fleeced South American camelids raised primarily for their fiber.', group: 'mammals' },
  { slug: 'bison', label: 'Bison', img: '/images/Bison.webp', desc: 'Bison are large, shaggy North American bovines raised for lean, flavorful meat.', group: 'mammals' },
  { slug: 'buffalo', label: 'Buffalo', img: '/images/Buffalo.webp', desc: 'Buffalo are raised for their milk, meat, and as draft animals in many parts of Asia.', group: 'mammals' },
  { slug: 'camels', label: 'Camels', img: '/images/Camels.webp', desc: 'Camels are raised for milk, meat, wool, and transport in arid regions worldwide.', group: 'mammals' },
  { slug: 'cattle', label: 'Cattle', img: '/images/Cattle.webp', desc: 'Cattle are raised for beef, veal, dairy products, leather, and as draft animals.', group: 'mammals' },
  { slug: 'chickens', label: 'Chickens', img: '/images/Chicken.webp', desc: 'Chickens are the most widely kept fowl, raised for their meat and eggs.', group: 'poultry' },
  { slug: 'crocodiles', label: 'Crocodiles & Alligators', img: '/images/Alligator.webp', desc: 'Crocodilians are raised for their leather hides and meat.', group: 'specialty' },
  { slug: 'deer', label: 'Deer', img: '/images/DeerHeader.webp', desc: 'Deer are raised for their meat, antlers, and hides.', group: 'mammals' },
  { slug: 'dogs', label: 'Working Dogs', img: '/images/Dogs.webp', desc: 'Working dogs are bred and trained for specific tasks such as herding, guarding, and assistance.', group: 'specialty' },
  { slug: 'donkeys', label: 'Donkeys', img: '/images/Donkeys.webp', desc: 'Donkeys are hardy working animals used for transport, agriculture, and companionship.', group: 'mammals' },
  { slug: 'ducks', label: 'Ducks', img: '/images/Duck.webp', desc: 'Ducks are raised for their meat, eggs, and down feathers.', group: 'poultry' },
  { slug: 'emus', label: 'Emus', img: '/images/Emu.webp', desc: 'Emus are large flightless birds raised for their oil, meat, and leather.', group: 'poultry' },
  { slug: 'geese', label: 'Geese', img: '/images/Geese.webp', desc: 'Geese are raised for meat, foie gras, down feathers, and as guard animals.', group: 'poultry' },
  { slug: 'goats', label: 'Goats', img: '/images/Goats.webp', desc: 'Goats are raised for their milk, meat, fiber, and hides.', group: 'mammals' },
  { slug: 'guinea-fowl', label: 'Guinea Fowl', img: '/images/Guineafowl.webp', desc: 'Guinea fowl are prized for their delicious meat and flavorful eggs.', group: 'poultry' },
  { slug: 'honey-bees', label: 'Honey Bees', img: '/images/HoneyBees.webp', desc: 'Honey bees are kept for honey, beeswax, pollination, and other hive products.', group: 'specialty' },
  { slug: 'horses', label: 'Horses', img: '/images/cowboy2.webp', desc: 'Horses are large, powerful animals known for their speed, grace, and beauty.', group: 'mammals' },
  { slug: 'llamas', label: 'Llamas', img: '/images/Llama2.webp', desc: 'Llamas are South American camelids used as pack animals and for their fiber.', group: 'mammals' },
  { slug: 'musk-ox', label: 'Musk Ox', img: '/images/muskox.webp', desc: 'The musk ox is a large Arctic-dwelling mammal known for its shaggy coat and qiviut fiber.', group: 'mammals' },
  { slug: 'ostriches', label: 'Ostriches', img: '/images/Ostrich.webp', desc: 'Ostriches are the largest bird in the world, raised for meat, leather, feathers, and eggs.', group: 'poultry' },
  { slug: 'pheasants', label: 'Pheasants', img: '/images/Pheasant.webp', desc: 'Pheasants are widely kept for hunting and as ornamental birds.', group: 'poultry' },
  { slug: 'pigs', label: 'Pigs', img: '/images/Pig.webp', desc: 'Pigs are raised for their meat and are one of the most commonly farmed animals in the world.', group: 'mammals' },
  { slug: 'pigeons', label: 'Pigeons', img: '/images/Pigeon.webp', desc: 'Pigeons are raised for their meat, known as squab, considered a delicacy worldwide.', group: 'poultry' },
  { slug: 'quails', label: 'Quails', img: '/images/Quail.webp', desc: 'Quails are small game birds prized for their delicate, rich, and gamey flavor.', group: 'poultry' },
  { slug: 'rabbits', label: 'Rabbits', img: '/images/Rabitts.webp', desc: 'Rabbits are kept as pets, for their fur, and for their meat.', group: 'specialty' },
  { slug: 'sheep', label: 'Sheep', img: '/images/Sheepbreeds.webp', desc: 'Sheep are raised for their wool, meat (lamb), and milk.', group: 'mammals' },
  { slug: 'snails', label: 'Snails', img: '/images/Snail.webp', desc: 'Snails have been eaten for millennia and are consumed as a delicacy in many cultures.', group: 'specialty' },
  { slug: 'turkeys', label: 'Turkeys', img: '/images/Turkey.webp', desc: 'Turkeys are large ground-dwelling birds raised for their meat, a staple of holiday meals.', group: 'poultry' },
  { slug: 'yaks', label: 'Yaks', img: '/images/YakHeader.webp', desc: 'Yaks are large, hardy animals well-adapted to high, cold mountains of Central Asia.', group: 'mammals' },
];

const POPULAR = ['cattle', 'sheep', 'horses', 'goats', 'chickens', 'pigs', 'alpacas', 'bison'];
const GROUPS = [
  { id: 'all', label: 'All species' },
  { id: 'mammals', label: 'Mammals' },
  { id: 'poultry', label: 'Poultry' },
  { id: 'specialty', label: 'Specialty' },
];
const SINGLE_BREED_SLUGS = new Set(['emus', 'ostriches']);
const EAGER_COUNT = 4;

function speciesTarget(slug) {
  return SINGLE_BREED_SLUGS.has(slug) ? `/livestock/${slug}/about` : `/livestock/${slug}`;
}

function useInView() {
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
      { threshold: 0.1 },
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
      className={`loa-kb-reveal ${visible ? 'loa-kb-reveal-in' : ''} ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
}

export default function LivestockDB() {
  const { t } = useTranslation();
  const [counts, setCounts] = useState({});
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('');
  const [group, setGroup] = useState('all');

  useEffect(() => {
    window.scrollTo(0, 0);
    fetch(`${API_URL}/api/livestock/counts`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((data) => {
        setCounts(data.counts || {});
        setTotal(data.total || 0);
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return SPECIES.filter((s) => {
      if (group !== 'all' && s.group !== group) return false;
      if (!q) return true;
      const slugKey = s.slug.replace(/-/g, '_');
      const label = t(`livestock_db.species_${slugKey}_label`, s.label);
      const desc = t(`livestock_db.species_${slugKey}_desc`, s.desc);
      return label.toLowerCase().includes(q) || desc.toLowerCase().includes(q) || s.slug.includes(q);
    });
  }, [filter, group, t]);

  const breedLabel = total > 0 ? total.toLocaleString() : '2,500+';
  const popularSpecies = SPECIES.filter((s) => POPULAR.includes(s.slug));
  const guest = !isLoggedIn();
  const firstName = typeof window !== 'undefined' ? localStorage.getItem('first_name') || '' : '';

  const searchForm = (
    <form
      className="flex flex-col sm:flex-row gap-3 mb-5"
      onSubmit={(e) => e.preventDefault()}
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
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search species, breeds, or livestock…"
          className="w-full rounded-lg pl-10 pr-4 py-3 text-sm border border-black/10 bg-white focus:outline-none focus:ring-2 focus:ring-[#3D6B34]/30 shadow-sm"
          style={{ color: INK }}
        />
      </div>
      <button
        type="submit"
        className="shrink-0 inline-flex items-center justify-center px-6 py-3 rounded-lg text-sm font-bold text-white shadow-sm"
        style={{ background: OLIVE }}
      >
        Search
      </button>
    </form>
  );

  const groupChips = (
    <div className="flex flex-wrap gap-2">
      {GROUPS.map((g) => {
        const active = group === g.id;
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => setGroup(g.id)}
            className="rounded-full px-3.5 py-1.5 text-xs font-semibold border cursor-pointer transition-colors"
            style={{
              backgroundColor: active ? OLIVE : '#fff',
              color: active ? '#fff' : INK,
              borderColor: active ? OLIVE : '#e0d8cc',
            }}
          >
            {g.label}
          </button>
        );
      })}
    </div>
  );

  const speciesGrid = (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        {filtered.map((s, index) => {
          const count = counts[s.slug] || 0;
          const slugKey = s.slug.replace(/-/g, '_');
          const target = speciesTarget(s.slug);
          const card = (
            <article
              className="flex bg-white rounded-xl overflow-hidden border h-full group transition-shadow hover:shadow-md"
              style={{ borderColor: '#e5e0d6' }}
            >
              <Link
                to={target}
                className="shrink-0 overflow-hidden relative"
                style={{ width: guest ? '148px' : '120px', minHeight: guest ? '148px' : '120px' }}
              >
                <img
                  src={s.img}
                  alt={t(`livestock_db.species_${slugKey}_label`, s.label)}
                  width={guest ? 148 : 120}
                  height={guest ? 148 : 120}
                  loading={index < EAGER_COUNT ? 'eager' : 'lazy'}
                  decoding={index < EAGER_COUNT ? 'sync' : 'async'}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = '/images/HomepageLivestockDB.webp';
                  }}
                />
              </Link>

              <div className="flex flex-col justify-between px-4 sm:px-5 py-4 flex-1 min-w-0">
                <div>
                  <Link
                    to={target}
                    className="font-bold text-sm no-underline hover:underline"
                    style={{ color: OLIVE, fontFamily: LORA }}
                  >
                    {t(`livestock_db.species_${slugKey}_label`, s.label)}
                  </Link>
                  <p className="text-xs font-semibold mt-0.5 mb-2 m-0" style={{ color: '#819360' }}>
                    {count > 0
                      ? t('livestock_db.breed_count', { count: count.toLocaleString() })
                      : '—'}
                  </p>
                  <p className="text-xs leading-relaxed m-0 line-clamp-3" style={{ color: MUTED }}>
                    {t(`livestock_db.species_${slugKey}_desc`, s.desc)}
                  </p>
                </div>
                <div className="mt-3">
                  <Link
                    to={target}
                    className="text-xs font-bold no-underline hover:underline"
                    style={{ color: OLIVE }}
                  >
                    {t('livestock_db.explore_arrow', 'Explore breeds →')}
                  </Link>
                </div>
              </div>
            </article>
          );

          if (guest) {
            return (
              <Reveal key={s.slug} delay={Math.min(index * 35, 280)}>
                {card}
              </Reveal>
            );
          }
          return <div key={s.slug}>{card}</div>;
        })}
      </div>

      {filtered.length === 0 && (
        <div
          className="rounded-xl border bg-white p-12 text-center mt-4"
          style={{ borderColor: '#e5e0d6', color: MUTED }}
        >
          No species match your search.
          <div className="mt-3">
            <button
              type="button"
              onClick={() => {
                setFilter('');
                setGroup('all');
              }}
              className="text-sm font-semibold border-0 bg-transparent cursor-pointer"
              style={{ color: OLIVE }}
            >
              Clear filters
            </button>
          </div>
        </div>
      )}
    </>
  );

  /* ── Customer (logged-in) knowledgebase ── */
  if (!guest) {
    return (
      <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: CREAM }}>
        <PageMeta
          title="Knowledgebase | Livestock of America"
          description="Research livestock breeds, traits, and farming notes."
          noIndex
        />

        <div className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-6 md:py-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
              <p className="m-0 mb-1 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: OLIVE }}>
                Breed research
              </p>
              <h1
                className="m-0 text-2xl md:text-3xl font-bold"
                style={{ fontFamily: LORA, color: INK }}
              >
                Livestock knowledgebase
              </h1>
              <p className="m-0 mt-1 text-sm" style={{ color: MUTED }}>
                {firstName ? `Welcome back, ${firstName}. ` : ''}
                Research breeds before you buy — {breedLabel} breeds across {SPECIES.length} species.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0 text-sm">
              <span
                className="inline-flex rounded-lg border bg-white px-3 py-2 font-semibold"
                style={{ borderColor: '#e5e0d6', color: INK }}
              >
                {breedLabel} breeds
              </span>
              <Link
                to="/animals"
                className="inline-flex rounded-lg px-4 py-2.5 text-sm font-semibold no-underline text-white"
                style={{ backgroundColor: OLIVE }}
              >
                Open marketplace
              </Link>
            </div>
          </div>

          {searchForm}

          <div className="mb-5">
            <p className="m-0 mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: OLIVE }}>
              Popular species
            </p>
            <div className="flex flex-wrap gap-2">
              {popularSpecies.map((s) => (
                <Link
                  key={s.slug}
                  to={speciesTarget(s.slug)}
                  className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs font-semibold no-underline"
                  style={{ borderColor: '#e0d8cc', color: INK }}
                >
                  <img
                    src={s.img}
                    alt=""
                    className="w-5 h-5 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/images/HomepageLivestockDB.webp';
                    }}
                  />
                  {s.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <p className="m-0 text-sm" style={{ color: MUTED }}>
              Showing {filtered.length} of {SPECIES.length} species
            </p>
            {groupChips}
          </div>

          {speciesGrid}
        </div>
      </div>
    );
  }

  /* ── Public marketing knowledgebase ── */
  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: CREAM }}>
      <PageMeta
        title="Livestock Database | 2,000+ Breeds Across 29 Species"
        description="Explore over 2,000 livestock breeds across 29 species including cattle, pigs, sheep, goats, chickens, alpacas, and more. Find breed characteristics, origins, and farming information."
        keywords="livestock database, livestock breeds, cattle breeds, sheep breeds, alpaca breeds, farm animal encyclopedia"
        canonical="https://livestockofamerica.com/livestock"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Livestock Database',
          url: 'https://livestockofamerica.com/livestock',
          description: 'Comprehensive livestock breed database covering 29 species.',
        }}
      />
      <Header />

      <div className="mx-auto px-4 pt-2 md:pt-6" style={{ maxWidth: '1300px' }}>
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'Livestock Database' },
          ]}
        />
      </div>

      <section className="relative overflow-hidden">
        <div className="relative min-h-[280px] md:min-h-[380px] flex items-end">
          <img
            src="/images/KBHeroLivestock.png"
            alt="Online Livestock Knowledgebase"
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            onError={(e) => {
              e.currentTarget.src = '/images/HomepageLivestockDB.webp';
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(105deg, rgba(44,36,28,0.82) 0%, rgba(44,36,28,0.5) 55%, rgba(44,36,28,0.28) 100%)',
            }}
          />
          <div className="relative z-10 w-full max-w-[1300px] mx-auto px-5 pb-10 pt-16 md:pb-14 md:pt-20">
            <p
              className="m-0 mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/85"
              style={{ fontFamily: LORA }}
            >
              Knowledgebase
            </p>
            <h1
              className="m-0 mb-3 text-white max-w-2xl"
              style={{
                fontFamily: LORA,
                fontWeight: 700,
                fontSize: 'clamp(1.85rem, 4.5vw, 3rem)',
                lineHeight: 1.12,
              }}
            >
              {t('livestock_db.title', 'Online Livestock Knowledgebase')}
            </h1>
            <p className="m-0 max-w-xl text-sm md:text-base text-white/90 leading-relaxed">
              {total > 0
                ? `We've documented ${breedLabel} breeds across ${SPECIES.length} species — origins, traits, and farming guidance in one place.`
                : `We've documented 2,500+ breeds across ${SPECIES.length} species — origins, traits, and farming guidance in one place.`}
            </p>
          </div>
        </div>
      </section>

      <section style={{ backgroundColor: '#efe9df' }}>
        <div className="max-w-[1300px] mx-auto px-5 py-8 md:py-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <p
            className="m-0 text-base md:text-lg italic max-w-lg leading-snug"
            style={{ fontFamily: LORA, color: OLIVE }}
          >
            “the Catalog of nature is never finished, only expanded by those who observe.”
          </p>
          <div className="flex flex-wrap gap-10 md:gap-14">
            <div>
              <p className="m-0 text-3xl md:text-4xl font-bold" style={{ fontFamily: LORA, color: OLIVE }}>
                {breedLabel}
              </p>
              <p className="m-0 mt-1 text-xs" style={{ color: MUTED }}>Documented breeds</p>
            </div>
            <div>
              <p className="m-0 text-3xl md:text-4xl font-bold" style={{ fontFamily: LORA, color: RUST }}>
                {SPECIES.length}
              </p>
              <p className="m-0 mt-1 text-xs" style={{ color: MUTED }}>Livestock species</p>
            </div>
            <div>
              <p className="m-0 text-3xl md:text-4xl font-bold" style={{ fontFamily: LORA, color: RUST }}>
                A–Z
              </p>
              <p className="m-0 mt-1 text-xs" style={{ color: MUTED }}>Browse by letter on each species</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1300px] mx-auto px-5 py-10 md:py-14">
        <Reveal>{searchForm}</Reveal>

        <Reveal delay={60}>
          <div className="mb-8">
            <p className="m-0 mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: OLIVE }}>
              Popular species
            </p>
            <div className="flex flex-wrap gap-2">
              {popularSpecies.map((s) => (
                <Link
                  key={s.slug}
                  to={speciesTarget(s.slug)}
                  className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs font-semibold no-underline transition-shadow hover:shadow-sm"
                  style={{ borderColor: '#e0d8cc', color: INK }}
                >
                  <img
                    src={s.img}
                    alt=""
                    className="w-5 h-5 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/images/HomepageLivestockDB.webp';
                    }}
                  />
                  {s.label}
                </Link>
              ))}
            </div>
          </div>
        </Reveal>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5">
          <div>
            <h2
              className="m-0 mb-1 text-xl md:text-2xl font-bold"
              style={{ fontFamily: LORA, color: OLIVE }}
            >
              {t('livestock_db.species_heading', 'Browse by species')}
            </h2>
            <p className="m-0 text-sm" style={{ color: MUTED }}>
              Showing {filtered.length} of {SPECIES.length} species
            </p>
          </div>
          {groupChips}
        </div>

        {speciesGrid}
      </div>

      <Footer />

      <style>{`
        .loa-kb-reveal {
          opacity: 0;
          transform: translateY(18px);
          transition: opacity 0.65s ease, transform 0.65s ease;
        }
        .loa-kb-reveal-in {
          opacity: 1;
          transform: translateY(0);
        }
        @media (prefers-reduced-motion: reduce) {
          .loa-kb-reveal {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}
