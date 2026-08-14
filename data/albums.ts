export type Album = {
  id: string;
  title: string;
  slug: string;
  cover_image: string;
  sort_order: number;
};

// Static fallback when Supabase is unreachable or albums is empty.
export const albums: Album[] = [
  {
    id: "a1",
    title: "Kyoto Spring",
    slug: "kyoto-spring",
    cover_image: "https://picsum.photos/id/1015/1200/1500",
    sort_order: 1,
  },
  {
    id: "a2",
    title: "Berlin Fall",
    slug: "berlin-fall",
    cover_image: "https://picsum.photos/id/1024/1200/1500",
    sort_order: 2,
  },
  {
    id: "a3",
    title: "San Francisco",
    slug: "sf-goodbye",
    cover_image: "https://picsum.photos/id/1043/1200/900",
    sort_order: 3,
  },
];
