import { useState } from "react";
import type {
  BootstrapResult,
  ConfigDiffItem,
} from "../../../../shared/user-config/user-config-contract";
import { useI18n } from "../../components/useI18n";

export interface ConfigDiffViewerProps {
  result: BootstrapResult;
  onApplied?: () => void;
}

export function ConfigDiffViewer({
  result,
  onApplied,
}: ConfigDiffViewerProps): React.JSX.Element {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = async (): Promise<void> => {
    if (!result.confirmToken) return;
    setBusy(true);
    setError(null);
    try {
      await window.desktopUserConfig.applyRemoteConfig(result.confirmToken);
      onApplied?.();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded border border-zinc-800">
      <ul className="max-h-48 overflow-y-auto p-2 space-y-2 text-xs font-mono">
        {result.diff?.map((item: ConfigDiffItem) => (
          <li key={item.path} className="rounded border border-zinc-800 p-2">
            <span className="text-emerald-400">{item.type}</span> {item.path}
          </li>
        ))}
      </ul>
      <div className="flex gap-2 border-t border-zinc-800 p-2">
        <button
          type="button"
          className="flex-1 rounded bg-emerald-700 py-1.5 text-xs text-white hover:bg-emerald-600 disabled:opacity-50"
          disabled={busy || !result.confirmToken}
          onClick={() => void apply()}
        >
          {t("auth.configDiffApply")}
        </button>
      </div>
      {error ? <p className="px-2 pb-2 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
