import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/main/genehub/genehub-client", () => ({
  claimJob: vi.fn(async () => ({
    jobId: "job_1",
    profileId: "default",
    geneSlug: "demo-skill",
    geneVersion: "1.0.0",
    skillName: "demo-skill",
    action: "install",
    status: "claimed",
  })),
  downloadBundle: vi.fn(async () => ({
    jobId: "job_1",
    manifest: {
      geneSlug: "demo-skill",
      geneVersion: "1.0.0",
      skillName: "demo-skill",
    },
    files: [{ relativePath: "SKILL.md", content: "# demo" }],
  })),
  updateJobStatus: vi.fn(async () => undefined),
  syncInstalledSkills: vi.fn(async () => undefined),
}));

vi.mock("../src/main/genehub/hermes-profile-resolver", () => ({
  resolveHermesProfile: () => ({
    profileName: "default",
    profileId: "default",
    hermesHome: "C:\\\\tmp\\\\hermes",
    gatewayUrl: "http://127.0.0.1:8642",
    gatewayPort: 8642,
    capabilities: { skills: true, scripts: true, reload: false },
  }),
}));

vi.mock("../src/main/genehub/hermes-skill-writer", () => ({
  installGeneHubBundle: vi.fn(async () => ({
    geneSlug: "demo-skill",
    geneVersion: "1.0.0",
    skillName: "demo-skill",
    installedAt: new Date().toISOString(),
    source: "nodeskclaw-genehub",
    jobId: "job_1",
    profileName: "default",
  })),
  uninstallGeneHubSkill: vi.fn(async () => undefined),
}));

vi.mock("../src/main/genehub/hermes-restart-service", () => ({
  reloadOrRestart: vi.fn(async () => ({ ok: true, mode: "restart" as const })),
}));

vi.mock("../src/main/genehub/installed-skill-store", () => ({
  listInstalledSkillRecords: vi.fn(() => []),
}));

vi.mock("../src/main/genehub/genehub-install-log", () => ({
  appendInstallLog: vi.fn(),
}));

import { runInstallJob } from "../src/main/genehub/skill-install-worker";
import * as genehubClient from "../src/main/genehub/genehub-client";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("skill-install-worker", () => {
  it("runs claim → download → install → status installed", async () => {
    await runInstallJob("job_1");
    expect(genehubClient.claimJob).toHaveBeenCalledWith("job_1");
    expect(genehubClient.downloadBundle).toHaveBeenCalledWith("job_1");
    expect(genehubClient.updateJobStatus).toHaveBeenCalled();
    expect(genehubClient.syncInstalledSkills).toHaveBeenCalled();
  });

  it("does not report claimed status to backend", async () => {
    await runInstallJob("job_1");
    const statuses = vi
      .mocked(genehubClient.updateJobStatus)
      .mock.calls.map((call) => call[1].status);
    expect(statuses).not.toContain("claimed");
  });
});
