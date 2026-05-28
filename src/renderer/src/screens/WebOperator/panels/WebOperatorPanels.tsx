import { useEffect, useRef } from "react";
import { BrowserStatePanel } from "../BrowserStatePanel";
import { CrmEventPanel } from "../CrmEventPanel";
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
}

type PanelRefMap = Record<WebOperatorPanelId, React.RefObject<HTMLDivElement | null>>;

export function WebOperatorPanels({
  focusedPanel,
  externalRefreshTrigger,
  onRefreshSnapshot,
}: WebOperatorPanelsProps): React.JSX.Element {
  const activePanel = normalizeWebOperatorPanelId(focusedPanel);

  const stateRef = useRef<HTMLDivElement>(null);
  const crmRef = useRef<HTMLDivElement>(null);
  const hermesTaskRef = useRef<HTMLDivElement>(null);
  const structureRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const panelRefs: PanelRefMap = {
    "browser-state": stateRef,
    "crm-context": crmRef,
    "hermes-task": hermesTaskRef,
    "page-structure": structureRef,
    "action-log": logRef,
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
        if (panel.id !== activePanel) return null;
        return (
          <WebOperatorPanelCard
            key={panel.id}
            panel={panel}
            focused
            panelRef={panelRefs[panel.id]}
          >
            {panel.id === "browser-state" ? (
              <BrowserStatePanel className="web-operator-panels__content" />
            ) : null}

            {panel.id === "crm-context" ? (
              <CrmEventPanel
                className="web-operator-panels__content"
                onRefreshSnapshot={onRefreshSnapshot}
              />
            ) : null}

            {panel.id === "hermes-task" ? (
              <HermesTaskPanel className="web-operator-panels__content" />
            ) : null}

            {panel.id === "page-structure" ? (
              <PageStructurePanel
                externalRefreshTrigger={externalRefreshTrigger}
                className="web-operator-panels__content"
              />
            ) : null}

            {panel.id === "action-log" ? (
              <BrowserActionLog className="web-operator-panels__content" />
            ) : null}
          </WebOperatorPanelCard>
        );
      })}
    </div>
  );
}

