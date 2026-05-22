import React, { Suspense, useState } from "react";
import { LAYOUT, type NavItemKey } from "../constants";
import { WorkspaceStatusCards } from "../components/WorkspaceStatusCards";
import { WorkspacesSidebar } from "../components/WorkspacesSidebar";
import { WorkspaceRightPanel } from "../components/WorkspaceRightPanel";
import { WorkspaceRightPanelRail } from "../components/WorkspaceRightPanelRail";
import { WorkspacesProvider, useWorkspaces } from "../context/WorkspacesContext";
import { useActiveProfile } from "../hooks/useActiveProfile";
import { WORKSPACE_PAGE_REGISTRY } from "../registry/workspace-pages";

function PageSkeleton(): React.JSX.Element {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-600 border-t-transparent" />
    </div>
  );
}

function PageErrorFallback({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}): React.JSX.Element {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-500">
      <p className="text-sm text-red-400">
        {error instanceof Error ? error.message : "Failed to load page"}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded bg-gray-700 px-3 py-1 text-xs text-gray-300 hover:bg-gray-600"
      >
        Retry
      </button>
    </div>
  );
}

function PageLoader({ pageKey }: { pageKey: NavItemKey }): React.JSX.Element {
  const [retryKey, setRetryKey] = useState(0);
  const PageComponent = WORKSPACE_PAGE_REGISTRY[pageKey];

  return (
    <PageErrorBoundary
      key={`${pageKey}-${retryKey}`}
      fallback={(error) => (
        <PageErrorFallback error={error} onRetry={() => setRetryKey((k) => k + 1)} />
      )}
    >
      <Suspense fallback={<PageSkeleton />}>
        <PageComponent />
      </Suspense>
    </PageErrorBoundary>
  );
}

class PageErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: (error: unknown) => React.ReactNode },
  { error: unknown }
> {
  state: { error: unknown } = { error: null };

  static getDerivedStateFromError(error: unknown): { error: unknown } {
    return { error };
  }

  render(): React.ReactNode {
    if (this.state.error) {
      return this.props.fallback(this.state.error);
    }
    return this.props.children;
  }
}

export interface WorkspacesShellProps {
  profile?: string;
  initialNavItem?: string;
  onNavItemChange?: (key: NavItemKey) => void;
  onOpenSettings?: () => void;
}

function WorkspacesShellInner({ onOpenSettings }: { onOpenSettings?: () => void }): React.JSX.Element {
  const { activeNavItem, leftPanelCollapsed, rightPanelCollapsed } = useWorkspaces();
  const { loading, error } = useActiveProfile();

  const leftCol = leftPanelCollapsed
    ? `${LAYOUT.sidebarCollapsedWidthPx}px`
    : `${LAYOUT.sidebarWidthPx}px`;
  const rightCol = rightPanelCollapsed
    ? `${LAYOUT.rightPanelCollapsedWidthPx}px`
    : `${LAYOUT.rightPanelWidthPx}px`;

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-lg border border-gray-800 bg-gray-950">
      <WorkspaceStatusCards onOpenSettings={onOpenSettings} />
      {loading ? (
        <p className="shrink-0 px-3 py-0.5 text-xs text-gray-500">Loading profiles…</p>
      ) : null}
      {error ? <p className="shrink-0 px-3 py-0.5 text-xs text-red-400">{error}</p> : null}

      <div
        className="grid min-h-0 flex-1 overflow-hidden"
        style={{
          gridTemplateColumns: `${leftCol} minmax(0, 1fr) ${rightCol}`,
        }}
      >
        <WorkspacesSidebar activeKey={activeNavItem} collapsed={leftPanelCollapsed} />
        <main
          className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-background"
          style={{ minWidth: LAYOUT.centerMinWidthPx }}
        >
          <PageLoader pageKey={activeNavItem} />
        </main>
        {rightPanelCollapsed ? <WorkspaceRightPanelRail /> : <WorkspaceRightPanel />}
      </div>
    </div>
  );
}

export function WorkspacesShell({
  profile,
  initialNavItem,
  onNavItemChange,
  onOpenSettings,
}: WorkspacesShellProps): React.JSX.Element {
  return (
    <WorkspacesProvider
      initialProfileId={profile}
      initialNavItem={initialNavItem}
      onNavItemChange={onNavItemChange}
    >
      <WorkspacesShellInner onOpenSettings={onOpenSettings} />
    </WorkspacesProvider>
  );
}
