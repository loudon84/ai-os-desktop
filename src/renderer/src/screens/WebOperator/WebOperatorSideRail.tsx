import { Camera, Monitor, PanelRightOpen, ScanSearch, ScrollText } from "lucide-react";
import { useI18n } from "../../components/useI18n";
import {
  SECONDARY_NAV_BY_WORKSPACE,
  SECONDARY_PANEL_LABEL_KEYS,
} from "../../../../shared/workspace/workspace-secondary-nav";
import type { WorkspaceSecondaryPanel } from "../../../../shared/workspace/workspace-contract";

const PANEL_ICONS: Partial<
  Record<WorkspaceSecondaryPanel, React.ComponentType<{ size?: number }>>
> = {
  "browser-state": Monitor,
  "page-structure": ScanSearch,
  screenshot: Camera,
  "action-log": ScrollText,
};

export interface WebOperatorSideRailProps {
  focusedPanel: string;
  onFocusedPanelChange?: (panel: string) => void;
  onExpand: () => void;
}

export function WebOperatorSideRail({
  focusedPanel,
  onFocusedPanelChange,
  onExpand,
}: WebOperatorSideRailProps): React.JSX.Element {
  const { t } = useI18n();
  const panels = SECONDARY_NAV_BY_WORKSPACE["web-operator"];

  const handlePanelClick = (panel: WorkspaceSecondaryPanel): void => {
    onFocusedPanelChange?.(panel);
    onExpand();
  };

  return (
    <aside className="web-operator-side-rail" aria-label={t("navigation.webOperator")}>
      <button
        type="button"
        className="web-operator-side-rail__btn"
        title={t("navigation.webOperatorSide.expand")}
        onClick={onExpand}
      >
        <PanelRightOpen size={16} />
      </button>
      <div className="web-operator-side-rail__nav">
        {panels.map((panel) => {
          const IconComponent = PANEL_ICONS[panel] ?? Monitor;
          const active = focusedPanel === panel;
          const label = t(SECONDARY_PANEL_LABEL_KEYS[panel]);
          return (
            <button
              key={panel}
              type="button"
              className={`web-operator-side-rail__btn ${active ? "is-active" : ""}`}
              title={label}
              aria-label={label}
              aria-current={active ? "true" : undefined}
              onClick={() => handlePanelClick(panel)}
            >
              <IconComponent size={16} />
            </button>
          );
        })}
      </div>
    </aside>
  );
}
