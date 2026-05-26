import { useTranslation } from "react-i18next";
import { useHermesDefault } from "../context/HermesDefaultContext";
import type { HermesRightInspectorTab } from "../types";

const TABS: HermesRightInspectorTab[] = ["runtime", "skills", "memory", "workspace"];

const TAB_LABELS: Record<HermesRightInspectorTab, string> = {
  runtime: "workspaces.tabs.runtime",
  skills: "workspaces.tabs.skills",
  memory: "workspaces.tabs.memory",
  workspace: "workspaces.tabs.workspace",
};

export function HermesRightInspectorTabs() {
  const { t } = useTranslation();
  const { activeRightTab, setActiveRightTab, rightPanelCollapsed, setRightPanelCollapsed } =
    useHermesDefault();

  return (
    <div className="hermes-right-tabs">
      {TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => setActiveRightTab(tab)}
          className={`hermes-right-tab${activeRightTab === tab ? " is-active" : ""}`}
        >
          {t(TAB_LABELS[tab], { defaultValue: tab })}
        </button>
      ))}
      <button
        type="button"
        className="hermes-right-tab hermes-right-tabs-collapse"
        onClick={() => setRightPanelCollapsed(true)}
        title={t("workspaces.inspector.collapse", { defaultValue: "Collapse inspector" })}
      >
        «
      </button>
    </div>
  );
}
