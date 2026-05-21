import { ipcRenderer } from "electron";
import type {
  CopilotServeAPI,
  CopilotServeStatusChangeEvent,
} from "../shared/copilot-serve/copilot-serve-contract";

export const copilotServeApi: CopilotServeAPI = {
  getConnection: () => ipcRenderer.invoke("copilot-serve:get-connection"),
  getStatus: () => ipcRenderer.invoke("copilot-serve:get-status"),
  start: () => ipcRenderer.invoke("copilot-serve:start"),
  stop: () => ipcRenderer.invoke("copilot-serve:stop"),
  restart: () => ipcRenderer.invoke("copilot-serve:restart"),
  getLogs: (options) => ipcRenderer.invoke("copilot-serve:get-logs", options),
  onStatusChanged: (callback) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      data: CopilotServeStatusChangeEvent,
    ) => callback(data);
    ipcRenderer.on("copilot-serve:status-changed", handler);
    return () => ipcRenderer.removeListener("copilot-serve:status-changed", handler);
  },
};
