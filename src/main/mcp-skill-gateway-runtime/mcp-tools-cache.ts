import { existsSync, readFileSync } from "fs";
import { join } from "path";
import type { McpGatewayToolPreview } from "../../shared/mcp-skill-gateway-runtime/mcp-skill-gateway-runtime-contract";
import { profileHome } from "../utils";
import { safeWriteFile } from "../utils";
import {
  getMcpSkillGatewayConfig,
  resolveBackendBaseUrl,
  resolveRemoteMcpUrlAsync,
} from "./mcp-skill-gateway-config";
import {
  getMcpSkillGatewayProxyUrl,
  isMcpSkillGatewayProxyRunning,
} from "./mcp-skill-gateway-proxy";
import { getMcpAuthState } from "./mcp-token-provider";
import { McpSkillGatewayError } from "./mcp-skill-gateway-errors";

const CACHE_VERSION = "v6.6";
const STALE_AFTER_MS = 60_000;

const READ_ONLY_TOOLS = new Set([
  "hermes.instances.list",
  "hermes.instance.status",
  "hermes.skills.list",
]);

const WRITE_TOOLS = new Set([
  "hermes.skills.install_builtin",
  "hermes.skills.install_zip",
  "hermes.skills.install_git",
  "hermes.skills.uninstall",
]);

const ADMIN_TOOLS = new Set(["hermes.instance.restart", "hermes.instance.rebind"]);

export interface McpGatewayToolsCacheFile {
  version: string;
  backendBaseUrl: string;
  remoteMcpUrl: string;
  tools: McpGatewayToolPreview[];
  updatedAt: string;
}

/** @deprecated use McpGatewayToolsCacheFile */
export interface McpToolsCacheEntry {
  name: string;
  description?: string;
  inputSchema?: unknown;
}

/** @deprecated use McpGatewayToolsCacheFile */
export interface McpToolsCacheFile {
  version: string;
  lastSyncAt: string;
  server: {
    name: string;
    transport: "streamable_http";
    upstreamUrl: string;
  };
  tools: McpToolsCacheEntry[];
}

function cachePath(): string {
  return join(profileHome(), "desktop", "mcp-skill-gateway-tools.json");
}

function legacyCachePath(): string {
  return join(profileHome(), "desktop", "mcp-tools-cache.json");
}

function inferRiskLevel(toolName: string): McpGatewayToolPreview["riskLevel"] {
  if (READ_ONLY_TOOLS.has(toolName)) return "read";
  if (ADMIN_TOOLS.has(toolName)) return "admin";
  if (WRITE_TOOLS.has(toolName) || toolName.startsWith("hermes.skills.install")) {
    return "write";
  }
  return "read";
}

function mapRawTool(raw: Record<string, unknown>): McpGatewayToolPreview {
  const name = typeof raw.name === "string" ? raw.name : "";
  return {
    name,
    description: typeof raw.description === "string" ? raw.description : undefined,
    inputSchema: raw.inputSchema,
    source: "nodeskclaw",
    riskLevel: inferRiskLevel(name),
    enabled: true,
  };
}

export function readMcpGatewayToolsCache(): McpGatewayToolsCacheFile | null {
  const path = cachePath();
  if (existsSync(path)) {
    try {
      return JSON.parse(readFileSync(path, "utf-8")) as McpGatewayToolsCacheFile;
    } catch {
      return null;
    }
  }
  const legacy = legacyCachePath();
  if (!existsSync(legacy)) return null;
  try {
    const old = JSON.parse(readFileSync(legacy, "utf-8")) as McpToolsCacheFile;
    return {
      version: CACHE_VERSION,
      backendBaseUrl: resolveBackendBaseUrl(),
      remoteMcpUrl: old.server?.upstreamUrl ?? "",
      tools: (old.tools ?? []).map((t) => mapRawTool(t as unknown as Record<string, unknown>)),
      updatedAt: old.lastSyncAt ?? "",
    };
  } catch {
    return null;
  }
}

