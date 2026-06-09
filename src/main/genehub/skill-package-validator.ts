import { createHash } from "crypto";
import { isAbsolute, normalize, resolve, sep } from "path";
import type { GeneHubBundle } from "../../shared/genehub/genehub-contract";
import { GENEHUB_SKILL_NAME_PATTERN } from "../../shared/genehub/genehub-contract";
import { GeneHubError } from "../../shared/genehub/genehub-errors";
import { DEFAULT_GENEHUB_RUNTIME_CONFIG } from "../../shared/genehub/genehub-contract";

const FORBIDDEN_PATH_PATTERNS = [
  /\.\./,
  /^[A-Za-z]:\\/,
  /^\\\\/,
  /^\//,
];

export function assertValidSkillName(skillName: string): void {
  if (!GENEHUB_SKILL_NAME_PATTERN.test(skillName)) {
    throw new GeneHubError(
      "GENEHUB_INVALID_SKILL_NAME",
      `Invalid skill name: ${skillName}`,
    );
  }
}

export function assertSafeRelativePath(relativePath: string, hermesHome: string): string {
  const trimmed = relativePath.replace(/\\/g, "/").trim();
  if (!trimmed || trimmed.includes("\0")) {
    throw new GeneHubError("GENEHUB_INVALID_FILE_PATH", `Invalid file path: ${relativePath}`);
  }

  for (const pattern of FORBIDDEN_PATH_PATTERNS) {
    if (pattern.test(trimmed) || pattern.test(relativePath)) {
      throw new GeneHubError("GENEHUB_INVALID_FILE_PATH", `Forbidden path: ${relativePath}`);
    }
  }

  if (isAbsolute(trimmed)) {
    throw new GeneHubError("GENEHUB_INVALID_FILE_PATH", `Absolute path not allowed: ${relativePath}`);
  }

  const resolved = resolve(hermesHome, trimmed);
  const normalizedHome = resolve(hermesHome);
  if (resolved !== normalizedHome && !resolved.startsWith(`${normalizedHome}${sep}`)) {
    throw new GeneHubError("GENEHUB_INVALID_FILE_PATH", `Path escapes hermes home: ${relativePath}`);
  }

  return normalize(trimmed);
}

function hashContent(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

export function validateGeneHubBundle(bundle: GeneHubBundle, hermesHome: string): void {
  const manifest = bundle.manifest;

  if (!manifest.geneSlug?.trim() || !manifest.skillName?.trim()) {
    throw new GeneHubError("GENEHUB_BUNDLE_INVALID", "Bundle manifest missing geneSlug or skillName");
  }

  assertValidSkillName(manifest.skillName);

  if (!bundle.files.some((f) => f.relativePath.endsWith("SKILL.md") || f.relativePath === "SKILL.md")) {
    throw new GeneHubError("GENEHUB_BUNDLE_INVALID", "Bundle must include SKILL.md");
  }

  for (const file of bundle.files) {
    assertSafeRelativePath(file.relativePath, hermesHome);
  }

  for (const script of bundle.scripts ?? []) {
    assertSafeRelativePath(script.relativePath, hermesHome);
  }

  if (manifest.manifestHash) {
    const manifestPayload = JSON.stringify({
      geneSlug: manifest.geneSlug,
      geneVersion: manifest.geneVersion,
      skillName: manifest.skillName,
    });
    const computed = hashContent(manifestPayload);
    if (computed !== manifest.manifestHash) {
      throw new GeneHubError("GENEHUB_HASH_MISMATCH", "Manifest hash mismatch");
    }
  }

  if (manifest.bundleHash) {
    const payload = JSON.stringify(bundle.files.map((f) => [f.relativePath, f.content]));
    const computed = hashContent(payload);
    if (computed !== manifest.bundleHash) {
      throw new GeneHubError("GENEHUB_HASH_MISMATCH", "Bundle hash mismatch");
    }
  }

  if (DEFAULT_GENEHUB_RUNTIME_CONFIG.verifySignature && manifest.signature === "invalid") {
    throw new GeneHubError("GENEHUB_SIGNATURE_INVALID", "Bundle signature invalid");
  }
}
