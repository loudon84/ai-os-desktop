import { existsSync, readFileSync } from "fs";
import { join } from "path";
import type {
  GeneHubPendingJobCache,
  InstallJob,
} from "../../shared/genehub/genehub-contract";
import { profileHome } from "../utils";
import { safeWriteFile } from "../utils";

const CACHE_VERSION = "v6.6.2";

function cachePath(): string {
  return join(profileHome(), "desktop", "genehub", "pending-jobs.json");
}

export function readPendingJobsCache(): GeneHubPendingJobCache | null {
  const path = cachePath();
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as GeneHubPendingJobCache;
  } catch {
    return null;
  }
}

export function writePendingJobsCache(jobs: InstallJob[]): GeneHubPendingJobCache {
  const file: GeneHubPendingJobCache = {
    updatedAt: new Date().toISOString(),
    jobs,
  };
  safeWriteFile(cachePath(), JSON.stringify({ version: CACHE_VERSION, ...file }, null, 2));
  return file;
}

export function mergePendingJobs(existing: InstallJob[], fresh: InstallJob[]): InstallJob[] {
  const map = new Map<string, InstallJob>();
  for (const job of existing) {
    if (job.jobId) map.set(job.jobId, job);
  }
  for (const job of fresh) {
    if (job.jobId) map.set(job.jobId, { ...map.get(job.jobId), ...job });
  }
  return [...map.values()].sort((a, b) => {
    const ta = Date.parse(a.createdAt ?? a.assignedAt ?? "") || 0;
    const tb = Date.parse(b.createdAt ?? b.assignedAt ?? "") || 0;
    return tb - ta;
  });
}

export function getCachedPendingJobs(): InstallJob[] {
  return readPendingJobsCache()?.jobs ?? [];
}
