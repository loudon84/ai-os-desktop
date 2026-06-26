import "./Hermes.css";
import { HermesDefaultProvider } from "./context/HermesDefaultContext";
import { HermesExpertsProvider } from "./context/HermesExpertsContext";
import { HermesWorkspaceProvider } from "./context/HermesWorkspaceContext";
import { HermesShell } from "./panels/HermesShell";

export interface HermesScreenProps {
  activePanel?: string;
  onPanelChange?: (panel: string) => void;
  onOpenRuntimeSettings?: () => void;
}

export function HermesScreen({
  activePanel,
  onPanelChange,
  onOpenRuntimeSettings,
}: HermesScreenProps) {
  return (
    <HermesDefaultProvider>
      <HermesWorkspaceProvider>
        <HermesExpertsProvider>
          <HermesShell
            activePanel={activePanel}
            onPanelChange={onPanelChange}
            onOpenRuntimeSettings={onOpenRuntimeSettings}
          />
        </HermesExpertsProvider>
      </HermesWorkspaceProvider>
    </HermesDefaultProvider>
  );
}
