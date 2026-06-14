import { useTranslation } from "react-i18next";
import type { McpGatewayDiagnosticsResult } from "../../../../../../shared/mcp-skill-gateway-runtime/mcp-skill-gateway-runtime-contract";

type Props = {
  result: McpGatewayDiagnosticsResult | null;
  pending: boolean;
  onRun: () => void;
};

function stepIcon(ok: boolean): string {
  return ok ? "✓" : "✗";
}

export function McpGatewayDiagnosticsSection({ result, pending, onRun }: Props) {
  const { t } = useTranslation();

  return (
    <section className="hermes-mcp-gateway-section">
      <div className="hermes-mcp-gateway-section__head">
        <h3>{t("workspaces.hermes.mcpGateway.diagnosticsTitle")}</h3>
        <button
          type="button"
          className="hermes-btn-primary"
          disabled={pending}
          onClick={() => void onRun()}
        >
          {pending
            ? t("workspaces.hermes.mcpGateway.diagnosticsRunning")
            : t("workspaces.hermes.mcpGateway.diagnosticsRun")}
        </button>
      </div>
      <p className="hermes-muted">{t("workspaces.hermes.mcpGateway.diagnosticsHint")}</p>

      {result ? (
        <>
          <p className={result.ok ? "hermes-muted" : "hermes-page__error"}>
            {result.ok
              ? t("workspaces.hermes.mcpGateway.diagnosticsOk")
              : t("workspaces.hermes.mcpGateway.diagnosticsFailed")}
          </p>
          <ul className="hermes-mcp-gateway-diag-list">
            {result.steps.map((row) => (
              <li key={row.step} className="hermes-mcp-gateway-diag-row">
                <span className={row.ok ? "hermes-mcp-diag-ok" : "hermes-mcp-diag-fail"}>
                  {stepIcon(row.ok)}
                </span>
                <span>{row.label}</span>
                {row.detail ? <span className="hermes-muted">{row.detail}</span> : null}
                {row.error ? <code className="hermes-page__error">{row.error}</code> : null}
              </li>
            ))}
          </ul>
          {result.hermesRestartRequired ? (
            <p className="hermes-page__error">
              {t("workspaces.hermes.mcpGateway.hermesRestartRequired")}
            </p>
          ) : null}
          <pre className="hermes-panel-pre hermes-mcp-gateway-logs">
            {JSON.stringify(
              {
                auth: result.auth.ok ? "ok" : "failed",
                backend: result.backend.ok ? "ok" : "failed",
                localProxy: result.localProxy.ok ? "ok" : "failed",
                remoteMcp: result.remoteMcp.ok ? "connected" : "failed",
                toolCount: result.toolCount,
                defaultProfileRegistered: result.defaultProfileRegistered,
                hermesRestartRequired: result.hermesRestartRequired,
              },
              null,
              2,
            )}
          </pre>
        </>
      ) : null}
    </section>
  );
}
