import { X } from "lucide-react";
import { useI18n } from "../../components/useI18n";
import { AuthPanel } from "./AuthPanel";
import { HermesRuntimePanel } from "./HermesRuntimePanel";
import { ProfilesPanel } from "./ProfilesPanel";
import { UserConfigSyncPanel } from "./UserConfigSyncPanel";
import type { SettingsDrawerPanel } from "./settings-drawer-types";
import { SETTINGS_DRAWER_PANELS } from "./settings-drawer-types";

export interface SettingsDrawerProps {
  open: boolean;
  panel: SettingsDrawerPanel;
  activeProfile: string;
  onPanelChange: (panel: SettingsDrawerPanel) => void;
  onClose: () => void;
}

const PANEL_LABEL_KEYS: Record<SettingsDrawerPanel, string> = {
  account: "auth.account",
  runtime: "runtimeSettings.title",
  profiles: "runtimeSettings.profiles",
  desktop: "auth.configSync",
};

export function SettingsDrawer({
  open,
  panel,
  activeProfile,
  onPanelChange,
  onClose,
}: SettingsDrawerProps): React.JSX.Element | null {
  const { t } = useI18n();

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/50"
        aria-label={t("auth.configDiffCancel")}
        onClick={onClose}
      />
      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-2xl flex-col border-l border-zinc-800 bg-zinc-950 shadow-xl"
        role="dialog"
        aria-label={t("runtimeSettings.title", { defaultValue: "Settings" })}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-100">
            {t("runtimeSettings.title", { defaultValue: "Settings" })}
          </h2>
          <button
            type="button"
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>
        <div className="flex min-h-0 flex-1">
          <nav className="flex w-44 shrink-0 flex-col border-r border-zinc-800 p-2">
            {SETTINGS_DRAWER_PANELS.map((id) => (
              <button
                key={id}
                type="button"
                className={`rounded px-3 py-2 text-left text-xs ${
                  panel === id
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                }`}
                onClick={() => onPanelChange(id)}
              >
                {t(PANEL_LABEL_KEYS[id], { defaultValue: id })}
              </button>
            ))}
          </nav>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {panel === "account" ? <AuthPanel onClose={onClose} /> : null}
            {panel === "runtime" ? (
              <HermesRuntimePanel activeProfile={activeProfile} />
            ) : null}
            {panel === "profiles" ? <ProfilesPanel /> : null}
            {panel === "desktop" ? <UserConfigSyncPanel /> : null}
          </div>
        </div>
      </aside>
    </>
  );
}
