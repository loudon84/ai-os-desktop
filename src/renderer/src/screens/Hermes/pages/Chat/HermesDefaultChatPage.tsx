import { useCallback, useEffect, useState } from "react";
import { useHermesDefault } from "../../context/HermesDefaultContext";
import { ChatScrollArea } from "./ChatScrollArea";
import { ComposerBar } from "./ComposerBar";
import { StatusToast } from "./StatusToast";
import { formatChatError } from "../../utils/formatChatError";

export default function HermesDefaultChatPage() {
  const { chat, runtime, sessions, setActiveSessionId } = useHermesDefault();
  const [text, setText] = useState("");

  useEffect(() => {
    const unsub = window.hermesAPI.onChatDone((sessionId) => {
      if (sessionId) {
        setActiveSessionId(sessionId);
        void sessions.refresh();
      }
    });
    return unsub;
  }, [sessions, setActiveSessionId]);

  const handleSend = useCallback(async () => {
    const sid = await chat.send(text, (sessionId) => {
      setActiveSessionId(sessionId);
      void sessions.refresh();
    });
    if (sid) setActiveSessionId(sid);
    setText("");
  }, [chat, sessions, setActiveSessionId, text]);

  const toast = chat.error
    ? formatChatError(chat.error)
    : runtime.error
      ? formatChatError(runtime.error)
      : chat.runState === "streaming"
        ? "Generating…"
        : "";

  return (
    <div className="hermes-chat-page hermes-panel-root is-chat">
      <StatusToast message={toast} variant={chat.error || runtime.error ? "error" : "info"} />
      <ChatScrollArea messages={chat.messages} />
      <ComposerBar
        text={text}
        onTextChange={setText}
        runState={chat.runState}
        gatewayStatus={runtime.status}
        gatewayBusy={runtime.busy}
        onSend={() => void handleSend()}
        onAbort={() => void chat.abort()}
        onStartGateway={() => void runtime.start()}
      />
    </div>
  );
}
