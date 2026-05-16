import type {
  BrowserOpenRequest,
  BrowserOpenResult,
  BrowserActionResult,
  BrowserStateResult,
  BrowserScreenshotResult,
  BrowserClickRequest,
  BrowserTypeRequest,
  BrowserExtractTableRequest,
  BrowserAuditRecord,
  BrowserActionSource,
  PendingSensitiveAction
} from "../../shared/browser/browser-contract";
import { createBrowserError } from "../../shared/browser/browser-errors";
import { BrowserViewManager } from "./browser-view-manager";
import { BrowserSecurityGuard } from "./browser-security";
import { BrowserAuditLogger } from "./browser-audit";
import { PendingSensitiveAction as InternalPendingAction, PENDING_ACTION_TIMEOUT_MS } from "./browser-types";
import { randomUUID } from "crypto";

const GET_PAGE_STATE_SCRIPT = `
(function __get_page_state__() {
  const inputs = Array.from(document.querySelectorAll('input, textarea, select')).slice(0, 50).map((el, i) => ({
    index: i, tag: el.tagName.toLowerCase(), id: el.id || undefined, name: el.name || undefined,
    type: el.type || undefined, text: undefined, placeholder: el.placeholder || undefined,
    ariaLabel: el.getAttribute('aria-label') || undefined,
    selectorHint: el.id ? '#' + el.id : (el.name ? '[name="' + el.name + '"]' : undefined)
  }));
  const buttons = Array.from(document.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"]')).slice(0, 50).map((el, i) => ({
    index: i, tag: el.tagName.toLowerCase(), id: el.id || undefined, name: el.name || undefined,
    type: (el.type || undefined), text: (el.textContent || '').trim().slice(0, 100) || undefined,
    placeholder: undefined, ariaLabel: el.getAttribute('aria-label') || undefined,
    selectorHint: el.id ? '#' + el.id : (el.name ? '[name="' + el.name + '"]' : undefined)
  }));
  const links = Array.from(document.querySelectorAll('a[href]')).slice(0, 50).map(el => ({
    text: (el.textContent || '').trim().slice(0, 100), href: el.href,
    selectorHint: el.id ? '#' + el.id : undefined
  }));
  return { title: document.title, url: location.href, text: document.body?.innerText?.slice(0, 5000) || '', inputs, buttons, links };
})();
`;

const CLICK_SELECTOR_SCRIPT = (selector: string) => `
(function __click_selector__() {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return { ok: false, errorCode: 'SELECTOR_NOT_FOUND', message: 'Element not found' };
  el.click();
  return { ok: true };
})();
`;

const TYPE_SELECTOR_SCRIPT = (selector: string, text: string) => `
(function __type_selector__() {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return { ok: false, errorCode: 'SELECTOR_NOT_FOUND', message: 'Element not found' };
  el.focus();
  el.value = '';
  document.execCommand('insertText', false, ${JSON.stringify(text)});
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return { ok: true };
})();
`;

const EXTRACT_TABLE_SCRIPT = (selector: string) => `
(function __extract_table__() {
  const table = document.querySelector(${JSON.stringify(selector)});
  if (!table) return { ok: false, errorCode: 'SELECTOR_NOT_FOUND', message: 'Table not found' };
  const rows = Array.from(table.querySelectorAll('tr'));
  const data = rows.map(row => Array.from(row.querySelectorAll('td, th')).map(cell => cell.textContent?.trim() || ''));
  return { ok: true, data };
})();
`;

export class BrowserController {
  private viewManager: BrowserViewManager;
  private securityGuard: BrowserSecurityGuard;
  private auditLogger: BrowserAuditLogger;
  private pendingActions: Map<string, InternalPendingAction> = new Map();
  private pendingTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private mainWindow: Electron.BrowserWindow | null = null;

  constructor(
    viewManager: BrowserViewManager,
    securityGuard: BrowserSecurityGuard,
    auditLogger: BrowserAuditLogger
  ) {
    this.viewManager = viewManager;
    this.securityGuard = securityGuard;
    this.auditLogger = auditLogger;
  }

  setMainWindow(win: Electron.BrowserWindow): void {
    this.mainWindow = win;
  }

  private ensureReady(): BrowserActionResult | null {
    if (!this.viewManager.isReady()) {
      return createBrowserError("EXTERNAL_WEB_VIEW_NOT_READY");
    }
    return null;
  }

