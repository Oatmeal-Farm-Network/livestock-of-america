import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';
import { CONTACT_EMAIL } from '../config/api';

const CREAM = '#f7f2e8';
const OLIVE = '#3d6b34';
const INK = '#2c2c2c';

export default function Contact() {
  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: CREAM }}>
      <PageMeta
        title="Contact Us | Livestock of America"
        description="Get in touch with the Livestock of America team."
      />
      <Header />
      <div className="flex-1 max-w-[700px] mx-auto px-4 w-full pb-16">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Contact Us' }]} />
        <h1 className="text-3xl font-bold mt-4 mb-4" style={{ fontFamily: "'Lora', serif", color: INK }}>
          Contact Us
        </h1>
        <p className="mb-6" style={{ color: '#6b6b6b' }}>
          Questions about the livestock marketplace, knowledgebase, or your account? Reach out and our team will get back to you.
        </p>
        {CONTACT_EMAIL ? (
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-block rounded-lg px-6 py-3 text-sm font-semibold text-white no-underline"
            style={{ backgroundColor: OLIVE }}
          >
            Email {CONTACT_EMAIL}
          </a>
        ) : (
          <p style={{ color: '#888' }}>
            Contact email is not configured yet. Set <code>VITE_CONTACT_EMAIL</code> for this environment.
          </p>
        )}
      </div>
      <Footer />
    </div>
  );
}
