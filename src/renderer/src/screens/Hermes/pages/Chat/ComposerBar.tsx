import { Send, Square } from "lucide-react";
import type { HermesChatRunState, HermesGatewayUiStatus } from "../../types";

type Props = {
  text: string;
  onTextChange: (v: string) => void;
  runState: HermesChatRunState;
  gatewayStatus: HermesGatewayUiStatus;
  gatewayBusy: boolean;
  disabled?: boolean;
  onSend: () => void;
  onAbort: () => void;
  onStartGateway: () => void;
};

export function ComposerBar({
  text,
  onTextChange,
  runState,
  gatewayStatus,
  gatewayBusy,
  disabled,
  onSend,
  onAbort,
  onStartGateway,
}: Props) {
  const gatewayDown = gatewayStatus !== "running";
  const streaming = runState === "streaming";

  return (
    <div className="hermes-composer">
      {gatewayDown ? (
        <div className="hermes-composer__banner">
          <span>Gateway 未运行</span>
          <button
            type="button"
            className="hermes-btn-primary"
            disabled={gatewayBusy}
            onClick={onStartGateway}
          >
            Start Gateway
          </button>
        </div>
      ) : null}
      <div className="hermes-composer__row">
        <textarea
          className="hermes-composer__input"
          rows={2}
          placeholder="Message…"
          value={text}
          disabled={disabled || gatewayDown || streaming}
          onChange={(e) => onTextChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!gatewayDown && !streaming) onSend();
            }
          }}
        />
        {streaming ? (
          <button
            type="button"
            className="hermes-composer__send"
            onClick={onAbort}
            title="Stop"
          >
            <Square size={18} />
          </button>
        ) : (
          <button
            type="button"
            className="hermes-composer__send"
            disabled={disabled || gatewayDown || !text.trim()}
            onClick={onSend}
            title="Send"
          >
            <Send size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
