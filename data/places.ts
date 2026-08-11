export type Place = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  visited_date: string | null; // YYYY-MM-DD, or null if unknown
  category: string | null; // slug, e.g. "cafe" — see CATEGORY_COLORS
  city: string | null;
  country: string | null;
};

/** Canonical category slugs (singular). Unknown / null → DEFAULT_CATEGORY_COLOR. */
export const CATEGORY_COLORS: Record<string, { label: string; color: string }> =
  {
    restaurant: { label: "Restaurant", color: "#E85D04" },
    cafe: { label: "Café", color: "#6F4E37" },
    bakery: { label: "Bakery", color: "#E9C46A" },
    shop: { label: "Shop", color: "#0077B6" },
    site: { label: "Site", color: "#2A9D8F" },
    drink: { label: "Drink", color: "#9B5DE5" },
    market: { label: "Market", color: "#F4A261" },
    "sweet treat": { label: "Sweet treat", color: "#F15BB5" },
  };

export const DEFAULT_CATEGORY_COLOR = "#6B6B6B";

/** Map labels / plurals / CSV tags onto canonical singular slugs. */
const CATEGORY_ALIASES: Record<string, string> = {
  restaurant: "restaurant",
  restaurants: "restaurant",
  cafe: "cafe",
  cafes: "cafe",
  cafés: "cafe",
  café: "cafe",
  bakery: "bakery",
  bakeries: "bakery",
  shop: "shop",
  shops: "shop",
  site: "site",
  sites: "site",
  drink: "drink",
  drinks: "drink",
  bar: "drink",
  bars: "drink",
  market: "market",
  markets: "market",
  "sweet treat": "sweet treat",
  "sweet treats": "sweet treat",
  "sweet-treat": "sweet treat",
  "sweet-treats": "sweet treat",
  sweets: "sweet treat",
};

/**
 * Normalize a raw category string to a canonical singular slug.
 * Strips emoji, lowercases, and removes accents so "Cafés" → "cafe".
 */
export function normalizeCategory(
  raw: string | null | undefined
): string | null {
  if (!raw) return null;
  const stripped = raw
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}]/gu, "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (!stripped) return null;
  return CATEGORY_ALIASES[stripped] ?? null;
}

export function categoryColor(category: string | null | undefined): string {
  const slug = normalizeCategory(category) ?? category;
  if (!slug) return DEFAULT_CATEGORY_COLOR;
  return CATEGORY_COLORS[slug]?.color ?? DEFAULT_CATEGORY_COLOR;
}

export function categoryLabel(category: string | null | undefined): string {
  const slug = normalizeCategory(category);
  if (!slug) return category ?? "Other";
  return CATEGORY_COLORS[slug]?.label ?? slug;
}

// Static fallback used when Supabase is unreachable or the places table is
// empty. Categories vary so pin colors are visible before you add real rows.
export const places: Place[] = [
  {
    id: "kyoto",
    name: "Kyoto",
    lat: 35.0116,
    lng: 135.7681,
    visited_date: null,
    category: "site",
    city: "Kyoto",
    country: "Japan",
  },
  {
    id: "tokyo",
    name: "Tokyo",
    lat: 35.6895,
    lng: 139.6917,
    visited_date: null,
    category: "shop",
    city: "Tokyo",
    country: "Japan",
  },
  {
    id: "berlin",
    name: "Berlin",
    lat: 52.52,
    lng: 13.405,
    visited_date: null,
    category: "cafe",
    city: "Berlin",
    country: "Germany",
  },
  {
    id: "amsterdam",
    name: "Amsterdam",
    lat: 52.3676,
    lng: 4.9041,
    visited_date: null,
    category: "restaurant",
    city: "Amsterdam",
    country: "Netherlands",
  },
  {
    id: "san-francisco",
    name: "San Francisco",
    lat: 37.7749,
    lng: -122.4194,
    visited_date: null,
    category: null,
    city: "San Francisco",
    country: "USA",
  },
];

// Where the map first looks — Bay Area so your seeded places are visible.
// Widen (lower zoom) once you have pins worldwide.
export const initialViewState = {
  longitude: -122.4,
  latitude: 37.78,
  zoom: 10,
};

// Converts places into a GeoJSON FeatureCollection for Mapbox clustering.
// Categories are normalized to slugs so pin colors match even when the DB
// has display labels like "Cafés" or "Bakery".
export function placesToGeoJSON(
  list: Place[] = places
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: list.map((place) => {
      // Use "" instead of null — Mapbox match expressions are happier with strings.
      const category =
        normalizeCategory(place.category) ?? place.category ?? "";
      return {
        type: "Feature",
        geometry: { type: "Point", coordinates: [place.lng, place.lat] },
        properties: {
          id: place.id,
          name: place.name,
          visited_date: place.visited_date ?? "",
          category,
          city: place.city ?? "",
          country: place.country ?? "",
        },
      };
    }),
  };
}

/** Mapbox paint expression: match category → color, else default gray. */
export function categoryColorMatchExpression(): unknown[] {
  const expr: unknown[] = [
    "match",
    ["coalesce", ["get", "category"], ""],
  ];
  for (const [slug, { color }] of Object.entries(CATEGORY_COLORS)) {
    expr.push(slug, color);
  }
  expr.push(DEFAULT_CATEGORY_COLOR);
  return expr;
}
