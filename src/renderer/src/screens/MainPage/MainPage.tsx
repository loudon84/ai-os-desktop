import "./main-page.css";
import type { ShellViewSnapshot } from "../../../../shared/shell/shell-view-contract";
import type { ProfileEntrySummary } from "../../../../shared/profile-runtime/profile-runtime-contract";
import type { View } from "../../types/desktop-shell";
import type { ExternalBrowserTab, SidebarMode } from "./main-page-types";
import type { SettingsDrawerPanel } from "../SettingsDrawer/settings-drawer-types";
import { MainTopBar } from "./MainTopBar";
import { MainPageDebugPanel } from "./MainPageDebugPanel";
import type { KeepAliveEntry } from "../../components/layout/useKeepAliveRegistry";

export interface MainPageProps {
  sidebar: React.ReactNode;
  outlet: React.ReactNode;
  statusBar?: React.ReactNode;
  modalLayer?: React.ReactNode;
  drawerLayer?: React.ReactNode;
  activeProfile: string;
  activeView: View;
  profileEntries: ProfileEntrySummary[];
  externalTabs: ExternalBrowserTab[];
  tabOrder: string[];
  sidebarMode: SidebarMode;
  metadataById: Record<string, ShellViewSnapshot>;
  keepAliveEntries: Record<string, KeepAliveEntry>;
  canCloseActiveTab: boolean;
  canNavigateShell: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  onSidebarModeChange: (mode: SidebarMode) => void;
  onNavigate: (view: View) => void;
  onSelectProfile: (name: string) => void;
  onTabOrderChange: (order: string[]) => void;
  onCloseTab: (id: View) => void;
  onRecoverTab: (id: View) => void;
  onOpenExternalTab: (url: string) => Promise<View>;
  onReloadActiveTab: () => void;
  onStopActiveTab: () => void;
  onBackActiveTab: () => void;
  onForwardActiveTab: () => void;
  onCloseActiveTab: () => void;
  onOpenSettingsDrawer: (panel?: SettingsDrawerPanel) => void;
}

export function MainPage({
  sidebar,
  outlet,
  statusBar,
  modalLayer,
  drawerLayer,
  activeProfile,
  activeView,
  profileEntries,
  externalTabs,
  tabOrder,
  sidebarMode,
  metadataById,
  keepAliveEntries,
  canCloseActiveTab,
  canNavigateShell,
  canGoBack,
  canGoForward,
  onSidebarModeChange,
  onNavigate,
  onSelectProfile,
  onTabOrderChange,
  onCloseTab,
  onRecoverTab,
  onOpenExternalTab,
  onReloadActiveTab,
  onStopActiveTab,
  onBackActiveTab,
  onForwardActiveTab,
  onCloseActiveTab,
  onOpenSettingsDrawer,
}: MainPageProps): React.JSX.Element {
  return (
    <div className={`MainPage layout MainPage--sidebar-${sidebarMode}`}>
      <MainTopBar
        activeProfile={activeProfile}
        activeView={activeView}
        profileEntries={profileEntries}
        externalTabs={externalTabs}
        tabOrder={tabOrder}
        sidebarMode={sidebarMode}
        metadataById={metadataById}
        canCloseActiveTab={canCloseActiveTab}
        canNavigateShell={canNavigateShell}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onSidebarModeChange={onSidebarModeChange}
        onNavigate={onNavigate}
        onSelectProfile={onSelectProfile}
        onTabOrderChange={onTabOrderChange}
        onCloseTab={onCloseTab}
        onRecoverTab={onRecoverTab}
        onOpenExternalTab={onOpenExternalTab}
        onReloadActiveTab={onReloadActiveTab}
        onStopActiveTab={onStopActiveTab}
        onBackActiveTab={onBackActiveTab}
        onForwardActiveTab={onForwardActiveTab}
        onCloseActiveTab={onCloseActiveTab}
        onOpenSettingsDrawer={onOpenSettingsDrawer}
      />

      <div className="MainPage__body">
        {sidebarMode !== "hidden" ? (
          <aside className="MainPage__sidebar">{sidebar}</aside>
        ) : null}
        <main className="MainPage__content">{outlet}</main>
      </div>

      {statusBar ? <footer className="MainPage__status">{statusBar}</footer> : null}
      <MainPageDebugPanel
        metadataById={metadataById}
        keepAliveEntries={keepAliveEntries}
      />
      {modalLayer}
      {drawerLayer}
    </div>
  );
}
