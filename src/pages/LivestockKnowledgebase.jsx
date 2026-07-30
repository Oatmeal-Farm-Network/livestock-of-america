import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';
import { endpoints } from '../config/api';

const CREAM = '#f7f2e8';
const OLIVE = '#3d6b34';
const INK = '#2c2c2c';

/** Species shown on LOA breed knowledgebase (matches marketplace slugs). */
const SPECIES = [
  { slug: 'cattle', label: 'Cattle' },
  { slug: 'horses', label: 'Horses' },
  { slug: 'goats', label: 'Goats' },
  { slug: 'sheep', label: 'Sheep' },
  { slug: 'pigs', label: 'Pigs' },
  { slug: 'chickens', label: 'Chickens' },
  { slug: 'alpacas', label: 'Alpacas' },
  { slug: 'llamas', label: 'Llamas' },
  { slug: 'donkeys', label: 'Donkeys' },
  { slug: 'bison', label: 'Bison' },
];

export default function LivestockKnowledgebase() {
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    fetch(endpoints.counts())
      .then((r) => (r.ok ? r.json() : null))
      .then(setCounts)
      .catch(() => setCounts(null));
  }, []);

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: CREAM }}>
      <PageMeta
        title="Livestock Knowledgebase | Livestock of America"
        description="Browse livestock breeds and species knowledge across America."
      />
      <Header />
      <div className="flex-1 max-w-[1100px] mx-auto px-4 w-full pb-16">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'Livestock Knowledgebase' },
          ]}
        />
        <h1
          className="text-3xl md:text-4xl font-bold mt-4 mb-2"
          style={{ fontFamily: "'Lora', serif", color: INK }}
        >
          Livestock Knowledgebase
        </h1>
        <p className="mb-8" style={{ color: '#6b6b6b' }}>
          Explore breed information for livestock species. Select a species to browse breeds.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {SPECIES.map((sp) => {
            const count =
              counts && (counts[sp.slug] ?? counts[sp.label] ?? counts[sp.slug.replace(/-/g, '_')]);
            return (
              <Link
                key={sp.slug}
                to={`/livestock/${sp.slug}`}
                className="rounded-xl bg-white border border-[#e5e0d6] p-5 no-underline shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="font-bold text-lg mb-1" style={{ color: OLIVE }}>
                  {sp.label}
                </div>
                <div className="text-xs" style={{ color: '#888' }}>
                  {count != null ? `${count} breeds` : 'View breeds'}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
}
