import { WorkspacesShell } from "./panels/WorkspacesShell";

export interface WorkspacesScreenProps {
  profile: string;
  activePanel?: string;
  onPanelChange?: (panel: string) => void;
}

export function WorkspacesScreen({
  profile,
}: WorkspacesScreenProps): React.JSX.Element {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden p-2">
      <WorkspacesShell profile={profile} />
    </div>
  );
}
