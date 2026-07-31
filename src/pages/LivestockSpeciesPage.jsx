import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';
import { endpoints } from '../config/api';

const CREAM = '#f7f2e8';
const OLIVE = '#3d6b34';
const INK = '#2c2c2c';

export default function LivestockSpeciesPage() {
  const { slug = 'cattle' } = useParams();
  const [breeds, setBreeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const label = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(endpoints.species(slug))
      .then(async (r) => {
        if (!r.ok) throw new Error(`Failed to load ${label}`);
        return r.json();
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.breeds || data?.items || [];
        setBreeds(list);
      })
      .catch((e) => setError(e.message || 'Unable to load breeds'))
      .finally(() => setLoading(false));
  }, [slug, label]);

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: CREAM }}>
      <PageMeta title={`${label} Breeds | Livestock of America`} description={`Browse ${label} breeds.`} />
      <Header />
      <div className="flex-1 max-w-[1100px] mx-auto px-4 w-full pb-16">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'Livestock Knowledgebase', to: '/livestock' },
            { label },
          ]}
        />
        <h1 className="text-3xl font-bold mt-4 mb-6" style={{ fontFamily: "'Lora', serif", color: INK }}>
          {label} Breeds
        </h1>
        {loading && <p style={{ color: '#888' }}>Loading…</p>}
        {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {breeds.map((b) => {
              const id = b.BreedID || b.breed_id || b.id;
              const name = b.Breed || b.breed || b.name || 'Breed';
              return (
                <div
                  key={id || name}
                  className="rounded-lg bg-white border border-[#e5e0d6] px-4 py-3"
                >
                  <div className="font-semibold" style={{ color: OLIVE }}>{name}</div>
                  {b.Origin || b.origin ? (
                    <div className="text-xs mt-1" style={{ color: '#777' }}>{b.Origin || b.origin}</div>
                  ) : null}
                </div>
              );
            })}
            {breeds.length === 0 && (
              <p style={{ color: '#888' }}>No breeds found for this species yet.</p>
            )}
          </div>
        )}
        <div className="mt-8">
          <Link to="/livestock" style={{ color: OLIVE }}>← Back to knowledgebase</Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
