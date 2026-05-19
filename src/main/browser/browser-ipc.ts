import { ipcMain } from "electron";
import type {
  BrowserOpenRequest,
  BrowserClickRequest,
  BrowserTypeRequest,
  BrowserExtractTableRequest,
  BrowserViewBounds,
  BrowserActionResult,
  BrowserOpenResult,
  BrowserStateResult,
  BrowserScreenshotResult,
  BrowserAuditRecord
} from "../../shared/browser/browser-contract";
import { BrowserController } from "./browser-controller";
import type { BrowserViewPort } from "./browser-viewport";

export class BrowserIPC {
  private controller: BrowserController;
  private viewManager: BrowserViewPort;
  private registered: boolean = false;

  constructor(controller: BrowserController, viewManager: BrowserViewPort) {
    this.controller = controller;
    this.viewManager = viewManager;
  }

  register(): void {
    if (this.registered) return;

    ipcMain.handle("browser.open", async (_event, request: BrowserOpenRequest): Promise<BrowserOpenResult> => {
      try {
        return await this.controller.openExternalUrl(request);
      } catch (err) {
        return { ok: false, message: (err as Error).message };
      }
    });

    ipcMain.handle("browser.back", async (_event, source: "user" | "hermes" | "system" = "user"): Promise<BrowserActionResult> => {
      try {
        return await this.controller.goBack(source);
      } catch (err) {
        return { ok: false, message: (err as Error).message };
      }
    });

    ipcMain.handle("browser.forward", async (_event, source: "user" | "hermes" | "system" = "user"): Promise<BrowserActionResult> => {
      try {
        return await this.controller.goForward(source);
      } catch (err) {
        return { ok: false, message: (err as Error).message };
      }
    });

    ipcMain.handle("browser.reload", async (_event, source: "user" | "hermes" | "system" = "user"): Promise<BrowserActionResult> => {
      try {
        return await this.controller.reload(source);
      } catch (err) {
        return { ok: false, message: (err as Error).message };
      }
    });

    ipcMain.handle("browser.get_state", async (_event, source: "user" | "hermes" | "system" = "user"): Promise<BrowserStateResult> => {
      try {
        return await this.controller.getPageState(source);
      } catch (err) {
        return { ok: false, message: (err as Error).message };
      }
    });

    ipcMain.handle("browser.screenshot", async (_event, source: "user" | "hermes" | "system" = "user"): Promise<BrowserScreenshotResult> => {
      try {
        return await this.controller.captureScreenshot(source);
      } catch (err) {
        return { ok: false, message: (err as Error).message };
      }
    });

    ipcMain.handle("browser.click", async (_event, request: BrowserClickRequest): Promise<BrowserActionResult> => {
      try {
        return await this.controller.clickSelector(request);
      } catch (err) {
        return { ok: false, message: (err as Error).message };
      }
    });

    ipcMain.handle("browser.type", async (_event, request: BrowserTypeRequest): Promise<BrowserActionResult> => {
      try {
        return await this.controller.typeIntoSelector(request);
      } catch (err) {
        return { ok: false, message: (err as Error).message };
      }
    });

    ipcMain.handle("browser.extract_table", async (_event, request: BrowserExtractTableRequest): Promise<BrowserActionResult> => {
      try {
        return await this.controller.extractTable(request);
      } catch (err) {
        return { ok: false, message: (err as Error).message };
      }
    });

    ipcMain.handle("browser.get_audit_log", async (_event, limit?: number): Promise<BrowserAuditRecord[]> => {
      try {
        return this.controller.getAuditLog(limit);
      } catch {
        return [];
      }
    });

    ipcMain.handle("browser.confirm_action", async (_event, pendingActionId: string): Promise<BrowserActionResult> => {
      try {
        return await this.controller.confirmAction(pendingActionId);
      } catch (err) {
        return { ok: false, message: (err as Error).message };
      }
    });

    ipcMain.handle("browser.reject_action", async (_event, pendingActionId: string): Promise<BrowserActionResult> => {
      try {
        return await this.controller.rejectAction(pendingActionId);
      } catch (err) {
        return { ok: false, message: (err as Error).message };
      }
    });

    ipcMain.handle("browser.update_bounds", async (_event, bounds: BrowserViewBounds): Promise<void> => {
      this.viewManager.updateBounds(bounds);
    });

    this.registered = true;
  }

  unregister(): void {
    if (!this.registered) return;
    const channels = [
      "browser.open", "browser.back", "browser.forward", "browser.reload",
      "browser.get_state", "browser.screenshot", "browser.click", "browser.type",
      "browser.extract_table", "browser.get_audit_log",
      "browser.confirm_action", "browser.reject_action", "browser.update_bounds"
    ];
    for (const ch of channels) {
      ipcMain.removeHandler(ch);
    }
    this.registered = false;
  }
}
