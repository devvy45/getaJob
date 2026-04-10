import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_COUNTRIES = [
  "us",
  "gb",
  "ca",
  "in",
  "au",
  "de",
  "fr",
  "nl",
  "se",
  "ie",
  "sg",
  "ae",
  "br",
  "mx",
  "jp",
  "kr",
];

const API_URL = "https://google.serper.dev/search";

function parseNumberArg(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = Number(process.argv[index + 1]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function parseStringArg(name, fallback = "") {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  return process.argv[index + 1] || fallback;
}

function parseCountries() {
  const raw = parseStringArg("--countries", DEFAULT_COUNTRIES.join(","));
  return raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function csvEscape(value) {
  const stringValue = String(value ?? "");
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

async function loadExistingCsv(absolutePath) {
  try {
    const raw = await readFile(absolutePath, "utf8");
    const lines = raw.split(/\r?\n/).filter(Boolean);
    const map = new Map();

    for (const line of lines.slice(1)) {
      const commaIndex = line.indexOf(",");
      if (commaIndex === -1) continue;

      const slug = line.slice(0, commaIndex).trim().toLowerCase();
      const fullUrl = line.slice(commaIndex + 1).trim();
      if (!slug || !fullUrl) continue;

      map.set(slug, fullUrl);
    }

    return map;
  } catch {
    return new Map();
  }
}

async function writeCsvAtomic(bySlug, absoluteOutput) {
  const rows = [...bySlug.entries()]
    .map(([slug, fullUrl]) => ({ slug, fullUrl }))
    .sort((a, b) => a.slug.localeCompare(b.slug));

  const csv = [
    "slug,full_url",
    ...rows.map((row) => `${csvEscape(row.slug)},${csvEscape(row.fullUrl)}`),
  ].join("\n");

  await mkdir(path.dirname(absoluteOutput), { recursive: true });
  const tempPath = `${absoluteOutput}.tmp`;
  await writeFile(tempPath, `${csv}\n`, "utf8");
  await rename(tempPath, absoluteOutput);

  return rows.length;
}

function normalizeResult(url, expectedHost) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host !== expectedHost) return null;

    const slug = parsed.pathname
      .split("/")
      .filter(Boolean)
      .map((segment) => decodeURIComponent(segment).trim())
      .find(Boolean);

    if (!slug) return null;

    return {
      slug: slug.toLowerCase(),
      fullUrl: `https://${expectedHost}/${slug}`,
    };
  } catch {
    return null;
  }
}

async function fetchSerperPage({ apiKey, query, gl, page, num, retries }) {
  const payload = { q: query, gl, page, num };
  let attempt = 0;
  let lastError = null;

  while (attempt <= retries) {
    attempt += 1;
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "X-API-KEY": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000),
      });

      const text = await response.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }

      if (!response.ok) {
        const message = data?.message || data?.error || `HTTP ${response.status}`;
        throw new Error(message);
      }

      const organic = Array.isArray(data?.organic) ? data.organic : [];
      return { organic };
    } catch (error) {
      lastError = error;
      if (attempt > retries) break;
      await sleep(400 * attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("unknown serper error");
}

async function main() {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    throw new Error("SERPER_API_KEY is missing");
  }

  const query = parseStringArg("--query");
  const host = parseStringArg("--host");

  if (!query) throw new Error("--query is required");
  if (!host) throw new Error("--host is required");

  const countries = parseCountries();
  const maxPages = parseNumberArg("--max-pages", 2479);
  const stopAfterEmptyPages = parseNumberArg("--stop-after-empty-pages", 5);
  const stopAfterNoNewPages = parseNumberArg("--stop-after-no-new-pages", 5);
  const maxCredits = parseNumberArg("--max-credits", 2000);
  const num = parseNumberArg("--num", 10);
  const retries = parseNumberArg("--retries", 2);
  const minDelayMs = parseNumberArg("--min-delay-ms", 200);
  const maxDelayMs = parseNumberArg("--max-delay-ms", 600);
  const outputPath = parseStringArg("--output", "public/company-db.csv");

  const absoluteOutput = path.resolve(outputPath);
  const bySlug = await loadExistingCsv(absoluteOutput);
  const initialCount = bySlug.size;
  let creditsUsed = 0;
  let skippedDuplicates = 0;

  for (const gl of countries) {
    if (creditsUsed >= maxCredits) break;

    let consecutiveEmptyPages = 0;
    let consecutiveNoNewPages = 0;
    let pagesFetched = 0;
    let countryNew = 0;

    for (let page = 1; page <= maxPages; page += 1) {
      if (creditsUsed >= maxCredits) break;

      const { organic } = await fetchSerperPage({
        apiKey,
        query,
        gl,
        page,
        num,
        retries,
      });

      creditsUsed += 1;
      pagesFetched += 1;

      let pageNew = 0;
      for (const item of organic) {
        const link = typeof item?.link === "string" ? item.link : "";
        const normalized = normalizeResult(link, host);
        if (!normalized) continue;

        if (!bySlug.has(normalized.slug)) {
          bySlug.set(normalized.slug, normalized.fullUrl);
          pageNew += 1;
          countryNew += 1;
        } else {
          skippedDuplicates += 1;
        }
      }

      await writeCsvAtomic(bySlug, absoluteOutput);

      if (organic.length === 0) {
        consecutiveEmptyPages += 1;
      } else {
        consecutiveEmptyPages = 0;
      }

      if (pageNew === 0) {
        consecutiveNoNewPages += 1;
      } else {
        consecutiveNoNewPages = 0;
      }

      console.log(
        `[query=${query}] [gl=${gl}] [page ${page}] results=${organic.length} new_slugs=${pageNew} total_slugs=${bySlug.size} credits_used=${creditsUsed}/${maxCredits}`
      );

      if (consecutiveEmptyPages >= stopAfterEmptyPages) {
        console.log(
          `[query=${query}] [gl=${gl}] stop: ${consecutiveEmptyPages} consecutive empty pages`
        );
        break;
      }

      if (consecutiveNoNewPages >= stopAfterNoNewPages) {
        console.log(
          `[query=${query}] [gl=${gl}] stop: ${consecutiveNoNewPages} consecutive pages with zero new slugs`
        );
        break;
      }

      if (page < maxPages && creditsUsed < maxCredits) {
        await sleep(randomInt(minDelayMs, maxDelayMs));
      }
    }

    console.log(
      `[query=${query}] [gl=${gl}] done pages=${pagesFetched} country_new=${countryNew} total=${bySlug.size}`
    );
  }

  const finalCount = await writeCsvAtomic(bySlug, absoluteOutput);
  console.log(
    `done: credits_used=${creditsUsed} initial_slugs=${initialCount} new_slugs_added=${finalCount - initialCount} duplicates_skipped=${skippedDuplicates} unique_slugs=${finalCount}`
  );
  console.log(`output: ${absoluteOutput}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
