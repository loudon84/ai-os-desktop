import { useCallback, useEffect, useRef, useState } from "react";
import {
  WebOperatorHermesChatPanel,
  type HermesPanelPageContext,
  type HermesPanelTaskInput,
} from "../../components/hermes";
import { useWebOperatorPageContext } from "./context";

interface HermesTaskPanelProps {
  className?: string;
  /** Dialog 确认（或免 Dialog 直接开任务）后切到 hermes-task 侧栏 */
  onActivatePanel?: () => void;
  /** Dialog 取消后切到的侧栏（HostBridge 流程回到 host-context） */
  onCancelPanel?: () => void;
}

type StartDialogState = {
  requestId: string;
  taskId: string;
  pageUrl: string;
  pageContext: HermesPanelPageContext;
  profile?: string;
  requiredSkillName?: string;
  formType?: string;
  action?: "create" | "edit" | "view" | "analytic";
  callbackUrl?: string;
  hostBridgeRequestId?: string;
  defaultSessionId?: string | null;
  missingSkill?: boolean;
  missingSkillMessage?: string;
};

export function HermesTaskPanel({
  className,
  onActivatePanel,
  onCancelPanel,
}: HermesTaskPanelProps): React.JSX.Element {
  const {
    pageContext,
    analysisRequest,
    setTaskStartDialog,
    setTaskStartDialogHandlers,
    clearHermesAnalysisRequest,
    dismissHermesAnalysis,
  } = useWebOperatorPageContext();

  const [currentTask, setCurrentTask] = useState<HermesPanelTaskInput | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const startDialogRef = useRef<StartDialogState | null>(null);
  /** 每个 taskId 仅 upsert 一次（首次 chat-done 绑定 sessionId） */
  const upsertedTaskIdRef = useRef<string | null>(null);
  const onActivatePanelRef = useRef(onActivatePanel);
  const onCancelPanelRef = useRef(onCancelPanel);

  useEffect(() => {
    onActivatePanelRef.current = onActivatePanel;
    onCancelPanelRef.current = onCancelPanel;
  }, [onActivatePanel, onCancelPanel]);

  const closeStartDialog = useCallback(() => {
    startDialogRef.current = null;
    setTaskStartDialog(null);
    setTaskStartDialogHandlers(null);
  }, [setTaskStartDialog, setTaskStartDialogHandlers]);

  const handleDialogConfirm = useCallback(
    (input: {
      userPrompt: string;
      skill: string;
      sessionId: string | null;
      callbackUrl?: string;
    }) => {
      const sd = startDialogRef.current;
      if (!sd) return;
      const resolvedCallbackUrl = input.callbackUrl?.trim() || sd.callbackUrl?.trim();
      setCurrentTask({
        taskId: sd.taskId,
        pageUrl: sd.pageUrl,
        sessionId: input.sessionId,
        pageContext: sd.pageContext,
        action: input.sessionId ? "loading" : "running",
        userPrompt: input.userPrompt,
        skill: input.skill,
        hostBridge: sd.requiredSkillName
          ? {
              requestId: sd.hostBridgeRequestId ?? sd.requestId,
              formType: sd.formType ?? "",
              action: sd.action ?? "view",
              callbackUrl: resolvedCallbackUrl,
              skillName: sd.requiredSkillName,
            }
          : undefined,
      });
      closeStartDialog();
      clearHermesAnalysisRequest();
      onActivatePanelRef.current?.();
    },
    [clearHermesAnalysisRequest, closeStartDialog],
  );

  const handleDialogCancel = useCallback(() => {
    const hostBridgeRequestId =
      startDialogRef.current?.hostBridgeRequestId ?? analysisRequest?.hostBridgeRequestId;
    dismissHermesAnalysis(hostBridgeRequestId);
    closeStartDialog();
    onCancelPanelRef.current?.();
  }, [analysisRequest?.hostBridgeRequestId, closeStartDialog, dismissHermesAnalysis]);

  const dialogHandlersRef = useRef({
    onConfirm: handleDialogConfirm,
    onCancel: handleDialogCancel,
  });

  useEffect(() => {
    dialogHandlersRef.current = {
      onConfirm: handleDialogConfirm,
      onCancel: handleDialogCancel,
    };
  }, [handleDialogConfirm, handleDialogCancel]);

  const openStartDialog = useCallback(
    (state: StartDialogState) => {
      startDialogRef.current = state;
      setTaskStartDialog({
        requestId: state.requestId,
        taskId: state.taskId,
        pageUrl: state.pageUrl,
        pageContext: state.pageContext,
        profile: state.profile,
        requiredSkillName: state.requiredSkillName,
        formType: state.formType,
        action: state.action,
        callbackUrl: state.callbackUrl,
        defaultSessionId: state.defaultSessionId,
        missingSkill: state.missingSkill,
        missingSkillMessage: state.missingSkillMessage,
      });
      setTaskStartDialogHandlers({
        onConfirm: (input) => dialogHandlersRef.current.onConfirm(input),
        onCancel: () => dialogHandlersRef.current.onCancel(),
      });
    },
    [setTaskStartDialog, setTaskStartDialogHandlers],
  );

  useEffect(() => {
    const req = analysisRequest;

    if (!req?.requestId) return;

    let cancelled = false;
    upsertedTaskIdRef.current = null;

    void (async () => {
      setResolving(true);
      setResolveError(null);

      try {
        const lookup = await window.webOperatorTaskSession.resolve({
          pageUrl: req.pageUrl,
        });
        if (cancelled) return;

        if (lookup.record && !req.preferStartDialog) {
          upsertedTaskIdRef.current = lookup.taskId;
          setCurrentTask({
            taskId: lookup.taskId,
            pageUrl: lookup.pageUrl,
            sessionId: lookup.record.sessionId,
            pageContext: req.pageContext,
            action: "loading",
            skill: lookup.record.skill,
            hostBridge: req.requiredSkillName
              ? {
                  requestId: req.requestId,
                  formType: req.formType ?? "",
                  action: req.action ?? "view",
                  callbackUrl: req.callbackUrl,
                  skillName: req.requiredSkillName,
                }
              : undefined,
          });
          closeStartDialog();
          clearHermesAnalysisRequest();
          onActivatePanelRef.current?.();
        } else {
          setCurrentTask(null);
          openStartDialog({
            requestId: req.requestId,
            taskId: lookup.taskId,
            pageUrl: req.pageUrl,
            pageContext: req.pageContext,
            profile: req.profile,
            requiredSkillName: req.requiredSkillName,
            formType: req.formType,
            action: req.action,
            callbackUrl: req.callbackUrl,
            hostBridgeRequestId: req.hostBridgeRequestId,
            defaultSessionId: req.preferStartDialog ? null : undefined,
          });
        }
      } catch (e) {
        if (!cancelled) {
          setCurrentTask(null);
          setResolveError(e instanceof Error ? e.message : String(e));
          console.error("[HermesTaskPanel] resolve failed:", e);
        }
      } finally {
        if (!cancelled) setResolving(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [analysisRequest?.requestId, clearHermesAnalysisRequest, closeStartDialog, openStartDialog]);

  const handleTaskSessionReady = useCallback(
    (input: {
      taskId: string;
      pageUrl: string;
      sessionId: string;
      pageContext: HermesPanelPageContext;
      skill: string;
    }) => {
      if (upsertedTaskIdRef.current === input.taskId) return;
      upsertedTaskIdRef.current = input.taskId;
      void window.webOperatorTaskSession.upsert({
        taskId: input.taskId,
        pageUrl: input.pageUrl,
        sessionId: input.sessionId,
        pageContext: input.pageContext,
        skill: input.skill,
      });
    },
    [],
  );

  const activePageContext = currentTask?.pageContext ?? pageContext;

  return (
    <div className={`relative flex flex-col h-full min-h-0 ${className ?? ""}`}>
      {resolving ? (
        <p className="px-3 py-2 text-xs text-neutral-500 shrink-0">正在解析任务会话…</p>
      ) : null}

      {resolveError ? (
        <p className="px-3 py-2 text-xs text-red-400 shrink-0">{resolveError}</p>
      ) : null}

      <WebOperatorHermesChatPanel
        className="flex-1 min-h-0"
        pageContext={activePageContext}
        task={currentTask}
        onTaskSessionReady={handleTaskSessionReady}
      />
    </div>
  );
}
