import { ipcRenderer } from "electron";
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
  BrowserAuditRecord,
  PendingSensitiveAction
} from "../../shared/browser/browser-contract";

export interface AiosBrowserAPI {
  open(request: BrowserOpenRequest): Promise<BrowserOpenResult>;
  back(): Promise<BrowserActionResult>;
  forward(): Promise<BrowserActionResult>;
  reload(): Promise<BrowserActionResult>;
  getState(): Promise<BrowserStateResult>;
  screenshot(): Promise<BrowserScreenshotResult>;
  click(request: BrowserClickRequest): Promise<BrowserActionResult>;
  type(request: BrowserTypeRequest): Promise<BrowserActionResult>;
  extractTable(request: BrowserExtractTableRequest): Promise<BrowserActionResult>;
  getAuditLog(limit?: number): Promise<BrowserAuditRecord[]>;
  confirmAction(pendingActionId: string): Promise<BrowserActionResult>;
  rejectAction(pendingActionId: string): Promise<BrowserActionResult>;
  updateBounds(bounds: BrowserViewBounds): Promise<void>;
  onPendingAction(callback: (action: PendingSensitiveAction) => void): () => void;
  onAuditUpdate(callback: (record: BrowserAuditRecord) => void): () => void;
}

export const aiosBrowser: AiosBrowserAPI = {
  open: (request) => ipcRenderer.invoke("browser.open", { ...request, source: request.source ?? "user" }),
  back: () => ipcRenderer.invoke("browser.back", "user"),
  forward: () => ipcRenderer.invoke("browser.forward", "user"),
  reload: () => ipcRenderer.invoke("browser.reload", "user"),
  getState: () => ipcRenderer.invoke("browser.get_state", "user"),
  screenshot: () => ipcRenderer.invoke("browser.screenshot", "user"),
  click: (request) => ipcRenderer.invoke("browser.click", { ...request, source: request.source ?? "user" }),
  type: (request) => ipcRenderer.invoke("browser.type", { ...request, source: request.source ?? "user" }),
  extractTable: (request) => ipcRenderer.invoke("browser.extract_table", { ...request, source: request.source ?? "user" }),
  getAuditLog: (limit?) => ipcRenderer.invoke("browser.get_audit_log", limit),
  confirmAction: (pendingActionId) => ipcRenderer.invoke("browser.confirm_action", pendingActionId),
  rejectAction: (pendingActionId) => ipcRenderer.invoke("browser.reject_action", pendingActionId),
  updateBounds: (bounds) => ipcRenderer.invoke("browser.update_bounds", bounds),
  onPendingAction: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, action: PendingSensitiveAction): void => callback(action);
    ipcRenderer.on("browser.on_pending_action", handler);
    return () => ipcRenderer.removeListener("browser.on_pending_action", handler);
  },
  onAuditUpdate: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, record: BrowserAuditRecord): void => callback(record);
    ipcRenderer.on("browser.on_audit_update", handler);
    return () => ipcRenderer.removeListener("browser.on_audit_update", handler);
  }
};
