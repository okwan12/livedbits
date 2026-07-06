import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkHtml from "remark-html";

const journalDir = path.join(process.cwd(), "content/journal");

export type JournalMeta = {
  slug: string;
  title: string;
  city: string;
  country: string;
  date: string;
  excerpt: string;
  coverPhoto: string;
};

export function getAllJournalSlugs(): string[] {
  return fs
    .readdirSync(journalDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

export function getJournalMeta(slug: string): JournalMeta {
  const fullPath = path.join(journalDir, `${slug}.md`);
  const raw = fs.readFileSync(fullPath, "utf8");
  const { data } = matter(raw);
  return { slug, ...(data as Omit<JournalMeta, "slug">) };
}

export function getAllJournalMeta(): JournalMeta[] {
  return getAllJournalSlugs()
    .map(getJournalMeta)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getJournalEntry(slug: string) {
  const fullPath = path.join(journalDir, `${slug}.md`);
  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);
  const processed = await remark().use(remarkHtml).process(content);
  return {
    meta: { slug, ...(data as Omit<JournalMeta, "slug">) },
    html: processed.toString(),
  };
}
