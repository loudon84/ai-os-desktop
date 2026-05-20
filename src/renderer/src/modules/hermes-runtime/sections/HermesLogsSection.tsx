import { useCallback, useEffect, useState } from "react";

export function HermesLogsSection(): React.JSX.Element {
  const [logs, setLogs] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.hermesAPI.readLogs(undefined, 200);
      setLogs(result?.content ?? "");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (loading) return <p className="text-sm text-zinc-400">Loading logs…</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;

  return (
    <>
      <button
        type="button"
        className="mb-2 text-xs text-emerald-400"
        onClick={() => void refresh()}
      >
        Refresh
      </button>
      <pre className="max-h-80 overflow-auto rounded bg-zinc-900 p-2 font-mono text-xs text-zinc-300 whitespace-pre-wrap">
        {logs || "(empty)"}
      </pre>
    </>
  );
}
