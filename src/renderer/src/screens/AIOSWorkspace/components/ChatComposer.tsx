import { useState } from "react";
import { useI18n } from "../../../components/useI18n";
import type { ChatRunState } from "../types";

export function ChatComposer({
  disabled,
  runState,
  onSend,
  onCancel,
  onRetry,
  onStartProfile,
  onRestartProfile,
  showStartProfile,
  showPresetRequired,
  showRestartUnhealthy,
}: {
  disabled: boolean;
  runState: ChatRunState;
  onSend: (text: string) => void;
  onCancel: () => void;
  onRetry?: () => void;
  onStartProfile?: () => void;
  onRestartProfile?: () => void;
  showStartProfile?: boolean;
  showPresetRequired?: boolean;
  showRestartUnhealthy?: boolean;
}): React.JSX.Element {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const busy =
    runState === "creating" ||
    runState === "streaming" ||
    runState === "waiting_approval";
  const inputDisabled = disabled || busy;

  if (showPresetRequired) {
    return (
      <div className="border-t border-gray-800 p-4 text-center">
        <p className="text-xs text-gray-500">
          {t("aiosWorkspace.chat.presetRequired", {
            defaultValue: "Install this expert preset before chatting.",
          })}
        </p>
      </div>
    );
  }

  if (showRestartUnhealthy) {
    return (
      <div className="border-t border-gray-800 p-4 text-center">
        <p className="mb-2 text-xs text-amber-400/90">
          {t("aiosWorkspace.chat.restartUnhealthyHint", {
            defaultValue: "Profile is running but Gateway health check failed. Restart to recover.",
          })}
        </p>
        <button
          type="button"
          className="rounded bg-amber-700 px-4 py-2 text-sm text-white hover:bg-amber-600"
          onClick={onRestartProfile}
        >
          {t("aiosWorkspace.runtime.restart", { defaultValue: "Restart" })}
        </button>
      </div>
    );
  }

  if (showStartProfile) {
    return (
      <div className="border-t border-gray-800 p-4 text-center">
        <p className="mb-2 text-xs text-gray-500">
          {t("aiosWorkspace.chat.startProfileHint", {
            defaultValue: "Profile is not running. Start it to chat.",
          })}
        </p>
        <button
          type="button"
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          onClick={onStartProfile}
        >
          {t("aiosWorkspace.runtime.start", { defaultValue: "Start Profile" })}
        </button>
      </div>
    );
  }

  return (
    <form
      className="flex gap-2 border-t border-gray-800 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        const text = input.trim();
        if (!text || inputDisabled) return;
        setInput("");
        onSend(text);
      }}
    >
      <input
        className="flex-1 rounded bg-gray-800 px-3 py-2 text-sm text-gray-100 disabled:opacity-50"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={t("navigation.chatPlaceholder", { defaultValue: "Message…" })}
        disabled={inputDisabled}
      />
      {runState === "error" && onRetry ? (
        <button
          type="button"
          className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
          onClick={onRetry}
        >
          {t("aiosWorkspace.chat.retry", { defaultValue: "Retry" })}
        </button>
      ) : null}
      {busy ? (
        <button
          type="button"
          className="rounded border border-gray-600 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800"
          onClick={onCancel}
        >
          {t("common.cancel", { defaultValue: "Cancel" })}
        </button>
      ) : runState !== "error" ? (
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          disabled={inputDisabled || !input.trim()}
        >
          {t("navigation.send", { defaultValue: "Send" })}
        </button>
      ) : null}
    </form>
  );
}
