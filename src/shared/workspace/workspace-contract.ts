/** Static workspace ids (V3.2 primary workspaces). */
export type StaticWorkspaceId =
  | "aios-home"
  | "workspaces"
  | "task-workbench"
  | "web-operator"
  | "office";

export type ExternalBrowserWorkspaceId = `external-browser:${string}`;

export type WorkspaceId = StaticWorkspaceId | ExternalBrowserWorkspaceId;

export type WorkspaceKind = "webview" | "react" | "composite";

export type WorkspaceSource =
  | "system"
  | "local"
  | "operator"
  | "office"
  | "external";

export interface WorkspaceModule {
  id: StaticWorkspaceId;
  titleKey: string;
  kind: WorkspaceKind;
  closeable: boolean;
  draggable: boolean;
  persistable: boolean;
  shellLayerId?: string;
  source: WorkspaceSource;
}

export type WorkspaceSecondaryPanel =
  | "chat"
  | "sessions"
  | "agents"
  | "workspace"
  | "skills"
  | "memory"
  | "runtime"
  | "browser-state"
  | "screenshot"
  | "action-log"
  | "office";
