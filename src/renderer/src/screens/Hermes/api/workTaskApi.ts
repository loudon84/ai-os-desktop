import type { WorkOutput } from "../../../../../shared/work/work-output-contract";
import type { WorkParticipant } from "../../../../../shared/work/work-participant-contract";
import type {
  WorkTask,
  WorkTaskListQuery,
  WorkTaskSendInput,
  WorkTaskSendResult,
} from "../../../../../shared/work/work-task-contract";
import type { WorkTaskEvent } from "../../../../../shared/work/work-event-contract";
import { buildSalesCombatMockEvents, buildUserMessageEvent } from "../mock/mockEvents";
import { createDraftTask } from "../mock/mockTasks";
import { MOCK_OUTPUTS } from "../mock/mockOutputs";
import { WORK_MOCK_MODE } from "../mock/workMockMode";
import { participantsFromEvents } from "../features/task-store/workTaskSelectors";
import {
  normalizeWorkspaceChatChunk,
  normalizeWorkspaceChatDone,
  normalizeWorkspaceChatError,
  normalizeWorkspaceChatToolProgress,
} from "../features/task-stream/workEventNormalizer";

const taskStore = new Map<string, WorkTask>();
const eventStore = new Map<string, WorkTaskEvent[]>();
const outputStore = new Map<string, WorkOutput[]>();
const mockAbortControllers = new Map<string, AbortController>();

function workspaceChatApi(): NonNullable<typeof window.workspaceChat> {
  if (!window.workspaceChat) {
    throw new Error("window.workspaceChat is not available");
  }
  return window.workspaceChat;
}

function persistTask(task: WorkTask): void {
  taskStore.set(task.id, task);
  try {
    const ids = Array.from(taskStore.keys());
    localStorage.setItem("work.tasks.ids", JSON.stringify(ids));
    localStorage.setItem(`work.task.${task.id}`, JSON.stringify(task));
  } catch {
    /* ignore */
  }
}

function loadPersistedTasks(): WorkTask[] {
  try {
    const raw = localStorage.getItem("work.tasks.ids");
    if (!raw) return [];
    const ids = JSON.parse(raw) as string[];
    return ids
      .map((id) => {
        const t = localStorage.getItem(`work.task.${id}`);
        return t ? (JSON.parse(t) as WorkTask) : null;
      })
      .filter((t): t is WorkTask => t !== null);
  } catch {
    return [];
  }
}

// hydrate on module load
for (const t of loadPersistedTasks()) {
  taskStore.set(t.id, t);
}

async function replayMockStream(
  taskId: string,
  onEvent: (event: WorkTaskEvent) => void,
  signal: AbortSignal,
): Promise<void> {
  const events = buildSalesCombatMockEvents(taskId);
  for (const event of events) {
    if (signal.aborted) break;
    onEvent(event);
    eventStore.set(taskId, [...(eventStore.get(taskId) ?? []), event]);
    if (event.type === "output.created") {
      const out: WorkOutput = {
        id: event.outputId,
        taskId,
        name: event.name,
        type: event.outputType,
        source: "agent",
        previewable: true,
        version: 1,
        content: event.content,
        createdBy: "agent",
        createdAt: event.createdAt,
      };
      outputStore.set(taskId, [...(outputStore.get(taskId) ?? []), out]);
    }
    await new Promise((r) => setTimeout(r, 120));
  }
}

