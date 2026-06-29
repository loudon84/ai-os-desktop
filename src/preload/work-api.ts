import { contextBridge, ipcRenderer } from "electron";
import type { WorkTaskEvent } from "../shared/work/work-event-contract";
import type { WorkTask, WorkTaskSendInput, WorkTaskSendResult } from "../shared/work/work-task-contract";

export const workApiBridge = {
  task: {
    create(_input: WorkTaskSendInput): Promise<WorkTask> {
      throw new Error("work.task.create is renderer-only in v1.4");
    },
    send(input: WorkTaskSendInput): Promise<WorkTaskSendResult> {
      return ipcRenderer.invoke("work:task-send", input);
    },
    stop(taskId: string): Promise<void> {
      return ipcRenderer.invoke("work:task-stop", taskId);
    },
    list(): Promise<WorkTask[]> {
      return ipcRenderer.invoke("work:task-list");
    },
    get(_taskId: string): Promise<WorkTask | null> {
      return Promise.resolve(null);
    },
    onEvent(callback: (event: WorkTaskEvent) => void): () => void {
      const listener = (_event: Electron.IpcRendererEvent, payload: WorkTaskEvent) => {
        callback(payload);
      };
      ipcRenderer.on("work:task-event", listener);
      return () => {
        ipcRenderer.removeListener("work:task-event", listener);
      };
    },
  },
};
