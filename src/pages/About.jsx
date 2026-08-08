import React from 'react';
import { Link } from 'react-router';
import { useTranslation } from '../lib/i18n';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';
import { isLoggedIn } from '../lib/auth';

const CREAM = '#f7f2e8';
const OLIVE = '#3d6b34';
const RUST = '#8b3a2b';
const INK = '#2c2c2c';
const MUTED = '#6b6b6b';
const LORA = "'Lora', 'Times New Roman', serif";

const PILLARS = [
  {
    title: 'Marketplace',
    body: 'List and discover animals for sale, stud services, and ranch operations across the United States.',
    to: '/animals',
    cta: 'Browse marketplace',
    img: '/images/CattleHeader.webp',
  },
  {
    title: 'Knowledgebase',
    body: 'Research breeds, origins, and husbandry notes across dozens of livestock species — built for producers, not tourists.',
    to: '/livestock',
    cta: 'Explore breeds',
    img: '/images/KBHeroLivestock.png',
  },
  {
    title: 'Directory',
    body: 'Find farms, ranches, food hubs, fiber mills, processors, and more across 29 categories of the food system.',
    to: '/directory',
    cta: 'Browse directory',
    // Same banner the /directory landing page uses for its hero.
    img: '/images/KBHeroDirectory.png',
  },
];

