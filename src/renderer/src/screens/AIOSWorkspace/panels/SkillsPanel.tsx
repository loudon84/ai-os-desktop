import { useMemo, useState } from "react";
import { useI18n } from "../../../components/useI18n";
import AgentMarkdown from "../../../components/AgentMarkdown";
import { useAIOSWorkspace } from "../context/AIOSWorkspaceContext";
import { useProfileSkills } from "../hooks/useProfileSkills";

function isMarkdownSkill(path: string, content: string): boolean {
  if (path.toLowerCase().endsWith(".md")) return true;
  return /^#\s|^\*\*|^-\s/m.test(content.trim());
}

export function SkillsPanel(): React.JSX.Element {
  const { t } = useI18n();
  const { activeProfileId } = useAIOSWorkspace();
  const [search, setSearch] = useState("");
  const { grouped, loading, error, selectedSkill, skillContent, selectSkill } =
    useProfileSkills(activeProfileId, search);

  const useMarkdownPreview = useMemo(
    () =>
      selectedSkill
        ? isMarkdownSkill(selectedSkill.path, skillContent)
        : false,
    [selectedSkill, skillContent],
  );

  if (!activeProfileId) {
    return <p className="p-3 text-xs text-gray-500">{t("aiosWorkspace.noProfile", { defaultValue: "No profile selected" })}</p>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <input
        className="m-2 rounded bg-gray-800 px-2 py-1.5 text-xs text-gray-100"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("aiosWorkspace.skills.search", { defaultValue: "Search skills…" })}
      />
      {loading ? (
        <p className="px-3 text-xs text-gray-500">{t("common.loading")}</p>
      ) : error ? (
        <p className="px-3 text-xs text-red-400">{error}</p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <ul className="max-h-[40%] overflow-y-auto border-b border-gray-800 px-2 pb-2">
            {Object.entries(grouped).map(([category, items]) => (
              <li key={category} className="mb-2">
                <p className="mb-1 text-[10px] font-semibold uppercase text-gray-500">{category}</p>
                {items.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => void selectSkill(s)}
                    className={`mb-1 block w-full rounded px-2 py-1 text-left text-xs ${
                      selectedSkill?.id === s.id
                        ? "bg-gray-700 text-gray-100"
                        : "text-gray-400 hover:bg-gray-800"
                    }`}
                  >
                    {s.name}
                    <span className="ml-1 text-[10px] text-gray-600">({s.sourceType})</span>
                  </button>
                ))}
              </li>
            ))}
          </ul>
          <div className="min-h-0 flex-1 overflow-auto p-3 text-[11px] text-gray-300">
            {selectedSkill ? (
              useMarkdownPreview ? (
                <div className="prose-invert max-w-none text-xs">
                  <AgentMarkdown>{skillContent}</AgentMarkdown>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap">{skillContent}</pre>
              )
            ) : (
              <p className="text-gray-500">
                {t("aiosWorkspace.skills.selectHint", { defaultValue: "Select a skill" })}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
