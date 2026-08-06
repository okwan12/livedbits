import PhotoGrid from "@/components/PhotoGrid";
import { getPhotos } from "@/lib/getPhotos";

export const revalidate = 60;

export default async function ThroughMyEyesPage() {
  const photos = await getPhotos();

  return (
    <div className="px-8 pt-8 md:pt-12 pb-28">
      <h1 className="font-body text-sm uppercase tracking-widest2 text-ink/50 mb-8">
        Through My Eyes
      </h1>
      <PhotoGrid photos={photos} />
    </div>
  );
}
