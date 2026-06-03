import type { HermesPanelPageContext } from "../../../components/hermes";

export type WebOperatorHermesAnalysisRequest = {
  requestId: string;
  pageUrl: string;
  pageContext: HermesPanelPageContext;
  createdAt: string;
  profile?: string;
  requiredSkillName?: string;
  formType?: string;
  action?: "create" | "edit" | "view" | "analytic";
  callbackUrl?: string;
  /** HostBridge：始终弹出启动 Dialog（不因已有 task_session 直接续聊） */
  preferStartDialog?: boolean;
  hostBridgeRequestId?: string;
};

export type WebOperatorTaskStartDialogState = {
  requestId: string;
  taskId: string;
  pageUrl: string;
  pageContext: HermesPanelPageContext;
  profile?: string;
  requiredSkillName?: string;
  formType?: string;
  action?: "create" | "edit" | "view" | "analytic";
  callbackUrl?: string;
  defaultSessionId?: string | null;
  missingSkill?: boolean;
  missingSkillMessage?: string;
};

export type WebOperatorTaskStartDialogHandlers = {
  onConfirm: (input: {
    userPrompt: string;
    skill: string;
    sessionId: string | null;
    callbackUrl?: string;
  }) => void;
  onCancel: () => void;
};

export type WebOperatorPageContextValue = {
  pageContext: HermesPanelPageContext | null;
  pageUrl: string | null;
  analysisRequest: WebOperatorHermesAnalysisRequest | null;
  taskStartDialog: WebOperatorTaskStartDialogState | null;
  taskStartDialogHandlers: WebOperatorTaskStartDialogHandlers | null;
  setPageContext: (ctx: HermesPanelPageContext | null) => void;
  setTaskStartDialog: (next: WebOperatorTaskStartDialogState | null) => void;
  setTaskStartDialogHandlers: (next: WebOperatorTaskStartDialogHandlers | null) => void;
  requestHermesAnalysis: (input: {
    pageUrl: string;
    pageContext: HermesPanelPageContext;
    profile?: string;
    requiredSkillName?: string;
    formType?: string;
    action?: "create" | "edit" | "view" | "analytic";
    callbackUrl?: string;
    preferStartDialog?: boolean;
    hostBridgeRequestId?: string;
    /** 为 true 时忽略 HostBridge 已 dismiss 标记（如用户手动点「AI 分析」） */
    force?: boolean;
  }) => void;
  clearHermesAnalysisRequest: () => void;
  dismissHermesAnalysis: (hostBridgeRequestId?: string) => void;
};
