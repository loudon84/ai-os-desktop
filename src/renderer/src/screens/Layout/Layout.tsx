import { useState, useEffect, useCallback, useMemo } from "react";
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
import { MainPage } from "../MainPage/MainPage";
import type { SidebarMode } from "../MainPage/main-page-types";
import { useExternalBrowserTabs } from "../MainPage/useExternalBrowserTabs";
import type { View } from "../../types/desktop-shell";
import { ModalLayer } from "../../components/layout/ModalLayer";
import { DrawerLayer } from "../../components/layout/DrawerLayer";
import { useDesktopNavigation } from "../../hooks/useDesktopNavigation";
import { useUpdateState } from "../../hooks/useUpdateState";
import { useRemoteMode } from "../../hooks/useRemoteMode";
import { useProfileEntries } from "../../hooks/useProfileEntries";
import type { NavItem } from "../../types/desktop-shell";

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
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>("expanded");
  const [tabOrder, setTabOrder] = useState<string[]>([]);
  const { externalTabs, openExternalTab, closeExternalTab, reloadExternalTab } =
    useExternalBrowserTabs();

  const draggableTabIds = useMemo(() => {
    const profileIds = profileEntries
      .filter((e) => e.enabled && e.entryType === "specialist-workspace")
      .map((e) => `profile-workspace:${e.profileId}`);
    const externalIds = externalTabs.map((t) => t.id);
    return [...profileIds, ...externalIds];
  }, [profileEntries, externalTabs]);

  useEffect(() => {
    setTabOrder((prev) => {
      const kept = prev.filter((id) => draggableTabIds.includes(id));
      const appended = draggableTabIds.filter((id) => !kept.includes(id));
      return [...kept, ...appended];
    });
  }, [draggableTabIds]);

  const canCloseActiveTab =
    typeof navigation.view === "string" &&
    navigation.view.startsWith("external-browser:");

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

  const handleReloadActiveTab = useCallback(() => {
    const active = navigation.view;

    if (active === "web-operator") {
      void window.aiosBrowser.reload();
      return;
    }

    if (typeof active === "string" && active.startsWith("external-browser:")) {
      const tab = externalTabs.find((item) => item.id === active);
      if (tab) void reloadExternalTab(tab);
    }
  }, [navigation.view, externalTabs, reloadExternalTab]);

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

  return (
    <MainPage
      activeProfile={navigation.activeProfile}
      activeView={navigation.view}
      profileEntries={profileEntries}
      externalTabs={externalTabs}
      tabOrder={tabOrder}
      sidebarMode={sidebarMode}
      canCloseActiveTab={canCloseActiveTab}
      onSidebarModeChange={setSidebarMode}
      onNavigate={navigation.navigateToView}
      onSelectProfile={navigation.handleSelectProfile}
      onTabOrderChange={setTabOrder}
      onCloseTab={handleCloseTab}
      onOpenExternalTab={openExternalTab}
      onReloadActiveTab={handleReloadActiveTab}
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
