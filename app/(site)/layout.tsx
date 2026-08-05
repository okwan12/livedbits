import Nav from "@/components/Nav";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav />
      <main>{children}</main>
      <footer className="border-t border-ink/10 mt-24">
        <div className="px-8 py-12 flex flex-col md:flex-row md:items-center md:justify-between gap-1">
          <p className="font-body text-sm text-ink/60">
            © {new Date().getFullYear()} livedbits
          </p>
          {/* TODO: replace these with your real profile URLs and email. */}
          <nav className="flex gap-6 font-body text-sm text-ink/70">
            <a
              href="https://www.linkedin.com/in/oliviakwan1201"
              target="_blank"
              rel="noreferrer"
              className="hover:text-rust focus-ring"
            >
              LinkedIn
            </a>
            <a
              href="https://www.instagram.com/livedbits"
              target="_blank"
              rel="noreferrer"
              className="hover:text-rust focus-ring"
            >
              Instagram
            </a>
            <a
              href="mailto:heyoliviak@gmail.com"
              className="hover:text-rust focus-ring"
            >
              Email
            </a>
          </nav>
        </div>
      </footer>
    </>
  );
}
