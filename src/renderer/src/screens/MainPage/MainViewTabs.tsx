import { useI18n } from "../../components/useI18n";
import type { ProfileEntrySummary } from "../../../../shared/profile-runtime/profile-runtime-contract";
import type { View } from "../../types/desktop-shell";
import { buildMainWorkspaceTabs } from "./main-page-tabs";

interface MainViewTabsProps {
  activeView: View;
  profileEntries: ProfileEntrySummary[];
  onNavigate: (view: View) => void;
}

export function MainViewTabs({
  activeView,
  profileEntries,
  onNavigate,
}: MainViewTabsProps): React.JSX.Element {
  const { t } = useI18n();
  const tabs = buildMainWorkspaceTabs(profileEntries);

  return (
    <nav className="MainViewTabs no-drag" aria-label="Workspace tabs">
      {tabs.map((tab) => {
        const label = tab.titleKey ? t(tab.titleKey) : (tab.title ?? tab.id);
        return (
          <button
            key={tab.id}
            type="button"
            className={`MainViewTabs__item ${activeView === tab.id ? "active" : ""}`}
            title={label}
            onClick={() => onNavigate(tab.id)}
          >
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
