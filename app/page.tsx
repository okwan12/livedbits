import dynamic from "next/dynamic";
import PhotoGrid from "@/components/PhotoGrid";
import { getPhotos } from "@/lib/getPhotos";
import { getPlaces } from "@/lib/getPlaces";

// Mapbox touches `document` at import time — never SSR this component.
const CheckInMap = dynamic(() => import("@/components/CheckInMap"), {
  ssr: false,
  loading: () => (
    <div className="h-72 md:h-[440px] w-full rounded-2xl bg-ink/[0.03]" />
  ),
});

export const revalidate = 60; // re-check Supabase for new photos/places every 60s

export default async function HomePage() {
  const [photos, places] = await Promise.all([getPhotos(), getPlaces()]);

  return (
    <div>
      <section className="px-8 pt-8 md:pt-12 pb-16">
        {/* TODO: confirm the name and one-line identity in your own words. */}
        <p className="mt-5 font-body text-lg md:text-xl text-ink/70 leading-relaxed">
        Welcome to my world.
        </p>
      </section>

      <section className="px-8 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <h2 className="font-body text-sm uppercase tracking-widest2 text-ink/50 mb-8">
              Stops
            </h2>
            <CheckInMap
              places={places}
              className="h-72 md:h-[440px] w-full rounded-2xl"
            />
          </div>

          <div className="md:col-span-1">
            <h2 className="font-body text-sm uppercase tracking-widest2 text-ink/50 mb-8">
              Currently...
            </h2>
            {/* TODO: replace the placeholder numbers and lines below with your
                own. Keep them short and specific; delete any row that doesn't
                apply to you. */}
            <div className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-6 md:h-[440px] overflow-y-auto font-body">
              <div className="space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-widest2 text-ink/40 mb-2">
                    Based in
                  </p>
                  <p className="text-sm text-ink/70">New Jersey</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-widest2 text-ink/40 mb-2">
                    Listening to
                  </p>
                  {/* TODO: a few tracks or artists, one per line */}
                  <div className="space-y-1 text-sm text-ink/70">
                    <p>—</p>
                    <p>—</p>
                    <p>—</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-widest2 text-ink/40 mb-2">
                    into
                  </p>
                  {/* TODO: a sentence on what you're up to right now */}
                  <p className="text-sm text-ink/70 leading-relaxed">—</p>
                </div>

                <div className="h-px bg-ink/10" />

                <div className="space-y-4">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-2xl text-ink">
                      {/* TODO */}—
                    </span>
                    <span className="text-sm text-ink/60">countries visited</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-2xl text-ink">
                      {/* TODO */}—
                    </span>
                    <span className="text-sm text-ink/60">cities explored</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-2xl text-ink">
                      {/* TODO */}—
                    </span>
                    <span className="text-sm text-ink/60">total stops</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-8 pb-24">
        <h2 className="font-body text-sm uppercase tracking-widest2 text-ink/50 mb-8">
          Cleaning out my Camera Roll
        </h2>
        <PhotoGrid photos={photos.slice(0, 6)} />
      </section>

      <section className="px-8 pb-28">
        <h2 className="font-body text-sm uppercase tracking-widest2 text-ink/50 mb-8">
          Quote of the Week
        </h2>
        {/* TODO: rewrite these in your own words — grounded, first person, no
            filler. Add or remove blurbs as you like. */}
        <div className="space-y-6 font-body text-lg text-ink/80 leading-relaxed">
          <p>
          "So maybe our grip on reality should be a little lighter, too, enabling us to see what is in front of us rather than only what we think we see." - Carol Bove
          </p>
        </div>
      </section>
    </div>
  );
}
