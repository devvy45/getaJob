import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd());
const INPUTS = [
  {
    source: "ashby",
    path: resolve(ROOT, "public/ashby-company-db.csv"),
  },
  {
    source: "lever",
    path: resolve(ROOT, "public/lever-company-db.csv"),
  },
  {
    source: "greenhouse",
    path: resolve(ROOT, "public/greenhouse-company-db.csv"),
  },
];

const OUTPUT_PATH = resolve(ROOT, "public/jobs-dataset.json");
const CONCURRENCY = Number(process.env.CONCURRENCY || 8);
const LIMIT_PER_SOURCE = Number(process.env.LIMIT_PER_SOURCE || 0);
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 12000);

function splitCsvLine(line) {
  const index = line.indexOf(",");
  if (index === -1) return null;
  return {
    slug: line.slice(0, index).trim(),
    fullUrl: line.slice(index + 1).trim(),
  };
}

function parseCsv(text) {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const parsed = splitCsvLine(lines[i]);
    if (!parsed?.slug || !parsed?.fullUrl) continue;
    rows.push(parsed);
  }
  return rows;
}

function getSlugFromUrl(fullUrl) {
  try {
    const url = new URL(fullUrl);
    const segment = url.pathname.split("/").filter(Boolean)[0] || "";
    return decodeURIComponent(segment).trim();
  } catch {
    return "";
  }
}

function asIsoDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function hasRemote(location = "", workplaceType = "") {
  const text = `${location} ${workplaceType}`.toLowerCase();
  return text.includes("remote");
}

function shortText(input, max = 180) {
  if (!input) return "";
  const clean = String(input).replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1)}…`;
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const response = await fetch(url, {
    ...options,
    signal: controller.signal,
    headers: {
      "user-agent": "jobs-board-ingestor/1.0",
      ...(options.headers || {}),
    },
  }).finally(() => {
    clearTimeout(timer);
  });
  if (!response.ok) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function normalizeAshbyJob(company, job) {
  const locationParts = [
    job.location,
    ...(Array.isArray(job.secondaryLocations)
      ? job.secondaryLocations.map((item) => item?.location).filter(Boolean)
      : []),
  ];
  const location = locationParts.length > 0 ? locationParts.join(" / ") : "unspecified";
  const postedAt = asIsoDate(job.publishedAt);
  const compensation = shortText(job.compensationTierSummary || "");
  const summary = [job.department, job.team, job.workplaceType].filter(Boolean).join(" • ");

  return {
    id: `ashby:${company.slug}:${job.id}`,
    source: "ashby",
    company: company.name,
    company_slug: company.slug,
    company_url: company.fullUrl,
    title: job.title || "untitled role",
    team: job.team || job.department || "",
    location,
    remote: hasRemote(location, job.workplaceType || "") || Boolean(job.isRemote),
    employment_type: job.employmentType || "",
    posted_at: postedAt,
    has_posting_date: Boolean(postedAt),
    apply_url: job.applyUrl || job.jobUrl || company.fullUrl,
    job_url: job.jobUrl || job.applyUrl || company.fullUrl,
    compensation,
    summary: summary || "early-stage role",
  };
}

function normalizeLeverJob(company, job) {
  const categories = job.categories || {};
  const location = categories.location || "unspecified";
  const team = categories.team || categories.department || "";
  const postedAt = typeof job.createdAt === "number" ? asIsoDate(job.createdAt) : null;
  const summary = [categories.team, categories.department, categories.commitment]
    .filter(Boolean)
    .join(" • ");

  return {
    id: `lever:${company.slug}:${job.id}`,
    source: "lever",
    company: company.name,
    company_slug: company.slug,
    company_url: company.fullUrl,
    title: job.text || "untitled role",
    team,
    location,
    remote: hasRemote(location),
    employment_type: categories.commitment || "",
    posted_at: postedAt,
    has_posting_date: Boolean(postedAt),
    apply_url: job.applyUrl || job.hostedUrl || company.fullUrl,
    job_url: job.hostedUrl || job.applyUrl || company.fullUrl,
    compensation: "",
    summary: summary || "early-stage role",
  };
}

function findGreenhouseMetadata(job, keys) {
  if (!Array.isArray(job.metadata)) return "";
  const lowered = keys.map((key) => key.toLowerCase());
  const match = job.metadata.find((entry) =>
    lowered.some((key) => String(entry?.name || "").toLowerCase().includes(key))
  );
  return String(match?.value || "").trim();
}

function normalizeGreenhouseJob(company, job) {
  const departments = Array.isArray(job.departments)
    ? job.departments.map((item) => item?.name).filter(Boolean)
    : [];
  const location = job.location?.name || "unspecified";
  const postedAt = asIsoDate(job.updated_at || job.first_published || job.published_at);
  const employmentType =
    findGreenhouseMetadata(job, ["employment", "job type"]) ||
    findGreenhouseMetadata(job, ["commitment"]);

  return {
    id: `greenhouse:${company.slug}:${job.id}`,
    source: "greenhouse",
    company: company.name,
    company_slug: company.slug,
    company_url: company.fullUrl,
    title: job.title || "untitled role",
    team: departments.join(" / "),
    location,
    remote: hasRemote(location),
    employment_type: employmentType,
    posted_at: postedAt,
    has_posting_date: Boolean(postedAt),
    apply_url: job.absolute_url || company.fullUrl,
    job_url: job.absolute_url || company.fullUrl,
    compensation: "",
    summary: departments.length > 0 ? departments.join(" • ") : "early-stage role",
  };
}

async function getAshbyJobs(company) {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(company.slug)}`;
  const data = await fetchJson(url);
  if (!data || !Array.isArray(data.jobs)) return [];
  return data.jobs
    .filter((job) => job?.isListed !== false)
    .map((job) => normalizeAshbyJob(company, job));
}

