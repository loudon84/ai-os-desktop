import "./main-page.css";
import type { ProfileEntrySummary } from "../../../../shared/profile-runtime/profile-runtime-contract";
import type { View } from "../../types/desktop-shell";
import type { ExternalBrowserTab, SidebarMode } from "./main-page-types";
import { MainTopBar } from "./MainTopBar";

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
  canCloseActiveTab: boolean;
  onSidebarModeChange: (mode: SidebarMode) => void;
  onNavigate: (view: View) => void;
  onSelectProfile: (name: string) => void;
  onTabOrderChange: (order: string[]) => void;
  onCloseTab: (id: View) => void;
  onOpenExternalTab: (url: string) => Promise<View>;
  onReloadActiveTab: () => void;
  onCloseActiveTab: () => void;
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
  canCloseActiveTab,
  onSidebarModeChange,
  onNavigate,
  onSelectProfile,
  onTabOrderChange,
  onCloseTab,
  onOpenExternalTab,
  onReloadActiveTab,
  onCloseActiveTab,
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
        canCloseActiveTab={canCloseActiveTab}
        onSidebarModeChange={onSidebarModeChange}
        onNavigate={onNavigate}
        onSelectProfile={onSelectProfile}
        onTabOrderChange={onTabOrderChange}
        onCloseTab={onCloseTab}
        onOpenExternalTab={onOpenExternalTab}
        onReloadActiveTab={onReloadActiveTab}
        onCloseActiveTab={onCloseActiveTab}
      />

      <div className="MainPage__body">
        {sidebarMode !== "hidden" ? (
          <aside className="MainPage__sidebar">{sidebar}</aside>
        ) : null}
        <main className="MainPage__content">{outlet}</main>
      </div>

      {statusBar ? <footer className="MainPage__status">{statusBar}</footer> : null}
      {modalLayer}
      {drawerLayer}
    </div>
  );
}
