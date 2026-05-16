import type { BrowserActionResult } from "../../shared/browser/browser-contract";
import { BrowserController } from "./browser-controller";
import { browserToolSchemas } from "../../shared/browser/browser-tool-schema";

export class BrowserToolBridge {
  private controller: BrowserController;

  constructor(controller: BrowserController) {
    this.controller = controller;
  }

  async handleToolCall(
    toolName: string,
    params: Record<string, unknown>
  ): Promise<BrowserActionResult & { data?: unknown }> {
    switch (toolName) {
      case "browser.open": {
        const url = params.url as string;
        if (!url) return { ok: false, message: "Missing required parameter: url" };
        const result = await this.controller.openExternalUrl({ url, source: "hermes" });
        return result;
      }
      case "browser.get_state": {
        const result = await this.controller.getPageState("hermes");
        return { ...result, data: result.state };
      }
      case "browser.screenshot": {
        const result = await this.controller.captureScreenshot("hermes");
        return { ok: result.ok, errorCode: result.errorCode, message: result.message, data: result.base64 ? { mimeType: result.mimeType, base64: result.base64 } : undefined };
      }
      case "browser.click": {
        const selector = params.selector as string;
        if (!selector) return { ok: false, message: "Missing required parameter: selector" };
        const result = await this.controller.clickSelector({ selector, source: "hermes" });
        return result;
      }
      case "browser.type": {
        const selector = params.selector as string;
        const text = params.text as string;
        if (!selector || text === undefined) return { ok: false, message: "Missing required parameters: selector, text" };
        const result = await this.controller.typeIntoSelector({ selector, text, source: "hermes" });
        return result;
      }
      case "browser.back": {
        const result = await this.controller.goBack("hermes");
        return result;
      }
      case "browser.forward": {
        const result = await this.controller.goForward("hermes");
        return result;
      }
      case "browser.reload": {
        const result = await this.controller.reload("hermes");
        return result;
      }
      case "browser.extract_table": {
        const selector = params.selector as string;
        if (!selector) return { ok: false, message: "Missing required parameter: selector" };
        const result = await this.controller.extractTable({ selector, source: "hermes" });
        return result;
      }
      default:
        return { ok: false, message: `Unknown tool: ${toolName}` };
    }
  }

  getToolSchemas() {
    return browserToolSchemas;
  }
}
