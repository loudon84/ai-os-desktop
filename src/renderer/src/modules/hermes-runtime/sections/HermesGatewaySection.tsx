import { useCallback, useEffect, useState } from "react";

export function HermesGatewaySection(): React.JSX.Element {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const gwRunning = await window.hermesAPI.gatewayStatus();
      setStatus(gwRunning ? "running" : "stopped");
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const run = async (action: "start" | "stop" | "restart") => {
    setBusy(true);
    setError(null);
    try {
      if (action === "start") await window.hermesAPI.startGateway();
      if (action === "stop") await window.hermesAPI.stopGateway();
      if (action === "restart") {
        await window.hermesAPI.stopGateway();
        await window.hermesAPI.startGateway();
      }
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
        Status: <span className="font-mono text-zinc-100">{status ?? "—"}</span>
      </p>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <span className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          className="rounded bg-emerald-700 px-3 py-1.5 text-xs text-white disabled:opacity-50"
          onClick={() => void run("start")}
        >
          Start
        </button>
        <button
          type="button"
          disabled={busy}
          className="rounded bg-zinc-700 px-3 py-1.5 text-xs text-white disabled:opacity-50"
          onClick={() => void run("stop")}
        >
          Stop
        </button>
        <button
          type="button"
          disabled={busy}
          className="rounded bg-zinc-700 px-3 py-1.5 text-xs text-white disabled:opacity-50"
          onClick={() => void run("restart")}
        >
          Restart
        </button>
      </span>
    </>
  );
}
