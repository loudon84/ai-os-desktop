import type { NavItemKey } from "./constants";
import { WorkspacesShell } from "./panels/WorkspacesShell";

export interface WorkspacesScreenProps {
  profile: string;
  activePanel?: string;
  onPanelChange?: (panel: string) => void;
  onOpenRuntimeSettings?: () => void;
}

export function WorkspacesScreen({
  profile,
  activePanel,
  onPanelChange,
  onOpenRuntimeSettings,
}: WorkspacesScreenProps): React.JSX.Element {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <WorkspacesShell
        profile={profile}
        initialNavItem={activePanel}
        onNavItemChange={onPanelChange as ((key: NavItemKey) => void) | undefined}
        onOpenSettings={onOpenRuntimeSettings}
      />
    </div>
  );
}
