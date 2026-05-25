import type { ProfileGatewayState, ProfileSummary } from "../../../../../shared/profile-runtime/profile-runtime-contract";
import {
  EXPERT_PROFILE_BY_ID,
  EXPERT_PROFILE_BY_ROUTE_KEY,
  EXPERT_PROFILE_LOOKUP_KEYS,
  type ExpertProfileId,
} from "../constants";
import { resumeSessionIdForApi } from "./sessionUtils";
import type {
  AIOSMemoryFile,
  AIOSMemoryFileName,
  AIOSProfile,
  AIOSSession,
  AIOSSkill,
  ProfileRuntimeStatus,
  WorkspaceFileEntry,
  WorkspaceGitStatus,
} from "../types";

function mapRuntimeStatus(status: string): ProfileRuntimeStatus {
  switch (status) {
    case "running":
      return "running";
    case "starting":
      return "starting";
    case "stopping":
      return "stopping";
    case "failed":
      return "error";
    case "stopped":
      return "stopped";
    case "not_deployed":
      return "stopped";
    default:
      return "stopped";
  }
}

function toAIOSProfile(summary: ProfileSummary): AIOSProfile {
  const expert =
    EXPERT_PROFILE_BY_ID[summary.name as ExpertProfileId] ??
    EXPERT_PROFILE_BY_ID[summary.id as ExpertProfileId] ??
    EXPERT_PROFILE_BY_ROUTE_KEY[summary.name as keyof typeof EXPERT_PROFILE_BY_ROUTE_KEY];
  const status = mapRuntimeStatus(summary.runtime_status);
  return {
    id: summary.id,
    name: summary.name,
    roleName: expert?.roleName ?? summary.display_name,
    displayName: expert?.displayName ?? summary.display_name,
    description: summary.description ?? undefined,
    gatewayPort: expert?.gatewayPort ?? summary.port,
    status,
    healthy: status === "running",
    workspacePath: summary.profile_home,
    pid: summary.pid,
    installed: Boolean(summary.profile_home),
  };
}

function profileNameForApi(profileId: string, profile?: AIOSProfile | null): string {
  return profile?.name ?? profileId;
}

