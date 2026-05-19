import Chat, { type ChatMessage } from "../../screens/Chat/Chat";
import Sessions from "../../screens/Sessions/Sessions";
import Agents from "../../screens/Agents/Agents";
import Settings from "../../screens/Settings/Settings";
import Skills from "../../screens/Skills/Skills";
import Soul from "../../screens/Soul/Soul";
import Memory from "../../screens/Memory/Memory";
import Tools from "../../screens/Tools/Tools";
import Gateway from "../../screens/Gateway/Gateway";
import Office from "../../screens/Office/Office";
import Models from "../../screens/Models/Models";
import Providers from "../../screens/Providers/Providers";
import Schedules from "../../screens/Schedules/Schedules";
import RemoteNotice from "../RemoteNotice";
import { WebOperatorScreen } from "../../screens/WebOperator/WebOperatorScreen";
import { ProfileRuntimeScreen } from "../../screens/ProfileRuntime/ProfileRuntimeScreen";
import { AIOSWorkspaceScreen } from "../../screens/AIOSWorkspace/AIOSWorkspaceScreen";
import { ProfileWorkspaceScreen } from "../../screens/ProfileWorkspace/ProfileWorkspaceScreen";
import { RuntimeSetupScreen } from "../../screens/RuntimeSetup/RuntimeSetupScreen";
import { AIOSHomeScreen } from "../../screens/AIOSHome/AIOSHomeScreen";
import { WebContentsHost } from "../shell/WebContentsHost";
import { KeepAliveView } from "./KeepAliveView";
import type { View } from "../../types/desktop-shell";

export interface WorkspaceOutletProps {
  view: View;
  remoteMode: boolean;
  activeProfile: string;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  currentSessionId: string | null;
  officeVisited: boolean;
  onNewChat: () => void;
  onResumeSession: (sessionId: string) => Promise<void>;
  onSelectProfile: (name: string) => void;
  onChatWithProfile: (name: string) => void;
  onNavigate: (view: View) => void;
}

export function WorkspaceOutlet({
  view,
  remoteMode,
  activeProfile,
  messages,
  setMessages,
  currentSessionId,
  officeVisited,
  onNewChat,
  onResumeSession,
  onSelectProfile,
  onChatWithProfile,
  onNavigate,
}: WorkspaceOutletProps): React.JSX.Element {
  return (
    <>
      <KeepAliveView active={view === "aios-home"}>
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            overflow: "hidden",
            minHeight: 0,
          }}
        >
          <AIOSHomeScreen onNavigate={onNavigate} />
        </div>
      </KeepAliveView>

      <KeepAliveView active={view === "chat"}>
        <Chat
          messages={messages}
          setMessages={setMessages}
          sessionId={currentSessionId}
          profile={activeProfile}
          onNewChat={onNewChat}
        />
      </KeepAliveView>

      <KeepAliveView active={view === "sessions"}>
        {remoteMode ? (
          <RemoteNotice feature="Sessions" />
        ) : (
          <Sessions
            onResumeSession={onResumeSession}
            onNewChat={onNewChat}
            currentSessionId={currentSessionId}
          />
        )}
      </KeepAliveView>

      <KeepAliveView active={view === "agents"}>
        {remoteMode ? (
          <RemoteNotice feature="Profiles" />
        ) : (
          <Agents
            activeProfile={activeProfile}
            onSelectProfile={onSelectProfile}
            onChatWith={onChatWithProfile}
          />
        )}
      </KeepAliveView>

      {officeVisited ? (
        <KeepAliveView active={view === "office"}>
          <Office visible={view === "office"} />
        </KeepAliveView>
      ) : null}

      <KeepAliveView active={view === "models"}>
        <Models />
      </KeepAliveView>

      <KeepAliveView active={view === "providers"}>
        {remoteMode ? (
          <RemoteNotice feature="Providers" />
        ) : (
          <Providers profile={activeProfile} visible={view === "providers"} />
        )}
      </KeepAliveView>

      <KeepAliveView active={view === "skills"}>
        {remoteMode ? (
          <RemoteNotice feature="Skills" />
        ) : (
          <Skills profile={activeProfile} />
        )}
      </KeepAliveView>

      <KeepAliveView active={view === "soul"}>
        {remoteMode ? (
          <RemoteNotice feature="Persona" />
        ) : (
          <Soul profile={activeProfile} />
        )}
      </KeepAliveView>

      <KeepAliveView active={view === "memory"}>
        {remoteMode ? (
          <RemoteNotice feature="Memory" />
        ) : (
          <Memory profile={activeProfile} />
        )}
      </KeepAliveView>

      <KeepAliveView active={view === "tools"}>
        {remoteMode ? (
          <RemoteNotice feature="Tools" />
        ) : (
          <Tools profile={activeProfile} />
        )}
      </KeepAliveView>

      <KeepAliveView active={view === "schedules"}>
        <Schedules profile={activeProfile} />
      </KeepAliveView>

      <KeepAliveView active={view === "gateway"}>
        {remoteMode ? (
          <RemoteNotice feature="Gateway" />
        ) : (
          <Gateway profile={activeProfile} />
        )}
      </KeepAliveView>

      <KeepAliveView active={view === "settings"}>
        <Settings profile={activeProfile} />
      </KeepAliveView>

      <KeepAliveView active={view === "web-operator"}>
        <WebOperatorScreen />
      </KeepAliveView>
      <KeepAliveView active={view === "runtime-setup"}>
        <RuntimeSetupScreen />
      </KeepAliveView>
      <KeepAliveView active={view === "profile-runtime"}>
        <ProfileRuntimeScreen />
      </KeepAliveView>
      <KeepAliveView active={view === "aios-workspace"}>
        <AIOSWorkspaceScreen profile="default" />
      </KeepAliveView>
      {typeof view === "string" && view.startsWith("profile-workspace:") && (
        <ProfileWorkspaceScreen profileId={view.split(":")[1]} />
      )}
      {typeof view === "string" && view.startsWith("external-browser:") && (
        <WebContentsHost layerId={view} className="h-full w-full min-h-0" />
      )}
    </>
  );
}
