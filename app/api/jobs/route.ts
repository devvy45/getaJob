import { fetchJobs } from "../../../lib/jobs";

export async function GET() {
  try {
    const jobs = await fetchJobs();
    return Response.json({ jobs });
  } catch (error) {
    console.error("[api/jobs]", error);
    return Response.json({ jobs: [], error: "Failed to load jobs" }, { status: 500 });
  }
}
