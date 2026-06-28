import type {
  CallCatalogSkillInput,
  CallCatalogSkillResult,
  SummonExpertInput,
  SummonExpertResult,
} from "../../shared/hermes-experts/hermes-experts-contract";
import { isHermesExpertsError } from "../../shared/hermes-experts/hermes-experts-errors";
import { getExpert } from "./expert-catalog-client";
import { getMockExpert } from "./expert-mock-catalog";
import {
  buildExpertToolArguments,
  getExpertMcpClient,
  listCatalogSkills,
  resolveDefaultExpertSkill,
} from "./expert-mcp-client";
import { extractTextContent } from "./expert-mcp-mappers";
import {
  createExpertRun,
  insertArtifact,
  insertRunEvent,
  updateExpertRunStatus,
} from "./expert-runtime-db";
import { emitExpertRuntimeEvent } from "./expert-run-events";

function buildArtifactTitle(
  catalogKind: CallCatalogSkillInput["catalogKind"],
  displayName: string,
  skillDisplayName: string,
): string {
  if (catalogKind === "expert_team") {
    return `${displayName} - 团队结果`;
  }
  return `${displayName} - ${skillDisplayName}`;
}

export async function callCatalogSkill(
  input: CallCatalogSkillInput,
): Promise<CallCatalogSkillResult> {
  const prompt = input.prompt.trim();
  const skillName = input.skillName.trim();
  const slug = input.slug.trim();

  if (!slug) {
    return { ok: false, errorCode: "EXPERT_TOOL_NAME_REQUIRED", message: "slug is required" };
  }
  if (!skillName) {
    return { ok: false, errorCode: "EXPERT_TOOL_NAME_REQUIRED", message: "skillName is required" };
  }
  if (!prompt) {
    return { ok: false, errorCode: "EXPERT_PROMPT_REQUIRED", message: "prompt is required" };
  }

  const run = createExpertRun({
    runType: input.catalogKind === "expert_team" ? "team" : "single_expert",
    expertId: input.catalogKind === "expert" ? slug : undefined,
    teamId: input.catalogKind === "expert_team" ? slug : undefined,
    profileId: "remote",
    sessionId: input.sessionId,
    title: slug,
    userPrompt: prompt,
    status: "running",
    catalogSlug: slug,
    catalogKind: input.catalogKind,
    skillName,
    executionMode: "remote_mcp",
  });

  insertRunEvent({
    runId: run.runId,
    eventType: "mcp.call.started",
    payload: {
      slug,
      catalogKind: input.catalogKind,
      skillName,
    },
  });

  try {
    const result = await getExpertMcpClient().callSkill({
      slug,
      skillName,
      arguments: buildExpertToolArguments({ prompt, context: input.context as never }),
    });

    const responseText = extractTextContent(result);
    const structuredContent = result.structuredContent;

    if (!responseText && !structuredContent) {
      updateExpertRunStatus(run.runId, "failed", {
        errorCode: "EXPERT_RESPONSE_EMPTY",
        errorMessage: "Expert MCP returned empty response",
      });
      insertRunEvent({
        runId: run.runId,
        eventType: "mcp.call.failed",
        payload: { slug, catalogKind: input.catalogKind, skillName, errorCode: "EXPERT_RESPONSE_EMPTY" },
      });
      emitExpertRuntimeEvent({
        type: "run_updated",
        runId: run.runId,
        payload: { status: "failed" },
      });
      return {
        ok: false,
        runId: run.runId,
        errorCode: "EXPERT_RESPONSE_EMPTY",
        message: "Expert MCP returned empty response",
      };
    }

    updateExpertRunStatus(run.runId, "completed", {
      resultSummary: responseText,
      structuredContentJson: structuredContent ? JSON.stringify(structuredContent) : undefined,
      invocationId: structuredContent?.invocationId,
    });

    insertRunEvent({
      runId: run.runId,
      eventType: "mcp.call.completed",
      payload: {
        slug,
        catalogKind: input.catalogKind,
        skillName,
        structuredContent,
      },
    });

    const skills = await listCatalogSkills(slug);
    const skillMeta = skills.find((s) => s.skillName === skillName);
    const artifactTitle = buildArtifactTitle(
      input.catalogKind,
      slug,
      skillMeta?.displayName ?? skillName,
    );

    if (responseText) {
      const artifact = insertArtifact({
        runId: run.runId,
        profileId: "remote",
        title: artifactTitle,
        artifactType: "markdown",
        previewText: responseText.slice(0, 4000),
        mimeType: "text/markdown",
        source: "expert_mcp_response",
      });
      emitExpertRuntimeEvent({
        type: "artifact_created",
        runId: run.runId,
        payload: { artifactId: artifact.id },
      });
    }

    emitExpertRuntimeEvent({
      type: "run_updated",
      runId: run.runId,
      payload: { status: "completed" },
    });

    const { reportExpertRunIfConfigured } = await import("./expert-desktop-client");
    void reportExpertRunIfConfigured(run.runId);

    return {
      ok: true,
      runId: run.runId,
      responseText,
      structuredContent,
    };
  } catch (err) {
    const errorCode = isHermesExpertsError(err) ? err.code : "EXPERT_MCP_CALL_FAILED";
    const message = err instanceof Error ? err.message : String(err);

    updateExpertRunStatus(run.runId, "failed", {
      errorCode,
      errorMessage: message,
    });

    insertRunEvent({
      runId: run.runId,
      eventType: "mcp.call.failed",
      payload: {
        slug,
        catalogKind: input.catalogKind,
        skillName,
        errorCode,
        message,
      },
    });

    emitExpertRuntimeEvent({
      type: "run_updated",
      runId: run.runId,
      payload: { status: "failed" },
    });

    return {
      ok: false,
      runId: run.runId,
      errorCode,
      message,
    };
  }
}

