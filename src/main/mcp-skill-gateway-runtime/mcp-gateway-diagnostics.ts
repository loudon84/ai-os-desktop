import type {
  DiagnosticCheck,
  DiagnosticError,
  McpGatewayDiagnosticsResult,
  McpGatewayToolPreview,
} from "../../shared/mcp-skill-gateway-runtime/mcp-gateway-operations-contract";
import { fetchMcpBackendDescriptor } from "./mcp-backend-descriptor";
import {
  getMcpSkillGatewayConfig,
  resolveBackendBaseUrl,
} from "./mcp-skill-gateway-config";
import { testRemoteMcpSkillGateway } from "./mcp-skill-gateway-health";
import {
  isMcpSkillGatewayProxyRunning,
  startMcpSkillGatewayProxy,
} from "./mcp-skill-gateway-proxy";
import {
  listMcpSkillGatewayProfileRegistrations,
  registerMcpSkillGatewayToHermes,
} from "./mcp-skill-gateway-register";
import { getMcpAuthState } from "./mcp-token-provider";
import { listRemoteMcpTools, readMcpGatewayToolsCache } from "./mcp-tools-cache";
import { isGatewayRunning } from "../hermes";

function step(
  stepId: string,
  label: string,
  ok: boolean,
  detail?: string,
  error?: string,
  errorCode?: DiagnosticCheck["errorCode"],
): DiagnosticCheck {
  return { step: stepId, label, ok, detail, error, errorCode };
}

function recordStepFailure(
  errors: DiagnosticError[],
  check: DiagnosticCheck,
): void {
  if (check.ok || !check.errorCode || !check.error) return;
  errors.push({
    step: check.step,
    code: check.errorCode,
    message: check.error,
  });
}

