import { useCallback, useEffect, useState } from "react";
import type { ProfileSummary } from "../../../../../shared/profile-runtime/profile-runtime-contract";
import type { ProfileRoleSpecSummary } from "../../../../../shared/profile-roles/profile-role-contract";
import { useI18n } from "../../../components/useI18n";
import { ProfilePresetInstallCard } from "./ProfilePresetInstallCard";
import { ProfileRuntimeActions } from "./ProfileRuntimeActions";
import { ProfileRoleSourceView } from "./ProfileRoleSourceView";
import { ProfileLogViewer } from "./ProfileLogViewer";

export function MultiProfilesPanel(): React.JSX.Element {
  const { t } = useI18n();
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [roleSpecs, setRoleSpecs] = useState<ProfileRoleSpecSummary[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileList, specs] = await Promise.all([
        window.profileRuntime.listProfiles(),
        window.profileRole.listSpecs(),
      ]);
      setProfiles(profileList);
      setRoleSpecs(specs);
      if (!selectedProfileId && profileList.length > 0) {
        const preferred =
          profileList.find((p) => p.name === "default") ?? profileList[0];
        setSelectedProfileId(preferred.id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const unsub = window.profileRuntime.onRuntimeStatusChanged(() => {
      void refresh();
    });
    return unsub;
  }, [refresh]);

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId) ?? null;
  const selectedRoleSpec =
    roleSpecs.find((s) => s.profileId === selectedProfileId) ?? null;

  return (
    <div className="settings-drawer-scroll settings-drawer-padded settings-drawer-stack">
      <p className="settings-drawer-hint">{t("runtimeSettings.multiProfilesHint")}</p>

      {loading ? (
        <p className="settings-drawer-text-muted">{t("runtimeSettings.multiProfilesLoading")}</p>
      ) : null}
      {error ? <p className="settings-drawer-error-box">{error}</p> : null}

      <ProfilePresetInstallCard onInstalled={refresh} />

      <ProfileRuntimeActions
        profiles={profiles}
        selectedProfileId={selectedProfileId}
        onSelectProfile={setSelectedProfileId}
        onActionComplete={refresh}
      />

      <ProfileRoleSourceView
        profile={selectedProfile}
        roleSpec={selectedRoleSpec}
        onUpdated={refresh}
      />

      <ProfileLogViewer profileId={selectedProfileId} />
    </div>
  );
}
