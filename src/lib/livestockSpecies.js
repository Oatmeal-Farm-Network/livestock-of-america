/**
 * Single source of truth for the species carried by the livestock marketplace.
 *
 * Used by the top nav (Header) and the marketplace browse sidebar so the two
 * can't drift apart. `key` maps to a `livestock_mkt.*` string in i18n/en.json;
 * `label` is the English fallback for when a key is missing.
 *
 * Stud and ranch lists are deliberately shorter than the for-sale list — not
 * every species has stud services or ranch profiles.
 */

export const forSalePath = (slug) => `/marketplaces/livestock/${slug}`;
export const studPath = (slug) => `/marketplaces/livestock/studs/${slug}`;
export const ranchPath = (slug) => `/marketplaces/livestock/ranches/${slug}`;

/** Every species with a "for sale" listing page (29). */
export const FOR_SALE_SPECIES = [
  { slug: 'alpacas', key: 'sp_alpacas', label: 'Alpacas' },
  { slug: 'bison', key: 'sp_bison', label: 'Bison' },
  { slug: 'buffalo', key: 'sp_buffalo', label: 'Buffalo' },
  { slug: 'camels', key: 'sp_camels', label: 'Camels' },
  { slug: 'cattle', key: 'sp_cattle', label: 'Cattle' },
  { slug: 'chickens', key: 'sp_chickens', label: 'Chickens' },
  { slug: 'crocodiles', key: 'sp_crocodiles', label: 'Crocodiles & Alligators' },
  { slug: 'deer', key: 'sp_deer', label: 'Deer' },
  { slug: 'dogs', key: 'sp_dogs', label: 'Working Dogs' },
  { slug: 'donkeys', key: 'sp_donkeys', label: 'Donkeys' },
  { slug: 'ducks', key: 'sp_ducks', label: 'Ducks' },
  { slug: 'emus', key: 'sp_emus', label: 'Emus' },
  { slug: 'geese', key: 'sp_geese', label: 'Geese' },
  { slug: 'goats', key: 'sp_goats', label: 'Goats' },
  { slug: 'guinea-fowl', key: 'sp_guinea_fowl', label: 'Guinea Fowl' },
  { slug: 'honey-bees', key: 'sp_honey_bees', label: 'Honey Bees' },
  { slug: 'horses', key: 'sp_horses', label: 'Horses' },
  { slug: 'llamas', key: 'sp_llamas', label: 'Llamas' },
  { slug: 'musk-ox', key: 'sp_musk_ox', label: 'Musk Ox' },
  { slug: 'ostriches', key: 'sp_ostriches', label: 'Ostriches' },
  { slug: 'pheasants', key: 'sp_pheasants', label: 'Pheasants' },
  { slug: 'pigeons', key: 'sp_pigeons', label: 'Pigeons' },
  { slug: 'pigs', key: 'sp_pigs', label: 'Pigs' },
  { slug: 'quails', key: 'sp_quails', label: 'Quails' },
  { slug: 'rabbits', key: 'sp_rabbits', label: 'Rabbits' },
  { slug: 'sheep', key: 'sp_sheep', label: 'Sheep' },
  { slug: 'snails', key: 'sp_snails', label: 'Snails' },
  { slug: 'turkeys', key: 'sp_turkeys', label: 'Turkeys' },
  { slug: 'yaks', key: 'sp_yaks', label: 'Yaks' },
];

/** Species offering stud services (14). */
export const STUD_SPECIES = [
  { slug: 'alpacas', key: 'sp_alpaca_studs', label: 'Alpaca Studs' },
  { slug: 'bison', key: 'sp_bison_studs', label: 'Bison Studs' },
  { slug: 'buffalo', key: 'sp_buffalo_studs', label: 'Buffalo Studs' },
  { slug: 'camels', key: 'sp_camel_studs', label: 'Camel Studs' },
  { slug: 'cattle', key: 'sp_cattle_studs', label: 'Cattle Studs' },
  { slug: 'dogs', key: 'sp_dog_studs', label: 'Working Dog Studs' },
  { slug: 'donkeys', key: 'sp_donkey_studs', label: 'Donkey Studs' },
  { slug: 'goats', key: 'sp_goat_studs', label: 'Goat Studs' },
  { slug: 'horses', key: 'sp_horse_studs', label: 'Horse Studs' },
  { slug: 'llamas', key: 'sp_llama_studs', label: 'Llama Studs' },
  { slug: 'pigs', key: 'sp_pig_studs', label: 'Pig Studs' },
  { slug: 'rabbits', key: 'sp_rabbit_studs', label: 'Rabbit Studs' },
  { slug: 'sheep', key: 'sp_sheep_studs', label: 'Sheep Studs' },
  { slug: 'yaks', key: 'sp_yak_studs', label: 'Yak Studs' },
];

