import { WorkspaceRenderer } from "../workspace/WorkspaceRenderer";
import type { View } from "../../types/desktop-shell";

export interface WorkspaceOutletProps {
  view: View;
  activeProfile: string;
  officeVisited: boolean;
  onNavigate: (view: View) => void;
  onOpenRuntimeSettings?: () => void;
  secondaryPanel?: string;
  onSecondaryPanelChange?: (panel: string) => void;
}

export function WorkspaceOutlet({
  view,
  activeProfile,
  officeVisited,
  onNavigate,
  onOpenRuntimeSettings,
  secondaryPanel,
  onSecondaryPanelChange,
}: WorkspaceOutletProps): React.JSX.Element {
  return (
    <WorkspaceRenderer
      workspaceId={view}
      activeProfile={activeProfile}
      officeVisited={officeVisited}
      onNavigate={onNavigate}
      onOpenRuntimeSettings={onOpenRuntimeSettings}
      secondaryPanel={secondaryPanel}
      onSecondaryPanelChange={onSecondaryPanelChange}
    />
  );
}
