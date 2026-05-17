import { ElectronAPI } from "@electron-toolkit/preload";
import type { AppLocale } from "../shared/i18n/types";
import type { AiosBrowserAPI } from "./browser-api";
import type { ProfileRuntimeAPI, ProfileEntryAPI } from "../shared/profile-runtime/profile-runtime-contract";
import type { InstallerPrecheck } from "../shared/enterprise/enterprise-contract";

interface InstallStatus {
  installed: boolean;
  configured: boolean;
  hasApiKey: boolean;
  verified: boolean;
}

interface InstallProgress {
  step: number;
  totalSteps: number;
  title: string;
  detail: string;
  log: string;
}

interface HermesAPI {
  // Installation
  checkInstall: () => Promise<InstallStatus>;
  checkInstallStatus: () => Promise<InstallStatus>;
  verifyInstall: () => Promise<boolean>;
  startInstall: () => Promise<{ success: boolean; error?: string }>;
  startInstallWithSource: (
    sourceConfig: unknown,
  ) => Promise<{ success: boolean; error?: string }>;
  showOpenDialog: (
    opts: Electron.OpenDialogOptions,
  ) => Promise<Electron.OpenDialogReturnValue>;
  onInstallProgress: (
    callback: (progress: InstallProgress) => void,
  ) => () => void;

  // Hermes engine info
  getHermesVersion: () => Promise<string | null>;
  refreshHermesVersion: () => Promise<string | null>;
  runHermesDoctor: () => Promise<string>;
  runHermesUpdate: () => Promise<{ success: boolean; error?: string }>;

  // OpenClaw migration
  checkOpenClaw: () => Promise<{ found: boolean; path: string | null }>;
  runClawMigrate: () => Promise<{ success: boolean; error?: string }>;

  getLocale: () => Promise<AppLocale>;
  setLocale: (locale: AppLocale) => Promise<AppLocale>;

  // Configuration (profile-aware)
  getEnv: (profile?: string) => Promise<Record<string, string>>;
  setEnv: (key: string, value: string, profile?: string) => Promise<boolean>;
  getConfig: (key: string, profile?: string) => Promise<string | null>;
  setConfig: (key: string, value: string, profile?: string) => Promise<boolean>;
  getHermesHome: (profile?: string) => Promise<string>;
  getModelConfig: (
    profile?: string,
  ) => Promise<{ provider: string; model: string; baseUrl: string }>;
  setModelConfig: (
    provider: string,
    model: string,
    baseUrl: string,
    profile?: string,
  ) => Promise<boolean>;

  // Connection mode (local / remote / ssh)
  isRemoteMode: () => Promise<boolean>;
  isRemoteOnlyMode: () => Promise<boolean>;
  getConnectionConfig: () => Promise<{
    mode: "local" | "remote" | "ssh";
    remoteUrl: string;
    apiKey: string;
    ssh: {
      host: string;
      port: number;
      username: string;
      keyPath: string;
      remotePort: number;
      localPort: number;
    };
  }>;
  setConnectionConfig: (
    mode: "local" | "remote" | "ssh",
    remoteUrl: string,
    apiKey?: string,
  ) => Promise<boolean>;
  setSshConfig: (
    host: string,
    port: number,
    username: string,
    keyPath: string,
    remotePort: number,
    localPort: number,
  ) => Promise<boolean>;
  testRemoteConnection: (url: string, apiKey?: string) => Promise<boolean>;
  testSshConnection: (
    host: string,
    port: number,
    username: string,
    keyPath: string,
    remotePort: number,
  ) => Promise<boolean>;
  isSshTunnelActive: () => Promise<boolean>;
  startSshTunnel: () => Promise<boolean>;
  stopSshTunnel: () => Promise<boolean>;

