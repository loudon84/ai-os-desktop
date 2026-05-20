import { useState } from "react";

export function HermesDoctorSection(): React.JSX.Element {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runDoctor = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const report = await window.hermesAPI.runHermesDoctor();
      setResult(typeof report === "string" ? report : JSON.stringify(report, null, 2));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        disabled={busy}
        className="rounded bg-emerald-700 px-3 py-1.5 text-xs text-white disabled:opacity-50"
        onClick={() => void runDoctor()}
      >
        {busy ? "Running…" : "Run Doctor"}
      </button>
      {error ? <pre className="mt-3 text-xs text-red-400 whitespace-pre-wrap">{error}</pre> : null}
      {result ? (
        <pre className="mt-3 max-h-64 overflow-auto rounded bg-zinc-900 p-2 text-xs text-zinc-300 whitespace-pre-wrap">
          {result}
        </pre>
      ) : null}
    </>
  );
}
