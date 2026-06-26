import { unwrapNodeDeskClawResponse } from "../auth/nodeskclaw-auth-response";
import { resolveBackendBaseUrl } from "../mcp-skill-gateway-runtime/mcp-skill-gateway-config";
import { getMcpAccessToken } from "../mcp-skill-gateway-runtime/mcp-token-provider";
import { getDeviceIdentity } from "../genehub/device-identity";
import type {
  ExpertCatalogPage,
  ExpertCatalogQuery,
  ExpertInstallPlan,
  ExpertTeamCatalogPage,
  ExpertTeamCatalogQuery,
  HermesExpert,
  HermesExpertTeam,
} from "../../shared/hermes-experts/hermes-experts-contract";
import { HermesExpertsError } from "../../shared/hermes-experts/hermes-experts-errors";
import {
  MOCK_EXPERT_CATALOG,
  MOCK_EXPERT_TEAMS,
  getMockExpert,
  getMockTeam,
} from "./expert-mock-catalog";
import {
  cacheExpertCatalog,
  cacheExpertTeamCatalog,
  getCachedExpert,
  getCachedTeam,
  getExpertInstance,
  listCachedExperts,
  listCachedTeams,
} from "./expert-runtime-db";

function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

async function expertsFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const backend = resolveBackendBaseUrl();
  if (!backend) {
    throw new HermesExpertsError("NODESKCLAW_BACKEND_UNREACHABLE", "Backend URL is not configured");
  }
  const token = getMcpAccessToken();
  if (!token) {
    throw new HermesExpertsError("NODESKCLAW_UNAUTHORIZED", "Desktop login required");
  }
  const device = getDeviceIdentity();
  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
    "X-Desktop-Id": device.deviceFingerprint,
    "X-Client-Version": `copilot-desktop/${process.env.npm_package_version ?? "7.1.0"}`,
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (init?.body) headers["Content-Type"] = "application/json";

  const res = await fetch(joinUrl(backend, path), { ...init, headers });
  if (!res.ok) {
    throw new HermesExpertsError(
      res.status === 401 ? "NODESKCLAW_UNAUTHORIZED" : "NODESKCLAW_BACKEND_UNREACHABLE",
      `HTTP ${res.status}`,
    );
  }
  const json = (await res.json()) as unknown;
  return unwrapNodeDeskClawResponse<T>(json);
}

function applyInstallStatus(expert: HermesExpert): HermesExpert {
  const instance = getExpertInstance(expert.expertId);
  if (!instance) return expert;
  return {
    ...expert,
    installStatus: instance.status === "installed" ? "installed" : expert.installStatus,
    trustStatus: instance.trustStatus as HermesExpert["trustStatus"],
  };
}

function filterExperts(items: HermesExpert[], query?: ExpertCatalogQuery): HermesExpert[] {
  let result = items.map(applyInstallStatus);
  if (query?.category && query.category !== "all") {
    result = result.filter((e) => e.category === query.category);
  }
  if (query?.keyword?.trim()) {
    const q = query.keyword.trim().toLowerCase();
    result = result.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }
  return result;
}

function filterTeams(items: HermesExpertTeam[], query?: ExpertTeamCatalogQuery): HermesExpertTeam[] {
  let result = items;
  if (query?.category && query.category !== "all") {
    result = result.filter((t) => t.category === query.category);
  }
  if (query?.keyword?.trim()) {
    const q = query.keyword.trim().toLowerCase();
    result = result.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.tags ?? []).some((tag) => tag.toLowerCase().includes(q)),
    );
  }
  return result;
}

export async function listExpertCatalog(query?: ExpertCatalogQuery): Promise<ExpertCatalogPage> {
  const page = query?.page ?? 1;
  const pageSize = query?.pageSize ?? 20;
  try {
    const params = new URLSearchParams();
    if (query?.category) params.set("category", query.category);
    if (query?.keyword) params.set("keyword", query.keyword);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    const data = await expertsFetch<{ items: HermesExpert[]; page: number; pageSize: number; total: number }>(
      `/api/v1/hermes/experts?${params.toString()}`,
    );
    cacheExpertCatalog(data.items, "remote");
    const items = filterExperts(data.items, query);
    return { items, page: data.page, pageSize: data.pageSize, total: data.total, source: "remote" };
  } catch {
    const cached = listCachedExperts();
    const source = cached.length > 0 ? "cache" : "mock";
    const base = cached.length > 0 ? cached : MOCK_EXPERT_CATALOG;
    if (source === "mock") cacheExpertCatalog(base, "mock");
    const items = filterExperts(base, query);
    return { items, page, pageSize, total: items.length, source };
  }
}

export async function getExpert(expertId: string): Promise<HermesExpert | null> {
  try {
    const data = await expertsFetch<HermesExpert>(`/api/v1/hermes/experts/${encodeURIComponent(expertId)}`);
    cacheExpertCatalog([data], "remote");
    return applyInstallStatus(data);
  } catch {
    const cached = getCachedExpert(expertId) ?? getMockExpert(expertId);
    return cached ? applyInstallStatus(cached) : null;
  }
}

