import { useCallback, useEffect, useRef, useState } from "react";
import {
  WebOperatorHermesChatPanel,
  type HermesPanelPageContext,
  type HermesPanelTaskInput,
} from "../../components/hermes";
import { useWebOperatorPageContext } from "./context";

interface HermesTaskPanelProps {
  className?: string;
}

type StartDialogState = {
  requestId: string;
  taskId: string;
  pageUrl: string;
  pageContext: HermesPanelPageContext;
};

export function HermesTaskPanel({ className }: HermesTaskPanelProps): React.JSX.Element {
  const {
    pageContext,
    analysisRequest,
    setTaskStartDialog,
    setTaskStartDialogHandlers,
  } = useWebOperatorPageContext();

  const [currentTask, setCurrentTask] = useState<HermesPanelTaskInput | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const startDialogRef = useRef<StartDialogState | null>(null);
  /** 每个 taskId 仅 upsert 一次（首次 chat-done 绑定 sessionId） */
  const upsertedTaskIdRef = useRef<string | null>(null);

  const closeStartDialog = useCallback(() => {
    startDialogRef.current = null;
    setTaskStartDialog(null);
    setTaskStartDialogHandlers(null);
  }, [setTaskStartDialog, setTaskStartDialogHandlers]);

  const handleDialogConfirm = useCallback(
    (input: { userPrompt: string; skill: string }) => {
      const sd = startDialogRef.current;
      if (!sd) return;
      setCurrentTask({
        taskId: sd.taskId,
        pageUrl: sd.pageUrl,
        sessionId: null,
        pageContext: sd.pageContext,
        action: "running",
        userPrompt: input.userPrompt,
        skill: input.skill,
      });
      closeStartDialog();
    },
    [closeStartDialog],
  );

  const handleDialogCancel = useCallback(() => {
    const sd = startDialogRef.current;
    if (!sd) return;
    setCurrentTask({
      taskId: sd.taskId,
      pageUrl: sd.pageUrl,
      sessionId: null,
      pageContext: sd.pageContext,
      action: "pending",
      skill: "",
    });
    closeStartDialog();
  }, [closeStartDialog]);

  const dialogHandlersRef = useRef({
    onConfirm: handleDialogConfirm,
    onCancel: handleDialogCancel,
  });
  dialogHandlersRef.current = {
    onConfirm: handleDialogConfirm,
    onCancel: handleDialogCancel,
  };

  const openStartDialog = useCallback(
    (state: StartDialogState) => {
      startDialogRef.current = state;
      setTaskStartDialog({
        requestId: state.requestId,
        taskId: state.taskId,
        pageUrl: state.pageUrl,
        pageContext: state.pageContext,
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
    setResolving(true);
    setResolveError(null);

    void (async () => {
      try {
        const lookup = await window.webOperatorTaskSession.resolve({
          pageUrl: req.pageUrl,
        });
        if (cancelled) return;
        
        if (lookup.record) {
          upsertedTaskIdRef.current = lookup.taskId;
          setCurrentTask({
            taskId: lookup.taskId,
            pageUrl: lookup.pageUrl,
            sessionId: lookup.record.sessionId,
            pageContext: req.pageContext,
            action: "loading",
            skill: lookup.record.skill,
          });
          closeStartDialog();
        } else {
          setCurrentTask(null);
          openStartDialog({
            requestId: req.requestId,
            taskId: lookup.taskId,
            pageUrl: req.pageUrl,
            pageContext: req.pageContext,
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
  }, [analysisRequest?.requestId, closeStartDialog, openStartDialog]);

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
