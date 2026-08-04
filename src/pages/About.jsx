import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';

const CREAM = '#f7f2e8';
const OLIVE = '#3D6B34';
const RUST = '#8b3a2b';
const INK = '#2c2c2c';
const MUTED = '#6b6b6b';
const LORA = "'Lora', 'Times New Roman', serif";

export default function About() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: CREAM }}>
      <PageMeta
        title="About Livestock of America"
        description="Livestock of America connects ranchers, buyers, and livestock professionals through a dedicated marketplace, knowledgebases, news, and AI-powered tools."
        keywords="about livestock of america, livestock marketplace, ranch directory, livestock knowledgebase, agricultural AI"
        canonical="https://livestockofamerica.com/about"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: 'About Livestock of America',
          url: 'https://livestockofamerica.com/about',
          description:
            'Livestock of America connects ranchers, buyers, and livestock professionals through a dedicated marketplace, knowledgebases, news, and AI-powered tools.',
        }}
      />
      <Header />

      <div className="mx-auto px-4 flex-1 w-full" style={{ maxWidth: '1100px' }}>
        <Breadcrumbs
          items={[
            { label: t('phase1.nav.home', 'Home'), to: '/' },
            { label: t('phase1.about.title', 'About') },
          ]}
        />

        <div className="py-8 pb-16">
          <div className="text-center">
            <h1
              className="mb-6"
              style={{
                fontFamily: LORA,
                fontWeight: 700,
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                color: INK,
              }}
            >
              About Livestock of America
            </h1>
            <div className="flex justify-center mb-4">
              <img
                src="/images/loa-header-logo.png"
                style={{ width: '280px', height: 'auto' }}
                alt="Livestock of America Logo"
              />
            </div>
            <p className="text-xl italic mb-8" style={{ color: MUTED, fontFamily: LORA }}>
              Connecting ranchers, breeders, and buyers across the United States.
            </p>
          </div>

          <div className="block overflow-hidden">
            <img
              src="/images/AboutUs.webp"
              className="md:float-right m-4 rounded-lg shadow-md max-w-sm w-full"
              alt="Livestock of America community"
              onError={(e) => {
                e.target.src = '/images/LOAwebbanner1898x360.webp';
              }}
            />

            <p className="mb-4 leading-relaxed" style={{ color: INK }}>
              Livestock of America is a dedicated platform for the livestock industry. We help
              ranches showcase animals online, connect with serious buyers, and share breed
              knowledge through a comprehensive livestock knowledgebase — alongside plant and
              ingredient resources for the broader farm and food community.
            </p>
            <p className="mb-4 leading-relaxed" style={{ color: INK }}>
              From cattle and sheep to alpacas and bison, Livestock of America supports breeders of
              every type — helping the people who live off the land reach new markets, research
              breeds with confidence, and grow their operations nationwide.
            </p>

            <h2
              className="text-2xl font-bold mt-10 mb-4 clear-both"
              style={{ fontFamily: LORA, color: OLIVE }}
            >
              Built for Livestock Professionals
            </h2>
            <p className="mb-4 leading-relaxed" style={{ color: INK }}>
              Whether you are listing stud animals, marketing a herd, researching breeds, or
              exploring plant and ingredient knowledge, Livestock of America gives you the tools to
              connect with buyers, ranchers, and industry partners across the country.
            </p>

            {/* AI section with image */}
            <h2
              className="text-2xl font-bold mt-10 mb-4"
              style={{ fontFamily: LORA, color: OLIVE }}
            >
              AI That Works for Agriculture
            </h2>
            <div className="block overflow-hidden mb-6">
              <img
                src="/images/SaigeBanner.webp"
                alt="Livestock of America AI advisor"
                className="md:float-left md:mr-6 mb-4 rounded-xl shadow-md w-full md:w-[320px] object-cover"
                style={{ maxHeight: 220 }}
                onError={(e) => {
                  e.target.src = '/images/SaigeAIIcon.webp';
                }}
              />
              <p className="mb-3 leading-relaxed" style={{ color: INK }}>
                Livestock of America brings practical AI into the livestock and farm workflow —
                helping you answer questions faster, explore knowledgebases more easily, and make
                better decisions about animals, breeds, and operations.
              </p>
              <p className="mb-3 leading-relaxed" style={{ color: INK }}>
                Our AI tools are built for real agricultural work: clear answers, breed and market
                context, and support that fits how ranchers and buyers actually operate — not
                generic chat, but guidance grounded in farm and livestock knowledge.
              </p>
              <div className="flex items-center gap-3 mt-4 mb-2">
                <img
                  src="/images/SaigeAIIcon.webp"
                  alt="Saige AI"
                  className="w-12 h-12 rounded-full object-cover shadow"
                  onError={(e) => {
                    e.target.src = '/images/SaigeIcon.png';
                  }}
                />
                <div>
                  <div className="font-bold text-sm" style={{ color: RUST }}>
                    AI advisors for livestock & farm decisions
                  </div>
                  <div className="text-xs" style={{ color: MUTED }}>
                    Ask questions. Get practical answers. Stay focused on your operation.
                  </div>
                </div>
              </div>
            </div>

            <h2
              className="text-2xl font-bold mt-10 mb-4 clear-both"
              style={{ fontFamily: LORA, color: OLIVE }}
            >
              Marketplace, Knowledgebases & News
            </h2>
            <p className="mb-4 leading-relaxed" style={{ color: INK }}>
              Livestock of America brings together the essential resources for the livestock
              community:
            </p>
            <ul className="list-disc ml-8 space-y-2 mb-8" style={{ color: INK }}>
              <li>
                <strong>Livestock Marketplace:</strong> Showcase and sell animals to a nationwide
                audience of serious buyers — including stud services and ranch discovery.
              </li>
              <li>
                <strong>Knowledgebases:</strong> Explore livestock breeds, plant varieties, and
                ingredients in one place — the same depth of agricultural knowledge you expect from
                a serious industry platform.
              </li>
              <li>
                <strong>News Feed:</strong> Stay current with markets, weather, policy, AgTech, and
                livestock headlines that matter to producers.
              </li>
              <li>
                <strong>AI guidance:</strong> Use AI-powered tools to navigate knowledge faster and
                support day-to-day ranch and farm decisions.
              </li>
            </ul>

            <h2
              className="text-2xl font-bold mt-10 mb-4"
              style={{ fontFamily: LORA, color: OLIVE }}
            >
              Ready to Get Started?
            </h2>
            <p className="mb-4 leading-relaxed" style={{ color: INK }}>
              Join Livestock of America to list animals, explore knowledgebases, follow industry
              news, and connect with buyers across the country.
            </p>
            <p className="font-bold mb-6" style={{ color: INK }}>
              Create a free account today and become part of America&apos;s livestock community.
            </p>

            <ul className="space-y-2 mb-4">
              <li>
                <Link to="/animals" className="font-semibold hover:underline" style={{ color: OLIVE }}>
                  Browse the Livestock Marketplace
                </Link>
              </li>
              <li>
                <Link to="/livestock" className="font-semibold hover:underline" style={{ color: OLIVE }}>
                  Explore the Livestock Knowledgebase
                </Link>
              </li>
              <li>
                <Link to="/plant-knowledgebase" className="font-semibold hover:underline" style={{ color: OLIVE }}>
                  Explore the Plant Knowledgebase
                </Link>
              </li>
              <li>
                <Link to="/ingredient-knowledgebase" className="font-semibold hover:underline" style={{ color: OLIVE }}>
                  Explore the Ingredient Knowledgebase
                </Link>
              </li>
              <li>
                <Link to="/news" className="font-semibold hover:underline" style={{ color: OLIVE }}>
                  Read the News Feed
                </Link>
              </li>
              <li>
                <Link to="/contact-us" className="font-semibold hover:underline" style={{ color: OLIVE }}>
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/signup" className="font-semibold hover:underline" style={{ color: OLIVE }}>
                  Create a free account
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
