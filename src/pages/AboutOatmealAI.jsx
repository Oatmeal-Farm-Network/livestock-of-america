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

/**
 * Oatmeal AI mark used as the hero watermark. Replace this file to change it —
 * nothing else needs editing. It is rendered white via a CSS filter so any
 * artwork colour reads against the dark hero gradient.
 */
const OATMEAL_AI_LOGO = '/images/Oatmeal-AI-logo-horizontal.webp';

const AGENTS = [
  { name: 'Saige', role: 'Livestock, crop, and field advisor — the assistant inside Livestock of America.' },
  { name: 'Thaiyme', role: 'Business-operations and accounting assistant for running a farm business.' },
  { name: 'Pairsley & Rosemarie', role: 'Culinary assistants for chefs, recipes, and menu planning.' },
  { name: 'Lavendir', role: 'A design assistant that helps producers build their own websites.' },
];

export default function AboutOatmealAI() {
  const { t } = useTranslation();
  const guest = !isLoggedIn();

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: CREAM }}>
      <PageMeta
        title="About Oatmeal AI | Livestock of America"
        description="Oatmeal AI is the company behind Livestock of America. It builds AI-powered platforms for farmers, ranchers, and food producers — including the Saige livestock advisor."
        keywords="oatmeal ai, about oatmeal ai, agricultural AI, livestock of america, saige ai, farm software"
        canonical="https://livestockofamerica.com/about/oatmeal-ai"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: 'About Oatmeal AI',
          url: 'https://livestockofamerica.com/about/oatmeal-ai',
          description:
            'Oatmeal AI builds AI-powered platforms for farmers, ranchers, and food producers, including Livestock of America and the Saige livestock advisor.',
        }}
      />
      <Header />

      {/* Breadcrumbs sit directly under the header on every page but Home. */}
      <div className="mx-auto w-full px-5" style={{ maxWidth: '1100px' }}>
        <Breadcrumbs
              items={[
                { label: t('phase1.nav.home', 'Home'), to: '/' },
                { label: t('phase1.about.title', 'About'), to: '/about' },
                { label: 'Oatmeal AI' },
              ]}
            />
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="relative min-h-[240px] md:min-h-[320px] flex items-end">
          {/* Centred logo behind the copy. No colour filter now that the hero
              sits on the cream page background — the artwork shows as-is. */}
          <img
            src={OATMEAL_AI_LOGO}
            alt=""
            aria-hidden
            className="pointer-events-none select-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[1000px] h-auto object-contain"
            style={{ opacity: 0.18 }}
          />
          <div className="relative z-10 w-full max-w-[1400px] mx-auto px-5 pb-10 pt-16">
            <p
              className="m-0 mb-2 text-xs font-semibold uppercase tracking-[0.14em]"
              style={{ fontFamily: LORA, color: OLIVE }}
            >
              About
            </p>
            <h1
              className="m-0 mb-3 max-w-2xl"
              style={{ fontFamily: LORA, fontWeight: 700, fontSize: 'clamp(1.85rem, 4.5vw, 2.75rem)', lineHeight: 1.15, color: INK }}
            >
              Oatmeal AI
              <span className="block text-base md:text-lg font-normal mt-1" style={{ color: MUTED }}>
                The company behind Livestock of America
              </span>
            </h1>
            <p className="m-0 text-base md:text-lg max-w-xl leading-relaxed" style={{ fontFamily: LORA, color: MUTED }}>
              Intelligence built for the barn, the field, and the farm office.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto px-5 flex-1 w-full" style={{ maxWidth: '1100px' }}>
        {/* Intro */}
        <section className="py-10 md:py-12">
          <p className="m-0 mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: OLIVE }}>
            Who we are
          </p>
          <h2
            className="m-0 mb-4 max-w-2xl"
            style={{ fontFamily: LORA, fontWeight: 700, fontSize: 'clamp(1.4rem, 2.8vw, 1.85rem)', color: INK }}
          >
            AI for the people who grow, raise, and feed
          </h2>
          <div className="max-w-3xl">
            <p className="m-0 mb-4 text-base leading-relaxed" style={{ color: INK }}>
              <strong>Oatmeal AI</strong> builds software and artificial-intelligence tools for agriculture —
              for ranchers, farmers, breeders, and food producers. We believe the people doing the hard,
              essential work of feeding the country deserve technology that actually understands their world,
              not generic apps bolted onto a farm.
            </p>
            <p className="m-0 mb-4 text-base leading-relaxed" style={{ color: MUTED }}>
              <strong>Livestock of America</strong> is one of the platforms we build. Behind it sits a broader
              family of farm and food products, and a set of AI assistants designed around real agricultural
              tasks — from identifying a breed and pricing a listing to tracking herd health and keeping the
              books.
            </p>
            <p className="m-0 text-base leading-relaxed" style={{ color: MUTED }}>
              Our assistants are grounded in your operation&apos;s context and powered by leading large-language
              models, so the guidance you get is practical and specific — the kind of answer you would expect
              from someone who has spent time around livestock and land.
            </p>
          </div>
        </section>
      </div>

    

      {/* CTA */}
      <section style={{ backgroundColor: '#efe9df' }}>
        <div className="max-w-[1100px] mx-auto px-5 py-12 md:py-14 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl">
            <h2
              className="m-0 mb-2"
              style={{ fontFamily: LORA, fontWeight: 700, fontSize: 'clamp(1.35rem, 2.5vw, 1.75rem)', color: INK }}
            >
              Built by Oatmeal AI, made for you
            </h2>
            <p className="m-0 text-sm leading-relaxed" style={{ color: MUTED }}>
              Explore what Livestock of America can do, or learn more about the platform.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              to="/animals"
              className="inline-flex rounded-lg px-5 py-2.5 text-sm font-semibold text-white no-underline"
              style={{ backgroundColor: OLIVE }}
            >
              Browse marketplace
            </Link>
            <Link
              to="/about"
              className="inline-flex rounded-lg px-5 py-2.5 text-sm font-semibold no-underline border bg-white"
              style={{ color: INK, borderColor: '#d0c8ba' }}
            >
              About Livestock of America
            </Link>
            {guest ? (
              <Link
                to="/signup"
                className="inline-flex rounded-lg px-5 py-2.5 text-sm font-semibold no-underline border bg-white"
                style={{ color: INK, borderColor: '#d0c8ba' }}
              >
                Create free account
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
