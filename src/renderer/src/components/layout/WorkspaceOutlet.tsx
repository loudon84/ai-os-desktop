import Office from "../../screens/Office/Office";
import { WebOperatorScreen } from "../../screens/WebOperator/WebOperatorScreen";
import { AIOSWorkspaceScreen } from "../../screens/AIOSWorkspace/AIOSWorkspaceScreen";
import { AIOSHomeScreen } from "../../screens/AIOSHome/AIOSHomeScreen";
import { WebContentsHost } from "../shell/WebContentsHost";
import { KeepAliveView } from "./KeepAliveView";
import type { View } from "../../types/desktop-shell";

export interface WorkspaceOutletProps {
  view: View;
  activeProfile: string;
  officeVisited: boolean;
  onNavigate: (view: View) => void;
  onOpenRuntimeSettings?: () => void;
}

export function WorkspaceOutlet({
  view,
  activeProfile,
  officeVisited,
  onNavigate,
  onOpenRuntimeSettings,
}: WorkspaceOutletProps): React.JSX.Element {
  return (
    <>
      <KeepAliveView active={view === "aios-home"}>
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
          <AIOSHomeScreen
            onNavigate={onNavigate}
            onOpenRuntimeSettings={onOpenRuntimeSettings}
          />
        </div>
      </KeepAliveView>

      <KeepAliveView active={view === "aios-workspace"}>
        <AIOSWorkspaceScreen profile={activeProfile} />
      </KeepAliveView>

      <KeepAliveView active={view === "web-operator"}>
        <WebOperatorScreen />
      </KeepAliveView>

      {officeVisited ? (
        <KeepAliveView active={view === "office"}>
          <Office visible={view === "office"} />
        </KeepAliveView>
      ) : null}

      {typeof view === "string" && view.startsWith("external-browser:") ? (
        <WebContentsHost layerId={view} className="h-full w-full min-h-0" />
      ) : null}
    </>
  );
}
