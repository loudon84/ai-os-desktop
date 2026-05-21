import { useI18n } from "../../../components/useI18n";
import { useWorkspaces } from "../context/WorkspacesContext";
import { useProfileMemory } from "../hooks/useProfileMemory";
import type { AIOSMemoryFileName } from "../types";

const FILE_TABS: AIOSMemoryFileName[] = ["SOUL.md", "MEMORY.md", "USER.md"];

export function MemoryPanel(): React.JSX.Element {
  const { t } = useI18n();
  const { activeProfileId } = useWorkspaces();
  const { activeFile, draft, dirty, setActiveFile, setDraft, save, loading, files } =
    useProfileMemory(activeProfileId);

  const readonly = files.find((f) => f.file === activeFile)?.readonly ?? false;

  return (
    <div className="flex h-full min-h-0 flex-col p-2">
      <div className="mb-2 flex gap-1">
        {FILE_TABS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setActiveFile(f)}
            className={`rounded px-2 py-1 text-[11px] ${
              activeFile === f ? "bg-gray-700 text-gray-100" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      <textarea
        className="min-h-0 flex-1 resize-none rounded bg-gray-900 p-2 font-mono text-[11px] text-gray-200 disabled:opacity-70"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        readOnly={readonly}
        disabled={loading}
      />
      {!readonly ? (
        <button
          type="button"
          className="mt-2 rounded bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
          disabled={!dirty || loading}
          onClick={() => void save()}
        >
          {t("common.save", { defaultValue: "Save" })}
        </button>
      ) : (
        <p className="mt-2 text-[10px] text-gray-500">
          {t("workspaces.memory.readonly", { defaultValue: "Read-only" })}
        </p>
      )}
    </div>
  );
}
