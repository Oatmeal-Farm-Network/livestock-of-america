/**
 * Single source of truth for the public directory categories.
 *
 * Used by the top nav (Header) and the directory landing page so the two can't
 * drift apart. `key` maps to `directory_list.cat_<key>_title` in i18n/en.json;
 * `label` is the English fallback when a key is missing. `img` is the tile
 * image used by the landing page.
 *
 * Sourced from the `businesstypelookup` table (excluding the "N/A" placeholder)
 * and ordered alphabetically by BusinessType to match GET /api/businesses/types.
 */

export const directoryPath = (slug) => `/directory/${slug}`;

/** i18n key for a category title, e.g. 'farms-ranches' -> cat_farms_ranches_title. */
export const directoryTitleKey = (slug) =>
  `directory_list.cat_${slug.replace(/-/g, '_')}_title`;

export const DIRECTORY_CATEGORIES = [
  { slug: 'agricultural-associations', label: 'Agricultural Associations', img: '/images/AgriculturalAssociations.webp' },
  { slug: 'artisan-producers', label: 'Artisan Producers', img: '/images/ArtisanProducers.webp' },
  { slug: 'business-resources', label: 'Business Resources', img: '/images/BusinessResourcesDirectoryImage.webp' },
  { slug: 'crafter-organizations', label: 'Crafter Organizations', img: '/images/CrafterOrganizations.webp' },
  { slug: 'farmers-markets', label: 'Farmers Markets', img: '/images/FarmersMarket.webp' },
  { slug: 'farms-ranches', label: 'Farms / Ranches', img: '/images/Farm.webp' },
  { slug: 'fiber-cooperatives', label: 'Fiber Cooperatives', img: '/images/FiberCooperatives.webp' },
  { slug: 'fiber-mills', label: 'Fiber Mills', img: '/images/FiberMill.webp' },
  { slug: 'fisheries', label: 'Fisheries', img: '/images/Fishery.webp' },
  { slug: 'fishermen', label: 'Fishermen', img: '/images/Fishermen.webp' },
  { slug: 'food-aggregators', label: 'Food Aggregators', img: '/images/FoodAggregators.webp' },
  { slug: 'food-cooperatives', label: 'Food Cooperatives', img: '/images/FoodCooperatives.webp' },
  { slug: 'food-hubs', label: 'Food Hubs', img: '/images/FoodHubs.webp' },
  { slug: 'grocery-stores', label: 'Grocery Stores', img: '/images/GroceryStores.webp' },
  { slug: 'herb-and-tea-producers', label: 'Herb & Tea Producers', img: '/images/Herbs.webp' },
  { slug: 'hunger-relief-organizations', label: 'Hunger Relief Organizations', img: '/images/HumanReleafOrganization.webp' },
  { slug: 'manufacturers', label: 'Manufacturers', img: '/images/Manufacturers.webp' },
  { slug: 'marinas', label: 'Marinas', img: '/images/Marina.webp' },
  { slug: 'meat-wholesalers', label: 'Meat Wholesalers', img: '/images/MeatWholesalers.webp' },
  { slug: 'real-estate-agents', label: 'Real Estate Agents', img: '/images/RealEstateAgents.webp' },
  { slug: 'restaurants', label: 'Restaurants', img: '/images/Restaurants.webp' },
  { slug: 'retailers', label: 'Retailers', img: '/images/Retailers.webp' },
  { slug: 'service-providers', label: 'Service Providers', img: '/images/ServiceProviders.webp' },
  { slug: 'transporters', label: 'Transporters', img: '/images/Transportation.webp' },
  { slug: 'universities', label: 'Universities', img: '/images/University.webp' },
  { slug: 'veterinarians', label: 'Veterinarians', img: '/images/Vetrinarians.webp' },
  { slug: 'vineyards', label: 'Vineyards', img: '/images/Vineyard.webp' },
  { slug: 'wineries', label: 'Wineries', img: '/images/Winery.webp' },
  // "Other" is intentionally pinned to the bottom rather than sorted in.
  { slug: 'others', label: 'Other', img: '/icons/Other.png' },
];

/** Build nav-ready `{ label, to }` entries; `t` resolves the i18n title. */
export function directoryLinks(t) {
  return DIRECTORY_CATEGORIES.map((c) => ({
    label: t ? t(directoryTitleKey(c.slug), c.label) : c.label,
    to: directoryPath(c.slug),
  }));
}
