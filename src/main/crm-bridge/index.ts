import type { BrowserWindow } from "electron";
import type { BrowserController } from "../browser/browser-controller";
import type { BrowserViewPort } from "../browser/browser-viewport";
import { CrmBridgeIPC } from "./crm-bridge-ipc";
import { getCrmBridgeConfig } from "./crm-bridge-config";
import { setupCrmLitePageInjector } from "./crm-lite-page-injector";

let crmBridgeIPC: CrmBridgeIPC | null = null;

export function setupCrmBridge(
  controller: BrowserController,
  viewManager: BrowserViewPort,
  mainWindow: BrowserWindow,
): void {
  const config = getCrmBridgeConfig();
  if (!config.enabled) {
    console.log("[CRM-BRIDGE] Disabled by configuration");
    return;
  }

  crmBridgeIPC = new CrmBridgeIPC(
    controller,
    viewManager,
    () => (mainWindow.isDestroyed() ? null : mainWindow),
  );
  crmBridgeIPC.register();
  setupCrmLitePageInjector(viewManager);
  console.log("[CRM-BRIDGE] IPC registered");
}

export function teardownCrmBridge(): void {
  crmBridgeIPC?.unregister();
  crmBridgeIPC = null;
}

export { getCrmBridgeConfig, reloadCrmBridgeConfig } from "./crm-bridge-config";
