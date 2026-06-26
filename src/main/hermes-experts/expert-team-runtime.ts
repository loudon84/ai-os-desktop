import { invoke as delegationInvoke } from "../delegation-capability";
import { startProfile, resolveProfileId } from "../profile-runtime-manager";
import { getRuntimeInstance } from "../profile-runtime-db";
import type {
  SummonTeamInput,
  SummonTeamResult,
} from "../../shared/hermes-experts/hermes-experts-contract";
import { HermesExpertsError } from "../../shared/hermes-experts/hermes-experts-errors";
import { getExpert, getExpertTeam } from "./expert-catalog-client";
import { getMockTeam } from "./expert-mock-catalog";
import {
  createExpertRun,
  getExpertInstance,
  getExpertRun,
  insertArtifact,
  insertRunEvent,
  updateExpertRunStatus,
} from "./expert-runtime-db";
import { emitExpertRuntimeEvent } from "./expert-run-events";
import { runExpertPreflight } from "./expert-preflight";

async function ensureProfileRunning(profileId: string): Promise<void> {
  const resolvedId = resolveProfileId(profileId);
  const existing = getRuntimeInstance(resolvedId);
  if (!existing || existing.status !== "running") {
    await startProfile(resolvedId);
  }
}

export async function summonTeam(input: SummonTeamInput): Promise<SummonTeamResult> {
  const team = (await getExpertTeam(input.teamId)) ?? getMockTeam(input.teamId);
  if (!team) {
    return { ok: false, errorCode: "TEAM_NOT_FOUND", message: input.teamId };
  }

  const leaderExpert = await getExpert(team.leader.expertId);
  if (!leaderExpert) {
    return { ok: false, errorCode: "TEAM_LEADER_START_FAILED", message: "Leader expert not found" };
  }

  const leaderInstance = getExpertInstance(team.leader.expertId);
  if (!leaderInstance) {
    return {
      ok: false,
      errorCode: "TEAM_MEMBER_NOT_INSTALLED",
      message: "Install the team before summoning",
      teamId: input.teamId,
    };
  }

  for (const member of team.members.filter((m) => m.required)) {
    const inst = getExpertInstance(member.expertId);
    if (!inst) {
      return {
        ok: false,
        errorCode: "TEAM_MEMBER_NOT_INSTALLED",
        message: `Member ${member.roleName} not installed`,
        teamId: input.teamId,
      };
    }
  }

  const leaderProfileId = leaderInstance.profileId;
  const leaderPreflight = await runExpertPreflight({ profileId: leaderProfileId });
  if (!leaderPreflight.ok) {
    return {
      ok: false,
      errorCode: leaderPreflight.errorCode ?? "TEAM_LEADER_START_FAILED",
      message: leaderPreflight.message ?? "Leader preflight failed",
      teamId: input.teamId,
    };
  }

  try {
    await ensureProfileRunning(leaderProfileId);
    for (const member of team.members) {
      const inst = getExpertInstance(member.expertId);
      if (inst) await ensureProfileRunning(inst.profileId);
    }
  } catch (err) {
    return {
      ok: false,
      errorCode: "TEAM_LEADER_START_FAILED",
      message: err instanceof Error ? err.message : String(err),
      teamId: input.teamId,
    };
  }

  const run = createExpertRun({
    runType: "team",
    teamId: input.teamId,
    profileId: leaderProfileId,
    sessionId: input.sessionId,
    title: team.displayName,
    userPrompt: input.userPrompt ?? "",
    status: "dispatching",
  });

  insertRunEvent({
    runId: run.runId,
    eventType: "team_summoned",
    sourceProfileId: leaderProfileId,
    payload: { teamId: input.teamId },
  });

  if (input.userPrompt?.trim()) {
    await executeLeaderDispatch({
      runId: run.runId,
      teamId: input.teamId,
      leaderProfileId,
      userPrompt: input.userPrompt,
      team,
    });
  } else {
    updateExpertRunStatus(run.runId, "running");
  }

  emitExpertRuntimeEvent({
    type: "run_updated",
    runId: run.runId,
    payload: { status: "running", teamId: input.teamId },
  });

  return {
    ok: true,
    teamId: input.teamId,
    leaderProfileId,
    profileId: leaderProfileId,
    runId: run.runId,
    sessionId: input.sessionId,
    runtimeStatus: "running",
    message: `Summoned ${team.displayName}`,
  };
}

