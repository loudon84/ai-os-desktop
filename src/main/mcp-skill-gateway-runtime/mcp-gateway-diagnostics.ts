import type {
  DiagnosticCheckResult,
  DiagnosticError,
  McpGatewayDiagnosticsResult,
} from "../../shared/mcp-skill-gateway-runtime/mcp-skill-gateway-runtime-contract";
import { fetchMcpBackendDescriptor } from "./mcp-backend-descriptor";
import {
  getMcpSkillGatewayConfig,
  resolveBackendBaseUrl,
} from "./mcp-skill-gateway-config";
import {
  testMcpSkillGatewayProxy,
  testRemoteMcpSkillGateway,
} from "./mcp-skill-gateway-health";
import {
  isMcpSkillGatewayProxyRunning,
  startMcpSkillGatewayProxy,
} from "./mcp-skill-gateway-proxy";
import {
  listMcpSkillGatewayProfileRegistrations,
  registerMcpSkillGatewayToHermes,
} from "./mcp-skill-gateway-register";
import { getMcpAuthState } from "./mcp-token-provider";
import { listRemoteMcpTools } from "./mcp-tools-cache";
import { isGatewayRunning } from "../hermes";

function step(
  stepId: string,
  label: string,
  ok: boolean,
  detail?: string,
  error?: string,
  errorCode?: DiagnosticCheckResult["errorCode"],
): DiagnosticCheckResult {
  return { step: stepId, label, ok, detail, error, errorCode };
}

function pushError(
  errors: DiagnosticError[],
  stepId: string,
  code: DiagnosticError["code"],
  message: string,
): void {
  errors.push({ step: stepId, code, message });
}

