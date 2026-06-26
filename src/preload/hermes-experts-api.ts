import { ipcRenderer } from "electron";
import type { HermesExpertsAPI } from "../shared/hermes-experts/hermes-experts-contract";

export const hermesExpertsApi: HermesExpertsAPI = {
  listExpertCatalog: (input) => ipcRenderer.invoke("hermes-experts:list-catalog", input),
  getExpert: (expertId) => ipcRenderer.invoke("hermes-experts:get-expert", expertId),
  listExpertTeams: (input) => ipcRenderer.invoke("hermes-experts:list-teams", input),
  getExpertTeam: (teamId) => ipcRenderer.invoke("hermes-experts:get-team", teamId),
  previewInstallExpert: (expertId) =>
    ipcRenderer.invoke("hermes-experts:preview-install-expert", expertId),
  installExpert: (expertId, options) =>
    ipcRenderer.invoke("hermes-experts:install-expert", expertId, options),
  previewInstallTeam: (teamId) => ipcRenderer.invoke("hermes-experts:preview-install-team", teamId),
  installTeam: (teamId, options) =>
    ipcRenderer.invoke("hermes-experts:install-team", teamId, options),
  summonExpert: (input) => ipcRenderer.invoke("hermes-experts:summon-expert", input),
  summonTeam: (input) => ipcRenderer.invoke("hermes-experts:summon-team", input),
  listExpertRuns: (filter) => ipcRenderer.invoke("hermes-experts:list-runs", filter),
  getExpertRun: (runId) => ipcRenderer.invoke("hermes-experts:get-run", runId),
  cancelExpertRun: (runId) => ipcRenderer.invoke("hermes-experts:cancel-run", runId),
  retryExpertRun: (runId) => ipcRenderer.invoke("hermes-experts:retry-run", runId),
  setExpertTrust: (expertId, trustStatus) =>
    ipcRenderer.invoke("hermes-experts:set-trust", expertId, trustStatus),
  preflightExpert: (profileId, port) =>
    ipcRenderer.invoke("hermes-experts:preflight", profileId, port),
  dispatchTeam: (input) => ipcRenderer.invoke("hermes-experts:dispatch-team", input),
  getDesktopSyncStatus: () => ipcRenderer.invoke("hermes-experts:get-desktop-sync-status"),
  registerDesktop: () => ipcRenderer.invoke("hermes-experts:register-desktop"),
  onExpertRuntimeEvent: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: Parameters<typeof callback>[0]) =>
      callback(payload);
    ipcRenderer.on("hermes-experts:event", handler);
    return () => ipcRenderer.removeListener("hermes-experts:event", handler);
  },
};
