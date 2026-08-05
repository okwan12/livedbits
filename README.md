# photo-journal

A photography portfolio + travel journal starter. Grid gallery on the home
page ("rolls" of photos with a contact-sheet-style hover caption), a journal
section for the stories behind each trip, and an about page.

## Design idea

The whole site borrows the vocabulary of a contact sheet: photos are grouped
into "rolls" (trips), each photo is a numbered "frame," and the hover caption
reads like an exposure label rather than a decorative tag. That's the one
consistent motif — everything else stays quiet so the photos do the work.

## Run it locally

You'll need Node.js 18.18+ installed.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Add your own photos

**Option A — keep it simple (static file):**
1. Drop images into `public/photos/` (or point at wherever you're hosting
   full-res files — Cloudinary, S3, etc.)
2. Edit `data/photos.ts` — each photo needs a `src`, `alt`, `city`,
   `country`, `date`, `roll` (a slug grouping photos from the same trip),
   and `frame` (its position in that roll). Map pins live in the separate
   `places` table — photos can optionally set `place_id` to link to one.

**Option B — Supabase (recommended once you have more than ~30 photos):**
See the "Connect Supabase" section below. The site automatically uses
Supabase if it's configured, and falls back to `data/photos.ts` if not —
so you can switch over whenever you're ready, nothing breaks in the
meantime.

## Connect Supabase (optional, for storing photos in a real database)

1. Go to supabase.com, sign in, and create a new project (free tier is
   plenty for this). Pick any region; note the database password it
   generates, you likely won't need it again for this project.
2. Once the project finishes provisioning, open **SQL Editor** in the left
   sidebar, click **New query**, paste in the entire contents of
   `supabase/schema.sql` from this repo, and click **Run**. This creates
   the `photos` table and seeds it with the same sample rows already in
   `data/photos.ts`.
3. Go to **Project Settings → API**. Copy the **Project URL** and the
   **anon public** key.
4. In this project, copy `.env.local.example` to a new file named
   `.env.local`, and paste those two values in as
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. Restart `npm run dev`. The home page now reads from Supabase instead of
   the static file.
6. To add real photos going forward: upload the image file itself to
   **Storage** in the Supabase dashboard (create a public bucket called
   `photos`), then insert a row into the `photos` table (Table Editor →
   photos → Insert row) with the `src` pointing at that file's public URL.

## Connect Mapbox (optional, for the pin map on the home page)

1. Go to mapbox.com and create a free account (the free tier covers far
   more map loads than a personal site will use).
2. Go to your **Account page** — there's a default public token already
   generated for you. Copy it.
3. Add it to `.env.local` as `NEXT_PUBLIC_MAPBOX_TOKEN`.
4. Restart `npm run dev`. The map on the home page plots pins from the
   `places` table (falling back to sample data in `data/places.ts` if
   the table is empty).
5. If you skip this step, the site still works fine — that section just
   renders nothing until a token is set.

## Add a journal entry

1. Create a new file in `content/journal/`, named `your-slug.md`.
2. Copy the frontmatter format from `content/journal/kyoto-spring.md`:
   `title`, `city`, `country`, `date`, `excerpt`, `coverPhoto`.
3. Write the entry body in plain Markdown below the frontmatter.
4. It'll show up automatically on `/journal` and at `/journal/your-slug`.

## Buying a domain

A few registrars that are straightforward and don't upsell hard: Namecheap,
Porkbun, and Cloudflare Registrar (Cloudflare sells at cost, no markup, but
you register through an existing account). Expect $10–20/year for a `.com`;
niche TLDs like `.photo`, `.gallery`, or `.travel` can run higher and are
worth a quick price check before you commit to one for the vanity.

Skip registrars that bundle hosting or "website builder" upsells at
checkout — you just want the domain itself.

## Deploying

The easiest path for a Next.js site like this is Vercel (same company that
builds Next.js, so it deploys with zero config):

1. Push this project to a GitHub repo.
2. Go to vercel.com, sign in with GitHub, and import the repo.
3. If you're using Supabase and/or Mapbox, add the same variables from
   `.env.local` under Settings → Environment Variables before your first
   deploy (or redeploy after adding them).
4. Vercel builds and deploys automatically — you'll get a live
   `yourproject.vercel.app` URL immediately.
5. In the Vercel project's Settings → Domains, add your purchased domain.
   Vercel gives you the DNS records to add; paste them into your
   registrar's DNS settings and it propagates within a few hours.

Netlify and Cloudflare Pages work the same way if you'd rather use one of
those.

## Where to take this next

- Swap the sample Picsum URLs for your real photos, either in
  `data/photos.ts` or as rows in Supabase.
- Add a search/filter by city or roll on the journal page.
- Add pagination or infinite scroll once you have more than a few dozen
  photos in the grid.
