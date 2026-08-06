export default function AboutPage() {
  return (
    <div className="px-6 md:px-12 py-12 max-w-2xl">
      <p className="font-mono text-xs tracking-widest2 uppercase text-rust mb-3">
        About
      </p>
      <h1 className="font-display text-5xl text-ink mb-6">Hey there :) </h1>
      <p className="font-body text-lg text-ink/80 leading-relaxed mb-4">
        I'm Olivia — I studied international business and marketing, spent a
        semester in Berlin, and have been finding reasons to be somewhere new
        ever since. This site is where I keep the photos and the notes that
        go with them, roll by roll.
      </p>
      <p className="font-body text-lg text-ink/80 leading-relaxed">
        Say hi at{" "}
        <a
          href="mailto:you@yourdomain.com"
          className="text-rust underline focus-ring"
        >
          you@yourdomain.com
        </a>
        .
      </p>
    </div>
  );
}
