import { getRefreshState, refreshJobsDataset } from "@/lib/jobs-refresh";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await refreshJobsDataset();
  const state = getRefreshState();

  return Response.json({
    ok: result.ok,
    error: result.error,
    ...state,
  });
}

export async function POST(request: Request) {
  return GET(request);
}