export const workTaskApi = {
  async list(query?: WorkTaskListQuery): Promise<WorkTask[]> {
    const all = Array.from(taskStore.values()).sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
    if (!query?.status?.length) return all;
    return all.filter((t) => query.status?.includes(t.status));
  },

  async get(taskId: string): Promise<WorkTask | null> {
    return taskStore.get(taskId) ?? null;
  },

  async create(input: WorkTaskSendInput): Promise<WorkTask> {
    const task = createDraftTask(input.text, input.selectedTeamId);
    task.status = "ready";
    task.selectedSkillIds = input.selectedSkillIds ?? [];
    task.selectedExpertIds = input.selectedExpertIds ?? [];
    task.selectedAppIds = input.selectedAppIds ?? [];
    task.contextRefs = input.contextRefs ?? [];
    if (input.selectedTeamId) {
      task.taskType = "expert_team";
      task.activeTeamId = input.selectedTeamId;
    }
    persistTask(task);
    eventStore.set(task.id, []);
    return task;
  },

  async send(input: WorkTaskSendInput): Promise<WorkTaskSendResult> {
    const taskId = input.taskId;
    if (!taskId) {
      return { taskId: "", ok: false, error: "taskId required" };
    }
    const task = taskStore.get(taskId);
    if (!task) {
      return { taskId, ok: false, error: "WORK_TASK_NOT_FOUND" };
    }

    const userEv = buildUserMessageEvent(taskId, input.text);
    const listeners = eventListeners.get(taskId);
    listeners?.forEach((cb) => cb(userEv));

    const updated = { ...task, status: "running" as const, updatedAt: new Date().toISOString() };
    persistTask(updated);

    if (WORK_MOCK_MODE || input.selectedTeamId) {
      const controller = new AbortController();
      mockAbortControllers.set(taskId, controller);
      try {
        await replayMockStream(
          taskId,
          (ev) => {
            listeners?.forEach((cb) => cb(ev));
          },
          controller.signal,
        );
      } finally {
        mockAbortControllers.delete(taskId);
      }
      return { taskId, ok: true, streamId: `mock-${taskId}` };
    }

    if (window.workspaceChat) {
      const profileId = "default";
      const workspaceId = "work";
      const sessionId = taskId;
      const unsubChunk = workspaceChatApi().onChunk((ev) => {
        if (ev.session_id !== sessionId) return;
        listeners?.forEach((cb) => cb(normalizeWorkspaceChatChunk(taskId, ev)));
      });
      const unsubTool = workspaceChatApi().onToolProgress((ev) => {
        if (ev.session_id !== sessionId) return;
        listeners?.forEach((cb) => cb(normalizeWorkspaceChatToolProgress(taskId, ev)));
      });
      const unsubDone = workspaceChatApi().onDone((ev) => {
        if (ev.session_id !== sessionId) return;
        listeners?.forEach((cb) => cb(normalizeWorkspaceChatDone(taskId, ev)));
        unsubChunk();
        unsubTool();
        unsubDone();
        unsubErr();
      });
      const unsubErr = workspaceChatApi().onError((ev) => {
        if (ev.session_id !== sessionId) return;
        listeners?.forEach((cb) => cb(normalizeWorkspaceChatError(taskId, ev)));
        unsubChunk();
        unsubTool();
        unsubDone();
        unsubErr();
      });
      try {
        await workspaceChatApi().sendMessage({
          profile_id: profileId,
          workspace_id: workspaceId,
          session_id: sessionId,
          messages: [{ role: "user", content: input.text }],
        });
      } catch (err) {
        return {
          taskId,
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        };
      }
      return { taskId, ok: true, streamId: sessionId };
    }

    return { taskId, ok: true };
  },

  async stop(taskId: string): Promise<void> {
    const mockCtrl = mockAbortControllers.get(taskId);
    if (mockCtrl) {
      mockCtrl.abort();
      mockAbortControllers.delete(taskId);
    }
    if (window.work?.task?.stop) {
      await window.work.task.stop(taskId);
      return;
    }
    if (window.workspaceChat) {
      await workspaceChatApi().abort({ profile_id: "default", session_id: taskId });
    }
  },

  subscribe(taskId: string, callback: (event: WorkTaskEvent) => void): () => void {
    if (!eventListeners.has(taskId)) {
      eventListeners.set(taskId, new Set());
    }
    eventListeners.get(taskId)?.add(callback);

    if (window.work?.task?.onEvent) {
      const ipcUnsub = window.work.task.onEvent((event) => {
        if (event.taskId === taskId) callback(event);
      });
      return () => {
        eventListeners.get(taskId)?.delete(callback);
        ipcUnsub();
      };
    }

    return () => {
      eventListeners.get(taskId)?.delete(callback);
    };
  },

  getOutputs(taskId: string): WorkOutput[] {
    return outputStore.get(taskId) ?? MOCK_OUTPUTS.filter((o) => o.taskId === taskId);
  },

  getParticipants(taskId: string, events: WorkTaskEvent[]): WorkParticipant[] {
    return participantsFromEvents(taskId, events);
  },
};

const eventListeners = new Map<string, Set<(event: WorkTaskEvent) => void>>();
