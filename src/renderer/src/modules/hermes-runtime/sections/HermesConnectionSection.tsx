import { useCallback, useEffect, useState } from "react";

type ConnectionConfig = Awaited<ReturnType<typeof window.hermesAPI.getConnectionConfig>>;

export function HermesConnectionSection(): React.JSX.Element {
  const [config, setConfig] = useState<ConnectionConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const c = await window.hermesAPI.getConnectionConfig();
      setConfig(c);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await window.hermesAPI.setConnectionConfig(
        config.mode,
        config.remoteUrl ?? "",
        undefined,
      );
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-zinc-400">Loading…</p>;
  if (!config) return <p className="text-sm text-red-400">{error ?? "No config"}</p>;

  return (
    <>
      <label className="block text-xs text-zinc-400">
        Mode
        <select
          className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
          value={config.mode}
          onChange={(e) =>
            setConfig({
              ...config,
              mode: e.target.value as ConnectionConfig["mode"],
            })
          }
        >
          <option value="local">local</option>
          <option value="remote">remote</option>
          <option value="ssh">ssh</option>
        </select>
      </label>
      {config.mode === "remote" ? (
        <label className="mt-3 block text-xs text-zinc-400">
          Remote URL
          <input
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
            value={config.remoteUrl ?? ""}
            onChange={(e) => setConfig({ ...config, remoteUrl: e.target.value })}
          />
        </label>
      ) : null}
      {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
      <button
        type="button"
        disabled={saving}
        className="mt-3 rounded bg-emerald-700 px-3 py-1.5 text-xs text-white disabled:opacity-50"
        onClick={() => void save()}
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </>
  );
}
