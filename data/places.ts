export type Place = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  visited_date: string | null; // YYYY-MM-DD, or null if unknown
  category: string | null; // slug, e.g. "cafes" — see CATEGORY_COLORS
  city: string | null;
  country: string | null;
};

/** Canonical category slugs (no emoji). Unknown / null → DEFAULT_CATEGORY_COLOR. */
export const CATEGORY_COLORS: Record<string, { label: string; color: string }> =
  {
    restaurants: { label: "Restaurants", color: "#E85D04" },
    cafes: { label: "Cafés", color: "#6F4E37" },
    bakeries: { label: "Bakeries", color: "#E9C46A" },
    shops: { label: "Shops", color: "#0077B6" },
    sites: { label: "Sites", color: "#2A9D8F" },
    drinks: { label: "Drinks", color: "#9B5DE5" },
    markets: { label: "Markets", color: "#F4A261" },
    "sweet-treats": { label: "Sweet treats", color: "#F15BB5" },
  };

export const DEFAULT_CATEGORY_COLOR = "#6B6B6B";

/** Map Takeout-style labels ("Cafés", "Bakery") onto canonical slugs. */
const CATEGORY_ALIASES: Record<string, string> = {
  restaurants: "restaurants",
  restaurant: "restaurants",
  cafes: "cafes",
  cafe: "cafes",
  cafés: "cafes",
  café: "cafes",
  bakeries: "bakeries",
  bakery: "bakeries",
  shops: "shops",
  shop: "shops",
  sites: "sites",
  site: "sites",
  drinks: "drinks",
  drink: "drinks",
  markets: "markets",
  market: "markets",
  "sweet-treats": "sweet-treats",
  "sweet treats": "sweet-treats",
  sweets: "sweet-treats",
};

/**
 * Normalize a raw category string to a canonical slug.
 * Strips emoji, lowercases, and removes accents so "Cafés" → "cafes".
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
    category: "sites",
    city: "Kyoto",
    country: "Japan",
  },
  {
    id: "tokyo",
    name: "Tokyo",
    lat: 35.6895,
    lng: 139.6917,
    visited_date: null,
    category: "shops",
    city: "Tokyo",
    country: "Japan",
  },
  {
    id: "berlin",
    name: "Berlin",
    lat: 52.52,
    lng: 13.405,
    visited_date: null,
    category: "cafes",
    city: "Berlin",
    country: "Germany",
  },
  {
    id: "amsterdam",
    name: "Amsterdam",
    lat: 52.3676,
    lng: 4.9041,
    visited_date: null,
    category: "restaurants",
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
