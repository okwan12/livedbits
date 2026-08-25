// Import places into Supabase from a CSV.
//
// Modes:
//   Default  — geocode Title via Mapbox (old Takeout files without lat/lng).
//   --coords — read lat/lng from the Google Maps URL (!3d!4d marker, else
//              @LAT,LNG camera), falling back to Latitude / Longitude columns.
//
// Usage (from the project root):
//   npm run import-places -- --csv path/to/file.csv --coords --limit 10 --dry-run
//   npm run import-places -- --csv path/to/file.csv --coords
//   npm run import-places -- --csv path/to/old-takeout.csv --limit 5 --dry-run
//
// Options:
//   --csv <path>   Required.
//   --coords       Use URL !3d!4d / @LAT,LNG (else Lat/Lng columns).
//   --limit <n>    Only process the first n titled rows.
//   --dry-run      Log results; do not write to Supabase.
//   --near <region>  Geocode mode only — bias string (optional).
//   --city <name>    Coords mode — city written on insert/update (optional).
//   --country <name> Coords mode — country written on insert/update (optional).
//   --delay <ms>   Pause between rows (default 250; geocode mode).
//
// Needs in .env.local:
//   NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (unless --dry-run)
//   NEXT_PUBLIC_MAPBOX_TOKEN (geocode mode only)

require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const { createClient } = require("@supabase/supabase-js");

// Exact Takeout tag strings → canonical SINGULAR slugs.
const TAG_TO_CATEGORY = {
  "🍴 restaurants": "restaurant",
  "🍴 restaurant": "restaurant",
  "☕️ cafés": "cafe",
  "☕️ cafe": "cafe",
  "🍞 bakeries": "bakery",
  "🍞 bakery": "bakery",
  "🛍️ shops": "shop",
  "🛍️ shop": "shop",
  "🚩 Sites": "site",
  "🚩 Site": "site",
  "🚩 sites": "site",
  "🚩 site": "site",
  "🍸 drinks": "bar",
  "🍸 drink": "bar",
  "🍸 bars": "bar",
  "🍸 bar": "bar",
  "🌻 Markets": "market",
  "🌻 Market": "market",
  "🌻 markets": "market",
  "🌻 market": "market",
  "🍦 sweet treat": "sweet treat",
  "🍦 sweet treats": "sweet treat",
};

// Text after (possibly garbled) emoji → singular slug.
// Plurals still accepted so older CSVs keep working.
const TAG_TEXT_TO_CATEGORY = {
  restaurant: "restaurant",
  restaurants: "restaurant",
  cafe: "cafe",
  cafes: "cafe",
  cafés: "cafe",
  café: "cafe",
  bakery: "bakery",
  bakeries: "bakery",
  shop: "shop",
  shops: "shop",
  site: "site",
  sites: "site",
  bar: "bar",
  bars: "bar",
  drink: "bar",
  drinks: "bar",
  market: "market",
  markets: "market",
  "sweet treat": "sweet treat",
  "sweet treats": "sweet treat",
  "sweet-treat": "sweet treat",
  "sweet-treats": "sweet treat",
};

const DEFAULT_NEAR = "";
const BAY_AREA_PROXIMITY = "-122.27,37.80";
const BAY_AREA_BBOX = "-123.10,36.90,-121.50,38.60";
const DEFAULT_DELAY_MS = 250;

function fail(message) {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs(argv) {
  const opts = {
    csv: null,
    limit: null,
    dryRun: false,
    coords: false,
    near: DEFAULT_NEAR,
    delay: DEFAULT_DELAY_MS,
    city: null,
    country: null,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      opts.dryRun = true;
    } else if (arg === "--coords") {
      opts.coords = true;
    } else if (arg === "--csv") {
      opts.csv = argv[++i];
    } else if (arg === "--limit") {
      opts.limit = Number(argv[++i]);
    } else if (arg === "--near") {
      opts.near = argv[++i];
    } else if (arg === "--city") {
      opts.city = argv[++i];
    } else if (arg === "--country") {
      opts.country = argv[++i];
    } else if (arg === "--delay") {
      opts.delay = Number(argv[++i]);
    } else {
      fail(`Unknown argument: ${arg}`);
    }
  }

  if (!opts.csv) {
    fail(
      "Missing --csv path.\n" +
        "  Example: npm run import-places -- --csv ~/Downloads/places.csv --coords --limit 10 --dry-run"
    );
  }
  if (opts.limit != null && (!Number.isFinite(opts.limit) || opts.limit < 1)) {
    fail("--limit must be a positive number.");
  }
  if (!Number.isFinite(opts.delay) || opts.delay < 0) {
    fail("--delay must be a non-negative number of milliseconds.");
  }

  return opts;
}