  // Chat
  sendMessage: (
    message: string,
    profile?: string,
    resumeSessionId?: string,
    history?: Array<{ role: string; content: string }>,
  ) => Promise<{ response: string; sessionId?: string }>;
  abortChat: () => Promise<void>;
  onChatChunk: (callback: (chunk: string) => void) => () => void;
  onChatDone: (callback: (sessionId?: string) => void) => () => void;
  onChatToolProgress: (callback: (tool: string) => void) => () => void;
  onChatUsage: (
    callback: (usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
      cost?: number;
      rateLimitRemaining?: number;
      rateLimitReset?: number;
    }) => void,
  ) => () => void;
  onChatError: (callback: (error: string) => void) => () => void;

  // Gateway
  startGateway: () => Promise<boolean>;
  stopGateway: () => Promise<boolean>;
  gatewayStatus: () => Promise<boolean>;

  // Platform toggles
  getPlatformEnabled: (profile?: string) => Promise<Record<string, boolean>>;
  setPlatformEnabled: (
    platform: string,
    enabled: boolean,
    profile?: string,
  ) => Promise<boolean>;

  // Sessions
  listSessions: (
    limit?: number,
    offset?: number,
  ) => Promise<
    Array<{
      id: string;
      source: string;
      startedAt: number;
      endedAt: number | null;
      messageCount: number;
      model: string;
      title: string | null;
      preview: string;
    }>
  >;
  getSessionMessages: (sessionId: string) => Promise<
    Array<{
      id: number;
      role: "user" | "assistant";
      content: string;
      timestamp: number;
    }>
  >;

  // Profiles
  listProfiles: () => Promise<
    Array<{
      name: string;
      path: string;
      isDefault: boolean;
      isActive: boolean;
      model: string;
      provider: string;
      hasEnv: boolean;
      hasSoul: boolean;
      skillCount: number;
      gatewayRunning: boolean;
    }>
  >;
  createProfile: (
    name: string,
    clone: boolean,
  ) => Promise<{ success: boolean; error?: string }>;
  deleteProfile: (
    name: string,
  ) => Promise<{ success: boolean; error?: string }>;
  setActiveProfile: (name: string) => Promise<boolean>;

  // Memory
  readMemory: (profile?: string) => Promise<{
    memory: { content: string; exists: boolean; lastModified: number | null };
    user: { content: string; exists: boolean; lastModified: number | null };
    stats: { totalSessions: number; totalMessages: number };
  }>;

  addMemoryEntry: (
    content: string,
    profile?: string,
  ) => Promise<{ success: boolean; error?: string }>;
  updateMemoryEntry: (
    index: number,
    content: string,
    profile?: string,
  ) => Promise<{ success: boolean; error?: string }>;
  removeMemoryEntry: (index: number, profile?: string) => Promise<boolean>;
  writeUserProfile: (
    content: string,
    profile?: string,
  ) => Promise<{ success: boolean; error?: string }>;

  // Soul
  readSoul: (profile?: string) => Promise<string>;
  writeSoul: (content: string, profile?: string) => Promise<boolean>;
  resetSoul: (profile?: string) => Promise<string>;

  // Tools
  getToolsets: (
    profile?: string,
  ) => Promise<
    Array<{ key: string; label: string; description: string; enabled: boolean }>
  >;
  setToolsetEnabled: (
    key: string,
    enabled: boolean,
    profile?: string,
  ) => Promise<boolean>;

  // Skills
  listInstalledSkills: (
    profile?: string,
  ) => Promise<
    Array<{ name: string; category: string; description: string; path: string }>
  >;
  listBundledSkills: () => Promise<
    Array<{
      name: string;
      description: string;
      category: string;
      source: string;
      installed: boolean;
    }>
  >;
  getSkillContent: (skillPath: string) => Promise<string>;
  installSkill: (
    identifier: string,
    profile?: string,
  ) => Promise<{ success: boolean; error?: string }>;
  uninstallSkill: (
    name: string,
    profile?: string,
  ) => Promise<{ success: boolean; error?: string }>;

  // Session cache
  listCachedSessions: (
    limit?: number,
    offset?: number,
  ) => Promise<
    Array<{
      id: string;
      title: string;
      startedAt: number;
      source: string;
      messageCount: number;
      model: string;
    }>
  >;
  syncSessionCache: () => Promise<
    Array<{
      id: string;
      title: string;
      startedAt: number;
      source: string;
      messageCount: number;
      model: string;
    }>
  >;
  updateSessionTitle: (sessionId: string, title: string) => Promise<void>;

  // Session search
  searchSessions: (
    query: string,
    limit?: number,
  ) => Promise<
    Array<{
      sessionId: string;
      title: string | null;
      startedAt: number;
      source: string;
      messageCount: number;
      model: string;
      snippet: string;
    }>
  >;

  // Credential Pool
  getCredentialPool: () => Promise<
    Record<string, Array<{ key: string; label: string }>>
  >;
  setCredentialPool: (
    provider: string,
    entries: Array<{ key: string; label: string }>,
  ) => Promise<boolean>;

  // Models
  listModels: () => Promise<
    Array<{
      id: string;
      name: string;
      provider: string;
      model: string;
      baseUrl: string;
      createdAt: number;
    }>
  >;
  addModel: (
    name: string,
    provider: string,
    model: string,
    baseUrl: string,
  ) => Promise<{
    id: string;
    name: string;
    provider: string;
    model: string;
    baseUrl: string;
    createdAt: number;
  }>;
  removeModel: (id: string) => Promise<boolean>;
  updateModel: (id: string, fields: Record<string, string>) => Promise<boolean>;

  // Claw3D
  claw3dStatus: () => Promise<{
    cloned: boolean;
    installed: boolean;
    devServerRunning: boolean;
    adapterRunning: boolean;
    port: number;
    portInUse: boolean;
    wsUrl: string;
    running: boolean;
    error: string;
  }>;
  claw3dSetup: () => Promise<{ success: boolean; error?: string }>;
  onClaw3dSetupProgress: (
    callback: (progress: {
      step: number;
      totalSteps: number;
      title: string;
      detail: string;
      log: string;
    }) => void,
  ) => () => void;
  claw3dGetPort: () => Promise<number>;
  claw3dSetPort: (port: number) => Promise<boolean>;
  claw3dGetWsUrl: () => Promise<string>;
  claw3dSetWsUrl: (url: string) => Promise<boolean>;
  claw3dStartAll: () => Promise<{ success: boolean; error?: string }>;
  claw3dStopAll: () => Promise<boolean>;
  claw3dGetLogs: () => Promise<string>;
  claw3dStartDev: () => Promise<boolean>;
  claw3dStopDev: () => Promise<boolean>;
  claw3dStartAdapter: () => Promise<boolean>;
  claw3dStopAdapter: () => Promise<boolean>;

  // Updates
  checkForUpdates: () => Promise<string | null>;
  downloadUpdate: () => Promise<boolean>;
  installUpdate: () => Promise<void>;
  getAppVersion: () => Promise<string>;
  onUpdateAvailable: (
    callback: (info: { version: string; releaseNotes: string }) => void,
  ) => () => void;
  onUpdateDownloadProgress: (
    callback: (info: { percent: number }) => void,
  ) => () => void;
  onUpdateDownloaded: (callback: () => void) => () => void;
  onUpdateError: (callback: (message: string) => void) => () => void;

  // Runtime setup / enterprise
  runDoctor: () => Promise<import("../shared/enterprise/enterprise-schema").DoctorReport>;
  runRepair: (errorCode?: string) => Promise<import("../shared/enterprise/enterprise-contract").EnterpriseRepairResult>;
  reinstallRuntime: () => Promise<import("../shared/enterprise/enterprise-contract").EnterpriseInstallResult>;
  enterpriseGetDeploymentConfig: () => Promise<import("../shared/enterprise/enterprise-schema").LoadConfigResult>;
  enterpriseValidateConfig: () => Promise<import("../shared/enterprise/enterprise-schema").ValidationResult>;
  enterprisePreflight: () => Promise<import("../shared/enterprise/enterprise-schema").PreflightReport>;
  enterpriseInstall: (
    input?: import("../shared/enterprise/enterprise-contract").EnterpriseInstallInput,
  ) => Promise<import("../shared/enterprise/enterprise-contract").EnterpriseInstallResult>;
  enterpriseInstallCancel: () => Promise<{ ok: boolean }>;
  enterpriseUpdate: (
    input?: import("../shared/enterprise/enterprise-contract").EnterpriseUpdateInput,
  ) => Promise<import("../shared/enterprise/enterprise-contract").EnterpriseUpdateResult>;
  enterpriseRepair: (
    input?: import("../shared/enterprise/enterprise-contract").EnterpriseRepairInput,
  ) => Promise<import("../shared/enterprise/enterprise-contract").EnterpriseRepairResult>;
  enterpriseRollback: (
    input: import("../shared/enterprise/enterprise-contract").EnterpriseRollbackInput,
  ) => Promise<import("../shared/enterprise/enterprise-contract").EnterpriseRollbackResult>;
  enterpriseGetInstallMarker: () => Promise<import("../shared/enterprise/enterprise-schema").InstallMarker | null>;
  enterpriseGetInstallLog: (input: {
    type: import("../shared/enterprise/enterprise-constants").InstallPhase;
  }) => Promise<string>;
  enterpriseOpenLogDir: () => Promise<{ ok: boolean }>;
  enterpriseRunDoctor: () => Promise<import("../shared/enterprise/enterprise-schema").DoctorReport>;
  enterpriseExportDoctorReport: () => Promise<{ ok: boolean; path: string }>;
  enterpriseGetMigrationStatus: () => Promise<import("../shared/enterprise/migration-contract").MigrationStatus>;
  onEnterpriseInstallProgress: (
    callback: (progress: import("../shared/enterprise/enterprise-schema").InstallProgressEvent) => void,
  ) => () => void;

  // Menu events
  onMenuNewChat: (callback: () => void) => () => void;
  onMenuSearchSessions: (callback: () => void) => () => void;

  // Cron Jobs
  listCronJobs: (
    includeDisabled?: boolean,
    profile?: string,
  ) => Promise<
    Array<{
      id: string;
      name: string;
      schedule: string;
      prompt: string;
      state: "active" | "paused" | "completed";
      enabled: boolean;
      next_run_at: string | null;
      last_run_at: string | null;
      last_status: string | null;
      last_error: string | null;
      repeat: { times: number | null; completed: number } | null;
      deliver: string[];
      skills: string[];
      script: string | null;
    }>
  >;
  createCronJob: (
    schedule: string,
    prompt?: string,
    name?: string,
    deliver?: string,
    profile?: string,
  ) => Promise<{ success: boolean; error?: string }>;
  removeCronJob: (
    jobId: string,
    profile?: string,
  ) => Promise<{ success: boolean; error?: string }>;
  pauseCronJob: (
    jobId: string,
    profile?: string,
  ) => Promise<{ success: boolean; error?: string }>;
  resumeCronJob: (
    jobId: string,
    profile?: string,
  ) => Promise<{ success: boolean; error?: string }>;
  triggerCronJob: (
    jobId: string,
    profile?: string,
  ) => Promise<{ success: boolean; error?: string }>;

  // Shell
  openExternal: (url: string) => Promise<void>;

  // Backup / Import
  runHermesBackup: (
    profile?: string,
  ) => Promise<{ success: boolean; path?: string; error?: string }>;
  runHermesImport: (
    archivePath: string,
    profile?: string,
  ) => Promise<{ success: boolean; error?: string }>;

  // Debug dump
  runHermesDump: () => Promise<string>;

  // Memory providers
  discoverMemoryProviders: (profile?: string) => Promise<
    Array<{
      name: string;
      description: string;
      installed: boolean;
      active: boolean;
      envVars: string[];
    }>
  >;

  // MCP servers
  listMcpServers: (
    profile?: string,
  ) => Promise<
    Array<{ name: string; type: string; enabled: boolean; detail: string }>
  >;

  // Log viewer
  readLogs: (
    logFile?: string,
    lines?: number,
  ) => Promise<{ content: string; path: string }>;

  // First Run Wizard
  firstRunWizardDetectAgent: () => Promise<{
    stage: string;
    agentInstalled: boolean;
    agentPath?: string;
  }>;

  firstRunWizardStartInstall: (sourceConfig: unknown) => Promise<{
    success: boolean;
    agentPath?: string;
    error?: string;
  }>;

  firstRunWizardCancelInstall: () => Promise<boolean>;

  firstRunWizardSelectZipFile: () => Promise<Electron.OpenDialogReturnValue>;

  onFirstRunWizardProgress: (
    callback: (progress: { stage: string; message: string }) => void,
  ) => () => void;

  onFirstRunWizardStateChange: (
    callback: (state: unknown) => void,
  ) => () => void;

  getInstallerPrecheck: () => Promise<InstallerPrecheck | null>;

  windowControls: WindowControlsAPI;
}

interface WindowControlsAPI {
  minimize(): Promise<void>;
  maximizeOrRestore(): Promise<void>;
  close(): Promise<void>;
  isMaximized(): Promise<boolean>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    hermesAPI: HermesAPI;
    aiosBrowser: AiosBrowserAPI;
    profileRuntime: ProfileRuntimeAPI;
    profileEntry: ProfileEntryAPI;
  }
}
