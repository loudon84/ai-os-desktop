import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { McpGatewayInvokeTestResult } from "../../../../../../shared/mcp-skill-gateway-runtime/mcp-skill-gateway-runtime-contract";

type Props = {
  pending: boolean;
  result: McpGatewayInvokeTestResult | null;
  onRun: (toolName: string, instanceRef: string) => void;
};

export function McpGatewayInvokeTestSection({ pending, result, onRun }: Props) {
  const { t } = useTranslation();
  const [toolName, setToolName] = useState("hermes.skills.list");
  const [instanceRef, setInstanceRef] = useState("zhang-zhen");

  return (
    <section className="hermes-mcp-gateway-section">
      <h3>{t("workspaces.hermes.mcpGateway.invokeTestTitle")}</h3>
      <p className="hermes-muted">{t("workspaces.hermes.mcpGateway.invokeTestHint")}</p>
      <label className="hermes-mcp-gateway-field">
        <span>{t("workspaces.hermes.mcpGateway.invokeTestToolName")}</span>
        <input
          type="text"
          className="hermes-input"
          value={toolName}
          onChange={(e) => setToolName(e.target.value)}
        />
      </label>
      <label className="hermes-mcp-gateway-field">
        <span>{t("workspaces.hermes.mcpGateway.invokeTestInstanceRef")}</span>
        <input
          type="text"
          className="hermes-input"
          value={instanceRef}
          onChange={(e) => setInstanceRef(e.target.value)}
        />
      </label>
      <div className="hermes-mcp-gateway-section__actions">
        <button
          type="button"
          className="hermes-btn-primary"
          disabled={pending || !toolName.trim()}
          onClick={() =>
            void onRun(toolName.trim(), instanceRef.trim())
          }
        >
          {t("workspaces.hermes.mcpGateway.invokeTestRun")}
        </button>
      </div>
      {result ? (
        <>
          <p className={result.ok ? "hermes-muted" : "hermes-page__error"}>
            {result.ok
              ? t("workspaces.hermes.mcpGateway.invokeTestOk", { ms: result.durationMs })
              : t("workspaces.hermes.mcpGateway.invokeTestFailed", {
                  code: result.errorCode ?? "unknown",
                  message: result.errorMessage ?? "",
                })}
          </p>
          {result.result != null ? (
            <pre className="hermes-panel-pre hermes-mcp-gateway-logs">
              {JSON.stringify(result.result, null, 2)}
            </pre>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
