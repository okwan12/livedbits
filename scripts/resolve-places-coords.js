// Resolve short Google Maps place URLs in a headless browser, parse !3d!4d
// place-marker coordinates from the expanded URL, and UPDATE existing places
// by name. Never inserts. Never uses @ camera coords or CSV Lat/Lng columns.
//
// Usage:
//   npm run resolve-places-coords -- --csv path/to.csv --names "A,B" --dry-run
//   npm run resolve-places-coords -- --csv path/to.csv --limit 5
//   npm run resolve-places-coords -- --csv path/to.csv
//
// Needs in .env.local:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// Needs: playwright (devDependency) + `npx playwright install chromium`

require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const { createClient } = require("@supabase/supabase-js");
const { chromium } = require("playwright");

const MARKER_COORDS = /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/i;
const DEFAULT_DELAY_MS = 1750;
const NAV_TIMEOUT_MS = 20000;
const MARKER_WAIT_MS = 20000;

function fail(message) {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function markerFromUrl(url) {
  if (!url) return null;
  const m = String(url).match(MARKER_COORDS);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (!validLatLng(lat, lng)) return null;
  return { lat, lng };
}

function parseArgs(argv) {
  const opts = {
    csv: null,
    dryRun: false,
    names: null,
    limit: null,
    delayMs: DEFAULT_DELAY_MS,
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
    } else if (arg === "--delay-ms") {
      opts.delayMs = Number(argv[++i]);
    } else {
      fail(`Unknown argument: ${arg}`);
    }
  }

  if (!opts.csv) {
    fail(
      "Missing --csv path.\n" +
        '  Example: npm run resolve-places-coords -- --csv ~/Downloads/places.csv --names "16th Avenue Tiled Steps" --dry-run'
    );
  }
  if (opts.limit != null && (!Number.isFinite(opts.limit) || opts.limit < 1)) {
    fail("--limit must be a positive number.");
  }
  if (!Number.isFinite(opts.delayMs) || opts.delayMs < 0) {
    fail("--delay-ms must be a non-negative number.");
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

async function resolveMarkerCoords(page, mapsUrl) {
  await page.goto(mapsUrl, {
    waitUntil: "domcontentloaded",
    timeout: NAV_TIMEOUT_MS,
  });

  // Consent / cookie banners (EU and common variants) — best-effort.
  for (const label of ["Accept all", "I agree", "Accept"]) {
    const btn = page.getByRole("button", { name: label, exact: false });
    try {
      if (await btn.first().isVisible({ timeout: 800 })) {
        await btn.first().click({ timeout: 2000 });
        break;
      }
    } catch {
      // ignore — not every locale shows a banner
    }
  }

  const deadline = Date.now() + MARKER_WAIT_MS;
  while (Date.now() < deadline) {
    const coords = markerFromUrl(page.url());
    if (coords) return { coords, finalUrl: page.url() };
    await sleep(250);
  }

  return { coords: null, finalUrl: page.url() };
}

async function main() {
  const opts = parseArgs(process.argv);
  const csvPath = path.resolve(opts.csv);

  if (!fs.existsSync(csvPath)) fail(`CSV not found: ${csvPath}`);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    fail(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local."
    );
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
  console.log(`Delay between rows: ${opts.delayMs}ms`);
  console.log(`Rows to consider: ${rows.length}\n`);

  const placesByName = await loadPlacesByName(supabase);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    locale: "en-US",
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  let updated = 0;
  let skipped = 0;
  let missing = 0;
  let failed = 0;
  const handFix = [];
  const failures = [];

  try {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = cell(row, "Title", "title");
      const mapsUrl = cell(row, "URL", "url");
      const indexLabel = `[${i + 1}/${rows.length}]`;
      const place = placesByName.get(name.toLowerCase());

      if (!place) {
        console.log(
          `${indexLabel} ↷ "${name}" — not in places table | !3d!4d: no`
        );
        missing++;
        handFix.push({ name, reason: "not in places table" });
        if (i < rows.length - 1) await sleep(opts.delayMs);
        continue;
      }

      if (!mapsUrl) {
        console.log(
          `${indexLabel} ↷ "${name}" — missing URL | !3d!4d: no`
        );
        skipped++;
        handFix.push({ name, reason: "missing URL" });
        if (i < rows.length - 1) await sleep(opts.delayMs);
        continue;
      }

      let resolved;
      try {
        resolved = await resolveMarkerCoords(page, mapsUrl);
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        console.log(
          `${indexLabel} ✗ "${name}" — navigate failed: ${reason} | !3d!4d: no`
        );
        failed++;
        failures.push({ name, reason });
        handFix.push({ name, reason: `navigate failed: ${reason}` });
        if (i < rows.length - 1) await sleep(opts.delayMs);
        continue;
      }

      if (!resolved.coords) {
        console.log(
          `${indexLabel} ↷ "${name}" — no !3d!4d after expand (left ${place.lat}, ${place.lng}) | !3d!4d: no`
        );
        skipped++;
        handFix.push({
          name,
          reason: `no !3d!4d (final URL: ${resolved.finalUrl.slice(0, 120)})`,
        });
        if (i < rows.length - 1) await sleep(opts.delayMs);
        continue;
      }

      const { lat, lng } = resolved.coords;
      const before = `${place.lat}, ${place.lng}`;
      const after = `${lat}, ${lng}`;
      const unchanged =
        Number(place.lat) === lat && Number(place.lng) === lng;

      if (unchanged) {
        console.log(
          `${indexLabel} = "${name}" already ${after} | !3d!4d: yes`
        );
        skipped++;
        if (i < rows.length - 1) await sleep(opts.delayMs);
        continue;
      }

      if (opts.dryRun) {
        console.log(
          `${indexLabel} ↻ "${name}" ${before} → ${after} | !3d!4d: yes [dry-run]`
        );
        updated++;
        if (i < rows.length - 1) await sleep(opts.delayMs);
        continue;
      }

      const { error } = await supabase
        .from("places")
        .update({ lat, lng })
        .eq("id", place.id);

      if (error) {
        console.log(
          `${indexLabel} ✗ "${name}" — ${error.message} | !3d!4d: yes`
        );
        failed++;
        failures.push({ name, reason: error.message });
        handFix.push({ name, reason: error.message });
        if (i < rows.length - 1) await sleep(opts.delayMs);
        continue;
      }

      place.lat = lat;
      place.lng = lng;
      console.log(
        `${indexLabel} ↻ "${name}" ${before} → ${after} | !3d!4d: yes`
      );
      updated++;

      if (i < rows.length - 1) await sleep(opts.delayMs);
    }
  } finally {
    await browser.close();
  }

  console.log("\n—— Summary ——");
  console.log(`Updated: ${updated}`);
  console.log(`Skipped (no marker / already precise / no URL): ${skipped}`);
  console.log(`Not in places table: ${missing}`);
  console.log(`Failed: ${failed}`);

  if (handFix.length) {
    console.log("\nNeeds hand-fix (left unchanged or missing):");
    for (const f of handFix) console.log(`  • ${f.name} — ${f.reason}`);
  }
  if (failures.length) {
    console.log("\nFailures:");
    for (const f of failures) console.log(`  • ${f.name} — ${f.reason}`);
  }
  console.log("");
}

main().catch((err) => fail(err instanceof Error ? err.message : String(err)));
