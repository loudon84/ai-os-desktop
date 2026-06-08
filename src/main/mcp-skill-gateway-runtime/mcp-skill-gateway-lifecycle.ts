import {
  getCachedAccessToken,
  readStoredSession,
  readStoredSessionSync,
} from "../auth/token-store";
import { restartGateway } from "../hermes";
import {
  getMcpSkillGatewayConfig,
  resolveBackendBaseUrl,
  resolveLocalMcpUrl,
  resolveRemoteMcpUrl,
  saveMcpSkillGatewayConfig,
} from "./mcp-skill-gateway-config";
import {
  getMcpSkillGatewayProxyLastError,
  isMcpSkillGatewayProxyRunning,
  startMcpSkillGatewayProxy,
  stopMcpSkillGatewayProxy,
} from "./mcp-skill-gateway-proxy";
import {
  listMcpSkillGatewayProfileRegistrations,
  registerMcpSkillGatewayToHermes,
} from "./mcp-skill-gateway-register";
import { testMcpSkillGatewayProxy, testRemoteMcpSkillGateway } from "./mcp-skill-gateway-health";
import { isMcpSkillGatewayError } from "./mcp-skill-gateway-errors";

async function ensureRegisteredProfiles(): Promise<void> {
  const config = getMcpSkillGatewayConfig();
  if (!config.autoRegisterToHermes) return;

  for (const profile of config.registeredProfiles) {
    await registerMcpSkillGatewayToHermes({
      profile,
      localProxyPort: config.localProxyPort,
      enabled: true,
    });
  }
}

async function maybeRestartHermesGateway(): Promise<void> {
  const config = getMcpSkillGatewayConfig();
  if (!config.autoRestartHermesGateway) return;
  try {
    await restartGateway();
  } catch (err) {
    console.warn("[MCP-SKILL-GATEWAY] Hermes gateway restart failed:", err);
  }
}

export async function autoStartMcpSkillGatewayIfReady(): Promise<void> {
  const config = getMcpSkillGatewayConfig();
  if (!config.enabled) return;

  const session = await readStoredSession();
  if (!session?.accessToken) return;
  if (!config.autoStartProxy) return;

  try {
    await startMcpSkillGatewayProxy(config.localProxyPort);
    await ensureRegisteredProfiles();
  } catch (err) {
    const message = isMcpSkillGatewayError(err)
      ? `${err.code}: ${err.message}`
      : err instanceof Error
        ? err.message
        : String(err);
    console.warn("[MCP-SKILL-GATEWAY] auto-start failed:", message);
  }
}

export async function onMcpSkillGatewayLoginSuccess(): Promise<void> {
  const config = getMcpSkillGatewayConfig();
  if (!config.enabled) return;

  try {
    if (config.autoStartProxy) {
      await startMcpSkillGatewayProxy(config.localProxyPort);
    }
    await testMcpSkillGatewayProxy();
    await testRemoteMcpSkillGateway();
    if (config.autoRegisterToHermes && config.registeredProfiles.includes("default")) {
      const result = await registerMcpSkillGatewayToHermes({
        profile: "default",
        localProxyPort: config.localProxyPort,
        enabled: true,
      });
      if (result.changed) {
        const nextProfiles = new Set(config.registeredProfiles);
        nextProfiles.add("default");
        saveMcpSkillGatewayConfig({
          registeredProfiles: [...nextProfiles],
        });
        await maybeRestartHermesGateway();
      }
    }
  } catch (err) {
    console.warn("[MCP-SKILL-GATEWAY] login hook failed:", err);
  }
}

export async function onMcpSkillGatewayLogout(): Promise<void> {
  stopMcpSkillGatewayProxy();
}

export function buildMcpSkillGatewayRuntimeStatus() {
  const config = getMcpSkillGatewayConfig();
  const token = getCachedAccessToken();
  const session = readStoredSessionSync();
  const registrations = listMcpSkillGatewayProfileRegistrations();
  const proxyRunning = isMcpSkillGatewayProxyRunning();
  const lastError = getMcpSkillGatewayProxyLastError();
  const backendBaseUrl = resolveBackendBaseUrl();

  return {
    enabled: config.enabled,
    proxyStatus: proxyRunning
      ? ("running" as const)
      : lastError
        ? ("failed" as const)
        : ("stopped" as const),
    loggedIn: Boolean(token),
    userDisplayName:
      session?.user.displayName ?? session?.user.username ?? null,
    backendBaseUrl,
    remoteMcpUrl: resolveRemoteMcpUrl(),
    localProxyUrl: resolveLocalMcpUrl(config.localProxyPort),
    mcpEndpointPath: config.mcpEndpointPath,
    lastError,
    registeredProfileCount: registrations.filter((r) => r.registered && r.enabled).length,
    hermesRestartRequired: false,
  };
}
