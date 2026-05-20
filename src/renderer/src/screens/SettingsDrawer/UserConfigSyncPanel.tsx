import { useState } from "react";
import type { BootstrapResult } from "../../../../shared/user-config/user-config-contract";
import { useI18n } from "../../components/useI18n";
import { ConfigDiffViewer } from "./ConfigDiffViewer";

export function UserConfigSyncPanel(): React.JSX.Element {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<BootstrapResult | null>(null);

  const runBootstrap = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      const result = await window.desktopUserConfig.bootstrap();
      setLastResult(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 text-sm text-zinc-300">
      <p className="text-xs text-zinc-500">
        {t("auth.configSyncHint", {
          defaultValue: "Pull remote desktop configuration and apply to local Hermes home.",
        })}
      </p>
      <button
        type="button"
        className="w-full max-w-xs rounded bg-blue-600 py-2 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
        disabled={busy}
        onClick={() => void runBootstrap()}
      >
        {busy
          ? t("auth.configSyncRunning", { defaultValue: "Syncing…" })
          : t("auth.configSyncNow", { defaultValue: "Sync configuration" })}
      </button>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
      {lastResult?.diff?.length ? (
        <ConfigDiffViewer result={lastResult} onApplied={() => setLastResult(null)} />
      ) : lastResult && !lastResult.diff?.length ? (
        <p className="text-xs text-emerald-400">
          {t("auth.configUpToDate", { defaultValue: "Configuration is up to date." })}
        </p>
      ) : null}
    </div>
  );
}
