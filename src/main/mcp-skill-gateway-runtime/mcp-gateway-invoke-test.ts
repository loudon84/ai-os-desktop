import type {
  McpGatewayInvokeTestInput,
  McpGatewayInvokeTestResult,
} from "../../shared/mcp-skill-gateway-runtime/mcp-gateway-operations-contract";
import {
  getMcpSkillGatewayProxyUrl,
  isMcpSkillGatewayProxyRunning,
} from "./mcp-skill-gateway-proxy";
import { getMcpAuthState } from "./mcp-token-provider";
import { inferToolPermission } from "./mcp-tools-cache";
import { writeMcpSkillGatewayLog } from "./mcp-skill-gateway-log";

const MAX_RESULT_BYTES = 256 * 1024;

function resolveToolArguments(input: McpGatewayInvokeTestInput): {
  ok: true;
  args: Record<string, unknown>;
} | {
  ok: false;
  errorMessage: string;
} {
  const raw = input.arguments ?? input.input;
  if (raw === undefined || raw === null) {
    return { ok: true, args: {} };
  }
  if (typeof raw !== "object" || Array.isArray(raw)) {
    return {
      ok: false,
      errorMessage: "arguments must be a JSON object",
    };
  }
  return { ok: true, args: raw as Record<string, unknown> };
}

function truncateResult(result: unknown): { value: unknown; truncated: boolean } {
  const json = JSON.stringify(result);
  if (json.length <= MAX_RESULT_BYTES) {
    return { value: result, truncated: false };
  }
  const slice = json.slice(0, MAX_RESULT_BYTES);
  return {
    value: { _truncated: true, preview: `${slice}…` },
    truncated: true,
  };
}

export async function invokeRemoteMcpTool(
  input: McpGatewayInvokeTestInput,
): Promise<McpGatewayInvokeTestResult> {
  const started = Date.now();
  const toolName = input.toolName?.trim();

  if (!toolName) {
    return {
      ok: false,
      toolName: "",
      permission: "read",
      durationMs: Date.now() - started,
      errorCode: "MCP_OP_TOOL_CALL_FAILED",
      errorMessage: "toolName is required",
    };
  }

  const permission = inferToolPermission(toolName);
  const resolvedArgs = resolveToolArguments(input);
  if (!resolvedArgs.ok) {
    return {
      ok: false,
      toolName,
      permission,
      durationMs: Date.now() - started,
      errorCode: "MCP_OP_INVALID_JSON_ARGUMENTS",
      errorMessage: resolvedArgs.errorMessage,
    };
  }

  if (!getMcpAuthState().tokenPresent) {
    return {
      ok: false,
      toolName,
      permission,
      durationMs: Date.now() - started,
      errorCode: "MCP_OP_AUTH_REQUIRED",
      errorMessage: "Desktop login required",
    };
  }

  if (!isMcpSkillGatewayProxyRunning()) {
    return {
      ok: false,
      toolName,
      permission,
      durationMs: Date.now() - started,
      errorCode: "MCP_OP_PROXY_NOT_RUNNING",
      errorMessage: "Local MCP proxy is not running",
    };
  }

  if (permission !== "read") {
    writeMcpSkillGatewayLog({
      time: new Date().toISOString(),
      level: "warn",
      method: "tools/call",
      message: `Invoke test blocked ${permission} tool: ${toolName}`,
    });
    return {
      ok: false,
      toolName,
      permission,
      durationMs: Date.now() - started,
      errorCode: "MCP_OP_TOOL_PERMISSION_DENIED",
      errorMessage: `Write/admin tools are not available in invoke test until v6.9 approval flow: ${toolName}`,
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
          arguments: resolvedArgs.args,
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
        errorCode: "MCP_OP_TOOL_CALL_FAILED",
        message: body.error?.message ?? `tools/call failed (${res.status})`,
      });
      return {
        ok: false,
        toolName,
        permission,
        durationMs,
        errorCode: "MCP_OP_TOOL_CALL_FAILED",
        errorMessage: body.error?.message ?? `tools/call failed (${res.status})`,
      };
    }

    const { value, truncated } = truncateResult(body.result);

    writeMcpSkillGatewayLog({
      time: new Date().toISOString(),
      level: "info",
      method: "tools/call",
      durationMs,
      message: `Invoke test ok: ${toolName}${truncated ? " (result truncated)" : ""}`,
    });

    return {
      ok: true,
      toolName,
      permission,
      durationMs,
      result: value,
      resultTruncated: truncated,
    };
  } catch (err) {
    const durationMs = Date.now() - started;
    const message = err instanceof Error ? err.message : String(err);
    writeMcpSkillGatewayLog({
      time: new Date().toISOString(),
      level: "error",
      method: "tools/call",
      durationMs,
      errorCode: "MCP_OP_TOOL_CALL_FAILED",
      message,
    });
    return {
      ok: false,
      toolName,
      permission,
      durationMs,
      errorCode: "MCP_OP_TOOL_CALL_FAILED",
      errorMessage: message,
    };
  }
}
