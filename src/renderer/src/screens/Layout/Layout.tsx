import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Building,
  Globe,
  LayoutDashboard,
  Grid,
} from "../../assets/icons";
import { DesktopSidebar } from "../../components/layout/DesktopSidebar";
import { WorkspaceOutlet } from "../../components/layout/WorkspaceOutlet";
import { StatusBar } from "../../components/layout/StatusBar";
import { useKeepAliveRegistry } from "../../components/layout/useKeepAliveRegistry";
import { MainPage } from "../MainPage/MainPage";
import type { SidebarMode } from "../MainPage/main-page-types";
import { useExternalBrowserTabs } from "../MainPage/useExternalBrowserTabs";
import { useShellViewMetadata } from "../MainPage/useShellViewMetadata";
import { resolveActiveShellLayerId } from "../MainPage/shell-layer-id";
import type { View } from "../../types/desktop-shell";
import { ModalLayer } from "../../components/layout/ModalLayer";
import { DrawerLayer } from "../../components/layout/DrawerLayer";
import { HermesRuntimeSettingsDrawer } from "../../modules/hermes-runtime/HermesRuntimeSettingsDrawer";
import { UserMenuDrawer } from "../../modules/auth/UserMenuDrawer";
import { ConfigDiffConfirmDrawer } from "../../modules/auth/ConfigDiffConfirmDrawer";
import { useAuth } from "../../modules/auth/AuthProvider";
import { useDesktopNavigation } from "../../hooks/useDesktopNavigation";
import { useUpdateState } from "../../hooks/useUpdateState";
import { useRemoteMode } from "../../hooks/useRemoteMode";
import { useProfileEntries } from "../../hooks/useProfileEntries";
import type { NavItem } from "../../types/desktop-shell";
import type { MainPagePersistedState } from "../../../../shared/shell/main-page-state-contract";

const NAV_ITEMS: NavItem[] = [
  { view: "aios-home", icon: LayoutDashboard, labelKey: "navigation.aiosHome" },
  { view: "aios-workspace", icon: Grid, labelKey: "navigation.aiosWorkspace" },
  { view: "web-operator", icon: Globe, labelKey: "navigation.webOperator" },
  { view: "office", icon: Building, labelKey: "navigation.office" },
];

function isValidRestoredView(
  view: string | undefined,
  externalTabIds: string[],
): view is View {
  if (!view) return false;

  const known: View[] = [
    "aios-home",
    "aios-workspace",
    "web-operator",
    "office",
  ];

  if (known.includes(view as View)) return true;

  if (view.startsWith("external-browser:") && externalTabIds.includes(view)) {
    return true;
  }

  return false;
}

