import { supabase } from "./supabaseClient";
import { albums as staticAlbums, type Album } from "@/data/albums";
import { photos as staticPhotos, type Photo } from "@/data/photos";

export async function getAlbums(): Promise<Album[]> {
  if (!supabase) return staticAlbums;

  const { data, error } = await supabase
    .from("albums")
    .select("id, title, slug, cover_image, sort_order")
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });

  if (error) {
    console.error("Supabase albums fetch failed, using static fallback:", error);
    return staticAlbums;
  }
  if (!data || data.length === 0) return staticAlbums;

  return data as Album[];
}

export async function getAlbumBySlug(slug: string): Promise<Album | null> {
  if (!supabase) {
    return staticAlbums.find((a) => a.slug === slug) ?? null;
  }

  const { data, error } = await supabase
    .from("albums")
    .select("id, title, slug, cover_image, sort_order")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Supabase album by slug failed:", error);
    return staticAlbums.find((a) => a.slug === slug) ?? null;
  }
  if (data) return data as Album;

  return staticAlbums.find((a) => a.slug === slug) ?? null;
}

function byFrameAsc(a: Photo, b: Photo): number {
  const af = a.frame;
  const bf = b.frame;
  if (af == null && bf == null) {
    // Stable-ish fallback among unnumbered photos: newer date first, then id.
    const ad = a.date ?? "";
    const bd = b.date ?? "";
    if (ad !== bd) return bd.localeCompare(ad);
    return a.id.localeCompare(b.id);
  }
  if (af == null) return 1; // nulls last
  if (bf == null) return -1;
  if (af !== bf) return af - bf;
  return a.id.localeCompare(b.id);
}

export async function getAlbumPhotos(albumId: string): Promise<Photo[]> {
  if (!supabase) {
    return staticPhotos
      .filter((p) => p.album_id === albumId)
      .slice()
      .sort(byFrameAsc);
  }

  const { data, error } = await supabase
    .from("photos")
    .select(
      "id, src, alt, city, country, date, roll, frame, featured, place_id, album_id"
    )
    .eq("album_id", albumId)
    .order("frame", { ascending: true, nullsFirst: false })
    .order("date", { ascending: false, nullsFirst: false })
    .order("id", { ascending: true });

  if (error) {
    console.error("Supabase album photos fetch failed:", error);
    return [];
  }

  return (data as Photo[]) ?? [];
}
