/** Hermes Experts Workspace — shared contract (v1.0). */

export type HermesExpertInstallStatus =
  | "not_installed"
  | "installing"
  | "installed"
  | "update_available"
  | "failed";

export type HermesExpertTrustStatus = "untrusted" | "trusted" | "disabled" | "blocked";

export type HermesExpertTeamInstallStatus =
  | "not_installed"
  | "partial_installed"
  | "installed"
  | "update_available"
  | "failed";

export type HermesTeamOrchestrationMode =
  | "leader_dispatch"
  | "parallel_then_merge"
  | "sequential_pipeline";

export type HermesTeamMergeStrategy =
  | "leader_summary"
  | "structured_report"
  | "vote_then_summary";

export type HermesExpertRunType = "single_expert" | "team";

export type HermesExpertRunStatus =
  | "created"
  | "preparing"
  | "dispatching"
  | "running"
  | "waiting_approval"
  | "merging"
  | "completed"
  | "failed"
  | "cancelled";

export type HermesWorkMode = "ask" | "plan" | "craft";

export type HermesExpertArtifactType =
  | "markdown"
  | "docx"
  | "pdf"
  | "xlsx"
  | "html"
  | "json"
  | "image"
  | "file";

export type HermesStarterPrompt = {
  title: string;
  prompt: string;
};

export type HermesExpertSkillBinding = {
  skillId: string;
  name: string;
  version: string;
  required: boolean;
  source: "nodeskclaw" | "local" | "bundled";
};

export type HermesExpertMcpBinding = {
  serverId: string;
  name: string;
  transport: string;
  url?: string;
  profileScoped?: boolean;
  required: boolean;
  trustRequired?: boolean;
};

export type HermesExpertToolsetBinding = {
  key: string;
  enabled: boolean;
};

export type HermesExpertPolicy = {
  allowedTools: string[];
  deniedTools?: string[];
  requireApproval?: string[];
  allowedDomains?: string[];
  delegationTargets?: string[];
};

export type HermesExpert = {
  expertId: string;
  slug: string;
  name: string;
  displayName: string;
  category: string;
  description: string;
  avatar?: string;
  provider: "nodeskclaw" | "local";
  version: string;
  tags: string[];
  domains: string[];
  profile: {
    profileId: string;
    runtimeType: "hermes-local";
    port?: number;
    modelPolicy?: {
      defaultModelId?: string;
      allowedModelIds?: string[];
    };
  };
  identity: {
    roleName: string;
    soulMd: string;
    userMd?: string;
    systemRules?: string[];
  };
  capabilities: {
    skills: HermesExpertSkillBinding[];
    mcpServers: HermesExpertMcpBinding[];
    toolsets: HermesExpertToolsetBinding[];
  };
  memory: {
    mode: "isolated" | "workspace_shared" | "temporary";
    seedMemoryMd?: string;
  };
  policy: HermesExpertPolicy;
  starterPrompts: HermesStarterPrompt[];
  installStatus: HermesExpertInstallStatus;
  trustStatus: HermesExpertTrustStatus;
};

export type HermesExpertTeam = {
  teamId: string;
  slug: string;
  name: string;
  displayName: string;
  category: string;
  description: string;
  avatar?: string;
  version: string;
  leader: { expertId: string; roleName: string };
  members: Array<{
    expertId: string;
    roleName: string;
    responsibility: string;
    required: boolean;
    order: number;
  }>;
  orchestration: {
    mode: HermesTeamOrchestrationMode;
    mergeStrategy: HermesTeamMergeStrategy;
    maxRounds: number;
  };
  starterPrompts: HermesStarterPrompt[];
  installStatus: HermesExpertTeamInstallStatus;
  memberCount?: number;
  tags?: string[];
};

export type HermesExpertArtifact = {
  id: string;
  runId: string;
  profileId?: string;
  title: string;
  artifactType: HermesExpertArtifactType;
  filePath?: string;
  mimeType?: string;
  sizeBytes?: number;
  previewText?: string;
  source: string;
  createdAt: string;
};

export type HermesExpertMemberRun = {
  memberProfileId: string;
  roleName: string;
  status: "pending" | "running" | "succeeded" | "failed" | "timeout";
  summary?: string;
  error?: { code: string; message: string };
};

export type HermesExpertRun = {
  runId: string;
  runType: HermesExpertRunType;
  expertId?: string;
  teamId?: string;
  activeProfileId: string;
  sessionId?: string;
  title: string;
  userPrompt: string;
  status: HermesExpertRunStatus;
  startedAt: string;
  completedAt?: string;
  memberRuns?: HermesExpertMemberRun[];
  artifacts?: HermesExpertArtifact[];
  events?: ExpertRunEvent[];
  error?: { code: string; message: string };
};

export type ExpertRunEvent = {
  id: string;
  runId: string;
  eventType: string;
  sourceProfileId?: string;
  targetProfileId?: string;
  payload?: Record<string, unknown>;
  createdAt: string;
};

export type ExpertRiskReport = {
  riskLevel: "P0" | "P1" | "P2" | "P3";
  warnings: string[];
  permissions: string[];
  localFileAccess?: string[];
  networkAccess?: string[];
  mcpServers?: string[];
  toolsets?: string[];
  requiresUserApproval?: boolean;
};

