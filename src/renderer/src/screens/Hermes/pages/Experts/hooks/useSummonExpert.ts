import { useCallback } from "react";
import { useHermesDefault } from "../../../context/HermesDefaultContext";
import { useHermesExpertsCatalog } from "../../../context/HermesExpertsContext";
import { useHermesWorkspace } from "../../../context/HermesWorkspaceContext";
import type { HermesExpert } from "../../../types/hermes-experts";
import type { HermesExpertTeam } from "../../../types/hermes-expert-teams";

export function useSummonExpert() {
  const { setActiveNavItem } = useHermesDefault();
  const workspace = useHermesWorkspace();
  const { getExpertById } = useHermesExpertsCatalog();

  const summonExpert = useCallback(
    async (expert: HermesExpert, userPrompt?: string) => {
      if (typeof window.hermesExperts === "undefined") {
        workspace.bindExpert({
          expertId: expert.expertId,
          profileId: expert.profile.profileId,
        });
        setActiveNavItem("chat");
        return { ok: true };
      }
      const result = await window.hermesExperts.summonExpert({
        expertId: expert.expertId,
        userPrompt,
        sessionId: workspace.activeSessionId ?? undefined,
      });
      if (result.ok && result.profileId) {
        workspace.bindExpert({
          expertId: expert.expertId,
          profileId: result.profileId,
          runId: result.runId,
          sessionId: result.sessionId ?? null,
        });
        setActiveNavItem("chat");
      }
      return result;
    },
    [setActiveNavItem, workspace],
  );

  const summonTeam = useCallback(
    async (team: HermesExpertTeam, userPrompt?: string) => {
      if (typeof window.hermesExperts === "undefined") {
        const leader = getExpertById(team.leader.expertId);
        workspace.bindTeam({
          teamId: team.teamId,
          leaderProfileId: leader?.profile.profileId ?? team.leader.expertId,
        });
        setActiveNavItem("chat");
        return { ok: true };
      }
      const result = await window.hermesExperts.summonTeam({
        teamId: team.teamId,
        userPrompt,
        sessionId: workspace.activeSessionId ?? undefined,
      });
      if (result.ok && result.leaderProfileId) {
        workspace.bindTeam({
          teamId: team.teamId,
          leaderProfileId: result.leaderProfileId,
          runId: result.runId,
          sessionId: result.sessionId ?? null,
        });
        setActiveNavItem("chat");
      }
      return result;
    },
    [setActiveNavItem, workspace, getExpertById],
  );

  return { summonExpert, summonTeam, resetToDefault: workspace.resetToDefault };
}
