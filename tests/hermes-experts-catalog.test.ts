import { describe, it, expect } from "vitest";
import {
  MOCK_EXPERT_CATALOG,
  MOCK_EXPERT_TEAMS,
  getMockExpert,
  getMockTeam,
} from "../src/main/hermes-experts/expert-mock-catalog";
import { HermesExpertsError } from "../src/shared/hermes-experts/hermes-experts-errors";

describe("hermes-experts mock catalog", () => {
  it("includes sales domain experts and a team", () => {
    expect(MOCK_EXPERT_CATALOG.length).toBeGreaterThanOrEqual(5);
    expect(MOCK_EXPERT_TEAMS.length).toBeGreaterThanOrEqual(1);
    expect(getMockExpert("exp_sales_customer_researcher")?.profile.profileId).toContain(
      "expert.sales",
    );
    expect(getMockTeam("team_sales_war_room")?.leader.expertId).toBeTruthy();
  });
});

describe("HermesExpertsError", () => {
  it("carries error code", () => {
    const err = new HermesExpertsError("EXPERT_NOT_INSTALLED", "test");
    expect(err.code).toBe("EXPERT_NOT_INSTALLED");
    expect(err.message).toBe("test");
  });
});
