export type SidebarMode = "expanded" | "rail" | "hidden";

export interface ExternalBrowserTabState {
  id: `external-browser:${string}`;
  title: string;
  url: string;
  createdAt: number;
  updatedAt: number;
}

/** @deprecated V1 — migrated to V2 on read */
export interface MainPagePersistedStateV1 {
  version: 1;
  sidebarMode: SidebarMode;
  tabOrder: string[];
  externalTabs: ExternalBrowserTabState[];
  lastActiveView?: string;
}

export interface MainPagePersistedStateV2 {
  version: 2;
  sidebarMode: SidebarMode;
  workspaceOrder: string[];
  externalTabs: ExternalBrowserTabState[];
  lastActiveWorkspace?: string;
  lastSettingsDrawerPanel?: string;
  workspaceSecondaryState?: Record<string, string>;
}

export type MainPagePersistedState = MainPagePersistedStateV2;

export const MainPageStateChannels = {
  READ: "main-page:read",
  WRITE: "main-page:write",
} as const;
