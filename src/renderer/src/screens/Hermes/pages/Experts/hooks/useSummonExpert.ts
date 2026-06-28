import { useCallback } from "react";
import { useHermesDefault } from "../../../context/HermesDefaultContext";
import type { HermesExpert } from "../../../types/hermes-experts";
import type { HermesExpertTeam } from "../../../types/hermes-expert-teams";
import type { RemoteRunContext } from "../../../../../../../shared/hermes-experts/hermes-experts-contract";

export function useSummonExpert() {
  const { setActiveNavItem } = useHermesDefault();

  const summonExpert = useCallback(
    async (expert: HermesExpert, userPrompt?: string, context?: RemoteRunContext) => {
      if (typeof window.hermesExperts === "undefined") {
        setActiveNavItem("expertRuns");
        return { ok: true };
      }
      const result = await window.hermesExperts.summonExpert({
        expertId: expert.expertId,
        userPrompt,
        context,
      });
      if (result.ok) {
        setActiveNavItem("expertRuns");
      }
      return result;
    },
    [setActiveNavItem],
  );

  const summonTeam = useCallback(
    async (team: HermesExpertTeam, userPrompt?: string, context?: RemoteRunContext) => {
      if (typeof window.hermesExperts === "undefined") {
        setActiveNavItem("expertRuns");
        return { ok: true };
      }
      const result = await window.hermesExperts.summonTeam({
        teamId: team.teamId,
        userPrompt,
        context,
      });
      if (result.ok) {
        setActiveNavItem("expertRuns");
      }
      return result;
    },
    [setActiveNavItem],
  );

  return { summonExpert, summonTeam };
}
