import { useCallback, useEffect, useState } from "react";
import { fetchDbExpertProfiles, mergeExpertProfiles } from "../api/mergeExpertProfiles";
import { workspacesApi } from "../api/workspacesApi";
import { LEGACY_EXPERT_PROFILE_ID_ALIASES } from "../constants";
import type { AIOSProfile } from "../types";
import { useWorkspaces } from "../context/WorkspacesContext";

const DEFAULT_GATEWAY_PORT = 8642;

async function enrichDefaultFromLegacyGateway(profiles: AIOSProfile[]): Promise<AIOSProfile[]> {
  const index = profiles.findIndex((p) => p.id === "default" || p.name === "default");
  if (index < 0) return profiles;

  const current = profiles[index];
  if (current.status === "running") return profiles;

  try {
    const gatewayUp = await window.hermesAPI.gatewayStatus();
    if (!gatewayUp) return profiles;

    const next = [...profiles];
    next[index] = {
      ...current,
      status: "running",
      healthy: true,
      gatewayPort: DEFAULT_GATEWAY_PORT,
    };
    return next;
  } catch {
    return profiles;
  }
}

export function useActiveProfile(): {
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const { setProfiles, setActiveProfileId, activeProfileId } = useWorkspaces();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dbList, runtime] = await Promise.all([
        fetchDbExpertProfiles(),
        workspacesApi.getRuntimeStatus(),
      ]);
      let list = mergeExpertProfiles(dbList, runtime);
      list = await enrichDefaultFromLegacyGateway(list);
      setProfiles(list);

      const resolveId = (key: string | null): string | null => {
        if (!key) return null;
        const normalized = LEGACY_EXPERT_PROFILE_ID_ALIASES[key] ?? key;
        const hit = list.find((p) => p.id === normalized || p.name === normalized);
        return hit?.id ?? null;
      };
      const resolved = resolveId(activeProfileId);
      if (resolved) {
        if (resolved !== activeProfileId) setActiveProfileId(resolved);
      } else if (list.length > 0) {
        setActiveProfileId(list[0].id);
      }
    } catch (err) {
      setError(String(err));
      const fallback = await enrichDefaultFromLegacyGateway(mergeExpertProfiles([], []));
      setProfiles(fallback);
    } finally {
      setLoading(false);
    }
  }, [activeProfileId, setActiveProfileId, setProfiles]);

  useEffect(() => {
    void refetch();
    const interval = setInterval(() => void refetch(), 5000);
    return () => clearInterval(interval);
  }, [refetch]);

  return { loading, error, refetch };
}
