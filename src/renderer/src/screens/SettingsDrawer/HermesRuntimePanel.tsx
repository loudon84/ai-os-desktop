import { HermesRuntimeSettings } from "../../modules/hermes-runtime/HermesRuntimeSettings";

export interface HermesRuntimePanelProps {
  activeProfile: string;
}

export function HermesRuntimePanel({
  activeProfile,
}: HermesRuntimePanelProps): React.JSX.Element {
  return (
    <div className="min-h-0 flex-1 overflow-hidden">
      <HermesRuntimeSettings activeProfile={activeProfile} />
    </div>
  );
}
