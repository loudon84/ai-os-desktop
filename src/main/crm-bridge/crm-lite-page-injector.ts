import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { app, type WebContents } from "electron";
import { isOriginAllowed, getCrmBridgeConfig } from "./crm-bridge-config";
import type { BrowserViewPort } from "../browser/browser-viewport";
import { viewEventBus } from "../shell/views/view-events";

const injectedWebContentsIds = new Set<number>();

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
  });

  webContents.on("did-finish-load", () => {
    void injectCrmLiteJssdkIfNeeded(webContents);
  });
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
