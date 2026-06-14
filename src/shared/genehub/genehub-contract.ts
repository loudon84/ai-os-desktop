/** v6.5 — GeneHub Hermes Skill Sync (Desktop ↔ nodeskclaw). */

import type { GeneHubErrorCode } from "./genehub-errors";

export type GeneHubConnectionStatus =
  | "connected"
  | "degraded"
  | "unauthorized"
  | "forbidden"
  | "offline"
  | "misconfigured"
  | "disabled";

export type GeneHubOsType = "windows" | "macos" | "linux";

export type InstallJobAction = "install" | "update" | "uninstall";

export type InstallJobSource = "mcp_agent_request" | "desktop_manual" | "server_assigned";

export type InstallJobStatus =
  | "pending"
  | "claimed"
  | "downloading"
  | "validating"
  | "installing"
  | "installed"
  | "failed"
  | "cancelled";

export type InstallLogStatus = "success" | "failed" | "info";

export interface GeneHubDescriptor {
  enabled: boolean;
  name: string;
  apiPrefix: string;
  healthEndpoint: string;
  requiresAuth: boolean;
  minServerVersion?: string;
  apiBaseUrl: string;
  backendBaseUrl: string;
}

export interface GeneHubConnection {
  ok: boolean;
  status: GeneHubConnectionStatus;
  enabled: boolean;
  loggedIn: boolean;
  memberVerified: boolean;
  backendBaseUrl: string;
  apiBaseUrl: string;
  descriptor: GeneHubDescriptor | null;
  healthOk: boolean;
  healthDetail: string;
  userDisplayName: string | null;
  lastError: string | null;
  errorCode?: GeneHubErrorCode;
  initialized: boolean;
  lastSyncAt: string | null;
}

export interface GeneHubRuntimeConfig {
  enabled: boolean;
  heartbeatIntervalMs: number;
  pendingJobsIntervalMs: number;
  autoInstallAssignedJobs: boolean;
  verifySignature: boolean;
  updatedAt: string;
}

export const DEFAULT_GENEHUB_RUNTIME_CONFIG: GeneHubRuntimeConfig = {
  enabled: true,
  heartbeatIntervalMs: 60_000,
  pendingJobsIntervalMs: 60_000,
  autoInstallAssignedJobs: false,
  verifySignature: true,
  updatedAt: "",
};

export interface DesktopDeviceIdentity {
  deviceName: string;
  deviceFingerprint: string;
  osType: GeneHubOsType;
  osVersion: string;
  appVersion: string;
}

export interface HermesProfileDto {
  profileName: string;
  profileId: string;
  hermesHome: string;
  gatewayUrl?: string;
  gatewayPort?: number;
  runtimeVersion?: string;
  capabilities: {
    skills: boolean;
    scripts: boolean;
    reload: boolean;
  };
}

export type HermesProfileRegisterInput = HermesProfileDto & {
  desktopDeviceId: string;
};

export interface GeneHubSkill {
  geneSlug: string;
  geneVersion: string;
  skillName: string;
  displayName: string;
  description: string;
  category?: string;
  tags?: string[];
  installed: boolean;
  installedVersion?: string;
  updateAvailable: boolean;
  permissions: {
    canInstall: boolean;
    canUpdate: boolean;
    canUninstall: boolean;
  };
}

