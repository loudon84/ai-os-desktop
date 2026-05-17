import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("install-location-resolver", () => {
  let tempRoot: string;
  const prevEnv = process.env.SMC_COPILOT_INSTALL_DIR;

  beforeEach(() => {
    tempRoot = mkdtempSync(join(tmpdir(), "smc-install-"));
    process.env.SMC_COPILOT_INSTALL_DIR = tempRoot;
  });

  afterEach(() => {
    if (prevEnv === undefined) {
      delete process.env.SMC_COPILOT_INSTALL_DIR;
    } else {
      process.env.SMC_COPILOT_INSTALL_DIR = prevEnv;
    }
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it("resolves agentDir under runtime/hermes-agent from env var", async () => {
    mkdirSync(join(tempRoot, "runtime", "hermes-agent"), { recursive: true });
    const { resolveInstallLocation } = await import(
      "../src/main/enterprise/windows/install-location-resolver"
    );
    const loc = resolveInstallLocation();
    expect(loc.installDir).toBe(tempRoot);
    expect(loc.runtimeRoot).toBe(join(tempRoot, "runtime"));
    expect(loc.agentDir).toBe(join(tempRoot, "runtime", "hermes-agent"));
    expect(loc.source).toBe("env-var");
  });

  it("lists legacy install directories including Programs Hermes Agent", async () => {
    const localAppData = join(tempRoot, "local-app");
    mkdirSync(localAppData, { recursive: true });
    const legacyAgent = join(localAppData, "Programs", "Hermes Agent");
    mkdirSync(legacyAgent, { recursive: true });
    writeFileSync(join(legacyAgent, "pyproject.toml"), "[project]\n", "utf-8");

    const prevLocal = process.env.LOCALAPPDATA;
    process.env.LOCALAPPDATA = localAppData;

    const { readLegacyInstallLocations } = await import(
      "../src/main/enterprise/windows/install-location-resolver"
    );
    const legacy = readLegacyInstallLocations();
    expect(legacy.some((l) => l.source === "legacy-programs-hermes-agent")).toBe(
      true,
    );

    process.env.LOCALAPPDATA = prevLocal;
  });
});
