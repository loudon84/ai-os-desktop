import { CopilotServeRuntimeSection } from "../../../modules/hermes-runtime/sections/CopilotServeRuntimeSection";
import type { SettingsDrawerPanel } from "../settings-drawer-types";
import type { View } from "../../../types/desktop-shell";
import { ConnectionSection } from "./ConnectionSection";
import { GlobalProfileSection } from "./GlobalProfileSection";
import { HermesAgentSection } from "./HermesAgentSection";

export interface ServerPanelProps {
  activeProfile: string;
  onSelectProfile: (name: string) => void;
  onOpenPanel: (panel: SettingsDrawerPanel) => void;
  onNavigate: (view: View) => void;
}

export function ServerPanel({
  activeProfile,
  onSelectProfile,
  onOpenPanel,
  onNavigate,
}: ServerPanelProps): React.JSX.Element {
  return (
    <div className="settings-drawer-scroll settings-drawer-padded">
      <div className="settings-container">
        <GlobalProfileSection
          activeProfile={activeProfile}
          onSelectProfile={onSelectProfile}
          onOpenPanel={onOpenPanel}
          onNavigate={onNavigate}
        />
        <HermesAgentSection profile={activeProfile} />
        <CopilotServeRuntimeSection />
        <ConnectionSection />
      </div>
    </div>
  );
}
