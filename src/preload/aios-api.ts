import { ipcRenderer } from "electron";
import type { AiOsAPI, RuntimeStatusChangeEvent } from "../shared/aios/aios-contract";

export const aiosApi: AiOsAPI = {
  getRuntimeStatus: () => ipcRenderer.invoke("aios:get-runtime-status"),

  installAiOs: (options) => ipcRenderer.invoke("aios:install", options),

  startAiOs: () => ipcRenderer.invoke("aios:start"),

  stopAiOs: () => ipcRenderer.invoke("aios:stop"),

  restartAiOs: () => ipcRenderer.invoke("aios:restart"),

  openAiOsHome: () => ipcRenderer.invoke("aios:view:load-home"),

  reloadAiOsHome: () => ipcRenderer.invoke("aios:view:reload"),

  setAiOsViewBounds: (bounds) => ipcRenderer.invoke("aios:view:set-bounds", bounds),

  getAiOsLogs: (service, options?) => ipcRenderer.invoke("aios:get-logs", service, options),

  runDoctor: () => ipcRenderer.invoke("aios:doctor"),

  reconcile: () => ipcRenderer.invoke("aios:reconcile"),

  checkPorts: () => ipcRenderer.invoke("aios:check-ports"),

  onAiOsRuntimeChanged: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, data: RuntimeStatusChangeEvent) => callback(data);
    ipcRenderer.on("aios:runtime-changed", handler);
    return () => ipcRenderer.removeListener("aios:runtime-changed", handler);
  },
};
