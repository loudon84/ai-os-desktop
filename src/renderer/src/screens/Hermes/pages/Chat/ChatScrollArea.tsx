import { useEffect, useRef } from "react";
import type { HermesMessage } from "../../types";

export function ChatScrollArea({ messages }: { messages: HermesMessage[] }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="hermes-chat-empty">
        <p>与本地 default Hermes Gateway 对话</p>
        <p className="hermes-muted">数据经 window.hermesAPI 直连本地 Gateway</p>
      </div>
    );
  }

  return (
    <div className="hermes-chat-scroll">
      {messages.map((m) => (
        <div
          key={m.id}
          className={`hermes-chat-bubble hermes-chat-bubble--${m.role}`}
        >
          <div className="hermes-chat-bubble__role">{m.role}</div>
          <div className="hermes-chat-bubble__content">{m.content || "…"}</div>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}
