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
} from "../../assets/icons";
import { DesktopShell } from "../../components/layout/DesktopShell";
import { DesktopSidebar } from "../../components/layout/DesktopSidebar";
import { WorkspaceOutlet } from "../../components/layout/WorkspaceOutlet";
import { PageHeader } from "../../components/layout/PageHeader";
import { StatusBar } from "../../components/layout/StatusBar";
import { ModalLayer } from "../../components/layout/ModalLayer";
import { DrawerLayer } from "../../components/layout/DrawerLayer";
import { useDesktopNavigation } from "../../hooks/useDesktopNavigation";
import { useUpdateState } from "../../hooks/useUpdateState";
import { useRemoteMode } from "../../hooks/useRemoteMode";
import { useProfileEntries } from "../../hooks/useProfileEntries";
import type { NavItem } from "../../types/desktop-shell";

const NAV_ITEMS: NavItem[] = [
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

  return (
    <DesktopShell
      sidebar={
        <DesktopSidebar
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
      header={
        <PageHeader view={navigation.view} activeProfile={navigation.activeProfile} />
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
