export type SidebarMode = "expanded" | "rail" | "hidden";

export interface ExternalBrowserTabState {
  id: `external-browser:${string}`;
  title: string;
  url: string;
  createdAt: number;
  updatedAt: number;
}

export interface MainPagePersistedState {
  version: 1;
  sidebarMode: SidebarMode;
  tabOrder: string[];
  externalTabs: ExternalBrowserTabState[];
  lastActiveView?: string;
}

export const MainPageStateChannels = {
  READ: "main-page:read",
  WRITE: "main-page:write",
} as const;
