import { X } from "lucide-react";
import { HermesRuntimeSettings } from "./HermesRuntimeSettings";

export interface HermesRuntimeSettingsDrawerProps {
  open: boolean;
  activeProfile: string;
  onClose: () => void;
}

export function HermesRuntimeSettingsDrawer({
  open,
  activeProfile,
  onClose,
}: HermesRuntimeSettingsDrawerProps): React.JSX.Element | null {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/50"
        aria-label="Close runtime settings"
        onClick={onClose}
      />
      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-zinc-800 bg-zinc-950 shadow-xl"
        role="dialog"
        aria-label="Hermes Runtime Settings"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-100">Hermes Runtime Settings</h2>
          <button
            type="button"
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-hidden">
          <HermesRuntimeSettings activeProfile={activeProfile} />
        </div>
      </aside>
    </>
  );
}
