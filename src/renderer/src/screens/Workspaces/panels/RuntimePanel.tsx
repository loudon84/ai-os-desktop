import { useCallback, useEffect, useState } from "react";
import { useI18n } from "../../../components/useI18n";
import type { RuntimeStatusChangeEvent } from "../../../../../shared/profile-runtime/profile-runtime-contract";
import { workspacesApi } from "../api/workspacesApi";
import { useWorkspaces } from "../context/WorkspacesContext";

type AuditRow = {
  id: string;
  event_type: string;
  action: string;
  status: string;
  created_at: string;
};

const MAX_EVENTS = 20;

export function RuntimePanel(): React.JSX.Element {
  const { t } = useI18n();
  const { activeProfileId, runtime } = useWorkspaces();
  const [logs, setLogs] = useState("");
  const [auditRows, setAuditRows] = useState<AuditRow[]>([]);
  const [profileEvents, setProfileEvents] = useState<RuntimeStatusChangeEvent[]>([]);

  const loadLogs = useCallback(async () => {
    if (!activeProfileId) return;
    try {
      const entries = await workspacesApi.getGatewayLogs(activeProfileId, { limit: 80 });
      setLogs(entries.map((l) => `[${l.timestamp}] ${l.level}: ${l.message}`).join("\n"));
    } catch (err) {
      setLogs(String(err));
    }
  }, [activeProfileId]);

  const loadAudit = useCallback(async () => {
    if (!activeProfileId) {
      setAuditRows([]);
      return;
    }
    try {
      const rows = await workspacesApi.listAuditEvents(activeProfileId, 30);
      setAuditRows(
        rows.map((r) => ({
          id: r.id,
          event_type: r.event_type,
          action: r.action,
          status: r.status,
          created_at: r.created_at,
        })),
      );
    } catch {
      setAuditRows([]);
    }
  }, [activeProfileId]);

  useEffect(() => {
    void loadLogs();
    void loadAudit();
  }, [loadLogs, loadAudit, runtime.status]);

  useEffect(() => {
    if (!activeProfileId) {
      setProfileEvents([]);
      return;
    }
    const unsub = workspacesApi.onRuntimeStatusChanged((ev) => {
      if (ev.profileId !== activeProfileId) return;
      setProfileEvents((prev) => [ev, ...prev].slice(0, MAX_EVENTS));
    });
    return unsub;
  }, [activeProfileId]);

  if (!activeProfileId) {
    return <p className="p-3 text-xs text-gray-500">{t("workspaces.noProfile")}</p>;
  }

  const healthLabel =
    runtime.status !== "running"
      ? "—"
      : runtime.healthy
        ? t("workspaces.runtime.healthOk", { defaultValue: "OK" })
        : t("workspaces.runtime.healthUnhealthy", { defaultValue: "Unhealthy" });

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden p-3 text-xs text-gray-300">
      <dl className="shrink-0 space-y-1">
        <div className="flex justify-between">
          <dt className="text-gray-500">{t("workspaces.runtime.port", { defaultValue: "Port" })}</dt>
          <dd>{runtime.port ?? "—"}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">PID</dt>
          <dd>{runtime.pid ?? "—"}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">{t("workspaces.runtime.health", { defaultValue: "Health" })}</dt>
          <dd className={runtime.status === "running" && !runtime.healthy ? "text-amber-400" : ""}>
            {healthLabel}
          </dd>
        </div>
        {runtime.lastError ? (
          <p className="text-red-400">{runtime.lastError}</p>
        ) : null}
      </dl>
      <div className="mt-3 flex shrink-0 flex-wrap gap-2">
        <button
          type="button"
          className="rounded bg-emerald-700 px-2 py-1 text-white hover:bg-emerald-600 disabled:opacity-50"
          disabled={runtime.actionLoading}
          onClick={() => void runtime.start()}
        >
          {t("workspaces.runtime.start", { defaultValue: "Start" })}
        </button>
        <button
          type="button"
          className="rounded bg-gray-700 px-2 py-1 hover:bg-gray-600 disabled:opacity-50"
          disabled={runtime.actionLoading}
          onClick={() => void runtime.stop()}
        >
          {t("workspaces.runtime.stop", { defaultValue: "Stop" })}
        </button>
        <button
          type="button"
          className="rounded bg-gray-700 px-2 py-1 hover:bg-gray-600 disabled:opacity-50"
          disabled={runtime.actionLoading}
          onClick={() => void runtime.restart()}
        >
          {t("workspaces.runtime.restart", { defaultValue: "Restart" })}
        </button>
        <button
          type="button"
          className="rounded border border-gray-600 px-2 py-1 hover:bg-gray-800"
          onClick={() => {
            void loadLogs();
            void loadAudit();
          }}
        >
          {t("common.refresh", { defaultValue: "Refresh" })}
        </button>
      </div>

      <section className="mt-3 min-h-0 flex-1 overflow-y-auto">
        <h4 className="mb-1 font-semibold text-gray-400">
          {t("workspaces.runtime.events", { defaultValue: "Events" })}
        </h4>
        {profileEvents.length === 0 ? (
          <p className="mb-3 text-[10px] text-gray-600">
            {t("workspaces.runtime.noEvents", { defaultValue: "No recent status changes" })}
          </p>
        ) : (
          <ul className="mb-3 space-y-1 text-[10px]">
            {profileEvents.map((ev) => (
              <li key={`${ev.timestamp}-${ev.newStatus}`} className="text-gray-400">
                {new Date(ev.timestamp).toLocaleString()} · {ev.previousStatus} → {ev.newStatus}
                {ev.reason ? ` (${ev.reason})` : ""}
              </li>
            ))}
          </ul>
        )}

        <h4 className="mb-1 font-semibold text-gray-400">
          {t("workspaces.runtime.audit", { defaultValue: "Audit" })}
        </h4>
        {auditRows.length === 0 ? (
          <p className="mb-3 text-[10px] text-gray-600">
            {t("workspaces.runtime.noAudit", { defaultValue: "No audit events" })}
          </p>
        ) : (
          <ul className="mb-3 space-y-1 text-[10px]">
            {auditRows.map((row) => (
              <li key={row.id} className="text-gray-400">
                {new Date(row.created_at).toLocaleString()} · {row.action} · {row.status}
              </li>
            ))}
          </ul>
        )}

        <h4 className="mb-1 font-semibold text-gray-400">
          {t("workspaces.runtime.logs", { defaultValue: "Logs" })}
        </h4>
        <pre className="rounded bg-gray-950 p-2 text-[10px] text-gray-400 whitespace-pre-wrap">
          {logs || t("workspaces.runtime.noLogs", { defaultValue: "No logs" })}
        </pre>
      </section>
    </div>
  );
}
