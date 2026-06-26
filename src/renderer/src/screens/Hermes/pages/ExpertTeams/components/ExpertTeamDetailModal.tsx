import { useTranslation } from "react-i18next";
import type { HermesExpertTeam } from "../../../types/hermes-expert-teams";
import { ExpertTeamMemberList } from "./ExpertTeamMemberList";
import { ExpertStarterPrompts } from "../../Experts/components/ExpertStarterPrompts";

type Props = {
  team: HermesExpertTeam | null;
  open: boolean;
  onClose: () => void;
  onInstall: (team: HermesExpertTeam) => void;
  onSummon: (team: HermesExpertTeam) => void;
};

export function ExpertTeamDetailModal({ team, open, onClose, onInstall, onSummon }: Props) {
  const { t } = useTranslation();
  if (!open || !team) return null;

  return (
    <div className="hermes-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="hermes-modal hermes-team-modal"
        role="dialog"
        aria-label={team.displayName}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="hermes-modal__header">
          <h2>{team.displayName}</h2>
          <button type="button" className="hermes-icon-button" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="hermes-modal__body">
          <p>{team.description}</p>
          <section>
            <h3>{t("workspaces.hermes.expertTeams.leader")}</h3>
            <p>{team.leader.roleName}</p>
          </section>
          <ExpertTeamMemberList members={team.members} />
          <section>
            <h3>{t("workspaces.hermes.expertTeams.orchestration")}</h3>
            <p>
              {team.orchestration.mode} / {team.orchestration.mergeStrategy}
            </p>
          </section>
          <ExpertStarterPrompts prompts={team.starterPrompts} onSelect={() => undefined} />
        </div>
        <footer className="hermes-modal__footer">
          <button type="button" className="hermes-btn-ghost" onClick={() => onInstall(team)}>
            {t("workspaces.hermes.experts.install")}
          </button>
          <button type="button" className="hermes-btn-primary" onClick={() => onSummon(team)}>
            {t("workspaces.hermes.expertTeams.summonTeam")}
          </button>
        </footer>
      </div>
    </div>
  );
}