export async function runMcpSkillGatewayDiagnostics(): Promise<McpGatewayDiagnosticsResult> {
  const steps: DiagnosticCheckResult[] = [];
  const errors: DiagnosticError[] = [];
  const config = getMcpSkillGatewayConfig();

  const authState = getMcpAuthState();
  const auth = step(
    "auth",
    "Desktop login",
    authState.tokenPresent,
    authState.tokenPresent ? "Token present" : undefined,
    authState.tokenPresent ? undefined : "Desktop login required",
    authState.tokenPresent ? undefined : "MCP_DIAG_AUTH_REQUIRED",
  );
  steps.push(auth);
  if (!auth.ok) {
    pushError(errors, "auth", "MCP_DIAG_AUTH_REQUIRED", "Desktop login required");
  }

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
        ? "MCP_DIAG_DESCRIPTOR_MISSING"
        : "MCP_DIAG_BACKEND_UNREACHABLE",
  );
  steps.push(backend);
  if (!backend.ok) {
    pushError(
      errors,
      "backend",
      backend.errorCode ?? "MCP_DIAG_BACKEND_UNREACHABLE",
      backend.error ?? "Backend check failed",
    );
  }

  let proxyRunning = isMcpSkillGatewayProxyRunning();
  if (!proxyRunning && auth.ok) {
    try {
      await startMcpSkillGatewayProxy(config.localProxyPort);
      proxyRunning = isMcpSkillGatewayProxyRunning();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      pushError(errors, "localProxy", "MCP_DIAG_PROXY_NOT_RUNNING", message);
    }
  }

  const localProxy = step(
    "localProxy",
    "Local MCP proxy",
    proxyRunning,
    proxyRunning ? `127.0.0.1:${config.localProxyPort}` : undefined,
    proxyRunning ? undefined : "Local MCP proxy is not running",
    proxyRunning ? undefined : "MCP_DIAG_PROXY_NOT_RUNNING",
  );
  steps.push(localProxy);
  if (!localProxy.ok && !errors.some((e) => e.step === "localProxy")) {
    pushError(errors, "localProxy", "MCP_DIAG_PROXY_NOT_RUNNING", localProxy.error ?? "Proxy not running");
  }

  let proxyHealthOk = false;
  if (proxyRunning) {
    const health = await testMcpSkillGatewayProxy();
    proxyHealthOk = health.ok;
    if (!proxyHealthOk) {
      pushError(
        errors,
        "localProxy",
        "MCP_DIAG_PROXY_NOT_RUNNING",
        health.error ?? "Proxy health check failed",
      );
    }
  }

  let remoteOk = false;
  let toolCount = 0;
  let remoteDetail: string | undefined;
  if (proxyRunning && auth.ok) {
    const remote = await testRemoteMcpSkillGateway();
    remoteOk = remote.ok;
    toolCount = remote.toolCount ?? 0;
    remoteDetail = remoteOk ? `${toolCount} tools` : undefined;
    if (!remoteOk) {
      pushError(
        errors,
        "remoteMcp",
        remote.errorCode === "MCP_GATEWAY_REMOTE_UNAUTHORIZED"
          ? "MCP_DIAG_REMOTE_INITIALIZE_FAILED"
          : "MCP_DIAG_REMOTE_INITIALIZE_FAILED",
        remote.error ?? "Remote MCP probe failed",
      );
    }
  }

  const remoteMcp = step(
    "remoteMcp",
    "Remote MCP (initialize + tools/list)",
    remoteOk,
    remoteDetail,
    remoteOk ? undefined : "Remote MCP probe failed",
    remoteOk ? undefined : "MCP_DIAG_REMOTE_INITIALIZE_FAILED",
  );
  steps.push(remoteMcp);

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
    hermesRestartRequired = Boolean(regResult.hermesRestartRequired) || isGatewayRunning();
    registrationReady = defaultProfileRegistered;

    if (!regResult.ok) {
      pushError(
        errors,
        "hermesRegistration",
        "MCP_DIAG_PROFILE_NOT_REGISTERED",
        regResult.error ?? "Failed to register default profile",
      );
    } else if (!regResult.ready) {
      pushError(
        errors,
        "hermesRegistration",
        "MCP_DIAG_PROFILE_NOT_REGISTERED",
        "Default profile MCP registration is not ready",
      );
    }

    if (hermesRestartRequired && isGatewayRunning()) {
      pushError(
        errors,
        "hermesRegistration",
        "MCP_DIAG_HERMES_RESTART_REQUIRED",
        "Hermes Gateway restart required to load mcp_skill_gateway",
      );
    }
  }

  const registrations = listMcpSkillGatewayProfileRegistrations();
  const defaultReg = registrations.find((r) => r.profile === "default");
  if (defaultReg?.registered) {
    defaultProfileRegistered = true;
  }

  const hermesRegistration = step(
    "hermesRegistration",
    "Hermes default profile registration",
    registrationReady || Boolean(defaultReg?.ready),
    defaultReg?.url ?? undefined,
    registrationReady || defaultReg?.ready
      ? undefined
      : "Default profile not registered to local proxy",
    registrationReady || defaultReg?.ready
      ? undefined
      : "MCP_DIAG_PROFILE_NOT_REGISTERED",
  );
  steps.push(hermesRegistration);

  let tools: Awaited<ReturnType<typeof listRemoteMcpTools>> = [];
  if (remoteOk) {
    try {
      tools = await listRemoteMcpTools({ forceRefresh: true });
      toolCount = tools.length;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      pushError(errors, "toolsList", "MCP_DIAG_TOOLS_LIST_FAILED", message);
      steps.push(
        step(
          "toolsList",
          "MCP tools/list preview",
          false,
          undefined,
          message,
          "MCP_DIAG_TOOLS_LIST_FAILED",
        ),
      );
    }
  }

  if (remoteOk && tools.length >= 0 && !steps.some((s) => s.step === "toolsList")) {
    steps.push(
      step(
        "toolsList",
        "MCP tools/list preview",
        toolCount > 0,
        `${toolCount} tools`,
        toolCount > 0 ? undefined : "No tools returned",
        toolCount > 0 ? undefined : "MCP_DIAG_TOOLS_LIST_FAILED",
      ),
    );
    if (toolCount === 0) {
      pushError(errors, "toolsList", "MCP_DIAG_TOOLS_LIST_FAILED", "tools/list returned empty");
    }
  }

  const ok =
    auth.ok &&
    backend.ok &&
    localProxy.ok &&
    proxyHealthOk &&
    remoteOk &&
    (hermesRegistration.ok || defaultProfileRegistered) &&
    toolCount > 0;

  return {
    ok,
    auth,
    backend,
    localProxy,
    remoteMcp,
    hermesRegistration,
    toolCount,
    tools,
    hermesRestartRequired,
    defaultProfileRegistered,
    errors,
    steps,
  };
}
