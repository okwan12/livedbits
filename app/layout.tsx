
import type { Metadata } from "next";
import { Big_Shoulders_Display, Lora, IBM_Plex_Mono } from "next/font/google";
import "@/styles/globals.css";
import Nav from "@/components/Nav";

const display = Big_Shoulders_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700"],
});
const body = Lora({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500"],
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
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
    <html lang="en">
      <body
        className={`${display.variable} ${body.variable} ${mono.variable} font-body`}
      >
        <Nav />
        <main>{children}</main>
        <footer className="border-t border-ink/10 mt-24">
          <div className="max-w-4xl mx-auto px-6 py-16 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
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
