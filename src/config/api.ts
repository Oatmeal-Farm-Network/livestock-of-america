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

/**
 * OFN main backend — plant & ingredient knowledgebases (not on livestock service).
 * Falls back to livestock URL only if unset (may 404 for plant/ingredient routes).
 */
export const OFN_API_URL = readUrl(
  import.meta.env.VITE_OFN_API_URL || import.meta.env.VITE_LIVESTOCK_API_URL,
);

/** Optional Saige advisory API (separate service). */
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

/**
 * OFN main API paths (auth, account/business, plant/ingredient).
 * Empty base → same-origin (Vite proxies /auth and account APIs to OFN).
 */
export function ofnApiUrl(path = ""): string {
  const base = readUrl(import.meta.env.VITE_OFN_API_URL) || "";
  if (!path) return base;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${normalized}` : normalized;
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

  // Marketplace — app/routers/marketplace.py (livestock for-sale / studs)
  marketplaceFilters: (slug: string) =>
    apiUrl(`/api/marketplace/filters/${slug}`),
  marketplaceSpecies: (slug: string) =>
    apiUrl(`/api/marketplace/species/${slug}`),
  forSale: (slug: string) => apiUrl(`/api/marketplace/for-sale/${slug}`),
  studs: (slug: string) => apiUrl(`/api/marketplace/studs/${slug}`),
  marketplaceAnimal: (id: number | string) =>
    apiUrl(`/api/marketplace/animal/${id}`),
  homepageListings: () => apiUrl("/api/marketplace/homepage-listings"),

  // Ranches — app/routers/ranches.py
  ranchesList: (slug: string) => apiUrl(`/api/ranches/list/${slug}`),
  ranchProfile: (businessId: number | string) =>
    apiUrl(`/api/ranches/profile/${businessId}`),

  // Animals — app/routers/animals.py
  animals: () => apiUrl("/api/animals"),

  // Herd health — app/routers/herd_health.py
  herdHealthDashboard: (businessId: number | string) =>
    apiUrl(`/api/herd-health/dashboard?business_id=${businessId}`),

  // Auth — OFN main (same host as Dashboard /auth/my-businesses)
  login: () => ofnApiUrl("/auth/login"),
  signup: () => ofnApiUrl("/auth/signup"),
  forgotPassword: () => ofnApiUrl("/auth/forgot-password"),
  me: () => ofnApiUrl("/auth/me"),
} as const;
