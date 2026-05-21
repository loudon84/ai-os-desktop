import {
  MessageSquare,
  History,
  Sparkles,
  Wrench,
  Brain,
  Server,
  Box,
  Settings,
} from "lucide-react";
import { SIDEBAR_NAV_ITEMS, LAYOUT, type NavItemKey } from "../constants";

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
  onNavigate: (key: NavItemKey) => void;
}

export function WorkspacesSidebar({ activeKey, onNavigate }: WorkspacesSidebarProps): React.JSX.Element {
  return (
    <nav
      className="flex flex-col gap-1 overflow-y-auto border-r border-gray-700/50 bg-gray-900 py-2"
      style={{ width: LAYOUT.sidebarWidthPx }}
    >
      {SIDEBAR_NAV_ITEMS.map((item) => {
        const Icon = ICON_MAP[item.icon];
        const isActive = item.key === activeKey;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onNavigate(item.key)}
            className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
              isActive
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
            }`}
          >
            {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
            <span>{item.key}</span>
          </button>
        );
      })}
    </nav>
  );
}
