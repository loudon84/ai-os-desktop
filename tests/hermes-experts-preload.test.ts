import { describe, it, expect } from "vitest";
import { hermesExpertsApi } from "../src/preload/hermes-experts-api";

describe("hermesExperts preload surface", () => {
  it("exposes catalog methods", () => {
    expect(typeof hermesExpertsApi.listExpertCatalog).toBe("function");
    expect(typeof hermesExpertsApi.getExpert).toBe("function");
    expect(typeof hermesExpertsApi.listExpertTeams).toBe("function");
    expect(typeof hermesExpertsApi.getExpertTeam).toBe("function");
  });

  it("exposes install and summon methods", () => {
    expect(typeof hermesExpertsApi.previewInstallExpert).toBe("function");
    expect(typeof hermesExpertsApi.installExpert).toBe("function");
    expect(typeof hermesExpertsApi.previewInstallTeam).toBe("function");
    expect(typeof hermesExpertsApi.installTeam).toBe("function");
    expect(typeof hermesExpertsApi.summonExpert).toBe("function");
    expect(typeof hermesExpertsApi.summonTeam).toBe("function");
  });

  it("exposes run lifecycle, trust, preflight and desktop sync", () => {
    expect(typeof hermesExpertsApi.listExpertRuns).toBe("function");
    expect(typeof hermesExpertsApi.getExpertRun).toBe("function");
    expect(typeof hermesExpertsApi.cancelExpertRun).toBe("function");
    expect(typeof hermesExpertsApi.retryExpertRun).toBe("function");
    expect(typeof hermesExpertsApi.setExpertTrust).toBe("function");
    expect(typeof hermesExpertsApi.preflightExpert).toBe("function");
    expect(typeof hermesExpertsApi.dispatchTeam).toBe("function");
    expect(typeof hermesExpertsApi.getDesktopSyncStatus).toBe("function");
    expect(typeof hermesExpertsApi.registerDesktop).toBe("function");
    expect(typeof hermesExpertsApi.onExpertRuntimeEvent).toBe("function");
  });
});
