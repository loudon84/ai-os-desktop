import type { WorkspaceSecondaryPanel } from "../../../../../shared/workspace/workspace-contract";

export type WebOperatorPanelId =
  | "browser-state"
  | "crm-context"
  | "hermes-task"
  | "page-structure"
  | "action-log";

export interface WebOperatorPanelDefinition {
  id: WebOperatorPanelId;
  labelKey: string;
  size: "sm" | "md" | "lg";
}

export const WEB_OPERATOR_PANEL_ORDER: WebOperatorPanelDefinition[] = [
  {
    id: "browser-state",
    labelKey: "navigation.browserState",
    size: "md",
  },
  {
    id: "crm-context",
    labelKey: "navigation.crmContext",
    size: "md",
  },
  {
    id: "hermes-task",
    labelKey: "navigation.hermesTask",
    size: "md",
  },
  {
    id: "page-structure",
    labelKey: "navigation.pageStructure",
    size: "lg",
  },
  {
    id: "action-log",
    labelKey: "navigation.actionLog",
    size: "lg",
  },
];

export function isWebOperatorPanelId(value: string): value is WebOperatorPanelId {
  return WEB_OPERATOR_PANEL_ORDER.some((item) => item.id === value);
}

export function normalizeWebOperatorPanelId(value: string): WebOperatorPanelId {
  if (value === "screenshot") return "browser-state";
  return isWebOperatorPanelId(value) ? value : "browser-state";
}

export function toWorkspaceSecondaryPanel(value: WebOperatorPanelId): WorkspaceSecondaryPanel {
  return value as WorkspaceSecondaryPanel;
}

