import { useEffect, useRef } from "react";
import { Copy } from "lucide-react";
import AgentMarkdown from "../../AgentMarkdown";
import type { HermesPanelMessage } from "../types";

export function WebOperatorHermesPanelMessageList({
  messages,
  streamingContent,
  className,
}: {
  messages: HermesPanelMessage[];
  streamingContent: string;
  className?: string;
}): React.JSX.Element {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const showStreaming = streamingContent.length > 0;

  return (
    <div className={`web-operator-hermes-panel__messages${className ? ` ${className}` : ""}`}>
      {messages.length === 0 && !showStreaming ? (
        <p className="web-operator-hermes-panel__empty">开始与 Hermes 对话</p>
      ) : null}
      {messages.map((m) => (
        <div
          key={m.id}
          className={`web-operator-hermes-panel__bubble web-operator-hermes-panel__bubble--${m.role}`}
        >
          {m.role === "assistant" ? (
            <div>
              {m.content ? (
                <AgentMarkdown>{m.content}</AgentMarkdown>
              ) : (
                <span className="text-neutral-500">（无输出）</span>
              )}
              {m.content ? (
                <div style={{ marginTop: "0.25rem", display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="web-operator-hermes-panel__btn"
                    title="复制"
                    onClick={() => void navigator.clipboard.writeText(m.content)}
                  >
                    <Copy size={12} />
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="web-operator-hermes-panel__bubble-pre">{m.content}</p>
          )}
        </div>
      ))}
      {showStreaming ? (
        <div className="web-operator-hermes-panel__bubble web-operator-hermes-panel__bubble--assistant">
          <AgentMarkdown>{streamingContent}</AgentMarkdown>
          <span className="web-operator-hermes-panel__streaming-cursor" />
        </div>
      ) : null}
      <div ref={bottomRef} />
    </div>
  );
}
