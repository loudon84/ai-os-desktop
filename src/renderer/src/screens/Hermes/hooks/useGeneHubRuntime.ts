import { useCallback, useEffect, useState } from "react";
import type {
  GeneHubConnection,
  GeneHubSkill,
  InstallJob,
  InstallLogEntry,
} from "../../../../../shared/genehub/genehub-contract";

export function useGeneHubRuntime() {
  const [connection, setConnection] = useState<GeneHubConnection | null>(null);
  const [authorizedSkills, setAuthorizedSkills] = useState<GeneHubSkill[]>([]);
  const [pendingJobs, setPendingJobs] = useState<InstallJob[]>([]);
  const [installLogs, setInstallLogs] = useState<InstallLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);

  const refreshConnection = useCallback(async (forceRefresh = false) => {
    const next = await window.genehubRuntime.getConnection(forceRefresh);
    setConnection(next);
    return next;
  }, []);

  const refreshLists = useCallback(async () => {
    const [skills, jobs, logs] = await Promise.all([
      window.genehubRuntime.listAuthorizedSkills(),
      window.genehubRuntime.listPendingJobs(),
      window.genehubRuntime.getInstallLogs(100),
    ]);
    setAuthorizedSkills(skills);
    setPendingJobs(jobs);
    setInstallLogs(logs);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await refreshConnection();
      await refreshLists();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [refreshConnection, refreshLists]);

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

  return {
    connection,
    authorizedSkills,
    pendingJobs,
    installLogs,
    loading,
    error,
    actionPending,
    refresh,
    probeConnection: () => runAction(() => window.genehubRuntime.probeConnection()),
    initialize: () => runAction(() => window.genehubRuntime.initialize()),
    syncInstalled: () => runAction(() => window.genehubRuntime.syncInstalledSkills()),
    installSkill: (geneSlug: string) =>
      runAction(async () => {
        const job = await window.genehubRuntime.createInstallJob({
          geneSlug,
          action: "install",
        });
        const result = await window.genehubRuntime.installJob(job.jobId);
        if (!result.ok) {
          throw new Error(result.error ?? "Install failed");
        }
      }),
    updateSkill: (geneSlug: string) =>
      runAction(async () => {
        const result = await window.genehubRuntime.updateSkill({ geneSlug });
        if (!result.ok) {
          throw new Error(result.error ?? "Update failed");
        }
      }),
    uninstallSkill: (geneSlug: string) =>
      runAction(async () => {
        const result = await window.genehubRuntime.uninstallSkill({ geneSlug });
        if (!result.ok) {
          throw new Error(result.error ?? "Uninstall failed");
        }
      }),
    installPendingJob: (jobId: string) =>
      runAction(async () => {
        const result = await window.genehubRuntime.installJob(jobId);
        if (!result.ok) {
          throw new Error(result.error ?? "Install failed");
        }
      }),
  };
}
