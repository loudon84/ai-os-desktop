import { useCallback, useMemo, useState } from "react";
import { Copy, RefreshCw, Send } from "lucide-react";
import type { CrmDesktopCommand } from "../../../../shared/crm-bridge";
import { useCrmBridgeEvents } from "./hooks/use-crm-bridge-events";

export interface CrmEventPanelProps {
  className?: string;
  onRefreshSnapshot?: () => void;
}

function jsonStringifySafe(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function CrmEventPanel({
  className,
  onRefreshSnapshot,
}: CrmEventPanelProps): React.JSX.Element {
  const { lastEvent, error, refresh } = useCrmBridgeEvents();
  const [sending, setSending] = useState(false);

  const ctxText = useMemo(() => {
    if (!lastEvent) return "";
    return jsonStringifySafe(lastEvent);
  }, [lastEvent]);

  const copyContext = useCallback(async () => {
    if (!ctxText) return;
    await navigator.clipboard.writeText(ctxText);
  }, [ctxText]);

  const sendToastCommand = useCallback(async () => {
    if (!lastEvent) return;
    setSending(true);
    try {
      const command: CrmDesktopCommand = {
        commandId: `cmd_${Date.now()}`,
        type: "desktop.crm.showToast",
        payload: {
          message: `Desktop received ${lastEvent.type}`,
        },
        createdAt: new Date().toISOString(),
      };
      await window.aiosBrowser.sendCrmCommand(command);
    } finally {
      setSending(false);
    }
  }, [lastEvent]);

  return (
    <div className={`flex flex-col h-full ${className ?? ""}`}>
      <div className="px-3 py-2 border-b border-neutral-700 flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-300">CRM Context</h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => void refresh()}
            className="p-1 rounded hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
          <button
            type="button"
            onClick={copyContext}
            disabled={!ctxText}
            className="p-1 rounded hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 disabled:opacity-50"
            title="Copy context"
          >
            <Copy size={14} />
          </button>
          <button
            type="button"
            onClick={() => void sendToastCommand()}
            disabled={!lastEvent || sending}
            className="p-1 rounded hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 disabled:opacity-50"
            title="Send command"
          >
            <Send size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {error ? <p className="text-xs text-red-400">{error}</p> : null}

        {lastEvent ? (
          <div className="space-y-2 text-xs">
            <div className="flex flex-wrap gap-2">
              <span className="px-1.5 py-0.5 rounded bg-sky-900/40 text-sky-300">
                {lastEvent.type}
              </span>
              {lastEvent.origin ? (
                <span className="text-neutral-500 break-all">{lastEvent.origin}</span>
              ) : null}
            </div>

            <div>
              <p className="text-neutral-500 mb-0.5">Entity</p>
              <p className="text-sm text-neutral-200">
                {lastEvent.page.entityType ?? "—"} / {lastEvent.page.entityId ?? "—"}
              </p>
              {lastEvent.page.entityName ? (
                <p className="text-xs text-neutral-400">{lastEvent.page.entityName}</p>
              ) : null}
            </div>

            <div>
              <p className="text-neutral-500 mb-0.5">URL</p>
              <p className="text-xs text-neutral-300 break-all">{lastEvent.page.url}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onRefreshSnapshot}
                className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs"
              >
                Refresh snapshot
              </button>
            </div>

            <div>
              <p className="text-neutral-500 mb-1">Raw</p>
              <pre className="text-[11px] leading-snug whitespace-pre-wrap break-words text-neutral-300 bg-neutral-900/40 border border-neutral-800 rounded p-2">
                {ctxText}
              </pre>
            </div>
          </div>
        ) : (
          <p className="text-xs text-neutral-500">No CRM event received</p>
        )}
      </div>
    </div>
  );
}

