import { PanelLeftClose, PanelLeftOpen, Settings, Globe, LayoutDashboard } from "lucide-react";
import { WindowControls } from "../../components/layout/WindowControls";
import type { ProfileEntrySummary } from "../../../../shared/profile-runtime/profile-runtime-contract";
import type { View } from "../../types/desktop-shell";
import type { SidebarMode } from "./main-page-types";
import { MainViewTabs } from "./MainViewTabs";
import { MainProfileSwitch } from "./MainProfileSwitch";
import { MainRuntimeIndicator } from "./MainRuntimeIndicator";

interface MainTopBarProps {
  activeProfile: string;
  activeView: View;
  profileEntries: ProfileEntrySummary[];
  sidebarMode: SidebarMode;
  onSidebarModeChange: (mode: SidebarMode) => void;
  onNavigate: (view: View) => void;
  onSelectProfile: (name: string) => void;
}

function nextSidebarMode(mode: SidebarMode): SidebarMode {
  if (mode === "expanded") return "rail";
  if (mode === "rail") return "hidden";
  return "expanded";
}

export function MainTopBar({
  activeProfile,
  activeView,
  profileEntries,
  sidebarMode,
  onSidebarModeChange,
  onNavigate,
  onSelectProfile,
}: MainTopBarProps): React.JSX.Element {
  const SidebarIcon = sidebarMode === "hidden" ? PanelLeftOpen : PanelLeftClose;

  return (
    <header className="MainTopBar app-drag-region">
      <button
        type="button"
        className="MainTopBar__menu no-drag"
        aria-label="Toggle sidebar"
        title={`Sidebar: ${sidebarMode}`}
        onClick={() => onSidebarModeChange(nextSidebarMode(sidebarMode))}
      >
        <SidebarIcon size={16} />
      </button>

      <MainProfileSwitch
        activeProfile={activeProfile}
        onSelectProfile={onSelectProfile}
        onNavigate={onNavigate}
      />

      <MainRuntimeIndicator activeProfile={activeProfile} />

      <MainViewTabs
        activeView={activeView}
        profileEntries={profileEntries}
        onNavigate={onNavigate}
      />

      <div className="MainTopBar__actions no-drag">
        <button
          type="button"
          aria-label="AI-OS Home"
          onClick={() => onNavigate("aios-home")}
        >
          <LayoutDashboard size={15} />
        </button>
        <button
          type="button"
          aria-label="Web Operator"
          onClick={() => onNavigate("web-operator")}
        >
          <Globe size={15} />
        </button>
        <button
          type="button"
          aria-label="Settings"
          onClick={() => onNavigate("settings")}
        >
          <Settings size={15} />
        </button>
      </div>

      <WindowControls />
    </header>
  );
}
