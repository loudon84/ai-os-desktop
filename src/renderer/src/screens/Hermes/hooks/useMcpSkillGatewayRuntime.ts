import { useCallback, useEffect, useState } from "react";
import type {
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

  return {
    status,
    config,
    registrations,
    logs,
    loading,
    error,
    actionPending,
    refresh,
    saveConfig,
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
