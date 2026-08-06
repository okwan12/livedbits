// Geocode a Google Takeout "Saved Places" CSV and insert rows into Supabase `places`.
//
// Usage (from the project root):
//   node scripts/import-places.js --csv path/to/saved-places.csv --limit 5
//   node scripts/import-places.js --csv path/to/saved-places.csv --limit 5 --dry-run
//   node scripts/import-places.js --csv path/to/saved-places.csv
//
// Options:
//   --csv <path>       Required. Takeout CSV with Title, Note, URL, Tags, Comment.
//   --limit <n>        Only process the first n data rows (great for a test slice).
//   --dry-run          Geocode + log, but do NOT write to Supabase.
//   --near <region>    Appended to each query to bias Mapbox (default below).
//   --delay <ms>       Pause between rows (default 250).
//
// Needs in .env.local:
//   NEXT_PUBLIC_MAPBOX_TOKEN
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY   (unless --dry-run)

require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const { createClient } = require("@supabase/supabase-js");

// Exact Takeout tag strings → canonical slugs used by the map.
const TAG_TO_CATEGORY = {
  "🍴 restaurants": "restaurants",
  "☕️ cafés": "cafes",
  "🍞 bakeries": "bakeries",
  "🛍️ shops": "shops",
  "🚩 Sites": "sites",
  "🍸 drinks": "drinks",
  "🌻 Markets": "markets",
  "🍦 sweet treat": "sweet-treats",
};

// Fallback when emoji/spacing differs slightly — match on the text after emoji.
const TAG_TEXT_TO_CATEGORY = {
  restaurants: "restaurants",
  restaurant: "restaurants",
  cafes: "cafes",
  cafe: "cafes",
  cafés: "cafes",
  café: "cafes",
  bakeries: "bakeries",
  bakery: "bakeries",
  shops: "shops",
  shop: "shops",
  sites: "sites",
  site: "sites",
  drinks: "drinks",
  drink: "drinks",
  markets: "markets",
  market: "markets",
  "sweet treat": "sweet-treats",
  "sweet treats": "sweet-treats",
  "sweet-treats": "sweet-treats",
};

