import { useCallback, useEffect, useMemo } from "react";
import { useHermesDefault } from "../../../context/HermesDefaultContext";
import { useHermesDefaultChatAttachments } from "./useHermesDefaultChatAttachments";
import { useHermesDefaultChatModels } from "./useHermesDefaultChatModels";
import { useHermesDefaultComposerState } from "./useHermesDefaultComposerState";
import { useHermesDefaultChatStream } from "./useHermesDefaultChatStream";

export function useHermesDefaultWebChat() {
  const { activeSessionId, setActiveSessionId, setActiveNavItem, sessions } = useHermesDefault();

  const sessionId = useMemo(
    () => activeSessionId ?? `draft_default`,
    [activeSessionId],
  );

  const models = useHermesDefaultChatModels(true, activeSessionId);
  const attachments = useHermesDefaultChatAttachments(sessionId);
  const composer = useHermesDefaultComposerState();

  const modelId = useMemo(() => {
    if (models.pendingModel?.id) return models.pendingModel.id;
    const current = models.models.find((m) => m.is_current);
    if (current?.id) return current.id;
    return null;
  }, [models.pendingModel?.id, models.models]);

  const onSessionId = useCallback(
    (id: string) => {
      setActiveSessionId(id);
      void sessions.refresh();
    },
    [setActiveSessionId, sessions.refresh],
  );

  const stream = useHermesDefaultChatStream({
    activeSessionId,
    onSessionId,
  });

  const { loadSessionHistory, clearMessages, cancel } = stream;

  useEffect(() => {
    if (activeSessionId) {
      void loadSessionHistory(activeSessionId);
    } else {
      clearMessages();
    }
  }, [activeSessionId, loadSessionHistory, clearMessages]);

  const newConversation = useCallback(() => {
    void cancel();
    attachments.clear();
    composer.clear();
    setActiveSessionId(null);
    clearMessages();
  }, [attachments, cancel, clearMessages, composer, setActiveSessionId]);

  const viewSessions = useCallback(() => {
    setActiveNavItem("sessions");
  }, [setActiveNavItem]);

  return {
    activeSessionId,
    sessionId,
    modelId,
    models,
    attachments,
    composer,
    stream,
    newConversation,
    viewSessions,
  };
}

