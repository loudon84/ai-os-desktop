import { Download, LayoutDashboard, Users, Cpu } from "../../assets/icons";
import { useI18n } from "../../components/useI18n";
import type { ProfileEntrySummary } from "../../../../shared/profile-runtime/profile-runtime-contract";
import type { NavItem, UpdateState, View } from "../../types/desktop-shell";
import type { SidebarMode } from "../../screens/MainPage/main-page-types";

export interface DesktopSidebarProps {
  mode?: SidebarMode;
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
  mode = "expanded",
  view,
  navItems,
  profileEntries,
  activeProfile: _activeProfile,
  updateState,
  updateError,
  updateVersion,
  downloadPercent,
  onNavigate,
  onUpdate,
}: DesktopSidebarProps): React.JSX.Element {
  const { t } = useI18n();
  const showLabels = mode === "expanded";

  return (
    <div className={`desktop-sidebar desktop-sidebar--${mode}`}>
      <nav className="sidebar-nav">
        {navItems.map(({ view: v, icon: Icon, labelKey }) => (
          <button
            key={v}
            type="button"
            className={`sidebar-nav-item ${view === v ? "active" : ""}`}
            title={t(labelKey)}
            onClick={() => onNavigate(v)}
          >
            <Icon size={16} />
            {showLabels ? t(labelKey) : null}
          </button>
        ))}

        {profileEntries.length > 0 && (
          <>
            <div className="sidebar-nav-divider" />
            {showLabels ? (
              <div className="sidebar-nav-group-label">AI-OS</div>
            ) : null}
            <button
              type="button"
              className={`sidebar-nav-item ${view === "aios-workspace" ? "active" : ""}`}
              title="AI-OS"
              onClick={() => onNavigate("aios-workspace")}
            >
              <LayoutDashboard size={16} />
              {showLabels ? "AI-OS" : null}
            </button>
            {showLabels ? (
              <div className="sidebar-nav-group-label">Experts</div>
            ) : null}
            {profileEntries
              .filter((e) => e.entryType === "specialist-workspace")
              .map((entry) => (
                <button
                  key={entry.profileId}
                  type="button"
                  className={`sidebar-nav-item ${view === `profile-workspace:${entry.profileId}` ? "active" : ""}`}
                  title={entry.title}
                  onClick={() => onNavigate(`profile-workspace:${entry.profileId}`)}
                >
                  <Users size={16} />
                  {showLabels ? entry.title : null}
                </button>
              ))}
            {showLabels ? (
              <div className="sidebar-nav-group-label">Runtime</div>
            ) : null}
            <button
              type="button"
              className={`sidebar-nav-item ${view === "profile-runtime" ? "active" : ""}`}
              title="Profile Runtime"
              onClick={() => onNavigate("profile-runtime")}
            >
              <Cpu size={16} />
              {showLabels ? "Profile Runtime" : null}
            </button>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        {updateError && showLabels && (
          <div className="sidebar-update-error" role="alert">
            {updateError}
          </div>
        )}
        {updateState && (
          <button
            type="button"
            className="sidebar-update-btn"
            title={
              updateState === "available"
                ? t("common.updateAvailable", { version: updateVersion })
                : undefined
            }
            onClick={() => void onUpdate()}
          >
            <Download size={13} />
            {showLabels && updateState === "available" && (
              <span>{t("common.updateAvailable", { version: updateVersion })}</span>
            )}
            {showLabels && updateState === "downloading" && (
              <span>{t("common.downloading", { percent: downloadPercent })}</span>
            )}
            {showLabels && updateState === "ready" && (
              <span>{t("common.restartToUpdate")}</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
