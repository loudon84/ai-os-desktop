import {
  MessageSquare,
  History,
  Sparkles,
  Wrench,
  Brain,
  Server,
  Box,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useI18n } from "../../../components/useI18n";
import { SIDEBAR_NAV_ITEMS, LAYOUT, type NavItemKey } from "../constants";
import { useWorkspaces } from "../context/WorkspacesContext";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageSquare,
  History,
  Sparkles,
  Wrench,
  Brain,
  Server,
  Box,
  Settings,
};

interface WorkspacesSidebarProps {
  activeKey: NavItemKey;
  collapsed: boolean;
}

export function WorkspacesSidebar({
  activeKey,
  collapsed,
}: WorkspacesSidebarProps): React.JSX.Element {
  const { t } = useI18n();
  const { setActiveNavItem, leftPanelCollapsed, setLeftPanelCollapsed } = useWorkspaces();

  const width = collapsed ? LAYOUT.sidebarCollapsedWidthPx : LAYOUT.sidebarWidthPx;

  return (
    <nav
      className="flex min-h-0 flex-col gap-1 overflow-y-auto border-r border-gray-700/50 bg-gray-900 py-2"
      style={{ width }}
    >
      <div className={`flex ${collapsed ? "justify-center px-1" : "px-2"}`}>
        <button
          type="button"
          onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
          className="rounded p-1.5 text-gray-500 hover:bg-gray-800 hover:text-gray-200"
          title={
            collapsed
              ? t("workspaces.sidebar.expand", { defaultValue: "Expand sidebar" })
              : t("workspaces.sidebar.collapse", { defaultValue: "Collapse sidebar" })
          }
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      {SIDEBAR_NAV_ITEMS.map((item) => {
        const Icon = ICON_MAP[item.icon];
        const isActive = item.key === activeKey;
        const label = t(item.labelI18nKey, { defaultValue: item.key });
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => setActiveNavItem(item.key)}
            title={collapsed ? label : undefined}
            className={`flex items-center transition-colors ${
              collapsed ? "justify-center px-2 py-2" : "gap-3 px-4 py-2"
            } text-sm ${
              isActive
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
            }`}
          >
            {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
            {!collapsed ? <span>{label}</span> : null}
          </button>
        );
      })}
    </nav>
  );
}
