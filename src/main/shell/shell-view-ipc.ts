import { ipcMain } from "electron";
import type { ShellViewManager } from "./views/shell-view-manager";
import type { ShellViewBoundsIPC } from "../../shared/shell/shell-view-contract";
import { ShellViewChannels } from "../../shared/shell/shell-view-contract";
import { getAiOsEnvConfig } from "../aios/aios-config";

function getAiOsHomeUrl(): string {
  const config = getAiOsEnvConfig();
  return `http://127.0.0.1:${config.frontendPort}/zh`;
}

async function ensureAiosHomeView(svm: ShellViewManager): Promise<void> {
  const url = getAiOsHomeUrl();
  const existing = svm.getView("aios-home");

  if (!existing) {
    // Create view if not exists
    await svm.createView("aios-home", "aios-home", url, {
      layer: "content",
    });
    console.log(`[SHELL-IPC] Lazy created aios-home view: ${url}`);
    return;
  }

  // Check if view needs reload
  const webContents = existing.getWebContents?.();
  const currentUrl = webContents?.getURL?.() ?? "";
  const state = existing.getState?.() ?? "unknown";

  const shouldReload =
    !currentUrl ||
    currentUrl === "about:blank" ||
    currentUrl.startsWith("chrome-error://") ||
    state === "creating" ||
    state === "loading" ||
    state === "destroyed";

  if (shouldReload) {
    try {
      await existing.load?.(url);
      console.log(`[SHELL-IPC] Reloaded aios-home view: ${url}`);
    } catch (err) {
      console.warn("[SHELL-IPC] Failed to reload aios-home, recreating:", err);
      // Destroy and recreate
      svm.destroyView?.("aios-home");
      await svm.createView("aios-home", "aios-home", url, {
        layer: "content",
      });
      console.log(`[SHELL-IPC] Recreated aios-home view: ${url}`);
    }
  }
}

async function ensureKnownView(svm: ShellViewManager, layerId: string): Promise<void> {
  if (layerId === "aios-home") {
    await ensureAiosHomeView(svm);
    return;
  }

  if (!svm.getView(layerId)) {
    throw new Error(`Layer not found: ${layerId}`);
  }
}

export function registerShellViewIpc(svm: ShellViewManager): void {
  ipcMain.handle(
    ShellViewChannels.ACTIVATE,
    async (_event, layerId: string): Promise<void> => {
      if (!layerId || typeof layerId !== "string") {
        throw new Error(`Invalid layerId: ${layerId}`);
      }

      await ensureKnownView(svm, layerId);
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

      await ensureKnownView(svm, layerId);
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
