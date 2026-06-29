import { randomUUID } from "node:crypto";
import type { BrowserWindow } from "electron";
import { ipcMain } from "electron";
import type { WorkTaskEvent } from "../../shared/work/work-event-contract";
import type {
  WorkTaskSendInput,
  WorkTaskSendResult,
} from "../../shared/work/work-task-contract";
import { emitWorkTaskEvent, stopWorkTaskStream, startWorkTaskStream } from "./work-task-stream";

let getWindow: (() => BrowserWindow | null) | null = null;

export function registerWorkIpc(getMainWindow: () => BrowserWindow | null): void {
  getWindow = getMainWindow;

  ipcMain.handle(
    "work:task-send",
    async (_event, input: WorkTaskSendInput): Promise<WorkTaskSendResult> => {
      const taskId = input.taskId ?? randomUUID();
      void startWorkTaskStream(taskId, input, (ev) => {
        const win = getWindow?.();
        win?.webContents.send("work:task-event", ev);
      });
      return { taskId, ok: true, streamId: taskId };
    },
  );

  ipcMain.handle("work:task-stop", async (_event, taskId: string) => {
    stopWorkTaskStream(taskId);
  });

  ipcMain.handle("work:task-list", async () => {
    return [];
  });
}

export function pushWorkTaskEventToRenderer(event: WorkTaskEvent): void {
  const win = getWindow?.();
  win?.webContents.send("work:task-event", event);
  emitWorkTaskEvent(event);
}
