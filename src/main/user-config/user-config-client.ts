import { randomBytes } from "crypto";
import { getAiOsEnvConfig } from "../aios/aios-config";
import type { DesktopBootstrapConfig } from "../../shared/user-config/user-config-contract";
import { readBootstrapState } from "./user-config-store";

let mockLoginCount = 0;

function useMockUserConfig(): boolean {
  if (process.env.HERMES_USE_MOCK_USER_CONFIG === "false") {
    return false;
  }
  if (process.env.HERMES_USE_MOCK_USER_CONFIG === "true") {
    return true;
  }
  return process.env.HERMES_USE_MOCK_AUTH !== "false";
}

function buildMockConfig(versionSuffix: string): DesktopBootstrapConfig {
  const config = getAiOsEnvConfig();
  return {
    schemaVersion: 1,
    configVersion: `mock-v1-${versionSuffix}`,
    configHash: `mock-hash-${versionSuffix}`,
    user: {
      userId: "mock-user-1",
      username: "mock",
      displayName: "Mock User",
      tenantId: "default-tenant",
    },
    features: {
      aiosHome: true,
      aiosWorkspace: true,
      webOperator: true,
      office: true,
      hermesRuntimeDrawer: true,
    },
    hermes: {
      activeProfile: "default",
      connection: { mode: "local" },
      profiles: [
        {
          name: "default",
          enabled: true,
          env: { OPENAI_API_KEY: "mock-key-placeholder" },
        },
      ],
      models: [
        {
          name: "default",
          provider: "openai",
          model: "gpt-4o-mini",
          baseUrl: "https://api.openai.com/v1",
        },
      ],
      toolsets: {},
      platforms: {},
    },
    aios: {
      frontendUrl: `http://127.0.0.1:${config.frontendPort}`,
      backendUrl: `http://127.0.0.1:${config.backendPort}`,
      autoStart: true,
    },
  };
}

export async function fetchRemoteBootstrapConfig(
  accessToken?: string,
): Promise<DesktopBootstrapConfig> {
  if (useMockUserConfig()) {
    mockLoginCount += 1;
    const state = readBootstrapState();
    const suffix = state.initialized ? String(mockLoginCount) : "initial";
    return buildMockConfig(suffix);
  }

  const config = getAiOsEnvConfig();
  const res = await fetch(
    `http://127.0.0.1:${config.backendPort}/api/v1/desktop/bootstrap`,
    {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
  );
  if (!res.ok) {
    throw new Error(`Bootstrap fetch failed: ${res.status}`);
  }
  return (await res.json()) as DesktopBootstrapConfig;
}

const pendingApply = new Map<string, DesktopBootstrapConfig>();

export function stashPendingConfig(config: DesktopBootstrapConfig): string {
  const token = randomBytes(16).toString("hex");
  pendingApply.set(token, config);
  return token;
}

export function takePendingConfig(token: string): DesktopBootstrapConfig | null {
  const config = pendingApply.get(token) ?? null;
  pendingApply.delete(token);
  return config;
}
