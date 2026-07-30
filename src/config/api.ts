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

/** Optional Saige advisory API (separate service). */
export const SAIGE_API_URL = readUrl(import.meta.env.VITE_SAIGE_API_URL);

export const CONTACT_EMAIL = (import.meta.env.VITE_CONTACT_EMAIL || "").trim();

/** Join livestock base URL with a path (path may start with `/`). */
export function apiUrl(path = ""): string {
  if (!LIVESTOCK_API_URL) {
    throw new Error(
      "Missing VITE_LIVESTOCK_API_URL. Set it at build time (or in .env for local dev).",
    );
  }
  if (!path) return LIVESTOCK_API_URL;
  return `${LIVESTOCK_API_URL}${path.startsWith("/") ? path : `/${path}`}`;
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

  // Auth — app/routers/auth.py
  login: () => apiUrl("/auth/login"),
  me: () => apiUrl("/auth/me"),
} as const;
