import type { LucideIcon } from "lucide-react";

export type View =
  | "chat"
  | "sessions"
  | "agents"
  | "office"
  | "models"
  | "providers"
  | "skills"
  | "soul"
  | "memory"
  | "tools"
  | "schedules"
  | "gateway"
  | "web-operator"
  | "settings"
  | "aios-workspace"
  | "profile-runtime"
  | "runtime-setup"
  | `profile-workspace:${string}`;

export interface NavItem {
  view: View;
  icon: LucideIcon;
  labelKey: string;
}

export type UpdateState = "available" | "downloading" | "ready" | null;

export const VIEW_TITLE_KEYS: Partial<Record<View, string>> = {
  chat: "navigation.chat",
  sessions: "navigation.sessions",
  agents: "navigation.agents",
  office: "navigation.office",
  models: "navigation.models",
  providers: "navigation.providers",
  skills: "navigation.skills",
  soul: "navigation.soul",
  memory: "navigation.memory",
  tools: "navigation.tools",
  schedules: "navigation.schedules",
  gateway: "navigation.gateway",
  "runtime-setup": "navigation.runtimeSetup",
  "web-operator": "navigation.webOperator",
  settings: "navigation.settings",
  "aios-workspace": "navigation.aiosWorkspace",
  "profile-runtime": "navigation.profileRuntime",
};

export function resolveViewTitleKey(view: View): string {
  if (typeof view === "string" && view.startsWith("profile-workspace:")) {
    return "navigation.profileWorkspace";
  }
  return VIEW_TITLE_KEYS[view] ?? "navigation.chat";
}
