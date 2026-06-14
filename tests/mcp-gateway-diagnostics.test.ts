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
  testMcpSkillGatewayProxy: vi.fn(async () => ({
    ok: true,
    backendBaseUrl: "http://192.168.0.118:4510",
    localMcpUrl: "http://127.0.0.1:48742/mcp",
  })),
  testRemoteMcpSkillGateway: vi.fn(async () => ({
    ok: true,
    toolCount: 3,
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
  {
    name: "hermes.instance.status",
    description: "",
    category: "hermes" as const,
    permission: "read" as const,
    riskLevel: "low" as const,
    inputSchema: {},
    enabled: true,
    source: "nodeskclaw" as const,
    lastSyncedAt: "2026-06-14T00:00:00.000Z",
  },
  {
    name: "hermes.skills.list",
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
}));

vi.mock("../src/main/hermes", () => ({
  isGatewayRunning: vi.fn(() => true),
}));

import { getMcpAuthState } from "../src/main/mcp-skill-gateway-runtime/mcp-token-provider";
import { runMcpSkillGatewayDiagnostics } from "../src/main/mcp-skill-gateway-runtime/mcp-gateway-diagnostics";

describe("runMcpSkillGatewayDiagnostics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMcpAuthState).mockReturnValue({ tokenPresent: true });
  });

  it("returns ok when all steps pass", async () => {
    const result = await runMcpSkillGatewayDiagnostics();
    expect(result.ok).toBe(true);
    expect(result.checkedAt).toBeTruthy();
    expect(result.toolCount).toBe(3);
    expect(result.tools).toHaveLength(3);
    expect(result.defaultProfileRegistered).toBe(true);
    expect(result.toolsList.ok).toBe(true);
    expect(result.hermesGateway.ok).toBe(true);
    expect(result.steps.length).toBeGreaterThanOrEqual(7);
  });

  it("fails fast on missing auth", async () => {
    vi.mocked(getMcpAuthState).mockReturnValue({ tokenPresent: false });
    const result = await runMcpSkillGatewayDiagnostics();
    expect(result.ok).toBe(false);
    expect(result.auth.ok).toBe(false);
    expect(result.errors.some((e) => e.code === "MCP_OP_AUTH_REQUIRED")).toBe(true);
  });
});
