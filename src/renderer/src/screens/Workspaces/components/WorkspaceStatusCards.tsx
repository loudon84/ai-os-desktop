import { ArrowDownToLine, ArrowUpFromLine, Settings } from "lucide-react";
import { useI18n } from "../../../components/useI18n";
import { useWorkspaces } from "../context/WorkspacesContext";
import { ProfileStatusBadge } from "./ProfileStatusBadge";

export interface WorkspaceStatusCardsProps {
  onOpenSettings?: () => void;
}

export function WorkspaceStatusCards({
  onOpenSettings,
}: WorkspaceStatusCardsProps): React.JSX.Element {
  const { t } = useI18n();
  const { profiles, activeProfileId, setActiveProfileId } = useWorkspaces();

  return (
    <header className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-gray-800 px-3 py-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {profiles.map((p) => {
          const active = p.id === activeProfileId;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setActiveProfileId(p.id)}
              className={`flex min-w-[140px] max-w-[200px] shrink-0 flex-col rounded-lg border px-3 py-2 text-left transition-colors ${
                active
                  ? "border-blue-500/60 bg-blue-500/10"
                  : "border-gray-800 bg-gray-900/50 hover:border-gray-700"
              }`}
            >
              <span className="truncate text-sm font-medium text-gray-100">{p.displayName}</span>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <ProfileStatusBadge status={p.status} />
                <span className="text-[10px] text-gray-500">
                  {t("workspaces.runtime.port", { defaultValue: "Port" })}: {p.gatewayPort}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex shrink-0 items-center gap-1.5 border-l border-gray-800 pl-2">
        <button
          type="button"
          onClick={() => onOpenSettings?.()}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-700 bg-gray-900 px-2.5 py-1.5 text-xs text-gray-200 hover:bg-gray-800"
          title={t("workspaces.statusCards.settings", { defaultValue: "Settings" })}
        >
          <Settings className="h-3.5 w-3.5" />
          {t("workspaces.statusCards.settings", { defaultValue: "Settings" })}
        </button>
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-1 rounded-md border border-gray-800 px-2 py-1.5 text-xs text-gray-500"
          title={t("workspaces.statusCards.gitDisabled", {
            defaultValue: "Git sync not connected yet",
          })}
        >
          <ArrowDownToLine className="h-3.5 w-3.5" />
          {t("workspaces.statusCards.gitPull", { defaultValue: "Pull" })}
        </button>
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-1 rounded-md border border-gray-800 px-2 py-1.5 text-xs text-gray-500"
          title={t("workspaces.statusCards.gitDisabled", {
            defaultValue: "Git sync not connected yet",
          })}
        >
          <ArrowUpFromLine className="h-3.5 w-3.5" />
          {t("workspaces.statusCards.gitPush", { defaultValue: "Push" })}
        </button>
      </div>
    </header>
  );
}
