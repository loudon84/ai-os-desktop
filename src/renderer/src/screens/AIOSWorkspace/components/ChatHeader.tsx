import { useI18n } from "../../../components/useI18n";
import { ProfileStatusBadge } from "./ProfileStatusBadge";
import { useAIOSWorkspace } from "../context/AIOSWorkspaceContext";

export function ChatHeader({
  sessionTitle,
  isDraft,
}: {
  sessionTitle?: string;
  isDraft?: boolean;
}): React.JSX.Element {
  const { t } = useI18n();
  const { activeProfile } = useAIOSWorkspace();
  if (!activeProfile) {
    return (
      <div className="border-b border-gray-800 px-4 py-3 text-sm text-gray-500">
        {t("aiosWorkspace.noProfile", { defaultValue: "No profile selected" })}
      </div>
    );
  }
  const subtitle =
    isDraft || !sessionTitle
      ? t("aiosWorkspace.sessions.newDraft", { defaultValue: "New conversation" })
      : sessionTitle;

  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-800 px-4 py-3">
      <div className="min-w-0">
        <h2 className="truncate text-sm font-semibold text-gray-100">{activeProfile.displayName}</h2>
        <p className="truncate text-xs text-gray-500">{subtitle}</p>
      </div>
      <ProfileStatusBadge status={activeProfile.status} />
    </div>
  );
}