// Don't append a city name to the query (that pulled Oakland into SF / HMB).
// Bias with Bay Area proximity + bbox instead so East Bay can win.
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
    near: DEFAULT_NEAR,
    delay: DEFAULT_DELAY_MS,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      opts.dryRun = true;
    } else if (arg === "--csv") {
      opts.csv = argv[++i];
    } else if (arg === "--limit") {
      opts.limit = Number(argv[++i]);
    } else if (arg === "--near") {
      opts.near = argv[++i];
    } else if (arg === "--delay") {
      opts.delay = Number(argv[++i]);
    } else {
      fail(`Unknown argument: ${arg}`);
    }
  }

  if (!opts.csv) {
    fail(
      "Missing --csv path.\n" +
        "  Example: node scripts/import-places.js --csv ~/Downloads/saved-places.csv --limit 5"
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
    // Takeout CSVs often mojibake "é" as "√©" (UTF-8 read as MacRoman).
    .replace(/√©/g, "e")
    .replace(/√®/g, "e")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Map a Takeout Tags cell to a category slug, or null if empty/unknown.
 * Emoji in exported CSVs are often garbled — prefer the trailing readable
 * words ("bakeries", "shops", "Sites", "sweet treat", …).
 */
function categoryFromTags(rawTags) {
  if (rawTags == null) return null;
  const tag = String(rawTags).trim();
  if (!tag) return null;

  if (TAG_TO_CATEGORY[tag]) return TAG_TO_CATEGORY[tag];

  // Drop variation selectors (☕️ vs ☕) and retry exact keys.
  const noVs = tag.replace(/\uFE0F/g, "");
  for (const [key, slug] of Object.entries(TAG_TO_CATEGORY)) {
    if (key.replace(/\uFE0F/g, "") === noVs) return slug;
  }

  // Trailing latin words after the garbled emoji prefix.
  const trailing = tag.match(/([A-Za-z][A-Za-z\s'√©®-]*[A-Za-z]|[A-Za-z]+)\s*$/);
  if (trailing) {
    const text = normalizeTagText(trailing[1]);
    if (TAG_TEXT_TO_CATEGORY[text]) return TAG_TEXT_TO_CATEGORY[text];
  }

  // Last resort: known keyword anywhere in the cleaned string.
  // Longer keys first so "sweet treat" wins over a bare "treat".
  const cleaned = normalizeTagText(tag.replace(/[^\p{L}\p{N}\s'-]+/gu, " "));
  const keys = Object.keys(TAG_TEXT_TO_CATEGORY).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (cleaned.includes(key)) return TAG_TEXT_TO_CATEGORY[key];
  }

  return null;
}

function contextText(feature, prefix) {
  const ctx = feature.context || [];
  const hit = ctx.find((c) => String(c.id || "").startsWith(`${prefix}.`));
  return hit?.text || null;
}

/** If the title names a Bay Area city, bias the query toward that city. */
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

/** Prefer a feature whose label overlaps the place name (avoid random cities). */
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
    // Prefer POIs when scores tie.
    if (feature.place_type?.includes("poi")) score += 0.25;
    if (score > bestScore) {
      bestScore = score;
      best = feature;
    }
  }

  // If nothing overlapped the name, fall back to Mapbox's top result.
  return bestScore > 0 ? best : features[0];
}

/**
 * Forward-geocode a place name via Mapbox Geocoding API v5.
 * Returns { lng, lat, city, country, placeName } or throws with a reason.
 */
async function geocodePlace(name, { token, near }) {
  const hint = near || nearHintFromName(name);
  // Default soft bias: SF (most of the list). Titles that name Oakland /
  // Berkeley / etc. get that city instead so East Bay can win.
  const query = `${name}, ${hint || "San Francisco, California, United States"}`;
  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`
  );
  url.searchParams.set("access_token", token);
  url.searchParams.set("limit", "5");
  url.searchParams.set("autocomplete", "false");
  // Prefer points of interest / places over bare addresses when possible.
  url.searchParams.set("types", "poi,place,address,locality,neighborhood");
  // Keep candidates inside the broader Bay Area (SF + East Bay + Peninsula…).
  url.searchParams.set("proximity", BAY_AREA_PROXIMITY);
  url.searchParams.set("bbox", BAY_AREA_BBOX);

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Mapbox HTTP ${res.status}${body ? `: ${body.slice(0, 120)}` : ""}`);
  }

  const data = await res.json();
  const feature = pickBestFeature(data.features, name);
  if (!feature) {
    throw new Error("no geocode results");
  }

  const [lng, lat] = feature.center || feature.geometry?.coordinates || [];
  if (typeof lat !== "number" || typeof lng !== "number") {
    throw new Error("result missing coordinates");
  }

  // City: `place` (city/town) first, then `locality` as a fallback.
  // If the top feature itself is a place/locality, use its text.
  let city = contextText(feature, "place") || contextText(feature, "locality");
  const topType = feature.place_type?.[0];
  if (!city && (topType === "place" || topType === "locality")) {
    city = feature.text || null;
  }

  let country = contextText(feature, "country");
  if (!country && topType === "country") {
    country = feature.text || null;
  }

  return {
    lat,
    lng,
    city,
    country,
    placeName: feature.place_name || null,
  };
}

async function loadExistingNames(supabase) {
  const names = new Set();
  const pageSize = 1000;
  let from = 0;

  for (;;) {
    const { data, error } = await supabase
      .from("places")
      .select("name")
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(`Failed to load existing places: ${error.message}`);
    }
    if (!data || data.length === 0) break;

    for (const row of data) {
      if (row.name) names.add(String(row.name).trim().toLowerCase());
    }

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return names;
}

async function main() {
  const opts = parseArgs(process.argv);
  const csvPath = path.resolve(opts.csv);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!mapboxToken) {
    fail("Missing NEXT_PUBLIC_MAPBOX_TOKEN in .env.local.");
  }

  if (!fs.existsSync(csvPath)) {
    fail(`CSV not found: ${csvPath}`);
  }

  let supabase = null;
  if (!opts.dryRun) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      fail(
        "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.\n" +
          "  (Or pass --dry-run to geocode without writing to the database.)"
      );
    }
    supabase = createClient(url, serviceKey);
  }

  const csvText = fs.readFileSync(csvPath, "utf8");
  let rows = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });

  if (rows.length === 0) {
    fail("CSV has no data rows.");
  }

  const totalInFile = rows.length;
  // Legend / blank rows in Takeout exports have empty Title — drop them
  // before applying --limit so "first 10" means 10 real places.
  const emptyTitleCount = rows.filter(
    (r) => !(r.Title || r.title || "").trim()
  ).length;
  rows = rows.filter((r) => (r.Title || r.title || "").trim());

  if (rows.length === 0) {
    fail("CSV has no rows with a Title.");
  }

  if (opts.limit != null) {
    rows = rows.slice(0, opts.limit);
  }

  console.log(`CSV: ${csvPath}`);
  console.log(`Rows in file: ${totalInFile} (${emptyTitleCount} empty Title skipped)`);
  console.log(`Processing: ${rows.length}${opts.limit != null ? ` (limit ${opts.limit})` : ""}`);
  console.log(
    `Near bias: ${
      opts.near ||
      "SF default; city-from-title + Bay Area proximity/bbox for East Bay"
    }`
  );
  console.log(`Mode: ${opts.dryRun ? "dry-run (no DB writes)" : "insert"}`);
  console.log(`Delay: ${opts.delay}ms between rows\n`);

  let existingNames = new Set();
  if (!opts.dryRun) {
    existingNames = await loadExistingNames(supabase);
    console.log(`Already in places table: ${existingNames.size} name(s)\n`);
  }

  let succeeded = 0;
  let skipped = 0;
  let failed = 0;
  const failures = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = (row.Title || row.title || "").trim();
    const indexLabel = `[${i + 1}/${rows.length}]`;

    if (!opts.dryRun && existingNames.has(name.toLowerCase())) {
      console.log(`${indexLabel} ↷ skip "${name}" (already in places)`);
      skipped++;
      await sleep(opts.delay);
      continue;
    }

    const category = categoryFromTags(row.Tags ?? row.tags);

    try {
      const geo = await geocodePlace(name, {
        token: mapboxToken,
        near: opts.near,
      });

      const where = [geo.city, geo.country].filter(Boolean).join(", ") || "unknown location";
      const catNote = category ? ` · ${category}` : "";

      if (opts.dryRun) {
        console.log(
          `${indexLabel} ✓ "${name}" → ${where}${catNote}  (${geo.lat.toFixed(5)}, ${geo.lng.toFixed(5)}) [dry-run]`
        );
        succeeded++;
      } else {
        const { error } = await supabase.from("places").insert({
          name,
          lat: geo.lat,
          lng: geo.lng,
          city: geo.city,
          country: geo.country,
          category,
        });

        if (error) {
          throw new Error(`Supabase insert: ${error.message}`);
        }

        existingNames.add(name.toLowerCase());
        console.log(`${indexLabel} ✓ "${name}" → ${where}${catNote}`);
        succeeded++;
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      console.log(`${indexLabel} ✗ "${name}" — ${reason}`);
      failed++;
      failures.push({ name, reason });
    }

    if (i < rows.length - 1) {
      await sleep(opts.delay);
    }
  }

  console.log("\n—— Summary ——");
  console.log(`Succeeded: ${succeeded}`);
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
