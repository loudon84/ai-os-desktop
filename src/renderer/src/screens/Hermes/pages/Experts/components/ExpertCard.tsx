import { UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { HermesExpert } from "../../../types/hermes-experts";

type Props = {
  expert: HermesExpert;
  onView: (expert: HermesExpert) => void;
  onSummon: (expert: HermesExpert) => void;
};

function canSummon(expert: HermesExpert): boolean {
  if (expert.executionMode === "remote_mcp" || expert.profile.profileId === "remote") {
    if (expert.catalogStatus && expert.catalogStatus !== "ready") return false;
    if (expert.callableSkillCount === 0) return false;
    return true;
  }
  return expert.installStatus === "installed";
}

export function ExpertCard({ expert, onView, onSummon }: Props) {
  const { t } = useTranslation();
  const summonEnabled = canSummon(expert);
  const isRemote = expert.executionMode === "remote_mcp" || expert.profile.profileId === "remote";

  return (
    <article className="hermes-expert-card">
      <div className="hermes-expert-card__header">
        <div className="hermes-expert-card__avatar" aria-hidden>
          {expert.avatar ? <img src={expert.avatar} alt="" /> : <UserRound size={20} />}
        </div>
        <div className="hermes-expert-card__title">
          <h3>{expert.displayName}</h3>
          <span className="hermes-expert-card__provider">{expert.provider}</span>
        </div>
      </div>
      <p className="hermes-expert-card__desc">{expert.description}</p>
      <div className="hermes-expert-card__tags">
        {expert.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="hermes-tag">
            {tag}
          </span>
        ))}
      </div>
      <div className="hermes-expert-card__meta">
        {expert.catalogStatus ? (
          <span className="hermes-badge">{expert.catalogStatus}</span>
        ) : null}
        {expert.riskLevel ? <span className="hermes-badge">{expert.riskLevel}</span> : null}
        {isRemote ? (
          <span className="hermes-badge hermes-badge--trust-trusted">
            {t("workspaces.hermes.experts.remoteMcp", { defaultValue: "Remote MCP" })}
          </span>
        ) : (
          <span className={`hermes-badge hermes-badge--trust-${expert.trustStatus}`}>
            {t(`workspaces.hermes.experts.trust.${expert.trustStatus}`, {
              defaultValue: expert.trustStatus,
            })}
          </span>
        )}
        {expert.callableSkillCount != null ? (
          <span className="hermes-badge">
            {t("workspaces.hermes.experts.callableSkills", {
              defaultValue: "{{count}} callable",
              count: expert.callableSkillCount,
            })}
          </span>
        ) : null}
      </div>
      <div className="hermes-expert-card__actions">
        <button type="button" className="hermes-btn-ghost" onClick={() => onView(expert)}>
          {t("workspaces.hermes.experts.view")}
        </button>
        <button
          type="button"
          className="hermes-btn-primary"
          disabled={!summonEnabled}
          title={
            !summonEnabled
              ? t("workspaces.hermes.experts.summonDisabled", {
                  defaultValue: "Not ready or no callable skills",
                })
              : undefined
          }
          onClick={() => onSummon(expert)}
        >
          {t("workspaces.hermes.experts.summon")}
        </button>
      </div>
    </article>
  );
}
