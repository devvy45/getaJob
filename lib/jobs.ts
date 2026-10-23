import { getRequestExecutionContext } from "vinext/shims/request-context";

export type JobCategory =
  | "Engineering"
  | "Product"
  | "Design"
  | "Growth"
  | "Marketing"
  | "Sales"
  | "Content"
  | "Media"
  | "Operations"
  | "HR";

export type Job = {
  id: string;
  personName: string;
  personHeadline: string;
  company: string;
  role: string;
  category: JobCategory;
  location: string;
  excerpt: string;
  postedAt: string;
  publishedAt: string;
  expiresAt?: string;
  sourceUrl: string;
  initials: string;
  accent: string;
  active?: boolean | string;
  isSample?: boolean;
};

export const JOB_CATEGORIES: JobCategory[] = [
  "Engineering",
  "Product",
  "Design",
  "Growth",
  "Marketing",
  "Sales",
  "Content",
  "Media",
  "Operations",
  "HR",
];

/** Roles without an explicit expiry are removed this many days after they were posted. */
export const DEFAULT_TTL_DAYS = 15;

type RawJob = Partial<Job> & Record<string, unknown>;

function parseDate(value: string): Date | null {
  const parts = value.trim().split("-");
  if (parts.length !== 3) {
    return null;
  }

  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  const date = new Date(year, month, day);

  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null;
  }

  return date;
}

function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isActiveFlag(value: Job["active"]): boolean {
  if (value === undefined || value === null || value === "") {
    return true;
  }

  const normalized = String(value).trim().toLowerCase();
  return normalized !== "false" && normalized !== "no" && normalized !== "0";
}

function resolveExpiryDate(job: Job): Date | null {
  if (job.expiresAt) {
    return parseDate(job.expiresAt);
  }

  if (!job.publishedAt) {
    return null;
  }

  const publishedAt = parseDate(job.publishedAt);
  if (!publishedAt) {
    return null;
  }

  const expiry = new Date(publishedAt);
  expiry.setDate(expiry.getDate() + DEFAULT_TTL_DAYS);
  return expiry;
}

export function isJobActive(job: Job, now = new Date()): boolean {
  if (!isActiveFlag(job.active)) {
    return false;
  }

  const expiryDate = resolveExpiryDate(job);
  if (!expiryDate) {
    return true;
  }

  return startOfDay(expiryDate).getTime() >= startOfDay(now).getTime();
}

export function filterActiveJobs(jobs: Job[], now = new Date()): Job[] {
  return jobs.filter((job) => isJobActive(job, now));
}

export function formatPostedAt(publishedAt: string, now = new Date()): string {
  const publishedDate = parseDate(publishedAt);
  if (!publishedDate) {
    return "Recently";
  }

  const days = Math.max(
    0,
    Math.floor((startOfDay(now).getTime() - startOfDay(publishedDate).getTime()) / 86_400_000),
  );

  if (days === 0) {
    return "Today";
  }
  if (days === 1) {
    return "1d ago";
  }
  return `${days}d ago`;
}

function normalizeCategory(value: unknown): JobCategory {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return "Engineering";
  }

  const lower = raw.toLowerCase();

  const aliases: Record<string, JobCategory> = {
    "data": "Engineering",
    "analytics": "Engineering",
    "multiple": "Engineering",
    "engineering / ai": "Engineering",
    "engineering / crypto": "Engineering",
    "engineering / sales": "Engineering",
    "product / engineering": "Engineering",
    "product marketing": "Marketing",
    "gtm / growth": "Growth",
    "growth / marketing": "Growth",
    "marketing / growth": "Growth",
    "marketing / ugc": "Marketing",
    "marketing / creative": "Marketing",
    "marketing / community": "Marketing",
    "content / writing": "Content",
    "content / editing": "Content",
    "content / marketing": "Content",
    "content / strategy": "Content",
    "account management": "Sales",
    "sales / partnerships": "Sales",
    "sales / bizdev": "Sales",
    "design / brand": "Design",
    "design / motion": "Design",
    "design engineering": "Design",
    "operations / founder's office": "Operations",
    "support / operations": "Operations",
    "ops / founder's office": "Operations",
    "program management / intern": "Operations",
    "founder's office": "Operations",
    "support": "Operations",
  };

  if (aliases[lower]) {
    return aliases[lower];
  }

  const canonical = (JOB_CATEGORIES as string[]).find((c) =>
    lower.startsWith(c.toLowerCase()),
  );

  if (canonical) {
    return canonical as JobCategory;
  }

  return "Engineering";
}

