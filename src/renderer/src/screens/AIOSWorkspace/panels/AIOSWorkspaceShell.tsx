import type { WorkspaceSecondaryPanel } from "../../../../../shared/workspace/workspace-contract";
import { ChatPanel } from "./ChatPanel";
import { SessionsPanel } from "./SessionsPanel";
import { AgentsPanel } from "./AgentsPanel";

export interface AIOSWorkspaceShellProps {
  profile: string;
  activePanel?: string;
}

export function AIOSWorkspaceShell({
  profile,
  activePanel = "chat",
}: AIOSWorkspaceShellProps): React.JSX.Element {
  const panel = (activePanel ?? "chat") as WorkspaceSecondaryPanel;

  switch (panel) {
    case "sessions":
      return <SessionsPanel />;
    case "agents":
      return <AgentsPanel />;
    case "chat":
    default:
      return <ChatPanel profile={profile} />;
  }
}
