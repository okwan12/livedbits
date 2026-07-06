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
  title: "Olivia — Photo Journal",
  description: "Photography and travel notes, one roll at a time.",
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
        <footer className="border-t border-ink/10 mt-24 py-10 px-6 md:px-12 text-sm text-ink/60 font-mono flex flex-col md:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} — shot on film, mostly.</span>
          <span>Built with Next.js, hosted wherever the domain points.</span>
        </footer>
      </body>
    </html>
  );
}
