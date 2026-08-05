export type Place = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  visited_date: string | null; // YYYY-MM-DD, or null if unknown
};

// Static fallback used when Supabase is unreachable or the places table is
// empty. Seeded from the sample check-ins so the globe still has pins until
// you import real Takeout data. Nothing in the app wires to this yet (Step 3).
export const places: Place[] = [
  {
    id: "kyoto",
    name: "Kyoto",
    lat: 35.0116,
    lng: 135.7681,
    visited_date: null,
  },
  {
    id: "tokyo",
    name: "Tokyo",
    lat: 35.6895,
    lng: 139.6917,
    visited_date: null,
  },
  {
    id: "berlin",
    name: "Berlin",
    lat: 52.52,
    lng: 13.405,
    visited_date: null,
  },
  {
    id: "amsterdam",
    name: "Amsterdam",
    lat: 52.3676,
    lng: 4.9041,
    visited_date: null,
  },
  {
    id: "san-francisco",
    name: "San Francisco",
    lat: 37.7749,
    lng: -122.4194,
    visited_date: null,
  },
];

// Where the map first looks. Adjust after you swap in real places.
export const initialViewState = {
  longitude: 60,
  latitude: 45,
  zoom: 1.4,
};

// Converts places into a GeoJSON FeatureCollection for Mapbox clustering.
export function placesToGeoJSON(
  list: Place[] = places
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: list.map((place) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [place.lng, place.lat] },
      properties: {
        id: place.id,
        name: place.name,
        visited_date: place.visited_date,
      },
    })),
  };
}
