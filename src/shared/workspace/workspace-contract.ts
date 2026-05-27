/** Static workspace ids (V3.2 primary workspaces). */
export type StaticWorkspaceId =
  | "portal"
  | "workspaces"
  | "local-hermes"
  | "task-workbench"
  | "web-operator"
  | "office";

export type ExternalBrowserWorkspaceId = `external-browser:${string}`;

export type WorkspaceId = StaticWorkspaceId | ExternalBrowserWorkspaceId;

export type WorkspaceKind = "webview" | "react" | "composite";

export type WorkspaceSource =
  | "system"
  | "local"
  | "hermes"
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
  | "page-structure"
  | "screenshot"
  | "action-log"
  | "office";