  private getCurrentUrl(): string {
    const wc = this.viewManager.getExternalWebContents();
    return wc?.getURL() ?? "";
  }

  async openExternalUrl(request: BrowserOpenRequest): Promise<BrowserOpenResult> {
    const securityResult = this.securityGuard.validateAction(request.url, "");
    if (!securityResult.allowed && securityResult.errorCode !== "UNSAFE_ACTION_REQUIRES_CONFIRMATION") {
      this.auditLogger.log({
        source: request.source, action: "browser.open", url: request.url,
        status: "blocked", errorCode: securityResult.errorCode, message: securityResult.message
      });
      return { ...createBrowserError(securityResult.errorCode!), message: securityResult.message };
    }

    try {
      await this.viewManager.createView(request.url);
      this.auditLogger.log({
        source: request.source, action: "browser.open", url: request.url, status: "success"
      });
      return { ok: true, url: request.url };
    } catch (err) {
      const msg = (err as Error).message;
      this.auditLogger.log({
        source: request.source, action: "browser.open", url: request.url,
        status: "failed", message: msg
      });
      return { ok: false, message: msg };
    }
  }

  async goBack(source: BrowserActionSource): Promise<BrowserActionResult> {
    const notReady = this.ensureReady();
    if (notReady) return notReady;

    const wc = this.viewManager.getExternalWebContents()!;
    const url = wc.getURL();
    try {
      wc.navigationHistory.goBack();
      this.auditLogger.log({ source, action: "browser.back", url, status: "success" });
      return { ok: true };
    } catch (err) {
      this.auditLogger.log({
        source, action: "browser.back", url, status: "failed", message: (err as Error).message
      });
      return { ok: false, message: (err as Error).message };
    }
  }

  async goForward(source: BrowserActionSource): Promise<BrowserActionResult> {
    const notReady = this.ensureReady();
    if (notReady) return notReady;

    const wc = this.viewManager.getExternalWebContents()!;
    const url = wc.getURL();
    try {
      wc.navigationHistory.goForward();
      this.auditLogger.log({ source, action: "browser.forward", url, status: "success" });
      return { ok: true };
    } catch (err) {
      this.auditLogger.log({
        source, action: "browser.forward", url, status: "failed", message: (err as Error).message
      });
      return { ok: false, message: (err as Error).message };
    }
  }

  async reload(source: BrowserActionSource): Promise<BrowserActionResult> {
    const notReady = this.ensureReady();
    if (notReady) return notReady;

    const wc = this.viewManager.getExternalWebContents()!;
    const url = wc.getURL();
    try {
      wc.reload();
      this.auditLogger.log({ source, action: "browser.reload", url, status: "success" });
      return { ok: true };
    } catch (err) {
      this.auditLogger.log({
        source, action: "browser.reload", url, status: "failed", message: (err as Error).message
      });
      return { ok: false, message: (err as Error).message };
    }
  }

  async getPageState(source: BrowserActionSource): Promise<BrowserStateResult> {
    const notReady = this.ensureReady();
    if (notReady) return { ...notReady };

    const wc = this.viewManager.getExternalWebContents()!;
    const url = wc.getURL();
    try {
      const state = await wc.executeJavaScript(GET_PAGE_STATE_SCRIPT);
      this.auditLogger.log({ source, action: "browser.get_state", url, status: "success" });
      return { ok: true, state };
    } catch (err) {
      this.auditLogger.log({
        source, action: "browser.get_state", url, status: "failed",
        errorCode: "JAVASCRIPT_EXECUTION_FAILED", message: (err as Error).message
      });
      return createBrowserError("JAVASCRIPT_EXECUTION_FAILED", { message: (err as Error).message });
    }
  }

  async captureScreenshot(source: BrowserActionSource): Promise<BrowserScreenshotResult> {
    const notReady = this.ensureReady();
    if (notReady) return { ...notReady };

    const wc = this.viewManager.getExternalWebContents()!;
    const url = wc.getURL();
    try {
      const image = await wc.capturePage();
      const base64 = image.toPNG().toString("base64");
      this.auditLogger.log({ source, action: "browser.screenshot", url, status: "success" });
      return { ok: true, mimeType: "image/png", base64 };
    } catch (err) {
      this.auditLogger.log({
        source, action: "browser.screenshot", url, status: "failed",
        errorCode: "SCREENSHOT_FAILED", message: (err as Error).message
      });
      return createBrowserError("SCREENSHOT_FAILED", { message: (err as Error).message });
    }
  }

