import Link from "next/link";

export default function Nav() {
  return (
    <header className="sticky top-0 z-40 bg-paper/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 md:px-12 py-5">
        <Link
          href="/"
          className="font-display text-2xl tracking-tight text-ink focus-ring"
        >
          OLIVIA
        </Link>
        <nav className="flex gap-6 font-mono text-xs tracking-widest2 uppercase text-ink/70">
          <Link href="/" className="hover:text-rust focus-ring">
            Rolls
          </Link>
          <Link href="/journal" className="hover:text-rust focus-ring">
            Journal
          </Link>
          <Link href="/about" className="hover:text-rust focus-ring">
            About
          </Link>
        </nav>
      </div>
      <div className="sprocket-rule" />
    </header>
  );
}
