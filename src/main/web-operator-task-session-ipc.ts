import { ipcMain } from "electron";
import type {
  WebOperatorTaskSessionResolveInput,
  WebOperatorTaskSessionUpsertInput,
} from "../shared/web-operator/web-operator-task-session-contract";
import {
  removeTaskSession,
  resolveTaskSession,
  upsertTaskSession,
} from "./web-operator-task-session-store";

export function registerWebOperatorTaskSessionIpc(): void {
  ipcMain.handle(
    "web-operator-task-session:resolve",
    (_event, input: WebOperatorTaskSessionResolveInput) => {
      if (!input?.pageUrl || typeof input.pageUrl !== "string") {
        throw new Error("pageUrl is required");
      }
      return resolveTaskSession(input.pageUrl);
    },
  );

  ipcMain.handle(
    "web-operator-task-session:upsert",
    (_event, input: WebOperatorTaskSessionUpsertInput) => {
      if (!input?.taskId || !input?.pageUrl || !input?.sessionId || !input?.pageContext) {
        throw new Error("taskId, pageUrl, sessionId, and pageContext are required");
      }
      return upsertTaskSession(input);
    },
  );

  ipcMain.handle("web-operator-task-session:remove", (_event, taskId: string) => {
    if (!taskId || typeof taskId !== "string") {
      throw new Error("taskId is required");
    }
    removeTaskSession(taskId);
    return { ok: true as const };
  });
}
