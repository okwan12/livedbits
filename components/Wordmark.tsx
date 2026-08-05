import Link from "next/link";

// Swap the inner content for an <Image> later when you have the
// stitched-style graphic — keep this wrapper/link the same.
export default function Wordmark() {
  return (
    <Link
      href="/home"
      aria-label="Enter livedbits"
      className="group inline-block focus-ring rounded-sm transition duration-300 ease-out hover:-translate-y-1 hover:drop-shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
    >
      {/* TODO: replace this text with your stitched wordmark image */}
      <span className="font-sans text-5xl md:text-7xl tracking-tight text-ink transition duration-300 group-hover:opacity-90">
        livedbits
      </span>
    </Link>
  );
}
