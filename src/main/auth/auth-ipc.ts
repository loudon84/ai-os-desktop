import { ipcMain } from "electron";
import type { LoginInput } from "../../shared/auth/auth-contract";
import { toPublicSession } from "../../shared/auth/auth-contract";
import { getAuthClient, getPublicSessionFromStore } from "./auth-client";
import {
  clearEncryptedSession,
  readEncryptedSession,
  saveEncryptedSession,
} from "./token-store";

export function registerAuthIpc(): void {
  ipcMain.handle("auth:get-session", () => {
    const session = readEncryptedSession();
    return getPublicSessionFromStore(session);
  });

  ipcMain.handle("auth:login", async (_, input: LoginInput) => {
    const internal = await getAuthClient().login(input);
    saveEncryptedSession(internal);
    return toPublicSession(internal);
  });

  ipcMain.handle("auth:logout", async () => {
    const session = readEncryptedSession();
    if (session?.accessToken) {
      try {
        await getAuthClient().logout(session.accessToken);
      } catch {
        /* ignore remote logout errors */
      }
    }
    clearEncryptedSession();
  });

  ipcMain.handle("auth:refresh", async () => {
    const session = readEncryptedSession();
    if (!session?.refreshToken) return null;
    try {
      const refreshed = await getAuthClient().refresh(session.refreshToken);
      saveEncryptedSession(refreshed);
      return toPublicSession(refreshed);
    } catch {
      clearEncryptedSession();
      return null;
    }
  });
}
