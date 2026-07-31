/**
 * Knowledgebases landing — Livestock of America is livestock-only.
 * Deep-links into the livestock breed knowledgebase.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';

const LORA = "'Lora', 'Times New Roman', serif";
const GREEN = '#3D6B34';

export default function Knowledgebases() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f7f2e8' }}>
      <PageMeta
        title="Livestock Knowledgebase | Livestock of America"
        description="Browse 3,000+ livestock breeds across 29 species — origins, traits, and farming guidance."
        canonical="https://livestockofamerica.com/knowledgebase"
      />
      <Header />
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Breadcrumbs
            items={[
              { label: t('nav.home', 'Home'), to: '/' },
              { label: t('phase1.nav.knowledgebase', 'Livestock Knowledgebase') },
            ]}
          />
        </div>

        <section style={{ backgroundColor: GREEN }} className="text-white">
          <div className="max-w-5xl mx-auto px-4 py-10">
            <h1 className="text-3xl md:text-4xl font-bold m-0" style={{ fontFamily: LORA }}>
              Online Livestock Knowledgebase
            </h1>
            <p className="mt-3 text-white/90 max-w-2xl leading-relaxed">
              We&apos;ve documented 3,000+ breeds across 29 species — origins, traits, and farming
              guidance in one place.
            </p>
            <Link
              to="/livestock"
              className="inline-block mt-6 rounded-lg px-6 py-3 text-sm font-semibold no-underline"
              style={{ backgroundColor: '#ffffff', color: GREEN }}
            >
              Explore livestock database →
            </Link>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 py-12 grid md:grid-cols-3 gap-6">
          {[
            { n: '3,000+', label: 'Documented breeds' },
            { n: '29', label: 'Core species' },
            { n: 'USA', label: 'Rancher-focused' },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border bg-white p-6 text-center shadow-sm"
              style={{ borderColor: '#e5e0d6' }}
            >
              <div className="text-3xl font-bold" style={{ color: GREEN, fontFamily: LORA }}>
                {s.n}
              </div>
              <div className="text-sm mt-1" style={{ color: '#6b6b6b' }}>
                {s.label}
              </div>
            </div>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
}
