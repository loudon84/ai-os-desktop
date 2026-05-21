import { useI18n } from "../../../components/useI18n";
import { useAIOSWorkspace } from "../context/AIOSWorkspaceContext";
import { useWorkspaceTree } from "../hooks/useWorkspaceTree";

export function WorkspacePanel(): React.JSX.Element {
  const { t } = useI18n();
  const { activeProfileId } = useAIOSWorkspace();
  const { currentPath, entries, preview, loading, error, hermesHome, gitStatus, navigate, openFile } =
    useWorkspaceTree(activeProfileId);

  const parent =
    currentPath === "." || currentPath === ""
      ? null
      : currentPath.split("/").slice(0, -1).join("/") || ".";

  const gitLabel = gitStatus.branch
    ? `${gitStatus.branch}${gitStatus.dirtyCount > 0 ? ` · ${gitStatus.dirtyCount} changed` : ""}`
    : t("aiosWorkspace.workspace.notGitRepo", { defaultValue: "Not a git repository" });

  return (
    <div className="flex h-full min-h-0 flex-col text-xs">
      <p className="truncate border-b border-gray-800 px-2 py-1 text-[10px] text-gray-500" title={hermesHome}>
        {hermesHome || t("aiosWorkspace.workspace.home", { defaultValue: "Profile home" })}
      </p>
      <p className="border-b border-gray-800 px-2 py-1 text-[10px] text-gray-400">{gitLabel}</p>
      <p className="px-2 py-1 text-gray-400">
        /{currentPath === "." ? "" : currentPath}
        {parent !== null ? (
          <button type="button" className="ml-2 text-blue-400 hover:underline" onClick={() => navigate(parent)}>
            ..
          </button>
        ) : null}
      </p>
      {loading ? (
        <p className="px-2 text-gray-500">{t("common.loading")}</p>
      ) : error ? (
        <p className="px-2 text-red-400">{error}</p>
      ) : entries.length === 0 ? (
        <p className="px-2 text-gray-500">
          {t("aiosWorkspace.workspace.empty", { defaultValue: "No files in this folder" })}
        </p>
      ) : (
        <ul className="max-h-[45%] overflow-y-auto border-b border-gray-800 px-1">
          {entries.map((e) => (
            <li key={e.path}>
              <button
                type="button"
                className="w-full truncate rounded px-2 py-1 text-left text-gray-300 hover:bg-gray-800"
                onClick={() => {
                  if (e.isDirectory) navigate(e.path);
                  else void openFile(e.path);
                }}
              >
                {e.isDirectory ? "📁 " : "📄 "}
                {e.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      <pre className="min-h-0 flex-1 overflow-auto p-2 text-[10px] whitespace-pre-wrap text-gray-300">
        {preview
          ? preview.encoding === "base64"
            ? `[image: ${preview.path}]`
            : preview.content
          : t("aiosWorkspace.workspace.previewHint", { defaultValue: "Select a file to preview" })}
      </pre>
    </div>
  );
}
