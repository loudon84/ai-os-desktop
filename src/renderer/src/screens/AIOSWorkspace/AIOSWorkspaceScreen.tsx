import { AIOSWorkspaceShell } from "./panels/AIOSWorkspaceShell";

export interface AIOSWorkspaceScreenProps {
  profile: string;
  activePanel?: string;
  onPanelChange?: (panel: string) => void;
}

export function AIOSWorkspaceScreen({
  profile,
  activePanel,
}: AIOSWorkspaceScreenProps): React.JSX.Element {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden p-4">
      <AIOSWorkspaceShell profile={profile} activePanel={activePanel} />
    </div>
  );
}