export interface InstallJob {
  jobId: string;
  profileId: string;
  profileName?: string;
  geneSlug: string;
  geneVersion: string;
  skillName: string;
  action: InstallJobAction;
  status: InstallJobStatus;
  source?: InstallJobSource;
  createdAt?: string;
  assignedAt?: string;
  claimedAt?: string;
  lastUpdatedAt?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface GeneHubPendingJobCache {
  updatedAt: string;
  jobs: InstallJob[];
}

export interface GeneHubInstallBundlePreviewFile {
  relativePath: string;
  encoding?: "utf-8" | "base64";
  sizeHint?: number;
}

export interface GeneHubInstallBundlePreview {
  jobId: string;
  skillName: string;
  geneSlug: string;
  geneVersion: string;
  manifest: GeneHubBundleManifest;
  files: GeneHubInstallBundlePreviewFile[];
  scripts?: GeneHubInstallBundlePreviewFile[];
  previewLimited?: boolean;
  previewError?: string;
}

export interface GeneHubRegistrationSummary {
  pendingMcpJobCount: number;
  lastInstalled?: {
    jobId: string;
    skillName: string;
    geneSlug: string;
    installedAt: string;
  };
  lastFailed?: {
    jobId: string;
    skillName: string;
    geneSlug: string;
    errorCode?: string;
    errorMessage?: string;
    failedAt: string;
  };
}

export type McpRegistrationJobGroup = "awaiting_confirm" | "in_progress" | "completed" | "failed";

export interface GeneHubMcpRegistrationJobsResult {
  groups: Record<McpRegistrationJobGroup, InstallJob[]>;
  jobs: InstallJob[];
}

export interface GeneHubBundleFile {
  relativePath: string;
  content: string;
  encoding?: "utf-8" | "base64";
}

export interface GeneHubBundleManifest {
  geneSlug: string;
  geneVersion: string;
  skillName: string;
  manifestHash?: string;
  bundleHash?: string;
  signature?: string;
  compatibility?: {
    minHermesVersion?: string;
    profiles?: string[];
  };
}

export interface GeneHubBundle {
  jobId: string;
  manifest: GeneHubBundleManifest;
  files: GeneHubBundleFile[];
  scripts?: GeneHubBundleFile[];
}

export interface InstalledSkillRecord {
  geneSlug: string;
  geneVersion: string;
  skillName: string;
  installedAt: string;
  source: "nodeskclaw-genehub";
  jobId: string;
  profileName: string;
}

export interface InstallLogEntry {
  time: string;
  jobId: string;
  geneSlug: string;
  step: string;
  status: InstallLogStatus;
  message: string;
  errorCode?: string;
}

export interface GeneHubActionResult {
  ok: boolean;
  error?: string;
  errorCode?: GeneHubErrorCode;
}

export interface GeneHubInitializeResult extends GeneHubActionResult {
  deviceRegistered?: boolean;
  profilesRegistered?: number;
  syncedProfiles?: number;
}

export interface GeneHubCreateInstallJobInput {
  profileId?: string;
  geneSlug: string;
  action: InstallJobAction;
}

export interface GeneHubProfileScopedInput {
  profileId?: string;
}

/** Renderer event when pending GeneHub jobs cache changes (Main → Renderer). */
export const GENEHUB_PENDING_JOBS_CHANGED = "genehub:pending-jobs-changed";

export interface GeneHubRuntimeAPI {
  getConnection(forceRefresh?: boolean): Promise<GeneHubConnection>;
  probeConnection(): Promise<GeneHubConnection>;
  initialize(): Promise<GeneHubInitializeResult>;
  getConfig(): Promise<GeneHubRuntimeConfig>;
  listAuthorizedSkills(input?: GeneHubProfileScopedInput): Promise<GeneHubSkill[]>;
  listPendingJobs(input?: GeneHubProfileScopedInput): Promise<InstallJob[]>;
  createInstallJob(input: GeneHubCreateInstallJobInput): Promise<InstallJob>;
  installJob(jobId: string): Promise<GeneHubActionResult>;
  updateSkill(input: GeneHubProfileScopedInput & { geneSlug: string }): Promise<GeneHubActionResult>;
  uninstallSkill(input: GeneHubProfileScopedInput & { geneSlug: string }): Promise<GeneHubActionResult>;
  syncInstalledSkills(input?: GeneHubProfileScopedInput): Promise<GeneHubActionResult>;
  getInstallLogs(limit?: number): Promise<InstallLogEntry[]>;
  listMcpRegistrationJobs(input?: GeneHubProfileScopedInput): Promise<GeneHubMcpRegistrationJobsResult>;
  previewInstallBundle(jobId: string): Promise<GeneHubInstallBundlePreview>;
  ignoreInstallJob(jobId: string): Promise<GeneHubActionResult>;
  getRegistrationSummary(): Promise<GeneHubRegistrationSummary>;
  onPendingJobsChanged(callback: () => void): () => void;
}

/** Valid skill_name per PRD §7.4 */
export const GENEHUB_SKILL_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
