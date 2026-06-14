import { useTranslation } from "react-i18next";
import type { McpGatewayToolPreview } from "../../../../../../shared/mcp-skill-gateway-runtime/mcp-skill-gateway-runtime-contract";

type Props = {
  tools: McpGatewayToolPreview[];
  loading: boolean;
  lastSyncAt?: string | null;
  onRefresh: () => void;
};

export function McpGatewayToolsPreviewSection({ tools, loading, lastSyncAt, onRefresh }: Props) {
  const { t } = useTranslation();

  return (
    <section className="hermes-mcp-gateway-section">
      <div className="hermes-mcp-gateway-section__head">
        <h3>{t("workspaces.hermes.mcpGateway.toolsPreviewTitle")}</h3>
        <button
          type="button"
          className="hermes-btn-ghost"
          disabled={loading}
          onClick={() => void onRefresh()}
        >
          {t("workspaces.hermes.common.refresh")}
        </button>
      </div>
      {lastSyncAt ? (
        <p className="hermes-muted">
          {t("workspaces.hermes.mcpGateway.toolsPreviewLastSync")}:{" "}
          {new Date(lastSyncAt).toLocaleString()}
        </p>
      ) : null}
      {loading ? <p className="hermes-muted">{t("workspaces.hermes.common.loading")}</p> : null}
      {!loading && tools.length === 0 ? (
        <p className="hermes-muted">{t("workspaces.hermes.mcpGateway.toolsPreviewEmpty")}</p>
      ) : null}
      <ul className="hermes-mcp-gateway-tools-list">
        {tools.map((tool) => (
          <li key={tool.name} className="hermes-mcp-gateway-tool-card">
            <div className="hermes-mcp-gateway-tool-card__head">
              <strong>{tool.name}</strong>
              {tool.riskLevel ? (
                <span className="hermes-mcp-badge">{tool.riskLevel}</span>
              ) : null}
            </div>
            {tool.description ? <p className="hermes-muted">{tool.description}</p> : null}
            {tool.source ? (
              <p className="hermes-muted">
                {t("workspaces.hermes.mcpGateway.toolsPreviewSource")}: {tool.source}
              </p>
            ) : null}
            {tool.inputSchema ? (
              <pre className="hermes-panel-pre">{JSON.stringify(tool.inputSchema, null, 2)}</pre>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
