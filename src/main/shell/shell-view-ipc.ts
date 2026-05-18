import { ipcMain } from "electron";
import type { ShellViewManager } from "./views/shell-view-manager";
import type { ShellViewBoundsIPC } from "../../shared/shell/shell-view-contract";
import { ShellViewChannels } from "../../shared/shell/shell-view-contract";

export function registerShellViewIpc(svm: ShellViewManager): void {
  ipcMain.handle(
    ShellViewChannels.ACTIVATE,
    async (_event, layerId: string): Promise<void> => {
      if (!layerId || typeof layerId !== "string") {
        throw new Error(`Invalid layerId: ${layerId}`);
      }
      const view = svm.getView(layerId);
      if (!view) {
        throw new Error(`Layer not found: ${layerId}`);
      }
      svm.activateView(layerId);
    },
  );

  ipcMain.handle(
    ShellViewChannels.SET_BOUNDS,
    async (
      _event,
      layerId: string,
      bounds: ShellViewBoundsIPC,
    ): Promise<void> => {
      if (!layerId || typeof layerId !== "string") {
        throw new Error(`Invalid layerId: ${layerId}`);
      }
      if (
        !bounds ||
        typeof bounds.x !== "number" ||
        typeof bounds.y !== "number" ||
        typeof bounds.width !== "number" ||
        typeof bounds.height !== "number" ||
        bounds.width < 1 ||
        bounds.height < 1
      ) {
        throw new Error(
          "Invalid bounds: x/y must be numbers, width/height must be positive integers",
        );
      }
      const view = svm.getView(layerId);
      if (!view) {
        throw new Error(`Layer not found: ${layerId}`);
      }
      svm.activateView(layerId, bounds);
    },
  );

  ipcMain.handle(
    ShellViewChannels.HIDE,
    async (_event, layerId: string): Promise<void> => {
      if (!layerId || typeof layerId !== "string") {
        throw new Error(`Invalid layerId: ${layerId}`);
      }
      svm.deactivateView(layerId);
    },
  );

  console.log("[SHELL-IPC] ShellView IPC handlers registered");
}

export function destroyShellViews(): void {
  try {
    const { viewEventBus } = require("./views/view-events");
    viewEventBus.emit("destroy-all" as never);
  } catch {
    /* best effort */
  }
}
