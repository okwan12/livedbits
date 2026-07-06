# Bulk uploading photos

This uploads a batch of photos to Supabase Storage and creates the matching
rows in your `photos` table in one go, instead of doing it one-by-one in
the Supabase dashboard.

## One-time setup

1. Run `npm install` if you haven't since this was added (pulls in
   `csv-parse` and `dotenv`).
2. Get your **service role key**: Supabase dashboard → your project →
   **Project Settings → API** → copy the `service_role` secret (it's
   below the `anon` key, click "Reveal" if it's hidden).
3. Add it to `.env.local` as `SUPABASE_SERVICE_ROLE_KEY=...`. This key is
   different from the anon key you already added — it has full admin
   access, so it's used only by this script (which runs on your machine),
   never in the website code itself. `.env.local` is already git-ignored,
   so it won't get committed.

## Every time you want to upload a batch

1. Put your photo files directly in the `uploads/` folder.
2. Copy `scripts/manifest.example.csv` to `uploads/manifest.csv` (only
   needs to be created once — after that just keep editing/adding rows).
3. Open `uploads/manifest.csv` in Excel, Numbers, Google Sheets, or even
   Cursor's built-in editor, and fill in one row per photo:

   | column | what it is |
   |---|---|
   | `filename` | must exactly match the file in `uploads/`, e.g. `kyoto-01.jpg` |
   | `city` / `country` | where it was shot |
   | `date` | `YYYY-MM-DD` |
   | `roll` | a slug grouping photos from the same trip, e.g. `kyoto-spring` — use the same roll name for every photo from that trip |
   | `frame` | that photo's position within the roll (1, 2, 3...) |
   | `lat` / `lng` | coordinates for the map pin (optional — look up "[city] coordinates" if you don't know them) |
   | `alt` | a short description, for accessibility and the lightbox caption |

4. Run:
   ```
   npm run upload-photos
   ```
5. Watch the output — it prints a ✓ line per photo that succeeded, and a
   ✗ or ⚠ line for anything that failed (missing file, missing required
   field, etc.) along with why.
6. Refresh `localhost:3000` — your new photos should be in the grid.

## Notes

- **Re-running is safe.** If a photo already uploaded successfully, running
  the script again just re-uploads/re-inserts the same data — it won't
  create duplicates, because each row's `id` is built from `roll-frame`.
- **Fixing a bad row:** if a photo fails (say, a typo in the filename),
  just fix that row in `manifest.csv` and run `npm run upload-photos`
  again — it'll skip past the ones that already worked.
- Photos in `uploads/` are git-ignored (they can be large), so this folder
  stays local to your machine — only `manifest.csv` itself is tracked.
