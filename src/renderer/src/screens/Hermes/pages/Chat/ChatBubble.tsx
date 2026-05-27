import AgentMarkdown from "../../../../components/AgentMarkdown";
import type { HermesMessage } from "../../types";

function bubbleModifier(role: HermesMessage["role"]): string {
  if (role === "user") return "hermes-chat-bubble--user";
  return "hermes-chat-bubble--assistant";
}

export function ChatBubble({ message }: { message: HermesMessage }): React.JSX.Element {
  const isAssistant = message.role === "assistant" || message.role === "system" || message.role === "tool";
  return (
    <div className={`hermes-chat-bubble ${bubbleModifier(message.role)}`}>
      <div className="hermes-chat-bubble__content">
        {isAssistant ? (
          <AgentMarkdown>{message.content}</AgentMarkdown>
        ) : (
          <span className="hermes-chat-bubble-pre">{message.content}</span>
        )}
      </div>
    </div>
  );
}