export async function runMcpSkillGatewayDiagnostics(): Promise<McpGatewayDiagnosticsResult> {
  const checkedAt = new Date().toISOString();
  const steps: DiagnosticCheck[] = [];
  const errors: DiagnosticError[] = [];
  const config = getMcpSkillGatewayConfig();

  const authState = getMcpAuthState();
  const auth = step(
    "auth",
    "Desktop login",
    authState.tokenPresent,
    authState.tokenPresent ? "Token present" : undefined,
    authState.tokenPresent ? undefined : "Desktop login required",
    authState.tokenPresent ? undefined : "MCP_OP_AUTH_REQUIRED",
  );
  steps.push(auth);
  recordStepFailure(errors, auth);

  const descriptorResult = await fetchMcpBackendDescriptor(true);
  const backendBaseUrl = resolveBackendBaseUrl();
  const backend = step(
    "backend",
    "Backend & MCP descriptor",
    descriptorResult.ok && Boolean(backendBaseUrl),
    descriptorResult.ok
      ? descriptorResult.descriptor?.upstreamUrl
      : backendBaseUrl || undefined,
    descriptorResult.ok
      ? undefined
      : descriptorResult.error?.message ?? "Backend unreachable or descriptor missing",
    descriptorResult.ok
      ? undefined
      : descriptorResult.error?.code === "MCP_DESCRIPTOR_MISSING"
        ? "MCP_OP_DESCRIPTOR_MISSING"
        : "MCP_OP_BACKEND_UNREACHABLE",
  );
  steps.push(backend);
  recordStepFailure(errors, backend);

  let proxyRunning = isMcpSkillGatewayProxyRunning();
  let proxyStartError: string | undefined;
  if (!proxyRunning && auth.ok) {
    try {
      await startMcpSkillGatewayProxy(config.localProxyPort);
      proxyRunning = isMcpSkillGatewayProxyRunning();
    } catch (err) {
      proxyStartError = err instanceof Error ? err.message : String(err);
    }
  }

  const localProxy = step(
    "localProxy",
    "Local MCP proxy",
    proxyRunning,
    proxyRunning ? `127.0.0.1:${config.localProxyPort}` : undefined,
    proxyRunning ? undefined : proxyStartError ?? "Local MCP proxy is not running",
    proxyRunning ? undefined : "MCP_OP_PROXY_NOT_RUNNING",
  );
  steps.push(localProxy);
  recordStepFailure(errors, localProxy);

  let remoteOk = false;
  let toolCount = 0;
  let remoteDetail: string | undefined;
  let remoteError: string | undefined;

  if (proxyRunning && auth.ok) {
    const probe = await testRemoteMcpSkillGateway();
    remoteOk = probe.ok;
    toolCount = probe.toolCount ?? 0;
    remoteDetail = remoteOk ? `${toolCount} tools` : undefined;
    remoteError = probe.error;
  } else if (!proxyRunning) {
    remoteError = "Local MCP proxy is not running";
  } else if (!auth.ok) {
    remoteError = "Desktop login required";
  }

  const remoteMcp = step(
    "remoteMcp",
    "Remote MCP (initialize + tools/list)",
    remoteOk,
    remoteDetail,
    remoteOk ? undefined : remoteError ?? "Remote MCP probe failed",
    remoteOk ? undefined : "MCP_OP_REMOTE_INITIALIZE_FAILED",
  );
  steps.push(remoteMcp);
  recordStepFailure(errors, remoteMcp);

  const toolsListOk = remoteOk && toolCount > 0;
  const toolsList = step(
    "toolsList",
    "MCP tools/list preview",
    toolsListOk,
    toolsListOk ? `${toolCount} tools` : undefined,
    toolsListOk ? undefined : "tools/list failed or returned empty",
    toolsListOk ? undefined : "MCP_OP_TOOLS_LIST_FAILED",
  );
  steps.push(toolsList);
  recordStepFailure(errors, toolsList);

  let tools: McpGatewayToolPreview[] = [];
  if (toolsListOk) {
    try {
      tools = await listRemoteMcpTools({ forceRefresh: true });
    } catch {
      tools = readMcpGatewayToolsCache()?.tools ?? [];
    }
  }

  let defaultProfileRegistered = false;
  let hermesRestartRequired = false;
  let registrationReady = false;

  if (auth.ok && proxyRunning) {
    const regResult = await registerMcpSkillGatewayToHermes({
      profile: "default",
      localProxyPort: config.localProxyPort,
      enabled: true,
    });
    defaultProfileRegistered = regResult.ok && Boolean(regResult.ready);
    hermesRestartRequired = Boolean(regResult.hermesRestartRequired);
    registrationReady = defaultProfileRegistered;
  }

  const registrations = listMcpSkillGatewayProfileRegistrations();
  const defaultReg = registrations.find((r) => r.profile === "default");
  if (defaultReg?.registered) {
    defaultProfileRegistered = true;
  }

  const defaultProfileRegistration = step(
    "defaultProfileRegistration",
    "Default profile MCP registration",
    registrationReady || Boolean(defaultReg?.ready),
    defaultReg?.url ?? undefined,
    registrationReady || defaultReg?.ready
      ? undefined
      : "Default profile not registered to local proxy",
    registrationReady || defaultReg?.ready
      ? undefined
      : "MCP_OP_PROFILE_NOT_REGISTERED",
  );
  steps.push(defaultProfileRegistration);
  recordStepFailure(errors, defaultProfileRegistration);

  const gatewayRunning = isGatewayRunning();
  const hermesGateway = step(
    "hermesGateway",
    "Hermes Gateway runtime",
    !hermesRestartRequired || !gatewayRunning,
    gatewayRunning
      ? hermesRestartRequired
        ? "Running — restart required"
        : "Running"
      : "Not running",
    hermesRestartRequired && gatewayRunning
      ? "Hermes Gateway restart required to load mcp_skill_gateway"
      : undefined,
    hermesRestartRequired && gatewayRunning
      ? "MCP_OP_HERMES_RESTART_REQUIRED"
      : undefined,
  );
  steps.push(hermesGateway);
  recordStepFailure(errors, hermesGateway);

  const ok = steps.every((row) => row.ok);

  return {
    ok,
    checkedAt,
    auth,
    backend,
    localProxy,
    remoteMcp,
    toolsList,
    defaultProfileRegistration,
    hermesGateway,
    toolCount,
    tools,
    hermesRestartRequired: hermesRestartRequired && gatewayRunning,
    defaultProfileRegistered,
    errors,
    steps,
    hermesRegistration: defaultProfileRegistration,
  };
}
