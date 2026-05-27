import { ipcMain, Notification, type BrowserWindow } from "electron";
import type {
  HermesChatSendPayload,
  SetHermesChatModelConfigPayload,
  UploadHermesAttachmentBuffersPayload,
  UploadHermesAttachmentsPayload,
} from "../../shared/hermes-default-chat/hermes-default-chat-contract";
import {
  isRemoteMode,
  sendMessage,
  startGateway,
  isGatewayRunning,
  ensureSshTunnelIfNeeded,
  restartGatewayAsync,
} from "../hermes";
import { getConnectionConfig, getModelConfig } from "../config";
import {
  isSshTunnelHealthy,
  startSshTunnel,
} from "../ssh-tunnel";
import {
  sshGatewayStatus,
  sshStartGateway,
  sshReadRemoteApiKey,
} from "../ssh-remote";
import { setSshRemoteApiKey } from "../hermes";
import {
  listHermesChatModels,
  getHermesChatModelConfig,
  setHermesChatModelConfig,
} from "./hermes-default-chat-models";
import {
  pickAndUploadHermesAttachments,
  uploadHermesAttachmentsFromBuffers,
  removeHermesAttachment,
} from "./hermes-default-chat-attachments";

export type HermesChatAbortRef = {
  current: (() => void) | null;
};

export function registerHermesDefaultChatIpc(
  getMainWindow: () => BrowserWindow | null,
  chatAbortRef: HermesChatAbortRef,
): void {
  ipcMain.handle("hermes-chat:list-models", (_event, profile?: string) => {
    return listHermesChatModels(profile);
  });

  ipcMain.handle("hermes-chat:get-model-config", (_event, profile?: string) => {
    return getHermesChatModelConfig(profile);
  });

  ipcMain.handle(
    "hermes-chat:set-model-config",
    async (_event, profile: string | undefined, payload: SetHermesChatModelConfigPayload) => {
      const before = getModelConfig(profile);
      const result = setHermesChatModelConfig(profile, payload);
      const after = getModelConfig(profile);
      const changed =
        before.provider !== after.provider ||
        before.model !== after.model ||
        before.baseUrl !== after.baseUrl;

      if (!isRemoteMode() && changed && isGatewayRunning()) {
        await restartGatewayAsync(profile);
      }
      return result;
    },
  );

  ipcMain.handle(
    "hermes-chat:upload-attachments",
    async (_event, payload: UploadHermesAttachmentsPayload) => {
      return pickAndUploadHermesAttachments(payload);
    },
  );

  ipcMain.handle(
    "hermes-chat:upload-attachment-buffers",
    async (_event, payload: UploadHermesAttachmentBuffersPayload) => {
      return uploadHermesAttachmentsFromBuffers(payload);
    },
  );

  ipcMain.handle(
    "hermes-chat:remove-attachment",
    async (_event, _workspaceId: string, attachmentId: string, profile?: string) => {
      await removeHermesAttachment(profile, attachmentId);
      return { ok: true as const };
    },
  );

  ipcMain.handle("hermes-chat:send-message", async (event, payload: HermesChatSendPayload) => {
    const profile = payload.profile;
    if (!isRemoteMode() && !isGatewayRunning()) {
      startGateway(profile);
    }

    await ensureSshTunnelIfNeeded();
    const conn = getConnectionConfig();
    if (conn.mode === "ssh" && conn.ssh) {
      const gatewayRunning = await sshGatewayStatus(conn.ssh);
      const tunnelHealthy = await isSshTunnelHealthy();
      if (!gatewayRunning || !tunnelHealthy) {
        await sshStartGateway(conn.ssh);
        await startSshTunnel(conn.ssh);
        const key = await sshReadRemoteApiKey(conn.ssh);
        setSshRemoteApiKey(key);
      }
    }

    if (chatAbortRef.current) {
      chatAbortRef.current();
    }

    console.log(
      `[Hermes Chat] IPC send-message model_id=${payload.model_id ?? "(未传)"} profile=${profile ?? "default"}`,
    );

    let fullResponse = "";
    const chatStartTime = Date.now();
    let resolveChat: (v: { response: string; sessionId?: string }) => void;
    let rejectChat: (reason?: unknown) => void;
    const promise = new Promise<{ response: string; sessionId?: string }>((res, rej) => {
      resolveChat = res;
      rejectChat = rej;
    });

    const handle = await sendMessage(
      payload.message,
      {
        onChunk: (chunk) => {
          fullResponse += chunk;
          event.sender.send("chat-chunk", chunk);
        },
        onDone: (sessionId) => {
          chatAbortRef.current = null;
          event.sender.send("chat-done", sessionId || "");
          resolveChat({ response: fullResponse, sessionId });
          const mainWindow = getMainWindow();
          if (mainWindow && !mainWindow.isFocused() && Date.now() - chatStartTime > 10000) {
            const preview = fullResponse
              .replace(/[#*_`~\n]+/g, " ")
              .trim()
              .slice(0, 80);
            new Notification({
              title: "Hermes Agent",
              body: preview || "Response ready",
            }).show();
          }
        },
        onError: (error) => {
          chatAbortRef.current = null;
          event.sender.send("chat-error", error);
          rejectChat(new Error(error));
          const mainWindow = getMainWindow();
          if (mainWindow && !mainWindow.isFocused()) {
            new Notification({
              title: "Hermes Agent — Error",
              body: error.slice(0, 100),
            }).show();
          }
        },
        onToolProgress: (tool) => {
          event.sender.send("chat-tool-progress", tool);
        },
        onUsage: (usage) => {
          event.sender.send("chat-usage", usage);
        },
      },
      profile,
      payload.resumeSessionId,
      payload.history,
      {
        attachmentIds: payload.attachment_ids,
        modelId: payload.model_id,
      },
    );

    chatAbortRef.current = handle.abort;
    return promise;
  });
}
