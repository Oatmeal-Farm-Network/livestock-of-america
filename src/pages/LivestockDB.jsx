import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';
import KnowledgebaseLandingHero from '../components/KnowledgebaseLandingHero';

const API_URL = import.meta.env.VITE_LIVESTOCK_API_URL || '';

const SPECIES = [
  { slug: 'alpacas',           label: 'Alpacas',                  img: '/images/Alpaca.webp',           desc: 'Alpacas are soft-fleeced South American camelids raised primarily for their fiber.' },
  { slug: 'bison',             label: 'Bison',                    img: '/images/Bison.webp',             desc: 'Bison are large, shaggy North American bovines raised for lean, flavorful meat.' },
  { slug: 'buffalo',           label: 'Buffalo',                  img: '/images/Buffalo.webp',           desc: 'Buffalo are raised for their milk, meat, and as draft animals in many parts of Asia.' },
  { slug: 'camels',            label: 'Camels',                   img: '/images/Camels.webp',            desc: 'Camels are raised for milk, meat, wool, and transport in arid regions worldwide.' },
  { slug: 'cattle',            label: 'Cattle',                   img: '/images/Cattle.webp',            desc: 'Cattle are raised for beef, veal, dairy products, leather, and as draft animals.' },
  { slug: 'chickens',          label: 'Chickens',                 img: '/images/Chicken.webp',           desc: 'Chickens are the most widely kept fowl, raised for their meat and eggs.' },
  { slug: 'crocodiles',        label: 'Crocodiles & Alligators',  img: '/images/Alligator.webp',         desc: 'Crocodilians are raised for their leather hides and meat.' },
  { slug: 'deer',              label: 'Deer',                     img: '/images/DeerHeader.webp',              desc: 'Deer are raised for their meat, antlers, and hides.' },
  { slug: 'dogs',              label: 'Working Dogs',             img: '/images/Dogs.webp',              desc: 'Working dogs are bred and trained for specific tasks such as herding, guarding, and assistance.' },
  { slug: 'donkeys',           label: 'Donkeys',                  img: '/images/Donkeys.webp',           desc: 'Donkeys are hardy working animals used for transport, agriculture, and companionship.' },
  { slug: 'ducks',             label: 'Ducks',                    img: '/images/Duck.webp',              desc: 'Ducks are raised for their meat, eggs, and down feathers.' },
  { slug: 'emus',              label: 'Emus',                     img: '/images/Emu.webp',               desc: 'Emus are large flightless birds raised for their oil, meat, and leather.' },
  { slug: 'geese',             label: 'Geese',                    img: '/images/Geese.webp',             desc: 'Geese are raised for meat, foie gras, down feathers, and as guard animals.' },
  { slug: 'goats',             label: 'Goats',                    img: '/images/Goats.webp',             desc: 'Goats are raised for their milk, meat, fiber, and hides.' },
  { slug: 'guinea-fowl',       label: 'Guinea Fowl',              img: '/images/Guineafowl.webp',        desc: 'Guinea fowl are prized for their delicious meat and flavorful eggs.' },
  { slug: 'honey-bees',        label: 'Honey Bees',               img: '/images/HoneyBees.webp',         desc: 'Honey bees are kept for honey, beeswax, pollination, and other hive products.' },
  { slug: 'horses',            label: 'Horses',                   img: '/images/cowboy2.webp',           desc: 'Horses are large, powerful animals known for their speed, grace, and beauty.' },
  { slug: 'llamas',            label: 'Llamas',                   img: '/images/Llama2.webp',            desc: 'Llamas are South American camelids used as pack animals and for their fiber.' },
  { slug: 'musk-ox',           label: 'Musk Ox',                  img: '/images/muskox.webp',            desc: 'The musk ox is a large Arctic-dwelling mammal known for its shaggy coat and qiviut fiber.' },
  { slug: 'ostriches',         label: 'Ostriches',                img: '/images/Ostrich.webp',           desc: 'Ostriches are the largest bird in the world, raised for meat, leather, feathers, and eggs.' },
  { slug: 'pheasants',         label: 'Pheasants',                img: '/images/Pheasant.webp',          desc: 'Pheasants are widely kept for hunting and as ornamental birds.' },
  { slug: 'pigs',              label: 'Pigs',                     img: '/images/Pig.webp',               desc: 'Pigs are raised for their meat and are one of the most commonly farmed animals in the world.' },
  { slug: 'pigeons',           label: 'Pigeons',                  img: '/images/Pigeon.webp',            desc: 'Pigeons are raised for their meat, known as squab, considered a delicacy worldwide.' },
  { slug: 'quails',            label: 'Quails',                   img: '/images/Quail.webp',             desc: 'Quails are small game birds prized for their delicate, rich, and gamey flavor.' },
  { slug: 'rabbits',           label: 'Rabbits',                  img: '/images/Rabitts.webp',           desc: 'Rabbits are kept as pets, for their fur, and for their meat.' },
  { slug: 'sheep',             label: 'Sheep',                    img: '/images/Sheepbreeds.webp',       desc: 'Sheep are raised for their wool, meat (lamb), and milk.' },
  { slug: 'snails',            label: 'Snails',                   img: '/images/Snail.webp',             desc: 'Snails have been eaten for millennia and are consumed as a delicacy in many cultures.' },
  { slug: 'turkeys',           label: 'Turkeys',                  img: '/images/Turkey.webp',            desc: 'Turkeys are large ground-dwelling birds raised for their meat, a staple of holiday meals.' },
  { slug: 'yaks',              label: 'Yaks',                     img: '/images/YakHeader.webp',               desc: 'Yaks are large, hardy animals well-adapted to high, cold mountains of Central Asia.' },
];

