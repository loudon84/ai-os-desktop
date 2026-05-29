import { ipcRenderer } from "electron";
import type {
  WebOperatorTaskSessionAPI,
  WebOperatorTaskSessionResolveInput,
  WebOperatorTaskSessionUpsertInput,
} from "../shared/web-operator/web-operator-task-session-contract";

export const webOperatorTaskSessionApi: WebOperatorTaskSessionAPI = {
  resolve(input: WebOperatorTaskSessionResolveInput) {
    return ipcRenderer.invoke("web-operator-task-session:resolve", input);
  },
  upsert(input: WebOperatorTaskSessionUpsertInput) {
    return ipcRenderer.invoke("web-operator-task-session:upsert", input);
  },
  remove(taskId: string) {
    return ipcRenderer.invoke("web-operator-task-session:remove", taskId);
  },
};