function normalizeTagText(text) {
  return text
    .toLowerCase()
    .replace(/√©/g, "e")
    .replace(/√®/g, "e")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Map a Tags cell to a singular category slug, or null. */
function categoryFromTags(rawTags) {
  if (rawTags == null) return null;
  const tag = String(rawTags).trim();
  if (!tag) return null;

  if (TAG_TO_CATEGORY[tag]) return TAG_TO_CATEGORY[tag];

  const noVs = tag.replace(/\uFE0F/g, "");
  for (const [key, slug] of Object.entries(TAG_TO_CATEGORY)) {
    if (key.replace(/\uFE0F/g, "") === noVs) return slug;
  }

  const trailing = tag.match(/([A-Za-z][A-Za-z\s'√©®-]*[A-Za-z]|[A-Za-z]+)\s*$/);
  if (trailing) {
    const text = normalizeTagText(trailing[1]);
    if (TAG_TEXT_TO_CATEGORY[text]) return TAG_TEXT_TO_CATEGORY[text];
  }

  const cleaned = normalizeTagText(tag.replace(/[^\p{L}\p{N}\s'-]+/gu, " "));
  const keys = Object.keys(TAG_TEXT_TO_CATEGORY).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (cleaned.includes(key)) return TAG_TEXT_TO_CATEGORY[key];
  }

  return null;
}

function cell(row, ...keys) {
  for (const key of keys) {
    if (row[key] != null && String(row[key]).trim() !== "") {
      return String(row[key]).trim();
    }
  }
  // Case-insensitive / trailing-space column names (e.g. "Year Visited ").
  const lower = Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k.trim().toLowerCase(), v])
  );
  for (const key of keys) {
    const v = lower[key.trim().toLowerCase()];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

// Place marker: !3dLAT!4dLNG  — prefer this over the camera center.
const MARKER_COORDS = /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/i;
// Camera center: /@37.7562439,-122.4758048,17z (zoom optional).
const CAMERA_COORDS = /@(-?\d+\.?\d*),(-?\d+\.?\d*)(?:,[\d.]+z)?/i;

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
    if (validLatLng(lat, lng)) return { lat, lng, source: "url-marker" };
  }

  const camera = text.match(CAMERA_COORDS);
  if (camera) {
    const lat = Number(camera[1]);
    const lng = Number(camera[2]);
    if (validLatLng(lat, lng)) return { lat, lng, source: "url-camera" };
  }

  return null;
}

function parseCoords(row) {
  const fromUrl = coordsFromMapsUrl(cell(row, "URL", "url"));
  if (fromUrl && fromUrl.source === "url-marker") return fromUrl;

  // Extra CSV columns sometimes hold the expanded Maps URL (Berlin export).
  for (const value of Object.values(row)) {
    if (typeof value !== "string" || !value.includes("google.com/maps")) continue;
    const fromCell = coordsFromMapsUrl(value);
    if (fromCell?.source === "url-marker") return fromCell;
  }

  if (fromUrl) return fromUrl;

  const latRaw = cell(row, "Latitude", "latitude", "lat");
  const lngRaw = cell(row, "Longitude", "longitude", "lng", "lon", "long");
  if (!latRaw || !lngRaw) {
    throw new Error("missing URL marker/camera coords and Latitude/Longitude");
  }
  const lat = Number(latRaw);
  const lng = Number(lngRaw);
  if (!validLatLng(lat, lng)) {
    throw new Error(`invalid coordinates (${latRaw}, ${lngRaw})`);
  }
  return { lat, lng, source: "columns" };
}

/** Optional YYYY from "Year Visited" → visited_date as YYYY-01-01. */
function visitedDateFromRow(row) {
  const year = cell(row, "Year Visited", "Year Visited ", "year visited", "year");
  if (!year) return null;
  if (!/^\d{4}$/.test(year)) return null;
  return `${year}-01-01`;
}

function contextText(feature, prefix) {
  const ctx = feature.context || [];
  const hit = ctx.find((c) => String(c.id || "").startsWith(`${prefix}.`));
  return hit?.text || null;
}

function nearHintFromName(name) {
  const n = name.toLowerCase();
  const cities = [
    ["san francisco", "San Francisco, California, United States"],
    ["oakland", "Oakland, California, United States"],
    ["berkeley", "Berkeley, California, United States"],
    ["alameda", "Alameda, California, United States"],
    ["san jose", "San Jose, California, United States"],
    ["palo alto", "Palo Alto, California, United States"],
  ];
  for (const [needle, near] of cities) {
    if (n.includes(needle)) return near;
  }
  return null;
}

function nameTokens(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function pickBestFeature(features, name) {
  if (!features?.length) return null;
  const tokens = nameTokens(name);
  if (tokens.length === 0) return features[0];

  let best = features[0];
  let bestScore = -1;

  for (const feature of features) {
    const label = `${feature.text || ""} ${feature.place_name || ""}`.toLowerCase();
    let score = 0;
    for (const t of tokens) {
      if (label.includes(t)) score += 1;
    }
    if (feature.place_type?.includes("poi")) score += 0.25;
    if (score > bestScore) {
      bestScore = score;
      best = feature;
    }
  }

  return bestScore > 0 ? best : features[0];
}

async function geocodePlace(name, { token, near }) {
  const hint = near || nearHintFromName(name);
  const query = `${name}, ${hint || "San Francisco, California, United States"}`;
  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`
  );
  url.searchParams.set("access_token", token);
  url.searchParams.set("limit", "5");
  url.searchParams.set("autocomplete", "false");
  url.searchParams.set("types", "poi,place,address,locality,neighborhood");
  url.searchParams.set("proximity", BAY_AREA_PROXIMITY);
  url.searchParams.set("bbox", BAY_AREA_BBOX);

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Mapbox HTTP ${res.status}${body ? `: ${body.slice(0, 120)}` : ""}`);
  }

  const data = await res.json();
  const feature = pickBestFeature(data.features, name);
  if (!feature) throw new Error("no geocode results");

  const [lng, lat] = feature.center || feature.geometry?.coordinates || [];
  if (typeof lat !== "number" || typeof lng !== "number") {
    throw new Error("result missing coordinates");
  }

  let city = contextText(feature, "place") || contextText(feature, "locality");
  const topType = feature.place_type?.[0];
  if (!city && (topType === "place" || topType === "locality")) {
    city = feature.text || null;
  }

  let country = contextText(feature, "country");
  if (!country && topType === "country") {
    country = feature.text || null;
  }

  return { lat, lng, city, country };
}

/** Map of lowercased name → place id (for skip / update). */
async function loadExistingPlaces(supabase) {
  const byName = new Map();
  const pageSize = 1000;
  let from = 0;

  for (;;) {
    const { data, error } = await supabase
      .from("places")
      .select("id, name")
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(`Failed to load existing places: ${error.message}`);
    }
    if (!data || data.length === 0) break;

    for (const row of data) {
      if (row.name) byName.set(String(row.name).trim().toLowerCase(), row.id);
    }

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return byName;
}

async function main() {
  const opts = parseArgs(process.argv);
  const csvPath = path.resolve(opts.csv);

  if (!fs.existsSync(csvPath)) {
    fail(`CSV not found: ${csvPath}`);
  }

  let mapboxToken = null;
  if (!opts.coords) {
    mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!mapboxToken) {
      fail("Missing NEXT_PUBLIC_MAPBOX_TOKEN in .env.local (needed for geocode mode).");
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let supabase = null;

  if (!opts.dryRun) {
    if (!url || !serviceKey) {
      fail(
        "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.\n" +
          "  (Or pass --dry-run to preview without writing.)"
      );
    }
    supabase = createClient(url, serviceKey);
  } else if (url && serviceKey) {
    // Dry-run can still check which names already exist.
    supabase = createClient(url, serviceKey);
  }

  const csvText = fs.readFileSync(csvPath, "utf8");
  let rows = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });

  if (rows.length === 0) fail("CSV has no data rows.");

  const totalInFile = rows.length;
  const emptyTitleCount = rows.filter(
    (r) => !cell(r, "Title", "title")
  ).length;
  rows = rows.filter((r) => cell(r, "Title", "title"));

  if (rows.length === 0) fail("CSV has no rows with a Title.");

  if (opts.limit != null) {
    rows = rows.slice(0, opts.limit);
  }

  console.log(`CSV: ${csvPath}`);
  console.log(`Rows in file: ${totalInFile} (${emptyTitleCount} empty Title skipped)`);
  console.log(`Processing: ${rows.length}${opts.limit != null ? ` (limit ${opts.limit})` : ""}`);
  console.log(
    `Source: ${
      opts.coords
        ? "URL !3d!4d marker, else @camera, else Lat/Lng columns"
        : "Mapbox geocode"
    }`
  );
  console.log(`Mode: ${opts.dryRun ? "dry-run (no DB writes)" : "insert"}`);
  if (!opts.coords) {
    console.log(`Delay: ${opts.delay}ms between rows`);
  }
  console.log("");

  let existingByName = new Map();
  if (supabase) {
    existingByName = await loadExistingPlaces(supabase);
    console.log(`Already in places table: ${existingByName.size} name(s)\n`);
  }

  let succeeded = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  const failures = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = cell(row, "Title", "title");
    const indexLabel = `[${i + 1}/${rows.length}]`;
    const existingId = existingByName.get(name.toLowerCase());

    // Geocode mode: skip duplicates. Coords mode: update lat/lng/category
    // so a corrected CSV can refresh pins without creating duplicates.
    if (existingId && !opts.coords) {
      console.log(`${indexLabel} ↷ skip "${name}" (already in places)`);
      skipped++;
      await sleep(opts.delay);
      continue;
    }

    const category = categoryFromTags(cell(row, "Tags", "tags", "Tag", "tag"));

    try {
      let lat;
      let lng;
      let city = null;
      let country = null;

      let coordSource = null;
      if (opts.coords) {
        ({ lat, lng, source: coordSource } = parseCoords(row));
        city = opts.city || null;
        country = opts.country || null;
      } else {
        const geo = await geocodePlace(name, {
          token: mapboxToken,
          near: opts.near,
        });
        lat = geo.lat;
        lng = geo.lng;
        city = geo.city;
        country = geo.country;
      }

      const visited_date = visitedDateFromRow(row);
      const catNote = category ? ` · ${category}` : " · (no category)";
      const where = opts.coords
        ? `${lat.toFixed(7)}, ${lng.toFixed(7)} · ${coordSource}`
        : [city, country].filter(Boolean).join(", ") || "unknown location";
      const action = existingId ? "update" : "insert";

      if (opts.dryRun) {
        const mark = existingId ? "↻" : "✓";
        console.log(
          `${indexLabel} ${mark} "${name}" → ${where}${catNote}${visited_date ? ` · ${visited_date.slice(0, 4)}` : ""} [${action}, dry-run]`
        );
        if (existingId) updated++;
        else succeeded++;
      } else if (existingId) {
        const payload = { lat, lng, category };
        if (visited_date) payload.visited_date = visited_date;
        if (city) payload.city = city;
        if (country) payload.country = country;
        const { error } = await supabase
          .from("places")
          .update(payload)
          .eq("id", existingId);
        if (error) throw new Error(`Supabase update: ${error.message}`);
        console.log(`${indexLabel} ↻ "${name}" → ${where}${catNote}`);
        updated++;
      } else {
        const payload = {
          name,
          lat,
          lng,
          category,
          city,
          country,
        };
        if (visited_date) payload.visited_date = visited_date;

        const { data, error } = await supabase
          .from("places")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw new Error(`Supabase insert: ${error.message}`);

        existingByName.set(name.toLowerCase(), data.id);
        console.log(`${indexLabel} ✓ "${name}" → ${where}${catNote}`);
        succeeded++;
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      console.log(`${indexLabel} ✗ "${name}" — ${reason}`);
      failed++;
      failures.push({ name, reason });
    }

    if (!opts.coords && i < rows.length - 1) {
      await sleep(opts.delay);
    }
  }

  console.log("\n—— Summary ——");
  console.log(`Inserted: ${succeeded}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped (already present): ${skipped}`);
  console.log(`Failed: ${failed}`);

  if (failures.length > 0) {
    console.log("\nFailures:");
    for (const f of failures) {
      console.log(`  • ${f.name} — ${f.reason}`);
    }
  }

  console.log("");
}

main().catch((err) => {
  fail(err instanceof Error ? err.message : String(err));
});
