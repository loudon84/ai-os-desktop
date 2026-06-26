import { UsersRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { HermesExpertTeam } from "../../../types/hermes-expert-teams";

type Props = {
  team: HermesExpertTeam;
  onView: (team: HermesExpertTeam) => void;
  onInstall: (team: HermesExpertTeam) => void;
  onSummon: (team: HermesExpertTeam) => void;
};

export function ExpertTeamCard({ team, onView, onInstall, onSummon }: Props) {
  const { t } = useTranslation();
  const memberCount = team.memberCount ?? team.members.length + 1;

  return (
    <article className="hermes-expert-card hermes-team-card">
      <div className="hermes-expert-card__header">
        <div className="hermes-expert-card__avatar" aria-hidden>
          {team.avatar ? <img src={team.avatar} alt="" /> : <UsersRound size={20} />}
        </div>
        <div className="hermes-expert-card__title">
          <h3>{team.displayName}</h3>
          <span className="hermes-expert-card__provider">
            {t("workspaces.hermes.expertTeams.memberCount", { count: memberCount })}
          </span>
        </div>
      </div>
      <p className="hermes-expert-card__desc">{team.description}</p>
      {(team.tags ?? []).length > 0 ? (
        <div className="hermes-expert-card__tags">
          {(team.tags ?? []).slice(0, 3).map((tag) => (
            <span key={tag} className="hermes-tag">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      <div className="hermes-expert-card__meta">
        <span className={`hermes-badge hermes-badge--${team.installStatus}`}>
          {t(`workspaces.hermes.expertTeams.status.${team.installStatus}`, {
            defaultValue: team.installStatus,
          })}
        </span>
      </div>
      <div className="hermes-expert-card__actions">
        <button type="button" className="hermes-btn-ghost" onClick={() => onView(team)}>
          {t("workspaces.hermes.experts.view")}
        </button>
        <button type="button" className="hermes-btn-ghost" onClick={() => onInstall(team)}>
          {t("workspaces.hermes.experts.install")}
        </button>
        <button type="button" className="hermes-btn-primary" onClick={() => onSummon(team)}>
          {t("workspaces.hermes.expertTeams.summonTeam")}
        </button>
      </div>
    </article>
  );
}
