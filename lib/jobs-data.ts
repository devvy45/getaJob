import fs from "node:fs/promises";
import path from "node:path";

type RawJobRecord = {
  id: string;
  company: string;
  title: string;
  team: string;
  location: string;
  remote: boolean;
  employment_type: string;
  posted_at: string | null;
  apply_url: string;
  summary: string;
};

type RawJobsPayload = {
  generated_at?: string;
  jobs: RawJobRecord[];
};

type DateBucket =
  | "last_24h"
  | "last_3d"
  | "last_7d"
  | "last_30d"
  | "last_90d"
  | "older"
  | "undated";
type Category =
  | "engineering"
  | "product"
  | "design"
  | "data"
  | "sales"
  | "operations"
  | "finance"
  | "recruiting"
  | "legal"
  | "marketing"
  | "support"
  | "science"
  | "other";
type JobType = "full-time" | "part-time" | "intern" | "contract" | "other";
type Stage = "pre-seed/seed" | "series a" | "series b+" | "growth/late" | "unknown";
type CompanySize = "1-10" | "11-50" | "51-200" | "201-500" | "500+" | "unknown";

export type FilterOption = {
  id: string;
  label: string;
  count: number;
};

export type JobListItem = {
  id: string;
  company: string;
  title: string;
  location: string;
  remote: boolean;
  jobType: JobType;
  postedAt: string | null;
  applyUrl: string;
  category: Category;
  country: string;
  postedBucket: DateBucket;
  companyStage: Stage;
  companySize: CompanySize;
};

export type JobsFacets = {
  categories: FilterOption[];
  jobTypes: FilterOption[];
  countries: FilterOption[];
  postedDates: FilterOption[];
  stages: FilterOption[];
  sizes: FilterOption[];
};

export type JobsQueryInput = {
  q: string;
  page: number;
  pageSize: number;
  categories: string[];
  jobTypes: string[];
  countries: string[];
  postedDates: string[];
  stages: string[];
  sizes: string[];
  remoteOnly: boolean;
};

type LandingPreviewItem = {
  id: string;
  company: string;
  title: string;
  location: string;
  applyUrl: string;
};

type PreparedDataset = {
  jobs: JobListItem[];
  facets: JobsFacets;
  landingPreview: LandingPreviewItem[];
  generatedAt: string | null;
};

const DATE_BUCKETS: Array<{ id: DateBucket; label: string }> = [
  { id: "last_24h", label: "last 24h" },
  { id: "last_3d", label: "last 3 days" },
  { id: "last_7d", label: "last 7 days" },
  { id: "last_30d", label: "last 30 days" },
  { id: "last_90d", label: "last 90 days" },
  { id: "older", label: "older" },
  { id: "undated", label: "undated" },
];

const STAGE_ORDER: Stage[] = ["pre-seed/seed", "series a", "series b+", "growth/late", "unknown"];
const SIZE_ORDER: CompanySize[] = ["1-10", "11-50", "51-200", "201-500", "500+", "unknown"];
const CATEGORY_ORDER: Category[] = [
  "engineering",
  "product",
  "design",
  "data",
  "sales",
  "operations",
  "finance",
  "recruiting",
  "legal",
  "marketing",
  "support",
  "science",
  "other",
];
const JOB_TYPE_ORDER: JobType[] = ["full-time", "part-time", "intern", "contract", "other"];

