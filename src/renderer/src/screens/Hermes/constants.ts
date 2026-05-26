/** v5.6 — Local Hermes default profile layout & storage keys. */
export const HERMES_DEFAULT_PROFILE = "default" as const;

export const HERMES_DEFAULT_PROFILE_META = {
  id: "default",
  name: "default",
  displayName: "Hermes Default",
  roleName: "本地 Hermes",
  gatewayPort: 8642,
} as const;

export const STORAGE_KEYS = {
  activeRightTab: "hermesDefault.activeRightTab",
  collapsedRightPanel: "hermesDefault.collapsedRightPanel",
  collapsedLeftPanel: "hermesDefault.collapsedLeftPanel",
  activeNavItem: "hermesDefault.activeNavItem",
  activeSessionId: "hermesDefault.activeSessionId",
} as const;

export type HermesNavItemKey =
  | "chat"
  | "sessions"
  | "skills"
  | "tools"
  | "memory"
  | "providers"
  | "models";

export const HERMES_NAV_ITEMS = [
  { key: "chat", labelI18nKey: "workspaces.nav.chat", icon: "MessageSquare" },
  { key: "sessions", labelI18nKey: "workspaces.nav.sessions", icon: "History" },
  { key: "skills", labelI18nKey: "workspaces.nav.skills", icon: "Sparkles" },
  { key: "tools", labelI18nKey: "workspaces.nav.tools", icon: "Wrench" },
  { key: "memory", labelI18nKey: "workspaces.nav.memory", icon: "Brain" },
  { key: "providers", labelI18nKey: "workspaces.nav.providers", icon: "Server" },
  { key: "models", labelI18nKey: "workspaces.nav.models", icon: "Box" },
] as const;

export const LAYOUT = {
  sidebarWidthPx: 220,
  sidebarCollapsedWidthPx: 48,
  rightPanelWidthPx: 340,
  rightPanelCollapsedWidthPx: 48,
  centerMinWidthPx: 520,
} as const;
