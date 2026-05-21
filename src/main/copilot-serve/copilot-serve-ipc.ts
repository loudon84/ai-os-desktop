import { BrowserWindow, ipcMain } from "electron";
import type { CopilotServeStatusChangeEvent } from "../../shared/copilot-serve/copilot-serve-contract";
import {
  getCopilotServeConnection,
  getCopilotServeLogs,
  getCopilotServeStatus,
  restartCopilotServeProcess,
  startCopilotServeProcess,
  stopCopilotServeProcess,
} from "./copilot-serve-process";

function emitStatusChanged(win: BrowserWindow | null): void {
  if (!win || win.isDestroyed()) return;
  const status = getCopilotServeStatus();
  const payload: CopilotServeStatusChangeEvent = {
    status: status.status,
    pid: status.pid,
    port: status.port,
    baseUrl: status.baseUrl,
    lastError: status.lastError,
    timestamp: new Date().toISOString(),
  };
  win.webContents.send("copilot-serve:status-changed", payload);
}

export function registerCopilotServeIpc(getWindow: () => BrowserWindow | null): void {
  ipcMain.handle("copilot-serve:get-connection", () => getCopilotServeConnection());
  ipcMain.handle("copilot-serve:get-status", () => getCopilotServeStatus());
  ipcMain.handle("copilot-serve:get-logs", (_event, options?: { tailLines?: number }) =>
    getCopilotServeLogs(options),
  );
  ipcMain.handle("copilot-serve:start", async () => {
    const status = await startCopilotServeProcess();
    emitStatusChanged(getWindow());
    return status;
  });
  ipcMain.handle("copilot-serve:stop", () => {
    const status = stopCopilotServeProcess();
    emitStatusChanged(getWindow());
    return status;
  });
  ipcMain.handle("copilot-serve:restart", async () => {
    const status = await restartCopilotServeProcess();
    emitStatusChanged(getWindow());
    return status;
  });
}
