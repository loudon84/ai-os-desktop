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
      {view === "aios-home" && <AIOSHomeScreen onNavigate={onNavigate} />}
      <div
        style={{
          display: view === "chat" ? "flex" : "none",
          flex: 1,
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Chat
          messages={messages}
          setMessages={setMessages}
          sessionId={currentSessionId}
          profile={activeProfile}
          onNewChat={onNewChat}
        />
      </div>
      {view === "sessions" &&
        (remoteMode ? (
          <RemoteNotice feature="Sessions" />
        ) : (
          <Sessions
            onResumeSession={onResumeSession}
            onNewChat={onNewChat}
            currentSessionId={currentSessionId}
          />
        ))}
      {view === "agents" &&
        (remoteMode ? (
          <RemoteNotice feature="Profiles" />
        ) : (
          <Agents
            activeProfile={activeProfile}
            onSelectProfile={onSelectProfile}
            onChatWith={onChatWithProfile}
          />
        ))}
      {officeVisited && (
        <div
          style={{
            display: view === "office" ? "flex" : "none",
            flex: 1,
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Office visible={view === "office"} />
        </div>
      )}
      {view === "models" && <Models />}
      <div
        style={{
          display: view === "providers" ? "flex" : "none",
          flex: 1,
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {remoteMode ? (
          view === "providers" && <RemoteNotice feature="Providers" />
        ) : (
          <Providers profile={activeProfile} visible={view === "providers"} />
        )}
      </div>
      {view === "skills" &&
        (remoteMode ? (
          <RemoteNotice feature="Skills" />
        ) : (
          <Skills profile={activeProfile} />
        ))}
      {view === "soul" &&
        (remoteMode ? (
          <RemoteNotice feature="Persona" />
        ) : (
          <Soul profile={activeProfile} />
        ))}
      {view === "memory" &&
        (remoteMode ? (
          <RemoteNotice feature="Memory" />
        ) : (
          <Memory profile={activeProfile} />
        ))}
      {view === "tools" &&
        (remoteMode ? (
          <RemoteNotice feature="Tools" />
        ) : (
          <Tools profile={activeProfile} />
        ))}
      {view === "schedules" && <Schedules profile={activeProfile} />}
      {view === "gateway" &&
        (remoteMode ? (
          <RemoteNotice feature="Gateway" />
        ) : (
          <Gateway profile={activeProfile} />
        ))}
      {view === "web-operator" && <WebOperatorScreen />}
      {view === "runtime-setup" && <RuntimeSetupScreen />}
      {view === "profile-runtime" && <ProfileRuntimeScreen />}
      {view === "aios-workspace" && <AIOSWorkspaceScreen profile="default" />}
      {typeof view === "string" && view.startsWith("profile-workspace:") && (
        <ProfileWorkspaceScreen profileId={view.split(":")[1]} />
      )}
      <div
        style={{
          display: view === "settings" ? "flex" : "none",
          flex: 1,
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Settings profile={activeProfile} />
      </div>
    </>
  );
}
