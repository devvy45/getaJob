import { getRefreshState, refreshJobsDataset } from "@/lib/jobs-refresh";

export async function POST() {
  const result = await refreshJobsDataset();
  const state = getRefreshState();

  return Response.json({
    ok: result.ok,
    error: result.error,
    ...state,
  });
}

export async function GET() {
  return Response.json(getRefreshState());
}
