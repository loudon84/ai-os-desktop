import { useState } from "react";
import type { ProfileSummary } from "../../../../../shared/profile-runtime/profile-runtime-contract";
import type { ProfileRoleSpecSummary } from "../../../../../shared/profile-roles/profile-role-contract";
import { useI18n } from "../../../components/useI18n";

export interface ProfileRoleSourceViewProps {
  profile: ProfileSummary | null;
  roleSpec: ProfileRoleSpecSummary | null;
  onUpdated: () => void;
}

export function ProfileRoleSourceView({
  profile,
  roleSpec,
  onUpdated,
}: ProfileRoleSourceViewProps): React.JSX.Element {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleRecompile = async (): Promise<void> => {
    if (!profile) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await window.profileRole.recompile(profile.id);
      setMessage(
        result.ok
          ? t("runtimeSettings.multiProfilesRecompileOk", { checksum: result.checksum ?? "" })
          : (result.error ?? t("runtimeSettings.multiProfilesRecompileFailed")),
      );
      if (result.ok) onUpdated();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {t("runtimeSettings.multiProfilesRoleTitle")}
      </h3>
      {!profile ? (
        <p className="text-xs text-zinc-500">{t("runtimeSettings.multiProfilesSelectProfile")}</p>
      ) : !roleSpec ? (
        <p className="text-xs text-zinc-500">{t("runtimeSettings.multiProfilesNoRoleSpec")}</p>
      ) : (
        <dl className="space-y-1.5 text-xs">
          <div className="flex justify-between gap-2">
            <dt className="text-zinc-500">{t("runtimeSettings.multiProfilesRoleName")}</dt>
            <dd className="text-zinc-300">{roleSpec.roleName}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-zinc-500">{t("runtimeSettings.multiProfilesRoleKey")}</dt>
            <dd className="font-mono text-zinc-400">{roleSpec.roleKey}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">{t("runtimeSettings.multiProfilesSourceRepo")}</dt>
            <dd className="mt-0.5 break-all font-mono text-[10px] text-zinc-400">
              {roleSpec.roleSourceRepo}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">{t("runtimeSettings.multiProfilesSourcePaths")}</dt>
            <dd className="mt-0.5">
              <ul className="list-inside list-disc font-mono text-[10px] text-zinc-400">
                {roleSpec.sourcePaths.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-zinc-500">{t("runtimeSettings.multiProfilesChecksum")}</dt>
            <dd className="max-w-[12rem] truncate font-mono text-[10px] text-zinc-400" title={roleSpec.sourceChecksum}>
              {roleSpec.sourceChecksum}
            </dd>
          </div>
        </dl>
      )}
      <button
        type="button"
        className="mt-3 rounded border border-zinc-700 px-2 py-1 text-xs disabled:opacity-50"
        disabled={busy || !profile || !roleSpec}
        onClick={() => void handleRecompile()}
      >
        {busy
          ? t("runtimeSettings.multiProfilesRecompiling")
          : t("runtimeSettings.multiProfilesRecompile")}
      </button>
      {message ? <p className="mt-2 text-xs text-zinc-400">{message}</p> : null}
    </section>
  );
}
