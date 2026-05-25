import { useCallback, useEffect, useMemo } from "react";
import { ChatComposer } from "../components/ChatComposer";
import { ChatHeader } from "../components/ChatHeader";
import { MessageTimeline } from "../components/MessageTimeline";
import { useWorkspaces } from "../context/WorkspacesContext";
import { useHermesChatStream } from "../hooks/useHermesChatStream";

export function ChatPanel(): React.JSX.Element {
  const {
    activeProfileId,
    activeSessionId,
    activeProfile,
    setActiveSessionId,
    refreshSessions,
    runtime,
    sessions,
  } = useWorkspaces();

  const profileRunning = runtime.status === "running";
  const profileHealthy = runtime.healthy;
  const canChat = profileRunning && profileHealthy;

  const onSessionIdFromChat = useCallback(
    (sessionId: string) => {
      setActiveSessionId(sessionId);
      refreshSessions();
    },
    [refreshSessions, setActiveSessionId],
  );

  const chat = useHermesChatStream(activeProfileId, activeSessionId, canChat, {
    onSessionIdFromChat,
  });

  const sessionTitle = useMemo(
    () => sessions.find((s) => s.id === activeSessionId)?.title,
    [sessions, activeSessionId],
  );

  const { loadSessionHistory, clearMessages } = chat;

  useEffect(() => {
    if (activeSessionId) {
      void loadSessionHistory(activeSessionId);
    } else {
      clearMessages();
    }
  }, [activeSessionId, activeProfileId, loadSessionHistory, clearMessages]);

  const isDefaultProfile =
    activeProfile?.name === "default" || activeProfileId === "default";
  const profileInstalled = isDefaultProfile || activeProfile?.installed !== false;

  return (
    <div className="workspaces-panel-root is-chat">
      <ChatHeader sessionTitle={sessionTitle} isDraft={!activeSessionId} />
      <MessageTimeline
        messages={chat.messages}
        streamingContent={chat.streamingContent}
        activeTool={chat.activeTool}
        runState={chat.runState}
        onApprove={chat.dismissApproval}
        onReject={() => void chat.cancel()}
      />
      <ChatComposer
        disabled={!activeProfileId || !canChat || !profileInstalled}
        runState={chat.runState}
        onSend={(text) => void chat.send(text)}
        onCancel={() => void chat.cancel()}
        onRetry={() => void chat.retryLast()}
        showPresetRequired={Boolean(activeProfileId && !profileInstalled)}
        showRestartUnhealthy={Boolean(
          activeProfileId && profileInstalled && profileRunning && !profileHealthy,
        )}
        showStartProfile={Boolean(activeProfileId && profileInstalled && !profileRunning)}
        onStartProfile={() => void runtime.start()}
        onRestartProfile={() => void runtime.restart()}
      />
    </div>
  );
}
