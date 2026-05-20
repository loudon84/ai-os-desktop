import { describe, it, expect } from "vitest";
import {
  buildMainWorkspaceTabs,
  isWorkspaceTabView,
} from "../src/renderer/src/screens/MainPage/main-page-tabs";

describe("buildMainWorkspaceTabs", () => {
  it("includes static system and operator tabs only", () => {
    const tabs = buildMainWorkspaceTabs();
    expect(tabs.map((t) => t.id)).toEqual([
      "aios-home",
      "aios-workspace",
      "web-operator",
    ]);
    expect(tabs.every((t) => t.source === "system" || t.source === "operator")).toBe(
      true,
    );
  });
});

describe("isWorkspaceTabView", () => {
  it("recognizes V3 workspace tab views", () => {
    expect(isWorkspaceTabView("aios-home")).toBe(true);
    expect(isWorkspaceTabView("aios-workspace")).toBe(true);
    expect(isWorkspaceTabView("web-operator")).toBe(true);
    expect(isWorkspaceTabView("external-browser:abc")).toBe(true);
    expect(isWorkspaceTabView("office")).toBe(false);
    expect(isWorkspaceTabView("chat" as never)).toBe(false);
  });
});
