import Link from "next/link";
import Image from "next/image";
import { getAllJournalMeta } from "@/lib/journal";

export default function JournalPage() {
  const entries = getAllJournalMeta();

  return (
    <div className="px-6 md:px-12 py-12">
      <p className="font-mono text-xs tracking-widest2 uppercase text-rust mb-3">
        Journal
      </p>
      <h1 className="font-display text-5xl md:text-6xl text-ink mb-10">
        NOTES FROM THE ROAD
      </h1>
      <div className="grid md:grid-cols-2 gap-8">
        {entries.map((entry) => (
          <Link
            key={entry.slug}
            href={`/journal/${entry.slug}`}
            className="group block focus-ring glass-panel p-5"
          >
            <div className="relative aspect-[3/2] bg-ink overflow-hidden mb-3">
              <Image
                src={entry.coverPhoto}
                alt={entry.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition duration-500 group-hover:scale-[1.03]"
              />
            </div>
            <p className="font-mono text-[11px] tracking-widest2 uppercase text-ink/50">
              {entry.city}, {entry.country} — {entry.date}
            </p>
            <h2 className="font-display text-2xl text-ink mt-1 group-hover:text-rust transition">
              {entry.title}
            </h2>
            <p className="font-body text-ink/70 mt-1">{entry.excerpt}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
