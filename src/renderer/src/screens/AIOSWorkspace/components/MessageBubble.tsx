import AgentMarkdown from "../../../components/AgentMarkdown";
import type { AIOSMessage } from "../types";

function bubbleClass(role: AIOSMessage["role"]): string {
  if (role === "user") return "ml-auto bg-blue-600 text-white";
  return "mr-auto bg-gray-800 text-gray-100";
}

export function MessageBubble({ message }: { message: AIOSMessage }): React.JSX.Element {
  const isAssistant = message.role === "assistant" || message.role === "system";

  return (
    <div className={`max-w-[85%] rounded px-3 py-2 text-sm ${bubbleClass(message.role)}`}>
      {isAssistant ? (
        <div className="prose-invert max-w-none text-sm">
          <AgentMarkdown>{message.content}</AgentMarkdown>
        </div>
      ) : (
        <span className="whitespace-pre-wrap">{message.content}</span>
      )}
    </div>
  );
}
