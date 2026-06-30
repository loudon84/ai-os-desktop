export type ExpertGatewayStatus =
  | "unknown"
  | "checking"
  | "remote"
  | "unavailable"
  | "error";

export type WorkPermissionMode = "default" | "ask_each_time";

export interface WorkChatSelectedExpert {
  expertId: string;
  slug: string;
  name: string;
  description?: string;
  category?: string;
  riskLevel?: "low" | "medium" | "high";
}

export interface WorkChatSelectedSkill {
  name: string;
  displayName: string;
  description?: string;
  riskLevel?: "low" | "medium" | "high";
  outputFormat?: "markdown" | "json" | "text" | "file";
}

export interface WorkChatContext {
  gatewayStatus: ExpertGatewayStatus;
  selectedExpert: WorkChatSelectedExpert | null;
  selectedSkill: WorkChatSelectedSkill | null;
  permissionMode: WorkPermissionMode;
  useExpertGateway: boolean;
}

export interface WorkExpertGatewayCallInput {
  expertSlug: string;
  skillName: string;
  prompt: string;
  permissionMode: WorkPermissionMode;
  attachmentIds?: string[];
  context?: {
    source: "chat";
    sessionId?: string | null;
    profile?: string;
    modelId?: string | null;
  };
}

export interface WorkExpertGatewayCallResult {
  ok: boolean;
  responseText?: string;
  artifactRefs?: Array<{
    id: string;
    name: string;
    type: string;
  }>;
  error?: string;
}

export type WorkChatContextActions = {
  setExpert: (expert: WorkChatSelectedExpert | null) => void;
  setSkill: (skill: WorkChatSelectedSkill | null) => void;
  setPermissionMode: (mode: WorkPermissionMode) => void;
  clearContext: () => void;
  refreshGatewayHealth: () => Promise<void>;
};

export type UseWorkChatContextReturn = WorkChatContext & WorkChatContextActions;
