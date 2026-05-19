import { describe, it, expect } from "vitest";
import {
  buildMainWorkspaceTabs,
  isWorkspaceTabView,
} from "../src/renderer/src/screens/MainPage/main-page-tabs";
import type { ProfileEntrySummary } from "../src/shared/profile-runtime/profile-runtime-contract";

describe("buildMainWorkspaceTabs", () => {
  const entries: ProfileEntrySummary[] = [
    {
      profileId: "writer",
      entryType: "specialist-workspace",
      route: "/profile-workspace/writer",
      title: "Writer",
      icon: null,
      enabled: true,
      sortOrder: 2,
    },
    {
      profileId: "coding",
      entryType: "specialist-workspace",
      route: "/profile-workspace/coding",
      title: "Coding",
      icon: null,
      enabled: false,
      sortOrder: 1,
    },
    {
      profileId: "other",
      entryType: "aios-controller",
      route: "/aios",
      title: "Other",
      icon: null,
      enabled: true,
      sortOrder: 0,
    },
  ];

  it("includes static system and operator tabs", () => {
    const tabs = buildMainWorkspaceTabs([]);
    expect(tabs.map((t) => t.id)).toEqual([
      "aios-home",
      "aios-workspace",
      "web-operator",
    ]);
  });

  it("appends enabled specialist-workspace tabs sorted by sortOrder", () => {
    const tabs = buildMainWorkspaceTabs(entries);
    const profileIds = tabs
      .filter((t) => t.source === "profile")
      .map((t) => t.profileId);
    expect(profileIds).toEqual(["writer"]);
    expect(tabs.find((t) => t.id === "profile-workspace:writer")?.title).toBe(
      "Writer",
    );
  });
});

describe("isWorkspaceTabView", () => {
  it("recognizes workspace views", () => {
    expect(isWorkspaceTabView("aios-home")).toBe(true);
    expect(isWorkspaceTabView("profile-workspace:writer")).toBe(true);
    expect(isWorkspaceTabView("chat")).toBe(false);
  });
});