  async clickSelector(request: BrowserClickRequest): Promise<BrowserActionResult> {
    const notReady = this.ensureReady();
    if (notReady) return notReady;

    const url = this.getCurrentUrl();
    const securityResult = this.securityGuard.validateAction(url, request.selector);
    if (!securityResult.allowed) {
      if (securityResult.isSensitiveAction) {
        return this.handleSensitiveAction(request.selector, "browser.click", url, request.source, { selector: request.selector });
      }
      this.auditLogger.log({
        source: request.source, action: "browser.click", url,
        status: "blocked", errorCode: securityResult.errorCode, message: securityResult.message
      });
      return createBrowserError(securityResult.errorCode!, { message: securityResult.message });
    }

    return this.executeClick(request.selector, request.source, url);
  }

  private async executeClick(selector: string, source: BrowserActionSource, url: string): Promise<BrowserActionResult> {
    const wc = this.viewManager.getExternalWebContents()!;
    try {
      const result = await wc.executeJavaScript(CLICK_SELECTOR_SCRIPT(selector));
      if (!result.ok) {
        this.auditLogger.log({
          source, action: "browser.click", url, status: "failed",
          errorCode: result.errorCode, message: result.message
        });
        return createBrowserError(result.errorCode, { message: result.message });
      }
      this.auditLogger.log({
        source, action: "browser.click", url, status: "success",
        argsSummary: { selector }
      });
      return { ok: true };
    } catch (err) {
      this.auditLogger.log({
        source, action: "browser.click", url, status: "failed",
        errorCode: "JAVASCRIPT_EXECUTION_FAILED", message: (err as Error).message
      });
      return createBrowserError("JAVASCRIPT_EXECUTION_FAILED", { message: (err as Error).message });
    }
  }

  async typeIntoSelector(request: BrowserTypeRequest): Promise<BrowserActionResult> {
    const notReady = this.ensureReady();
    if (notReady) return notReady;

    const url = this.getCurrentUrl();
    if (this.securityGuard.isPasswordField(request.selector)) {
      this.auditLogger.log({
        source: request.source, action: "browser.type", url,
        status: "blocked", errorCode: "PASSWORD_FIELD_BLOCKED"
      });
      return createBrowserError("PASSWORD_FIELD_BLOCKED");
    }

    const securityResult = this.securityGuard.validateAction(url, request.selector, { isTypeAction: true });
    if (!securityResult.allowed && !securityResult.isSensitiveAction) {
      this.auditLogger.log({
        source: request.source, action: "browser.type", url,
        status: "blocked", errorCode: securityResult.errorCode, message: securityResult.message
      });
      return createBrowserError(securityResult.errorCode!, { message: securityResult.message });
    }

    if (securityResult.isSensitiveAction) {
      return this.handleSensitiveAction(request.selector, "browser.type", url, request.source, { selector: request.selector, textLength: request.text.length });
    }

    return this.executeType(request.selector, request.text, request.source, url);
  }

  private async executeType(selector: string, text: string, source: BrowserActionSource, url: string): Promise<BrowserActionResult> {
    const wc = this.viewManager.getExternalWebContents()!;
    try {
      const result = await wc.executeJavaScript(TYPE_SELECTOR_SCRIPT(selector, text));
      if (!result.ok) {
        this.auditLogger.log({
          source, action: "browser.type", url, status: "failed",
          errorCode: result.errorCode, message: result.message
        });
        return createBrowserError(result.errorCode, { message: result.message });
      }
      this.auditLogger.log({
        source, action: "browser.type", url, status: "success",
        argsSummary: this.auditLogger.sanitizeTypeArgs(text)
      });
      return { ok: true };
    } catch (err) {
      this.auditLogger.log({
        source, action: "browser.type", url, status: "failed",
        errorCode: "JAVASCRIPT_EXECUTION_FAILED", message: (err as Error).message
      });
      return createBrowserError("JAVASCRIPT_EXECUTION_FAILED", { message: (err as Error).message });
    }
  }