function Layout(): React.JSX.Element {
  const { pendingBootstrapDiff, setPendingBootstrapDiff } = useAuth();
  const navigation = useDesktopNavigation();
  const {
    updateVersion,
    updateState,
    downloadPercent,
    updateError,
    handleUpdate,
  } = useUpdateState();
  const remoteMode = useRemoteMode(navigation.view);
  const profileEntries = useProfileEntries();
  const metadataById = useShellViewMetadata();
  const keepAliveEntries = useKeepAliveRegistry(String(navigation.view));

  const [sidebarMode, setSidebarMode] = useState<SidebarMode>("expanded");
  const [tabOrder, setTabOrder] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [runtimeSettingsOpen, setRuntimeSettingsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { externalTabs, openExternalTab, closeExternalTab, restoreExternalTabs } =
    useExternalBrowserTabs();

  const draggableTabIds = useMemo(
    () => externalTabs.map((t) => t.id as string),
    [externalTabs],
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const state = await window.mainPageState.read();
        if (cancelled) return;

        setSidebarMode(state.sidebarMode);
        setTabOrder(state.tabOrder);
        await restoreExternalTabs(state.externalTabs);

        const externalIds = state.externalTabs.map((t) => t.id);
        if (isValidRestoredView(state.lastActiveView, externalIds)) {
          navigation.navigateToView(state.lastActiveView as View);
        } else {
          navigation.navigateToView("aios-home");
        }
      } catch (err) {
        console.warn("[Layout] failed to restore main page state:", err);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  useEffect(() => {
    setTabOrder((prev) => {
      const kept = prev.filter((id) => draggableTabIds.includes(id));
      const appended = draggableTabIds.filter((id) => !kept.includes(id));
      return [...kept, ...appended];
    });
  }, [draggableTabIds]);

  useEffect(() => {
    if (!hydrated) return;

    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
    }

    persistTimerRef.current = setTimeout(() => {
      const payload: MainPagePersistedState = {
        version: 1,
        sidebarMode,
        tabOrder,
        externalTabs: externalTabs.map((tab) => ({
          id: tab.id,
          title: tab.title,
          url: tab.url,
          createdAt: tab.createdAt,
          updatedAt: tab.updatedAt,
        })),
        lastActiveView: String(navigation.view),
      };
      void window.mainPageState.write(payload).catch((err) => {
        console.warn("[Layout] failed to persist main page state:", err);
      });
    }, 300);

    return () => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
      }
    };
  }, [hydrated, sidebarMode, tabOrder, externalTabs, navigation.view]);

  const activeShellLayerId = resolveActiveShellLayerId(navigation.view);
  const activeMetadata = activeShellLayerId
    ? metadataById[activeShellLayerId]
    : undefined;

  const canCloseActiveTab =
    typeof navigation.view === "string" &&
    navigation.view.startsWith("external-browser:");

  const canNavigateShell = activeShellLayerId !== null;

  const handleCloseTab = useCallback(
    (id: View) => {
      if (typeof id === "string" && id.startsWith("external-browser:")) {
        void closeExternalTab(id as `external-browser:${string}`).then(() => {
          if (navigation.view === id) {
            navigation.navigateToView("aios-home");
          }
        });
      }
    },
    [closeExternalTab, navigation],
  );

  const runShellNav = useCallback(
    (action: (layerId: string) => Promise<void>) => {
      const layerId = resolveActiveShellLayerId(navigation.view);
      if (!layerId) return;
      void action(layerId);
    },
    [navigation.view],
  );

  const handleReloadActiveTab = useCallback(() => {
    runShellNav((layerId) => window.shellView.reload(layerId));
  }, [runShellNav]);

  const handleStopActiveTab = useCallback(() => {
    runShellNav((layerId) => window.shellView.stopLoading(layerId));
  }, [runShellNav]);

  const handleBackActiveTab = useCallback(() => {
    runShellNav((layerId) => window.shellView.goBack(layerId));
  }, [runShellNav]);

  const handleForwardActiveTab = useCallback(() => {
    runShellNav((layerId) => window.shellView.goForward(layerId));
  }, [runShellNav]);

  const handleRecoverTab = useCallback(
    (id: View) => {
      void window.shellView.recover(String(id));
    },
    [],
  );

  const handleCloseActiveTab = useCallback(() => {
    const active = navigation.view;
    if (typeof active === "string" && active.startsWith("external-browser:")) {
      void closeExternalTab(active as `external-browser:${string}`);
      navigation.navigateToView("aios-home");
    }
  }, [navigation.view, closeExternalTab, navigation.navigateToView]);

  useEffect(() => {
    try {
      return window.aiosBrowser.onOpened(() => {
        navigation.navigateToView("web-operator");
      });
    } catch {
      return undefined;
    }
  }, [navigation.navigateToView]);

  if (!hydrated) {
    return (
      <div className="MainPage layout MainPage--sidebar-expanded">
        <main className="MainPage__content" />
      </div>
    );
  }

  return (
    <MainPage
      activeProfile={navigation.activeProfile}
      activeView={navigation.view}
      profileEntries={profileEntries}
      externalTabs={externalTabs}
      tabOrder={tabOrder}
      sidebarMode={sidebarMode}
      metadataById={metadataById}
      keepAliveEntries={keepAliveEntries}
      canCloseActiveTab={canCloseActiveTab}
      canNavigateShell={canNavigateShell}
      canGoBack={activeMetadata?.canGoBack ?? false}
      canGoForward={activeMetadata?.canGoForward ?? false}
      onSidebarModeChange={setSidebarMode}
      onNavigate={navigation.navigateToView}
      onSelectProfile={navigation.handleSelectProfile}
      onTabOrderChange={setTabOrder}
      onCloseTab={handleCloseTab}
      onRecoverTab={handleRecoverTab}
      onOpenExternalTab={openExternalTab}
      onReloadActiveTab={handleReloadActiveTab}
      onStopActiveTab={handleStopActiveTab}
      onBackActiveTab={handleBackActiveTab}
      onForwardActiveTab={handleForwardActiveTab}
      onCloseActiveTab={handleCloseActiveTab}
      onOpenRuntimeSettings={() => setRuntimeSettingsOpen(true)}
      onOpenUserMenu={() => setUserMenuOpen(true)}
      sidebar={
        <DesktopSidebar
          mode={sidebarMode}
          view={navigation.view}
          navItems={NAV_ITEMS}
          updateState={updateState}
          updateError={updateError}
          updateVersion={updateVersion}
          downloadPercent={downloadPercent}
          onNavigate={navigation.navigateToView}
          onUpdate={handleUpdate}
        />
      }
      outlet={
        <WorkspaceOutlet
          view={navigation.view}
          activeProfile={navigation.activeProfile}
          officeVisited={navigation.officeVisited}
          onNavigate={navigation.navigateToView}
          onOpenRuntimeSettings={() => setRuntimeSettingsOpen(true)}
        />
      }
      statusBar={
        <StatusBar
          activeProfile={navigation.activeProfile}
          remoteMode={remoteMode}
          updateState={updateState}
        />
      }
      modalLayer={<ModalLayer />}
      drawerLayer={
        <>
          <DrawerLayer />
          <HermesRuntimeSettingsDrawer
            open={runtimeSettingsOpen}
            activeProfile={navigation.activeProfile}
            onClose={() => setRuntimeSettingsOpen(false)}
          />
          <UserMenuDrawer open={userMenuOpen} onClose={() => setUserMenuOpen(false)} />
          <ConfigDiffConfirmDrawer
            open={Boolean(pendingBootstrapDiff?.diff?.length)}
            result={pendingBootstrapDiff}
            onClose={() => setPendingBootstrapDiff(null)}
            onApplied={() => setPendingBootstrapDiff(null)}
          />
        </>
      }
    />
  );
}

export default Layout;
