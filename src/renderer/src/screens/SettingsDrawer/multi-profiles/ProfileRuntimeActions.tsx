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
    <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {t("runtimeSettings.multiProfilesRuntimeTitle")}
      </h3>
      <ul className="mb-3 max-h-40 space-y-1 overflow-y-auto">
        {expertProfiles.length === 0 ? (
          <li className="text-xs text-zinc-500">{t("runtimeSettings.multiProfilesEmpty")}</li>
        ) : (
          expertProfiles.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className={`flex w-full items-center justify-between rounded border px-2 py-1.5 text-left text-xs ${
                  selectedProfileId === p.id
                    ? "border-emerald-700/60 bg-emerald-950/30"
                    : "border-zinc-800 hover:bg-zinc-800/60"
                }`}
                onClick={() => onSelectProfile(p.id)}
              >
                <span>{p.display_name}</span>
                <span className="text-zinc-500">
                  :{p.port} · {p.runtime_status}
                </span>
              </button>
            </li>
          ))
        )}
      </ul>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded border border-zinc-700 px-2 py-1 text-xs disabled:opacity-50"
          disabled={busy || !selectedProfileId}
          onClick={() =>
            void runAction(() => window.profileRuntime.startProfile(selectedProfileId!))
          }
        >
          {t("runtimeSettings.multiProfilesStart")}
        </button>
        <button
          type="button"
          className="rounded border border-zinc-700 px-2 py-1 text-xs disabled:opacity-50"
          disabled={busy || !selectedProfileId}
          onClick={() =>
            void runAction(() => window.profileRuntime.stopProfile(selectedProfileId!))
          }
        >
          {t("runtimeSettings.multiProfilesStop")}
        </button>
        <button
          type="button"
          className="rounded border border-zinc-700 px-2 py-1 text-xs disabled:opacity-50"
          disabled={busy || !selectedProfileId}
          onClick={() =>
            void runAction(() => window.profileRuntime.restartProfile(selectedProfileId!))
          }
        >
          {t("runtimeSettings.multiProfilesRestart")}
        </button>
        <button
          type="button"
          className="rounded border border-zinc-700 px-2 py-1 text-xs disabled:opacity-50"
          disabled={busy}
          onClick={() => void runAction(() => window.profileRuntime.startAllProfiles())}
        >
          {t("runtimeSettings.multiProfilesStartAll")}
        </button>
        <button
          type="button"
          className="rounded border border-zinc-700 px-2 py-1 text-xs disabled:opacity-50"
          disabled={busy}
          onClick={() => void runAction(() => window.profileRuntime.stopAllProfiles())}
        >
          {t("runtimeSettings.multiProfilesStopAll")}
        </button>
      </div>
      {actionError ? (
        <p className="mt-2 text-xs text-red-400">{actionError}</p>
      ) : null}
    </section>
  );
}
