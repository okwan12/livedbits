export type Photo = {
  id: string;
  src: string;
  alt: string;
  city: string;
  country: string;
  date: string; // YYYY-MM-DD
  roll: string; // groups photos into a "contact sheet" roll, e.g. a trip
  frame: number; // position within the roll
  lat?: number; // used to plot the roll on the map
  lng?: number;
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
    lat: 35.0116,
    lng: 135.7681,
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
    lat: 35.0116,
    lng: 135.7681,
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
    lat: 52.52,
    lng: 13.405,
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
    lat: 52.3676,
    lng: 4.9041,
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
    lat: 37.7749,
    lng: -122.4194,
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
    lat: 35.0116,
    lng: 135.7681,
  },
];
