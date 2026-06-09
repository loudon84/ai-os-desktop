import { describe, it, expect } from "vitest";
import type { GeneHubBundle } from "../src/shared/genehub/genehub-contract";
import { GeneHubError } from "../src/shared/genehub/genehub-errors";
import {
  assertValidSkillName,
  assertSafeRelativePath,
  validateGeneHubBundle,
} from "../src/main/genehub/skill-package-validator";

const hermesHome = "C:\\Users\\test\\.hermes";

function sampleBundle(overrides?: Partial<GeneHubBundle>): GeneHubBundle {
  return {
    jobId: "job_1",
    manifest: {
      geneSlug: "contact-to-order",
      geneVersion: "1.0.0",
      skillName: "contact-to-order",
    },
    files: [{ relativePath: "SKILL.md", content: "# Skill" }],
    ...overrides,
  };
}

describe("skill-package-validator", () => {
  it("rejects invalid skill names", () => {
    expect(() => assertValidSkillName("../bad")).toThrow(GeneHubError);
  });

  it("rejects path traversal", () => {
    expect(() => assertSafeRelativePath("../x", hermesHome)).toThrow(GeneHubError);
    expect(() => assertSafeRelativePath("skills/../../x", hermesHome)).toThrow(GeneHubError);
  });

  it("accepts valid bundle", () => {
    expect(() => validateGeneHubBundle(sampleBundle(), hermesHome)).not.toThrow();
  });

  it("rejects bundle without SKILL.md", () => {
    expect(() =>
      validateGeneHubBundle(
        sampleBundle({ files: [{ relativePath: "README.md", content: "x" }] }),
        hermesHome,
      ),
    ).toThrow(GeneHubError);
  });
});