const COUNTRY_PATTERNS: Array<{ label: string; regex: RegExp }> = [
  { label: "united states", regex: /\b(?:united states|usa|u\.s\.|us)\b/i },
  { label: "canada", regex: /\bcanada\b/i },
  { label: "united kingdom", regex: /\b(?:united kingdom|uk|england|scotland|wales)\b/i },
  { label: "germany", regex: /\bgermany|deutschland\b/i },
  { label: "france", regex: /\bfrance\b/i },
  { label: "netherlands", regex: /\bnetherlands\b/i },
  { label: "sweden", regex: /\bsweden\b/i },
  { label: "norway", regex: /\bnorway\b/i },
  { label: "denmark", regex: /\bdenmark\b/i },
  { label: "spain", regex: /\bspain\b/i },
  { label: "italy", regex: /\bitaly\b/i },
  { label: "ireland", regex: /\bireland\b/i },
  { label: "portugal", regex: /\bportugal\b/i },
  { label: "switzerland", regex: /\bswitzerland\b/i },
  { label: "poland", regex: /\bpoland\b/i },
  { label: "india", regex: /\bindia\b/i },
  { label: "singapore", regex: /\bsingapore\b/i },
  { label: "australia", regex: /\baustralia\b/i },
  { label: "new zealand", regex: /\bnew zealand\b/i },
  { label: "japan", regex: /\bjapan\b/i },
  { label: "south korea", regex: /\b(?:south korea|korea)\b/i },
  { label: "uae", regex: /\b(?:uae|united arab emirates)\b/i },
  { label: "brazil", regex: /\bbrazil\b/i },
  { label: "mexico", regex: /\bmexico\b/i },
  { label: "argentina", regex: /\bargentina\b/i },
];