export function normalizeJob(raw: RawJob): Job {
  return {
    id: String(raw.id ?? "").trim(),
    personName: String(raw.personName ?? raw.person_name ?? "").trim(),
    personHeadline: String(raw.personHeadline ?? raw.person_headline ?? "").trim(),
    company: String(raw.company ?? "").trim(),
    role: String(raw.role ?? "").trim(),
    category: normalizeCategory(raw.category),
    location: String(raw.location ?? "").trim(),
    excerpt: String(raw.excerpt ?? "").trim(),
    postedAt: String(raw.postedAt ?? raw.posted_at ?? "").trim(),
    publishedAt: String(raw.publishedAt ?? raw.published_at ?? "").trim(),
    expiresAt: String(raw.expiresAt ?? raw.expires_at ?? "").trim() || undefined,
    sourceUrl: String(raw.sourceUrl ?? raw.source_url ?? "#").trim() || "#",
    initials: String(raw.initials ?? "").trim(),
    accent: String(raw.accent ?? "#b56a52").trim() || "#b56a52",
    active: raw.active,
    isSample: Boolean(raw.isSample),
  };
}

export function enrichJob(job: Job, now = new Date()): Job {
  const expiresAt =
    job.expiresAt ??
    (() => {
      const publishedAt = parseDate(job.publishedAt);
      if (!publishedAt) {
        return undefined;
      }
      const expiry = new Date(publishedAt);
      expiry.setDate(expiry.getDate() + DEFAULT_TTL_DAYS);
      return formatIsoDate(expiry);
    })();

  return {
    ...job,
    expiresAt,
    postedAt: job.postedAt || formatPostedAt(job.publishedAt, now),
  };
}