export async function listExpertTeams(query?: ExpertTeamCatalogQuery): Promise<ExpertTeamCatalogPage> {
  const page = query?.page ?? 1;
  const pageSize = query?.pageSize ?? 20;
  try {
    const params = new URLSearchParams();
    if (query?.category) params.set("category", query.category);
    if (query?.keyword) params.set("keyword", query.keyword);
    const data = await expertsFetch<{ items: HermesExpertTeam[]; page?: number; pageSize?: number; total?: number }>(
      `/api/v1/hermes/expert-teams?${params.toString()}`,
    );
    cacheExpertTeamCatalog(data.items);
    const items = filterTeams(data.items, query);
    return {
      items,
      page: data.page ?? page,
      pageSize: data.pageSize ?? pageSize,
      total: data.total ?? items.length,
      source: "remote",
    };
  } catch {
    const cached = listCachedTeams();
    const source = cached.length > 0 ? "cache" : "mock";
    const base = cached.length > 0 ? cached : MOCK_EXPERT_TEAMS;
    if (source === "mock") cacheExpertTeamCatalog(base);
    const items = filterTeams(base, query);
    return { items, page, pageSize, total: items.length, source };
  }
}

export async function getExpertTeam(teamId: string): Promise<HermesExpertTeam | null> {
  try {
    const data = await expertsFetch<HermesExpertTeam>(
      `/api/v1/hermes/expert-teams/${encodeURIComponent(teamId)}`,
    );
    cacheExpertTeamCatalog([data]);
    return data;
  } catch {
    return getCachedTeam(teamId) ?? getMockTeam(teamId);
  }
}

function buildLocalInstallPlan(expert: HermesExpert): ExpertInstallPlan {
  return {
    planId: `plan_${expert.expertId}_local`,
    target: { kind: "expert", id: expert.expertId, version: expert.version },
    profiles: [
      {
        profileId: expert.profile.profileId,
        displayName: expert.displayName,
        port: expert.profile.port ?? 9601,
        files: [
          { path: "SOUL.md", content: expert.identity.soulMd, mergePolicy: "replace" },
          {
            path: "USER.md",
            content: expert.identity.userMd ?? "",
            mergePolicy: "skip_if_exists",
          },
        ],
      },
    ],
    skills: expert.capabilities.skills.map((s) => ({
      skillId: s.skillId,
      name: s.name,
      version: s.version,
      installSource: s.source,
      required: s.required,
    })),
    mcpServers: expert.capabilities.mcpServers.map((m) => ({
      serverId: m.serverId,
      name: m.name,
      url: m.url ?? "",
      transport: m.transport,
      trustRequired: m.trustRequired,
    })),
    riskReport: {
      riskLevel: expert.capabilities.mcpServers.length > 0 ? "P1" : "P2",
      warnings: expert.capabilities.mcpServers.map((m) => `MCP: ${m.name}`),
      permissions: expert.policy.allowedTools,
      requiresUserApproval: true,
    },
  };
}

function buildLocalTeamInstallPlan(team: HermesExpertTeam, experts: HermesExpert[]): ExpertInstallPlan {
  const profiles = experts.map((e) => ({
    profileId: e.profile.profileId,
    displayName: e.displayName,
    port: e.profile.port ?? 9601,
    files: [{ path: "SOUL.md", content: e.identity.soulMd, mergePolicy: "skip_if_exists" as const }],
  }));
  return {
    planId: `plan_${team.teamId}_local`,
    target: { kind: "expert_team", id: team.teamId, version: team.version },
    profiles,
    skills: [],
    mcpServers: [],
    riskReport: {
      riskLevel: "P1",
      warnings: ["该团队会创建多个 Hermes Profile。"],
      permissions: ["profile.create", "profile.delegate"],
      requiresUserApproval: true,
    },
  };
}

export async function fetchExpertInstallPlan(expertId: string): Promise<ExpertInstallPlan> {
  const expert = (await getExpert(expertId)) ?? getMockExpert(expertId);
  if (!expert) throw new HermesExpertsError("EXPERT_NOT_FOUND", expertId);
  try {
    const device = getDeviceIdentity();
    return await expertsFetch<ExpertInstallPlan>(
      `/api/v1/hermes/experts/${encodeURIComponent(expertId)}/install-plan`,
      {
        method: "POST",
        body: JSON.stringify({
          desktopId: device.deviceFingerprint,
          targetProfileId: expert.profile.profileId,
          options: { overwrite: false, installSkills: true, registerMcp: true },
        }),
      },
    );
  } catch {
    return buildLocalInstallPlan(expert);
  }
}

export async function fetchTeamInstallPlan(teamId: string): Promise<ExpertInstallPlan> {
  const team = (await getExpertTeam(teamId)) ?? getMockTeam(teamId);
  if (!team) throw new HermesExpertsError("TEAM_NOT_FOUND", teamId);
  const memberExperts = (
    await Promise.all(
      [team.leader.expertId, ...team.members.map((m) => m.expertId)].map((id) => getExpert(id)),
    )
  ).filter((e): e is HermesExpert => e != null);
  try {
    const device = getDeviceIdentity();
    return await expertsFetch<ExpertInstallPlan>(
      `/api/v1/hermes/expert-teams/${encodeURIComponent(teamId)}/install-plan`,
      {
        method: "POST",
        body: JSON.stringify({
          desktopId: device.deviceFingerprint,
          options: { overwrite: false, installSkills: true, registerMcp: true },
        }),
      },
    );
  } catch {
    return buildLocalTeamInstallPlan(team, memberExperts);
  }
}
