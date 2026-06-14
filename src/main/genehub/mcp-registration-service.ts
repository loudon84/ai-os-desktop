import type {
  GeneHubInstallBundlePreview,
  GeneHubMcpRegistrationJobsResult,
  GeneHubProfileScopedInput,
  GeneHubRegistrationSummary,
  InstallJob,
  McpRegistrationJobGroup,
} from "../../shared/genehub/genehub-contract";
import { GeneHubError } from "../../shared/genehub/genehub-errors";
import * as genehubClient from "./genehub-client";
import { readInstallLogs } from "./genehub-install-log";
import { isGeneHubInitialized } from "./genehub-connection";
import { resolveHermesProfile, resolveHermesProfiles } from "./hermes-profile-resolver";
import { resolveGeneHubServerProfileId } from "./genehub-session";
import { isJobIgnored, ignoreInstallJob as storeIgnoredJob } from "./ignored-jobs-store";
import {
  getCachedPendingJobs,
  mergePendingJobs,
  writePendingJobsCache,
} from "./pending-jobs-cache";

function isMcpJob(job: InstallJob): boolean {
  return job.source === "mcp_agent_request";
}

function groupMcpJob(job: InstallJob): McpRegistrationJobGroup {
  if (job.status === "pending") return "awaiting_confirm";
  if (job.status === "installed") return "completed";
  if (job.status === "failed" || job.status === "cancelled") return "failed";
  return "in_progress";
}

function emptyGroups(): Record<McpRegistrationJobGroup, InstallJob[]> {
  return {
    awaiting_confirm: [],
    in_progress: [],
    completed: [],
    failed: [],
  };
}

export async function fetchAndCachePendingJobs(): Promise<InstallJob[]> {
  const profiles = resolveHermesProfiles();
  const fresh: InstallJob[] = [];
  for (const profile of profiles) {
    const serverProfileId = resolveGeneHubServerProfileId(profile);
    const jobs = await genehubClient.listPendingJobs(serverProfileId);
    for (const job of jobs) {
      fresh.push({
        ...job,
        profileName: job.profileName ?? profile.profileName,
      });
    }
  }
  const merged = mergePendingJobs(getCachedPendingJobs(), fresh);
  writePendingJobsCache(merged);
  return merged;
}

export async function listMcpRegistrationJobs(
  input?: GeneHubProfileScopedInput,
): Promise<GeneHubMcpRegistrationJobsResult> {
  if (!isGeneHubInitialized()) {
    throw new GeneHubError("GENEHUB_NOT_INITIALIZED", "GeneHub is not initialized");
  }

  let jobs = getCachedPendingJobs();
  if (jobs.length === 0) {
    try {
      jobs = await fetchAndCachePendingJobs();
    } catch {
      jobs = [];
    }
  }

  const profile = input?.profileId ? resolveHermesProfile(input.profileId) : null;
  const filtered = jobs.filter((job) => {
    if (!isMcpJob(job)) return false;
    if (isJobIgnored(job.jobId)) return false;
    if (profile && job.profileId !== resolveGeneHubServerProfileId(profile) && job.profileName !== profile.profileName) {
      return false;
    }
    return true;
  });

  const groups = emptyGroups();
  for (const job of filtered) {
    groups[groupMcpJob(job)].push(job);
  }

  return { groups, jobs: filtered };
}

export async function previewInstallBundle(jobId: string): Promise<GeneHubInstallBundlePreview> {
  if (!isGeneHubInitialized()) {
    throw new GeneHubError("GENEHUB_NOT_INITIALIZED", "GeneHub is not initialized");
  }

  const cached = getCachedPendingJobs().find((j) => j.jobId === jobId);
  if (!cached) {
    throw new GeneHubError("GENEHUB_JOB_NOT_FOUND", `Install job not found: ${jobId}`);
  }

  const base = {
    jobId,
    skillName: cached.skillName,
    geneSlug: cached.geneSlug,
    geneVersion: cached.geneVersion,
    manifest: {
      geneSlug: cached.geneSlug,
      geneVersion: cached.geneVersion,
      skillName: cached.skillName,
    },
    files: [] as GeneHubInstallBundlePreview["files"],
    scripts: [] as GeneHubInstallBundlePreview["files"],
  };

  try {
    const bundle = await genehubClient.downloadBundle(jobId);
    return {
      ...base,
      manifest: bundle.manifest,
      files: bundle.files.map((f) => ({
        relativePath: f.relativePath,
        encoding: f.encoding,
        sizeHint: f.content.length,
      })),
      scripts: (bundle.scripts ?? []).map((f) => ({
        relativePath: f.relativePath,
        encoding: f.encoding,
        sizeHint: f.content.length,
      })),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ...base,
      previewLimited: true,
      previewError: message,
    };
  }
}

export function ignoreMcpInstallJob(jobId: string): void {
  storeIgnoredJob(jobId);
}

export async function getRegistrationSummary(): Promise<GeneHubRegistrationSummary> {
  const mcpJobs = await listMcpRegistrationJobs().catch(() => ({
    groups: emptyGroups(),
    jobs: [] as InstallJob[],
  }));

  const pendingMcpJobCount = mcpJobs.groups.awaiting_confirm.length;
  const logs = readInstallLogs(200);

  let lastInstalled: GeneHubRegistrationSummary["lastInstalled"];
  let lastFailed: GeneHubRegistrationSummary["lastFailed"];

  for (const entry of logs) {
    if (!lastInstalled && entry.step === "installed" && entry.status !== "failed") {
      lastInstalled = {
        jobId: entry.jobId,
        skillName: entry.geneSlug,
        geneSlug: entry.geneSlug,
        installedAt: entry.time,
      };
    }
    if (!lastFailed && entry.status === "failed") {
      lastFailed = {
        jobId: entry.jobId,
        skillName: entry.geneSlug,
        geneSlug: entry.geneSlug,
        errorCode: entry.errorCode,
        errorMessage: entry.message,
        failedAt: entry.time,
      };
    }
    if (lastInstalled && lastFailed) break;
  }

  return { pendingMcpJobCount, lastInstalled, lastFailed };
}

export { ignoreMcpInstallJob as ignoreInstallJob };
