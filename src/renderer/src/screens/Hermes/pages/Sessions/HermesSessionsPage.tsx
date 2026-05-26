import { useState } from "react";
import { useHermesDefault } from "../../context/HermesDefaultContext";

export default function HermesSessionsPage() {
  const { sessions, setActiveSessionId, setActiveNavItem } = useHermesDefault();
  const [query, setQuery] = useState("");

  return (
    <div className="hermes-page">
      <header className="hermes-page__header">
        <h2>Sessions</h2>
        <div className="hermes-page__actions">
          <input
            className="hermes-input"
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void sessions.search(query);
            }}
          />
          <button type="button" className="hermes-btn-primary" onClick={() => void sessions.sync()}>
            Sync
          </button>
          <button type="button" className="hermes-btn-ghost" onClick={() => void sessions.refresh()}>
            Refresh
          </button>
        </div>
      </header>
      {sessions.error ? <p className="hermes-page__error">{sessions.error}</p> : null}
      {sessions.loading ? (
        <p>Loading…</p>
      ) : (
        <ul className="hermes-session-list">
          {sessions.sessions.map((s) => (
            <li key={s.id} className="hermes-session-list__item">
              <button
                type="button"
                className="hermes-session-list__open"
                onClick={() => {
                  setActiveSessionId(s.id);
                  setActiveNavItem("chat");
                }}
              >
                <strong>{s.title || s.id}</strong>
                <span>
                  {s.messageCount} msgs · {new Date(s.startedAt * 1000).toLocaleString()}
                </span>
              </button>
            </li>
          ))}
          {sessions.sessions.length === 0 ? <li>No sessions</li> : null}
        </ul>
      )}
    </div>
  );
}
