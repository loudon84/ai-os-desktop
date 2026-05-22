import { PanelRightOpen } from "lucide-react";
import { useI18n } from "../../../components/useI18n";
import { LAYOUT } from "../constants";
import { useWorkspaces } from "../context/WorkspacesContext";

/** Narrow rail shown when the right inspector is collapsed — keeps expand affordance visible. */
export function WorkspaceRightPanelRail(): React.JSX.Element {
  const { t } = useI18n();
  const { setRightPanelCollapsed } = useWorkspaces();

  return (
    <aside
      className="flex min-h-0 flex-col items-center border-l border-gray-800 bg-gray-950 py-2"
      style={{ width: LAYOUT.rightPanelCollapsedWidthPx }}
    >
      <button
        type="button"
        onClick={() => setRightPanelCollapsed(false)}
        className="rounded p-1.5 text-gray-500 hover:bg-gray-800 hover:text-gray-200"
        title={t("workspaces.inspector.expand", { defaultValue: "Expand inspector" })}
      >
        <PanelRightOpen className="h-4 w-4" />
      </button>
    </aside>
  );
}
