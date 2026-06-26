import { useTranslation } from "react-i18next";
import type { HermesExpert } from "../../../types/hermes-experts";

type Props = {
  expert: HermesExpert;
};

export function ExpertCapabilityList({ expert }: Props) {
  const { t } = useTranslation();
  return (
    <section className="hermes-expert-capabilities">
      <h3>{t("workspaces.hermes.experts.detail.capabilities")}</h3>
      {expert.capabilities.skills.length > 0 ? (
        <div>
          <h4>{t("workspaces.hermes.experts.detail.skills")}</h4>
          <ul>
            {expert.capabilities.skills.map((s) => (
              <li key={s.skillId}>
                {s.name} v{s.version}
                {s.required ? " *" : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {expert.capabilities.mcpServers.length > 0 ? (
        <div>
          <h4>{t("workspaces.hermes.experts.detail.mcp")}</h4>
          <ul>
            {expert.capabilities.mcpServers.map((m) => (
              <li key={m.serverId}>{m.name}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {expert.policy.allowedTools.length > 0 ? (
        <div>
          <h4>{t("workspaces.hermes.experts.detail.tools")}</h4>
          <p className="hermes-muted">{expert.policy.allowedTools.join(", ")}</p>
        </div>
      ) : null}
    </section>
  );
}
