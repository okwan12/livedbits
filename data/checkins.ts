export type CheckIn = {
  name: string;
  category: string;
  coordinates: [number, number]; // [lng, lat]
};

// ── EDIT YOUR REAL PLACES HERE ────────────────────────────────────────────
// Replace these sample entries with places you've actually been. For each one,
// set `name`, `category`, and `coordinates` as [longitude, latitude] (lng first,
// then lat). You can find coordinates by right-clicking a spot in Google Maps.
// Add or remove entries freely — the map clusters them automatically.
export const checkins: CheckIn[] = [
  { name: "Kyoto", category: "Travel", coordinates: [135.7681, 35.0116] },
  { name: "Tokyo", category: "Travel", coordinates: [139.6917, 35.6895] },
  { name: "Berlin", category: "Travel", coordinates: [13.405, 52.52] },
  { name: "Amsterdam", category: "Travel", coordinates: [4.9041, 52.3676] },
  { name: "San Francisco", category: "Home", coordinates: [-122.4194, 37.7749] },
];
// ──────────────────────────────────────────────────────────────────────────

// Where the map first looks. Centered roughly between the sample points above,
// zoomed out enough to see all of them. Adjust after you swap in real places.
export const initialViewState = {
  longitude: 60,
  latitude: 45,
  zoom: 1.4,
};

// Converts the plain check-in array into a GeoJSON FeatureCollection, which is
// the shape Mapbox's clustering source expects.
export function checkinsToGeoJSON(
  places: CheckIn[] = checkins
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: places.map((place) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: place.coordinates },
      properties: { name: place.name, category: place.category },
    })),
  };
}
