import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { WorkTask } from "../../../../../../shared/work/work-task-contract";
import type { WorkTaskEvent } from "../../../../../../shared/work/work-event-contract";
import type { WorkTaskSendInput } from "../../../../../../shared/work/work-task-contract";
import { MOCK_TASKS } from "../../mock/mockTasks";
import { MOCK_OUTPUTS } from "../../mock/mockOutputs";
import { workTaskReducer, initialWorkTaskState, sortTaskIds, type WorkTaskRightPanelTab } from "./workTaskReducer";
import { workTaskApi } from "../../api/workTaskApi";

type WorkTaskStoreValue = {
  tasks: WorkTask[];
  activeTask: WorkTask | null;
  activeTaskId: string | null;
  events: WorkTaskEvent[];
  outputs: import("../../../../../../shared/work/work-output-contract").WorkOutput[];
  participants: import("../../../../../../shared/work/work-participant-contract").WorkParticipant[];
  isStreaming: boolean;
  rightPanelTab: WorkTaskRightPanelTab;
  rightPanelOpen: boolean;
  setActiveTaskId: (id: string | null) => void;
  createTask: (input: WorkTaskSendInput) => Promise<WorkTask>;
  sendMessage: (input: WorkTaskSendInput) => Promise<void>;
  stopStream: () => Promise<void>;
  appendEvent: (event: WorkTaskEvent) => void;
  setRightPanelTab: (tab: WorkTaskRightPanelTab) => void;
  setRightPanelOpen: (open: boolean) => void;
  renameTask: (taskId: string, title: string) => void;
};

const WorkTaskStoreContext = createContext<WorkTaskStoreValue | null>(null);

export function WorkTaskStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(workTaskReducer, initialWorkTaskState, () => {
    const tasks: Record<string, WorkTask> = {};
    const taskOrder: string[] = [];
    for (const t of MOCK_TASKS) {
      tasks[t.id] = t;
      taskOrder.push(t.id);
    }
    const outputsByTaskId: typeof initialWorkTaskState.outputsByTaskId = {};
    for (const o of MOCK_OUTPUTS) {
      outputsByTaskId[o.taskId] = [...(outputsByTaskId[o.taskId] ?? []), o];
    }
    return {
      ...initialWorkTaskState,
      tasks,
      taskOrder,
      outputsByTaskId,
    };
  });

  const tasks = useMemo(
    () => sortTaskIds(state.tasks, state.taskOrder).map((id) => state.tasks[id]).filter(Boolean),
    [state.tasks, state.taskOrder],
  );

  const activeTask = state.activeTaskId ? state.tasks[state.activeTaskId] ?? null : null;
  const events = state.activeTaskId ? state.eventsByTaskId[state.activeTaskId] ?? [] : [];
  const outputs = state.activeTaskId ? state.outputsByTaskId[state.activeTaskId] ?? [] : [];
  const participants = state.activeTaskId
    ? state.participantsByTaskId[state.activeTaskId] ?? []
    : [];

  const appendEvent = useCallback((event: WorkTaskEvent) => {
    dispatch({ type: "APPEND_EVENT", event });
  }, []);

  const setActiveTaskId = useCallback((taskId: string | null) => {
    dispatch({ type: "SET_ACTIVE_TASK", taskId });
  }, []);

  const createTask = useCallback(async (input: WorkTaskSendInput) => {
    const task = await workTaskApi.create(input);
    dispatch({ type: "ADD_TASK", task });
    return task;
  }, []);

  const sendMessage = useCallback(
    async (input: WorkTaskSendInput) => {
      const taskId = input.taskId;
      if (!taskId) return;
      dispatch({ type: "SET_STREAMING", taskId, streaming: true });
      dispatch({
        type: "UPDATE_TASK",
        taskId,
        patch: { status: "running" },
      });
      const unsub = workTaskApi.subscribe(taskId, (event) => {
        dispatch({ type: "APPEND_EVENT", event });
      });
      try {
        await workTaskApi.send({ ...input, taskId });
      } finally {
        unsub();
        dispatch({ type: "SET_STREAMING", taskId, streaming: false });
      }
    },
    [],
  );

  const stopStream = useCallback(async () => {
    if (!state.streamingTaskId) return;
    await workTaskApi.stop(state.streamingTaskId);
    dispatch({ type: "SET_STREAMING", taskId: null, streaming: false });
  }, [state.streamingTaskId]);

  const setRightPanelTab = useCallback((tab: WorkTaskRightPanelTab) => {
    dispatch({ type: "SET_RIGHT_PANEL_TAB", tab });
  }, []);

  const setRightPanelOpen = useCallback((open: boolean) => {
    dispatch({ type: "SET_RIGHT_PANEL_OPEN", open });
    if (!open && state.activeTaskId) {
      dispatch({ type: "DISMISS_RIGHT_PANEL_AUTO", taskId: state.activeTaskId });
    }
  }, [state.activeTaskId]);

  const renameTask = useCallback((taskId: string, title: string) => {
    dispatch({ type: "UPDATE_TASK", taskId, patch: { title } });
  }, []);

  const value = useMemo<WorkTaskStoreValue>(
    () => ({
      tasks,
      activeTask,
      activeTaskId: state.activeTaskId,
      events,
      outputs,
      participants,
      isStreaming: state.isStreaming,
      rightPanelTab: state.rightPanelTab,
      rightPanelOpen: state.rightPanelOpen,
      setActiveTaskId,
      createTask,
      sendMessage,
      stopStream,
      appendEvent,
      setRightPanelTab,
      setRightPanelOpen,
      renameTask,
    }),
    [
      tasks,
      activeTask,
      state.activeTaskId,
      events,
      outputs,
      participants,
      state.isStreaming,
      state.rightPanelTab,
      state.rightPanelOpen,
      setActiveTaskId,
      createTask,
      sendMessage,
      stopStream,
      appendEvent,
      setRightPanelTab,
      setRightPanelOpen,
      renameTask,
    ],
  );

  return (
    <WorkTaskStoreContext.Provider value={value}>{children}</WorkTaskStoreContext.Provider>
  );
}

export function useWorkTaskStore(): WorkTaskStoreValue {
  const ctx = useContext(WorkTaskStoreContext);
  if (!ctx) {
    throw new Error("useWorkTaskStore must be used within WorkTaskStoreProvider");
  }
  return ctx;
}
