import { useState, useEffect, useCallback } from "react";
import { RuntimeGuard } from "../../components/runtime/RuntimeGuard";
import { RuntimeStatusBar } from "../../components/runtime/RuntimeStatusBar";
import { Spinner } from "../../assets/icons";
import { useI18n } from "../../components/useI18n";
import type { View } from "../../types/desktop-shell";
import type { RuntimeServiceRecord } from "../../../../shared/aios/aios-contract";

export interface AIOSHomeScreenProps {
  onNavigate: (view: View) => void;
}

type GatewayPhase = "loading" | "guard" | "ready";

export function AIOSHomeScreen({ onNavigate }: AIOSHomeScreenProps): React.JSX.Element {
  const { t } = useI18n();
  const [phase, setPhase] = useState<GatewayPhase>("loading");
  const [services, setServices] = useState<RuntimeServiceRecord[]>([]);

  const refreshStatus = useCallback(async () => {
    try {
      const gatewayRunning = await window.hermesAPI.gatewayStatus();

      let svcList: RuntimeServiceRecord[] = [];
      try {
        const status = await window.aiosRuntime.getRuntimeStatus();
        svcList = status.services;
      } catch {
        /* aios runtime not available yet */
      }
      setServices(svcList);

      setPhase(gatewayRunning ? "ready" : "guard");
    } catch {
      setPhase("guard");
    }
  }, []);

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 10_000);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  useEffect(() => {
    try {
      const unsub = window.aiosRuntime.onAiOsRuntimeChanged(() => {
        refreshStatus();
      });
      return unsub;
    } catch {
      return undefined;
    }
  }, [refreshStatus]);

  if (phase === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner size={24} className="animate-spin text-zinc-500" />
      </div>
    );
  }

  if (phase === "guard") {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <RuntimeStatusBar services={services} />
        <RuntimeGuard gatewayStatus="stopped" onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <RuntimeStatusBar services={services} />
      <div className="flex flex-1 items-center justify-center bg-zinc-950">
        <div className="text-center space-y-3">
          <div className="text-sm text-zinc-400">
            {t("aiosHome.webAppPlaceholder")}
          </div>
          <p className="text-xs text-zinc-600">
            {t("aiosHome.webAppHint")}
          </p>
        </div>
      </div>
    </div>
  );
}
