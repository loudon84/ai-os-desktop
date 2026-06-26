import { UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { HermesExpert } from "../../../types/hermes-experts";

type Props = {
  expert: HermesExpert;
  onView: (expert: HermesExpert) => void;
  onInstall: (expert: HermesExpert) => void;
  onSummon: (expert: HermesExpert) => void;
};

function primaryAction(
  expert: HermesExpert,
  t: (key: string, opts?: { defaultValue?: string }) => string,
): { label: string; action: "install" | "summon" | "update" | "retry" | "disabled" } {
  switch (expert.installStatus) {
    case "not_installed":
      return { label: t("workspaces.hermes.experts.install"), action: "install" };
    case "installing":
      return { label: t("workspaces.hermes.experts.installing"), action: "disabled" };
    case "installed":
    case "update_available":
      return expert.installStatus === "update_available"
        ? { label: t("workspaces.hermes.experts.update"), action: "update" }
        : { label: t("workspaces.hermes.experts.summon"), action: "summon" };
    case "failed":
      return { label: t("workspaces.hermes.experts.retry"), action: "retry" };
    default:
      return { label: t("workspaces.hermes.experts.summon"), action: "summon" };
  }
}

export function ExpertCard({ expert, onView, onInstall, onSummon }: Props) {
  const { t } = useTranslation();
  const primary = primaryAction(expert, t);

  const handlePrimary = () => {
    if (primary.action === "install" || primary.action === "update" || primary.action === "retry") {
      onInstall(expert);
      return;
    }
    if (primary.action === "summon") {
      onSummon(expert);
    }
  };

  return (
    <article className="hermes-expert-card">
      <div className="hermes-expert-card__header">
        <div className="hermes-expert-card__avatar" aria-hidden>
          {expert.avatar ? (
            <img src={expert.avatar} alt="" />
          ) : (
            <UserRound size={20} />
          )}
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
        <span className={`hermes-badge hermes-badge--trust-${expert.trustStatus}`}>
          {t(`workspaces.hermes.experts.trust.${expert.trustStatus}`, {
            defaultValue: expert.trustStatus,
          })}
        </span>
        <span className={`hermes-badge hermes-badge--${expert.installStatus}`}>
          {t(`workspaces.hermes.experts.status.${expert.installStatus}`, {
            defaultValue: expert.installStatus,
          })}
        </span>
      </div>
      <div className="hermes-expert-card__actions">
        <button type="button" className="hermes-btn-ghost" onClick={() => onView(expert)}>
          {t("workspaces.hermes.experts.view")}
        </button>
        <button
          type="button"
          className="hermes-btn-primary"
          disabled={primary.action === "disabled"}
          onClick={handlePrimary}
        >
          {primary.label}
        </button>
      </div>
    </article>
  );
}
