import { useCallback, useMemo, useState } from "react";
import { Copy, RefreshCw, Send } from "lucide-react";
import type { CrmBridgeResult, CrmDesktopCommand } from "../../../../shared/crm-bridge";
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

const DEFAULT_JSON_PAYLOAD = JSON.stringify(
  {
    riskLevel: "medium",
    summary: "AI analysis summary",
    nextAction: "Follow up call",
  },
  null,
  2,
);

export function CrmEventPanel({
  className,
  onRefreshSnapshot,
}: CrmEventPanelProps): React.JSX.Element {
  const { lastEvent, error, refresh } = useCrmBridgeEvents();
  const [sending, setSending] = useState(false);
  const [actionKey, setActionKey] = useState("lead.openAiForm");
  const [selector, setSelector] = useState('[data-ai-action="lead.openAiForm"]');
  const [jsonSchema, setJsonSchema] = useState("lead.ai_analysis");
  const [jsonPayload, setJsonPayload] = useState(DEFAULT_JSON_PAYLOAD);
  const [targetUrl, setTargetUrl] = useState("https://crm.company.com/leads/1001");
  const [manualHandoffId, setManualHandoffId] = useState("");
  const [commandResult, setCommandResult] = useState<CrmBridgeResult | null>(null);

  const ctxText = useMemo(() => {
    if (!lastEvent) return "";
    return jsonStringifySafe(lastEvent);
  }, [lastEvent]);

  const openFormPayload = useMemo(
    () =>
      jsonStringifySafe({
        tool: "crm.open_form_with_json",
        url: targetUrl,
        actionKey,
        schema: jsonSchema,
        entityType: lastEvent?.page.entityType,
        entityId: lastEvent?.page.entityId,
        data: (() => {
          try {
            return JSON.parse(jsonPayload) as Record<string, unknown>;
          } catch {
            return {};
          }
        })(),
      }),
    [actionKey, jsonPayload, jsonSchema, lastEvent, targetUrl],
  );

  const runCommand = useCallback(
    async (command: CrmDesktopCommand) => {
      setSending(true);
      try {
        const result = await window.aiosBrowser.sendCrmCommand(command);
        setCommandResult(result);
        if (command.type === "desktop.crm.pushJson") {
          const handoffId = command.payload?.handoffId;
          if (typeof handoffId === "string") {
            setManualHandoffId(handoffId);
          }
        }
      } finally {
        setSending(false);
      }
    },
    [],
  );

  const copyContext = useCallback(async () => {
    if (!ctxText) return;
    await navigator.clipboard.writeText(ctxText);
  }, [ctxText]);

  const sendToastCommand = useCallback(async () => {
    if (!lastEvent) return;
    await runCommand({
      commandId: `cmd_${Date.now()}`,
      type: "desktop.crm.showToast",
      payload: { message: `Desktop received ${lastEvent.type}` },
      createdAt: new Date().toISOString(),
    });
  }, [lastEvent, runCommand]);

  const sendClickCommand = useCallback(async () => {
    await runCommand({
      commandId: `cmd_click_${Date.now()}`,
      type: "desktop.crm.clickButton",
      target: {
        actionKey,
        selector,
        entityId: lastEvent?.page.entityId,
      },
      payload: {},
      expectAck: true,
      timeoutMs: 8000,
      createdAt: new Date().toISOString(),
    });
  }, [actionKey, lastEvent, runCommand, selector]);

  const sendPushJsonCommand = useCallback(async () => {
    const handoffId = `manual_${Date.now()}`;
    await runCommand({
      commandId: `cmd_json_${Date.now()}`,
      type: "desktop.crm.pushJson",
      payload: {
        handoffId,
        schema: jsonSchema,
        entityType: lastEvent?.page.entityType,
        entityId: lastEvent?.page.entityId,
        data: JSON.parse(jsonPayload) as Record<string, unknown>,
      },
      expectAck: true,
      timeoutMs: 8000,
      createdAt: new Date().toISOString(),
    });
  }, [jsonPayload, jsonSchema, lastEvent, runCommand]);

  const sendRunActionCommand = useCallback(async () => {
    await runCommand({
      commandId: `cmd_action_${Date.now()}`,
      type: "desktop.crm.runAction",
      target: {
        actionKey,
        entityId: lastEvent?.page.entityId,
      },
      payload: {
        handoffId: manualHandoffId || undefined,
      },
      expectAck: true,
      timeoutMs: 12000,
      createdAt: new Date().toISOString(),
    });
  }, [actionKey, lastEvent, manualHandoffId, runCommand]);

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

        <div className="space-y-2 text-xs border border-neutral-800 rounded p-2">
          <p className="text-neutral-400 font-medium">CRM 调试</p>
          <label className="block space-y-1">
            <span className="text-neutral-500">actionKey</span>
            <input
              value={actionKey}
              onChange={(e) => setActionKey(e.target.value)}
              className="w-full rounded bg-neutral-900 border border-neutral-700 px-2 py-1 text-neutral-200"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-neutral-500">selector</span>
            <input
              value={selector}
              onChange={(e) => setSelector(e.target.value)}
              className="w-full rounded bg-neutral-900 border border-neutral-700 px-2 py-1 text-neutral-200"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-neutral-500">jsonSchema</span>
            <input
              value={jsonSchema}
              onChange={(e) => setJsonSchema(e.target.value)}
              className="w-full rounded bg-neutral-900 border border-neutral-700 px-2 py-1 text-neutral-200"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-neutral-500">targetUrl</span>
            <input
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="w-full rounded bg-neutral-900 border border-neutral-700 px-2 py-1 text-neutral-200"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-neutral-500">jsonPayload</span>
            <textarea
              value={jsonPayload}
              onChange={(e) => setJsonPayload(e.target.value)}
              rows={4}
              className="w-full rounded bg-neutral-900 border border-neutral-700 px-2 py-1 text-neutral-200 font-mono text-[11px]"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={sending}
              onClick={() => void sendClickCommand()}
              className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
            >
              测试点击按钮
            </button>
            <button
              type="button"
              disabled={sending}
              onClick={() => void sendPushJsonCommand()}
              className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
            >
              测试推送 JSON
            </button>
            <button
              type="button"
              disabled={sending}
              onClick={() => void sendRunActionCommand()}
              className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
            >
              测试运行动作
            </button>
          </div>
          <div>
            <p className="text-neutral-500 mb-1">测试跳转并打开 Form（复制给 Hermes）</p>
            <pre className="text-[11px] whitespace-pre-wrap break-words text-neutral-300 bg-neutral-900/40 border border-neutral-800 rounded p-2">
              {openFormPayload}
            </pre>
          </div>
          {commandResult ? (
            <div>
              <p className="text-neutral-500 mb-1">Command result</p>
              <pre className="text-[11px] whitespace-pre-wrap break-words text-neutral-300 bg-neutral-900/40 border border-neutral-800 rounded p-2">
                {jsonStringifySafe(commandResult)}
              </pre>
            </div>
          ) : null}
        </div>

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
