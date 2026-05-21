import { useI18n } from "../../../components/useI18n";
import type { AIOSSkillToolCall } from "../types";

export function ToolCallCard({ tool }: { tool: AIOSSkillToolCall }): React.JSX.Element {
  const { t } = useI18n();
  return (
    <div className="mr-auto max-w-[85%] rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
      <p className="font-medium">
        {t("workspaces.chat.toolCall", { defaultValue: "Tool" })}: {tool.name}
      </p>
      <p className="mt-1 text-[10px] uppercase text-amber-300/80">{tool.status}</p>
      {tool.resultPreview ? (
        <pre className="mt-2 max-h-24 overflow-auto text-[10px] text-gray-300">
          {tool.resultPreview}
        </pre>
      ) : null}
    </div>
  );
}
