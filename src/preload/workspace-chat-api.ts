import { ipcRenderer } from "electron";
import type {
  ChatModelListResponse,
  ProfileChatModelConfig,
  ResolvedProfile,
  SetProfileChatModelConfigPayload,
  UploadWorkspaceAttachmentsPayload,
  UploadWorkspaceAttachmentsResponse,
  WorkspaceChatChunkEvent,
  WorkspaceChatDoneEvent,
  WorkspaceChatErrorEvent,
  WorkspaceChatAbortPayload,
  WorkspaceChatSendPayload,
  WorkspaceChatStatusEvent,
  WorkspaceChatToolProgressEvent,
  WorkspaceChatUsageEvent,
} from "../shared/workspace-chat/workspace-chat-contract";

export const workspaceChatApi = {
  resolveProfile(profileRef: string): Promise<ResolvedProfile> {
    return ipcRenderer.invoke("workspace-chat:resolve-profile", profileRef);
  },

  listModels(profileId: string): Promise<ChatModelListResponse> {
    return ipcRenderer.invoke("workspace-chat:list-models", profileId);
  },

  getModelConfig(profileId: string): Promise<ProfileChatModelConfig | null> {
    return ipcRenderer.invoke("workspace-chat:get-model-config", profileId);
  },

  setModelConfig(
    profileId: string,
    payload: SetProfileChatModelConfigPayload,
  ): Promise<ProfileChatModelConfig> {
    return ipcRenderer.invoke("workspace-chat:set-model-config", profileId, payload);
  },

  uploadAttachments(
    payload: UploadWorkspaceAttachmentsPayload,
  ): Promise<UploadWorkspaceAttachmentsResponse> {
    return ipcRenderer.invoke("workspace-chat:upload-attachments", payload);
  },

  removeAttachment(workspaceId: string, attachmentId: string): Promise<{ ok: true }> {
    return ipcRenderer.invoke("workspace-chat:remove-attachment", workspaceId, attachmentId);
  },

  sendMessage(payload: WorkspaceChatSendPayload): Promise<{ stream_id: string }> {
    return ipcRenderer.invoke("workspace-chat:send-message", payload);
  },

  abort(profileIdOrPayload: string | WorkspaceChatAbortPayload): Promise<{ ok: true }> {
    return ipcRenderer.invoke("workspace-chat:abort", profileIdOrPayload);
  },

  onChunk(callback: (event: WorkspaceChatChunkEvent) => void): () => void {
    const handler = (_e: Electron.IpcRendererEvent, data: WorkspaceChatChunkEvent): void =>
      callback(data);
    ipcRenderer.on("workspace-chat:chunk", handler);
    return () => ipcRenderer.removeListener("workspace-chat:chunk", handler);
  },

  onToolProgress(callback: (event: WorkspaceChatToolProgressEvent) => void): () => void {
    const handler = (
      _e: Electron.IpcRendererEvent,
      data: WorkspaceChatToolProgressEvent,
    ): void => callback(data);
    ipcRenderer.on("workspace-chat:tool-progress", handler);
    return () => ipcRenderer.removeListener("workspace-chat:tool-progress", handler);
  },

  onUsage(callback: (event: WorkspaceChatUsageEvent) => void): () => void {
    const handler = (_e: Electron.IpcRendererEvent, data: WorkspaceChatUsageEvent): void =>
      callback(data);
    ipcRenderer.on("workspace-chat:usage", handler);
    return () => ipcRenderer.removeListener("workspace-chat:usage", handler);
  },

  onDone(callback: (event: WorkspaceChatDoneEvent) => void): () => void {
    const handler = (_e: Electron.IpcRendererEvent, data: WorkspaceChatDoneEvent): void =>
      callback(data);
    ipcRenderer.on("workspace-chat:done", handler);
    return () => ipcRenderer.removeListener("workspace-chat:done", handler);
  },

  onError(callback: (event: WorkspaceChatErrorEvent) => void): () => void {
    const handler = (_e: Electron.IpcRendererEvent, data: WorkspaceChatErrorEvent): void =>
      callback(data);
    ipcRenderer.on("workspace-chat:error", handler);
    return () => ipcRenderer.removeListener("workspace-chat:error", handler);
  },

  onStatus(callback: (event: WorkspaceChatStatusEvent) => void): () => void {
    const handler = (_e: Electron.IpcRendererEvent, data: WorkspaceChatStatusEvent): void =>
      callback(data);
    ipcRenderer.on("workspace-chat:status", handler);
    return () => ipcRenderer.removeListener("workspace-chat:status", handler);
  },
};
