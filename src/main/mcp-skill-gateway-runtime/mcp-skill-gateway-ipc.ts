import { ipcMain } from "electron";
import type {
  McpSkillGatewayActionResult,
  McpSkillGatewayRuntimeConfig,
} from "../../shared/mcp-skill-gateway-runtime/mcp-skill-gateway-runtime-contract";
import { restartGateway } from "../hermes";
import { readStoredSession } from "../auth/token-store";
import {
  getMcpSkillGatewayConfig,
  saveMcpSkillGatewayConfig,
} from "./mcp-skill-gateway-config";
import {
  restartMcpSkillGatewayProxy,
  refreshMcpSkillGatewayProxyConfigFull,
  startMcpSkillGatewayProxy,
  stopMcpSkillGatewayProxy,
} from "./mcp-skill-gateway-proxy";
import {
  listMcpSkillGatewayProfileRegistrations,
  registerMcpSkillGatewayToHermes,
  unregisterMcpSkillGatewayFromHermes,
} from "./mcp-skill-gateway-register";
import {
  testMcpSkillGatewayProxy,
  testRemoteMcpSkillGateway,
} from "./mcp-skill-gateway-health";
import { readMcpSkillGatewayLogs } from "./mcp-skill-gateway-log";
import {
  buildMcpSkillGatewayRuntimeStatus,
  onMcpSkillGatewayLoginSuccess,
  onMcpSkillGatewayLogout,
} from "./mcp-skill-gateway-lifecycle";
import { isMcpSkillGatewayError, McpSkillGatewayError } from "./mcp-skill-gateway-errors";

function toActionResult(err: unknown): McpSkillGatewayActionResult {
  if (isMcpSkillGatewayError(err)) {
    return { ok: false, error: err.message, errorCode: err.code };
  }
  return {
    ok: false,
    error: err instanceof Error ? err.message : String(err),
    errorCode: "MCP_GATEWAY_PROXY_START_FAILED",
  };
}

async function requireLoggedIn(): Promise<void> {
  const session = await readStoredSession();
  if (!session?.accessToken) {
    throw new McpSkillGatewayError(
      "MCP_GATEWAY_NOT_LOGGED_IN",
      "Desktop login required",
    );
  }
}

export function registerMcpSkillGatewayRuntimeIpc(): void {
  ipcMain.handle("mcp-skill-gateway-runtime:get-status", async () =>
    buildMcpSkillGatewayRuntimeStatus(),
  );

  ipcMain.handle("mcp-skill-gateway-runtime:get-config", async () =>
    getMcpSkillGatewayConfig(),
  );

  ipcMain.handle(
    "mcp-skill-gateway-runtime:save-config",
    async (_, patch: Partial<McpSkillGatewayRuntimeConfig>) =>
      saveMcpSkillGatewayConfig(patch),
  );

  ipcMain.handle("mcp-skill-gateway-runtime:start-proxy", async () => {
    try {
      await requireLoggedIn();
      const config = getMcpSkillGatewayConfig();
      await startMcpSkillGatewayProxy(config.localProxyPort);
      return { ok: true } satisfies McpSkillGatewayActionResult;
    } catch (err) {
      return toActionResult(err);
    }
  });

  ipcMain.handle("mcp-skill-gateway-runtime:stop-proxy", async () => {
    stopMcpSkillGatewayProxy();
    return { ok: true } satisfies McpSkillGatewayActionResult;
  });

  ipcMain.handle("mcp-skill-gateway-runtime:restart-proxy", async () => {
    try {
      await requireLoggedIn();
      await restartMcpSkillGatewayProxy();
      await refreshMcpSkillGatewayProxyConfigFull();
      return { ok: true } satisfies McpSkillGatewayActionResult;
    } catch (err) {
      return toActionResult(err);
    }
  });

  ipcMain.handle("mcp-skill-gateway-runtime:test-proxy", async () =>
    testMcpSkillGatewayProxy(),
  );

  ipcMain.handle("mcp-skill-gateway-runtime:test-remote-mcp", async () =>
    testRemoteMcpSkillGateway(),
  );

  ipcMain.handle(
    "mcp-skill-gateway-runtime:register-to-profile",
    async (_, profile: string) => {
      try {
        await requireLoggedIn();
        const config = getMcpSkillGatewayConfig();
        const result = await registerMcpSkillGatewayToHermes({
          profile: profile || "default",
          localProxyPort: config.localProxyPort,
          enabled: true,
        });

        if (result.ok) {
          const profiles = new Set(config.registeredProfiles);
          profiles.add(profile || "default");
          saveMcpSkillGatewayConfig({ registeredProfiles: [...profiles] });
          if (result.changed && config.autoRestartHermesGateway) {
            await restartGateway();
          }
        }

        return result;
      } catch (err) {
        if (isMcpSkillGatewayError(err)) {
          return {
            ok: false,
            changed: false,
            configPath: "",
            profile: profile || "default",
            url: "",
            error: err.message,
            errorCode: err.code,
          };
        }
        throw err;
      }
    },
  );

  ipcMain.handle(
    "mcp-skill-gateway-runtime:unregister-from-profile",
    async (_, profile: string) => {
      const config = getMcpSkillGatewayConfig();
      const result = await unregisterMcpSkillGatewayFromHermes(profile || "default");
      if (result.ok && result.changed && config.autoRestartHermesGateway) {
        await restartGateway();
      }
      return result;
    },
  );

  ipcMain.handle("mcp-skill-gateway-runtime:list-profile-registrations", async () =>
    listMcpSkillGatewayProfileRegistrations(),
  );

  ipcMain.handle("mcp-skill-gateway-runtime:read-proxy-logs", async (_, lines?: number) =>
    readMcpSkillGatewayLogs(lines),
  );
}

export { onMcpSkillGatewayLoginSuccess, onMcpSkillGatewayLogout };
