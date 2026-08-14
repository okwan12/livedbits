import Image from "next/image";
import { getPhotos, getPortfolioPhotos } from "@/lib/getPhotos";

export const revalidate = 60;

export default async function PortfolioPage() {
  const allPhotos = await getPhotos();
  const photos = getPortfolioPhotos(allPhotos);

  return (
    <div className="px-6 md:px-12 py-12">
      <p className="font-mono text-xs tracking-widest2 uppercase text-rust mb-3">
        Portfolio
      </p>
      <h1 className="font-display text-5xl md:text-6xl text-ink mb-4">
        SELECTED FRAMES
      </h1>
      <p className="font-body text-ink/70 text-lg max-w-xl mb-12">
        A short list of the shots I'd show first — pulled from every roll,
        not organized by trip. The full contact sheet is under{" "}
        <span className="font-mono text-sm">Rolls</span>.
      </p>

      <div className="flex flex-col gap-16 md:gap-24 max-w-4xl mx-auto">
        {photos.map((photo, i) => (
          <figure key={photo.id}>
            <div className="relative w-full aspect-[3/2] bg-ink">
              <Image
                src={photo.src}
                alt={photo.alt ?? ""}
                fill
                sizes="(max-width: 768px) 100vw, 900px"
                priority={i === 0}
                className="object-cover"
              />
            </div>
            <figcaption className="mt-4 flex justify-between items-baseline font-mono text-xs tracking-widest2 uppercase text-ink/50">
              <span>{photo.alt ?? ""}</span>
              <span>
                {[
                  [photo.city, photo.country].filter(Boolean).join(", "),
                  photo.date,
                ]
                  .filter(Boolean)
                  .join(" — ")}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
