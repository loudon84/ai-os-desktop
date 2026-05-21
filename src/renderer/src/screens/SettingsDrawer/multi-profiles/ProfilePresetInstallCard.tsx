import { useCallback, useEffect, useState } from "react";
import type { ExpertPresetPreviewResult } from "../../../../../shared/profile-roles/profile-role-contract";
import { useI18n } from "../../../components/useI18n";

export interface ProfilePresetInstallCardProps {
  onInstalled: () => void;
}

export function ProfilePresetInstallCard({
  onInstalled,
}: ProfilePresetInstallCardProps): React.JSX.Element {
  const { t } = useI18n();
  const [overwrite, setOverwrite] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState<ExpertPresetPreviewResult | null>(null);

  const refreshPreview = useCallback(async () => {
    try {
      const result = await window.profileRole.previewExpertPreset({ overwrite });
      setPreview(result);
    } catch {
      setPreview(null);
    }
  }, [overwrite]);

  useEffect(() => {
    void refreshPreview();
  }, [refreshPreview]);

  const handleInstall = async (): Promise<void> => {
    setBusy(true);
    setMessage(null);
    try {
      const result = await window.profileRole.installPreset({ overwrite });
      if (result.ok) {
        setMessage(
          t("runtimeSettings.multiProfilesInstallSuccess", {
            count: result.importedCount,
          }),
        );
        onInstalled();
        void refreshPreview();
      } else if (result.partialSuccess) {
        const detail = result.errors.map((e) => `${e.profileName}: ${e.message}`).join("; ");
        setMessage(
          t("runtimeSettings.multiProfilesInstallPartial", {
            count: result.importedCount,
            detail,
          }),
        );
        onInstalled();
        void refreshPreview();
      } else {
        const detail = result.errors.map((e) => `${e.profileName}: ${e.message}`).join("; ");
        setMessage(detail || t("runtimeSettings.multiProfilesInstallFailed"));
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleSyncLibrary = async (): Promise<void> => {
    setBusy(true);
    setMessage(null);
    try {
      const result = await window.profileRole.syncLibrary();
      setMessage(
        result.ok
          ? t("runtimeSettings.multiProfilesSyncOk", { path: result.localPath })
          : (result.error ?? t("runtimeSettings.multiProfilesSyncFailed")),
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const previewBlocked = preview !== null && !preview.canInstall;

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {t("runtimeSettings.multiProfilesPresetTitle")}
      </h3>
      <p className="mb-3 text-xs text-zinc-500">
        {t("runtimeSettings.multiProfilesPresetDesc")}
      </p>
      {preview ? (
        <div className="mb-3 space-y-1 text-xs text-zinc-500">
          <p>
            {t("runtimeSettings.multiProfilesPreviewCount", { count: preview.totalProfiles })}
          </p>
          {preview.portConflicts.length > 0 ? (
            <ul className="list-inside list-disc text-amber-400/90">
              {preview.portConflicts.map((c) => (
                <li key={`${c.profileName}-${c.port}`}>
                  {t("runtimeSettings.multiProfilesPortConflict", {
                    profile: c.profileName,
                    port: c.port,
                    usedBy: c.usedByProfileName,
                  })}
                </li>
              ))}
            </ul>
          ) : null}
          {preview.existingWithoutOverwrite.length > 0 ? (
            <p className="text-amber-400/90">
              {t("runtimeSettings.multiProfilesExisting", {
                names: preview.existingWithoutOverwrite.join(", "),
              })}
            </p>
          ) : null}
          {preview.invalidProfiles.length > 0 ? (
            <ul className="list-inside list-disc text-red-400/90">
              {preview.invalidProfiles.map((item) => (
                <li key={item.profileName || "yaml"}>
                  {item.profileName ? `${item.profileName}: ` : ""}
                  {item.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <label className="mb-3 flex items-center gap-2 text-xs text-zinc-400">
        <input
          type="checkbox"
          checked={overwrite}
          onChange={(e) => setOverwrite(e.target.checked)}
          disabled={busy}
        />
        {t("runtimeSettings.multiProfilesOverwrite")}
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded bg-emerald-700 px-3 py-1.5 text-xs text-white hover:bg-emerald-600 disabled:opacity-50"
          disabled={busy || previewBlocked}
          onClick={() => void handleInstall()}
        >
          {busy
            ? t("runtimeSettings.multiProfilesInstalling")
            : t("runtimeSettings.multiProfilesInstallButton")}
        </button>
        <button
          type="button"
          className="rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
          disabled={busy}
          onClick={() => void handleSyncLibrary()}
        >
          {t("runtimeSettings.multiProfilesSyncLibrary")}
        </button>
        <button
          type="button"
          className="rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
          disabled={busy}
          onClick={() => void refreshPreview()}
        >
          {t("runtimeSettings.multiProfilesRecheckPorts")}
        </button>
      </div>
      {message ? (
        <p className="mt-2 text-xs text-zinc-400">{message}</p>
      ) : null}
    </section>
  );
}
