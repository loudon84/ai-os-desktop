import type { MainWorkspaceTab } from "./main-page-types";
import type { View } from "../../types/desktop-shell";

const STATIC_TABS: MainWorkspaceTab[] = [
  {
    id: "aios-home",
    titleKey: "navigation.aiosHome",
    closeable: false,
    source: "system",
  },
  {
    id: "aios-workspace",
    titleKey: "navigation.aiosWorkspace",
    closeable: false,
    source: "system",
  },
  {
    id: "web-operator",
    titleKey: "navigation.webOperator",
    closeable: false,
    source: "operator",
  },
];

export function buildMainWorkspaceTabs(): MainWorkspaceTab[] {
  return [...STATIC_TABS];
}

export function isWorkspaceTabView(view: View): boolean {
  return (
    view === "aios-home" ||
    view === "aios-workspace" ||
    view === "web-operator" ||
    (typeof view === "string" && view.startsWith("external-browser:"))
  );
}
