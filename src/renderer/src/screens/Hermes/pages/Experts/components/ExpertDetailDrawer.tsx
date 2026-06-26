import { useTranslation } from "react-i18next";
import type { HermesExpert } from "../../../types/hermes-experts";
import { ExpertCapabilityList } from "./ExpertCapabilityList";
import { ExpertStarterPrompts } from "./ExpertStarterPrompts";
import { useSummonExpert } from "../hooks/useSummonExpert";

type Props = {
  expert: HermesExpert | null;
  open: boolean;
  onClose: () => void;
  onInstall: (expert: HermesExpert) => void;
  onSummon: (expert: HermesExpert) => void;
};

export function ExpertDetailDrawer({ expert, open, onClose, onInstall, onSummon }: Props) {
  const { t } = useTranslation();
  const { summonExpert } = useSummonExpert();

  if (!open || !expert) return null;

  const handleStarterPrompt = (prompt: string) => {
    void summonExpert(expert, prompt).then(() => onClose());
  };

  return (
    <div className="hermes-drawer-backdrop" role="presentation" onClick={onClose}>
      <aside
        className="hermes-drawer hermes-expert-drawer"
        role="dialog"
        aria-label={expert.displayName}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="hermes-drawer__header">
          <h2>{expert.displayName}</h2>
          <button type="button" className="hermes-icon-button" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="hermes-drawer__body">
          <p>{expert.description}</p>
          <section>
            <h3>{t("workspaces.hermes.experts.detail.role")}</h3>
            <p>{expert.identity.roleName}</p>
          </section>
          <ExpertCapabilityList expert={expert} />
          <section>
            <h3>{t("workspaces.hermes.experts.detail.memory")}</h3>
            <p>{expert.memory.mode}</p>
          </section>
          <ExpertStarterPrompts prompts={expert.starterPrompts} onSelect={handleStarterPrompt} />
        </div>
        <footer className="hermes-drawer__footer">
          <button type="button" className="hermes-btn-ghost" onClick={() => onInstall(expert)}>
            {t("workspaces.hermes.experts.install")}
          </button>
          <button type="button" className="hermes-btn-primary" onClick={() => onSummon(expert)}>
            {t("workspaces.hermes.experts.summon")}
          </button>
        </footer>
      </aside>
    </div>
  );
}
