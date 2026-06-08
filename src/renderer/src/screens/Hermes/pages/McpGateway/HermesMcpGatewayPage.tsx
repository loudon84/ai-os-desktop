import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { HERMES_DEFAULT_PROFILE } from "../../constants";
import { useMcpSkillGatewayRuntime } from "../../hooks/useMcpSkillGatewayRuntime";

function proxyBadgeClass(status: string): string {
  if (status === "running") return "hermes-badge hermes-badge--running";
  if (status === "failed") return "hermes-badge hermes-badge--error";
  if (status === "starting" || status === "stopping") {
    return "hermes-badge hermes-badge--starting";
  }
  return "hermes-badge hermes-badge--stopped";
}

function readyBadgeClass(ready: boolean): string {
  return ready ? "hermes-mcp-badge is-ok" : "hermes-mcp-badge is-error";
}

type InfoRowProps = {
  label: string;
  value: React.ReactNode;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="hermes-dl-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export default function HermesMcpGatewayPage() {
  const { t } = useTranslation();
  const {
    status,
    config,
    registrations,
    logs,
    loading,
    error,
    actionPending,
    refresh,
    saveConfig,
    startProxy,
    stopProxy,
    restartProxy,
    testProxy,
    testRemoteMcp,
    registerProfile,
    unregisterProfile,
  } = useMcpSkillGatewayRuntime();
  const [authState, setAuthState] = useState<Awaited<
    ReturnType<typeof window.desktopAuth.getState>
  > | null>(null);

  const loadAuth = useCallback(async () => {
    const state = await window.desktopAuth.getState();
    setAuthState(state);
  }, []);

  useEffect(() => {
    void loadAuth();
  }, [loadAuth]);

  const authBackendUrl = authState?.endpointConfig?.backendUrl ?? status?.backendBaseUrl ?? "";
  const memberVerified = Boolean(
    authState?.user?.currentOrgId && authState?.user?.portalOrgRole,
  );
  const defaultRegistration = registrations.find((row) => row.profile === HERMES_DEFAULT_PROFILE);
  const consistencyReady = useMemo(() => {
    if (!status?.loggedIn || !authBackendUrl) return false;
    if (status.backendBaseUrl !== authBackendUrl) return false;
    if (defaultRegistration && !defaultRegistration.ready) return false;
    return true;
  }, [authBackendUrl, defaultRegistration, status?.backendBaseUrl, status?.loggedIn]);

  const openManagementPage = useCallback(
    async (routeKey: "skills" | "mcp" | "instances") => {
      const state = authState ?? (await window.desktopAuth.getState());
      const home = state.endpointConfig?.aiosHomeUrl?.replace(/\/+$/, "");
      if (!home) return;
      const route = config?.managementRoutes?.[routeKey] ?? `/hermes/${routeKey}`;
      const path = route.startsWith("/") ? route : `/${route}`;
      const url = `${home}${path}`;
      await window.shellView.loadUrl("portal", url);
    },
    [authState, config?.managementRoutes],
  );

  const yesNo = (value: boolean) =>
    value ? t("workspaces.hermes.mcpGateway.yes") : t("workspaces.hermes.mcpGateway.no");

  return (
    <div className="hermes-page hermes-mcp-gateway-page">
      <header className="hermes-page__header">
        <div>
          <h2>{t("workspaces.nav.mcpGateway")}</h2>
          <p className="hermes-muted">{t("workspaces.hermes.mcpGateway.subtitle")}</p>
        </div>
        <button
          type="button"
          className="hermes-btn-ghost"
          onClick={() => void refresh()}
          disabled={loading}
        >
          {t("workspaces.hermes.common.refresh")}
        </button>
      </header>

      {loading ? <p className="hermes-muted">{t("workspaces.hermes.common.loading")}</p> : null}
      {error ? <p className="hermes-page__error">{error}</p> : null}

      <div
        className={`hermes-mcp-gateway-banner${consistencyReady ? " is-ready" : " is-mismatch"}`}
      >
        <span>
          {consistencyReady
            ? t("workspaces.hermes.mcpGateway.consistencyReady")
            : t("workspaces.hermes.mcpGateway.consistencyMismatch")}
        </span>
        <span className="hermes-muted">
          {status?.localProxyUrl ?? t("workspaces.hermes.mcpGateway.proxyNotRunning")}
        </span>
      </div>

      <div className="hermes-mcp-gateway-grid">
        <section className="hermes-mcp-gateway-section">
          <h3>{t("workspaces.hermes.mcpGateway.loginSection")}</h3>
          <InfoRow
            label={t("workspaces.hermes.mcpGateway.loginStatus")}
            value={
              status?.loggedIn
                ? t("workspaces.hermes.mcpGateway.loggedIn")
                : t("workspaces.hermes.mcpGateway.notLoggedIn")
            }
          />
          <InfoRow
            label={t("workspaces.hermes.mcpGateway.user")}
            value={status?.userDisplayName ?? authState?.user?.username ?? "—"}
          />
          <InfoRow
            label={t("workspaces.hermes.mcpGateway.backendUrl")}
            value={<code>{authBackendUrl || "—"}</code>}
          />
          <InfoRow
            label={t("workspaces.hermes.mcpGateway.memberVerified")}
            value={
              memberVerified
                ? t("workspaces.hermes.mcpGateway.memberVerifiedYes")
                : t("workspaces.hermes.mcpGateway.memberVerifiedNo")
            }
          />
          <InfoRow
            label={t("workspaces.hermes.mcpGateway.portalOrgRole")}
            value={authState?.user?.portalOrgRole ?? "—"}
          />
        </section>

        <section className="hermes-mcp-gateway-section">
          <h3>{t("workspaces.hermes.mcpGateway.proxySection")}</h3>
          <InfoRow
            label={t("workspaces.hermes.mcpGateway.proxyStatus")}
            value={
              <span className={proxyBadgeClass(status?.proxyStatus ?? "stopped")}>
                {status?.proxyStatus ?? "stopped"}
              </span>
            }
          />
          <InfoRow
            label={t("workspaces.hermes.mcpGateway.localUrl")}
            value={<code>{status?.localProxyUrl ?? "—"}</code>}
          />
          <InfoRow
            label={t("workspaces.hermes.mcpGateway.remoteMcpUrl")}
            value={<code>{status?.remoteMcpUrl ?? "—"}</code>}
          />
          <div className="hermes-mcp-gateway-section__actions">
            <button
              type="button"
              className="hermes-btn-primary"
              disabled={actionPending}
              onClick={() => void startProxy()}
            >
              {t("workspaces.hermes.mcpGateway.startProxy")}
            </button>
            <button
              type="button"
              className="hermes-btn-ghost"
              disabled={actionPending}
              onClick={() => void stopProxy()}
            >
              {t("workspaces.hermes.mcpGateway.stopProxy")}
            </button>
            <button
              type="button"
              className="hermes-btn-ghost"
              disabled={actionPending}
              onClick={() => void restartProxy()}
            >
              {t("workspaces.hermes.mcpGateway.restartProxy")}
            </button>
            <button
              type="button"
              className="hermes-btn-ghost"
              disabled={actionPending}
              onClick={() => void testProxy()}
            >
              {t("workspaces.hermes.mcpGateway.testProxy")}
            </button>
            <button
              type="button"
              className="hermes-btn-ghost"
              disabled={actionPending}
              onClick={() => void testRemoteMcp()}
            >
              {t("workspaces.hermes.mcpGateway.testRemote")}
            </button>
          </div>
        </section>
      </div>

      <section className="hermes-mcp-gateway-section">
        <div className="hermes-mcp-gateway-section__head">
          <h3>{t("workspaces.hermes.mcpGateway.registrationSection")}</h3>
          <button
            type="button"
            className="hermes-btn-primary"
            disabled={actionPending}
            onClick={() => void registerProfile(HERMES_DEFAULT_PROFILE)}
          >
            {t("workspaces.hermes.mcpGateway.registerDefault")}
          </button>
        </div>
        {!consistencyReady ? (
          <p className="hermes-page__error">{t("workspaces.hermes.mcpGateway.mismatchHint")}</p>
        ) : null}
        <ul className="hermes-mcp-gateway-reg-list">
          {registrations.map((row) => (
            <li key={row.profile} className="hermes-mcp-gateway-reg-card">
              <div className="hermes-mcp-gateway-reg-card__head">
                <strong>{row.profile}</strong>
                <span className={readyBadgeClass(row.ready)}>
                  {row.ready
                    ? t("workspaces.hermes.mcpGateway.ready")
                    : t("workspaces.hermes.mcpGateway.notReady")}
                </span>
              </div>
              <InfoRow
                label={t("workspaces.hermes.mcpGateway.registered")}
                value={yesNo(row.registered)}
              />
              <InfoRow
                label={t("workspaces.hermes.mcpGateway.enabled")}
                value={yesNo(row.enabled)}
              />
              <InfoRow label="URL" value={<code>{row.url ?? "—"}</code>} />
              <InfoRow
                label={t("workspaces.hermes.mcpGateway.expectedUrl")}
                value={<code>{row.expectedUrl}</code>}
              />
              <InfoRow
                label={t("workspaces.hermes.mcpGateway.urlMatched")}
                value={yesNo(row.urlMatched)}
              />
              <InfoRow
                label={t("workspaces.hermes.mcpGateway.backendMatched")}
                value={yesNo(row.backendMatched)}
              />
              <p className="hermes-muted hermes-mcp-gateway-reg-card__path">
                <code>{row.configPath}</code>
              </p>
              <div className="hermes-mcp-gateway-reg-card__actions">
                <button
                  type="button"
                  className="hermes-btn-ghost"
                  disabled={actionPending}
                  onClick={() => void registerProfile(row.profile)}
                >
                  {t("workspaces.hermes.mcpGateway.register")}
                </button>
                <button
                  type="button"
                  className="hermes-btn-ghost"
                  disabled={actionPending}
                  onClick={() => void unregisterProfile(row.profile)}
                >
                  {t("workspaces.hermes.mcpGateway.unregister")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="hermes-mcp-gateway-grid">
        <section className="hermes-mcp-gateway-section">
          <h3>{t("workspaces.hermes.mcpGateway.consistencySection")}</h3>
          <InfoRow
            label={t("workspaces.hermes.mcpGateway.consistencyAuthBackend")}
            value={<code>{authBackendUrl || "—"}</code>}
          />
          <InfoRow
            label={t("workspaces.hermes.mcpGateway.consistencyProxyBackend")}
            value={<code>{status?.backendBaseUrl || "—"}</code>}
          />
          <InfoRow
            label={t("workspaces.hermes.mcpGateway.consistencyRemoteMcp")}
            value={<code>{status?.remoteMcpUrl || "—"}</code>}
          />
          <InfoRow
            label={t("workspaces.hermes.mcpGateway.consistencyHermesUrl")}
            value={<code>{defaultRegistration?.url ?? status?.localProxyUrl ?? "—"}</code>}
          />
        </section>

        <section className="hermes-mcp-gateway-section">
          <h3>{t("workspaces.hermes.mcpGateway.policySection")}</h3>
          <label className="hermes-mcp-switch">
            <input
              type="checkbox"
              checked={config?.autoStartProxy ?? true}
              onChange={(e) => void saveConfig({ autoStartProxy: e.target.checked })}
            />
            {t("workspaces.hermes.mcpGateway.autoStartProxy")}
          </label>
          <label className="hermes-mcp-switch">
            <input
              type="checkbox"
              checked={config?.autoRegisterToHermes ?? true}
              onChange={(e) => void saveConfig({ autoRegisterToHermes: e.target.checked })}
            />
            {t("workspaces.hermes.mcpGateway.autoRegister")}
          </label>
          <label className="hermes-mcp-switch">
            <input
              type="checkbox"
              checked={config?.autoRestartHermesGateway ?? false}
              onChange={(e) => void saveConfig({ autoRestartHermesGateway: e.target.checked })}
            />
            {t("workspaces.hermes.mcpGateway.autoRestartGateway")}
          </label>
        </section>
      </div>

      <section className="hermes-mcp-gateway-section">
        <h3>{t("workspaces.hermes.mcpGateway.embedSection")}</h3>
        <div className="hermes-mcp-gateway-section__actions">
          <button
            type="button"
            className="hermes-btn-ghost"
            onClick={() => void openManagementPage("skills")}
          >
            {t("workspaces.hermes.mcpGateway.openSkills")}
          </button>
          <button
            type="button"
            className="hermes-btn-ghost"
            onClick={() => void openManagementPage("mcp")}
          >
            {t("workspaces.hermes.mcpGateway.openMcp")}
          </button>
          <button
            type="button"
            className="hermes-btn-ghost"
            onClick={() => void openManagementPage("instances")}
          >
            {t("workspaces.hermes.mcpGateway.openInstances")}
          </button>
        </div>
      </section>

      <section className="hermes-mcp-gateway-section">
        <h3>{t("workspaces.hermes.mcpGateway.logsSection")}</h3>
        <pre className="hermes-panel-pre hermes-mcp-gateway-logs">
          {logs || t("workspaces.hermes.mcpGateway.noLogs")}
        </pre>
      </section>
    </div>
  );
}
