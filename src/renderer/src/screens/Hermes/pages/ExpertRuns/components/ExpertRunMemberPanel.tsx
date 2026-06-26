import { useTranslation } from "react-i18next";
import type { HermesExpertMemberRun } from "../../../../../../../shared/hermes-experts/hermes-experts-contract";

type Props = {
  memberRuns: HermesExpertMemberRun[];
};

export function ExpertRunMemberPanel({ memberRuns }: Props) {
  const { t } = useTranslation();
  return (
    <section>
      <h4>{t("workspaces.hermes.expertTeams.members")}</h4>
      <ul className="hermes-team-member-list">
        {memberRuns.map((m) => (
          <li key={`${m.memberProfileId}-${m.roleName}`}>
            <strong>{m.roleName}</strong>
            <span className={`hermes-badge hermes-badge--${m.status}`}>{m.status}</span>
            {m.summary ? <p>{m.summary}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
