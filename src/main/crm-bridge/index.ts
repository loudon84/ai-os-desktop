import type { BrowserWindow } from "electron";
import type { BrowserController } from "../browser/browser-controller";
import type { BrowserViewPort } from "../browser/browser-viewport";
import type { ShellViewManager } from "../shell/views/shell-view-manager";
import { CrmBridgeIPC } from "./crm-bridge-ipc";
import { getCrmBridgeConfig } from "./crm-bridge-config";
import { setupCrmLitePageInjector, setCrmBridgeHealthContext } from "./crm-lite-page-injector";
import { registerWebOperatorCrmPreloadSession } from "./register-web-operator-preload";
import { ensureWebOperatorBridgeHealth } from "./web-operator-bridge-health";

let crmBridgeIPC: CrmBridgeIPC | null = null;

export function setupCrmBridge(
  controller: BrowserController,
  viewManager: BrowserViewPort,
  mainWindow: BrowserWindow,
  shellViewManager?: ShellViewManager,
): void {
  const config = getCrmBridgeConfig();
  if (!config.enabled) {
    console.log("[CRM-BRIDGE] Disabled by configuration");
    return;
  }

  registerWebOperatorCrmPreloadSession();

  crmBridgeIPC = new CrmBridgeIPC(
    controller,
    viewManager,
    () => (mainWindow.isDestroyed() ? null : mainWindow),
  );
  crmBridgeIPC.register();
  setupCrmLitePageInjector(viewManager);

  if (shellViewManager) {
    setCrmBridgeHealthContext(shellViewManager, viewManager);
    void ensureWebOperatorBridgeHealth(shellViewManager, viewManager);
  }

  console.log("[CRM-BRIDGE] IPC registered");
}

export function teardownCrmBridge(): void {
  crmBridgeIPC?.unregister();
  crmBridgeIPC = null;
}

export { getCrmBridgeConfig, reloadCrmBridgeConfig } from "./crm-bridge-config";
