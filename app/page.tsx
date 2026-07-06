import PhotoGrid from "@/components/PhotoGrid";
import LocationMap from "@/components/LocationMap";
import { getPhotos, getRollLocations } from "@/lib/getPhotos";

export const revalidate = 60; // re-check Supabase for new photos every 60s

export default async function HomePage() {
  const photos = await getPhotos();
  const rollLocations = getRollLocations(photos);
  const rollCount = new Set(photos.map((p) => p.roll)).size;

  return (
    <div>
      <section className="px-6 md:px-12 pt-12 pb-10 max-w-3xl">
        <p className="font-mono text-xs tracking-widest2 uppercase text-rust mb-3">
          {rollCount} rolls developed · {photos.length} frames
        </p>
        <h1 className="font-display text-5xl md:text-7xl leading-[0.95] text-ink">
          A CONTACT SHEET
          <br />
          OF EVERYWHERE I'VE BEEN
        </h1>
        <p className="mt-5 font-body text-ink/70 text-lg max-w-xl">
          Every frame below belongs to a roll — a trip, a season, a reason to
          leave. Click through to see it larger, or head to the journal for
          the story behind it.
        </p>
      </section>

      <LocationMap locations={rollLocations} />

      <PhotoGrid photos={photos} />
    </div>
  );
}
