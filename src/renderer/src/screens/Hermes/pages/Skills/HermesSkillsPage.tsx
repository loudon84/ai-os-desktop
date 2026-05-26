import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHermesDefault } from "../../context/HermesDefaultContext";

export default function HermesSkillsPage() {
  const { t } = useTranslation();
  const { skills } = useHermesDefault();
  const [preview, setPreview] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedName, setSelectedName] = useState<string | null>(null);

  const loadPreview = useCallback(
    async (name: string, path?: string) => {
      setSelectedName(name);
      const installed = skills.installed.find((s) => s.name === name);
      const skillPath = path ?? installed?.path;
      if (!skillPath) {
        setPreview(null);
        return;
      }
      setPreviewLoading(true);
      try {
        const content = await skills.read(skillPath);
        setPreview(content || null);
      } catch {
        setPreview(null);
      } finally {
        setPreviewLoading(false);
      }
    },
    [skills],
  );

  return (
    <div className="hermes-page hermes-skills-page">
      <header className="hermes-page__header">
        <h2>{t("workspaces.nav.skills")}</h2>
        <button type="button" className="hermes-btn-ghost" onClick={() => void skills.refresh()}>
          {t("workspaces.hermes.common.refresh")}
        </button>
      </header>
      {skills.error ? <p className="hermes-page__error">{skills.error}</p> : null}
      <div className="hermes-skills-layout">
        <div className="hermes-skills-layout__lists">
          <section>
            <h3>{t("workspaces.hermes.skills.installed")}</h3>
            <ul className="hermes-list">
              {skills.installed.map((s) => (
                <li key={s.name}>
                  <button
                    type="button"
                    className={`hermes-skills-list__item${selectedName === s.name ? " is-selected" : ""}`}
                    onClick={() => void loadPreview(s.name, s.path)}
                  >
                    <strong>{s.name}</strong> — {s.description}
                  </button>
                  <button
                    type="button"
                    className="hermes-btn-ghost"
                    onClick={() => void skills.uninstall(s.name).then(() => skills.refresh())}
                  >
                    Uninstall
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h3>{t("workspaces.hermes.skills.bundled")}</h3>
            <ul className="hermes-list">
              {skills.bundled.map((s) => (
                <li key={s.name}>
                  <button
                    type="button"
                    className={`hermes-skills-list__item${selectedName === s.name ? " is-selected" : ""}`}
                    onClick={() => void loadPreview(s.name)}
                  >
                    <strong>{s.name}</strong> — {s.description}
                  </button>
                  {!s.installed ? (
                    <button
                      type="button"
                      className="hermes-btn-primary"
                      onClick={() => void skills.install(s.name).then(() => skills.refresh())}
                    >
                      Install
                    </button>
                  ) : (
                    <span className="hermes-muted"> installed</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
        <aside className="hermes-skills-layout__preview">
          {previewLoading ? (
            <p className="hermes-muted">{t("workspaces.hermes.skills.previewLoading")}</p>
          ) : preview ? (
            <pre className="hermes-skill-preview">{preview}</pre>
          ) : selectedName ? (
            <p className="hermes-muted">{t("workspaces.hermes.skills.previewUnavailable")}</p>
          ) : (
            <p className="hermes-muted">{t("workspaces.hermes.skills.previewHint")}</p>
          )}
        </aside>
      </div>
    </div>
  );
}
