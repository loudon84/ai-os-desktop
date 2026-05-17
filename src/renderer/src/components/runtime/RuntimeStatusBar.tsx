import { Circle } from "../../assets/icons";
import { useI18n } from "../useI18n";
import type { RuntimeServiceRecord, RuntimeServiceStatus } from "../../../../shared/aios/aios-contract";

export interface RuntimeStatusBarProps {
  services: RuntimeServiceRecord[];
}

const STATUS_COLORS: Record<RuntimeServiceStatus, string> = {
  running: "text-emerald-400",
  starting: "text-amber-400",
  stopping: "text-amber-400",
  degraded: "text-amber-400",
  stopped: "text-zinc-500",
  error: "text-red-400",
  unknown: "text-zinc-500",
  not_installed: "text-zinc-600",
  installed: "text-zinc-400",
  configuring: "text-amber-400",
};

export function RuntimeStatusBar({ services }: RuntimeStatusBarProps): React.JSX.Element {
  const { t } = useI18n();

  if (services.length === 0) {
    return (
      <div className="flex items-center gap-4 px-4 py-2 bg-zinc-900/60 border-b border-zinc-800 text-xs text-zinc-500">
        {t("aiosHome.noServices")}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-zinc-900/60 border-b border-zinc-800 text-xs">
      {services.map((svc) => (
        <div key={svc.service_id} className="flex items-center gap-1.5">
          <Circle size={7} className={`fill-current ${STATUS_COLORS[svc.status]}`} />
          <span className="text-zinc-300">{svc.display_name}</span>
          <span className="text-zinc-500">{svc.status}</span>
        </div>
      ))}
    </div>
  );
}
