import Link from "next/link";
import { notFound } from "next/navigation";
import PhotoGrid from "@/components/PhotoGrid";
import { getAlbumBySlug, getAlbumPhotos } from "@/lib/getAlbums";

export const revalidate = 60;

type Props = {
  params: { slug: string };
};

export default async function AlbumPage({ params }: Props) {
  const album = await getAlbumBySlug(params.slug);
  if (!album) notFound();

  const photos = await getAlbumPhotos(album.id);

  return (
    <div className="px-8 pt-8 md:pt-12 pb-28">
      <Link
        href="/through-my-eyes"
        className="font-body text-sm text-ink/50 hover:text-rust focus-ring inline-block mb-6"
      >
        ← Through My Eyes
      </Link>
      <h1 className="font-display text-3xl md:text-4xl tracking-tight text-ink mb-8">
        {album.title}
      </h1>
      {photos.length > 0 ? (
        <PhotoGrid photos={photos} />
      ) : (
        <p className="font-body text-sm text-ink/50">
          No photos in this album yet.
        </p>
      )}
    </div>
  );
}