function sortJobs(jobs: Job[]): Job[] {
  return [...jobs].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

function dedupeJobs(jobs: Job[]): Job[] {
  const seen = new Set<string>();
  return sortJobs(jobs).filter((job) => {
    if (seen.has(job.id)) {
      return false;
    }
    seen.add(job.id);
    return true;
  });
}

export function pickFeaturedJobs(jobs: Job[], now = new Date()): Job[] {
  const activeJobs = dedupeJobs(filterActiveJobs(jobs, now));
  if (activeJobs.length === 0) {
    return [];
  }

  const shuffled = [...activeJobs];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const maxCount = Math.min(5, shuffled.length);
  const minCount = Math.min(4, maxCount);
  const count =
    maxCount <= minCount
      ? maxCount
      : minCount + Math.floor(Math.random() * (maxCount - minCount + 1));

  return shuffled.slice(0, count);
}

// --- Sheet cache -----------------------------------------------------------
// The Google Apps Script endpoint takes 2–5s per call. Visitors should never
// wait on it, so we keep the last good response in Cloudflare's shared cache
// (shared by every Worker in a data center) plus a copy in this Worker's memory.
// Fresh for 5 minutes; after that we serve the saved copy instantly and refresh
// it in the background.
const FRESH_MS = 5 * 60 * 1000;
const KEEP_SECONDS = 7 * 24 * 60 * 60;
const SHEET_TIMEOUT_MS = 10_000;
const CACHE_KEY = "https://cache.trygetajob.com/jobs-v1";

type CachedSheet = { fetchedAt: number; jobs: RawJob[] };

let memoryCopy: CachedSheet | null = null;
let refreshing: Promise<CachedSheet | null> | null = null;

function sharedCache(): Cache | null {
  const store = (globalThis as unknown as { caches?: { default?: Cache } }).caches;
  return store?.default ?? null;
}

async function readSharedCopy(): Promise<CachedSheet | null> {
  try {
    const hit = await sharedCache()?.match(CACHE_KEY);
    return hit ? ((await hit.json()) as CachedSheet) : null;
  } catch {
    return null;
  }
}

async function loadFromSheet(apiUrl: string): Promise<CachedSheet | null> {
  try {
    const response = await fetch(apiUrl, { signal: AbortSignal.timeout(SHEET_TIMEOUT_MS) });
    if (!response.ok) {
      throw new Error(`Jobs API responded with ${response.status}`);
    }
    const payload = (await response.json()) as { jobs?: RawJob[] };
    const entry: CachedSheet = { fetchedAt: Date.now(), jobs: payload.jobs ?? [] };
    memoryCopy = entry;
    await sharedCache()?.put(
      CACHE_KEY,
      new Response(JSON.stringify(entry), {
        headers: { "content-type": "application/json", "cache-control": `public, max-age=${KEEP_SECONDS}` },
      }),
    ).catch(() => undefined);
    return entry;
  } catch (error) {
    console.error("[jobs] Sheet fetch failed:", error);
    return null;
  }
}

function refreshInBackground(apiUrl: string): Promise<CachedSheet | null> {
  refreshing ??= loadFromSheet(apiUrl).finally(() => {
    refreshing = null;
  });
  // Keep the Worker alive until the refresh lands, without making the visitor wait.
  getRequestExecutionContext()?.waitUntil(refreshing);
  return refreshing;
}

async function getSheetJobs(apiUrl: string): Promise<RawJob[] | null> {
  let copy = memoryCopy;
  if (!copy || Date.now() - copy.fetchedAt > FRESH_MS) {
    const shared = await readSharedCopy();
    if (shared && (!copy || shared.fetchedAt > copy.fetchedAt)) {
      copy = memoryCopy = shared;
    }
  }

  if (copy) {
    if (Date.now() - copy.fetchedAt > FRESH_MS) {
      void refreshInBackground(apiUrl);
    }
    return copy.jobs;
  }

  // Nothing saved anywhere yet (first visit in this data center): wait once.
  const fresh = await refreshInBackground(apiUrl);
  return fresh?.jobs ?? null;
}

// No sample or placeholder roles: if the Sheet has nothing, the site says so.
function fallback(_now: Date): Job[] {
  void _now;
  return [];
}

export async function fetchJobs(now = new Date()): Promise<Job[]> {
  const apiUrl = process.env.JOBS_API_URL?.trim();
  if (!apiUrl) {
    return fallback(now);
  }

  const raw = await getSheetJobs(apiUrl);
  const jobs = (raw ?? [])
    .map(normalizeJob)
    .filter((job) => job.id)
    .map((job) => enrichJob(job, now));

  return jobs.length ? dedupeJobs(filterActiveJobs(jobs, now)) : fallback(now);
}

/** Numbers shown on the homepage, all derived from the live roles. */
export function jobStats(jobs: Job[], now = new Date()) {
  const weekAgo = startOfDay(now).getTime() - 7 * 86_400_000;
  const thisWeek = jobs.filter((job) => {
    const published = parseDate(job.publishedAt);
    return published ? published.getTime() >= weekAgo : false;
  }).length;
  const sources = new Set<string>();
  for (const job of jobs) {
    try {
      const host = new URL(job.sourceUrl).hostname.replace(/^www\./, "");
      if (host === "x.com" || host === "twitter.com") sources.add("X");
      else if (host.endsWith("linkedin.com")) sources.add("LinkedIn");
      else sources.add("careers pages");
    } catch {
      // Ignore malformed links.
    }
  }
  const categories = JOB_CATEGORIES.filter((category) => jobs.some((job) => job.category === category));
  const locations = [...new Set(jobs.map((job) => job.location.split("/")[0].trim()).filter(Boolean))];
  return { total: jobs.length, thisWeek, sources: [...sources], categories, locations, ttlDays: DEFAULT_TTL_DAYS };
}