export function writeMcpGatewayToolsCache(
  payload: Omit<McpGatewayToolsCacheFile, "version">,
): McpGatewayToolsCacheFile {
  const file: McpGatewayToolsCacheFile = {
    version: CACHE_VERSION,
    ...payload,
  };
  safeWriteFile(cachePath(), JSON.stringify(file, null, 2));
  return file;
}

export function isMcpGatewayToolsCacheStale(cache: McpGatewayToolsCacheFile | null): boolean {
  if (!cache?.updatedAt) return true;
  const ts = Date.parse(cache.updatedAt);
  if (Number.isNaN(ts)) return true;
  return Date.now() - ts > STALE_AFTER_MS;
}

/** @deprecated use readMcpGatewayToolsCache */
export function readMcpToolsCache(): McpToolsCacheFile | null {
  const cache = readMcpGatewayToolsCache();
  if (!cache) return null;
  return {
    version: cache.version,
    lastSyncAt: cache.updatedAt,
    server: {
      name: "nodeskclaw-mcp-skill-gateway",
      transport: "streamable_http",
      upstreamUrl: cache.remoteMcpUrl,
    },
    tools: cache.tools,
  };
}

/** @deprecated use writeMcpGatewayToolsCache */
export function writeMcpToolsCache(payload: Omit<McpToolsCacheFile, "version">): McpToolsCacheFile {
  writeMcpGatewayToolsCache({
    backendBaseUrl: resolveBackendBaseUrl(),
    remoteMcpUrl: payload.server.upstreamUrl,
    tools: payload.tools.map((t) => mapRawTool(t as unknown as Record<string, unknown>)),
    updatedAt: payload.lastSyncAt,
  });
  return { version: CACHE_VERSION, ...payload };
}

/** @deprecated use isMcpGatewayToolsCacheStale */
export function isMcpToolsCacheStale(cache: McpToolsCacheFile | null): boolean {
  if (!cache?.lastSyncAt) return true;
  const gatewayCache = readMcpGatewayToolsCache();
  return isMcpGatewayToolsCacheStale(gatewayCache);
}

async function fetchRemoteToolsFromProxy(): Promise<McpGatewayToolPreview[]> {
  if (!getMcpAuthState().tokenPresent) {
    throw new McpSkillGatewayError(
      "MCP_GATEWAY_NOT_LOGGED_IN",
      "Desktop login required",
    );
  }
  if (!isMcpSkillGatewayProxyRunning()) {
    throw new McpSkillGatewayError(
      "MCP_GATEWAY_PROXY_NOT_RUNNING",
      "Local MCP proxy is not running",
    );
  }

  const proxyUrl = getMcpSkillGatewayProxyUrl();
  const res = await fetch(proxyUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/list",
      params: {},
    }),
  });

  const body = (await res.json()) as {
    result?: { tools?: Array<Record<string, unknown>> };
    error?: { message?: string };
  };

  if (!res.ok || body.error) {
    throw new McpSkillGatewayError(
      "MCP_GATEWAY_REMOTE_UNREACHABLE",
      body.error?.message ?? `tools/list failed (${res.status})`,
    );
  }

  const tools = Array.isArray(body.result?.tools) ? body.result.tools : [];
  return tools.map((t) => mapRawTool(t));
}

export async function listRemoteMcpTools(options?: {
  forceRefresh?: boolean;
}): Promise<McpGatewayToolPreview[]> {
  const backendBaseUrl = resolveBackendBaseUrl();
  const remoteMcpUrl = await resolveRemoteMcpUrlAsync();
  const cache = readMcpGatewayToolsCache();

  if (
    !options?.forceRefresh &&
    cache &&
    !isMcpGatewayToolsCacheStale(cache) &&
    cache.backendBaseUrl === backendBaseUrl &&
    cache.remoteMcpUrl === remoteMcpUrl
  ) {
    return cache.tools;
  }

  const tools = await fetchRemoteToolsFromProxy();
  writeMcpGatewayToolsCache({
    backendBaseUrl,
    remoteMcpUrl,
    tools,
    updatedAt: new Date().toISOString(),
  });
  return tools;
}

export function isReadOnlyMcpTool(toolName: string): boolean {
  return inferRiskLevel(toolName) === "read";
}
