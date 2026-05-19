import { useState, useCallback } from "react";
import type {
  BrowserActionResult,
  BrowserOpenResult,
  BrowserStateResult,
  BrowserScreenshotResult
} from "../../../../../shared/browser/browser-contract";

export interface UseBrowserActionsOptions {
  /** When set, successful `open` also loads this ShellView layer (WebContentsHost viewport). */
  shellLayerId?: string;
}

export function useBrowserActions(options?: UseBrowserActionsOptions) {
  const shellLayerId = options?.shellLayerId;
  const [isLoading, setIsLoading] = useState(false);

  const open = useCallback(async (url: string) => {
    setIsLoading(true);
    try {
      const result: BrowserOpenResult = await window.aiosBrowser.open({ url, source: "user" });
      if (result.ok && shellLayerId) {
        const targetUrl = result.url ?? url;
        await window.shellView.loadUrl(shellLayerId, targetUrl).catch((err: unknown) => {
          console.warn("[useBrowserActions] shellView.loadUrl failed:", err);
        });
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [shellLayerId]);

  const back = useCallback(async () => {
    return await window.aiosBrowser.back();
  }, []);

  const forward = useCallback(async () => {
    return await window.aiosBrowser.forward();
  }, []);

  const reload = useCallback(async () => {
    return await window.aiosBrowser.reload();
  }, []);

  const getState = useCallback(async (): Promise<BrowserStateResult> => {
    return await window.aiosBrowser.getState();
  }, []);

  const screenshot = useCallback(async (): Promise<BrowserScreenshotResult> => {
    return await window.aiosBrowser.screenshot();
  }, []);

  const click = useCallback(async (selector: string): Promise<BrowserActionResult> => {
    return await window.aiosBrowser.click({ selector, source: "user" });
  }, []);

  const type = useCallback(async (selector: string, text: string): Promise<BrowserActionResult> => {
    return await window.aiosBrowser.type({ selector, text, source: "user" });
  }, []);

  const extractTable = useCallback(async (selector: string): Promise<BrowserActionResult> => {
    return await window.aiosBrowser.extractTable({ selector, source: "user" });
  }, []);

  return { isLoading, open, back, forward, reload, getState, screenshot, click, type, extractTable };
}
