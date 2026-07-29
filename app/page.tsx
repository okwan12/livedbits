import PhotoGrid from "@/components/PhotoGrid";
import { getPhotos } from "@/lib/getPhotos";

export const revalidate = 60; // re-check Supabase for new photos every 60s

export default async function HomePage() {
  const photos = await getPhotos();
  // Show a curated selection on the landing page; fall back to everything
  // if nothing has been marked featured yet.
  const featured = photos.filter((p) => p.featured);
  const gridPhotos = featured.length > 0 ? featured : photos;

  return (
    <div>
      <section className="max-w-2xl mx-auto px-6 pt-24 md:pt-32 pb-16">
        {/* TODO: confirm the name and one-line identity in your own words. */}
        <p className="mt-5 font-body text-lg md:text-xl text-ink/70 leading-relaxed">
        Welcome to my world.
        </p>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-24">
        <h2 className="font-body text-sm uppercase tracking-widest2 text-ink/50 mb-8">
          Photography
        </h2>
        <PhotoGrid photos={gridPhotos} />
      </section>

      <section className="max-w-2xl mx-auto px-6 pb-28">
        <h2 className="font-body text-sm uppercase tracking-widest2 text-ink/50 mb-8">
          Interests
        </h2>
        {/* TODO: rewrite these in your own words — grounded, first person, no
            filler. Add or remove blurbs as you like. */}
        <div className="space-y-6 font-body text-lg text-ink/80 leading-relaxed">
          <p>
            Most of what's here started with leaving. A semester in Berlin
            turned into a habit of finding reasons to be somewhere unfamiliar.
          </p>
          <p>
            I shoot mostly on film. The slowness suits me — a roll makes you
            wait, and choose.
          </p>
          <p>
            {/* TODO: make this line yours. */}
            Afrobeats is usually what's playing while I edit.
          </p>
        </div>
      </section>
    </div>
  );
}
