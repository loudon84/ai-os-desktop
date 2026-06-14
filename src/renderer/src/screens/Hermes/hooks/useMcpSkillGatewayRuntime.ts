import { useCallback, useEffect, useState } from "react";
import type {
  McpGatewayDiagnosticsResult,
  McpGatewayInvokeTestInput,
  McpGatewayInvokeTestResult,
  McpGatewayToolPreview,
  McpSkillGatewayProfileRegistration,
  McpSkillGatewayRuntimeConfig,
  McpSkillGatewayRuntimeStatus,
} from "../../../../../shared/mcp-skill-gateway-runtime/mcp-skill-gateway-runtime-contract";

export function useMcpSkillGatewayRuntime() {
  const [status, setStatus] = useState<McpSkillGatewayRuntimeStatus | null>(null);
  const [config, setConfig] = useState<McpSkillGatewayRuntimeConfig | null>(null);
  const [registrations, setRegistrations] = useState<McpSkillGatewayProfileRegistration[]>([]);
  const [logs, setLogs] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [diagnosticsResult, setDiagnosticsResult] = useState<McpGatewayDiagnosticsResult | null>(
    null,
  );
  const [remoteTools, setRemoteTools] = useState<McpGatewayToolPreview[]>([]);
  const [invokeResult, setInvokeResult] = useState<McpGatewayInvokeTestResult | null>(null);
  const [toolsLoading, setToolsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextStatus, nextConfig, nextRegs, nextLogs] = await Promise.all([
        window.mcpSkillGatewayRuntime.getStatus(),
        window.mcpSkillGatewayRuntime.getConfig(),
        window.mcpSkillGatewayRuntime.listProfileRegistrations(),
        window.mcpSkillGatewayRuntime.readProxyLogs(120),
      ]);
      setStatus(nextStatus);
      setConfig(nextConfig);
      setRegistrations(nextRegs);
      setLogs(nextLogs);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const runAction = useCallback(
    async (fn: () => Promise<unknown>) => {
      setActionPending(true);
      setError(null);
      try {
        await fn();
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setActionPending(false);
      }
    },
    [refresh],
  );

  const saveConfig = useCallback(
    async (patch: Partial<McpSkillGatewayRuntimeConfig>) => {
      await runAction(async () => {
        const saved = await window.mcpSkillGatewayRuntime.saveConfig(patch);
        setConfig(saved);
      });
    },
    [runAction],
  );

  const runDiagnostics = useCallback(async () => {
    setActionPending(true);
    setError(null);
    try {
      const result = await window.mcpSkillGatewayRuntime.runDiagnostics();
      setDiagnosticsResult(result);
      setRemoteTools(result.tools);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionPending(false);
    }
  }, [refresh]);

  const listRemoteTools = useCallback(async (forceRefresh = false) => {
    setToolsLoading(true);
    setError(null);
    try {
      const tools = await window.mcpSkillGatewayRuntime.listRemoteTools(forceRefresh);
      setRemoteTools(tools);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setToolsLoading(false);
    }
  }, []);

  const invokeRemoteTool = useCallback(async (input: McpGatewayInvokeTestInput) => {
    setActionPending(true);
    setError(null);
    try {
      const result = await window.mcpSkillGatewayRuntime.invokeRemoteTool(input);
      setInvokeResult(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setActionPending(false);
    }
  }, []);

  return {
    status,
    config,
    registrations,
    logs,
    loading,
    error,
    actionPending,
    diagnosticsResult,
    remoteTools,
    invokeResult,
    toolsLoading,
    refresh,
    saveConfig,
    runDiagnostics,
    listRemoteTools,
    invokeRemoteTool,
    startProxy: () => runAction(() => window.mcpSkillGatewayRuntime.startProxy()),
    stopProxy: () => runAction(() => window.mcpSkillGatewayRuntime.stopProxy()),
    restartProxy: () => runAction(() => window.mcpSkillGatewayRuntime.restartProxy()),
    testProxy: () => runAction(() => window.mcpSkillGatewayRuntime.testProxy()),
    testRemoteMcp: () => runAction(() => window.mcpSkillGatewayRuntime.testRemoteMcp()),
    registerProfile: (profile: string) =>
      runAction(() => window.mcpSkillGatewayRuntime.registerToProfile(profile)),
    unregisterProfile: (profile: string) =>
      runAction(() => window.mcpSkillGatewayRuntime.unregisterFromProfile(profile)),
  };
}
