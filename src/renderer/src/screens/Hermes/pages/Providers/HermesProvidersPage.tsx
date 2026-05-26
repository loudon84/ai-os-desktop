import { useEffect, useState } from "react";
import { hermesDefaultApi } from "../../api/hermesDefaultApi";

export default function HermesProvidersPage() {
  const [env, setEnv] = useState<Record<string, string>>({});
  const [connection, setConnection] = useState<{ mode: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [e, c] = await Promise.all([
        hermesDefaultApi.providers.getEnv(),
        hermesDefaultApi.providers.getConnectionConfig(),
      ]);
      setEnv(e);
      setConnection(c as { mode: string });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const keys = Object.keys(env).sort();

  return (
    <div className="hermes-page">
      <header className="hermes-page__header">
        <h2>Providers</h2>
        <button type="button" className="hermes-btn-ghost" onClick={() => void refresh()}>
          Refresh
        </button>
      </header>
      {connection ? (
        <p className="hermes-muted">Connection mode: {connection.mode}</p>
      ) : null}
      {error ? <p className="hermes-page__error">{error}</p> : null}
      {loading ? (
        <p>Loading…</p>
      ) : (
        <ul className="hermes-env-list">
          {keys.map((key) => (
            <li key={key} className="hermes-env-list__item">
              <code>{key}</code>
              <input
                className="hermes-input"
                value={env[key] ?? ""}
                onChange={(e) => setEnv((prev) => ({ ...prev, [key]: e.target.value }))}
                onBlur={() => void hermesDefaultApi.providers.setEnv(key, env[key] ?? "")}
              />
            </li>
          ))}
          {keys.length === 0 ? <li>No env keys</li> : null}
        </ul>
      )}
    </div>
  );
}
