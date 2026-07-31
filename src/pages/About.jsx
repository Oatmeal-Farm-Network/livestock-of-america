import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';

const About = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: '#f7f2e8' }}>
      <PageMeta
        title={t('phase1.about.meta_title', 'About Livestock of America')}
        description={t(
          'phase1.about.meta_description',
          'Livestock of America connects ranchers, buyers, and livestock professionals through a dedicated marketplace, knowledgebase, and industry directory.',
        )}
        keywords="about livestock of america, livestock marketplace, ranch directory, livestock knowledgebase"
        canonical="https://livestockofamerica.com/about"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: 'About Livestock of America',
          url: 'https://livestockofamerica.com/about',
          description: t('phase1.about.meta_description'),
        }}
      />
      <Header />

      <div className="container-fluid mx-auto px-4 flex-1" style={{ maxWidth: '1100px' }}>
        <Breadcrumbs
          items={[
            { label: t('phase1.nav.home', 'Home'), to: '/' },
            { label: t('phase1.about.title', 'About') },
          ]}
        />
        <div className="py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-6">{t('phase1.about.title', 'About Livestock of America')}</h1>
            <div className="flex justify-center mb-4">
              <img
                src="/images/loa-header-logo.webp"
                style={{ width: '280px', height: 'auto' }}
                alt="Livestock of America Logo"
              />
            </div>
            <p className="text-xl italic mb-8">
              {t(
                'phase1.about.tagline',
                'Connecting ranchers, buyers, and livestock professionals across America.',
              )}
            </p>
          </div>

          <p className="mb-4">{t('phase1.about.body1')}</p>
          <p className="mb-4">{t('phase1.about.body2')}</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">{t('phase1.about.h2_focus')}</h2>
          <p className="mb-4">{t('phase1.about.focus_body')}</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">{t('phase1.about.h2_ecosystem')}</h2>
          <p className="mb-4">{t('phase1.about.ecosystem_body')}</p>

          <ul className="list-disc ml-8 space-y-2 mb-8">
            <li>{t('phase1.about.li_marketplace')}</li>
            <li>{t('phase1.about.li_knowledgebase')}</li>
            <li>{t('phase1.about.li_directory')}</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">{t('phase1.about.h2_ready')}</h2>
          <p className="mb-4">{t('phase1.about.ready_body1')}</p>
          <p className="font-bold mb-4">{t('phase1.about.ready_body2')}</p>

          <ul className="space-y-2 mb-10">
            <li>
              <Link to="/animals" className="text-[#3D6B34] hover:underline">
                {t('phase1.about.link_marketplace', 'Livestock Marketplace')}
              </Link>
            </li>
            <li>
              <Link to="/livestock" className="text-[#3D6B34] hover:underline">
                {t('phase1.about.link_knowledgebase', 'Livestock Knowledgebase')}
              </Link>
            </li>
            <li>
              <Link to="/contact-us" className="text-[#3D6B34] hover:underline">
                {t('phase1.nav.contact', 'Contact Us')}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default About;
