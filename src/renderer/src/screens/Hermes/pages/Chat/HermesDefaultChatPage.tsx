import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHermesDefault } from "../../context/HermesDefaultContext";
import { ChatScrollArea } from "./ChatScrollArea";
import { ComposerBar } from "./ComposerBar";
import { StatusToast } from "./StatusToast";
import { formatChatError } from "../../utils/formatChatError";

export default function HermesDefaultChatPage() {
  const { t } = useTranslation();
  const { chat, runtime, startNewConversation } = useHermesDefault();
  const [text, setText] = useState("");

  const handleSend = useCallback(async () => {
    await chat.send(text);
    setText("");
  }, [chat, text]);

  const toast = chat.error
    ? formatChatError(chat.error)
    : runtime.error
      ? formatChatError(runtime.error)
      : chat.runState === "streaming"
        ? t("workspaces.hermes.chat.generating")
        : "";

  return (
    <div className="hermes-chat-page hermes-panel-root is-chat">
      <div className="hermes-chat-page__toolbar">
        <button
          type="button"
          className="hermes-btn-ghost"
          onClick={() => void startNewConversation()}
        >
          {t("workspaces.hermes.chat.newConversation")}
        </button>
      </div>
      <StatusToast message={toast} variant={chat.error || runtime.error ? "error" : "info"} />
      <ChatScrollArea messages={chat.messages} />
      <ComposerBar
        text={text}
        onTextChange={setText}
        runState={chat.runState}
        gatewayStatus={runtime.status}
        gatewayBusy={runtime.busy}
        toolProgress={chat.toolProgress}
        onSend={() => void handleSend()}
        onAbort={() => void chat.abort()}
        onStartGateway={() => void runtime.start()}
      />
    </div>
  );
}