  async extractTable(request: BrowserExtractTableRequest): Promise<BrowserActionResult> {
    const notReady = this.ensureReady();
    if (notReady) return notReady;

    const url = this.getCurrentUrl();
    const wc = this.viewManager.getExternalWebContents()!;
    try {
      const result = await wc.executeJavaScript(EXTRACT_TABLE_SCRIPT(request.selector));
      if (!result.ok) {
        this.auditLogger.log({
          source: request.source, action: "browser.extract_table", url, status: "failed",
          errorCode: result.errorCode, message: result.message
        });
        return createBrowserError(result.errorCode, { message: result.message });
      }
      this.auditLogger.log({
        source: request.source, action: "browser.extract_table", url, status: "success",
        argsSummary: { selector: request.selector }
      });
      return { ok: true, message: JSON.stringify(result.data) };
    } catch (err) {
      this.auditLogger.log({
        source: request.source, action: "browser.extract_table", url, status: "failed",
        errorCode: "JAVASCRIPT_EXECUTION_FAILED", message: (err as Error).message
      });
      return createBrowserError("JAVASCRIPT_EXECUTION_FAILED", { message: (err as Error).message });
    }
  }

  getAuditLog(limit?: number): BrowserAuditRecord[] {
    return this.auditLogger.query(limit);
  }

  private handleSensitiveAction(
    selector: string,
    action: string,
    url: string,
    source: BrowserActionSource,
    params: Record<string, unknown>
  ): BrowserActionResult {
    const pendingActionId = randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + PENDING_ACTION_TIMEOUT_MS);

    const pending: InternalPendingAction = {
      pendingActionId,
      action,
      selector,
      url,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      originalParams: params
    };

    this.pendingActions.set(pendingActionId, pending);

    const timeout = setTimeout(() => {
      this.pendingActions.delete(pendingActionId);
      this.pendingTimeouts.delete(pendingActionId);
      this.auditLogger.log({
        source, action: action as BrowserActionName, url,
        status: "timeout", message: "Pending action expired"
      });
    }, PENDING_ACTION_TIMEOUT_MS);
    this.pendingTimeouts.set(pendingActionId, timeout);

    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send("browser.on_pending_action", {
        pendingActionId,
        action,
        selector,
        url,
        createdAt: pending.createdAt,
        expiresAt: pending.expiresAt,
        originalParams: params
      } as PendingSensitiveAction);
    }

    this.auditLogger.log({
      source, action: action as BrowserActionName, url,
      status: "blocked",
      errorCode: "UNSAFE_ACTION_REQUIRES_CONFIRMATION",
      argsSummary: { pendingActionId, selector }
    });

    return createBrowserError("UNSAFE_ACTION_REQUIRES_CONFIRMATION");
  }

  async confirmAction(pendingActionId: string): Promise<BrowserActionResult> {
    const pending = this.pendingActions.get(pendingActionId);
    if (!pending) {
      return { ok: false, message: "Pending action not found or expired" };
    }

    const timeout = this.pendingTimeouts.get(pendingActionId);
    if (timeout) clearTimeout(timeout);
    this.pendingActions.delete(pendingActionId);
    this.pendingTimeouts.delete(pendingActionId);

    if (pending.action === "browser.click") {
      const result = await this.executeClick(pending.selector, "user", pending.url);
      this.auditLogger.log({
        source: "user", action: "browser.click", url: pending.url,
        status: result.ok ? "confirmed" : "failed", message: "User confirmed sensitive click"
      });
      return result;
    }

    if (pending.action === "browser.type") {
      const text = (pending.originalParams.text as string) ?? "";
      const result = await this.executeType(pending.selector, text, "user", pending.url);
      this.auditLogger.log({
        source: "user", action: "browser.type", url: pending.url,
        status: result.ok ? "confirmed" : "failed", message: "User confirmed sensitive type"
      });
      return result;
    }

    this.auditLogger.log({
      source: "user", action: pending.action as BrowserActionName, url: pending.url,
      status: "confirmed", message: "User confirmed action"
    });
    return { ok: true };
  }

  async rejectAction(pendingActionId: string): Promise<BrowserActionResult> {
    const pending = this.pendingActions.get(pendingActionId);
    if (!pending) {
      return { ok: false, message: "Pending action not found or expired" };
    }

    const timeout = this.pendingTimeouts.get(pendingActionId);
    if (timeout) clearTimeout(timeout);
    this.pendingActions.delete(pendingActionId);
    this.pendingTimeouts.delete(pendingActionId);

    this.auditLogger.log({
      source: "user", action: pending.action as BrowserActionName, url: pending.url,
      status: "rejected", message: "User rejected action"
    });
    return { ok: true, message: "Action rejected" };
  }
}
