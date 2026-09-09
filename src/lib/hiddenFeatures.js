/**
 * Features hidden from the UI for now.
 *
 * Single source of truth: the workspace sidebar and the dashboard service tiles
 * both consult this, so a feature cannot reappear in one place after being
 * hidden in the other. Unhide by deleting the key.
 *
 * This hides the ways in, it does not disable anything — routes still resolve
 * for a typed or bookmarked URL, and the backend feature flags are untouched.
 *
 * pairsley and provenance are listed with chef_dashboard because they are
 * children of the Chef Dashboard section, which renders if any of the three is
 * enabled; leaving them on would keep that section on screen without its
 * namesake link.
 */
export const HIDDEN_FEATURES = new Set([
  // Lavendir, the website AI agent. Off for now: this hides the sidebar link,
  // the agent widget on the builder, the "copy an existing site" step that
  // calls her scraper, and the card advertising her on the AI agents page.
  // Delete this key to turn her back on; nothing else needs changing.
  'lavendir',

  // Community sections
  'forums',
  'testimonials',
  'chef_dashboard',
  'pairsley',
  'provenance',
  'properties',

  // The whole Programs group. Its NavGroup is wrapped in anyOn() over exactly
  // these four, so hiding all four removes the group heading with it — there
  // is no separate key for the group itself.
  'certifications',
  'commodity_prices',
  'education_center',
  'grants_programs',

  // The whole Business Mgmt group, same arrangement over these seven.
  'accounting',
  'cash_flow_forecast',
  'document_vault',
  'farm_pl',
  'meetings',
  'report_center',
]);

/** True when a feature key is hidden for now. */
export function isHidden(key) {
  return HIDDEN_FEATURES.has(key);
}
