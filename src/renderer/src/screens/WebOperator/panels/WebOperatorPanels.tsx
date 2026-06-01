import { useEffect, useRef } from "react";
import { BrowserStatePanel } from "../BrowserStatePanel";
import { HostBridgePanel } from "../HostBridgePanel";
import { HermesTaskPanel } from "../HermesTaskPanel";
import { PageStructurePanel } from "../PageStructurePanel";
import { BrowserActionLog } from "../BrowserActionLog";
import { WebOperatorPanelCard } from "./WebOperatorPanelCard";
import {
  normalizeWebOperatorPanelId,
  WEB_OPERATOR_PANEL_ORDER,
  type WebOperatorPanelId,
} from "./web-operator-panels-contract";
import "./web-operator-panels.css";

export interface WebOperatorPanelsProps {
  focusedPanel: string;
  externalRefreshTrigger: number;
  onRefreshSnapshot: () => void;
  onFocusedPanelChange?: (panel: string) => void;
}

type PanelRefMap = Record<WebOperatorPanelId, React.RefObject<HTMLDivElement | null>>;

function renderPanelBody(
  panelId: WebOperatorPanelId,
  props: {
    externalRefreshTrigger: number;
    onRefreshSnapshot: () => void;
    onFocusedPanelChange?: (panel: string) => void;
  },
): React.ReactNode {
  switch (panelId) {
    case "browser-state":
      return <BrowserStatePanel className="web-operator-panels__content" />;
    case "host-context":
      return (
        <HostBridgePanel
          className="web-operator-panels__content"
          onRefreshSnapshot={props.onRefreshSnapshot}
        />
      );
    case "hermes-task":
      return <HermesTaskPanel className="web-operator-panels__content" />;
    case "page-structure":
      return (
        <PageStructurePanel
          externalRefreshTrigger={props.externalRefreshTrigger}
          className="web-operator-panels__content"
          onAnalyzeContent={() => props.onFocusedPanelChange?.("hermes-task")}
        />
      );
    case "action-log":
      return <BrowserActionLog className="web-operator-panels__content" />;
    default:
      return null;
  }
}

export function WebOperatorPanels({
  focusedPanel,
  externalRefreshTrigger,
  onRefreshSnapshot,
  onFocusedPanelChange,
}: WebOperatorPanelsProps): React.JSX.Element {
  const activePanel = normalizeWebOperatorPanelId(focusedPanel);

  const stateRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const hermesTaskRef = useRef<HTMLDivElement>(null);
  const structureRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const panelRefs: PanelRefMap = {
    "browser-state": stateRef,
    "host-context": hostRef,
    "crm-context": hostRef,
    "hermes-task": hermesTaskRef,
    "page-structure": structureRef,
    "action-log": logRef,
  };

  const bodyProps = {
    externalRefreshTrigger,
    onRefreshSnapshot,
    onFocusedPanelChange,
  };

  useEffect(() => {
    panelRefs[activePanel]?.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [activePanel]);

  return (
    <div className="web-operator-panels">
      {WEB_OPERATOR_PANEL_ORDER.map((panel) => {
        const isHermesTask = panel.id === "hermes-task";
        const isActive = panel.id === activePanel;

        if (!isHermesTask && !isActive) return null;

        return (
          <WebOperatorPanelCard
            key={panel.id}
            panel={panel}
            focused={isActive}
            hidden={isHermesTask && !isActive}
            panelRef={panelRefs[panel.id]}
          >
            {renderPanelBody(panel.id, bodyProps)}
          </WebOperatorPanelCard>
        );
      })}
    </div>
  );
}
