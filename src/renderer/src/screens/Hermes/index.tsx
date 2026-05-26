import "./Hermes.css";
import { HermesDefaultProvider } from "./context/HermesDefaultContext";
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
      <HermesShell
        activePanel={activePanel}
        onPanelChange={onPanelChange}
        onOpenRuntimeSettings={onOpenRuntimeSettings}
      />
    </HermesDefaultProvider>
  );
}