const EAGER_COUNT = 4;

export default function LivestockDB() {
  const { t } = useTranslation();
  const [counts, setCounts] = useState({});
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    fetch(`${API_URL}/api/livestock/counts`)
      .then(r => r.ok ? r.json() : {})
      .then(data => {
        setCounts(data.counts || {});
        setTotal(data.total || 0);
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return SPECIES;
    return SPECIES.filter((s) => {
      const slugKey = s.slug.replace(/-/g, '_');
      const label = t('livestock_db.species_' + slugKey + '_label', s.label);
      const desc = t('livestock_db.species_' + slugKey + '_desc', s.desc);
      return label.toLowerCase().includes(q) || desc.toLowerCase().includes(q) || s.slug.includes(q);
    });
  }, [filter, t]);

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f7f2e8' }}>
      <PageMeta
        title="Livestock Database | 2,000+ Breeds Across 28 Species"
        description="Explore over 2,000 livestock breeds across 28 species including cattle, pigs, sheep, goats, chickens, alpacas, and more. Find breed characteristics, origins, and farming information."
        keywords="livestock database, livestock breeds, cattle breeds, sheep breeds, alpaca breeds, farm animal encyclopedia"
        canonical="https://livestockofamerica.com/livestock"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Livestock Database',
          url: 'https://livestockofamerica.com/livestock',
          description: 'Comprehensive livestock breed database covering 28 species.'
        }}
      />
      <Header />

      <div className="mx-auto px-4 pt-2 md:pt-6" style={{ maxWidth: '1300px' }}>
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Knowledgebases', to: '/knowledgebase' }, { label: 'Livestock Database' }]} />

        <KnowledgebaseLandingHero
          image="/images/KBHeroLivestock.png"
          alt="Online Livestock Knowledgebase"
          title={t('livestock_db.title', 'Online Livestock Knowledgebase')}
          description={
            total > 0
              ? `We've documented ${total.toLocaleString()} breeds across ${SPECIES.length} species — origins, traits, and farming guidance in one place.`
              : `We've documented 3,000+ breeds across ${SPECIES.length} species — origins, traits, and farming guidance in one place.`
          }
          quote="the Catalog of nature is never finished, only expanded by those who observe."
          stats={[
            {
              value: total > 0 ? total.toLocaleString() : '3,000+',
              label: 'Documented Varieties',
            },
            {
              value: String(SPECIES.length),
              label: 'Core Classifications',
            },
            {
              value: '24',
              label: 'New Entries This Month',
            },
          ]}
          searchPlaceholder="Search species, breeds, or livestock…"
          searchValue={filter}
          onSearchChange={setFilter}
        />
      </div>

      <div className="mx-auto px-4 py-8" style={{ maxWidth: '1300px' }}>

        <h2
          className="text-xl md:text-2xl font-bold mb-5"
          style={{ fontFamily: "'Lora','Times New Roman',serif", color: '#3D6B34' }}
        >
          {t('livestock_db.species_heading')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((s, index) => {
            const count = counts[s.slug] || 0;
            const slugKey = s.slug.replace(/-/g, '_');
            const SINGLE_BREED_SLUGS = new Set(['emus', 'ostriches']);
            const target = SINGLE_BREED_SLUGS.has(s.slug) ? `/livestock/${s.slug}/about` : `/livestock/${s.slug}`;
            return (
              <div
                key={s.slug}
                className="flex bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md hover:border-[#819360] transition-all duration-200"
              >
                <Link to={target} className="shrink-0 overflow-hidden" style={{ width: '155px', height: '155px' }}>
                  <img
                    src={s.img}
                    alt={t('livestock_db.species_' + slugKey + '_label', s.label)}
                    width="155"
                    height="155"
                    loading={index < EAGER_COUNT ? 'eager' : 'lazy'}
                    decoding={index < EAGER_COUNT ? 'sync' : 'async'}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    onError={e => { e.target.src = '/images/HomepageLivestockDB.webp'; }}
                  />
                </Link>

                <div className="flex flex-col justify-between px-5 py-4 flex-1 min-w-0">
                  <div>
                    <Link
                      to={target}
                      className="font-bold text-sm hover:underline"
                      style={{ color: '#3D6B34' }}
                    >
                      {t('livestock_db.species_' + slugKey + '_label', s.label)}
                    </Link>
                    <p
                      className="text-xs font-semibold mt-0.5 mb-2"
                      style={{ color: '#819360' }}
                    >
                      {count > 0 ? t('livestock_db.breed_count', { count: count.toLocaleString() }) : '—'}
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed">{t('livestock_db.species_' + slugKey + '_desc', s.desc)}</p>
                  </div>
                  <div className="mt-3">
                    <Link
                      to={target}
                      className="text-xs font-bold hover:underline"
                      style={{ color: '#3D6B34' }}
                    >
                      {t('livestock_db.explore_arrow')}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
            No species match your search.
          </div>
        )}

      </div>

      <Footer />
    </div>
  );
}
