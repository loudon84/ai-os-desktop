import {
  useCallback,
  useContext,
  useMemo,
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

  const setPageContext = useCallback((ctx: HermesPanelPageContext | null) => {
    setPageContextState(ctx);
  }, []);

  const requestHermesAnalysis = useCallback(
    (input: { pageUrl: string; pageContext: HermesPanelPageContext }) => {
      setPageContextState(input.pageContext);
      setPageUrl(input.pageUrl.trim());
      setAnalysisRequest({
        requestId: `wo-analysis-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        pageUrl: input.pageUrl.trim(),
        pageContext: input.pageContext,
        createdAt: new Date().toISOString(),
      });
    },
    [],
  );

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
    }),
    [
      pageContext,
      pageUrl,
      analysisRequest,
      taskStartDialog,
      taskStartDialogHandlers,
      setPageContext,
      requestHermesAnalysis,
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
