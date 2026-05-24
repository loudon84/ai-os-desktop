import { beforeEach, describe, expect, it, vi } from "vitest";

const mockExistsSync = vi.fn<(path: string) => boolean>();
const mockReaddirSync = vi.fn<(path: string) => string[]>();
const mockResolveInstallLocation = vi.fn(() => ({
  installDir: "C:\\Programs\\SMC Copilot",
  runtimeRoot: "C:\\Programs\\SMC Copilot\\runtime",
  binDir: "C:\\Programs\\SMC Copilot\\bin",
  agentDir: "C:\\Programs\\SMC Copilot\\runtime\\hermes",
  hermesRuntimeRoot: "C:\\Programs\\SMC Copilot\\runtime\\hermes",
  hermesSourceRoot: "C:\\Programs\\SMC Copilot\\runtime\\hermes\\src",
  serveRuntimeRoot: "C:\\Programs\\SMC Copilot\\runtime\\serve",
  serveSourceRoot: "C:\\Programs\\SMC Copilot\\runtime\\serve\\src",
  portalRuntimeRoot: "C:\\Programs\\SMC Copilot\\runtime\\portal",
  portalSourceRoot: "C:\\Programs\\SMC Copilot\\runtime\\portal\\src",
  source: "registry" as const,
}));

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return {
    ...actual,
    existsSync: (path: string) => mockExistsSync(path),
    readdirSync: (path: string) => mockReaddirSync(path),
  };
});

vi.mock("../src/main/enterprise/windows/install-location-resolver", () => ({
  resolveInstallLocation: () => mockResolveInstallLocation(),
}));

import {
  clearCopilotRuntimePathCache,
  resolveCopilotRuntimePaths,
} from "../src/main/runtime/runtime-paths";

function norm(path: string): string {
  return path.replace(/\\/g, "/");
}

describe("resolveCopilotRuntimePaths", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearCopilotRuntimePathCache();
    mockExistsSync.mockReturnValue(false);
    mockReaddirSync.mockReturnValue([]);
  });

  it("resolves standard v5.3 layout", () => {
    mockExistsSync.mockImplementation((p) => {
      const n = norm(p);
      return n.endsWith("/runtime/hermes/src") || n.endsWith("/runtime/hermes/venv");
    });
    mockReaddirSync.mockImplementation((p) => {
      if (norm(p).endsWith("/runtime/hermes/src")) return ["pyproject.toml"];
      return [];
    });

    const paths = resolveCopilotRuntimePaths();
    expect(norm(paths.hermesSourceRoot)).toContain("/runtime/hermes/src");
    expect(norm(paths.serveSourceRoot)).toContain("/runtime/serve/src");
    expect(norm(paths.portalSourceRoot)).toContain("/runtime/portal/src");
  });

  it("returns canonical paths when no legacy payloads exist", () => {
    const paths = resolveCopilotRuntimePaths();
    expect(norm(paths.hermesSourceRoot)).toContain("/runtime/hermes/src");
    expect(norm(paths.serveSourceRoot)).toContain("/runtime/serve/src");
  });

  it("clears cache and re-resolves", () => {
    const first = resolveCopilotRuntimePaths();
    clearCopilotRuntimePathCache();
    mockExistsSync.mockImplementation((p) => norm(p).endsWith("/runtime/hermes/src"));
    mockReaddirSync.mockImplementation((p) =>
      norm(p).endsWith("/runtime/hermes/src") ? ["pyproject.toml"] : [],
    );
    const second = resolveCopilotRuntimePaths();
    expect(first).not.toBe(second);
    expect(norm(second.hermesSourceRoot)).toContain("/runtime/hermes/src");
  });
});
