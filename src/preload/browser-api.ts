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
  PendingSensitiveAction,
  BrowserOpenedEvent,
  BrowserFrameSnapshot,
  BrowserPageSnapshot,
  BrowserSnapshotOptions,
  BrowserElementTarget,
  BrowserElementSnapshot,
} from "../shared/browser/browser-contract";
import { BrowserEvents, BrowserV57Events } from "../shared/browser/browser-contract";
import type {
  BrowserRuntimeState,
  BrowserStructuredActionResult,
  BrowserTypeOptions,
  BrowserScrollOptions,
  BrowserScreenshotOptions,
  BrowserStructuredScreenshotResult,
  BrowserActionLogEntry,
} from "../shared/browser/browser-action-contract";
import type {
  BrowserFrameHtmlRequest,
  BrowserFrameHtmlResult,
} from "../shared/browser/browser-frame-contract";
import type {
  CrmBridgeOnEventPayload,
  CrmBridgeStoredEvent,
  CrmBridgeResult,
  CrmDesktopCommand,
} from "../shared/crm-bridge";
import { CrmBridgeEvents } from "../shared/crm-bridge";

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
  onOpened(callback: (event: BrowserOpenedEvent) => void): () => void;

  /** v5.7 — structured browser runtime state */
  getRuntimeState(): Promise<BrowserRuntimeState>;
  listFrames(): Promise<BrowserFrameSnapshot[]>;
  snapshot(options?: BrowserSnapshotOptions): Promise<BrowserPageSnapshot>;
  findElement(target: BrowserElementTarget): Promise<BrowserElementSnapshot | null>;
  clickElement(target: BrowserElementTarget): Promise<BrowserStructuredActionResult>;
  typeElement(
    target: BrowserElementTarget,
    text: string,
    options?: BrowserTypeOptions,
  ): Promise<BrowserStructuredActionResult>;
  selectOption(
    target: BrowserElementTarget,
    value: string,
  ): Promise<BrowserStructuredActionResult>;
  scroll(options: BrowserScrollOptions): Promise<BrowserStructuredActionResult>;
  screenshotV2(options?: BrowserScreenshotOptions): Promise<BrowserStructuredScreenshotResult | null>;
  getFrameHtml(target: BrowserFrameHtmlRequest): Promise<BrowserFrameHtmlResult>;
  getActionLogs(limit?: number): Promise<BrowserActionLogEntry[]>;
  clearActionLogs(): Promise<{ ok: boolean }>;
  onStateChanged(callback: (state: BrowserRuntimeState) => void): () => void;
  onActionLogged(callback: (log: BrowserActionLogEntry) => void): () => void;

  /** v5.7.1 — CRM desktop bridge */
  listCrmEvents(limit?: number): Promise<CrmBridgeStoredEvent[]>;
  getLastCrmEvent(): Promise<CrmBridgeStoredEvent | null>;
  sendCrmCommand(command: CrmDesktopCommand): Promise<CrmBridgeResult>;
  onCrmEvent(callback: (payload: CrmBridgeOnEventPayload) => void): () => void;
}

export const aiosBrowser: AiosBrowserAPI = {
  open: (request) =>
    ipcRenderer.invoke("browser.open", { ...request, source: request.source ?? "user" }),
  back: () => ipcRenderer.invoke("browser.back", "user"),
  forward: () => ipcRenderer.invoke("browser.forward", "user"),
  reload: () => ipcRenderer.invoke("browser.reload", "user"),
  getState: () => ipcRenderer.invoke("browser.get_state", "user"),
  screenshot: () => ipcRenderer.invoke("browser.screenshot", "user"),
  click: (request) =>
    ipcRenderer.invoke("browser.click", { ...request, source: request.source ?? "user" }),
  type: (request) =>
    ipcRenderer.invoke("browser.type", { ...request, source: request.source ?? "user" }),
  extractTable: (request) =>
    ipcRenderer.invoke("browser.extract_table", { ...request, source: request.source ?? "user" }),
  getAuditLog: (limit?) => ipcRenderer.invoke("browser.get_audit_log", limit),
  confirmAction: (pendingActionId) => ipcRenderer.invoke("browser.confirm_action", pendingActionId),
  rejectAction: (pendingActionId) => ipcRenderer.invoke("browser.reject_action", pendingActionId),
  updateBounds: (bounds) => ipcRenderer.invoke("browser.update_bounds", bounds),
  onPendingAction: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, action: PendingSensitiveAction): void =>
      callback(action);
    ipcRenderer.on("browser.on_pending_action", handler);
    return () => ipcRenderer.removeListener("browser.on_pending_action", handler);
  },
  onAuditUpdate: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, record: BrowserAuditRecord): void =>
      callback(record);
    ipcRenderer.on("browser.on_audit_update", handler);
    return () => ipcRenderer.removeListener("browser.on_audit_update", handler);
  },
  onOpened: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: BrowserOpenedEvent): void => {
      callback(payload);
    };
    ipcRenderer.on(BrowserEvents.OPENED, handler);
    return () => ipcRenderer.removeListener(BrowserEvents.OPENED, handler);
  },

  getRuntimeState: () => ipcRenderer.invoke("browser:get-state"),
  listFrames: () => ipcRenderer.invoke("browser:list-frames"),
  snapshot: (options?) => ipcRenderer.invoke("browser:snapshot", options),
  findElement: (target) => ipcRenderer.invoke("browser:find-element", target),
  clickElement: (target) => ipcRenderer.invoke("browser:click-element", target),
  typeElement: (target, text, options?) =>
    ipcRenderer.invoke("browser:type-element", { target, text, options }),
  selectOption: (target, value) =>
    ipcRenderer.invoke("browser:select-option", { target, value }),
  scroll: (options) => ipcRenderer.invoke("browser:scroll", options),
  screenshotV2: (options?) => ipcRenderer.invoke("browser:screenshot-v2", options),
  getFrameHtml: (target) => ipcRenderer.invoke("browser:get-frame-html", target),
  getActionLogs: (limit?) => ipcRenderer.invoke("browser:action-logs", limit),
  clearActionLogs: () => ipcRenderer.invoke("browser:clear-action-logs"),
  onStateChanged: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, state: BrowserRuntimeState): void =>
      callback(state);
    ipcRenderer.on(BrowserV57Events.STATE_CHANGED, handler);
    return () => ipcRenderer.removeListener(BrowserV57Events.STATE_CHANGED, handler);
  },
  onActionLogged: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, log: BrowserActionLogEntry): void =>
      callback(log);
    ipcRenderer.on(BrowserV57Events.ACTION_LOGGED, handler);
    return () => ipcRenderer.removeListener(BrowserV57Events.ACTION_LOGGED, handler);
  },

  listCrmEvents: (limit?) => ipcRenderer.invoke("crm-bridge:list-events", limit),
  getLastCrmEvent: () => ipcRenderer.invoke("crm-bridge:get-last-event"),
  sendCrmCommand: (command) => ipcRenderer.invoke("crm-bridge:send-command", command),
  onCrmEvent: (callback) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      payload: CrmBridgeOnEventPayload,
    ): void => callback(payload);
    ipcRenderer.on(CrmBridgeEvents.ON_EVENT, handler);
    return () => ipcRenderer.removeListener(CrmBridgeEvents.ON_EVENT, handler);
  },
};
