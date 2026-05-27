import { randomUUID } from "crypto";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import type { WebContents } from "electron";
import type { BrowserViewPort } from "./browser-viewport";
import type {
  BrowserActionType,
  BrowserStructuredActionResult,
  BrowserRuntimeState,
  BrowserTypeOptions,
  BrowserScrollOptions,
  BrowserScreenshotOptions,
  BrowserStructuredScreenshotResult,
  BrowserActionError,
  BrowserActionErrorCode,
} from "../../shared/browser/browser-action-contract";
import { BrowserV57Events } from "../../shared/browser/browser-action-contract";
import type { BrowserElementTarget } from "../../shared/browser/browser-snapshot-contract";
import type { BrowserPageSnapshot, BrowserElementSnapshot } from "../../shared/browser/browser-snapshot-contract";
import type { BrowserFrameSnapshot } from "../../shared/browser/browser-frame-contract";
import { BrowserFrameInspector } from "./browser-frame-inspector";
import { BrowserCoordinateResolver } from "./browser-coordinate-resolver";
import { BrowserDomSnapshot } from "./browser-dom-snapshot";
import { BrowserElementLocator } from "./browser-element-locator";
import { BrowserActionLogStore } from "./browser-action-log-store";
import { profileHome } from "../utils";

function actionError(
  code: BrowserActionErrorCode,
  message: string,
  detail?: unknown,
): BrowserActionError {
  return { code, message, detail };
}

function wrapResult(
  action: BrowserActionType,
  startedAt: number,
  partial: Omit<BrowserStructuredActionResult, "action" | "startedAt" | "finishedAt" | "durationMs" | "ok"> & {
    ok: boolean;
  },
): BrowserStructuredActionResult {
  const finishedAt = Date.now();
  return {
    ok: partial.ok,
    action,
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: new Date(finishedAt).toISOString(),
    durationMs: finishedAt - startedAt,
    url: partial.url,
    title: partial.title,
    frameId: partial.frameId,
    selector: partial.selector,
    target: partial.target,
    rect: partial.rect,
    screenshotId: partial.screenshotId,
    error: partial.error,
  };
}

const CLICK_IN_FRAME_SCRIPT = (selector: string | null, localIndex: number | null) => `
(function() {
  var el = ${selector ? `document.querySelector(${JSON.stringify(selector)})` : "null"};
  if (!el && ${localIndex !== null ? String(localIndex) : "null"} !== null) {
    var selector = 'a[href], button, input, textarea, select, [role], [aria-label], [contenteditable="true"]';
    var nodes = Array.from(document.querySelectorAll(selector));
    el = nodes[${localIndex ?? 0}];
  }
  if (!el) return { ok: false, code: 'ELEMENT_NOT_FOUND', message: 'Element not found' };
  var style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') return { ok: false, code: 'ELEMENT_NOT_VISIBLE', message: 'Element not visible' };
  if (el.disabled) return { ok: false, code: 'ELEMENT_DISABLED', message: 'Element disabled' };
  el.click();
  return { ok: true };
})()
`;

const TYPE_IN_FRAME_SCRIPT = (
  selector: string | null,
  localIndex: number | null,
  text: string,
  clear: boolean,
) => `
(function() {
  var el = ${selector ? `document.querySelector(${JSON.stringify(selector)})` : "null"};
  if (!el && ${localIndex !== null ? String(localIndex) : "null"} !== null) {
    var sel = 'a[href], button, input, textarea, select, [role], [aria-label], [contenteditable="true"]';
    var nodes = Array.from(document.querySelectorAll(sel));
    el = nodes[${localIndex ?? 0}];
  }
  if (!el) return { ok: false, code: 'ELEMENT_NOT_FOUND', message: 'Element not found' };
  if (el.readOnly || el.disabled) return { ok: false, code: 'ELEMENT_NOT_EDITABLE', message: 'Element not editable' };
  el.focus();
  if ('value' in el) {
    if (${clear ? "true" : "false"}) el.value = ${JSON.stringify(text)};
    else el.value = (el.value || '') + ${JSON.stringify(text)};
  } else if (el.isContentEditable) {
    if (${clear ? "true" : "false"}) el.textContent = ${JSON.stringify(text)};
    else el.textContent = (el.textContent || '') + ${JSON.stringify(text)};
  }
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return { ok: true };
})()
`;