function resolveExpertSlug(expert: NonNullable<Awaited<ReturnType<typeof getExpert>>>): string {
  return (expert.catalogSlug ?? expert.expertSlug ?? expert.slug ?? expert.expertId).trim();
}

export async function summonExpert(input: SummonExpertInput): Promise<SummonExpertResult> {
  const expert = (await getExpert(input.expertId)) ?? getMockExpert(input.expertId);
  if (!expert) {
    return { ok: false, errorCode: "EXPERT_NOT_FOUND", message: input.expertId };
  }

  const slug = (input.slug ?? resolveExpertSlug(expert)).trim();
  if (!slug) {
    return { ok: false, errorCode: "EXPERT_TOOL_NAME_REQUIRED", message: expert.expertId };
  }

  const prompt =
    input.userPrompt?.trim() ||
    expert.starterPrompts[0]?.prompt ||
    `请执行 ${expert.displayName} 任务。`;

  const skillName =
    input.skillName?.trim() ?? (await resolveDefaultExpertSkill(slug, "expert_skill"));
  if (!skillName) {
    return { ok: false, errorCode: "EXPERT_TOOL_NAME_REQUIRED", message: "No callable skill found" };
  }

  const result = await callCatalogSkill({
    slug,
    catalogKind: "expert",
    skillName,
    prompt,
    context: input.context,
    sessionId: input.sessionId,
  });

  if (!result.ok) {
    return {
      ok: false,
      errorCode: result.errorCode,
      message: result.message,
      expertId: input.expertId,
      runId: result.runId,
      approvalRequired: result.errorCode === "EXPERT_APPROVAL_REQUIRED",
    };
  }

  return {
    ok: true,
    expertId: input.expertId,
    profileId: "remote",
    runId: result.runId,
    sessionId: input.sessionId,
    runtimeStatus: "running",
    message: `Expert ${expert.displayName} completed`,
  };
}

export async function cancelExpertRun(runId: string): Promise<{ ok: boolean; errorCode?: string; message?: string }> {
  updateExpertRunStatus(runId, "cancelled");
  insertRunEvent({ runId, eventType: "task.cancelled", payload: {} });
  emitExpertRuntimeEvent({ type: "run_updated", runId, payload: { status: "cancelled" } });
  return { ok: true };
}

/** @deprecated Expert MCP Gateway v6 — synchronous runs have no remote task to sync. */
export async function syncExpertRun(runId: string): Promise<{ ok: boolean; errorCode?: string; message?: string }> {
  const { getExpertRun } = await import("./expert-runtime-db");
  const run = getExpertRun(runId);
  if (!run) {
    return { ok: false, errorCode: "EXPERT_RUN_NOT_FOUND", message: runId };
  }
  if (!run.remoteTaskId) {
    return { ok: true };
  }
  const { syncRemoteRunFromTask } = await import("./expert-remote-client");
  await syncRemoteRunFromTask(runId, run.remoteTaskId);
  return { ok: true };
}

export async function resolveDefaultCallableSkill(
  slug: string,
  kind: "expert_skill" | "expert_team_skill",
): Promise<string | null> {
  return resolveDefaultExpertSkill(slug, kind);
}
