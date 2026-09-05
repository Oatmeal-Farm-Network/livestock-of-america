/**
 * Livestock of America API — single backend: the livestock Cloud Run service.
 *
 * Breed KB, marketplace, ranches, animals, herd health, and auth all live on
 * VITE_LIVESTOCK_API_URL (oatmeal-livestock-staging / prod livestock).
 */

function trimSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

function readUrl(value: string | undefined): string {
  return value ? trimSlash(value.trim()) : "";
}

/** Livestock of America API (Cloud Run livestock service). */
export const LIVESTOCK_API_URL = readUrl(import.meta.env.VITE_LIVESTOCK_API_URL);

/** Optional Saige advisory API (same auth as OFN — Bearer JWT from login). */
export const SAIGE_API_URL = readUrl(import.meta.env.VITE_SAIGE_API_URL);


export const CONTACT_EMAIL = (import.meta.env.VITE_CONTACT_EMAIL || "").trim();

/**
 * Join livestock base URL with a path (path may start with `/`).
 * Empty VITE_LIVESTOCK_API_URL → same-origin paths (Vite proxy in local dev).
 */
export function apiUrl(path = ""): string {
  if (!path) return LIVESTOCK_API_URL || "";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return LIVESTOCK_API_URL ? `${LIVESTOCK_API_URL}${normalized}` : normalized;
}

/** Paths match oatmealfarmnetworkbackend livestock service routers. */
export const endpoints = {
  health: () => apiUrl("/health"),

  // Breed / species knowledge base — app/routers/livestock.py
  counts: () => apiUrl("/api/livestock/counts"),
  species: (slug: string) => apiUrl(`/api/livestock/species/${slug}`),
  speciesLetters: (slug: string) =>
    apiUrl(`/api/livestock/species/${slug}/letters`),
  breed: (breedId: number | string) =>
    apiUrl(`/api/livestock/breed/${breedId}`),
  about: (slug: string) => apiUrl(`/api/livestock/about/${slug}`),
  speciesColors: (speciesId: number | string) =>
    apiUrl(`/api/livestock/species-colors/${speciesId}`),

  // Marketplace — app/routers/marketplace.py
  marketplaceFilters: (slug: string) =>
    apiUrl(`/api/marketplace/filters/${slug}`),
  marketplaceSpecies: (slug: string) =>
    apiUrl(`/api/marketplace/species/${slug}`),
  forSale: (slug: string) => apiUrl(`/api/marketplace/for-sale/${slug}`),
  studs: (slug: string) => apiUrl(`/api/marketplace/studs/${slug}`),
  marketplaceAnimal: (id: number | string) =>
    apiUrl(`/api/marketplace/animal/${id}`),
  marketplaceAnimalProgeny: (id: number | string) =>
    apiUrl(`/api/marketplace/animal/${id}/progeny`),
  homepageListings: () => apiUrl("/api/marketplace/homepage-listings"),
  homepageFeatured: () => apiUrl("/api/marketplace/homepage-featured"),
  // One endpoint serves both the Saved tab and every SaveButton: it returns the
  // hydrated items plus the animal/stud/ranch id lists used for checked state.
  marketplaceSaved: () => apiUrl("/api/marketplace/saved"),

  // Ranches — app/routers/ranches.py
  ranchesList: (slug: string) => apiUrl(`/api/ranches/list/${slug}`),
  ranchProfile: (businessId: number | string) =>
    apiUrl(`/api/ranches/profile/${businessId}`),
  ranchAnimals: (businessId: number | string) =>
    apiUrl(`/api/ranches/profile/${businessId}/animals`),

  // Animals — app/routers/animals.py
  animals: () => apiUrl("/api/animals"),
  animal: (id: number | string) => apiUrl(`/api/animals/${id}`),
  animalGet: (id: number | string) => apiUrl(`/api/animals/${id}`),
  animalPublish: (id: number | string) =>
    apiUrl(`/api/animals/${id}/publish`),
  animalPublishStud: (id: number | string) =>
    apiUrl(`/api/animals/${id}/publish-stud`),
  animalUpdateBasics: (id: number | string) =>
    apiUrl(`/api/animals/${id}/update-basics`),
  animalCategories: (speciesId: number | string) =>
    apiUrl(`/api/animals/species/${speciesId}/categories`),
  animalPhotos: (id: number | string) =>
    apiUrl(`/api/animals/${id}/photos`),
  animalTransfer: (id: number | string) =>
    apiUrl(`/api/animals/${id}/transfer`),

  // Animal packages — app/routers/auth.py
  animalPackages: (businessId: number | string) =>
    apiUrl(`/auth/packages?BusinessID=${businessId}`),
  animalPackageSave: () => apiUrl("/auth/packages/save"),
  animalPackageDelete: () => apiUrl("/auth/packages/delete"),

  // Herd health — app/routers/herd_health.py
  herdHealthDashboard: (businessId: number | string) =>
    apiUrl(`/api/herd-health/dashboard?business_id=${businessId}`),
  herdHealthAnimals: (businessId: number | string) =>
    apiUrl(`/api/herd-health/animals?business_id=${businessId}`),
  herdHealthAccountingSync: (businessId: number | string) =>
    apiUrl(`/api/herd-health/accounting/sync?business_id=${businessId}`),
  herdHealthList: (resource: string, businessId: number | string) =>
    apiUrl(`/api/herd-health/${resource}?business_id=${businessId}`),
  herdHealthCreate: (resource: string, businessId: number | string) =>
    apiUrl(`/api/herd-health/${resource}?business_id=${businessId}`),
  herdHealthItem: (resource: string, id: number | string) =>
    apiUrl(`/api/herd-health/${resource}/${id}`),
  // Convenience aliases used by existing dashboard
  herdHealthEvents: (businessId: number | string) =>
    apiUrl(`/api/herd-health/events?business_id=${businessId}`),

  // Auth — livestock service (A1)
  login: () => apiUrl("/auth/login"),
  signup: () => apiUrl("/auth/signup"),
  forgotPassword: () => apiUrl("/auth/forgot-password"),
  me: () => apiUrl("/auth/me"),
  updateLogin: () => apiUrl("/auth/update-login"),
  myBusinesses: (peopleId: number | string) =>
    apiUrl(`/auth/my-businesses?PeopleID=${peopleId}`),
  businessProfile: (businessId: number | string) =>
    apiUrl(`/api/businesses/profile/${businessId}`),
  accountHome: (businessId: number | string) =>
    apiUrl(`/auth/account-home?BusinessID=${businessId}`),
  authAnimals: (businessId: number | string) =>
    apiUrl(`/auth/animals?BusinessID=${businessId}`),
  authAnimalsAdd: () => apiUrl("/auth/animals/add"),
  animalAdd: () => apiUrl("/auth/animals/add"),
  authSpecies: () => apiUrl("/auth/species"),
  authBreeds: (speciesId: number | string) =>
    apiUrl(`/auth/species/${speciesId}/breeds`),
} as const;
