import { useWorkspaces } from "../context/WorkspacesContext";
import type { RightInspectorTab } from "../types";
import { MemoryPanel } from "../panels/MemoryPanel";
import { RuntimePanel } from "../panels/RuntimePanel";
import { SkillsPanel } from "../panels/SkillsPanel";
import { WorkspacePanel } from "../panels/WorkspacePanel";
import { RightInspectorTabs } from "./RightInspectorTabs";

function RightPanelBody({ tab }: { tab: RightInspectorTab }): React.JSX.Element {
  switch (tab) {
    case "workspace":
      return <WorkspacePanel />;
    case "skills":
      return <SkillsPanel />;
    case "memory":
      return <MemoryPanel />;
    case "runtime":
      return <RuntimePanel />;
    default:
      return <RuntimePanel />;
  }
}

export function WorkspaceRightPanel(): React.JSX.Element {
  const { activeRightTab } = useWorkspaces();

  return (
    <aside className="flex min-h-0 min-w-0 flex-col overflow-hidden border-l border-gray-800 bg-gray-950">
      <RightInspectorTabs />
      <div className="min-h-0 flex-1 overflow-hidden">
        <RightPanelBody tab={activeRightTab} />
      </div>
    </aside>
  );
}
