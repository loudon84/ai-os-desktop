import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ExpertCatalogKind } from "../../../../../../../shared/hermes-experts/hermes-experts-contract";
import { buildPageContextFromStorage } from "../../../utils/remote-expert-context";
import { useCatalogSkillCall, useCatalogSkills } from "../hooks/useCatalogSkillCall";

export type ExpertCatalogCallItem = {
  slug: string;
  kind: ExpertCatalogKind;
  displayName: string;
  callableSkillCount?: number;
  starterPrompt?: string;
};

type Props = {
  open: boolean;
  catalogItem: ExpertCatalogCallItem | null;
  onClose: () => void;
  onSuccess?: (runId: string) => void;
};

export function ExpertCatalogCallDrawer({ open, catalogItem, onClose, onSuccess }: Props) {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState("");
  const [includeContext, setIncludeContext] = useState(true);
  const [skillName, setSkillName] = useState("");

  const slug = catalogItem?.slug;
  const { skills, loading: skillsLoading, error: skillsError } = useCatalogSkills(slug, open);
  const { call, loading: callLoading, error: callError, setError } = useCatalogSkillCall();

  useEffect(() => {
    if (!open) {
      setPrompt("");
      setSkillName("");
      setError(null);
      return;
    }
    const first = skills.find((s) => s.callEnabled) ?? skills[0];
    if (first) setSkillName(first.skillName);
  }, [open, skills, setError]);

  if (!open || !catalogItem) return null;

  const selectedSkill = skills.find((s) => s.skillName === skillName);
  const titleKey =
    catalogItem.kind === "expert_team"
      ? "workspaces.hermes.expertTeams.callTitle"
      : "workspaces.hermes.experts.callTitle";

  const handleSubmit = async () => {
    const trimmed = prompt.trim() || catalogItem.starterPrompt || "";
    if (!trimmed || !skillName) return;

    const context = includeContext ? buildPageContextFromStorage() : undefined;
    const result = await call({
      slug: catalogItem.slug,
      catalogKind: catalogItem.kind,
      skillName,
      prompt: trimmed,
      context,
    });

    if (result.ok && result.runId) {
      onClose();
      onSuccess?.(result.runId);
    }
  };

  return (
    <div className="hermes-drawer-backdrop" role="presentation" onClick={onClose}>
      <aside
        className="hermes-drawer hermes-expert-call-drawer"
        role="dialog"
        aria-label={catalogItem.displayName}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="hermes-drawer__header">
          <h2>{t(titleKey, { defaultValue: "Call expert" })}</h2>
          <button type="button" className="hermes-icon-button" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="hermes-drawer__body">
          <p className="hermes-muted">{catalogItem.displayName}</p>
          <p className="hermes-muted">
            {t("workspaces.hermes.experts.expertSlug", { defaultValue: "Slug" })}:{" "}
            <code>{catalogItem.slug}</code>
          </p>
          <label className="hermes-field hermes-skill-select">
            <span>{t("workspaces.hermes.experts.skillName", { defaultValue: "Skill" })}</span>
            {skillsLoading ? (
              <p className="hermes-muted">{t("workspaces.hermes.common.loading", { defaultValue: "Loading…" })}</p>
            ) : (
              <select value={skillName} onChange={(e) => setSkillName(e.target.value)} disabled={skills.length === 0}>
                {skills.map((s) => (
                  <option key={s.skillName} value={s.skillName}>
                    {s.displayName}
                    {s.riskLevel ? ` (${s.riskLevel})` : ""}
                  </option>
                ))}
              </select>
            )}
            {selectedSkill?.description ? <p className="hermes-muted">{selectedSkill.description}</p> : null}
            {selectedSkill ? (
              <div className="hermes-skill-badges">
                {selectedSkill.riskLevel ? <span className="hermes-badge">{selectedSkill.riskLevel}</span> : null}
                {selectedSkill.approvalMode && selectedSkill.approvalMode !== "none" ? (
                  <span className="hermes-badge">{selectedSkill.approvalMode}</span>
                ) : null}
                {selectedSkill.outputFormats?.length ? (
                  <span className="hermes-badge">{selectedSkill.outputFormats.join(", ")}</span>
                ) : null}
              </div>
            ) : null}
            {skillsError ? <p className="hermes-page__error">{skillsError}</p> : null}
          </label>
          <label className="hermes-field">
            <span>{t("workspaces.hermes.experts.prompt", { defaultValue: "Prompt" })}</span>
            <textarea
              rows={5}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={catalogItem.starterPrompt}
            />
          </label>
          <label className="hermes-checkbox">
            <input
              type="checkbox"
              checked={includeContext}
              onChange={(e) => setIncludeContext(e.target.checked)}
            />
            {t("workspaces.hermes.experts.includeContext", {
              defaultValue: "Include page / screen context",
            })}
          </label>
          {callError ? <p className="hermes-page__error">{callError}</p> : null}
        </div>
        <footer className="hermes-drawer__footer">
          <button type="button" className="hermes-btn-ghost" onClick={onClose}>
            {t("workspaces.hermes.experts.cancel")}
          </button>
          <button
            type="button"
            className="hermes-btn-primary"
            disabled={callLoading || skillsLoading || !skillName || !prompt.trim()}
            onClick={() => void handleSubmit()}
          >
            {callLoading
              ? t("workspaces.hermes.experts.summoning", { defaultValue: "Calling…" })
              : t("workspaces.hermes.experts.summon")}
          </button>
        </footer>
      </aside>
    </div>
  );
}