export type ExpertInstallPlanFile = {
  path: string;
  content: string;
  mergePolicy: "replace" | "skip_if_exists" | "append";
};

export type ExpertInstallPlanProfile = {
  profileId: string;
  displayName: string;
  port: number;
  files: ExpertInstallPlanFile[];
};

export type ExpertInstallPlan = {
  planId: string;
  target: { kind: "expert" | "expert_team"; id: string; version: string };
  profiles: ExpertInstallPlanProfile[];
  skills: Array<{
    skillId: string;
    name: string;
    version: string;
    installSource: string;
    required: boolean;
    checksum?: string;
  }>;
  mcpServers: Array<{
    serverId: string;
    name: string;
    url: string;
    transport: string;
    authRef?: string;
    trustRequired?: boolean;
  }>;
  riskReport: ExpertRiskReport;
};

export type ExpertCatalogQuery = {
  category?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
};

export type ExpertTeamCatalogQuery = ExpertCatalogQuery;

export type ExpertCatalogPage = {
  items: HermesExpert[];
  page: number;
  pageSize: number;
  total: number;
  source?: "remote" | "mock" | "cache";
};

export type ExpertTeamCatalogPage = {
  items: HermesExpertTeam[];
  page: number;
  pageSize: number;
  total: number;
  source?: "remote" | "mock" | "cache";
};

export type ExpertRunFilter = {
  status?: HermesExpertRunStatus | "all";
  runType?: HermesExpertRunType;
  limit?: number;
};

export type InstallOptions = {
  overwrite?: boolean;
  installSkills?: boolean;
  registerMcp?: boolean;
};

export type SummonExpertInput = {
  expertId: string;
  userPrompt?: string;
  sessionId?: string;
};

export type SummonTeamInput = {
  teamId: string;
  userPrompt?: string;
  sessionId?: string;
};

export type SummonExpertResult = {
  ok: boolean;
  expertId?: string;
  profileId?: string;
  runId?: string;
  sessionId?: string;
  runtimeStatus?: "running" | "starting" | "failed";
  message?: string;
  errorCode?: string;
};

export type SummonTeamResult = SummonExpertResult & {
  teamId?: string;
  leaderProfileId?: string;
};

export type ExpertRuntimeEvent = {
  type: "run_updated" | "run_event" | "artifact_created";
  runId: string;
  payload: Record<string, unknown>;
};

export type ExpertDesktopSyncStatus = {
  registered: boolean;
  desktopId?: string;
  lastHeartbeatAt?: string;
  lastError?: string;
  lastRegisterAt?: string;
};

export type ExpertPreflightResult = {
  ok: boolean;
  errorCode?: string;
  message?: string;
  warnings?: string[];
};

export type HermesExpertsActionResult<T = void> = {
  ok: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
};

export interface HermesExpertsAPI {
  listExpertCatalog: (input?: ExpertCatalogQuery) => Promise<ExpertCatalogPage>;
  getExpert: (expertId: string) => Promise<HermesExpert | null>;
  listExpertTeams: (input?: ExpertTeamCatalogQuery) => Promise<ExpertTeamCatalogPage>;
  getExpertTeam: (teamId: string) => Promise<HermesExpertTeam | null>;
  previewInstallExpert: (expertId: string) => Promise<HermesExpertsActionResult<ExpertInstallPlan>>;
  installExpert: (
    expertId: string,
    options?: InstallOptions,
  ) => Promise<HermesExpertsActionResult<{ profileId: string }>>;
  previewInstallTeam: (teamId: string) => Promise<HermesExpertsActionResult<ExpertInstallPlan>>;
  installTeam: (
    teamId: string,
    options?: InstallOptions,
  ) => Promise<HermesExpertsActionResult<{ profileIds: string[] }>>;
  summonExpert: (input: SummonExpertInput) => Promise<SummonExpertResult>;
  summonTeam: (input: SummonTeamInput) => Promise<SummonTeamResult>;
  listExpertRuns: (filter?: ExpertRunFilter) => Promise<HermesExpertRun[]>;
  getExpertRun: (runId: string) => Promise<HermesExpertRun | null>;
  cancelExpertRun: (runId: string) => Promise<HermesExpertsActionResult>;
  retryExpertRun: (runId: string) => Promise<HermesExpertsActionResult<SummonExpertResult | SummonTeamResult>>;
  setExpertTrust: (
    expertId: string,
    trustStatus: HermesExpertTrustStatus,
  ) => Promise<HermesExpertsActionResult>;
  preflightExpert: (
    profileId: string,
    port?: number,
  ) => Promise<ExpertPreflightResult>;
  dispatchTeam: (input: {
    runId: string;
    teamId: string;
    leaderProfileId: string;
    userPrompt: string;
  }) => Promise<HermesExpertsActionResult>;
  getDesktopSyncStatus: () => Promise<HermesExpertsActionResult<ExpertDesktopSyncStatus>>;
  registerDesktop: () => Promise<HermesExpertsActionResult<ExpertDesktopSyncStatus>>;
  onExpertRuntimeEvent: (callback: (event: ExpertRuntimeEvent) => void) => () => void;
}
