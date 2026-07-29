"use client";

import { useState } from "react";
import Image from "next/image";
import type { Photo } from "@/data/photos";

export default function PhotoGrid({ photos }: { photos: Photo[] }) {
  const [active, setActive] = useState<Photo | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {photos.map((photo) => (
          <button
            key={photo.id}
            onClick={() => setActive(photo)}
            className="group relative aspect-[4/5] bg-ink/5 overflow-hidden focus-ring text-left"
            aria-label={`Open photo: ${photo.alt}, ${photo.city}`}
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition duration-500 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition duration-300 bg-gradient-to-t from-ink/70 to-transparent">
              <p className="font-body text-sm text-paper">
                {photo.city}, {photo.country}
              </p>
            </div>
          </button>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 bg-ink/95 flex items-center justify-center px-4 py-8"
          role="dialog"
          aria-modal="true"
          onClick={() => setActive(null)}
        >
          <button
            className="absolute top-6 right-6 text-paper font-body text-sm focus-ring"
            onClick={() => setActive(null)}
            aria-label="Close"
          >
            Close ✕
          </button>
          <figure
            className="max-w-3xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full aspect-[4/5] md:aspect-[3/2]">
              <Image
                src={active.src}
                alt={active.alt}
                fill
                sizes="90vw"
                className="object-contain"
              />
            </div>
            <figcaption className="mt-4 font-body text-sm text-paper/70 flex flex-wrap gap-x-4 gap-y-1">
              <span>
                {active.city}, {active.country}
              </span>
              <span>{active.date}</span>
            </figcaption>
          </figure>
        </div>
      )}
    </>
  );
}
