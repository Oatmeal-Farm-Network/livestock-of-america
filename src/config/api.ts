/**
 * Central API endpoints for Livestock of America.
 *
 * Breed / knowledge-base → livestock Cloud Run.
 * Auth, marketplace, animals, herd health → OFN backend until livestock owns those routes.
 */

function trimSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

function readUrl(value: string | undefined): string {
  return value ? trimSlash(value.trim()) : "";
}

/** Standalone livestock API (breed encyclopedia, KB, livestock-owned routes). */
export const LIVESTOCK_API_URL = readUrl(import.meta.env.VITE_LIVESTOCK_API_URL);

/**
 * OFN backend (auth, marketplace, animals, herd health, shared platform APIs).
 * Baked at Docker build time from STAGING_BACKEND_URL / PROD_BACKEND_URL.
 */
export const OFN_API_URL = readUrl(import.meta.env.VITE_API_URL);

/** Optional Saige advisory API. */
export const SAIGE_API_URL = readUrl(import.meta.env.VITE_SAIGE_API_URL);

export const CONTACT_EMAIL = (import.meta.env.VITE_CONTACT_EMAIL || "").trim();

export type ApiTarget = "livestock" | "ofn" | "saige";

const TARGET_BASE: Record<ApiTarget, () => string> = {
  livestock: () => LIVESTOCK_API_URL,
  ofn: () => OFN_API_URL,
  saige: () => SAIGE_API_URL,
};

/** Join a service base URL with a path (path may start with `/`). */
export function apiUrl(target: ApiTarget, path = ""): string {
  const base = TARGET_BASE[target]();
  if (!base) {
    throw new Error(
      `Missing API base for "${target}". Set the matching VITE_* URL at build time.`,
    );
  }
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Breed + knowledge-base helpers → livestock service. */
export const livestockEndpoints = {
  health: () => apiUrl("livestock", "/health"),
  breeds: () => apiUrl("livestock", "/api/livestock/breeds"),
  species: () => apiUrl("livestock", "/api/livestock/species"),
  knowledge: (slug: string) =>
    apiUrl("livestock", `/api/livestock/knowledge/${slug}`),
} as const;

/**
 * Platform routes still served by OFN backend.
 * Do not point these at oatmeal-livestock-* until that service owns them.
 */
export const ofnEndpoints = {
  health: () => apiUrl("ofn", "/health"),
  login: () => apiUrl("ofn", "/api/auth/login"),
  me: () => apiUrl("ofn", "/api/auth/me"),
  marketplace: () => apiUrl("ofn", "/api/marketplace"),
  animals: () => apiUrl("ofn", "/api/animals"),
  herdHealth: () => apiUrl("ofn", "/api/herd-health"),
} as const;
