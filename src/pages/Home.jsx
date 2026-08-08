import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from '../lib/i18n';
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

/** Closing section: the rest of the site beyond the marketplace. */
const EXPLORE = [
  {
    title: 'News Feed',
    body: 'Market movements, policy, weather, and industry stories that affect what you raise and what it sells for — gathered in one place so you are not chasing a dozen sources.',
    to: '/news',
    cta: 'Read the news feed',
    img: '/images/home-news-feed.svg',
  },
  {
    title: 'Knowledgebase',
    body: 'Origins, traits, temperament, and husbandry notes for thousands of documented breeds across 29 species — worth reading before you buy an animal, not after.',
    to: '/livestock',
    cta: 'Explore breeds',
    img: '/images/KBHeroLivestock.png',
  },
  {
    title: 'Directory',
    body: 'Farms, ranches, food hubs, fiber mills, processors, veterinarians, and more across 29 categories of the food system — find the businesses behind the supply chain.',
    to: '/directory',
    cta: 'Browse the directory',
    img: '/images/KBHeroDirectory.png',
  },
];

function money(n) {
  if (n == null || Number.isNaN(Number(n))) return null;
  return `$${Math.round(Number(n)).toLocaleString()}`;
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
            Learn More
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
  const { t } = useTranslation();
  const [featured, setFeatured] = useState({ for_sale: null, stud: null });

  useEffect(() => {
    let cancelled = false;
    fetch(endpoints.homepageFeatured())
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setFeatured({
          for_sale: data.for_sale || null,
          stud: data.stud || null,
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen font-sans flex flex-col relative">
      <PageMeta
        title="Livestock of America by Oatmeal AI | Connecting Ranches Across the United States"
        description="Featured livestock for sale and championship stud breeding services from ranchers and breeders across America."
        keywords="livestock of america, oatmeal ai, livestock marketplace, livestock for sale, stud services, ranchers, breeders"
        canonical="https://livestockofamerica.com/"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Livestock of America by Oatmeal AI',
          url: 'https://livestockofamerica.com/',
          description: 'Connecting ranchers, buyers, and livestock professionals across the United States.',
        }}
      />
      <Header />

      {/* Flag band sits under the header, behind the banner and first section.
          `main` is lifted to z-10 so the content stacks above it. */}
      <main className="relative flex-1">
        <FlagBackdrop />
        <div className="relative z-10 max-w-[1100px] mx-auto px-5 pt-6 pb-16">
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

          {/* Marketplace intro — moved here from /animals */}
          <Reveal>
            <section className="pt-8">
              <h1
                className="m-0 mb-3 text-center font-bold"
                style={{ fontFamily: LORA, fontSize: 'clamp(1.35rem, 2.6vw, 1.85rem)', color: INK }}
              >
                {t('livestock_mkt.title')}
              </h1>
              <p className="m-0 mb-2 text-[0.9rem] leading-relaxed" style={{ color: '#333' }}>
                {t('livestock_mkt.intro1')}
              </p>
              <p className="m-0 mb-4 text-[0.9rem] leading-relaxed" style={{ color: '#333' }}>
                {t('livestock_mkt.intro2')}
              </p>
              <Link to="/signup" className="regsubmit2">{t('livestock_mkt.join_now')}</Link>
            </section>
          </Reveal>

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

      {/* Breed associations and registries */}
      <section style={{ backgroundColor: CREAM }}>
        <div className="max-w-[1100px] mx-auto px-5 py-12 md:py-14">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_minmax(0,420px)] gap-8 md:gap-12 items-center">
            <Reveal>
              <p
                className="m-0 mb-2 text-[10px] font-bold uppercase"
                style={{ color: OLIVE, letterSpacing: '0.14em' }}
              >
                Breed associations
              </p>
              <h2
                className="m-0 mb-3"
                style={{
                  fontFamily: LORA,
                  fontWeight: 700,
                  fontSize: 'clamp(1.35rem, 2.6vw, 1.85rem)',
                  color: INK,
                }}
              >
                The registries behind the bloodlines
              </h2>
              <p className="m-0 mb-4 text-sm leading-relaxed" style={{ color: MUTED }}>
                Breed associations keep the herd books, set the standards, and certify the
                pedigrees that give an animal its provenance. They run the shows and sales,
                publish the genetic evaluations breeders rely on, and connect newcomers to
                established producers.
              </p>
              <p className="m-0 mb-6 text-sm leading-relaxed" style={{ color: MUTED }}>
                Whether you are registering your first animal, verifying a pedigree before
                a purchase, or looking for the association that governs your breed, the
                directory lists agricultural associations across the country.
              </p>
              <Link
                to="/directory/agricultural-associations"
                className="inline-flex items-center rounded-md px-5 py-2.5 text-xs font-bold uppercase no-underline text-white loa-home-cta"
                style={{ backgroundColor: OLIVE, letterSpacing: '0.09em' }}
              >
                Browse Associations
              </Link>
            </Reveal>

            <Reveal delay={100}>
              <div
                className="overflow-hidden rounded-lg border"
                style={{ borderColor: LINE, backgroundColor: '#ebe6dc' }}
              >
                <img
                  src="/images/AgriculturalAssociations.webp"
                  alt="Agricultural and breed associations"
                  loading="lazy"
                  className="w-full h-auto object-cover"
                  style={{ maxHeight: 260 }}
                  onError={(e) => { e.currentTarget.src = '/images/AgricuturalAssociationsHeader.webp'; }}
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Beyond the marketplace — news, breed research, and the directory. */}
      <section style={{ backgroundColor: '#efe9df' }}>
        <div className="max-w-[1100px] mx-auto px-5 py-12 md:py-14">
          <Reveal>
            <h2
              className="m-0 mb-1.5"
              style={{
                fontFamily: LORA,
                fontWeight: 700,
                fontSize: 'clamp(1.35rem, 2.6vw, 1.85rem)',
                color: INK,
              }}
            >
              More than a marketplace
            </h2>
            <p className="m-0 mb-8 max-w-2xl text-[13px] leading-relaxed" style={{ color: MUTED }}>
              Livestock of America also keeps you current on the industry, deep on the breeds,
              and connected to the businesses that make up the food system.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0">
            {EXPLORE.map((item, i) => (
              <Reveal
                key={item.title}
                delay={i * 80}
                className={`md:px-5 ${i > 0 ? 'md:border-l md:border-[#e0d8cc]' : 'md:pl-0'}`}
              >
                <div className="mb-4 overflow-hidden rounded-lg" style={{ height: 150, backgroundColor: '#ebe6dc' }}>
                  <img
                    src={item.img}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = '/images/HomepageLivestockDB.webp'; }}
                  />
                </div>
                <h3 className="m-0 mb-2 text-lg font-bold" style={{ fontFamily: LORA, color: INK }}>
                  {item.title}
                </h3>
                <p className="m-0 mb-4 text-sm leading-relaxed" style={{ color: MUTED }}>
                  {item.body}
                </p>
                <Link
                  to={item.to}
                  className="text-sm font-semibold no-underline hover:underline"
                  style={{ color: OLIVE }}
                >
                  {item.cta} →
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

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
