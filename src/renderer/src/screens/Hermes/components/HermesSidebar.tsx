import {
  Box,
  Brain,
  Globe,
  History,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plug,
  Server,
  Sparkles,
  Wrench,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { LAYOUT, type HermesNavItemKey } from "../constants";
import { useHermesDefault } from "../context/HermesDefaultContext";

const ICONS: Record<string, typeof MessageSquare> = {
  MessageSquare,
  History,
  Sparkles,
  Plug,
  Globe,
  Wrench,
  Brain,
  Server,
  Box,
};

type Props = {
  activePanel?: string;
  onPanelChange?: (panel: string) => void;
};

export function HermesSidebar({ activePanel, onPanelChange }: Props) {
  const { t } = useTranslation();
  const {
    activeNavItem,
    setActiveNavItem,
    leftPanelCollapsed,
    setLeftPanelCollapsed,
    navItems,
  } = useHermesDefault();

  const current = (activePanel as HermesNavItemKey | undefined) ?? activeNavItem;
  const collapsed = leftPanelCollapsed;
  const width = collapsed ? LAYOUT.sidebarCollapsedWidthPx : LAYOUT.sidebarWidthPx;

  const select = (key: HermesNavItemKey) => {
    setActiveNavItem(key);
    onPanelChange?.(key);
  };

  return (
    <nav
      className={`hermes-sidebar${collapsed ? " is-collapsed" : ""}`}
      style={{ "--hermes-left-width": `${width}px` } as React.CSSProperties}
    >
      <div className="hermes-sidebar-toggle">
        <button
          type="button"
          onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
          className="hermes-icon-button"
          title={
            collapsed
              ? t("workspaces.sidebar.expand", { defaultValue: "Expand sidebar" })
              : t("workspaces.sidebar.collapse", { defaultValue: "Collapse sidebar" })
          }
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>
      <div className="hermes-nav-list">
        {navItems.map((item) => {
          const Icon = ICONS[item.icon] ?? MessageSquare;
          const label = t(item.labelI18nKey, { defaultValue: item.key });
          const isActive = current === item.key;
          return (
            <button
              key={item.key}
              type="button"
              className={`hermes-nav-button${isActive ? " is-active" : ""}`}
              title={collapsed ? label : undefined}
              onClick={() => select(item.key)}
            >
              <Icon size={16} />
              <span className="hermes-nav-label">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
