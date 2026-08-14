export type Photo = {
  id: string;
  src: string;
  alt: string | null;
  city: string | null;
  country: string | null;
  date: string | null; // YYYY-MM-DD
  roll: string | null; // optional trip/roll grouping
  frame: number | null; // optional position within the roll
  featured?: boolean; // shows up on homepage / portfolio when true
  place_id?: string | null; // optional link to places.id
  album_id?: string | null; // optional link to albums.id
};

// Replace src with your own images once you've dropped them in /public/photos
// or point at your Supabase/Cloudinary storage URLs.
export const photos: Photo[] = [
  {
    id: "p1",
    src: "https://picsum.photos/id/1015/1200/1500",
    alt: "River valley at dusk",
    city: "Kyoto",
    country: "Japan",
    date: "2026-03-14",
    roll: "kyoto-spring",
    frame: 1,
    featured: true,
    album_id: "a1",
  },
  {
    id: "p2",
    src: "https://picsum.photos/id/1016/1200/900",
    alt: "Mountain ridge line",
    city: "Kyoto",
    country: "Japan",
    date: "2026-03-15",
    roll: "kyoto-spring",
    frame: 2,
    album_id: "a1",
  },
  {
    id: "p3",
    src: "https://picsum.photos/id/1024/1200/1500",
    alt: "Street corner, wet pavement",
    city: "Berlin",
    country: "Germany",
    date: "2025-10-02",
    roll: "berlin-fall",
    frame: 1,
    featured: true,
    album_id: "a2",
  },
  {
    id: "p4",
    src: "https://picsum.photos/id/1041/1200/1500",
    alt: "Old bridge over canal",
    city: "Amsterdam",
    country: "Netherlands",
    date: "2025-09-20",
    roll: "amsterdam-canals",
    frame: 1,
  },
  {
    id: "p5",
    src: "https://picsum.photos/id/1043/1200/900",
    alt: "Fog over the bay",
    city: "San Francisco",
    country: "USA",
    date: "2026-05-11",
    roll: "sf-goodbye",
    frame: 1,
    featured: true,
    album_id: "a3",
  },
  {
    id: "p6",
    src: "https://picsum.photos/id/1050/1200/1500",
    alt: "Neon signage at night",
    city: "Tokyo",
    country: "Japan",
    date: "2026-03-18",
    roll: "kyoto-spring",
    frame: 3,
    album_id: "a1",
  },
];