export async function dispatchTeamRun(input: {
  runId: string;
  teamId: string;
  leaderProfileId: string;
  userPrompt: string;
}): Promise<void> {
  const team = (await getExpertTeam(input.teamId)) ?? getMockTeam(input.teamId);
  if (!team) return;
  await executeLeaderDispatch({
    runId: input.runId,
    teamId: input.teamId,
    leaderProfileId: input.leaderProfileId,
    userPrompt: input.userPrompt,
    team,
  });
}

async function executeLeaderDispatch(input: {
  runId: string;
  teamId: string;
  leaderProfileId: string;
  userPrompt: string;
  team: Awaited<ReturnType<typeof getExpertTeam>>;
}): Promise<void> {
  if (!input.team) return;
  updateExpertRunStatus(input.runId, "running");

  const memberSummaries: string[] = [];
  for (const member of input.team.members) {
    const inst = getExpertInstance(member.expertId);
    if (!inst) continue;
    insertRunEvent({
      runId: input.runId,
      eventType: "member_dispatch",
      sourceProfileId: input.leaderProfileId,
      targetProfileId: inst.profileId,
      payload: { roleName: member.roleName, task: input.userPrompt },
    });

    try {
      const result = await delegationInvoke({
        fromProfile: input.leaderProfileId,
        toProfile: inst.profileId,
        message: `[${member.roleName}] ${member.responsibility}\n\nTask: ${input.userPrompt}`,
        stream: false,
      });
      const summary = result.ok ? (result.response ?? result.message ?? "") : (result.message ?? "failed");
      memberSummaries.push(`## ${member.roleName}\n${summary}`);
      insertRunEvent({
        runId: input.runId,
        eventType: result.ok ? "member_completed" : "member_failed",
        targetProfileId: inst.profileId,
        payload: { roleName: member.roleName, summary, code: result.errorCode, message: result.message },
      });
    } catch (err) {
      insertRunEvent({
        runId: input.runId,
        eventType: "member_failed",
        targetProfileId: inst.profileId,
        payload: {
          roleName: member.roleName,
          code: "TEAM_DELEGATION_FAILED",
          message: err instanceof Error ? err.message : String(err),
        },
      });
    }
  }

  const mergeSummary = memberSummaries.join("\n\n");
  insertArtifact({
    runId: input.runId,
    profileId: input.leaderProfileId,
    title: "Team structured report",
    artifactType: "markdown",
    previewText: mergeSummary.slice(0, 4000),
    source: "team_merge",
  });

  updateExpertRunStatus(input.runId, "completed", { resultSummary: mergeSummary.slice(0, 500) });
  insertRunEvent({
    runId: input.runId,
    eventType: "leader_merge",
    sourceProfileId: input.leaderProfileId,
    payload: { mergeStrategy: input.team.orchestration.mergeStrategy },
  });
}

export async function retryExpertRun(runId: string): Promise<SummonTeamResult> {
  const run = getExpertRun(runId);
  if (!run) {
    return { ok: false, errorCode: "EXPERT_RUN_NOT_FOUND", message: runId };
  }
  if (run.runType === "team" && run.teamId) {
    return summonTeam({ teamId: run.teamId, userPrompt: run.userPrompt, sessionId: run.sessionId });
  }
  if (run.expertId) {
    const { summonExpert } = await import("./expert-runtime");
    return summonExpert({
      expertId: run.expertId,
      userPrompt: run.userPrompt,
      sessionId: run.sessionId,
    });
  }
  return { ok: false, errorCode: "EXPERT_RUN_NOT_FOUND", message: runId };
}
