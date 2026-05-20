import { ipcRenderer } from "electron";
import type { AuthAPI } from "../shared/auth/auth-contract";

export const authApi: AuthAPI = {
  getSession: () => ipcRenderer.invoke("auth:get-session"),
  login: (input) => ipcRenderer.invoke("auth:login", input),
  logout: () => ipcRenderer.invoke("auth:logout"),
  refresh: () => ipcRenderer.invoke("auth:refresh"),
};
