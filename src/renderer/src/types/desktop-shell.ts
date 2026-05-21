import type { LucideIcon } from "lucide-react";

export type View =
  | "aios-home"
  | "workspaces"
  | "task-workbench"
  | "web-operator"
  | "office"
  | `external-browser:${string}`;

export interface NavItem {
  view: Exclude<View, `external-browser:${string}`>;
  icon: LucideIcon;
  labelKey: string;
}

export type UpdateState = "available" | "downloading" | "ready" | null;

export const VIEW_TITLE_KEYS: Partial<Record<View, string>> = {
  "aios-home": "navigation.aiosHome",
  workspaces: "navigation.workspaces",
  "task-workbench": "navigation.taskWorkbench",
  "web-operator": "navigation.webOperator",
  office: "navigation.office",
};

export function resolveViewTitleKey(view: View): string {
  if (typeof view === "string" && view.startsWith("external-browser:")) {
    return "navigation.externalBrowser";
  }
  return VIEW_TITLE_KEYS[view] ?? "navigation.aiosHome";
}
