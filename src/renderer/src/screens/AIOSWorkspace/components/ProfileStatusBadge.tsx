import { useI18n } from "../../../components/useI18n";
import type { ProfileRuntimeStatus } from "../types";

const STATUS_STYLES: Record<ProfileRuntimeStatus, string> = {
  running: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  stopped: "bg-gray-700/50 text-gray-400 border-gray-600",
  starting: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  stopping: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  error: "bg-red-500/20 text-red-400 border-red-500/40",
  not_deployed: "bg-gray-700/50 text-gray-500 border-gray-600",
  failed: "bg-red-500/20 text-red-400 border-red-500/40",
};

export function ProfileStatusBadge({
  status,
}: {
  status: ProfileRuntimeStatus;
}): React.JSX.Element {
  const { t } = useI18n();
  const labelKey = `aiosWorkspace.status.${status}`;
  return (
    <span
      className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${STATUS_STYLES[status]}`}
    >
      {t(labelKey, { defaultValue: status })}
    </span>
  );
}
