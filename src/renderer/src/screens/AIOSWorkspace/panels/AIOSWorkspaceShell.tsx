import { LAYOUT } from "../constants";
import { ProfileSwitcher } from "../components/ProfileSwitcher";
import { RightInspectorTabs } from "../components/RightInspectorTabs";
import { SessionList } from "../components/SessionList";
import { AIOSWorkspaceProvider, useAIOSWorkspace } from "../context/AIOSWorkspaceContext";
import { useActiveProfile } from "../hooks/useActiveProfile";
import { ChatPanel } from "./ChatPanel";
import { MemoryPanel } from "./MemoryPanel";
import { RuntimePanel } from "./RuntimePanel";
import { SkillsPanel } from "./SkillsPanel";
import { WorkspacePanel } from "./WorkspacePanel";

export interface AIOSWorkspaceShellProps {
  profile?: string;
  activePanel?: string;
}

function AIOSWorkspaceShellInner(): React.JSX.Element {
  const { activeRightTab, rightPanelCollapsed } = useAIOSWorkspace();
  const { loading, error } = useActiveProfile();

  let rightContent: React.JSX.Element;
  switch (activeRightTab) {
    case "workspace":
      rightContent = <WorkspacePanel />;
      break;
    case "skills":
      rightContent = <SkillsPanel />;
      break;
    case "memory":
      rightContent = <MemoryPanel />;
      break;
    case "runtime":
    default:
      rightContent = <RuntimePanel />;
      break;
  }

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden rounded-lg border border-gray-800 bg-gray-950">
      <aside
        className="flex shrink-0 flex-col border-r border-gray-800 p-3"
        style={{ width: LAYOUT.leftWidthPx }}
      >
        <ProfileSwitcher />
        {loading ? <p className="mt-2 text-xs text-gray-500">Loading profiles…</p> : null}
        {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
        <div className="mt-4 flex min-h-0 flex-1 flex-col">
          <SessionList />
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col" style={{ minWidth: LAYOUT.centerMinWidthPx }}>
        <ChatPanel />
      </main>

      {!rightPanelCollapsed ? (
        <aside
          className="flex shrink-0 flex-col border-l border-gray-800"
          style={{ width: LAYOUT.rightWidthPx }}
        >
          <RightInspectorTabs />
          <div className="min-h-0 flex-1 overflow-hidden">{rightContent}</div>
        </aside>
      ) : null}
    </div>
  );
}

export function AIOSWorkspaceShell({
  profile,
}: AIOSWorkspaceShellProps): React.JSX.Element {
  return (
    <AIOSWorkspaceProvider initialProfileId={profile}>
      <AIOSWorkspaceShellInner />
    </AIOSWorkspaceProvider>
  );
}
