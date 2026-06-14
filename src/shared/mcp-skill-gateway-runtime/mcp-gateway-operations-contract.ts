/** v6.6.1 — MCP Gateway operations (diagnostics, tools preview, invoke test, logs). */

import type { McpSkillGatewayDesktopErrorCode } from "./mcp-skill-gateway-runtime-contract";

/** v6.6.1 operations error codes (PRD §10). */
export type McpGatewayOperationsErrorCode =
  | "MCP_OP_AUTH_REQUIRED"
  | "MCP_OP_BACKEND_NOT_CONFIGURED"
  | "MCP_OP_BACKEND_UNREACHABLE"
  | "MCP_OP_DESCRIPTOR_MISSING"
  | "MCP_OP_PROXY_NOT_RUNNING"
  | "MCP_OP_PROXY_START_FAILED"
  | "MCP_OP_REMOTE_INITIALIZE_FAILED"
  | "MCP_OP_TOOLS_LIST_FAILED"
  | "MCP_OP_TOOL_NOT_FOUND"
  | "MCP_OP_TOOL_PERMISSION_DENIED"
  | "MCP_OP_TOOL_CALL_FAILED"
  | "MCP_OP_PROFILE_NOT_REGISTERED"
  | "MCP_OP_HERMES_RESTART_REQUIRED"
  | "MCP_OP_INVALID_JSON_ARGUMENTS";

/** Map v6.6 MCP_DIAG_* codes to v6.6.1 MCP_OP_* for external surfaces. */
export const MCP_DIAG_TO_OP_ERROR: Record<string, McpGatewayOperationsErrorCode> = {
  MCP_DIAG_AUTH_REQUIRED: "MCP_OP_AUTH_REQUIRED",
  MCP_DIAG_BACKEND_UNREACHABLE: "MCP_OP_BACKEND_UNREACHABLE",
  MCP_DIAG_DESCRIPTOR_MISSING: "MCP_OP_DESCRIPTOR_MISSING",
  MCP_DIAG_PROXY_NOT_RUNNING: "MCP_OP_PROXY_NOT_RUNNING",
  MCP_DIAG_REMOTE_INITIALIZE_FAILED: "MCP_OP_REMOTE_INITIALIZE_FAILED",
  MCP_DIAG_TOOLS_LIST_FAILED: "MCP_OP_TOOLS_LIST_FAILED",
  MCP_DIAG_PROFILE_NOT_REGISTERED: "MCP_OP_PROFILE_NOT_REGISTERED",
  MCP_DIAG_HERMES_RESTART_REQUIRED: "MCP_OP_HERMES_RESTART_REQUIRED",
  MCP_DIAG_TOOL_CALL_FAILED: "MCP_OP_TOOL_CALL_FAILED",
  MCP_GATEWAY_NOT_LOGGED_IN: "MCP_OP_AUTH_REQUIRED",
  MCP_GATEWAY_BACKEND_NOT_CONFIGURED: "MCP_OP_BACKEND_NOT_CONFIGURED",
  MCP_GATEWAY_PROXY_NOT_RUNNING: "MCP_OP_PROXY_NOT_RUNNING",
  MCP_GATEWAY_PROXY_START_FAILED: "MCP_OP_PROXY_START_FAILED",
};

export function toOperationsErrorCode(
  code: string | undefined,
): McpGatewayOperationsErrorCode | undefined {
  if (!code) return undefined;
  if (code.startsWith("MCP_OP_")) {
    return code as McpGatewayOperationsErrorCode;
  }
  return MCP_DIAG_TO_OP_ERROR[code];
}

export type McpGatewayToolCategory = "hermes" | "genehub" | "system" | "unknown";
export type McpGatewayToolPermission = "read" | "write" | "admin";
export type McpGatewayRiskLevel = "low" | "medium" | "high";

export interface DiagnosticCheck {
  step: string;
  ok: boolean;
  label: string;
  detail?: string;
  error?: string;
  errorCode?: McpGatewayOperationsErrorCode | McpSkillGatewayDesktopErrorCode;
}

export interface DiagnosticError {
  step: string;
  code: McpGatewayOperationsErrorCode | McpSkillGatewayDesktopErrorCode;
  message: string;
}

export interface McpGatewayToolPreview {
  name: string;
  description: string;
  category: McpGatewayToolCategory;
  permission: McpGatewayToolPermission;
  riskLevel: McpGatewayRiskLevel;
  inputSchema: Record<string, unknown>;
  enabled: boolean;
  source: "nodeskclaw";
  lastSyncedAt: string;
}

export interface McpGatewayDiagnosticsResult {
  ok: boolean;
  checkedAt: string;
  auth: DiagnosticCheck;
  backend: DiagnosticCheck;
  localProxy: DiagnosticCheck;
  remoteMcp: DiagnosticCheck;
  toolsList: DiagnosticCheck;
  defaultProfileRegistration: DiagnosticCheck;
  hermesGateway: DiagnosticCheck;
  toolCount: number;
  tools: McpGatewayToolPreview[];
  hermesRestartRequired: boolean;
  defaultProfileRegistered: boolean;
  errors: DiagnosticError[];
  steps: DiagnosticCheck[];
  /** @deprecated use defaultProfileRegistration */
  hermesRegistration?: DiagnosticCheck;
}

export interface McpGatewayInvokeTestInput {
  toolName: string;
  arguments?: Record<string, unknown>;
  /** @deprecated use arguments */
  input?: Record<string, unknown>;
}

export interface McpGatewayInvokeTestResult {
  ok: boolean;
  toolName: string;
  permission: McpGatewayToolPermission;
  durationMs: number;
  result?: unknown;
  resultTruncated?: boolean;
  errorCode?: McpGatewayOperationsErrorCode | McpSkillGatewayDesktopErrorCode;
  errorMessage?: string;
}

export type McpGatewayProxyLogLevel = "info" | "warn" | "error";

export interface McpGatewayProxyLogEntry {
  time: string;
  level: McpGatewayProxyLogLevel;
  method?: string;
  jsonrpcId?: string | number | null;
  remoteStatus?: number;
  durationMs?: number;
  errorCode?: string | number;
  message?: string;
}
