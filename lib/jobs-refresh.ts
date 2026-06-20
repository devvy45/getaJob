import { spawn } from "node:child_process";
import path from "node:path";
import { reloadJobsDataset } from "@/lib/jobs-data";

const REFRESH_INTERVAL_MS = Number(process.env.JOBS_REFRESH_INTERVAL_MS || 60 * 60 * 1000);
const SCRIPT_PATH = path.join(process.cwd(), "scripts", "build-jobs-dataset.mjs");

type RefreshState = {
  isRunning: boolean;
  lastStartedAt: string | null;
  lastCompletedAt: string | null;
  lastError: string | null;
};

const state: RefreshState = {
  isRunning: false,
  lastStartedAt: null,
  lastCompletedAt: null,
  lastError: null,
};

let refreshPromise: Promise<void> | null = null;
let schedulerStarted = false;

function runBuildScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [SCRIPT_PATH], {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });

    let stderr = "";
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(stderr.trim() || `build-jobs-dataset exited with code ${code}`));
    });
  });
}

export function getRefreshState(): RefreshState {
  return { ...state };
}

export async function refreshJobsDataset(): Promise<{ ok: boolean; error?: string }> {
  if (refreshPromise) {
    await refreshPromise;
    return state.lastError ? { ok: false, error: state.lastError } : { ok: true };
  }

  state.isRunning = true;
  state.lastStartedAt = new Date().toISOString();
  state.lastError = null;

  refreshPromise = (async () => {
    try {
      await runBuildScript();
      reloadJobsDataset();
      state.lastCompletedAt = new Date().toISOString();
    } catch (error) {
      state.lastError = error instanceof Error ? error.message : String(error);
      throw error;
    } finally {
      state.isRunning = false;
      refreshPromise = null;
    }
  })();

  try {
    await refreshPromise;
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function scheduleJobsRefresh() {
  if (schedulerStarted || process.env.JOBS_AUTO_REFRESH === "0") return;
  schedulerStarted = true;

  const tick = () => {
    void refreshJobsDataset().catch(() => {
      // errors are stored in refresh state
    });
  };

  // refresh on startup (stale dataset from April, etc.)
  setTimeout(tick, 5_000);

  if (REFRESH_INTERVAL_MS > 0) {
    setInterval(tick, REFRESH_INTERVAL_MS);
  }
}
