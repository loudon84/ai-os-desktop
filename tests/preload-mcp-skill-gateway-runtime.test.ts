import { describe, it, expect } from "vitest";
import { mcpSkillGatewayRuntimeApi } from "../src/preload/mcp-skill-gateway-runtime-api";

describe("mcpSkillGatewayRuntime preload surface", () => {
  it("exposes readStructuredLogs", () => {
    expect(typeof mcpSkillGatewayRuntimeApi.readStructuredLogs).toBe("function");
  });

  it("exposes v6.6 operations methods", () => {
    expect(typeof mcpSkillGatewayRuntimeApi.runDiagnostics).toBe("function");
    expect(typeof mcpSkillGatewayRuntimeApi.listRemoteTools).toBe("function");
    expect(typeof mcpSkillGatewayRuntimeApi.invokeRemoteTool).toBe("function");
  });
});
