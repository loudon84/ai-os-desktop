import { useState } from "react";
import type { ProfileSummary } from "../../../../../shared/profile-runtime/profile-runtime-contract";
import { useI18n } from "../../../components/useI18n";

export interface ProfileRuntimeActionsProps {
  profiles: ProfileSummary[];
  selectedProfileId: string | null;
  onSelectProfile: (id: string) => void;
  onActionComplete: () => void;
}

export function ProfileRuntimeActions({
  profiles,
  selectedProfileId,
  onSelectProfile,
  onActionComplete,
}: ProfileRuntimeActionsProps): React.JSX.Element {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const runAction = async (fn: () => Promise<unknown>): Promise<void> => {
    setBusy(true);
    setActionError(null);
    try {
      await fn();
      onActionComplete();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const expertProfiles = profiles.filter((p) => p.name !== "default");

  return (
    <section className="settings-drawer-section">
      <h3 className="settings-drawer-section-title">
        {t("runtimeSettings.multiProfilesRuntimeTitle")}
      </h3>
      <ul className="settings-drawer-list">
        {expertProfiles.length === 0 ? (
          <li className="settings-drawer-text-muted">{t("runtimeSettings.multiProfilesEmpty")}</li>
        ) : (
          expertProfiles.map((p) => (
            <li key={p.id} className="settings-drawer-list-item">
              <button
                type="button"
                className={`settings-drawer-profile-btn${
                  selectedProfileId === p.id ? " is-active" : ""
                }`}
                onClick={() => onSelectProfile(p.id)}
              >
                <span>{p.display_name}</span>
                <span className="settings-drawer-profile-meta">
                  :{p.port} · {p.runtime_status}
                </span>
              </button>
            </li>
          ))
        )}
      </ul>
      <div className="settings-drawer-actions">
        <button
          type="button"
          className="settings-drawer-btn-ghost"
          disabled={busy || !selectedProfileId}
          onClick={() =>
            void runAction(() => window.profileRuntime.startProfile(selectedProfileId!))
          }
        >
          {t("runtimeSettings.multiProfilesStart")}
        </button>
        <button
          type="button"
          className="settings-drawer-btn-ghost"
          disabled={busy || !selectedProfileId}
          onClick={() =>
            void runAction(() => window.profileRuntime.stopProfile(selectedProfileId!))
          }
        >
          {t("runtimeSettings.multiProfilesStop")}
        </button>
        <button
          type="button"
          className="settings-drawer-btn-ghost"
          disabled={busy || !selectedProfileId}
          onClick={() =>
            void runAction(() => window.profileRuntime.restartProfile(selectedProfileId!))
          }
        >
          {t("runtimeSettings.multiProfilesRestart")}
        </button>
        <button
          type="button"
          className="settings-drawer-btn-ghost"
          disabled={busy}
          onClick={() => void runAction(() => window.profileRuntime.startAllProfiles())}
        >
          {t("runtimeSettings.multiProfilesStartAll")}
        </button>
        <button
          type="button"
          className="settings-drawer-btn-ghost"
          disabled={busy}
          onClick={() => void runAction(() => window.profileRuntime.stopAllProfiles())}
        >
          {t("runtimeSettings.multiProfilesStopAll")}
        </button>
      </div>
      {actionError ? <p className="settings-drawer-text-error">{actionError}</p> : null}
    </section>
  );
}
