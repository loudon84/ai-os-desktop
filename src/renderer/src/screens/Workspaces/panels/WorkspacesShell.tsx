import React, { lazy, Suspense, useState, type ComponentType } from "react";
import { LAYOUT, type NavItemKey } from "../constants";
import { ProfileSwitcher } from "../components/ProfileSwitcher";
import { WorkspacesSidebar } from "../components/WorkspacesSidebar";
import { WorkspacesProvider, useWorkspaces } from "../context/WorkspacesContext";
import { useActiveProfile } from "../hooks/useActiveProfile";
import { ChatPanel } from "./ChatPanel";

interface PageComponentProps {
  [key: string]: unknown;
}

const PAGE_COMPONENTS: Record<NavItemKey, ComponentType<PageComponentProps>> = {
  chat: ChatPanel as ComponentType<PageComponentProps>,
  sessions: lazy(() => import("../pages/Sessions/Sessions")),
  skills: lazy(() => import("../pages/Skills/Skills")),
  tools: lazy(() => import("../pages/Tools/Tools")),
  memory: lazy(() => import("../pages/Memory/Memory")),
  providers: lazy(() => import("../pages/Providers/Providers")),
  models: lazy(() => import("../pages/Models/Models")),
  settings: lazy(() => import("../pages/Settings/Settings")),
};

function PageSkeleton(): React.JSX.Element {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-600 border-t-transparent" />
    </div>
  );
}

function PageErrorFallback({ error, onRetry }: { error: unknown; onRetry: () => void }): React.JSX.Element {
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
  const PageComponent = PAGE_COMPONENTS[pageKey];

  return (
    <ErrorBoundary
      key={`${pageKey}-${retryKey}`}
      fallback={(error) => <PageErrorFallback error={error} onRetry={() => setRetryKey((k) => k + 1)} />}
    >
      <Suspense fallback={<PageSkeleton />}>
        <PageComponent />
      </Suspense>
    </ErrorBoundary>
  );
}

class ErrorBoundary extends React.Component<
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
  activePanel?: string;
}

function WorkspacesShellInner(): React.JSX.Element {
  const { activeNavItem, setActiveNavItem } = useWorkspaces();
  const { loading, error } = useActiveProfile();

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-lg border border-gray-800 bg-gray-950">
      <header className="flex shrink-0 items-center border-b border-gray-800 px-4 py-2">
        <ProfileSwitcher />
        {loading ? <span className="ml-2 text-xs text-gray-500">Loading…</span> : null}
        {error ? <span className="ml-2 text-xs text-red-400">{error}</span> : null}
      </header>

      <div className="flex min-h-0 flex-1">
        <WorkspacesSidebar activeKey={activeNavItem} onNavigate={setActiveNavItem} />
        <main
          className="flex min-w-0 flex-1 flex-col"
          style={{ minWidth: LAYOUT.centerMinWidthPx }}
        >
          <PageLoader pageKey={activeNavItem} />
        </main>
      </div>
    </div>
  );
}

export function WorkspacesShell({
  profile,
}: WorkspacesShellProps): React.JSX.Element {
  return (
    <WorkspacesProvider initialProfileId={profile}>
      <WorkspacesShellInner />
    </WorkspacesProvider>
  );
}
