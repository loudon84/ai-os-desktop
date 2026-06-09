import { ipcRenderer } from "electron";
import type {
  GeneHubConnection,
  GeneHubCreateInstallJobInput,
  GeneHubInitializeResult,
  GeneHubProfileScopedInput,
  GeneHubRuntimeAPI,
  GeneHubRuntimeConfig,
  GeneHubSkill,
  InstallJob,
  InstallLogEntry,
  GeneHubActionResult,
} from "../shared/genehub/genehub-contract";

export const genehubRuntimeApi: GeneHubRuntimeAPI = {
  getConnection: (forceRefresh?: boolean) =>
    ipcRenderer.invoke("genehub:get-connection", forceRefresh),
  probeConnection: () => ipcRenderer.invoke("genehub:probe-connection"),
  initialize: (): Promise<GeneHubInitializeResult> => ipcRenderer.invoke("genehub:initialize"),
  getConfig: (): Promise<GeneHubRuntimeConfig> => ipcRenderer.invoke("genehub:get-config"),
  listAuthorizedSkills: (input?: GeneHubProfileScopedInput): Promise<GeneHubSkill[]> =>
    ipcRenderer.invoke("genehub:list-authorized-skills", input),
  listPendingJobs: (input?: GeneHubProfileScopedInput): Promise<InstallJob[]> =>
    ipcRenderer.invoke("genehub:list-pending-jobs", input),
  createInstallJob: (input: GeneHubCreateInstallJobInput): Promise<InstallJob> =>
    ipcRenderer.invoke("genehub:create-install-job", input),
  installJob: (jobId: string): Promise<GeneHubActionResult> =>
    ipcRenderer.invoke("genehub:install-job", jobId),
  updateSkill: (
    input: GeneHubProfileScopedInput & { geneSlug: string },
  ): Promise<GeneHubActionResult> => ipcRenderer.invoke("genehub:update-skill", input),
  uninstallSkill: (
    input: GeneHubProfileScopedInput & { geneSlug: string },
  ): Promise<GeneHubActionResult> => ipcRenderer.invoke("genehub:uninstall-skill", input),
  syncInstalledSkills: (input?: GeneHubProfileScopedInput): Promise<GeneHubActionResult> =>
    ipcRenderer.invoke("genehub:sync-installed-skills", input),
  getInstallLogs: (limit?: number): Promise<InstallLogEntry[]> =>
    ipcRenderer.invoke("genehub:get-install-logs", limit),
};
