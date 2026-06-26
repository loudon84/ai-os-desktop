import { startProfile, resolveProfileId } from "../profile-runtime-manager";
import { getRuntimeInstance } from "../profile-runtime-db";
import type { SummonExpertInput, SummonExpertResult } from "../../shared/hermes-experts/hermes-experts-contract";
import { getExpert } from "./expert-catalog-client";
import { getMockExpert } from "./expert-mock-catalog";
import {
  createExpertRun,
  getExpertInstance,
  insertRunEvent,
  updateExpertRunStatus,
} from "./expert-runtime-db";
import { emitExpertRuntimeEvent } from "./expert-run-events";
import { runExpertPreflight } from "./expert-preflight";

export async function summonExpert(input: SummonExpertInput): Promise<SummonExpertResult> {
  const expert = (await getExpert(input.expertId)) ?? getMockExpert(input.expertId);
  if (!expert) {
    return { ok: false, errorCode: "EXPERT_NOT_FOUND", message: input.expertId };
  }

  const instance = getExpertInstance(input.expertId);
  if (!instance || instance.status !== "installed") {
    return {
      ok: false,
      errorCode: "EXPERT_NOT_INSTALLED",
      message: "Expert is not installed. Install before summon.",
      expertId: input.expertId,
    };
  }

  const profileId = instance.profileId;
  const preflight = await runExpertPreflight({ profileId });
  if (!preflight.ok) {
    return {
      ok: false,
      errorCode: preflight.errorCode ?? "EXPERT_PROFILE_START_FAILED",
      message: preflight.message ?? "Preflight failed",
      expertId: input.expertId,
      profileId,
    };
  }
  const resolvedId = resolveProfileId(profileId);
  let runtimeStatus: SummonExpertResult["runtimeStatus"] = "starting";

  const existing = getRuntimeInstance(resolvedId);
  if (!existing || existing.status !== "running") {
    try {
      await startProfile(resolvedId);
      runtimeStatus = "running";
    } catch (err) {
      return {
        ok: false,
        errorCode: "EXPERT_PROFILE_START_FAILED",
        message: err instanceof Error ? err.message : String(err),
        expertId: input.expertId,
        profileId,
      };
    }
  } else {
    runtimeStatus = "running";
  }

  const run = createExpertRun({
    runType: "single_expert",
    expertId: input.expertId,
    profileId,
    sessionId: input.sessionId,
    title: expert.displayName,
    userPrompt: input.userPrompt ?? "",
    status: "running",
  });

  insertRunEvent({
    runId: run.runId,
    eventType: "profile_started",
    sourceProfileId: profileId,
    payload: { expertId: input.expertId },
  });

  emitExpertRuntimeEvent({
    type: "run_updated",
    runId: run.runId,
    payload: { status: "running", expertId: input.expertId },
  });

  return {
    ok: true,
    expertId: input.expertId,
    profileId,
    runId: run.runId,
    sessionId: input.sessionId,
    runtimeStatus,
    message: `Summoned ${expert.displayName}`,
  };
}

export async function cancelExpertRun(runId: string): Promise<{ ok: boolean; errorCode?: string; message?: string }> {
  updateExpertRunStatus(runId, "cancelled");
  insertRunEvent({ runId, eventType: "run_cancelled", payload: {} });
  emitExpertRuntimeEvent({ type: "run_updated", runId, payload: { status: "cancelled" } });
  return { ok: true };
}