export default function About() {
  const { t } = useTranslation();
  const guest = !isLoggedIn();

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: CREAM }}>
      <PageMeta
        title="About Livestock of America by Oatmeal AI"
        description="Livestock of America by Oatmeal AI connects ranchers, breeders, and buyers through a dedicated livestock marketplace, breed knowledgebase, and AI tools built for the barn."
        keywords="about livestock of america, oatmeal ai, livestock marketplace, ranch directory, livestock knowledgebase, saige ai"
        canonical="https://livestockofamerica.com/about"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: 'About Livestock of America by Oatmeal AI',
          url: 'https://livestockofamerica.com/about',
          description:
            'Livestock of America by Oatmeal AI connects ranchers, breeders, and buyers through a dedicated livestock marketplace, breed knowledgebase, and AI tools.',
        }}
      />
      <Header />

      {/* Breadcrumbs sit directly under the header on every page but Home. */}
      <div className="mx-auto w-full px-5" style={{ maxWidth: '1100px' }}>
        <Breadcrumbs
              items={[
                { label: t('phase1.nav.home', 'Home'), to: '/' },
                { label: t('phase1.about.title', 'About') },
              ]}
            />
      </div>

      {/* Hero */}
      <section className="relative">
        {/* Centred hero band — the image, its gradient and the copy all sit
            inside this 1400px column rather than bleeding to the viewport. */}
        <div className="relative min-h-[260px] md:min-h-[340px] flex items-end overflow-hidden mx-auto w-full max-w-[1400px]">
          <img
            src="/images/AboutUs.webp"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '/images/home-hero-livestock.png';
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(105deg, rgba(44,36,28,0.82) 0%, rgba(44,36,28,0.5) 55%, rgba(44,36,28,0.28) 100%)',
            }}
          />
          <div className="relative z-10 w-full mx-auto px-5 pb-10 pt-16">
            <p
              className="m-0 mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/85"
              style={{ fontFamily: LORA }}
            >
              About
            </p>
            <h1
              className="m-0 mb-3 text-white max-w-2xl"
              style={{
                fontFamily: LORA,
                fontWeight: 700,
                fontSize: 'clamp(1.85rem, 4.5vw, 2.75rem)',
                lineHeight: 1.15,
              }}
            >
              Livestock of America
              <span className="block text-base md:text-lg font-normal mt-1 text-white/90">by Oatmeal AI</span>
            </h1>
            <p className="m-0 text-base md:text-lg text-white/90 max-w-xl leading-relaxed" style={{ fontFamily: LORA }}>
              Connecting ranchers, breeders, and buyers coast to coast.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto px-5 flex-1 w-full" style={{ maxWidth: '1100px' }}>
        {/* Intro */}
        <section className="py-10 md:py-12">
          <div className="flex flex-col md:flex-row md:items-start gap-8 md:gap-12">
            <div className="flex-1 min-w-0">
              <p className="m-0 mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: OLIVE }}>
                Who we are
              </p>
              <h2
                className="m-0 mb-4"
                style={{
                  fontFamily: LORA,
                  fontWeight: 700,
                  fontSize: 'clamp(1.4rem, 2.8vw, 1.85rem)',
                  color: INK,
                }}
              >
                Built for the people who keep America fed
              </h2>
              <p className="m-0 mb-4 text-base leading-relaxed" style={{ color: INK }}>
                <strong>Livestock of America</strong> is a dedicated platform for the
                livestock industry. We help ranches showcase animals online, reach buyers,
                and research breeds with confidence — all in one place.
              </p>
              <p className="m-0 mb-4 text-base leading-relaxed" style={{ color: MUTED }}>
                From cattle and sheep to alpacas, goats, horses, and bison, LOA supports breeders of
                every type. Whether you are listing a herd, looking for stud genetics, or learning
                a new breed before you buy, this is where livestock professionals meet.
              </p>
            </div>
           
          </div>
        </section>
      </div>

      {/* Pillars */}
      <section style={{ backgroundColor: '#efe9df' }}>
        <div className="max-w-[1100px] mx-auto px-5 py-12 md:py-14">
          <h2
            className="m-0 mb-12 max-w-xl"
            style={{
              fontFamily: LORA,
              fontWeight: 700,
              fontSize: 'clamp(1.4rem, 2.8vw, 1.85rem)',
              color: INK,
            }}
          >
            Marketplace and knowledge
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0">
            {PILLARS.map((pillar, i) => (
              <div
                key={pillar.title}
                className={`md:px-5 ${i > 0 ? 'md:border-l md:border-[#e0d8cc]' : 'md:pl-0'}`}
              >
                <div className="mb-4 overflow-hidden" style={{ height: 150, backgroundColor: '#ebe6dc' }}>
                  <img
                    src={pillar.img}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = '/images/HomepageLivestockDB.webp';
                    }}
                  />
                </div>
                <h3 className="m-0 mb-2 text-lg font-bold" style={{ fontFamily: LORA, color: INK }}>
                  {pillar.title}
                </h3>
                <p className="m-0 mb-4 text-sm leading-relaxed" style={{ color: MUTED }}>
                  {pillar.body}
                </p>
                <Link
                  to={pillar.to}
                  className="text-sm font-semibold no-underline hover:underline"
                  style={{ color: OLIVE }}
                >
                  {pillar.cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Oatmeal AI callout */}
      <section className="max-w-[1100px] mx-auto px-5 py-12 md:py-14 w-full">
        <div className="flex flex-col md:flex-row gap-8 md:items-center">
          <div className="flex-1 min-w-0">
            <p className="m-0 mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: RUST }}>
              Oatmeal AI
            </p>
            <h2
              className="m-0 mb-4"
              style={{
                fontFamily: LORA,
                fontWeight: 700,
                fontSize: 'clamp(1.4rem, 2.8vw, 1.85rem)',
                color: INK,
              }}
            >
              Intelligence built for agricultural work
            </h2>
            <p className="m-0 mb-4 text-base leading-relaxed" style={{ color: MUTED }}>
              Livestock of America is part of the Oatmeal AI family of farm and food platforms.
              Oatmeal AI designs assistants that understand livestock operations — from breed
              questions to marketplace decisions — so you spend less time searching and more time
              running the ranch.
            </p>
            <p className="m-0 text-base leading-relaxed" style={{ color: MUTED }}>
              Saige is your on-site livestock advisor inside LOA: ask about animals, listings, and
              herd health topics, and get clear guidance when you need it.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-4 md:w-[300px]">
            <img
              src="/images/SaigeAIIcon.webp"
              alt="Saige"
              className="w-16 h-16 rounded-full object-cover shadow"
              onError={(e) => {
                e.currentTarget.src = '/images/SaigeIcon.png';
              }}
            />
            <div>
              <p className="m-0 font-bold text-sm" style={{ color: RUST, fontFamily: LORA }}>
                Meet Saige
              </p>
              <p className="m-0 mt-1 text-xs leading-relaxed" style={{ color: MUTED }}>
                Livestock AI assistant by Oatmeal AI
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ backgroundColor: '#efe9df' }}>
        <div className="max-w-[1100px] mx-auto px-5 py-12 md:py-14 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl">
            <h2
              className="m-0 mb-2"
              style={{
                fontFamily: LORA,
                fontWeight: 700,
                fontSize: 'clamp(1.35rem, 2.5vw, 1.75rem)',
                color: INK,
              }}
            >
              Ready to join America&apos;s livestock community?
            </h2>
            <p className="m-0 text-sm leading-relaxed" style={{ color: MUTED }}>
              Create a free account to list animals, unlock full marketplace and ranch details, and
              chat with Saige.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              to={guest ? '/signup' : '/account'}
              className="inline-flex rounded-lg px-5 py-2.5 text-sm font-semibold text-white no-underline"
              style={{ backgroundColor: OLIVE }}
            >
              {guest ? 'Create free account' : 'Go to account'}
            </Link>
            <Link
              to="/animals"
              className="inline-flex rounded-lg px-5 py-2.5 text-sm font-semibold no-underline border bg-white"
              style={{ color: INK, borderColor: '#d0c8ba' }}
            >
              Browse marketplace
            </Link>
            {guest ? (
              <Link
                to="/contact-us"
                className="inline-flex rounded-lg px-5 py-2.5 text-sm font-semibold no-underline border bg-white"
                style={{ color: INK, borderColor: '#d0c8ba' }}
              >
                Contact us
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
