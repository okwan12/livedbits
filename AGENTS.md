# AGENTS.md

## Project
Personal photography and travel-journal website. Three jobs: show my photography,
share my interests, and act as a professional landing page for career connections.
Single-owner personal site — not a product. Keep it simple and personal, not corporate.

Reference sites for the feel: evebouffard.com and likescoffee.com — quiet, typographic,
lots of whitespace, photography as the hero, minimal UI. Match that restraint.

## Stack
- Next.js (App Router) + TypeScript
- Supabase — stores photos (`photos` table) and map locations (`places` table)
- Mapbox — clustered map of places from the `places` table
- Tailwind CSS for styling
- Deploys to Vercel (auto-deploy on push to main)

(If any of the above is wrong, correct this file — it's the source of truth for the stack.)

## Design direction
- Minimal and editorial. Near-black text on an off-white background. Restrained color;
  let the photos carry the color.
- Typography does the heavy lifting. Default pairing: a serif for headings/display
  (Fraunces or Instrument Serif) + a clean sans for body (Inter or Geist).
  Load fonts with `next/font`, not raw <link> tags.
- Layout is a narrow centered column with generous vertical breathing room
  (roughly `max-w-2xl mx-auto` with large vertical padding). Don't fill the width.
- Photo grid: two columns on desktop, one on mobile. Keep gutters clean.
- Prefer subtle over flashy. At most one or two small interactions, not animation everywhere.

## Sections
- Home / hero — name, one-line identity, sets the tone
- Photography — the grid, pulling from Supabase (not hardcoded placeholder arrays)
- Interests — short, personal blurbs (travel, photography, music/Afrobeats)
- Places — Mapbox map of saved locations
- Footer — professional links (LinkedIn, Instagram, email, etc.) as the "connections" board

## Writing / voice (for any copy you draft)
- Direct, specific, first-person. Grounded storytelling, not abstraction.
- No fluff, no hype, no robotic or resume-like phrasing. If it sounds like a marketing
  page or a LinkedIn cliché, rewrite it.
- Prose over bullet points in the actual site content.
- Keep tense consistent and avoid repeating the same word close together.
- Confident and non-tentative — no "I'm passionate about" filler.
- If you're unsure what a section should say, leave a clear TODO and ask me — don't
  invent biographical details or captions.

## Conventions
- Keep components small and readable. This is a personal site; don't over-engineer.
- Reuse Tailwind utility classes and existing patterns before inventing new ones.
- Keep secrets (Supabase keys, Mapbox token) in env vars, never committed.

## Workflow
- `npm run dev` to preview locally.
- Use Plan Mode for anything structural — show me the plan before writing code.
- Commit in small, logical chunks with plain commit messages.
- I deploy via Vercel on push; don't push to main without telling me first.

## Don't
- Don't run destructive commands (force push, hard reset, deleting files/tables)
  without asking me first.
- Don't add new dependencies or libraries without checking with me — explain why it's needed.
- Don't write placeholder marketing copy; leave a TODO instead.
- Don't over-format on-page content with bullet lists and bold — write prose.
- I'm still learning the terminal, so briefly explain any non-obvious command you run.
