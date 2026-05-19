import { Download, LayoutDashboard, Users, Cpu } from "../../assets/icons";
import { useI18n } from "../../components/useI18n";
import type { ProfileEntrySummary } from "../../../../shared/profile-runtime/profile-runtime-contract";
import type { NavItem, UpdateState, View } from "../../types/desktop-shell";
import hermeslogo from "../../assets/hermes.png";

export interface DesktopSidebarProps {
  view: View;
  navItems: NavItem[];
  profileEntries: ProfileEntrySummary[];
  activeProfile: string;
  updateState: UpdateState;
  updateError: string | null;
  updateVersion: string | null;
  downloadPercent: number;
  onNavigate: (view: View) => void;
  onUpdate: () => Promise<void>;
}

export function DesktopSidebar({
  view,
  navItems,
  profileEntries,
  activeProfile,
  updateState,
  updateError,
  updateVersion,
  downloadPercent,
  onNavigate,
  onUpdate,
}: DesktopSidebarProps): React.JSX.Element {
  const { t } = useI18n();

  return (
    <>      
      <nav className="sidebar-nav">
        {navItems.map(({ view: v, icon: Icon, labelKey }) => (
          <button
            key={v}
            type="button"
            className={`sidebar-nav-item ${view === v ? "active" : ""}`}
            onClick={() => onNavigate(v)}
          >
            <Icon size={16} />
            {t(labelKey)}
          </button>
        ))}

        {profileEntries.length > 0 && (
          <>
            <div className="sidebar-nav-divider" />
            <div className="sidebar-nav-group-label">AI-OS</div>
            <button
              type="button"
              className={`sidebar-nav-item ${view === "aios-workspace" ? "active" : ""}`}
              onClick={() => onNavigate("aios-workspace")}
            >
              <LayoutDashboard size={16} />
              AI-OS
            </button>
            <div className="sidebar-nav-group-label">Experts</div>
            {profileEntries
              .filter((e) => e.entryType === "specialist-workspace")
              .map((entry) => (
                <button
                  key={entry.profileId}
                  type="button"
                  className={`sidebar-nav-item ${view === `profile-workspace:${entry.profileId}` ? "active" : ""}`}
                  onClick={() => onNavigate(`profile-workspace:${entry.profileId}`)}
                >
                  <Users size={16} />
                  {entry.title}
                </button>
              ))}
            <div className="sidebar-nav-group-label">Runtime</div>
            <button
              type="button"
              className={`sidebar-nav-item ${view === "profile-runtime" ? "active" : ""}`}
              onClick={() => onNavigate("profile-runtime")}
            >
              <Cpu size={16} />
              Profile Runtime
            </button>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        {updateError && (
          <div className="sidebar-update-error" role="alert">
            {updateError}
          </div>
        )}
        {updateState && (
          <button type="button" className="sidebar-update-btn" onClick={() => void onUpdate()}>
            <Download size={13} />
            {updateState === "available" && (
              <span>{t("common.updateAvailable", { version: updateVersion })}</span>
            )}
            {updateState === "downloading" && (
              <span>{t("common.downloading", { percent: downloadPercent })}</span>
            )}
            {updateState === "ready" && <span>{t("common.restartToUpdate")}</span>}
          </button>
        )}
        {/*
        <div className="sidebar-footer-text">
          {activeProfile === "default" ? t("common.appName") : activeProfile}
        </div>
        */}
      </div>
    </>
  );
}
