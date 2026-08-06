import { supabase } from "./supabaseClient";
import type { Song } from "@/data/songs";

// Fetches the hand-maintained listening list. Empty / missing table → [].
export async function getSongs(): Promise<Song[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("songs")
    .select("id, title, artist, url, sort_order")
    .order("sort_order", { ascending: true });

  if (error || !data) {
    console.error("Supabase songs fetch failed:", error);
    return [];
  }

  return data as Song[];
}
