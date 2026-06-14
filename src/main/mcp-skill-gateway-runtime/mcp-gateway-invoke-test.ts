import type {
  McpGatewayInvokeTestInput,
  McpGatewayInvokeTestResult,
} from "../../shared/mcp-skill-gateway-runtime/mcp-skill-gateway-runtime-contract";
import {
  getMcpSkillGatewayProxyUrl,
  isMcpSkillGatewayProxyRunning,
} from "./mcp-skill-gateway-proxy";
import { getMcpAuthState } from "./mcp-token-provider";
import { isReadOnlyMcpTool } from "./mcp-tools-cache";
import { writeMcpSkillGatewayLog } from "./mcp-skill-gateway-log";

export async function invokeRemoteMcpTool(
  input: McpGatewayInvokeTestInput,
): Promise<McpGatewayInvokeTestResult> {
  const started = Date.now();
  const toolName = input.toolName?.trim();
  const toolInput = input.input ?? {};

  if (!toolName) {
    return {
      ok: false,
      durationMs: Date.now() - started,
      errorCode: "MCP_DIAG_TOOL_CALL_FAILED",
      errorMessage: "toolName is required",
    };
  }

  if (!getMcpAuthState().tokenPresent) {
    return {
      ok: false,
      durationMs: Date.now() - started,
      errorCode: "MCP_GATEWAY_NOT_LOGGED_IN",
      errorMessage: "Desktop login required",
    };
  }

  if (!isMcpSkillGatewayProxyRunning()) {
    return {
      ok: false,
      durationMs: Date.now() - started,
      errorCode: "MCP_GATEWAY_PROXY_NOT_RUNNING",
      errorMessage: "Local MCP proxy is not running",
    };
  }

  if (!isReadOnlyMcpTool(toolName)) {
    writeMcpSkillGatewayLog({
      time: new Date().toISOString(),
      level: "warn",
      method: "tools/call",
      message: `Invoke test blocked non-read tool: ${toolName}`,
    });
    return {
      ok: false,
      durationMs: Date.now() - started,
      errorCode: "MCP_DIAG_TOOL_CALL_FAILED",
      errorMessage: `Invoke test only allows read-only tools in v6.6: ${toolName}`,
    };
  }

  try {
    const proxyUrl = getMcpSkillGatewayProxyUrl();
    const res = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: {
          name: toolName,
          arguments: toolInput,
        },
      }),
    });

    const body = (await res.json()) as {
      result?: unknown;
      error?: { code?: number; message?: string };
    };
    const durationMs = Date.now() - started;

    if (!res.ok || body.error) {
      writeMcpSkillGatewayLog({
        time: new Date().toISOString(),
        level: "error",
        method: "tools/call",
        durationMs,
        errorCode: "MCP_DIAG_TOOL_CALL_FAILED",
        message: body.error?.message ?? `tools/call failed (${res.status})`,
      });
      return {
        ok: false,
        durationMs,
        errorCode: "MCP_DIAG_TOOL_CALL_FAILED",
        errorMessage: body.error?.message ?? `tools/call failed (${res.status})`,
      };
    }

    writeMcpSkillGatewayLog({
      time: new Date().toISOString(),
      level: "info",
      method: "tools/call",
      durationMs,
      message: `Invoke test ok: ${toolName}`,
    });

    return {
      ok: true,
      durationMs,
      result: body.result,
    };
  } catch (err) {
    const durationMs = Date.now() - started;
    const message = err instanceof Error ? err.message : String(err);
    writeMcpSkillGatewayLog({
      time: new Date().toISOString(),
      level: "error",
      method: "tools/call",
      durationMs,
      errorCode: "MCP_DIAG_TOOL_CALL_FAILED",
      message,
    });
    return {
      ok: false,
      durationMs,
      errorCode: "MCP_DIAG_TOOL_CALL_FAILED",
      errorMessage: message,
    };
  }
}
