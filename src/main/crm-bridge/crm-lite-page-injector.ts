import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { app, type WebContents } from "electron";
import { isOriginAllowed, getCrmBridgeConfig } from "./crm-bridge-config";
import type { BrowserViewPort } from "../browser/browser-viewport";
import type { ShellViewManager } from "../shell/views/shell-view-manager";
import { viewEventBus } from "../shell/views/view-events";
import { ensureWebOperatorBridgeHealth } from "./web-operator-bridge-health";

const injectedWebContentsIds = new Set<number>();
const bridgeReloadAttempted = new Set<number>();

let bridgeHealthContext: {
  shellViewManager: ShellViewManager;
  viewManager: BrowserViewPort;
} | null = null;

const BRIDGE_PROBE =
  "Boolean(window.CopilotDesktopCRM && typeof window.CopilotDesktopCRM.emit === 'function')";

export function setCrmBridgeHealthContext(
  shellViewManager: ShellViewManager,
  viewManager: BrowserViewPort,
): void {
  bridgeHealthContext = { shellViewManager, viewManager };
}

function bundledCrmLiteJssdkPath(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, "crm-bridge", "crm-lite-jssdk.js");
  }
  return join(app.getAppPath(), "resources", "crm-bridge", "crm-lite-jssdk.js");
}

function loadCrmLiteJssdkSource(): string | null {
  const path = bundledCrmLiteJssdkPath();
  if (!existsSync(path)) {
    console.warn("[CRM-BRIDGE] crm-lite-jssdk.js not found at", path);
    return null;
  }
  return readFileSync(path, "utf-8");
}

function isCrmLiteNavigationUrl(url: string): boolean {
  try {
    const origin = new URL(url).origin;
    const config = getCrmBridgeConfig();
    return isOriginAllowed(origin, config.allowedOrigins);
  } catch {
    return false;
  }
}

export function attachCrmLitePageInjector(webContents: WebContents): void {
  if (webContents.isDestroyed()) return;
  if (injectedWebContentsIds.has(webContents.id)) return;
  injectedWebContentsIds.add(webContents.id);

  webContents.on("destroyed", () => {
    injectedWebContentsIds.delete(webContents.id);
    bridgeReloadAttempted.delete(webContents.id);
  });

  webContents.on("did-finish-load", () => {
    void injectCrmLiteJssdkIfNeeded(webContents);
    void probeWebOperatorBridge(webContents);
  });
}

async function probeWebOperatorBridge(webContents: WebContents): Promise<void> {
  if (webContents.isDestroyed()) return;

  const url = webContents.getURL();
  if (!url || url === "about:blank" || !isCrmLiteNavigationUrl(url)) return;

  try {
    const ok = await webContents.executeJavaScript(BRIDGE_PROBE, true);
    if (ok) {
      console.log("[CRM-BRIDGE] CopilotDesktopCRM ready on", url);
      return;
    }

    console.warn("[CRM-BRIDGE] CopilotDesktopCRM missing after navigation:", url);

    if (!bridgeReloadAttempted.has(webContents.id)) {
      bridgeReloadAttempted.add(webContents.id);
      console.log("[CRM-BRIDGE] Reloading page once to retry preload...");
      webContents.reload();
      return;
    }

    if (bridgeHealthContext) {
      console.warn("[CRM-BRIDGE] Recreating web-operator view (sandbox:false + preload)...");
      await ensureWebOperatorBridgeHealth(
        bridgeHealthContext.shellViewManager,
        bridgeHealthContext.viewManager,
      );
    } else {
      console.warn("[CRM-BRIDGE] Bridge health context unavailable — restart copilot-desktop");
    }
  } catch (error) {
    console.warn("[CRM-BRIDGE] Bridge probe failed for", url, error);
  }
}

let injectorRegistered = false;

export function setupCrmLitePageInjector(viewManager: BrowserViewPort): void {
  if (injectorRegistered) return;
  injectorRegistered = true;

  const attachIfWebOperator = (): void => {
    const wc = viewManager.getExternalWebContents();
    if (wc) attachCrmLitePageInjector(wc);
  };

  viewEventBus.on("view:created", ({ kind }) => {
    if (kind === "web-operator") attachIfWebOperator();
  });

  attachIfWebOperator();
}

export async function injectCrmLiteJssdkIfNeeded(webContents: WebContents): Promise<void> {
  if (webContents.isDestroyed()) return;

  const url = webContents.getURL();
  if (!url || url === "about:blank") return;
  if (!isCrmLiteNavigationUrl(url)) return;

  const source = loadCrmLiteJssdkSource();
  if (!source) return;

  try {
    await webContents.executeJavaScript(source, true);
    console.log("[CRM-BRIDGE] Injected crm-lite-jssdk.js for", url);
  } catch (error) {
    console.warn("[CRM-BRIDGE] Failed to inject crm-lite-jssdk.js:", error);
  }
}
