
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import Nav from "@/components/Nav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "livedbits",
  description: "Welcome to my world.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
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
                href="https://www.linkedin.com/in/your-handle"
                target="_blank"
                rel="noreferrer"
                className="hover:text-rust focus-ring"
              >
                LinkedIn
              </a>
              <a
                href="https://www.instagram.com/your-handle"
                target="_blank"
                rel="noreferrer"
                className="hover:text-rust focus-ring"
              >
                Instagram
              </a>
              <a
                href="mailto:you@yourdomain.com"
                className="hover:text-rust focus-ring"
              >
                Email
              </a>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
