import { Send, Square } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { HermesChatRunState, HermesGatewayUiStatus } from "../../types";

type Props = {
  text: string;
  onTextChange: (v: string) => void;
  runState: HermesChatRunState;
  gatewayStatus: HermesGatewayUiStatus;
  gatewayBusy: boolean;
  toolProgress?: string | null;
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
  toolProgress,
  disabled,
  onSend,
  onAbort,
  onStartGateway,
}: Props) {
  const { t } = useTranslation();
  const gatewayDown = gatewayStatus !== "running";
  const streaming = runState === "streaming";

  return (
    <div className="hermes-composer">
      {gatewayDown ? (
        <div className="hermes-composer__banner">
          <span>{t("workspaces.hermes.chat.gatewayDown")}</span>
          <button
            type="button"
            className="hermes-btn-primary"
            disabled={gatewayBusy}
            onClick={onStartGateway}
          >
            {t("workspaces.hermes.chat.startGateway")}
          </button>
        </div>
      ) : null}
      {toolProgress ? (
        <p className="hermes-composer__tool-progress">
          {t("workspaces.hermes.chat.toolProgress", { tool: toolProgress })}
        </p>
      ) : null}
      <div className="hermes-composer__row">
        <textarea
          className="hermes-composer__input"
          rows={2}
          placeholder={t("workspaces.hermes.composer.placeholder")}
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
            title={t("workspaces.hermes.composer.stop")}
          >
            <Square size={18} />
          </button>
        ) : (
          <button
            type="button"
            className="hermes-composer__send"
            disabled={disabled || gatewayDown || !text.trim()}
            onClick={onSend}
            title={t("workspaces.hermes.composer.send")}
          >
            <Send size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
