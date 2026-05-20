import type { ShellViewManager } from "./views/shell-view-manager";
import { resolveAiosHomeUrl } from "../aios/aios-home-url";
import { beforeLoadAiosHome } from "../auth/token-header-injector";

let shellViewManagerRef: ShellViewManager | null = null;

export function bindShellViewManager(svm: ShellViewManager): void {
  shellViewManagerRef = svm;
}

export function unbindShellViewManager(): void {
  shellViewManagerRef = null;
}

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * Ensures aios-home WebContentsView exists and loads the current resolved URL.
 * Updates token injection policy before load.
 */
export async function refreshAiosHomeView(): Promise<void> {
  const svm = shellViewManagerRef;
  if (!svm) {
    return;
  }

  await beforeLoadAiosHome();
  const url = resolveAiosHomeUrl();
  const existing = svm.getView("aios-home");

  if (!existing) {
    await svm.createView("aios-home", "aios-home", url, {
      layer: "content",
    });
    console.log(`[aios-home-coordinator] Created aios-home view: ${url}`);
    svm.deactivateView("aios-home");
    return;
  }

  const webContents = existing.getWebContents?.();
  const currentUrl = webContents?.getURL?.() ?? "";
  const state = existing.getState?.() ?? "unknown";

  const shouldReload =
    !currentUrl ||
    currentUrl === "about:blank" ||
    currentUrl.startsWith("chrome-error://") ||
    normalizeUrl(currentUrl) !== normalizeUrl(url) ||
    state === "creating" ||
    state === "loading" ||
    state === "destroyed";

  if (shouldReload) {
    try {
      await existing.load?.(url);
      console.log(`[aios-home-coordinator] Reloaded aios-home view: ${url}`);
    } catch (err) {
      console.warn("[aios-home-coordinator] Failed to reload aios-home, recreating:", err);
      svm.destroyView?.("aios-home");
      await svm.createView("aios-home", "aios-home", url, {
        layer: "content",
      });
      console.log(`[aios-home-coordinator] Recreated aios-home view: ${url}`);
    }
  }

  // Keep hidden until Renderer WebContentsHost calls setBounds on main.
  svm.deactivateView("aios-home");
}
