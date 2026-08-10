// Update existing places.lat/lng from Google Maps URLs in a CSV.
// Prefers place-marker !3dLAT!4dLNG, then camera @LAT,LNG.
// Matches CSV rows to places by name and UPDATEs by id — never inserts.
//
// Usage:
//   npm run fixup-places-coords -- --csv path/to.csv --names "Bake Sum" --dry-run
//   npm run fixup-places-coords -- --csv path/to.csv --names "Bake Sum"
//   npm run fixup-places-coords -- --csv path/to.csv
//
// Needs in .env.local:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const { createClient } = require("@supabase/supabase-js");

// Place marker (preferred): !3dLAT!4dLNG
const MARKER_COORDS = /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/i;
// Camera center (fallback): /@37.8126761,-122.2501748,17z
const CAMERA_COORDS = /@(-?\d+\.?\d*),(-?\d+\.?\d*)(?:,[\d.]+z)?/i;

function fail(message) {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

function cell(row, ...keys) {
  for (const key of keys) {
    if (row[key] != null && String(row[key]).trim() !== "") {
      return String(row[key]).trim();
    }
  }
  const lower = Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k.trim().toLowerCase(), v])
  );
  for (const key of keys) {
    const v = lower[key.trim().toLowerCase()];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

function validLatLng(lat, lng) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function coordsFromMapsUrl(url) {
  if (!url) return null;
  const text = String(url);

  const marker = text.match(MARKER_COORDS);
  if (marker) {
    const lat = Number(marker[1]);
    const lng = Number(marker[2]);
    if (validLatLng(lat, lng)) return { lat, lng, source: "marker" };
  }

  const camera = text.match(CAMERA_COORDS);
  if (camera) {
    const lat = Number(camera[1]);
    const lng = Number(camera[2]);
    if (validLatLng(lat, lng)) return { lat, lng, source: "camera" };
  }

  return null;
}

function parseArgs(argv) {
  const opts = {
    csv: null,
    dryRun: false,
    names: null,
    limit: null,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      opts.dryRun = true;
    } else if (arg === "--csv") {
      opts.csv = argv[++i];
    } else if (arg === "--names") {
      opts.names = argv[++i]
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    } else if (arg === "--limit") {
      opts.limit = Number(argv[++i]);
    } else {
      fail(`Unknown argument: ${arg}`);
    }
  }

  if (!opts.csv) {
    fail(
      "Missing --csv path.\n" +
        '  Example: npm run fixup-places-coords -- --csv ~/Downloads/places.csv --names "Bake Sum" --dry-run'
    );
  }
  if (opts.limit != null && (!Number.isFinite(opts.limit) || opts.limit < 1)) {
    fail("--limit must be a positive number.");
  }

  return opts;
}

async function loadPlacesByName(supabase) {
  const byName = new Map();
  const pageSize = 1000;
  let from = 0;

  for (;;) {
    const { data, error } = await supabase
      .from("places")
      .select("id, name, lat, lng")
      .range(from, from + pageSize - 1);

    if (error) throw new Error(`Failed to load places: ${error.message}`);
    if (!data || data.length === 0) break;

    for (const row of data) {
      if (row.name) byName.set(String(row.name).trim().toLowerCase(), row);
    }

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return byName;
}

async function main() {
  const opts = parseArgs(process.argv);
  const csvPath = path.resolve(opts.csv);

  if (!fs.existsSync(csvPath)) fail(`CSV not found: ${csvPath}`);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    fail("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  }

  const supabase = createClient(url, serviceKey);

  let rows = parse(fs.readFileSync(csvPath, "utf8"), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });

  rows = rows.filter((r) => cell(r, "Title", "title"));
  if (opts.names) {
    rows = rows.filter((r) =>
      opts.names.includes(cell(r, "Title", "title").toLowerCase())
    );
  }
  if (opts.limit != null) {
    rows = rows.slice(0, opts.limit);
  }

  if (rows.length === 0) {
    fail("No matching CSV rows to process.");
  }

  console.log(`CSV: ${csvPath}`);
  console.log(`Mode: ${opts.dryRun ? "dry-run (no DB writes)" : "update"}`);
  console.log(`Rows to consider: ${rows.length}\n`);

  const placesByName = await loadPlacesByName(supabase);

  let updated = 0;
  let skipped = 0;
  let missing = 0;
  let failed = 0;
  const failures = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = cell(row, "Title", "title");
    const mapsUrl = cell(row, "URL", "url");
    const indexLabel = `[${i + 1}/${rows.length}]`;
    const place = placesByName.get(name.toLowerCase());

    if (!place) {
      console.log(`${indexLabel} ↷ "${name}" — not in places table`);
      missing++;
      continue;
    }

    let coords = coordsFromMapsUrl(mapsUrl);
    if (!coords) {
      const latRaw = cell(row, "Latitude", "latitude", "lat");
      const lngRaw = cell(row, "Longitude", "longitude", "lng", "lon", "long");
      if (latRaw && lngRaw) {
        const lat = Number(latRaw);
        const lng = Number(lngRaw);
        if (validLatLng(lat, lng)) coords = { lat, lng, source: "columns" };
      }
    }
    if (!coords) {
      console.log(
        `${indexLabel} ↷ "${name}" — no !3d!4d, @LAT,LNG, or Lat/Lng columns`
      );
      skipped++;
      continue;
    }

    const before = `${place.lat}, ${place.lng}`;
    const after = `${coords.lat}, ${coords.lng}`;
    const unchanged =
      Number(place.lat) === coords.lat && Number(place.lng) === coords.lng;

    if (unchanged) {
      console.log(
        `${indexLabel} = "${name}" already ${after} (${coords.source})`
      );
      skipped++;
      continue;
    }

    if (opts.dryRun) {
      console.log(
        `${indexLabel} ↻ "${name}" ${before} → ${after} (${coords.source}) [dry-run]`
      );
      updated++;
      continue;
    }

    const { error } = await supabase
      .from("places")
      .update({ lat: coords.lat, lng: coords.lng })
      .eq("id", place.id);

    if (error) {
      console.log(`${indexLabel} ✗ "${name}" — ${error.message}`);
      failed++;
      failures.push({ name, reason: error.message });
      continue;
    }

    place.lat = coords.lat;
    place.lng = coords.lng;
    console.log(
      `${indexLabel} ↻ "${name}" ${before} → ${after} (${coords.source})`
    );
    updated++;
  }

  console.log("\n—— Summary ——");
  console.log(`Updated: ${updated}`);
  console.log(`Skipped (no URL coords / already precise): ${skipped}`);
  console.log(`Not in places table: ${missing}`);
  console.log(`Failed: ${failed}`);
  if (failures.length) {
    console.log("\nFailures:");
    for (const f of failures) console.log(`  • ${f.name} — ${f.reason}`);
  }
  console.log("");
}

main().catch((err) => fail(err instanceof Error ? err.message : String(err)));
