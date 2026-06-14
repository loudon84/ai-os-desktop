import { describe, it, expect, vi } from "vitest";
import type { GeneHubBundle } from "../src/shared/genehub/genehub-contract";
import { GeneHubError } from "../src/shared/genehub/genehub-errors";

vi.mock("../src/main/genehub/genehub-config", () => ({
  getGeneHubConfig: () => ({
    enabled: true,
    heartbeatIntervalMs: 60_000,
    pendingJobsIntervalMs: 60_000,
    autoInstallAssignedJobs: false,
    verifySignature: true,
    updatedAt: "",
  }),
}));

import { validateGeneHubBundle } from "../src/main/genehub/skill-package-validator";

const baseBundle: GeneHubBundle = {
  jobId: "job_1",
  manifest: {
    geneSlug: "demo",
    geneVersion: "1.0.0",
    skillName: "demo-skill",
  },
  files: [{ relativePath: "SKILL.md", content: "# demo" }],
};

describe("skill-package-validator", () => {
  it("blocks bundle when compatibility profiles exclude current profile", () => {
    const bundle: GeneHubBundle = {
      ...baseBundle,
      manifest: {
        ...baseBundle.manifest,
        compatibility: { profiles: ["writer"] },
      },
    };
    expect(() => validateGeneHubBundle(bundle, "C:\\\\hermes", "default")).toThrow(GeneHubError);
  });

  it("uses runtime verifySignature config", () => {
    const bundle: GeneHubBundle = {
      ...baseBundle,
      manifest: {
        ...baseBundle.manifest,
        signature: "invalid",
      },
    };
    expect(() => validateGeneHubBundle(bundle, "C:\\\\hermes", "default")).toThrow(GeneHubError);
  });

  it("throws GENEHUB_PATH_NOT_ALLOWED for traversal paths", () => {
    const bundle: GeneHubBundle = {
      ...baseBundle,
      files: [{ relativePath: "../escape/SKILL.md", content: "# bad" }],
    };
    try {
      validateGeneHubBundle(bundle, "C:\\\\hermes", "default");
      expect.unreachable("should throw");
    } catch (err) {
      expect(err).toBeInstanceOf(GeneHubError);
      expect((err as GeneHubError).code).toBe("GENEHUB_PATH_NOT_ALLOWED");
    }
  });
});
