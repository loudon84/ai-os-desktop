import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  ChatBubble,
  Clock,
  Users,
  Settings as SettingsIcon,
  Puzzle,
  Sparkles,
  Brain,
  Wrench,
  Signal,
  Building,
  Layers,
  KeyRound,
  Timer,
  Globe,
  Activity,
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
import { useDesktopNavigation } from "../../hooks/useDesktopNavigation";
import { useUpdateState } from "../../hooks/useUpdateState";
import { useRemoteMode } from "../../hooks/useRemoteMode";
import { useProfileEntries } from "../../hooks/useProfileEntries";
import type { NavItem } from "../../types/desktop-shell";
import type { MainPagePersistedState } from "../../../../shared/shell/main-page-state-contract";

const NAV_ITEMS: NavItem[] = [
  { view: "aios-home", icon: LayoutDashboard, labelKey: "navigation.aiosHome" },
  { view: "aios-workspace", icon: Grid, labelKey: "navigation.aiosWorkspace" },
  { view: "chat", icon: ChatBubble, labelKey: "navigation.chat" },
  { view: "sessions", icon: Clock, labelKey: "navigation.sessions" },
  { view: "agents", icon: Users, labelKey: "navigation.agents" },
  { view: "office", icon: Building, labelKey: "navigation.office" },
  { view: "models", icon: Layers, labelKey: "navigation.models" },
  { view: "providers", icon: KeyRound, labelKey: "navigation.providers" },
  { view: "skills", icon: Puzzle, labelKey: "navigation.skills" },
  { view: "soul", icon: Sparkles, labelKey: "navigation.soul" },
  { view: "memory", icon: Brain, labelKey: "navigation.memory" },
  { view: "tools", icon: Wrench, labelKey: "navigation.tools" },
  { view: "schedules", icon: Timer, labelKey: "navigation.schedules" },
  { view: "gateway", icon: Signal, labelKey: "navigation.gateway" },
  { view: "runtime-setup", icon: Activity, labelKey: "navigation.runtimeSetup" },
  { view: "web-operator", icon: Globe, labelKey: "navigation.webOperator" },
  { view: "settings", icon: SettingsIcon, labelKey: "navigation.settings" },
];

function isValidRestoredView(
  view: string | undefined,
  tabOrder: string[],
  externalTabIds: string[],
): view is View {
  if (!view) return false;
  const known: View[] = [
    "aios-home",
    "aios-workspace",
    "chat",
    "sessions",
    "agents",
    "office",
    "models",
    "providers",
    "skills",
    "soul",
    "memory",
    "tools",
    "schedules",
    "gateway",
    "runtime-setup",
    "web-operator",
    "profile-runtime",
    "settings",
  ];
  if (known.includes(view as View)) return true;
  if (view.startsWith("profile-workspace:") && tabOrder.includes(view)) return true;
  if (view.startsWith("external-browser:") && externalTabIds.includes(view)) {
    return true;
  }
  return false;
}

function Layout(): React.JSX.Element {
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
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { externalTabs, openExternalTab, closeExternalTab, restoreExternalTabs } =
    useExternalBrowserTabs();

  const draggableTabIds = useMemo(() => {
    const profileIds = profileEntries
      .filter((e) => e.enabled && e.entryType === "specialist-workspace")
      .map((e) => `profile-workspace:${e.profileId}`);
    const externalIds = externalTabs.map((t) => t.id);
    return [...profileIds, ...externalIds];
  }, [profileEntries, externalTabs]);

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
        if (
          isValidRestoredView(state.lastActiveView, state.tabOrder, externalIds)
        ) {
          navigation.navigateToView(state.lastActiveView);
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
      sidebar={
        <DesktopSidebar
          mode={sidebarMode}
          view={navigation.view}
          navItems={NAV_ITEMS}
          profileEntries={profileEntries}
          activeProfile={navigation.activeProfile}
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
          remoteMode={remoteMode}
          activeProfile={navigation.activeProfile}
          messages={navigation.messages}
          setMessages={navigation.setMessages}
          currentSessionId={navigation.currentSessionId}
          officeVisited={navigation.officeVisited}
          onNewChat={navigation.handleNewChat}
          onResumeSession={navigation.handleResumeSession}
          onSelectProfile={navigation.handleSelectProfile}
          onChatWithProfile={(name) => {
            navigation.handleSelectProfile(name);
            navigation.setView("chat");
          }}
          onNavigate={navigation.navigateToView}
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
      drawerLayer={<DrawerLayer />}
    />
  );
}

export default Layout;
