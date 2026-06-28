import { useCallback, useEffect, useState } from "react";
import { Activity, Cloud, RefreshCw, Users, UsersRound, Wifi, WifiOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useHermesDefault } from "../../context/HermesDefaultContext";
import { useHermesExpertsCatalog } from "../../context/HermesExpertsContext";
import type { ExpertHealthResponse } from "../../../../../../shared/hermes-experts/hermes-experts-contract";
import type { HermesExpertRun } from "../../types/hermes-expert-runs";

export default function HermesWorkbenchPage() {
  const { t } = useTranslation();
  const { setActiveNavItem } = useHermesDefault();
  const { experts, teams, catalogSource, refreshExperts, refreshTeams } = useHermesExpertsCatalog();
  const [runs, setRuns] = useState<HermesExpertRun[]>([]);
  const [syncRegistered, setSyncRegistered] = useState(false);
  const [gatewayHealth, setGatewayHealth] = useState<ExpertHealthResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    await Promise.all([refreshExperts(), refreshTeams()]);
    if (typeof window.hermesExperts !== "undefined") {
      const list = await window.hermesExperts.listExpertRuns({ limit: 5 });
      setRuns(list);
      const sync = await window.hermesExperts.getDesktopSyncStatus();
      if (sync.ok && sync.data) setSyncRegistered(sync.data.registered);
      const health = await window.hermesExperts.getExpertGatewayHealth();
      setGatewayHealth(health);
    }
    setLoading(false);
  }, [refreshExperts, refreshTeams]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="hermes-page hermes-workbench-page">
      <header className="hermes-page__header">
        <div>
          <h2>{t("workspaces.hermes.workbench.title", { defaultValue: "Workbench" })}</h2>
          <p className="hermes-page__subtitle">
            {t("workspaces.hermes.workbench.subtitle", {
              defaultValue: "Remote expert workspace — connect, summon, track runs",
            })}
          </p>
        </div>
        <button type="button" className="hermes-btn-ghost" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={14} className={loading ? "hermes-spin" : undefined} />
          {t("workspaces.hermes.common.refresh", { defaultValue: "Refresh" })}
        </button>
      </header>

      <section className="hermes-workbench-grid">
        <article className="hermes-workbench-card">
          <h3>{t("workspaces.hermes.workbench.connection", { defaultValue: "Connection" })}</h3>
          <div className="hermes-workbench-status">
            <span className="hermes-connection-pill">
              {catalogSource === "remote" ? <Wifi size={14} /> : <WifiOff size={14} />}
              {t(`workspaces.hermes.experts.source.${catalogSource}`, { defaultValue: catalogSource })}
            </span>
            <span className="hermes-connection-pill">
              <Cloud size={14} />
              {syncRegistered
                ? t("workspaces.hermes.experts.desktopSync.registered")
                : t("workspaces.hermes.experts.desktopSync.offline")}
            </span>
            <span className="hermes-connection-pill">
              <Activity size={14} />
              {gatewayHealth?.ok
                ? t("workspaces.hermes.experts.gatewayHealthOk", { defaultValue: "Expert Gateway healthy" })
                : t("workspaces.hermes.experts.gatewayHealthFail", { defaultValue: "Expert Gateway unreachable" })}
              {gatewayHealth?.gateway?.name ? ` — ${gatewayHealth.gateway.name}` : ""}
              {gatewayHealth?.gateway?.version ?? gatewayHealth?.version
                ? ` v${gatewayHealth.gateway?.version ?? gatewayHealth.version}`
                : ""}
              {gatewayHealth?.status ? ` (${gatewayHealth.status})` : ""}
            </span>
          </div>
          {gatewayHealth?.ok ? (
            <ul className="hermes-workbench-list hermes-muted">
              {gatewayHealth.publishedExperts != null ? (
                <li>
                  {t("workspaces.hermes.workbench.publishedExperts", { defaultValue: "Published experts" })}:{" "}
                  {gatewayHealth.publishedExperts}
                </li>
              ) : null}
              {gatewayHealth.publishedExpertTeams != null ? (
                <li>
                  {t("workspaces.hermes.workbench.publishedTeams", { defaultValue: "Published teams" })}:{" "}
                  {gatewayHealth.publishedExpertTeams}
                </li>
              ) : null}
              {gatewayHealth.publicSkills != null ? (
                <li>
                  {t("workspaces.hermes.workbench.publicSkills", { defaultValue: "Public skills" })}:{" "}
                  {gatewayHealth.publicSkills}
                </li>
              ) : null}
              {gatewayHealth.callableSkills != null ? (
                <li>
                  {t("workspaces.hermes.workbench.callableSkills", { defaultValue: "Callable skills" })}:{" "}
                  {gatewayHealth.callableSkills}
                </li>
              ) : null}
            </ul>
          ) : null}
          <div className="hermes-workbench-actions">
            <button type="button" className="hermes-btn-ghost" onClick={() => setActiveNavItem("mcpGateway")}>
              {t("workspaces.hermes.workbench.openMcp", { defaultValue: "MCP Gateway" })}
            </button>
          </div>
        </article>

        <article className="hermes-workbench-card">
          <h3>
            <Users size={16} /> {t("workspaces.nav.experts")}
          </h3>
          <ul className="hermes-workbench-list">
            {experts.slice(0, 4).map((e) => (
              <li key={e.expertId}>
                <button type="button" className="hermes-link-button" onClick={() => setActiveNavItem("experts")}>
                  {e.displayName}
                </button>
              </li>
            ))}
          </ul>
        </article>

        <article className="hermes-workbench-card">
          <h3>
            <UsersRound size={16} /> {t("workspaces.nav.expertTeams")}
          </h3>
          <ul className="hermes-workbench-list">
            {teams.slice(0, 3).map((team) => (
              <li key={team.teamId}>
                <button type="button" className="hermes-link-button" onClick={() => setActiveNavItem("expertTeams")}>
                  {team.displayName}
                </button>
              </li>
            ))}
          </ul>
        </article>

        <article className="hermes-workbench-card">
          <h3>
            <Activity size={16} /> {t("workspaces.hermes.workbench.recentRuns", { defaultValue: "Recent runs" })}
          </h3>
          <ul className="hermes-workbench-list">
            {runs.map((run) => (
              <li key={run.runId}>
                <button type="button" className="hermes-link-button" onClick={() => setActiveNavItem("expertRuns")}>
                  {run.title} — {run.status}
                </button>
              </li>
            ))}
            {runs.length === 0 ? (
              <li className="hermes-muted">{t("workspaces.hermes.expertRuns.empty", { defaultValue: "No runs yet" })}</li>
            ) : null}
          </ul>
        </article>
      </section>
    </div>
  );
}
