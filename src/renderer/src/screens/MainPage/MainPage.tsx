import "./main-page.css";
import type { ProfileEntrySummary } from "../../../../shared/profile-runtime/profile-runtime-contract";
import type { View } from "../../types/desktop-shell";
import type { SidebarMode } from "./main-page-types";
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
  sidebarMode: SidebarMode;
  onSidebarModeChange: (mode: SidebarMode) => void;
  onNavigate: (view: View) => void;
  onSelectProfile: (name: string) => void;
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
  sidebarMode,
  onSidebarModeChange,
  onNavigate,
  onSelectProfile,
}: MainPageProps): React.JSX.Element {
  return (
    <div className={`MainPage layout MainPage--sidebar-${sidebarMode}`}>
      <MainTopBar
        activeProfile={activeProfile}
        activeView={activeView}
        profileEntries={profileEntries}
        sidebarMode={sidebarMode}
        onSidebarModeChange={onSidebarModeChange}
        onNavigate={onNavigate}
        onSelectProfile={onSelectProfile}
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
