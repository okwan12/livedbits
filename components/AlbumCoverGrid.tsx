import Image from "next/image";
import Link from "next/link";
import type { Album } from "@/data/albums";

export default function AlbumCoverGrid({ albums }: { albums: Album[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
      {albums.map((album) => (
        <Link
          key={album.id}
          href={`/through-my-eyes/${encodeURIComponent(album.slug)}`}
          className="group relative aspect-[4/5] bg-ink/5 overflow-hidden focus-ring block"
          aria-label={`Open album: ${album.title}`}
        >
          <Image
            src={album.cover_image}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition duration-500 group-hover:scale-[1.02]"
          />
        </Link>
      ))}
    </div>
  );
}
