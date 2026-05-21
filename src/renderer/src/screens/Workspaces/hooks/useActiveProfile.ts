import { useCallback, useEffect, useState } from "react";
import { fetchDbExpertProfiles, mergeExpertProfiles } from "../api/mergeExpertProfiles";
import { workspacesApi } from "../api/workspacesApi";
import { useWorkspaces } from "../context/WorkspacesContext";

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
      const list = mergeExpertProfiles(dbList, runtime);
      setProfiles(list);

      const resolveId = (key: string | null): string | null => {
        if (!key) return null;
        const hit = list.find((p) => p.id === key || p.name === key);
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
      setProfiles(mergeExpertProfiles([], []));
    } finally {
      setLoading(false);
    }
  }, [activeProfileId, setActiveProfileId, setProfiles]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { loading, error, refetch };
}
