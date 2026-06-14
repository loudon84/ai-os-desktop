import { useCallback, useEffect, useState } from "react";
import type {
  McpGatewayDiagnosticsResult,
  McpGatewayInvokeTestInput,
  McpGatewayInvokeTestResult,
  McpGatewayProxyLogEntry,
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
  const [structuredLogs, setStructuredLogs] = useState<McpGatewayProxyLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [diagnosticsResult, setDiagnosticsResult] = useState<McpGatewayDiagnosticsResult | null>(
    null,
  );
  const [remoteTools, setRemoteTools] = useState<McpGatewayToolPreview[]>([]);
  const [invokeResult, setInvokeResult] = useState<McpGatewayInvokeTestResult | null>(null);
  const [toolsLoading, setToolsLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);

  const loadStructuredLogs = useCallback(async (lines = 120) => {
    setLogsLoading(true);
    try {
      const entries = await window.mcpSkillGatewayRuntime.readStructuredLogs(lines);
      setStructuredLogs(entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLogsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextStatus, nextConfig, nextRegs, nextLogs, nextStructured] = await Promise.all([
        window.mcpSkillGatewayRuntime.getStatus(),
        window.mcpSkillGatewayRuntime.getConfig(),
        window.mcpSkillGatewayRuntime.listProfileRegistrations(),
        window.mcpSkillGatewayRuntime.readProxyLogs(120),
        window.mcpSkillGatewayRuntime.readStructuredLogs(120),
      ]);
      setStatus(nextStatus);
      setConfig(nextConfig);
      setRegistrations(nextRegs);
      setLogs(nextLogs);
      setStructuredLogs(nextStructured);
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

  const copyDiagnosticsReport = useCallback(async () => {
    if (!diagnosticsResult) return false;
    try {
      await navigator.clipboard.writeText(JSON.stringify(diagnosticsResult, null, 2));
      return true;
    } catch {
      return false;
    }
  }, [diagnosticsResult]);

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
      await loadStructuredLogs();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setActionPending(false);
    }
  }, [loadStructuredLogs]);

  return {
    status,
    config,
    registrations,
    logs,
    structuredLogs,
    loading,
    error,
    actionPending,
    diagnosticsResult,
    remoteTools,
    invokeResult,
    toolsLoading,
    logsLoading,
    refresh,
    saveConfig,
    runDiagnostics,
    copyDiagnosticsReport,
    listRemoteTools,
    loadStructuredLogs,
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
