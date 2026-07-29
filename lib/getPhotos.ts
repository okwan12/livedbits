import { supabase } from "./supabaseClient";
import { photos as staticPhotos, type Photo } from "@/data/photos";

export async function getPhotos(): Promise<Photo[]> {
  if (!supabase) return staticPhotos;

  const { data, error } = await supabase
    .from("photos")
    .select("id, src, alt, city, country, date, roll, frame, lat, lng, featured")
    .order("date", { ascending: false });

  if (error || !data) {
    console.error("Supabase photos fetch failed, using static fallback:", error);
    return staticPhotos;
  }

  return data as Photo[];
}

// Portfolio shows your curated highlights. If you haven't marked anything
// `featured` yet (in data/photos.ts or the Supabase `featured` column),
// it falls back to showing everything, so the page is never empty.
export function getPortfolioPhotos(photos: Photo[]): Photo[] {
  const featured = photos.filter((p) => p.featured);
  return featured.length > 0 ? featured : photos;
}

export type RollLocation = {
  roll: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  count: number;
};

// Collapses photos into one map location per roll (trip), using the first
// photo in each roll that has coordinates. `count` is used by the heatmap
// to weight busier rolls more heavily.
export function getRollLocations(photos: Photo[]): RollLocation[] {
  const byRoll = new Map<string, RollLocation>();

  for (const p of photos) {
    if (typeof p.lat !== "number" || typeof p.lng !== "number") continue;
    const existing = byRoll.get(p.roll);
    if (existing) {
      existing.count += 1;
    } else {
      byRoll.set(p.roll, {
        roll: p.roll,
        city: p.city,
        country: p.country,
        lat: p.lat,
        lng: p.lng,
        count: 1,
      });
    }
  }

  return Array.from(byRoll.values());
}
