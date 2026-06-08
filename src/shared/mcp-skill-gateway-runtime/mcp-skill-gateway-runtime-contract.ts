/** v6.4 — MCP Skill Gateway Runtime (Desktop → nodeskclaw proxy + Hermes registration). */

export type McpSkillGatewayProxyStatus = "running" | "stopped" | "failed";

export type McpSkillGatewayDesktopErrorCode =
  | "MCP_GATEWAY_NOT_LOGGED_IN"
  | "MCP_GATEWAY_BACKEND_NOT_CONFIGURED"
  | "MCP_GATEWAY_BACKEND_MISMATCH"
  | "MCP_GATEWAY_CONFIG_MISMATCH"
  | "MCP_GATEWAY_PROXY_PORT_IN_USE"
  | "MCP_GATEWAY_PROXY_START_FAILED"
  | "MCP_GATEWAY_PROXY_NOT_RUNNING"
  | "MCP_GATEWAY_REMOTE_UNREACHABLE"
  | "MCP_GATEWAY_REMOTE_UNAUTHORIZED"
  | "MCP_GATEWAY_REMOTE_FORBIDDEN"
  | "MCP_GATEWAY_CONFIG_WRITE_FAILED"
  | "MCP_GATEWAY_PROFILE_NOT_FOUND"
  | "MCP_GATEWAY_HERMES_RESTART_REQUIRED"
  | "MCP_GATEWAY_INVALID_JSONRPC"
  | "MCP_GATEWAY_REQUEST_TOO_LARGE";

export const MCP_SKILL_GATEWAY_JSONRPC_ERRORS = {
  NOT_LOGGED_IN: -32010,
  BACKEND_NOT_CONFIGURED: -32011,
  REMOTE_FAILED: -32012,
  SESSION_EXPIRED: -32013,
} as const;

export const DEFAULT_MCP_SKILL_GATEWAY_MANAGEMENT_ROUTES = {
  skills: "/hermes/skills",
  mcp: "/hermes/mcp",
  instances: "/instances",
} as const;

export interface McpSkillGatewayRuntimeConfig {
  enabled: boolean;
  mcpEndpointPath: string;
  localProxyHost: "127.0.0.1";
  localProxyPort: number;
  autoStartProxy: boolean;
  autoRegisterToHermes: boolean;
  autoRestartHermesGateway: boolean;
  registeredProfiles: string[];
  managementRoutes: {
    skills: string;
    mcp: string;
    instances: string;
  };
  updatedAt: string;
}

export const DEFAULT_MCP_SKILL_GATEWAY_CONFIG: McpSkillGatewayRuntimeConfig = {
  enabled: true,
  mcpEndpointPath: "/api/v1/hermes/mcp",
  localProxyHost: "127.0.0.1",
  localProxyPort: 48742,
  autoStartProxy: true,
  autoRegisterToHermes: true,
  autoRestartHermesGateway: false,
  registeredProfiles: ["default"],
  managementRoutes: { ...DEFAULT_MCP_SKILL_GATEWAY_MANAGEMENT_ROUTES },
  updatedAt: "",
};

export interface McpSkillGatewayRuntimeStatus {
  enabled: boolean;
  proxyStatus: McpSkillGatewayProxyStatus;
  loggedIn: boolean;
  userDisplayName: string | null;
  backendBaseUrl: string;
  remoteMcpUrl: string;
  localProxyUrl: string;
  mcpEndpointPath: string;
  lastError: string | null;
  registeredProfileCount: number;
  hermesRestartRequired: boolean;
}

export interface McpSkillGatewayHealthResult {
  ok: boolean;
  service: string;
  status?: string;
  loggedIn: boolean;
  backendBaseUrl: string;
  remoteMcpUrl?: string;
  localMcpUrl?: string;
  target?: string;
  error?: string;
  errorCode?: McpSkillGatewayDesktopErrorCode;
}

export interface McpGatewayRemoteTestResult {
  ok: boolean;
  localProxyUrl: string;
  backendBaseUrl: string;
  remoteMcpUrl: string;
  toolCount?: number;
  jsonrpcErrorCode?: number;
  error?: string;
  errorCode?: McpSkillGatewayDesktopErrorCode;
}

export interface McpSkillGatewayActionResult {
  ok: boolean;
  error?: string;
  errorCode?: McpSkillGatewayDesktopErrorCode;
}

export interface McpSkillGatewayRegisterResult {
  ok: boolean;
  changed: boolean;
  configPath: string;
  profile: string;
  url: string;
  expectedUrl?: string;
  urlMatched?: boolean;
  backendMatched?: boolean;
  ready?: boolean;
  error?: string;
  errorCode?: McpSkillGatewayDesktopErrorCode;
  hermesRestartRequired?: boolean;
}

export interface McpSkillGatewayProfileRegistration {
  profile: string;
  configPath: string;
  registered: boolean;
  enabled: boolean;
  url: string | null;
  expectedUrl: string;
  urlMatched: boolean;
  backendMatched: boolean;
  ready: boolean;
  lastChecked: string;
}

export interface McpSkillGatewayRuntimeAPI {
  getStatus(): Promise<McpSkillGatewayRuntimeStatus>;
  getConfig(): Promise<McpSkillGatewayRuntimeConfig>;
  saveConfig(
    input: Partial<McpSkillGatewayRuntimeConfig>,
  ): Promise<McpSkillGatewayRuntimeConfig>;

  startProxy(): Promise<McpSkillGatewayActionResult>;
  stopProxy(): Promise<McpSkillGatewayActionResult>;
  restartProxy(): Promise<McpSkillGatewayActionResult>;
  testProxy(): Promise<McpSkillGatewayHealthResult>;
  testRemoteMcp(): Promise<McpGatewayRemoteTestResult>;

  registerToProfile(profile: string): Promise<McpSkillGatewayRegisterResult>;
  unregisterFromProfile(profile: string): Promise<McpSkillGatewayRegisterResult>;
  listProfileRegistrations(): Promise<McpSkillGatewayProfileRegistration[]>;

  readProxyLogs(lines?: number): Promise<string>;
}
