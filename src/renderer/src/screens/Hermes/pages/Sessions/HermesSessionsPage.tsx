import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useHermesDefault } from "../../context/HermesDefaultContext";

export default function HermesSessionsPage() {
  const { t } = useTranslation();
  const { sessions, setActiveSessionId, setActiveNavItem } = useHermesDefault();
  const [query, setQuery] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  const commitRename = async (sessionId: string) => {
    const title = renameDraft.trim();
    if (title) await sessions.rename(sessionId, title);
    setRenamingId(null);
    setRenameDraft("");
  };

  return (
    <div className="hermes-page">
      <header className="hermes-page__header">
        <h2>{t("workspaces.hermes.sessions.title")}</h2>
        <div className="hermes-page__actions">
          <input
            className="hermes-input"
            placeholder={t("workspaces.hermes.sessions.search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void sessions.search(query);
            }}
          />
          <button type="button" className="hermes-btn-primary" onClick={() => void sessions.sync()}>
            {t("workspaces.hermes.sessions.sync")}
          </button>
          <button type="button" className="hermes-btn-ghost" onClick={() => void sessions.refresh()}>
            {t("workspaces.hermes.sessions.refresh")}
          </button>
        </div>
      </header>
      {sessions.error ? <p className="hermes-page__error">{sessions.error}</p> : null}
      {sessions.loading ? (
        <p>{t("workspaces.hermes.common.loading")}</p>
      ) : (
        <ul className="hermes-session-list">
          {sessions.sessions.map((s) => (
            <li key={s.id} className="hermes-session-list__item">
              {renamingId === s.id ? (
                <div className="hermes-session-list__rename">
                  <input
                    className="hermes-input"
                    value={renameDraft}
                    autoFocus
                    onChange={(e) => setRenameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void commitRename(s.id);
                      if (e.key === "Escape") {
                        setRenamingId(null);
                        setRenameDraft("");
                      }
                    }}
                    onBlur={() => void commitRename(s.id)}
                  />
                </div>
              ) : (
                <>
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
                  <button
                    type="button"
                    className="hermes-btn-ghost hermes-session-list__rename-btn"
                    onClick={() => {
                      setRenamingId(s.id);
                      setRenameDraft(s.title || s.id);
                    }}
                  >
                    {t("workspaces.sessions.rename")}
                  </button>
                </>
              )}
            </li>
          ))}
          {sessions.sessions.length === 0 ? (
            <li>{t("workspaces.hermes.sessions.empty")}</li>
          ) : null}
        </ul>
      )}
    </div>
  );
}