async function getLeverJobs(company) {
  const url = `https://api.lever.co/v0/postings/${encodeURIComponent(company.slug)}?mode=json`;
  const data = await fetchJson(url);
  if (!Array.isArray(data)) return [];
  return data.map((job) => normalizeLeverJob(company, job));
}

async function getGreenhouseJobs(company) {
  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(company.slug)}/jobs?content=true`;
  const data = await fetchJson(url);
  if (!data || !Array.isArray(data.jobs)) return [];
  return data.jobs.map((job) => normalizeGreenhouseJob(company, job));
}

async function mapLimit(items, limit, mapper) {
  const results = [];
  let index = 0;
  let inFlight = 0;
  let done = 0;

  return await new Promise((resolvePromise) => {
    const launchNext = () => {
      if (done === items.length) {
        resolvePromise(results);
        return;
      }
      while (inFlight < limit && index < items.length) {
        const current = items[index];
        const currentIndex = index;
        index += 1;
        inFlight += 1;
        Promise.resolve(mapper(current, currentIndex))
          .then((value) => {
            results[currentIndex] = value;
          })
          .catch(() => {
            results[currentIndex] = [];
          })
          .finally(() => {
            inFlight -= 1;
            done += 1;
            launchNext();
          });
      }
    };
    launchNext();
  });
}

function dedupeJobs(rows) {
  const seen = new Set();
  const deduped = [];
  for (const row of rows) {
    const key = [
      row.source,
      row.company_slug,
      String(row.title || "").toLowerCase().trim(),
      String(row.location || "").toLowerCase().trim(),
      String(row.apply_url || "").toLowerCase().trim(),
    ].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(row);
  }
  return deduped;
}

async function loadCompaniesForSource(input) {
  const raw = await readFile(input.path, "utf8");
  const rows = parseCsv(raw).map((row) => {
    const slug = getSlugFromUrl(row.fullUrl) || row.slug;
    return {
      source: input.source,
      slug,
      name: slug,
      fullUrl: row.fullUrl,
    };
  });
  return LIMIT_PER_SOURCE > 0 ? rows.slice(0, LIMIT_PER_SOURCE) : rows;
}

async function collectJobsForSource(source, companies) {
  const getter =
    source === "ashby" ? getAshbyJobs : source === "lever" ? getLeverJobs : getGreenhouseJobs;
  const nested = await mapLimit(companies, CONCURRENCY, getter);
  return nested.flat();
}

async function main() {
  const loaded = await Promise.all(INPUTS.map(loadCompaniesForSource));
  const companiesBySource = {
    ashby: loaded[0],
    lever: loaded[1],
    greenhouse: loaded[2],
  };

  const [ashbyJobs, leverJobs, greenhouseJobs] = await Promise.all([
    collectJobsForSource("ashby", companiesBySource.ashby),
    collectJobsForSource("lever", companiesBySource.lever),
    collectJobsForSource("greenhouse", companiesBySource.greenhouse),
  ]);

  const allJobs = dedupeJobs([...ashbyJobs, ...leverJobs, ...greenhouseJobs]).sort((a, b) => {
    const dateA = a.posted_at ? Date.parse(a.posted_at) : 0;
    const dateB = b.posted_at ? Date.parse(b.posted_at) : 0;
    return dateB - dateA;
  });

  const payload = {
    generated_at: new Date().toISOString(),
    stats: {
      companies: {
        ashby: companiesBySource.ashby.length,
        lever: companiesBySource.lever.length,
        greenhouse: companiesBySource.greenhouse.length,
      },
      jobs: {
        ashby: ashbyJobs.length,
        lever: leverJobs.length,
        greenhouse: greenhouseJobs.length,
        total: allJobs.length,
      },
    },
    jobs: allJobs,
  };

  await writeFile(OUTPUT_PATH, JSON.stringify(payload), "utf8");

  console.log(
    JSON.stringify(
      {
        output: OUTPUT_PATH,
        companies: payload.stats.companies,
        jobs: payload.stats.jobs,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
