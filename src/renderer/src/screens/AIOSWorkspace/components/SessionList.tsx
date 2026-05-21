import { useI18n } from "../../../components/useI18n";
import { useAIOSWorkspace } from "../context/AIOSWorkspaceContext";
import { SessionSearch } from "./SessionSearch";

export function SessionList(): React.JSX.Element {
  const { t } = useI18n();
  const {
    activeProfileId,
    activeSessionId,
    setActiveSessionId,
    sessions,
    sessionsLoading,
    sessionsKeyword,
    setSessionsKeyword,
    renameSession,
    deleteSession,
  } = useAIOSWorkspace();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {t("navigation.sessions", { defaultValue: "Sessions" })}
        </h3>
        <button
          type="button"
          className="rounded bg-gray-800 px-2 py-1 text-[11px] text-gray-300 hover:bg-gray-700"
          onClick={() => setActiveSessionId(null)}
          disabled={!activeProfileId}
        >
          {t("aiosWorkspace.sessions.new", { defaultValue: "New" })}
        </button>
      </div>
      <SessionSearch value={sessionsKeyword} onChange={setSessionsKeyword} />
      {sessionsLoading ? (
        <p className="text-xs text-gray-500">{t("common.loading", { defaultValue: "Loading…" })}</p>
      ) : (
        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
          {sessions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className={`group w-full rounded border px-2 py-2 text-left text-xs ${
                  s.id === activeSessionId
                    ? "border-blue-500/50 bg-blue-500/10 text-gray-100"
                    : "border-gray-800 text-gray-300 hover:border-gray-700"
                }`}
                onClick={() => setActiveSessionId(s.id)}
              >
                <p className="truncate font-medium">{s.title}</p>
                <p className="mt-0.5 text-[10px] text-gray-500">
                  {s.model ? `${s.model} · ` : ""}
                  {new Date(s.updatedAt).toLocaleString()}
                </p>
              </button>
              <div className="mt-1 flex gap-1 opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  className="text-[10px] text-gray-500 hover:text-gray-300"
                  onClick={() => {
                    const title = window.prompt(
                      t("aiosWorkspace.sessions.renamePrompt", { defaultValue: "Session title" }),
                      s.title,
                    );
                    if (title) void renameSession(s.id, title);
                  }}
                >
                  {t("aiosWorkspace.sessions.rename", { defaultValue: "Rename" })}
                </button>
                <button
                  type="button"
                  className="text-[10px] text-red-400/80 hover:text-red-300"
                  onClick={() => {
                    if (window.confirm(t("aiosWorkspace.sessions.deleteConfirm", { defaultValue: "Delete session?" }))) {
                      void deleteSession(s.id);
                      if (activeSessionId === s.id) setActiveSessionId(null);
                    }
                  }}
                >
                  {t("common.delete", { defaultValue: "Delete" })}
                </button>
              </div>
            </li>
          ))}
          {sessions.length === 0 ? (
            <li className="text-xs text-gray-500">
              {t("navigation.noSessions", { defaultValue: "No sessions" })}
            </li>
          ) : null}
        </ul>
      )}
    </div>
  );
}
