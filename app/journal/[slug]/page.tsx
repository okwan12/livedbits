import Image from "next/image";
import { getAllJournalSlugs, getJournalEntry } from "@/lib/journal";

export async function generateStaticParams() {
  return getAllJournalSlugs().map((slug) => ({ slug }));
}

export default async function JournalEntryPage({
  params,
}: {
  params: { slug: string };
}) {
  const { meta, html } = await getJournalEntry(params.slug);

  return (
    <article className="px-6 md:px-12 py-12 max-w-2xl mx-auto">
      <p className="font-mono text-[11px] tracking-widest2 uppercase text-ink/50">
        {meta.city}, {meta.country} — {meta.date}
      </p>
      <h1 className="font-display text-4xl md:text-5xl text-ink mt-2 mb-8">
        {meta.title.toUpperCase()}
      </h1>
      <div className="relative w-full aspect-[3/2] bg-ink mb-8">
        <Image
          src={meta.coverPhoto}
          alt={meta.title}
          fill
          sizes="(max-width: 768px) 100vw, 700px"
          className="object-cover"
        />
      </div>
      <div
        className="journal-body font-body text-ink/85 text-lg leading-relaxed"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  );
}
