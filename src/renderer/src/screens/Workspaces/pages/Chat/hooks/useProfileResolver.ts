import { useCallback, useEffect, useState } from "react";
import type { ResolvedProfile } from "../../../../../../../shared/workspace-chat/workspace-chat-contract";

export function useProfileResolver(profileRef: string | null): {
  resolved: ResolvedProfile | null;
  resolving: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const [resolved, setResolved] = useState<ResolvedProfile | null>(null);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!profileRef?.trim()) {
      setResolved(null);
      setError(null);
      return;
    }
    setResolving(true);
    setError(null);
    try {
      const row = await window.workspaceChat.resolveProfile(profileRef);
      setResolved(row);
    } catch (err) {
      setResolved(null);
      setError(String(err));
    } finally {
      setResolving(false);
    }
  }, [profileRef]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { resolved, resolving, error, refresh };
}
