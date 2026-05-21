import { useI18n } from "../../../components/useI18n";
import { useAIOSWorkspace } from "../context/AIOSWorkspaceContext";
import type { RightInspectorTab } from "../types";

const TABS: RightInspectorTab[] = ["workspace", "skills", "memory", "runtime"];

export function RightInspectorTabs(): React.JSX.Element {
  const { t } = useI18n();
  const { activeRightTab, setActiveRightTab, rightPanelCollapsed, setRightPanelCollapsed } =
    useAIOSWorkspace();

  return (
    <div className="flex items-center gap-1 border-b border-gray-800 px-2 py-2">
      {TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => setActiveRightTab(tab)}
          className={`rounded px-2 py-1 text-xs ${
            activeRightTab === tab
              ? "bg-gray-700 text-gray-100"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          {t(`aiosWorkspace.tabs.${tab}`, { defaultValue: tab })}
        </button>
      ))}
      <button
        type="button"
        className="ml-auto text-xs text-gray-500 hover:text-gray-300"
        onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
      >
        {rightPanelCollapsed ? "»" : "«"}
      </button>
    </div>
  );
}
