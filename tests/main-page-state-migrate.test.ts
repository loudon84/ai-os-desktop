import { describe, it, expect } from "vitest";
import { migrateMainPageState } from "../src/main/shell/main-page-state-migrate";

describe("migrateMainPageState", () => {
  it("migrates V1 tabOrder to workspaceOrder", () => {
    const v2 = migrateMainPageState({
      version: 1,
      sidebarMode: "rail",
      tabOrder: ["external-browser:a"],
      externalTabs: [
        {
          id: "external-browser:a",
          title: "A",
          url: "https://example.com",
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      lastActiveView: "external-browser:a",
    });

    expect(v2.version).toBe(2);
    expect(v2.workspaceOrder).toEqual(["external-browser:a"]);
    expect(v2.lastActiveWorkspace).toBe("external-browser:a");
    expect(v2.sidebarMode).toBe("rail");
  });

  it("normalizes V2 state", () => {
    const v2 = migrateMainPageState({
      version: 2,
      sidebarMode: "hidden",
      workspaceOrder: [],
      externalTabs: [],
      workspaceSecondaryState: { "aios-workspace": "chat" },
    });

    expect(v2.workspaceSecondaryState).toEqual({ "aios-workspace": "chat" });
  });
});
