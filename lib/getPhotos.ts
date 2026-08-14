import { supabase } from "./supabaseClient";
import { photos as staticPhotos, type Photo } from "@/data/photos";

export async function getPhotos(): Promise<Photo[]> {
  if (!supabase) return staticPhotos;

  const { data, error } = await supabase
    .from("photos")
    .select(
      "id, src, alt, city, country, date, roll, frame, featured, place_id, album_id"
    )
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
