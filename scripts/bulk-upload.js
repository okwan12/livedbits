// Bulk-uploads photos to Supabase Storage and inserts matching rows into
// the `photos` table, driven by uploads/manifest.csv.
//
// Usage:
//   node scripts/bulk-upload.js
//
// Setup (one-time): see scripts/README.md

require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const { createClient } = require("@supabase/supabase-js");

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const MANIFEST_PATH = path.join(UPLOADS_DIR, "manifest.csv");
const BUCKET = "photos";

const CONTENT_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

function fail(message) {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    fail(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.\n" +
        "  Get the service role key from Supabase: Project Settings > API > service_role secret.\n" +
        "  (This key is powerful — never put it in NEXT_PUBLIC_ vars or commit it.)"
    );
  }

  if (!fs.existsSync(MANIFEST_PATH)) {
    fail(
      `No manifest found at ${MANIFEST_PATH}.\n` +
        "  Copy scripts/manifest.example.csv to uploads/manifest.csv and fill it in."
    );
  }

  const supabase = createClient(url, serviceKey);

  const csvText = fs.readFileSync(MANIFEST_PATH, "utf8");
  const rows = parse(csvText, { columns: true, skip_empty_lines: true, trim: true });

  if (rows.length === 0) {
    fail("manifest.csv has no rows to process.");
  }

  console.log(`Found ${rows.length} row(s) in manifest.csv\n`);

  let succeeded = 0;
  let failed = 0;

  for (const row of rows) {
    const { filename, city, country, date, roll, frame, lat, lng, alt } = row;

    if (!filename || !city || !country || !date || !roll || !frame) {
      console.warn(`⚠ Skipping row, missing a required field: ${JSON.stringify(row)}`);
      failed++;
      continue;
    }

    const localPath = path.join(UPLOADS_DIR, filename);
    if (!fs.existsSync(localPath)) {
      console.warn(`⚠ Skipping "${filename}" — file not found in uploads/`);
      failed++;
      continue;
    }

    const ext = path.extname(filename).toLowerCase();
    const contentType = CONTENT_TYPES[ext] || "application/octet-stream";
    const storagePath = `${roll}/${filename}`;
    const id = `${roll}-${frame}`;

    try {
      const fileBuffer = fs.readFileSync(localPath);

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, fileBuffer, { contentType, upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(storagePath);

      const { error: insertError } = await supabase.from("photos").upsert({
        id,
        src: publicUrlData.publicUrl,
        alt: alt || `${city} — frame ${frame}`,
        city,
        country,
        date,
        roll,
        frame: Number(frame),
        lat: lat ? Number(lat) : null,
        lng: lng ? Number(lng) : null,
      });

      if (insertError) throw insertError;

      console.log(`✓ ${filename} → ${roll} frame ${frame}`);
      succeeded++;
    } catch (err) {
      console.error(`✗ ${filename} failed: ${err.message || err}`);
      failed++;
    }
  }

  console.log(`\nDone. ${succeeded} uploaded, ${failed} failed/skipped.`);
  if (failed > 0) {
    console.log("Fix the rows above in uploads/manifest.csv and re-run — already-uploaded photos will be skipped safely.");
  }
}

main();