const SELECT_IN_FRAME_SCRIPT = (selector: string | null, value: string) => `
(function() {
  var el = document.querySelector(${JSON.stringify(selector ?? "")});
  if (!el || el.tagName.toLowerCase() !== 'select') return { ok: false, code: 'ELEMENT_NOT_FOUND', message: 'Select not found' };
  var found = false;
  for (var i = 0; i < el.options.length; i++) {
    var opt = el.options[i];
    if (opt.value === ${JSON.stringify(value)} || opt.text === ${JSON.stringify(value)}) {
      el.selectedIndex = i;
      found = true;
      break;
    }
  }
  if (!found) return { ok: false, code: 'OPTION_NOT_FOUND', message: 'Option not found' };
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return { ok: true };
})()
`;

const SCROLL_SCRIPT = (x: number, y: number) => `
(function() {
  window.scrollTo(${x}, ${y});
  return { ok: true };
})()
`;

const SCROLL_TO_ELEMENT_SCRIPT = (selector: string) => `
(function() {
  var el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return { ok: false, code: 'ELEMENT_NOT_FOUND', message: 'Element not found' };
  el.scrollIntoView({ block: 'center', inline: 'center' });
  return { ok: true };
})()
`;

export class BrowserV57Core {
  readonly actionLogStore = new BrowserActionLogStore();
  private readonly frameInspector = new BrowserFrameInspector();
  private readonly coordinateResolver = new BrowserCoordinateResolver(this.frameInspector);
  private readonly domSnapshot = new BrowserDomSnapshot(
    this.frameInspector,
    this.coordinateResolver,
  );
  private readonly elementLocator = new BrowserElementLocator(this.domSnapshot);
  private mainWindow: Electron.BrowserWindow | null = null;

  constructor(private readonly viewManager: BrowserViewPort) {}

  setMainWindow(win: Electron.BrowserWindow): void {
    this.mainWindow = win;
  }

  private getWc(): WebContents | null {
    return this.viewManager.getExternalWebContents();
  }

  private notReadyResult(action: BrowserActionType, startedAt: number): BrowserStructuredActionResult {
    return wrapResult(action, startedAt, {
      ok: false,
      error: actionError("WEB_CONTENTS_NOT_READY", "External web view is not ready"),
    });
  }

