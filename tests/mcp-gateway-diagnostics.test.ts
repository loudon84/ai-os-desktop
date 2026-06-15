import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../src/main/mcp-skill-gateway-runtime/mcp-backend-descriptor", () => ({
  fetchMcpBackendDescriptor: vi.fn(async () => ({
    ok: true,
    descriptor: {
      upstreamUrl: "http://192.168.0.118:4510/api/v1/hermes/mcp",
      protocolVersion: "2025-06-18",
      healthEndpoint: "/api/v1/mcp/health",
    },
  })),
}));

vi.mock("../src/main/mcp-skill-gateway-runtime/mcp-skill-gateway-config", () => ({
  getMcpSkillGatewayConfig: vi.fn(() => ({
    localProxyPort: 48742,
    registeredProfiles: ["default"],
  })),
  resolveBackendBaseUrl: vi.fn(() => "http://192.168.0.118:4510"),
}));

vi.mock("../src/main/mcp-skill-gateway-runtime/mcp-token-provider", () => ({
  getMcpAuthState: vi.fn(() => ({ tokenPresent: true })),
}));

vi.mock("../src/main/mcp-skill-gateway-runtime/mcp-skill-gateway-proxy", () => ({
  isMcpSkillGatewayProxyRunning: vi.fn(() => true),
  startMcpSkillGatewayProxy: vi.fn(async () => undefined),
}));

vi.mock("../src/main/mcp-skill-gateway-runtime/mcp-skill-gateway-health", () => ({
  testRemoteMcpSkillGateway: vi.fn(async () => ({
    ok: true,
    toolCount: 10,
    localProxyUrl: "http://127.0.0.1:48742/mcp",
    backendBaseUrl: "http://192.168.0.118:4510",
    remoteMcpUrl: "http://192.168.0.118:4510/api/v1/hermes/mcp",
  })),
}));

vi.mock("../src/main/mcp-skill-gateway-runtime/mcp-skill-gateway-register", () => ({
  registerMcpSkillGatewayToHermes: vi.fn(async () => ({
    ok: true,
    ready: true,
    hermesRestartRequired: false,
  })),
  listMcpSkillGatewayProfileRegistrations: vi.fn(() => [
    {
      profile: "default",
      registered: true,
      ready: true,
      url: "http://127.0.0.1:48742/mcp",
    },
  ]),
}));

const mockTools = [
  {
    name: "hermes.instances.list",
    description: "",
    category: "hermes" as const,
    permission: "read" as const,
    riskLevel: "low" as const,
    inputSchema: {},
    enabled: true,
    source: "nodeskclaw" as const,
    lastSyncedAt: "2026-06-14T00:00:00.000Z",
  },
];

vi.mock("../src/main/mcp-skill-gateway-runtime/mcp-tools-cache", () => ({
  listRemoteMcpTools: vi.fn(async () => mockTools),
  readMcpGatewayToolsCache: vi.fn(() => null),
}));

vi.mock("../src/main/hermes", () => ({
  isGatewayRunning: vi.fn(() => true),
}));

import { getMcpAuthState } from "../src/main/mcp-skill-gateway-runtime/mcp-token-provider";
import { testRemoteMcpSkillGateway } from "../src/main/mcp-skill-gateway-runtime/mcp-skill-gateway-health";
import { listRemoteMcpTools } from "../src/main/mcp-skill-gateway-runtime/mcp-tools-cache";
import { runMcpSkillGatewayDiagnostics } from "../src/main/mcp-skill-gateway-runtime/mcp-gateway-diagnostics";

describe("runMcpSkillGatewayDiagnostics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMcpAuthState).mockReturnValue({ tokenPresent: true });
    vi.mocked(testRemoteMcpSkillGateway).mockResolvedValue({
      ok: true,
      toolCount: 10,
      localProxyUrl: "http://127.0.0.1:48742/mcp",
      backendBaseUrl: "http://192.168.0.118:4510",
      remoteMcpUrl: "http://192.168.0.118:4510/api/v1/hermes/mcp",
    });
  });

  it("returns ok when probe reports connected with tools", async () => {
    const result = await runMcpSkillGatewayDiagnostics();
    expect(result.ok).toBe(true);
    expect(result.checkedAt).toBeTruthy();
    expect(result.toolCount).toBe(10);
    expect(result.remoteMcp.ok).toBe(true);
    expect(result.toolsList.ok).toBe(true);
    expect(result.localProxy.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(result.steps.every((row) => row.ok));
    expect(testRemoteMcpSkillGateway).toHaveBeenCalledTimes(1);
  });

  it("uses probe toolCount even when tools cache fetch fails", async () => {
    vi.mocked(listRemoteMcpTools).mockRejectedValueOnce(new Error("tools/list failed"));
    const result = await runMcpSkillGatewayDiagnostics();
    expect(result.ok).toBe(true);
    expect(result.toolCount).toBe(10);
    expect(result.toolsList.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("does not keep localProxy errors when proxy is running", async () => {
    const result = await runMcpSkillGatewayDiagnostics();
    expect(result.localProxy.ok).toBe(true);
    expect(result.errors.some((e) => e.step === "localProxy")).toBe(false);
  });

  it("fails remoteMcp and toolsList when probe is not connected", async () => {
    vi.mocked(testRemoteMcpSkillGateway).mockResolvedValueOnce({
      ok: false,
      toolCount: 0,
      localProxyUrl: "http://127.0.0.1:48742/mcp",
      backendBaseUrl: "http://192.168.0.118:4510",
      remoteMcpUrl: "http://192.168.0.118:4510/api/v1/hermes/mcp",
      error: "Invalid JSON-RPC request",
    });
    const result = await runMcpSkillGatewayDiagnostics();
    expect(result.ok).toBe(false);
    expect(result.remoteMcp.ok).toBe(false);
    expect(result.toolsList.ok).toBe(false);
    expect(result.toolCount).toBe(0);
    expect(result.errors.some((e) => e.step === "remoteMcp")).toBe(true);
  });

  it("fails fast on missing auth", async () => {
    vi.mocked(getMcpAuthState).mockReturnValue({ tokenPresent: false });
    const result = await runMcpSkillGatewayDiagnostics();
    expect(result.ok).toBe(false);
    expect(result.auth.ok).toBe(false);
    expect(result.errors.some((e) => e.code === "MCP_OP_AUTH_REQUIRED")).toBe(true);
    expect(testRemoteMcpSkillGateway).not.toHaveBeenCalled();
  });
});
