import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const QUERY = "site:jobs.ashbyhq.com";
const API_URL = "https://google.serper.dev/search";
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

function parseNumberArg(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = Number(process.argv[index + 1]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function parseStringArg(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  return process.argv[index + 1] || fallback;
}

function parseCountryArg() {
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

function normalizeResult(url) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    if (hostname !== "jobs.ashbyhq.com") return null;

    const firstSegment = parsed.pathname
      .split("/")
      .filter(Boolean)
      .map((segment) => decodeURIComponent(segment).trim())
      .find(Boolean);

    if (!firstSegment) return null;

    return {
      slug: firstSegment.toLowerCase(),
      fullUrl: `https://jobs.ashbyhq.com/${firstSegment}`,
    };
  } catch {
    return null;
  }
}

function csvEscape(value) {
  const stringValue = String(value ?? "");
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

async function fetchSerperPage({ apiKey, page, num, retries, gl }) {
  const payload = { q: QUERY, num, page, gl };
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
      await sleep(500 * attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("unknown serper error");
}

async function main() {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    throw new Error("SERPER_API_KEY is missing");
  }

  const countries = parseCountryArg();
  if (countries.length === 0) {
    throw new Error("at least one country is required");
  }

  const maxCredits = parseNumberArg("--max-credits", 2000);
  const maxPages = parseNumberArg("--max-pages", 2479);
  const num = parseNumberArg("--num", 10);
  const stopAfterNoNewPages = parseNumberArg("--stop-after-no-new-pages", 5);
  const stopAfterEmptyPages = parseNumberArg("--stop-after-empty-pages", 5);
  const retries = parseNumberArg("--retries", 2);
  const minDelayMs = parseNumberArg("--min-delay-ms", 200);
  const maxDelayMs = parseNumberArg("--max-delay-ms", 600);
  const outputPath = parseStringArg("--output", "public/ashby-company-db.csv");

  const bySlug = new Map();
  let pagesFetched = 0; // equal to credits spent for this endpoint
  let round = 0;

  while (pagesFetched < maxCredits) {
    round += 1;
    console.log(`starting country round ${round}`);

    for (const gl of countries) {
      if (pagesFetched >= maxCredits) {
        break;
      }

      let consecutiveNoNewPages = 0;
      let consecutiveEmptyPages = 0;
      let countryPagesFetched = 0;
      let countryNewSlugs = 0;

      for (let page = 1; page <= maxPages; page += 1) {
        if (pagesFetched >= maxCredits) {
          break;
        }

        const { organic } = await fetchSerperPage({ apiKey, page, num, retries, gl });
        pagesFetched += 1;
        countryPagesFetched += 1;

        let pageNew = 0;
        for (const item of organic) {
          const link = typeof item?.link === "string" ? item.link : "";
          const normalized = normalizeResult(link);
          if (!normalized) continue;

          if (!bySlug.has(normalized.slug)) {
            bySlug.set(normalized.slug, normalized.fullUrl);
            pageNew += 1;
          }
        }

        countryNewSlugs += pageNew;

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
          `[gl=${gl}] [page ${page}] results=${organic.length} new_slugs=${pageNew} total_slugs=${bySlug.size} credits_used=${pagesFetched}/${maxCredits}`
        );

        if (consecutiveEmptyPages >= stopAfterEmptyPages) {
          console.log(
            `[gl=${gl}] stop: ${consecutiveEmptyPages} consecutive pages with zero organic results`
          );
          break;
        }

        if (consecutiveNoNewPages >= stopAfterNoNewPages) {
          console.log(
            `[gl=${gl}] stop: ${consecutiveNoNewPages} consecutive pages with zero new slugs`
          );
          break;
        }

        if (page < maxPages && pagesFetched < maxCredits) {
          await sleep(randomInt(minDelayMs, maxDelayMs));
        }
      }

      console.log(
        `[gl=${gl}] country_run_done pages=${countryPagesFetched} new_slugs=${countryNewSlugs} total_slugs=${bySlug.size}`
      );

      if (pagesFetched >= maxCredits) {
        break;
      }
    }
  }

  const rows = [...bySlug.entries()]
    .map(([slug, fullUrl]) => ({ slug, fullUrl }))
    .sort((a, b) => a.slug.localeCompare(b.slug));

  const csv = [
    "slug,full_url",
    ...rows.map((row) => `${csvEscape(row.slug)},${csvEscape(row.fullUrl)}`),
  ].join("\n");

  const absoluteOutput = path.resolve(outputPath);
  await mkdir(path.dirname(absoluteOutput), { recursive: true });
  await writeFile(absoluteOutput, `${csv}\n`, "utf8");

  console.log(`done: pages_fetched=${pagesFetched} unique_slugs=${rows.length}`);
  console.log(`output: ${absoluteOutput}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