  private log(
    action: BrowserActionType,
    params: unknown,
    result: BrowserStructuredActionResult,
  ): BrowserStructuredActionResult {
    const entry = this.actionLogStore.append(action, params, result);
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(BrowserV57Events.ACTION_LOGGED, entry);
    }
    return result;
  }

  private emitState(state: BrowserRuntimeState): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(BrowserV57Events.STATE_CHANGED, state);
    }
  }

  async getRuntimeState(): Promise<BrowserRuntimeState> {
    const wc = this.getWc();
    const now = new Date().toISOString();
    if (!wc || !this.viewManager.isReady()) {
      return {
        url: "",
        title: "",
        loading: false,
        canGoBack: false,
        canGoForward: false,
        lastUpdatedAt: now,
        frameCount: 0,
      };
    }
    const frames = this.frameInspector.listFrames(wc);
    const state: BrowserRuntimeState = {
      url: wc.getURL(),
      title: wc.getTitle(),
      loading: wc.isLoading(),
      canGoBack: wc.navigationHistory.canGoBack(),
      canGoForward: wc.navigationHistory.canGoForward(),
      lastUpdatedAt: now,
      frameCount: frames.length,
    };
    this.emitState(state);
    return state;
  }

  listFrames(): BrowserFrameSnapshot[] {
    const wc = this.getWc();
    if (!wc) return [];
    return this.frameInspector.listFrames(wc);
  }

  async snapshot(options?: Parameters<BrowserDomSnapshot["capture"]>[1]): Promise<BrowserPageSnapshot> {
    const wc = this.getWc();
    if (!wc) {
      return {
        capturedAt: new Date().toISOString(),
        url: "",
        title: "",
        loading: false,
        frames: [],
        elements: [],
        errors: [{ frameId: "main", code: "SNAPSHOT_FAILED", message: "WebContents not ready" }],
      };
    }
    return this.domSnapshot.capture(wc, options);
  }

  async findElement(target: BrowserElementTarget): Promise<BrowserElementSnapshot | null> {
    const wc = this.getWc();
    if (!wc) return null;
    return this.elementLocator.findElement(wc, target);
  }

  private parseLocalIndex(elementId: string): number | null {
    const match = /:el-(\d+)$/.exec(elementId);
    return match ? Number(match[1]) : null;
  }

  async clickElement(target: BrowserElementTarget): Promise<BrowserStructuredActionResult> {
    const startedAt = Date.now();
    const action: BrowserActionType = "clickElement";
    const wc = this.getWc();
    if (!wc || !this.viewManager.isReady()) {
      return this.log(action, target, this.notReadyResult(action, startedAt));
    }

    const element = await this.elementLocator.findElement(wc, target);
    if (!element) {
      const result = wrapResult(action, startedAt, {
        ok: false,
        target,
        url: wc.getURL(),
        title: wc.getTitle(),
        error: actionError("ELEMENT_NOT_FOUND", "Element not found"),
      });
      return this.log(action, target, result);
    }

    if (!element.visible) {
      const result = wrapResult(action, startedAt, {
        ok: false,
        target,
        frameId: element.frameId,
        selector: element.selector,
        url: wc.getURL(),
        error: actionError("ELEMENT_NOT_VISIBLE", "Element not visible"),
      });
      return this.log(action, target, result);
    }

    if (!element.enabled) {
      const result = wrapResult(action, startedAt, {
        ok: false,
        target,
        frameId: element.frameId,
        error: actionError("ELEMENT_DISABLED", "Element disabled"),
      });
      return this.log(action, target, result);
    }

    const frameMeta = this.frameInspector.listFrames(wc).find((f) => f.frameId === element.frameId);
    const frame = frameMeta
      ? this.frameInspector.resolveFrameByPath(wc, frameMeta.path)
      : wc.mainFrame;

    if (!frame) {
      const result = wrapResult(action, startedAt, {
        ok: false,
        target,
        error: actionError("FRAME_NOT_FOUND", "Frame not found"),
      });
      return this.log(action, target, result);
    }

    const freshSnapshot = await this.domSnapshot.capture(wc, {
      includeFrames: false,
      includeInteractiveElements: true,
    });
    const freshEl =
      freshSnapshot.elements.find((e) => e.elementId === element.elementId) ?? element;
    const rectInMain = freshEl.rectInMainFrame;

    const localIndex = this.parseLocalIndex(element.elementId);
    try {
      const domResult = (await frame.executeJavaScript(
        CLICK_IN_FRAME_SCRIPT(element.selector ?? null, localIndex),
      )) as { ok: boolean; code?: BrowserActionErrorCode; message?: string };

      if (domResult.ok) {
        await this.getRuntimeState();
        const result = wrapResult(action, startedAt, {
          ok: true,
          target,
          frameId: element.frameId,
          selector: element.selector,
          rect: rectInMain,
          url: wc.getURL(),
          title: wc.getTitle(),
        });
        return this.log(action, target, result);
      }

      if (domResult.code === "ELEMENT_NOT_CLICKABLE" || domResult.code === "ELEMENT_NOT_FOUND") {
        // fallback coordinate click
      } else if (domResult.code) {
        const result = wrapResult(action, startedAt, {
          ok: false,
          target,
          frameId: element.frameId,
          error: actionError(domResult.code, domResult.message ?? "Click failed"),
        });
        return this.log(action, target, result);
      }
    } catch {
      // fallback
    }

    const center = this.coordinateResolver.centerOf(rectInMain);
    try {
      wc.sendInputEvent({ type: "mouseMove", x: center.x, y: center.y });
      wc.sendInputEvent({ type: "mouseDown", x: center.x, y: center.y, button: "left", clickCount: 1 });
      wc.sendInputEvent({ type: "mouseUp", x: center.x, y: center.y, button: "left", clickCount: 1 });
      await this.getRuntimeState();
      const result = wrapResult(action, startedAt, {
        ok: true,
        target,
        frameId: element.frameId,
        selector: element.selector,
        rect: rectInMain,
        url: wc.getURL(),
        title: wc.getTitle(),
      });
      return this.log(action, target, result);
    } catch (err) {
      const result = wrapResult(action, startedAt, {
        ok: false,
        target,
        frameId: element.frameId,
        error: actionError("ELEMENT_NOT_CLICKABLE", (err as Error).message),
      });
      return this.log(action, target, result);
    }
  }

  async typeElement(
    target: BrowserElementTarget,
    text: string,
    options?: BrowserTypeOptions,
  ): Promise<BrowserStructuredActionResult> {
    const startedAt = Date.now();
    const action: BrowserActionType = "typeElement";
    const wc = this.getWc();
    if (!wc || !this.viewManager.isReady()) {
      return this.log(action, { target, text, options }, this.notReadyResult(action, startedAt));
    }

    const element = await this.elementLocator.findElement(wc, target);
    if (!element) {
      const result = wrapResult(action, startedAt, {
        ok: false,
        target,
        error: actionError("ELEMENT_NOT_FOUND", "Element not found"),
      });
      return this.log(action, { target, text, options }, result);
    }

    if (!element.editable) {
      const result = wrapResult(action, startedAt, {
        ok: false,
        target,
        frameId: element.frameId,
        error: actionError("ELEMENT_NOT_EDITABLE", "Element not editable"),
      });
      return this.log(action, { target, text, options }, result);
    }

    const frameMeta = this.frameInspector.listFrames(wc).find((f) => f.frameId === element.frameId);
    const frame = frameMeta
      ? this.frameInspector.resolveFrameByPath(wc, frameMeta.path)
      : wc.mainFrame;
    if (!frame) {
      const result = wrapResult(action, startedAt, {
        ok: false,
        target,
        error: actionError("FRAME_NOT_FOUND", "Frame not found"),
      });
      return this.log(action, { target, text, options }, result);
    }

    const clear = options?.clear !== false;
    const localIndex = this.parseLocalIndex(element.elementId);
    try {
      if (options?.delayMs && options.delayMs > 0) {
        await new Promise((r) => setTimeout(r, options.delayMs));
      }
      const domResult = (await frame.executeJavaScript(
        TYPE_IN_FRAME_SCRIPT(element.selector ?? null, localIndex, text, clear),
      )) as { ok: boolean; code?: BrowserActionErrorCode; message?: string };

      if (!domResult.ok) {
        const result = wrapResult(action, startedAt, {
          ok: false,
          target,
          frameId: element.frameId,
          error: actionError(
            domResult.code ?? "UNKNOWN_BROWSER_ERROR",
            domResult.message ?? "Type failed",
          ),
        });
        return this.log(action, { target, text, options }, result);
      }

      await this.getRuntimeState();
      const result = wrapResult(action, startedAt, {
        ok: true,
        target,
        frameId: element.frameId,
        selector: element.selector,
        url: wc.getURL(),
        title: wc.getTitle(),
      });
      return this.log(action, { target, text, options }, result);
    } catch (err) {
      const result = wrapResult(action, startedAt, {
        ok: false,
        target,
        error: actionError("FRAME_SCRIPT_BLOCKED", (err as Error).message),
      });
      return this.log(action, { target, text, options }, result);
    }
  }

  async selectOption(
    target: BrowserElementTarget,
    value: string,
  ): Promise<BrowserStructuredActionResult> {
    const startedAt = Date.now();
    const action: BrowserActionType = "selectOption";
    const wc = this.getWc();
    if (!wc || !this.viewManager.isReady()) {
      return this.log(action, { target, value }, this.notReadyResult(action, startedAt));
    }

    const element = await this.elementLocator.findElement(wc, target);
    if (!element?.selector) {
      const result = wrapResult(action, startedAt, {
        ok: false,
        target,
        error: actionError("ELEMENT_NOT_FOUND", "Select element not found"),
      });
      return this.log(action, { target, value }, result);
    }

    const frameMeta = this.frameInspector.listFrames(wc).find((f) => f.frameId === element.frameId);
    const frame = frameMeta
      ? this.frameInspector.resolveFrameByPath(wc, frameMeta.path)
      : wc.mainFrame;
    if (!frame) {
      const result = wrapResult(action, startedAt, {
        ok: false,
        target,
        error: actionError("FRAME_NOT_FOUND", "Frame not found"),
      });
      return this.log(action, { target, value }, result);
    }

    try {
      const domResult = (await frame.executeJavaScript(
        SELECT_IN_FRAME_SCRIPT(element.selector, value),
      )) as { ok: boolean; code?: BrowserActionErrorCode; message?: string };

      if (!domResult.ok) {
        const result = wrapResult(action, startedAt, {
          ok: false,
          target,
          error: actionError(
            domResult.code ?? "OPTION_NOT_FOUND",
            domResult.message ?? "Select failed",
          ),
        });
        return this.log(action, { target, value }, result);
      }

      const result = wrapResult(action, startedAt, {
        ok: true,
        target,
        frameId: element.frameId,
        selector: element.selector,
        url: wc.getURL(),
        title: wc.getTitle(),
      });
      return this.log(action, { target, value }, result);
    } catch (err) {
      const result = wrapResult(action, startedAt, {
        ok: false,
        target,
        error: actionError("FRAME_SCRIPT_BLOCKED", (err as Error).message),
      });
      return this.log(action, { target, value }, result);
    }
  }

  async scroll(options: BrowserScrollOptions): Promise<BrowserStructuredActionResult> {
    const startedAt = Date.now();
    const action: BrowserActionType = "scroll";
    const wc = this.getWc();
    if (!wc || !this.viewManager.isReady()) {
      return this.log(action, options, this.notReadyResult(action, startedAt));
    }

    if (options.target) {
      const element = await this.elementLocator.findElement(wc, options.target);
      if (!element?.selector) {
        const result = wrapResult(action, startedAt, {
          ok: false,
          error: actionError("ELEMENT_NOT_FOUND", "Scroll target not found"),
        });
        return this.log(action, options, result);
      }
      const frameMeta = this.frameInspector.listFrames(wc).find((f) => f.frameId === element.frameId);
      const frame = frameMeta
        ? this.frameInspector.resolveFrameByPath(wc, frameMeta.path)
        : wc.mainFrame;
      if (!frame) {
        const result = wrapResult(action, startedAt, {
          ok: false,
          error: actionError("FRAME_NOT_FOUND", "Frame not found"),
        });
        return this.log(action, options, result);
      }
      try {
        await frame.executeJavaScript(SCROLL_TO_ELEMENT_SCRIPT(element.selector));
        const result = wrapResult(action, startedAt, { ok: true, target: options.target, url: wc.getURL() });
        return this.log(action, options, result);
      } catch (err) {
        const result = wrapResult(action, startedAt, {
          ok: false,
          error: actionError("FRAME_SCRIPT_BLOCKED", (err as Error).message),
        });
        return this.log(action, options, result);
      }
    }

    const x = options.x ?? 0;
    const y = options.y ?? 0;
    try {
      await wc.mainFrame.executeJavaScript(SCROLL_SCRIPT(x, y));
      const result = wrapResult(action, startedAt, { ok: true, url: wc.getURL() });
      return this.log(action, options, result);
    } catch (err) {
      const result = wrapResult(action, startedAt, {
        ok: false,
        error: actionError("FRAME_SCRIPT_BLOCKED", (err as Error).message),
      });
      return this.log(action, options, result);
    }
  }

  async captureStructuredScreenshot(
    options?: BrowserScreenshotOptions,
  ): Promise<BrowserStructuredScreenshotResult | null> {
    const wc = this.getWc();
    if (!wc || !this.viewManager.isReady()) return null;

    const screenshotId = randomUUID();
    const capturedAt = new Date().toISOString();

    try {
      const image = await wc.capturePage();
      const size = image.getSize();
      const png = image.toPNG();
      const base64 =
        options?.base64 !== false ? png.toString("base64") : undefined;

      let filePath: string | undefined;
      if (options?.persist) {
        const dir = join(profileHome(), "desktop", "web-operator", "screenshots");
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        filePath = join(dir, `${screenshotId}.png`);
        writeFileSync(filePath, png);
      }

      const result: BrowserStructuredScreenshotResult = {
        screenshotId,
        mimeType: "image/png",
        width: size.width,
        height: size.height,
        base64,
        filePath,
        capturedAt,
      };

      const logResult = wrapResult("screenshot", Date.now(), {
        ok: true,
        screenshotId,
        url: wc.getURL(),
        title: wc.getTitle(),
      });
      this.log("screenshot", options ?? {}, logResult);

      return result;
    } catch {
      const logResult = wrapResult("screenshot", Date.now(), {
        ok: false,
        error: actionError("SCREENSHOT_FAILED", "Screenshot capture failed"),
      });
      this.log("screenshot", options ?? {}, logResult);
      return null;
    }
  }
}
