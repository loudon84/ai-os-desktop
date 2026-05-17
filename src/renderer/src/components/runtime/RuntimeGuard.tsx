import { useState, useCallback } from "react";
import { Signal, Play, Settings as SettingsIcon, FileText, Activity } from "../../assets/icons";
import { Spinner } from "../../assets/icons";
import { useI18n } from "../useI18n";
import type { View } from "../../types/desktop-shell";

export interface RuntimeGuardProps {
  gatewayStatus: string;
  onNavigate: (view: View) => void;
}

export function RuntimeGuard({ gatewayStatus, onNavigate }: RuntimeGuardProps): React.JSX.Element {
  const { t } = useI18n();
  const [starting, setStarting] = useState(false);

  const handleStartGateway = useCallback(async () => {
    setStarting(true);
    try {
      await window.hermesAPI.startGateway();
    } catch {
      // status will update via polling
    } finally {
      setStarting(false);
    }
  }, []);

  return (
    <div className="flex h-full min-h-0 items-center justify-center overflow-auto p-8">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            <Signal size={28} className="text-zinc-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-zinc-100">
            {t("runtimeGuard.title")}
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            {t("runtimeGuard.description")}
          </p>
        </div>

        {gatewayStatus === "error" && (
          <div className="px-4 py-3 rounded-lg bg-red-900/20 border border-red-800/40 text-xs text-red-300">
            {t("runtimeGuard.gatewayError")}
          </div>
        )}

        <div className="space-y-2">
          <button
            type="button"
            disabled={starting}
            onClick={handleStartGateway}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-white transition-colors"
          >
            {starting ? <Spinner size={14} className="animate-spin" /> : <Play size={14} />}
            {t("runtimeGuard.startGateway")}
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onNavigate("runtime-setup")}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition-colors"
            >
              <SettingsIcon size={13} />
              {t("runtimeGuard.openSetup")}
            </button>
            <button
              type="button"
              onClick={() => onNavigate("gateway")}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition-colors"
            >
              <FileText size={13} />
              {t("runtimeGuard.viewLogs")}
            </button>
          </div>

          <button
            type="button"
            onClick={() => onNavigate("runtime-setup")}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg hover:bg-zinc-800/60 text-xs text-zinc-500 transition-colors"
          >
            <Activity size={13} />
            {t("runtimeGuard.runDiagnostics")}
          </button>
        </div>
      </div>
    </div>
  );
}
