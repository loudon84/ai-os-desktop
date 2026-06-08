import { getCachedAccessToken } from "../auth/token-store";
import type {
  McpGatewayRemoteTestResult,
  McpSkillGatewayHealthResult,
} from "../../shared/mcp-skill-gateway-runtime/mcp-skill-gateway-runtime-contract";
import {
  getMcpSkillGatewayConfig,
  resolveBackendBaseUrl,
  resolveLocalMcpUrl,
  resolveRemoteMcpUrl,
} from "./mcp-skill-gateway-config";
import {
  getMcpSkillGatewayProxyUrl,
  isMcpSkillGatewayProxyRunning,
} from "./mcp-skill-gateway-proxy";

export async function testMcpSkillGatewayProxy(): Promise<McpSkillGatewayHealthResult> {
  const config = getMcpSkillGatewayConfig();
  const backendBaseUrl = resolveBackendBaseUrl();
  const remoteMcpUrl = resolveRemoteMcpUrl();
  const localMcpUrl = resolveLocalMcpUrl(config.localProxyPort);

  if (!isMcpSkillGatewayProxyRunning()) {
    return {
      ok: false,
      service: "mcp-skill-gateway-proxy",
      status: "stopped",
      loggedIn: Boolean(getCachedAccessToken()),
      backendBaseUrl,
      remoteMcpUrl,
      localMcpUrl,
      target: config.mcpEndpointPath,
      error: "Proxy is not running",
      errorCode: "MCP_GATEWAY_PROXY_NOT_RUNNING",
    };
  }

  try {
    const res = await fetch(`${getMcpSkillGatewayProxyUrl().replace(/\/mcp$/, "")}/health`);
    const body = (await res.json()) as {
      ok?: boolean;
      status?: string;
      loggedIn?: boolean;
      backendBaseUrl?: string;
      remoteMcpUrl?: string;
      localMcpUrl?: string;
      target?: string;
    };
    return {
      ok: res.ok && body.ok !== false,
      service: "mcp-skill-gateway-proxy",
      status: body.status ?? "running",
      loggedIn: Boolean(body.loggedIn),
      backendBaseUrl: body.backendBaseUrl || backendBaseUrl,
      remoteMcpUrl: body.remoteMcpUrl || remoteMcpUrl,
      localMcpUrl: body.localMcpUrl || localMcpUrl,
      target: body.target || config.mcpEndpointPath,
      error: res.ok ? undefined : `Health check failed (${res.status})`,
    };
  } catch (err) {
    return {
      ok: false,
      service: "mcp-skill-gateway-proxy",
      status: "failed",
      loggedIn: Boolean(getCachedAccessToken()),
      backendBaseUrl,
      remoteMcpUrl,
      localMcpUrl,
      target: config.mcpEndpointPath,
      error: err instanceof Error ? err.message : String(err),
      errorCode: "MCP_GATEWAY_PROXY_START_FAILED",
    };
  }
}

export async function testRemoteMcpSkillGateway(): Promise<McpGatewayRemoteTestResult> {
  const config = getMcpSkillGatewayConfig();
  const backendBaseUrl = resolveBackendBaseUrl();
  const remoteMcpUrl = resolveRemoteMcpUrl();
  const localProxyUrl = resolveLocalMcpUrl(config.localProxyPort);

  if (!getCachedAccessToken()) {
    return {
      ok: false,
      localProxyUrl,
      backendBaseUrl,
      remoteMcpUrl,
      error: "Desktop login required",
      errorCode: "MCP_GATEWAY_NOT_LOGGED_IN",
    };
  }

  if (!backendBaseUrl) {
    return {
      ok: false,
      localProxyUrl,
      backendBaseUrl: "",
      remoteMcpUrl: "",
      error: "Backend endpoint not configured",
      errorCode: "MCP_GATEWAY_BACKEND_NOT_CONFIGURED",
    };
  }

  if (!isMcpSkillGatewayProxyRunning()) {
    return {
      ok: false,
      localProxyUrl,
      backendBaseUrl,
      remoteMcpUrl,
      error: "Proxy is not running",
      errorCode: "MCP_GATEWAY_PROXY_NOT_RUNNING",
    };
  }

  try {
    const res = await fetch(localProxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "desktop-test-tools-list",
        method: "tools/list",
        params: {},
      }),
    });

    const body = (await res.json()) as {
      result?: { tools?: unknown[] };
      error?: { code?: number; message?: string };
    };

    if (body.error) {
      return {
        ok: false,
        localProxyUrl,
        backendBaseUrl,
        remoteMcpUrl,
        jsonrpcErrorCode: body.error.code,
        error: body.error.message ?? "Remote MCP request failed",
        errorCode:
          body.error.code === -32013
            ? "MCP_GATEWAY_REMOTE_UNAUTHORIZED"
            : "MCP_GATEWAY_REMOTE_UNREACHABLE",
      };
    }

    const toolCount = Array.isArray(body.result?.tools) ? body.result.tools.length : undefined;
    return {
      ok: res.ok,
      localProxyUrl,
      backendBaseUrl,
      remoteMcpUrl,
      toolCount,
      error: res.ok ? undefined : `Remote MCP check failed (${res.status})`,
      errorCode: res.ok ? undefined : "MCP_GATEWAY_REMOTE_UNREACHABLE",
    };
  } catch (err) {
    return {
      ok: false,
      localProxyUrl,
      backendBaseUrl,
      remoteMcpUrl,
      error: err instanceof Error ? err.message : String(err),
      errorCode: "MCP_GATEWAY_REMOTE_UNREACHABLE",
    };
  }
}
