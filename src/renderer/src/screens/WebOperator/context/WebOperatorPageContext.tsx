import {
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { HermesPanelPageContext } from "../../../components/hermes";
import { WebOperatorPageContextReact } from "./web-operator-page-context-instance";
import type {
  WebOperatorHermesAnalysisRequest,
  WebOperatorPageContextValue,
  WebOperatorTaskStartDialogHandlers,
  WebOperatorTaskStartDialogState,
} from "./web-operator-page-context-types";

export type {
  WebOperatorHermesAnalysisRequest,
  WebOperatorPageContextValue,
  WebOperatorTaskStartDialogHandlers,
  WebOperatorTaskStartDialogState,
} from "./web-operator-page-context-types";

export { WebOperatorPageContextReact } from "./web-operator-page-context-instance";

export function WebOperatorPageContextProvider({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element {
  const [pageContext, setPageContextState] = useState<HermesPanelPageContext | null>(null);
  const [pageUrl, setPageUrl] = useState<string | null>(null);
  const [analysisRequest, setAnalysisRequest] =
    useState<WebOperatorHermesAnalysisRequest | null>(null);
  const [taskStartDialog, setTaskStartDialog] =
    useState<WebOperatorTaskStartDialogState | null>(null);
  const [taskStartDialogHandlers, setTaskStartDialogHandlers] =
    useState<WebOperatorTaskStartDialogHandlers | null>(null);
  /** 用户取消 Dialog 后，同一 JSSDK requestId 不再自动弹框 */
  const dismissedHostBridgeRequestIdsRef = useRef(new Set<string>());

  const setPageContext = useCallback((ctx: HermesPanelPageContext | null) => {
    setPageContextState(ctx);
  }, []);

  const requestHermesAnalysis = useCallback(
    (input: {
      pageUrl: string;
      pageContext: HermesPanelPageContext;
      profile?: string;
      requiredSkillName?: string;
      formType?: string;
      action?: "create" | "edit" | "view" | "analytic";
      callbackUrl?: string;
      preferStartDialog?: boolean;
      hostBridgeRequestId?: string;
      force?: boolean;
    }) => {
      const hostId = input.hostBridgeRequestId?.trim();
      if (
        !input.force &&
        hostId &&
        dismissedHostBridgeRequestIdsRef.current.has(hostId)
      ) {
        return;
      }
      setPageContextState(input.pageContext);
      setPageUrl(input.pageUrl.trim());
      setAnalysisRequest({
        requestId: `wo-analysis-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        pageUrl: input.pageUrl.trim(),
        pageContext: input.pageContext,
        createdAt: new Date().toISOString(),
        profile: input.profile,
        requiredSkillName: input.requiredSkillName,
        formType: input.formType,
        action: input.action,
        callbackUrl: input.callbackUrl,
        preferStartDialog: input.preferStartDialog,
        hostBridgeRequestId: input.hostBridgeRequestId,
      });
    },
    [],
  );

  const clearHermesAnalysisRequest = useCallback(() => {
    setAnalysisRequest(null);
  }, []);

  const dismissHermesAnalysis = useCallback((hostBridgeRequestId?: string) => {
    const id = hostBridgeRequestId?.trim();
    if (id) dismissedHostBridgeRequestIdsRef.current.add(id);
    setAnalysisRequest(null);
  }, []);

  const value = useMemo(
    () => ({
      pageContext,
      pageUrl,
      analysisRequest,
      taskStartDialog,
      taskStartDialogHandlers,
      setPageContext,
      setTaskStartDialog,
      setTaskStartDialogHandlers,
      requestHermesAnalysis,
      clearHermesAnalysisRequest,
      dismissHermesAnalysis,
    }),
    [
      pageContext,
      pageUrl,
      analysisRequest,
      taskStartDialog,
      taskStartDialogHandlers,
      setPageContext,
      requestHermesAnalysis,
      clearHermesAnalysisRequest,
      dismissHermesAnalysis,
    ],
  );

  return (
    <WebOperatorPageContextReact.Provider value={value}>
      {children}
    </WebOperatorPageContextReact.Provider>
  );
}

export function useWebOperatorPageContext(): WebOperatorPageContextValue {
  const ctx = useContext(WebOperatorPageContextReact);
  if (!ctx) {
    throw new Error("useWebOperatorPageContext must be used within WebOperatorPageContextProvider");
  }
  return ctx;
}
