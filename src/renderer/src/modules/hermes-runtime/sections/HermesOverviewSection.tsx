import { useHermesOverview } from "../hooks/useHermesOverview";

export function HermesOverviewSection(): React.JSX.Element {
  const { loading, error, version, gatewayStatus, refresh } = useHermesOverview();

  if (loading) {
    return <p className="text-sm text-zinc-400">Loading…</p>;
  }

  if (error) {
    return (
      <>
        <p className="text-sm text-red-400">{error}</p>
        <button type="button" className="text-xs text-emerald-400" onClick={() => void refresh()}>
          Retry
        </button>
      </>
    );
  }

  return (
    <dl className="space-y-3 text-sm">
      <>
        <dt className="text-zinc-500">Hermes version</dt>
        <dd className="text-zinc-100 font-mono">{version ?? "—"}</dd>
      </>
      <>
        <dt className="text-zinc-500">Gateway</dt>
        <dd className="text-zinc-100 font-mono">{gatewayStatus ?? "—"}</dd>
      </>
    </dl>
  );
}
