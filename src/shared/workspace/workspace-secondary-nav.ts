import type {
  StaticWorkspaceId,
  WorkspaceSecondaryPanel,
} from "./workspace-contract";

export const SECONDARY_NAV_BY_WORKSPACE: Record<
  StaticWorkspaceId,
  WorkspaceSecondaryPanel[]
> = {
  "aios-home": [],
  "aios-workspace": ["chat", "sessions", "agents"],
  "task-workbench": [],
  "web-operator": ["browser-state", "screenshot", "action-log"],
  office: ["office"],
};

export const SECONDARY_PANEL_LABEL_KEYS: Record<WorkspaceSecondaryPanel, string> = {
  chat: "navigation.chat",
  sessions: "navigation.sessions",
  agents: "navigation.agents",
  "browser-state": "navigation.browserState",
  screenshot: "navigation.screenshot",
  "action-log": "navigation.actionLog",
  office: "navigation.office",
};

export function defaultSecondaryPanel(workspaceId: StaticWorkspaceId): string | undefined {
  const items = SECONDARY_NAV_BY_WORKSPACE[workspaceId];
  return items[0];
}

export function isSecondaryPanelForWorkspace(
  workspaceId: string,
  panel: string,
): boolean {
  if (!(workspaceId in SECONDARY_NAV_BY_WORKSPACE)) return false;
  return SECONDARY_NAV_BY_WORKSPACE[workspaceId as StaticWorkspaceId].includes(
    panel as WorkspaceSecondaryPanel,
  );
}
