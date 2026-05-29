import type { HermesPanelPageContext } from "../../../components/hermes";

export type WebOperatorHermesAnalysisRequest = {
  requestId: string;
  pageUrl: string;
  pageContext: HermesPanelPageContext;
  createdAt: string;
};

export type WebOperatorTaskStartDialogState = {
  requestId: string;
  taskId: string;
  pageUrl: string;
  pageContext: HermesPanelPageContext;
};

export type WebOperatorTaskStartDialogHandlers = {
  onConfirm: (input: { userPrompt: string; skill: string }) => void;
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
  }) => void;
};
