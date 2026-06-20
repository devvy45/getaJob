import { queryJobs } from "@/lib/jobs-data";
import { getRefreshState } from "@/lib/jobs-refresh";

function parseList(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseInteger(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const result = await queryJobs({
    q: searchParams.get("q") || "",
    page: parseInteger(searchParams.get("page"), 1),
    pageSize: parseInteger(searchParams.get("pageSize"), 40),
    categories: parseList(searchParams.get("categories")),
    jobTypes: parseList(searchParams.get("jobTypes")),
    countries: parseList(searchParams.get("countries")),
    postedDates: parseList(searchParams.get("postedDates")),
    stages: parseList(searchParams.get("stages")),
    sizes: parseList(searchParams.get("sizes")),
    remoteOnly: searchParams.get("remoteOnly") === "1",
  });

  return Response.json({
    ...result,
    refresh: getRefreshState(),
  });
}
