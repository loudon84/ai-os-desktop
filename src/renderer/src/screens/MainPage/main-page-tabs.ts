import type { ProfileEntrySummary } from "../../../../shared/profile-runtime/profile-runtime-contract";
import type { View } from "../../types/desktop-shell";
import type { MainWorkspaceTab } from "./main-page-types";

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

export function buildMainWorkspaceTabs(
  profileEntries: ProfileEntrySummary[],
): MainWorkspaceTab[] {
  const profileTabs: MainWorkspaceTab[] = profileEntries
    .filter((entry) => entry.enabled)
    .filter((entry) => entry.entryType === "specialist-workspace")
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((entry) => ({
      id: `profile-workspace:${entry.profileId}` as View,
      title: entry.title || entry.profileId,
      closeable: false,
      source: "profile" as const,
      profileId: entry.profileId,
    }));

  return [...STATIC_TABS, ...profileTabs];
}

export function isWorkspaceTabView(view: View): boolean {
  return (
    view === "aios-home" ||
    view === "aios-workspace" ||
    view === "web-operator" ||
    (typeof view === "string" && view.startsWith("profile-workspace:"))
  );
}
