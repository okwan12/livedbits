import Link from "next/link";

export default function Nav() {
  return (
    <header className="sticky top-0 z-40 bg-paper/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-8 py-5">
        <Link
          href="/"
          className="font-display text-xl tracking-tight text-ink focus-ring"
        >
          livedbits
        </Link>
        <nav className="flex gap-6 font-body text-sm text-ink/70">
          <Link href="/through-my-eyes" className="hover:text-rust focus-ring">
            Through My Eyes
          </Link>
          <Link href="/journal" className="hover:text-rust focus-ring">
            Journal
          </Link>
          <Link href="/about" className="hover:text-rust focus-ring">
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
