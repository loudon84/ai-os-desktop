import { describe, it, expect } from "vitest";
import {
  buildMainWorkspaceTabs,
  isWorkspaceTabView,
} from "../src/renderer/src/screens/MainPage/main-page-tabs";

describe("buildMainWorkspaceTabs", () => {
  it("includes static system and operator tabs plus office", () => {
    const tabs = buildMainWorkspaceTabs();
    expect(tabs.map((t) => t.id)).toEqual([
      "aios-home",
      "aios-workspace",
      "web-operator",
      "office",
    ]);
    expect(tabs.every((t) => t.source === "system" || t.source === "operator")).toBe(
      true,
    );
  });
});

describe("isWorkspaceTabView", () => {
  it("recognizes V3.2 workspace tab views", () => {
    expect(isWorkspaceTabView("aios-home")).toBe(true);
    expect(isWorkspaceTabView("aios-workspace")).toBe(true);
    expect(isWorkspaceTabView("web-operator")).toBe(true);
    expect(isWorkspaceTabView("office")).toBe(true);
    expect(isWorkspaceTabView("external-browser:abc")).toBe(true);
    expect(isWorkspaceTabView("chat" as never)).toBe(false);
  });
});
