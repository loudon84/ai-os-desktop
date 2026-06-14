import { describe, it, expect, vi, beforeEach } from "vitest";
import type { InstallJob } from "../src/shared/genehub/genehub-contract";

const cachedJobs: InstallJob[] = [];
const ignored = new Set<string>();

vi.mock("../src/main/genehub/pending-jobs-cache", () => ({
  getCachedPendingJobs: () => cachedJobs,
  mergePendingJobs: (_existing: InstallJob[], fresh: InstallJob[]) => fresh,
  writePendingJobsCache: (jobs: InstallJob[]) => {
    cachedJobs.length = 0;
    cachedJobs.push(...jobs);
  },
}));

vi.mock("../src/main/genehub/ignored-jobs-store", () => ({
  isJobIgnored: (jobId: string) => ignored.has(jobId),
  ignoreInstallJob: (jobId: string) => {
    ignored.add(jobId);
  },
}));

vi.mock("../src/main/genehub/genehub-connection", () => ({
  isGeneHubInitialized: () => true,
}));

vi.mock("../src/main/genehub/genehub-install-log", () => ({
  readInstallLogs: () => [
    {
      time: "2026-01-01T00:00:00.000Z",
      jobId: "job_ok",
      geneSlug: "demo-skill",
      step: "installed",
      status: "success",
      message: "installed",
    },
    {
      time: "2026-01-01T01:00:00.000Z",
      jobId: "job_fail",
      geneSlug: "bad-skill",
      step: "failed",
      status: "failed",
      message: "hash mismatch",
      errorCode: "GENEHUB_HASH_MISMATCH",
    },
  ],
}));

vi.mock("../src/main/genehub/hermes-profile-resolver", () => ({
  resolveHermesProfiles: () => [
    {
      profileName: "default",
      profileId: "default",
      hermesHome: "C:\\\\hermes",
      capabilities: { skills: true, scripts: true, reload: false },
    },
  ],
  resolveHermesProfile: () => ({
    profileName: "default",
    profileId: "default",
    hermesHome: "C:\\\\hermes",
    capabilities: { skills: true, scripts: true, reload: false },
  }),
}));

vi.mock("../src/main/genehub/genehub-session", () => ({
  resolveGeneHubServerProfileId: () => "srv_default",
}));

vi.mock("../src/main/genehub/genehub-client", () => ({
  listPendingJobs: vi.fn(async () => []),
  downloadBundle: vi.fn(async () => ({
    jobId: "job_mcp",
    manifest: { geneSlug: "demo", geneVersion: "1.0.0", skillName: "demo" },
    files: [{ relativePath: "SKILL.md", content: "# demo" }],
  })),
}));

import {
  getRegistrationSummary,
  ignoreInstallJob,
  listMcpRegistrationJobs,
  previewInstallBundle,
} from "../src/main/genehub/mcp-registration-service";

beforeEach(() => {
  cachedJobs.length = 0;
  ignored.clear();
  cachedJobs.push(
    {
      jobId: "job_mcp",
      profileId: "srv_default",
      profileName: "default",
      geneSlug: "demo",
      geneVersion: "1.0.0",
      skillName: "demo",
      action: "install",
      status: "pending",
      source: "mcp_agent_request",
    },
    {
      jobId: "job_server",
      profileId: "srv_default",
      profileName: "default",
      geneSlug: "other",
      geneVersion: "1.0.0",
      skillName: "other",
      action: "install",
      status: "pending",
      source: "server_assigned",
    },
  );
});

describe("mcp-registration-service", () => {
  it("lists only mcp_agent_request jobs grouped by status", async () => {
    cachedJobs.push({
      jobId: "job_done",
      profileId: "srv_default",
      geneSlug: "done",
      geneVersion: "1.0.0",
      skillName: "done",
      action: "install",
      status: "installed",
      source: "mcp_agent_request",
    });

    const result = await listMcpRegistrationJobs();
    expect(result.jobs.every((j) => j.source === "mcp_agent_request")).toBe(true);
    expect(result.groups.awaiting_confirm).toHaveLength(1);
    expect(result.groups.completed).toHaveLength(1);
    expect(result.jobs.some((j) => j.jobId === "job_server")).toBe(false);
  });

  it("excludes ignored jobs", async () => {
    ignoreInstallJob("job_mcp");
    const result = await listMcpRegistrationJobs();
    expect(result.jobs.some((j) => j.jobId === "job_mcp")).toBe(false);
  });

  it("returns registration summary with pending count and last logs", async () => {
    const summary = await getRegistrationSummary();
    expect(summary.pendingMcpJobCount).toBe(1);
    expect(summary.lastInstalled?.jobId).toBe("job_ok");
    expect(summary.lastFailed?.jobId).toBe("job_fail");
  });

  it("previewInstallBundle returns sanitized file list", async () => {
    const preview = await previewInstallBundle("job_mcp");
    expect(preview.files).toHaveLength(1);
    expect(preview.files[0].relativePath).toBe("SKILL.md");
    expect(preview.files[0]).not.toHaveProperty("content");
  });
});
