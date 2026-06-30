import { workApi } from "./workApi";
import type {
  ExpertGatewayStatus,
  WorkChatSelectedExpert,
  WorkChatSelectedSkill,
  WorkExpertGatewayCallInput,
  WorkExpertGatewayCallResult,
} from "../types/work-chat";

function expertsApi(): NonNullable<typeof window.hermesExperts> {
  if (!window.hermesExperts) {
    throw new Error("window.hermesExperts is not available");
  }
  return window.hermesExperts;
}

function mapGatewayStatus(health: Awaited<ReturnType<typeof workApi.gateway.health>>): ExpertGatewayStatus {
  if (!health?.ok) return "unavailable";

  if (health.runtimeReady === false && health.callableSkills === 0) {
    return "unavailable";
  }

  return "remote";
}

export const workExpertGatewayApi = {
  async getHealth(): Promise<ExpertGatewayStatus> {
    try {
      const health = await workApi.gateway.health();
      return mapGatewayStatus(health);
    } catch {
      return "error";
    }
  },

  async listAuthorizedExperts(): Promise<WorkChatSelectedExpert[]> {
    const experts = await workApi.experts.list();
    return experts.map((e) => ({
      expertId: e.id,
      slug: e.slug,
      name: e.displayName,
      description: e.description,
      category: e.category,
      riskLevel: e.riskLevel,
    }));
  },

  async listExpertSkills(expertSlug: string): Promise<WorkChatSelectedSkill[]> {
    const skills = await workApi.experts.listCatalogSkills(expertSlug);
    return skills.map((s) => ({
      name: s.name,
      displayName: s.displayName,
      description: s.description,
      riskLevel: s.riskLevel,
      outputFormat: s.outputFormat,
    }));
  },

  async callExpertSkill(input: WorkExpertGatewayCallInput): Promise<WorkExpertGatewayCallResult> {
    try {
      const result = await expertsApi().callCatalogSkill({
        slug: input.expertSlug,
        catalogKind: "expert",
        skillName: input.skillName,
        prompt: input.prompt,
        sessionId: input.context?.sessionId ?? undefined,
        context: {
          source: input.context?.source ?? "chat",
          profile: input.context?.profile,
          modelId: input.context?.modelId,
          permissionMode: input.permissionMode,
          attachmentIds: input.attachmentIds,
        },
      });

      if (!result.ok) {
        return {
          ok: false,
          error: result.message ?? result.errorCode ?? "Expert Gateway call failed",
        };
      }

      return {
        ok: true,
        responseText: result.responseText ?? "(empty response)",
      };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },
};
