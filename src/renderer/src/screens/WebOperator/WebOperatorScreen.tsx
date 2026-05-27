import { useCallback, useEffect, useRef, useState } from "react";
import { PanelRightClose } from "lucide-react";
import { WebContentsHost } from "../../components/shell/WebContentsHost";
import { useI18n } from "../../components/useI18n";
import type { WebOperatorLayoutState } from "../../../../shared/shell/main-page-state-contract";
import { BrowserToolbar } from "./BrowserToolbar";
import { BrowserStatePanel } from "./BrowserStatePanel";
import { ScreenshotPanel } from "./ScreenshotPanel";
import { BrowserActionLog } from "./BrowserActionLog";
import { PageStructurePanel } from "./PageStructurePanel";
import { WebOperatorSideRail } from "./WebOperatorSideRail";
import { useWebOperatorLayoutSplit } from "./hooks/useWebOperatorLayoutSplit";
import { HANDLE_PX } from "./web-operator-layout-constants";
import "./web-operator.css";
import { WEB_OPERATOR_LAYER_ID } from "./web-operator-constants";

export interface WebOperatorScreenProps {
  focusedPanel?: string;
  onFocusedPanelChange?: (panel: string) => void;
  enabled?: boolean;
  layout: WebOperatorLayoutState;
  onLayoutChange: (next: WebOperatorLayoutState) => void;
}

export function WebOperatorScreen({
  focusedPanel = "browser-state",
  enabled = true,
  layout,
  onLayoutChange,
  onFocusedPanelChange,
}: WebOperatorScreenProps): React.JSX.Element {
  const { t } = useI18n();
  const stateRef = useRef<HTMLDivElement>(null);
  const structureRef = useRef<HTMLDivElement>(null);
  const screenshotRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [snapshotRefreshTrigger, setSnapshotRefreshTrigger] = useState(0);

  const { layoutRef, sideWidthPx, sideCollapsed, onHandlePointerDown } =
    useWebOperatorLayoutSplit({ layout, onLayoutChange });

  useEffect(() => {
    if (sideCollapsed) return;
    const target =
      focusedPanel === "page-structure"
        ? structureRef.current
        : focusedPanel === "screenshot"
          ? screenshotRef.current
          : focusedPanel === "action-log"
            ? logRef.current
            : stateRef.current;
    target?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [focusedPanel, sideCollapsed]);

  const panelClass = (panel: string): string => {
    const base =
      panel === "action-log"
        ? "web-operator-layout__panel web-operator-layout__panel--grow"
        : panel === "page-structure"
          ? "web-operator-layout__panel web-operator-layout__panel--grow"
          : "web-operator-layout__panel";
    return focusedPanel === panel
      ? `${base} web-operator-layout__panel--focused`
      : base;
  };

  const setCollapsed = useCallback(
    (collapsed: boolean) => {
      onLayoutChange({ ...layout, sideCollapsed: collapsed });
    },
    [layout, onLayoutChange],
  );

  const handleRefreshSnapshot = useCallback(async () => {
    setSnapshotLoading(true);
    try {
      await window.aiosBrowser.snapshot({
        includeFrames: true,
        includeInteractiveElements: true,
      });
      setSnapshotRefreshTrigger((n) => n + 1);
      if (focusedPanel !== "page-structure") {
        onFocusedPanelChange?.("page-structure");
      }
    } finally {
      setSnapshotLoading(false);
    }
  }, [focusedPanel, onFocusedPanelChange]);

  const gridStyle = {
    "--wo-side-width": `${sideWidthPx}px`,
    "--wo-handle-width": `${HANDLE_PX}px`,
  } as React.CSSProperties;

  return (
    <div
      ref={layoutRef}
      className={`web-operator-layout${sideCollapsed ? " is-side-collapsed" : ""}`}
      style={gridStyle}
    >
      <div className="web-operator-layout__main">
        <BrowserToolbar
          onRefreshSnapshot={() => void handleRefreshSnapshot()}
          snapshotLoading={snapshotLoading}
        />
        <WebContentsHost
          layerId={WEB_OPERATOR_LAYER_ID}
          className="web-operator-layout__viewport"
          enabled={enabled}
        />
      </div>

      {!sideCollapsed ? (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label={t("navigation.webOperatorSide.resize")}
          className="web-operator-layout__handle"
          onPointerDown={onHandlePointerDown}
        />
      ) : null}

      <div className="web-operator-layout__side">
        {sideCollapsed ? (
          <WebOperatorSideRail
            focusedPanel={focusedPanel}
            onFocusedPanelChange={onFocusedPanelChange}
            onExpand={() => setCollapsed(false)}
          />
        ) : (
          <>
            <header className="web-operator-layout__side-header">
              <span className="web-operator-layout__side-title">
                {t("navigation.webOperator")}
              </span>
              <button
                type="button"
                className="web-operator-side-rail__btn"
                title={t("navigation.webOperatorSide.collapse")}
                onClick={() => setCollapsed(true)}
              >
                <PanelRightClose size={16} />
              </button>
            </header>
            <div className="web-operator-layout__side-panels">
              <div ref={stateRef} className={panelClass("browser-state")}>
                <BrowserStatePanel className="flex-1 overflow-hidden" />
              </div>
              <div ref={structureRef} className={panelClass("page-structure")}>
                <PageStructurePanel
                  externalRefreshTrigger={snapshotRefreshTrigger}
                  className="flex-1 overflow-hidden min-h-[200px]"
                />
              </div>             
              <div ref={logRef} className={panelClass("action-log")}>
                <BrowserActionLog className="flex-1" />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
