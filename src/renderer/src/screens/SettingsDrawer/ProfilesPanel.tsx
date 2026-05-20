import { useEffect, useState } from "react";
import type { ProfileSummary } from "../../../../shared/profile-runtime/profile-runtime-contract";
import { useI18n } from "../../components/useI18n";

export function ProfilesPanel(): React.JSX.Element {
  const { t } = useI18n();
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);

  useEffect(() => {
    void window.profileRuntime.listProfiles().then(setProfiles).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-2 p-4 text-sm text-zinc-300">
      <p className="text-xs text-zinc-500">
        {t("runtimeSettings.profilesHint", {
          defaultValue: "Profile runtime instances managed by the desktop control plane.",
        })}
      </p>
      <ul className="space-y-1.5">
        {profiles.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between rounded border border-zinc-800 px-3 py-2 text-xs"
          >
            <span>{p.display_name}</span>
            <span className="text-zinc-500">{p.runtime_status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
