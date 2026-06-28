import { useCallback, useEffect, useState } from "react";
import { Download, Eye, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { HermesExpertArtifact } from "../../../../../../shared/hermes-experts/hermes-experts-contract";

export default function HermesArtifactsPage() {
  const { t } = useTranslation();
  const [artifacts, setArtifacts] = useState<HermesExpertArtifact[]>([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (typeof window.hermesExperts === "undefined") return;
    setLoading(true);
    setError(null);
    try {
      const res = await window.hermesExperts.listLocalArtifacts(50);
      if (res.ok && res.data) {
        setArtifacts(res.data);
      } else {
        setError(res.error ?? "Failed to load artifacts");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handlePreview = async (artifact: HermesExpertArtifact) => {
    if (artifact.previewText) {
      setPreview(artifact.previewText);
      return;
    }
    if (typeof window.hermesExperts === "undefined") return;
    const res = await window.hermesExperts.previewRunArtifact(artifact.id);
    if (res.ok && res.data?.text) setPreview(res.data.text);
    else setPreview(res.error ?? "Preview unavailable");
  };

  const handleDownload = async (artifactId: string) => {
    if (typeof window.hermesExperts === "undefined") return;
    await window.hermesExperts.downloadRunArtifact(artifactId);
  };

  return (
    <div className="hermes-page hermes-artifacts-page">
      <header className="hermes-page__header">
        <div>
          <h2>{t("workspaces.hermes.artifacts.title", { defaultValue: "Artifacts" })}</h2>
          <p className="hermes-page__subtitle">
            {t("workspaces.hermes.artifacts.subtitle", {
              defaultValue: "Preview, download, and import local expert responses",
            })}
          </p>
        </div>
        <button type="button" className="hermes-btn-ghost" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={14} className={loading ? "hermes-spin" : undefined} />
          {t("workspaces.hermes.common.refresh", { defaultValue: "Refresh" })}
        </button>
      </header>

      {error ? <p className="hermes-page__error">{error}</p> : null}

      {loading && artifacts.length === 0 ? (
        <p className="hermes-page__loading">{t("workspaces.hermes.common.loading", { defaultValue: "Loading…" })}</p>
      ) : null}

      {!loading && artifacts.length === 0 ? (
        <p className="hermes-page__empty">{t("workspaces.hermes.artifacts.empty", { defaultValue: "No artifacts yet" })}</p>
      ) : null}

      <ul className="hermes-artifact-list">
        {artifacts.map((artifact) => (
          <li key={artifact.id} className="hermes-artifact-row">
            <div>
              <strong>{artifact.title}</strong>
              <span className="hermes-muted">{artifact.source}</span>
            </div>
            <div className="hermes-artifact-row__actions">
              <button type="button" className="hermes-btn-ghost" onClick={() => void handlePreview(artifact)}>
                <Eye size={14} /> {t("workspaces.hermes.artifacts.preview", { defaultValue: "Preview" })}
              </button>
              <button type="button" className="hermes-btn-ghost" onClick={() => void handleDownload(artifact.id)}>
                <Download size={14} /> {t("workspaces.hermes.artifacts.download", { defaultValue: "Download" })}
              </button>
            </div>
          </li>
        ))}
      </ul>

      {preview ? (
        <div className="hermes-artifact-preview">
          <pre>{preview}</pre>
        </div>
      ) : null}
    </div>
  );
}
