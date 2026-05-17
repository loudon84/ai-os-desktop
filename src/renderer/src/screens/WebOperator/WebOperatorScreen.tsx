import { useCallback } from "react";
import type { BrowserViewBounds } from "../../../../shared/browser/browser-contract";
import { BrowserToolbar } from "./BrowserToolbar";
import { BrowserViewportHost } from "./BrowserViewportHost";
import { HermesTaskPanel } from "./HermesTaskPanel";
import { BrowserStatePanel } from "./BrowserStatePanel";
import { ScreenshotPanel } from "./ScreenshotPanel";
import { BrowserActionLog } from "./BrowserActionLog";

export function WebOperatorScreen() {
  const handleBoundsUpdate = useCallback((bounds: BrowserViewBounds) => {
    window.aiosBrowser.updateBounds(bounds);
  }, []);

  return (
    <div className="flex h-full bg-neutral-900 text-neutral-200">
      <div className="w-80 border-r border-neutral-700 flex flex-col overflow-hidden">
        <HermesTaskPanel className="flex-1" />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <BrowserToolbar />
        <BrowserViewportHost
          className="flex-1"
          onBoundsUpdate={handleBoundsUpdate}
        />
      </div>

      <div className="w-80 border-l border-neutral-700 flex flex-col overflow-hidden">
        <BrowserStatePanel className="flex-1 overflow-hidden" />
        <div className="border-t border-neutral-700">
          <ScreenshotPanel />
        </div>
        <div className="border-t border-neutral-700 flex-1 overflow-hidden">
          <BrowserActionLog className="flex-1" />
        </div>
      </div>
    </div>
  );
}
