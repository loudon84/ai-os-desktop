import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createServer } from "http";
import { existsSync, mkdirSync, rmSync } from "fs";

const { TEST_USER_DATA } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("path");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const os = require("os");
  return {
    TEST_USER_DATA: path.join(os.tmpdir(), `mcp-skill-gateway-proxy-${Date.now()}`),
  };
});

vi.mock("electron", () => ({
  app: {
    getPath: (name: string) => {
      if (name === "userData") return TEST_USER_DATA;
      return "/tmp";
    },
  },
}));

vi.mock("../src/main/auth/auth-endpoint-config-store", () => ({
  readAuthEndpointConfig: () => ({
    backendUrl: "http://192.168.0.118:4510",
    authPrefix: "/api/v1/auth",
    aiosHomeUrl: "http://192.168.0.118:4517",
  }),
}));

vi.mock("../src/main/auth/token-store", () => ({
  getCachedAccessToken: vi.fn(() => null as string | null),
}));

import { getCachedAccessToken } from "../src/main/auth/token-store";
import {
  MCP_SKILL_GATEWAY_JSONRPC_ERRORS,
} from "../src/shared/mcp-skill-gateway-runtime/mcp-skill-gateway-runtime-contract";
import {
  startMcpSkillGatewayProxy,
  stopMcpSkillGatewayProxy,
} from "../src/main/mcp-skill-gateway-runtime/mcp-skill-gateway-proxy";

beforeEach(() => {
  mkdirSync(TEST_USER_DATA, { recursive: true });
  stopMcpSkillGatewayProxy();
  vi.mocked(getCachedAccessToken).mockReturnValue(null);
});

afterEach(() => {
  stopMcpSkillGatewayProxy();
  if (existsSync(TEST_USER_DATA)) {
    rmSync(TEST_USER_DATA, { recursive: true, force: true });
  }
});

describe("mcp-skill-gateway proxy", () => {
  it("returns health with backend and remote MCP URLs", async () => {
    await startMcpSkillGatewayProxy(48799);

    const res = await fetch("http://127.0.0.1:48799/health");
    const body = (await res.json()) as {
      backendBaseUrl?: string;
      remoteMcpUrl?: string;
      localMcpUrl?: string;
      loggedIn?: boolean;
    };

    expect(body.backendBaseUrl).toBe("http://192.168.0.118:4510");
    expect(body.remoteMcpUrl).toBe("http://192.168.0.118:4510/api/v1/hermes/mcp");
    expect(body.localMcpUrl).toBe("http://127.0.0.1:48799/mcp");
    expect(body.loggedIn).toBe(false);
  });

  it("returns -32010 when desktop is not logged in", async () => {
    await startMcpSkillGatewayProxy(48799);

    const res = await fetch("http://127.0.0.1:48799/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
        params: {},
      }),
    });

    const body = (await res.json()) as { error?: { code?: number; message?: string } };
    expect(body.error?.code).toBe(MCP_SKILL_GATEWAY_JSONRPC_ERRORS.NOT_LOGGED_IN);
    expect(body.error?.message).toBe("Desktop login required");
  });

  it("reports MCP_GATEWAY_PROXY_PORT_IN_USE when port is occupied", async () => {
    const blocker = await new Promise<ReturnType<typeof createServer>>((resolve) => {
      const s = createServer();
      s.listen(48800, "127.0.0.1", () => resolve(s));
    });

    try {
      await expect(startMcpSkillGatewayProxy(48800)).rejects.toMatchObject({
        code: "MCP_GATEWAY_PROXY_PORT_IN_USE",
      });
    } finally {
      await new Promise<void>((resolve) => blocker.close(() => resolve()));
    }
  });
});
