import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { workspacesApi } from "../api/workspacesApi";
import type { AIOSProfile, ProfileRuntimeStatus } from "../types";

function mapGatewayStatus(status: string): ProfileRuntimeStatus {
  switch (status) {
    case "running":
      return "running";
    case "starting":
      return "starting";
    case "failed":
      return "error";
    case "stopping":
      return "stopping";
    case "stopped":
      return "stopped";
    default:
      return "stopped";
  }
}

export type ProfileRuntimeHandle = {
  status: ProfileRuntimeStatus;
  healthy: boolean;
  port: number | null;
  pid: number | null;
  lastError: string | null;
  actionLoading: boolean;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  restart: () => Promise<void>;
  refresh: () => Promise<void>;
};

/** Single runtime poll per AIOS Workspace shell — call only from WorkspacesProvider. */
export function useProfileRuntime(
  profileId: string | null,
  profiles: AIOSProfile[],
  setProfiles: Dispatch<SetStateAction<AIOSProfile[]>>,
): ProfileRuntimeHandle {
  const profile = profiles.find((p) => p.id === profileId) ?? null;
  const [actionLoading, setActionLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!profileId) return;
    try {
      const states = await workspacesApi.getRuntimeStatus();
      const state = states.find((s) => s.profileId === profileId);
      if (!state) return;

      const status = mapGatewayStatus(state.status);
      let healthy = false;
      if (status === "running") {
        const probe = await workspacesApi.probeProfileHealth(profileId);
        healthy = probe.healthy;
      }

      setProfiles((prev) =>
        prev.map((p) =>
          p.id === profileId
            ? {
                ...p,
                status,
                healthy,
                gatewayPort: state.port,
                pid: state.pid,
              }
            : p,
        ),
      );
      setLastError(state.lastError);
    } catch (err) {
      setLastError(String(err));
    }
  }, [profileId, setProfiles]);

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => void refresh(), 8000);
    const unsub = workspacesApi.onRuntimeStatusChanged((ev) => {
      if (ev.profileId === profileId) void refresh();
    });
    return () => {
      clearInterval(interval);
      unsub();
    };
  }, [profileId, refresh]);

  const runAction = useCallback(
    async (fn: () => Promise<unknown>) => {
      if (!profileId) return;
      setActionLoading(true);
      setLastError(null);
      try {
        await fn();
        await refresh();
      } catch (err) {
        setLastError(String(err));
      } finally {
        setActionLoading(false);
      }
    },
    [profileId, refresh],
  );

  return {
    status: profile?.status ?? "stopped",
    healthy: profile?.healthy ?? false,
    port: profile?.gatewayPort ?? null,
    pid: profile?.pid ?? null,
    lastError,
    actionLoading,
    start: () => runAction(() => workspacesApi.startProfile(profileId!)),
    stop: () => runAction(() => workspacesApi.stopProfile(profileId!)),
    restart: () => runAction(() => workspacesApi.restartProfile(profileId!)),
    refresh,
  };
}