export const workspacesApi = {
  async listProfiles(): Promise<AIOSProfile[]> {
    const rows = await window.profileRuntime.listProfiles();
    return rows
      .filter(
        (p) => EXPERT_PROFILE_LOOKUP_KEYS.has(p.name) || EXPERT_PROFILE_LOOKUP_KEYS.has(p.id),
      )
      .map(toAIOSProfile)
      .sort((a, b) => a.gatewayPort - b.gatewayPort);
  },

  async getProfile(profileId: string): Promise<AIOSProfile | null> {
    const row = await window.profileRuntime.getProfile(profileId);
    return row ? toAIOSProfile(row) : null;
  },

  async startProfile(profileId: string): Promise<ProfileGatewayState> {
    return window.profileRuntime.startProfile(profileId);
  },

  async stopProfile(profileId: string): Promise<ProfileGatewayState> {
    return window.profileRuntime.stopProfile(profileId);
  },

  async restartProfile(profileId: string): Promise<ProfileGatewayState> {
    return window.profileRuntime.restartProfile(profileId);
  },

  async getRuntimeStatus(): Promise<ProfileGatewayState[]> {
    return window.profileRuntime.getRuntimeStatus();
  },

  async probeProfileHealth(profileId: string): Promise<{ healthy: boolean }> {
    return window.profileRuntime.probeProfileHealth(profileId);
  },

  onRuntimeStatusChanged(
    callback: Parameters<typeof window.profileRuntime.onRuntimeStatusChanged>[0],
  ): () => void {
    return window.profileRuntime.onRuntimeStatusChanged(callback);
  },

  async getGatewayLogs(
    profileId: string,
    options?: { limit?: number },
  ): Promise<Array<{ timestamp: string; level: string; message: string }>> {
    const logs = await window.profileRuntime.getGatewayLogs(profileId, {
      limit: options?.limit ?? 200,
    });
    return logs.map((l) => ({
      timestamp: l.timestamp,
      level: l.level,
      message: l.message,
    }));
  },

  async listAuditEvents(profileId: string, limit = 50) {
    return window.profileRuntime.listAuditEvents({ profileId, limit });
  },

  async sendMessage(
    profileId: string,
    message: string,
    sessionId?: string,
    history?: Array<{ role: string; content: string }>,
  ) {
    const profile = await this.getProfile(profileId);
    const name = profileNameForApi(profileId, profile);
    const resumeId = resumeSessionIdForApi(sessionId);
    return window.hermesAPI.sendMessage(message, name, resumeId, history);
  },

  abortChat(): Promise<void> {
    return window.hermesAPI.abortChat();
  },

  onMessageChunk(callback: (chunk: string) => void): () => void {
    return window.hermesAPI.onChatChunk(callback);
  },

  onMessageComplete(callback: (sessionId?: string) => void): () => void {
    return window.hermesAPI.onChatDone(callback);
  },

  onMessageError(callback: (error: string) => void): () => void {
    return window.hermesAPI.onChatError(callback);
  },

  onToolProgress(callback: (tool: string) => void): () => void {
    return window.hermesAPI.onChatToolProgress(callback);
  },

  async listSessions(profileId: string): Promise<AIOSSession[]> {
    try {
      const rows = await window.profileRuntime.listProfileSessions(profileId);
      return rows.map((s) => ({
        id: s.id,
        profileId,
        title: s.title ?? s.id,
        createdAt: new Date(s.startedAt).toISOString(),
        updatedAt: new Date(s.startedAt).toISOString(),
        messageCount: undefined,
        model: s.model,
      }));
    } catch {
      return [];
    }
  },

  async renameSession(sessionId: string, title: string): Promise<void> {
    await window.hermesAPI.updateSessionTitle(sessionId, title);
  },

  async deleteSession(profileId: string, sessionId: string): Promise<void> {
    await window.profileRuntime.deleteProfileSession(profileId, sessionId);
  },

  async getSessionMessages(sessionId: string) {
    return window.hermesAPI.getSessionMessages(sessionId);
  },

  async listSkills(profileId: string): Promise<AIOSSkill[]> {
    const rows = await window.profileRuntime.listProfileSkills(profileId);
    return rows.map((s) => ({
      id: s.id,
      profileId: s.profileId,
      name: s.skillName,
      category: s.category ?? "general",
      sourceType:
        s.sourceType === "role-source"
          ? "role-source"
          : s.sourceType === "builtin"
            ? "builtin"
            : "agent-created",
      path: s.skillPath,
      enabled: s.enabled,
    }));
  },

  async readSkillContent(skillPath: string): Promise<string> {
    return window.hermesAPI.getSkillContent(skillPath);
  },

  async readMemoryFiles(profileId: string): Promise<AIOSMemoryFile[]> {
    const profile = await this.getProfile(profileId);
    const name = profileNameForApi(profileId, profile);
    const [memoryBundle, soul] = await Promise.all([
      window.hermesAPI.readMemory(name),
      window.hermesAPI.readSoul(name),
    ]);
    const files: AIOSMemoryFile[] = [
      {
        profileId,
        file: "SOUL.md",
        content: soul,
        readonly: true,
        updatedAt: undefined,
      },
      {
        profileId,
        file: "MEMORY.md",
        content: memoryBundle.memory.content,
        readonly: false,
        updatedAt: memoryBundle.memory.lastModified
          ? new Date(memoryBundle.memory.lastModified).toISOString()
          : undefined,
      },
      {
        profileId,
        file: "USER.md",
        content: memoryBundle.user.content,
        readonly: false,
        updatedAt: memoryBundle.user.lastModified
          ? new Date(memoryBundle.user.lastModified).toISOString()
          : undefined,
      },
    ];
    return files;
  },

  async writeMemoryFile(
    profileId: string,
    file: AIOSMemoryFileName,
    content: string,
  ): Promise<{ ok: boolean; error?: string }> {
    const profile = await this.getProfile(profileId);
    const name = profileNameForApi(profileId, profile);
    if (file === "SOUL.md") {
      const ok = await window.hermesAPI.writeSoul(content, name);
      return { ok };
    }
    if (file === "USER.md") {
      const r = await window.hermesAPI.writeUserProfile(content, name);
      return { ok: r.success, error: r.error };
    }
    if (file === "MEMORY.md") {
      const r = await window.hermesAPI.writeMemoryContent(content, name);
      return { ok: r.success, error: r.error };
    }
    return { ok: false, error: "UNSUPPORTED_FILE" };
  },

  async getHermesHome(profileId: string): Promise<string> {
    const profile = await this.getProfile(profileId);
    return window.hermesAPI.getHermesHome(profileNameForApi(profileId, profile));
  },

  async listWorkspaceFiles(profileId: string, relativePath = "."): Promise<WorkspaceFileEntry[]> {
    return (await window.workspaces.listFiles(profileId, relativePath)) as WorkspaceFileEntry[];
  },

  async readWorkspaceFile(
    profileId: string,
    relativePath: string,
  ): Promise<
    | { ok: true; content: string; encoding: "utf8" | "base64" }
    | { ok: false; error: string }
  > {
    return window.workspaces.readFile(profileId, relativePath);
  },

  async getWorkspaceGitStatus(profileId: string): Promise<WorkspaceGitStatus> {
    return window.workspaces.gitStatus(profileId);
  },
};
