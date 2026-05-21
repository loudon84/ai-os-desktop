import { useCallback, useEffect, useState } from "react";
import type { AuditEventRecord } from "../../../../../shared/profile-runtime/profile-runtime-contract";
import type { GatewayLogEntry } from "../../../../../shared/profile-runtime/profile-runtime-contract";
import { useI18n } from "../../../components/useI18n";

export interface ProfileLogViewerProps {
  profileId: string | null;
}

function formatAuditLine(e: AuditEventRecord): string {
  const scope = e.profile_id ? "" : "[global] ";
  return `${e.created_at} ${scope}${e.event_type}/${e.action} ${e.status}`;
}

export function ProfileLogViewer({ profileId }: ProfileLogViewerProps): React.JSX.Element {
  const { t } = useI18n();
  const [gatewayLogs, setGatewayLogs] = useState<GatewayLogEntry[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEventRecord[]>([]);
  const [roleSyncEvents, setRoleSyncEvents] = useState<AuditEventRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const roleLibraryAudits = await window.profileRuntime.listAuditEvents({
        eventType: "profile_role",
        limit: 30,
      });
      const syncOnly = roleLibraryAudits.filter((e) => e.action === "sync_role_library");
      setRoleSyncEvents(syncOnly);

      if (!profileId) {
        setGatewayLogs([]);
        setAuditEvents([]);
        return;
      }

      const [logs, audits] = await Promise.all([
        window.profileRuntime.getGatewayLogs(profileId, { limit: 80 }),
        window.profileRuntime.listAuditEvents({
          profileId,
          limit: 40,
        }),
      ]);
      setGatewayLogs(logs);
      setAuditEvents(
        audits.filter(
          (e) =>
            e.event_type === "profile_role" ||
            e.event_type === "profile_runtime",
        ),
      );
    } catch {
      setGatewayLogs([]);
      setAuditEvents([]);
      setRoleSyncEvents([]);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          {t("runtimeSettings.multiProfilesLogsTitle")}
        </h3>
        <button
          type="button"
          className="text-xs text-zinc-500 hover:text-zinc-300"
          disabled={loading}
          onClick={() => void loadLogs()}
        >
          {t("runtimeSettings.multiProfilesRefreshLogs")}
        </button>
      </div>

      <p className="mb-1 text-[10px] uppercase text-zinc-600">
        {t("runtimeSettings.multiProfilesRoleSyncLogs")}
      </p>
      <pre className="mb-3 max-h-24 overflow-auto rounded bg-zinc-950 p-2 font-mono text-[10px] text-zinc-400">
        {roleSyncEvents.length === 0
          ? t("runtimeSettings.multiProfilesLogsEmpty")
          : roleSyncEvents.map(formatAuditLine).join("\n")}
      </pre>

      {!profileId ? (
        <p className="text-xs text-zinc-500">{t("runtimeSettings.multiProfilesSelectProfile")}</p>
      ) : (
        <>
          <p className="mb-1 text-[10px] uppercase text-zinc-600">
            {t("runtimeSettings.multiProfilesGatewayLogs")}
          </p>
          <pre className="mb-3 max-h-32 overflow-auto rounded bg-zinc-950 p-2 font-mono text-[10px] text-zinc-400">
            {gatewayLogs.length === 0
              ? t("runtimeSettings.multiProfilesLogsEmpty")
              : gatewayLogs.map((l) => `[${l.level}] ${l.message}`).join("\n")}
          </pre>
          <p className="mb-1 text-[10px] uppercase text-zinc-600">
            {t("runtimeSettings.multiProfilesAuditLogs")}
          </p>
          <pre className="max-h-32 overflow-auto rounded bg-zinc-950 p-2 font-mono text-[10px] text-zinc-400">
            {auditEvents.length === 0
              ? t("runtimeSettings.multiProfilesLogsEmpty")
              : auditEvents.map(formatAuditLine).join("\n")}
          </pre>
        </>
      )}
    </section>
  );
}
