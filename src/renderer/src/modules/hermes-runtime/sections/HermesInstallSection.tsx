import { useCallback, useEffect, useState } from "react";

export function HermesInstallSection(): React.JSX.Element {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const s = await window.hermesAPI.checkInstallStatus();
      setStatus(typeof s === "string" ? s : (s as { status?: string }).status ?? "ok");
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const runUpdate = async () => {
    setBusy(true);
    try {
      await window.hermesAPI.runHermesUpdate();
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <p className="text-sm text-zinc-300">
        Install: <span className="font-mono">{status ?? "—"}</span>
      </p>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <span className="mt-2 flex gap-2">
        <button
          type="button"
          disabled={busy}
          className="rounded bg-zinc-700 px-3 py-1.5 text-xs text-white disabled:opacity-50"
          onClick={() => void refresh()}
        >
          Refresh
        </button>
        <button
          type="button"
          disabled={busy}
          className="rounded bg-emerald-700 px-3 py-1.5 text-xs text-white disabled:opacity-50"
          onClick={() => void runUpdate()}
        >
          Update
        </button>
      </span>
    </>
  );
}
