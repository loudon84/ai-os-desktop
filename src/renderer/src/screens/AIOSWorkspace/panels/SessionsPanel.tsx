import { useCallback, useEffect, useState } from "react";
import { useI18n } from "../../../components/useI18n";

interface CachedSession {
  id: string;
  title: string;
  startedAt: number;
  source: string;
  messageCount: number;
  model: string;
}

export function SessionsPanel(): React.JSX.Element {
  const { t } = useI18n();
  const [sessions, setSessions] = useState<CachedSession[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (query.trim()) {
        const results = await window.hermesAPI.searchSessions(query.trim(), 50);
        setSessions(
          results.map((r) => ({
            id: r.sessionId,
            title: r.title ?? r.sessionId,
            startedAt: r.startedAt,
            source: r.source,
            messageCount: r.messageCount,
            model: r.model,
          })),
        );
      } else {
        setSessions(await window.hermesAPI.listCachedSessions(50, 0));
      }
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 300);
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-gray-900 rounded-lg p-4">
      <h2 className="text-sm font-semibold text-gray-200 mb-3">
        {t("navigation.sessions", { defaultValue: "Sessions" })}
      </h2>
      <input
        className="mb-3 rounded bg-gray-800 px-3 py-2 text-sm text-gray-100"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("navigation.searchSessions", { defaultValue: "Search sessions…" })}
      />
      {loading ? (
        <p className="text-xs text-gray-500">{t("common.loading", { defaultValue: "Loading…" })}</p>
      ) : (
        <ul className="flex-1 overflow-y-auto space-y-2">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="rounded border border-gray-800 px-3 py-2 text-xs text-gray-300"
            >
              <p className="font-medium text-gray-100 truncate">{s.title}</p>
              <p className="text-gray-500 mt-1">
                {s.messageCount} msgs · {s.model} · {new Date(s.startedAt).toLocaleString()}
              </p>
            </li>
          ))}
          {sessions.length === 0 ? (
            <li className="text-xs text-gray-500">{t("navigation.noSessions", { defaultValue: "No sessions" })}</li>
          ) : null}
        </ul>
      )}
    </div>
  );
}
