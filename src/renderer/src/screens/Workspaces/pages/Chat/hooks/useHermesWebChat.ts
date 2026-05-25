import { useCallback, useEffect, useMemo, useState } from "react";
import { useWorkspaces } from "../../../context/WorkspacesContext";
import { isPersistedSessionId } from "../../../api/sessionUtils";
import { useProfileResolver } from "./useProfileResolver";
import { useChatModels } from "./useChatModels";
import { useChatAttachments } from "./useChatAttachments";
import { useComposerState } from "./useComposerState";
import { useChatStream } from "./useChatStream";
import { useWorkspaceOptions } from "./useWorkspaceOptions";

export function useHermesWebChat() {
  const {
    activeProfileId,
    activeSessionId,
    activeProfile,
    profiles,
    setActiveProfileId,
    setActiveSessionId,
    refreshSessions,
    runtime,
  } = useWorkspaces();

  const profileRef = activeProfileId ?? activeProfile?.name ?? null;
  const { resolved, resolving, error: resolveError } = useProfileResolver(profileRef);

  const profileId = resolved?.profile_id ?? null;
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    if (profileId) {
      setWorkspaceId(profileId);
    } else {
      setWorkspaceId(null);
    }
  }, [profileId]);
  const gatewayReady = Boolean(resolved?.healthy && resolved?.status === "running");
  const canChat = Boolean(profileId && gatewayReady && resolved?.status !== "not_deployed");

  const sessionId = useMemo(
    () => activeSessionId ?? `draft_${profileId ?? "none"}`,
    [activeSessionId, profileId],
  );

  const workspaceOptions = useWorkspaceOptions(profileId);
  const models = useChatModels(profileId, gatewayReady);
  const attachments = useChatAttachments(profileId, workspaceId, sessionId);
  const composer = useComposerState();

  const stream = useChatStream({
    profileId,
    workspaceId,
    sessionId,
    canSend: canChat,
    modelId: models.pendingModel?.id ?? models.config?.model_id ?? null,
    onSessionId: (id) => {
      setActiveSessionId(id);
      refreshSessions();
    },
  });

  const { loadSessionHistory, clearMessages } = stream;

  useEffect(() => {
    if (activeSessionId) {
      void loadSessionHistory(activeSessionId);
    } else {
      clearMessages();
    }
  }, [activeSessionId, profileId, loadSessionHistory, clearMessages]);

  const newConversation = useCallback(() => {
    void stream.cancel();
    attachments.clear();
    composer.clear();
    setActiveSessionId(null);
    stream.clearMessages();
  }, [attachments, composer, setActiveSessionId, stream]);

  const profileInstalled =
    activeProfile?.installed !== false && resolved?.status !== "not_deployed";

  return {
    profiles,
    activeProfileId,
    setActiveProfileId,
    resolved,
    resolving,
    resolveError,
    workspaceId,
    setWorkspaceId,
    runtime,
    gatewayReady,
    canChat,
    profileInstalled,
    sessionId,
    isDraft: !isPersistedSessionId(activeSessionId),
    workspaceOptions,
    models,
    attachments,
    composer,
    stream,
    newConversation,
  };
}