function toAbcLabel(value: string): string {
  const normalized = String(value || "").trim();
  if (!normalized) return "";

  const acronyms: Record<string, string> = {
    us: "US",
    uk: "UK",
    uae: "UAE",
  };

  return normalized
    .split(/(\s+|-|\/)/)
    .map((token) => {
      if (!token.trim() || token === "-" || token === "/") return token;
      const lower = token.toLowerCase();
      if (acronyms[lower]) return acronyms[lower];
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("");
}

function classifyCategory(title: string, team: string): Category {
  const text = `${title} ${team}`.toLowerCase();
  if (/\brecruit|talent|hr\b/.test(text)) return "recruiting";
  if (/\blegal|counsel|compliance\b/.test(text)) return "legal";
  if (/\bfinance|accounting|controller|treasury|fp&a|audit\b/.test(text)) return "finance";
  if (/\bdata scientist|data analyst|analytics|business intelligence|bi\b/.test(text))
    return "data";
  if (/\bproduct\b|\bpm\b|product manager/.test(text)) return "product";
  if (/\bdesign|designer|ux|ui|creative|brand\b/.test(text)) return "design";
  if (/\bmarketing|growth|seo|content|demand gen\b/.test(text)) return "marketing";
  if (/\bsales|account executive|business development|partnership|revops\b/.test(text))
    return "sales";
  if (/\bsupport|customer success|customer service\b/.test(text)) return "support";
  if (/\boperations|ops|program manager|project manager\b/.test(text)) return "operations";
  if (/\bscience|scientist|research|biology|chemistry|biotech|lab\b/.test(text)) return "science";
  if (
    /\bengineer|engineering|developer|devops|platform|backend|frontend|full stack|sre\b/.test(
      text
    )
  )
    return "engineering";
  return "other";
}

function normalizeJobType(employmentType: string, title: string): JobType {
  const text = `${employmentType} ${title}`.toLowerCase();
  if (/\bintern\b|\binternship\b/.test(text)) return "intern";
  if (/\bpart.?time\b/.test(text)) return "part-time";
  if (/\bcontract|contractor|freelance|temporary\b/.test(text)) return "contract";
  if (/\bfull.?time|fulltime\b/.test(text)) return "full-time";
  return "other";
}

function normalizeCountry(location: string, remote: boolean): string {
  const text = String(location || "").toLowerCase();
  for (const item of COUNTRY_PATTERNS) {
    if (item.regex.test(text)) return item.label;
  }
  if (remote || text.includes("remote")) return "remote";
  if (!text.trim()) return "unknown";
  return "other";
}

function toDateBucket(postedAt: string | null, now = Date.now()): DateBucket {
  if (!postedAt) return "undated";
  const timestamp = Date.parse(postedAt);
  if (Number.isNaN(timestamp)) return "undated";
  const diffMs = now - timestamp;
  const dayMs = 24 * 60 * 60 * 1000;
  if (diffMs <= dayMs) return "last_24h";
  if (diffMs <= 3 * dayMs) return "last_3d";
  if (diffMs <= 7 * dayMs) return "last_7d";
  if (diffMs <= 30 * dayMs) return "last_30d";
  if (diffMs <= 90 * dayMs) return "last_90d";
  return "older";
}

function deriveStage(text: string): Stage {
  const value = text.toLowerCase();
  if (/\bpre[-\s]?seed\b|\bseed\b/.test(value)) return "pre-seed/seed";
  if (/\bseries a\b/.test(value)) return "series a";
  if (/\bseries [b-z]\b|\bseries [2-9]\b/.test(value)) return "series b+";
  if (/\bgrowth|late stage|public\b/.test(value)) return "growth/late";
  return "unknown";
}

function deriveCompanySize(text: string): CompanySize {
  const value = text.toLowerCase();
  if (/\b1[-\s]?10\b/.test(value)) return "1-10";
  if (/\b11[-\s]?50\b/.test(value)) return "11-50";
  if (/\b51[-\s]?200\b/.test(value)) return "51-200";
  if (/\b201[-\s]?500\b/.test(value)) return "201-500";
  if (/\b500\+|501\b|\b1000\b/.test(value)) return "500+";
  return "unknown";
}

function optionsFromCounts(
  counts: Map<string, number>,
  preferredOrder?: string[],
  labels?: Record<string, string>
): FilterOption[] {
  const entries = [...counts.entries()].filter(([id, count]) => count > 0 && id !== "unknown");

  if (preferredOrder) {
    entries.sort((a, b) => {
      const aIndex = preferredOrder.indexOf(a[0]);
      const bIndex = preferredOrder.indexOf(b[0]);
      if (aIndex === -1 && bIndex === -1) return a[0].localeCompare(b[0]);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  } else {
    entries.sort((a, b) => b[1] - a[1]);
  }

  return entries.map(([id, count]) => ({
    id,
    label: toAbcLabel(labels?.[id] || id),
    count,
  }));
}

function isSearchMatch(job: JobListItem, query: string): boolean {
  if (!query) return true;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escaped}\\b`, 'i');
  return (
    regex.test(job.title) ||
    regex.test(job.company) ||
    regex.test(job.location) ||
    regex.test(job.category) ||
    regex.test(job.jobType) ||
    regex.test(job.country)
  );
}

let preparedDatasetPromise: Promise<PreparedDataset> | null = null;

export function reloadJobsDataset() {
  preparedDatasetPromise = null;
}

function buildFacets(jobs: JobListItem[], now = Date.now()): JobsFacets {
  const categoryCounts = new Map<string, number>();
  const jobTypeCounts = new Map<string, number>();
  const countryCounts = new Map<string, number>();
  const dateCounts = new Map<string, number>();
  const stageCounts = new Map<string, number>();
  const sizeCounts = new Map<string, number>();

  for (const row of jobs) {
    categoryCounts.set(row.category, (categoryCounts.get(row.category) || 0) + 1);
    jobTypeCounts.set(row.jobType, (jobTypeCounts.get(row.jobType) || 0) + 1);
    countryCounts.set(row.country, (countryCounts.get(row.country) || 0) + 1);
    const bucket = toDateBucket(row.postedAt, now);
    dateCounts.set(bucket, (dateCounts.get(bucket) || 0) + 1);
    stageCounts.set(row.companyStage, (stageCounts.get(row.companyStage) || 0) + 1);
    sizeCounts.set(row.companySize, (sizeCounts.get(row.companySize) || 0) + 1);
  }

  return {
    categories: optionsFromCounts(categoryCounts, CATEGORY_ORDER),
    jobTypes: optionsFromCounts(jobTypeCounts, JOB_TYPE_ORDER),
    countries: optionsFromCounts(countryCounts),
    postedDates: optionsFromCounts(
      dateCounts,
      DATE_BUCKETS.map((item) => item.id),
      Object.fromEntries(DATE_BUCKETS.map((item) => [item.id, item.label]))
    ),
    stages: optionsFromCounts(stageCounts, STAGE_ORDER),
    sizes: optionsFromCounts(sizeCounts, SIZE_ORDER),
  };
}

async function buildPreparedDataset(): Promise<PreparedDataset> {
  const filePath = path.join(process.cwd(), "public", "jobs-dataset.json");
  const content = await fs.readFile(filePath, "utf8");
  const payload = JSON.parse(content) as RawJobsPayload;
  const rawJobs = Array.isArray(payload.jobs) ? payload.jobs : [];

  const jobs: JobListItem[] = rawJobs.map((job) => ({
    id: job.id,
    company: job.company,
    title: job.title,
    location: job.location || "Remote",
    remote: Boolean(job.remote),
    jobType: normalizeJobType(job.employment_type, job.title),
    postedAt: job.posted_at,
    applyUrl: job.apply_url || "#",
    category: classifyCategory(job.title, job.team),
    country: normalizeCountry(job.location, job.remote),
    postedBucket: "undated",
    companyStage: deriveStage(`${job.summary} ${job.team}`),
    companySize: deriveCompanySize(`${job.summary} ${job.team}`),
  }));

  jobs.sort((a, b) => {
    const aTime = a.postedAt ? Date.parse(a.postedAt) : 0;
    const bTime = b.postedAt ? Date.parse(b.postedAt) : 0;
    return bTime - aTime;
  });

  return {
    jobs,
    generatedAt: payload.generated_at || null,
    landingPreview: jobs.slice(0, 4).map((job) => ({
      id: job.id,
      company: job.company,
      title: job.title,
      location: job.location || "Remote",
      applyUrl: job.applyUrl,
    })),
    facets: buildFacets(jobs),
  };
}

async function getPreparedDataset(): Promise<PreparedDataset> {
  if (!preparedDatasetPromise) {
    preparedDatasetPromise = buildPreparedDataset();
  }
  return preparedDatasetPromise;
}

export async function getLandingJobsPreview() {
  const prepared = await getPreparedDataset();
  const shuffled = [...prepared.jobs].sort(() => Math.random() - 0.5);
  const randomPreview = shuffled.slice(0, 4).map((job) => ({
    id: job.id,
    company: job.company,
    title: job.title,
    location: job.location || "Remote",
    applyUrl: job.applyUrl,
  }));
  return {
    total: prepared.jobs.length,
    preview: randomPreview,
  };
}

export async function queryJobs(input: JobsQueryInput) {
  const prepared = await getPreparedDataset();
  const query = input.q.trim().toLowerCase();
  const now = Date.now();

  const selectedCategories = new Set(input.categories);
  const selectedJobTypes = new Set(input.jobTypes);
  const selectedCountries = new Set(input.countries);
  const selectedPostedDates = new Set(input.postedDates);
  const selectedStages = new Set(input.stages);
  const selectedSizes = new Set(input.sizes);

  const matched: JobListItem[] = [];

  for (const job of prepared.jobs) {
    if (!isSearchMatch(job, query)) continue;
    if (selectedCategories.size > 0 && !selectedCategories.has(job.category)) continue;
    if (selectedJobTypes.size > 0 && !selectedJobTypes.has(job.jobType)) continue;
    if (selectedCountries.size > 0 && !selectedCountries.has(job.country)) continue;
    if (
      selectedPostedDates.size > 0 &&
      !selectedPostedDates.has(toDateBucket(job.postedAt, now))
    )
      continue;
    if (selectedStages.size > 0 && !selectedStages.has(job.companyStage)) continue;
    if (selectedSizes.size > 0 && !selectedSizes.has(job.companySize)) continue;
    if (input.remoteOnly && !job.remote) continue;
    matched.push({
      ...job,
      postedBucket: toDateBucket(job.postedAt, now),
    });
  }

  const safePageSize = Math.max(1, Math.min(input.pageSize || 40, 100));
  const total = matched.length;
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const page = Math.max(1, Math.min(input.page || 1, totalPages));
  const start = (page - 1) * safePageSize;
  const jobs = matched.slice(start, start + safePageSize);

  return {
    total,
    page,
    pageSize: safePageSize,
    totalPages,
    jobs,
    facets: buildFacets(prepared.jobs, now),
    generatedAt: prepared.generatedAt,
  };
}
