import { WorkspacesScreen, type WorkspacesScreenProps } from "../Workspaces";

export type AIOSWorkspaceScreenProps = WorkspacesScreenProps;

/** @deprecated Use WorkspacesScreen — thin wrapper for legacy imports */
export function AIOSWorkspaceScreen(props: AIOSWorkspaceScreenProps): React.JSX.Element {
  return <WorkspacesScreen {...props} />;
}
