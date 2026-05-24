import { useEffect, useRef } from "react";
import { WebContentsHost } from "../../components/shell/WebContentsHost";
import { BrowserToolbar } from "./BrowserToolbar";
import { BrowserStatePanel } from "./BrowserStatePanel";
import { ScreenshotPanel } from "./ScreenshotPanel";
import { BrowserActionLog } from "./BrowserActionLog";
import "./web-operator.css";
import { WEB_OPERATOR_LAYER_ID } from "./web-operator-constants";

export interface WebOperatorScreenProps {
  focusedPanel?: string;
  onFocusedPanelChange?: (panel: string) => void;
  enabled?: boolean;
}

export function WebOperatorScreen({
  focusedPanel = "browser-state",
  enabled = true,
}: WebOperatorScreenProps): React.JSX.Element {
  const stateRef = useRef<HTMLDivElement>(null);
  const screenshotRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target =
      focusedPanel === "screenshot"
        ? screenshotRef.current
        : focusedPanel === "action-log"
          ? logRef.current
          : stateRef.current;
    target?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [focusedPanel]);

  const panelClass = (panel: string): string => {
    const base =
      panel === "action-log"
        ? "web-operator-layout__panel web-operator-layout__panel--grow"
        : "web-operator-layout__panel";
    return focusedPanel === panel
      ? `${base} web-operator-layout__panel--focused`
      : base;
  };

  return (
    <div className="web-operator-layout">
      <div className="web-operator-layout__main">
        <BrowserToolbar />
        <WebContentsHost
          layerId={WEB_OPERATOR_LAYER_ID}
          className="web-operator-layout__viewport"
          enabled={enabled}
        />
      </div>

      <div className="web-operator-layout__side">
        <div ref={stateRef} className={panelClass("browser-state")}>
          <BrowserStatePanel className="flex-1 overflow-hidden" />
        </div>
        <div ref={screenshotRef} className={panelClass("screenshot")}>
          <ScreenshotPanel />
        </div>
        <div ref={logRef} className={panelClass("action-log")}>
          <BrowserActionLog className="flex-1" />
        </div>
      </div>
    </div>
  );
}
