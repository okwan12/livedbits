import { supabase } from "./supabaseClient";
import {
  places as staticPlaces,
  normalizeCategory,
  type Place,
} from "@/data/places";

// Fetches visited places for the Mapbox globe. Falls back to data/places.ts
// if Supabase isn't configured, the query fails, or the table is empty
// (so the map still has sample pins before Takeout import).
export async function getPlaces(): Promise<Place[]> {
  if (!supabase) return staticPlaces;

  const { data, error } = await supabase
    .from("places")
    .select("id, name, lat, lng, visited_date, category, city, country")
    .order("visited_date", { ascending: false, nullsFirst: false });

  if (error || !data) {
    console.error("Supabase places fetch failed, using static fallback:", error);
    return staticPlaces;
  }

  if (data.length === 0) return staticPlaces;

  // Normalize "Cafés" / "Bakeries" → cafe / bakery for pin colors + popups.
  return (data as Place[]).map((place) => ({
    ...place,
    category: normalizeCategory(place.category) ?? place.category,
  }));
}
