import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../src/main/mcp-skill-gateway-runtime/mcp-skill-gateway-config", () => ({
  getMcpSkillGatewayConfig: vi.fn(() => ({
    localProxyPort: 48742,
    mcpEndpointPath: "/api/v1/hermes/mcp",
  })),
  resolveBackendBaseUrl: vi.fn(() => "http://192.168.0.118:4510"),
  resolveLocalMcpUrl: vi.fn((port: number) => `http://127.0.0.1:${port}/mcp`),
  resolveRemoteMcpUrlAsync: vi.fn(async () => "http://192.168.0.118:4510/api/v1/hermes/mcp"),
}));

vi.mock("../src/main/mcp-skill-gateway-runtime/mcp-token-provider", () => ({
  getMcpAuthState: vi.fn(() => ({ tokenPresent: true })),
}));

vi.mock("../src/main/mcp-skill-gateway-runtime/mcp-skill-gateway-proxy", () => ({
  getMcpSkillGatewayProxyUrl: vi.fn(() => "http://127.0.0.1:48742/mcp"),
  isMcpSkillGatewayProxyRunning: vi.fn(() => true),
  getMcpProxyRuntimeState: vi.fn(() => ({
    initialized: true,
    toolCount: 10,
    status: "connected" as const,
    upstreamUrl: "http://192.168.0.118:4510/api/v1/hermes/mcp",
  })),
}));

import {
  testMcpSkillGatewayProxy,
  testRemoteMcpSkillGateway,
} from "../src/main/mcp-skill-gateway-runtime/mcp-skill-gateway-health";

describe("testRemoteMcpSkillGateway", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("succeeds when /debug/probe reports connected + initialized + toolCount", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          ok: true,
          status: "connected",
          toolCount: 10,
          initialized: true,
        }),
      })),
    );

    const result = await testRemoteMcpSkillGateway();
    expect(result.ok).toBe(true);
    expect(result.toolCount).toBe(10);
    expect(fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:48742/debug/probe",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("fails when probe ok but not initialized", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          ok: true,
          status: "connected",
          toolCount: 10,
          initialized: false,
        }),
      })),
    );

    const result = await testRemoteMcpSkillGateway();
    expect(result.ok).toBe(false);
    expect(result.error).toContain("not initialized");
  });
});

describe("testMcpSkillGatewayProxy", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("treats missing /health as running proxy (404 fallback)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 404,
        json: async () => ({ error: "not_found" }),
      })),
    );

    const result = await testMcpSkillGatewayProxy();
    expect(result.ok).toBe(true);
    expect(result.status).toBe("connected");
  });
});
