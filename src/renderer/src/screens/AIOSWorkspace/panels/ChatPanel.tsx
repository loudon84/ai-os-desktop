import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "../../../components/useI18n";

export interface ChatPanelProps {
  profile: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function bubbleClass(role: ChatMessage["role"]): string {
  return role === "user"
    ? "ml-auto bg-blue-600 text-white"
    : "mr-auto bg-gray-800 text-gray-100";
}

export function ChatPanel({ profile }: ChatPanelProps): React.JSX.Element {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState("");
  const [busy, setBusy] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubChunk = window.hermesAPI.onChatChunk((chunk) => {
      setStreaming((prev) => prev + chunk);
    });
    const unsubDone = window.hermesAPI.onChatDone((id) => {
      setStreaming((current) => {
        if (current) {
          setMessages((msgs) => [...msgs, { role: "assistant", content: current }]);
        }
        return "";
      });
      if (id) setSessionId(id);
      setBusy(false);
    });
    const unsubError = window.hermesAPI.onChatError((err) => {
      setMessages((msgs) => [...msgs, { role: "assistant", content: `Error: ${err}` }]);
      setStreaming("");
      setBusy(false);
    });
    return () => {
      unsubChunk();
      unsubDone();
      unsubError();
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setMessages((msgs) => [...msgs, { role: "user", content: text }]);
    setBusy(true);
    setStreaming("");
    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      await window.hermesAPI.sendMessage(text, profile, sessionId, history);
    } catch (err) {
      setMessages((msgs) => [
        ...msgs,
        { role: "assistant", content: `Error: ${String(err)}` },
      ]);
      setBusy(false);
    }
  }, [input, busy, messages, profile, sessionId]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-gray-900 rounded-lg">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <ChatBubble key={`${msg.role}-${i}`} msg={msg} />
        ))}
        {streaming ? <StreamingBubble content={streaming} /> : null}
        <div ref={bottomRef} />
      </div>
      <form
        className="flex gap-2 border-t border-gray-800 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <input
          className="flex-1 rounded bg-gray-800 px-3 py-2 text-sm text-gray-100"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("navigation.chatPlaceholder", { defaultValue: "Message…" })}
          disabled={busy}
        />
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          disabled={busy || !input.trim()}
        >
          {t("navigation.send", { defaultValue: "Send" })}
        </button>
      </form>
    </div>
  );
}

function ChatBubble({ msg }: { msg: ChatMessage }): React.JSX.Element {
  return (
    <div
      className={`max-w-[85%] rounded px-3 py-2 text-sm whitespace-pre-wrap ${bubbleClass(msg.role)}`}
    >
      {msg.content}
    </div>
  );
}

function StreamingBubble({ content }: { content: string }): React.JSX.Element {
  return (
    <div
      className={`max-w-[85%] rounded px-3 py-2 text-sm whitespace-pre-wrap ${bubbleClass("assistant")}`}
    >
      {content}
    </div>
  );
}
