import type { WorkContextRef } from "./work-context-contract";
import type { WorkOutputRef } from "./work-output-contract";

export type WorkTaskType =
  | "chat"
  | "expert"
  | "expert_team"
  | "web"
  | "skill"
  | "workflow";

export type WorkTaskStatus =
  | "draft"
  | "ready"
  | "planning"
  | "dispatching"
  | "running"
  | "waiting_approval"
  | "merging"
  | "output_ready"
  | "completed"
  | "failed"
  | "cancelled";

export type WorkTaskPermissionMode = "default" | "confirm_sensitive" | "auto";

export type WorkTaskMode = "ask" | "plan" | "craft" | "execute";

export interface WorkTask {
  id: string;
  title: string;
  taskType: WorkTaskType;
  status: WorkTaskStatus;
  sourceWorkspace: "work" | "web";
  workspaceId?: string;
  projectId?: string;
  activeExpertId?: string;
  activeTeamId?: string;
  selectedExpertIds: string[];
  selectedSkillIds: string[];
  selectedAppIds: string[];
  contextRefs: WorkContextRef[];
  outputRefs: WorkOutputRef[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface WorkTaskDetail extends WorkTask {
  prompt?: string;
  mode?: WorkTaskMode;
  permissionMode?: WorkTaskPermissionMode;
}

export interface WorkTaskSendInput {
  taskId?: string;
  text: string;
  selectedTeamId?: string;
  selectedExpertIds?: string[];
  selectedSkillIds?: string[];
  selectedAppIds?: string[];
  permissionMode?: WorkTaskPermissionMode;
  mode?: WorkTaskMode;
  contextRefs?: WorkContextRef[];
  attachmentIds?: string[];
}

export interface WorkTaskSendResult {
  taskId: string;
  streamId?: string;
  ok: boolean;
  error?: string;
}

export interface WorkTaskListQuery {
  status?: WorkTaskStatus[];
  limit?: number;
  offset?: number;
}