/** Species with ranch-profile directories (29). */
export const RANCH_SPECIES = [
  { slug: 'alpacas', key: 'sp_alpaca_ranches', label: 'Alpaca Ranches' },
  { slug: 'honey-bees', key: 'sp_bees_honey', label: 'Bees, Honey' },
  { slug: 'bison', key: 'sp_bison_ranches', label: 'Bison Ranches' },
  { slug: 'buffalo', key: 'sp_buffalo_ranches', label: 'Buffalo Ranches' },
  { slug: 'camels', key: 'sp_camel_ranches', label: 'Camel Ranches' },
  { slug: 'cattle', key: 'sp_cattle_ranches', label: 'Cattle Ranches' },
  { slug: 'chickens', key: 'sp_chicken_ranches', label: 'Chicken Ranches' },
  { slug: 'crocodiles', key: 'sp_crocodile_ranches', label: 'Crocodile & Alligator Ranches' },
  { slug: 'deer', key: 'sp_deer_ranches', label: 'Deer Ranches' },
  { slug: 'dogs', key: 'sp_dog_ranches', label: 'Working Dog Ranches' },
  { slug: 'donkeys', key: 'sp_donkey_ranches', label: 'Donkey Ranches' },
  { slug: 'ducks', key: 'sp_duck_ranches', label: 'Duck Ranches' },
  { slug: 'emus', key: 'sp_emu_ranches', label: 'Emu Ranches' },
  { slug: 'geese', key: 'sp_geese_ranches', label: 'Geese Ranches' },
  { slug: 'goats', key: 'sp_goat_ranches', label: 'Goat Ranches' },
  { slug: 'guinea-fowl', key: 'sp_guinea_fowl_ranches', label: 'Guinea Fowl Ranches' },
  { slug: 'horses', key: 'sp_horse_ranches', label: 'Horse Ranches' },
  { slug: 'llamas', key: 'sp_llama_ranches', label: 'Llama Ranches' },
  { slug: 'musk-ox', key: 'sp_musk_ox_ranches', label: 'Musk Ox Ranches' },
  { slug: 'ostriches', key: 'sp_ostrich_ranches', label: 'Ostrich Ranches' },
  { slug: 'pheasants', key: 'sp_pheasant_ranches', label: 'Pheasant Ranches' },
  { slug: 'pigs', key: 'sp_pig_ranches', label: 'Pig Ranches' },
  { slug: 'pigeons', key: 'sp_pigeon_ranches', label: 'Pigeon Ranches' },
  { slug: 'quails', key: 'sp_quail_ranches', label: 'Quail Ranches' },
  { slug: 'rabbits', key: 'sp_rabbit_ranches', label: 'Rabbit Ranches' },
  { slug: 'sheep', key: 'sp_sheep_ranches', label: 'Sheep Ranches' },
  { slug: 'snails', key: 'sp_snail_ranches', label: 'Snail Ranches' },
  { slug: 'turkeys', key: 'sp_turkey_ranches', label: 'Turkey Ranches' },
  { slug: 'yaks', key: 'sp_yak_ranches', label: 'Yak Ranches' },
];

/** Build nav-ready `{ label, to }` entries; `t` resolves the i18n key. */
export function speciesLinks(species, toPath, t) {
  return species.map((s) => ({
    label: t ? t(`livestock_mkt.${s.key}`, s.label) : s.label,
    to: toPath(s.slug),
  }));
}
