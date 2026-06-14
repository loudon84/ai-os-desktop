import { describe, it, expect, beforeEach, vi } from "vitest";

const mockFetch = vi.fn();

vi.mock("../src/main/mcp-skill-gateway-runtime/mcp-token-provider", () => ({
  getMcpAuthState: vi.fn(() => ({ tokenPresent: true })),
}));

vi.mock("../src/main/mcp-skill-gateway-runtime/mcp-skill-gateway-proxy", () => ({
  getMcpSkillGatewayProxyUrl: vi.fn(() => "http://127.0.0.1:48742/mcp"),
  isMcpSkillGatewayProxyRunning: vi.fn(() => true),
}));

vi.mock("../src/main/mcp-skill-gateway-runtime/mcp-skill-gateway-log", () => ({
  writeMcpSkillGatewayLog: vi.fn(),
}));

vi.mock("../src/main/mcp-skill-gateway-runtime/mcp-tools-cache", () => ({
  isReadOnlyMcpTool: vi.fn((name: string) =>
    ["hermes.instances.list", "hermes.instance.status", "hermes.skills.list"].includes(name),
  ),
}));

import { invokeRemoteMcpTool } from "../src/main/mcp-skill-gateway-runtime/mcp-gateway-invoke-test";
import { isReadOnlyMcpTool } from "../src/main/mcp-skill-gateway-runtime/mcp-tools-cache";

describe("invokeRemoteMcpTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mockFetch);
  });

  it("blocks non-read tools", async () => {
    vi.mocked(isReadOnlyMcpTool).mockReturnValue(false);
    const result = await invokeRemoteMcpTool({
      toolName: "hermes.skills.install_builtin",
      input: {},
    });
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe("MCP_DIAG_TOOL_CALL_FAILED");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("calls proxy for read-only tool", async () => {
    vi.mocked(isReadOnlyMcpTool).mockReturnValue(true);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ result: { skills: [] } }),
    } as Response);

    const result = await invokeRemoteMcpTool({
      toolName: "hermes.skills.list",
      input: { instance_ref: "zhang-zhen" },
    });

    expect(result.ok).toBe(true);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://127.0.0.1:48742/mcp",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
