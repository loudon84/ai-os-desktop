import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { RuntimeGuard } from "../../components/runtime/RuntimeGuard";
import { RuntimeStatusBar } from "../../components/runtime/RuntimeStatusBar";
import { WebContentsHost } from "../../components/shell/WebContentsHost";
import { Spinner } from "../../assets/icons";
import type { View } from "../../types/desktop-shell";
import type { RuntimeServiceRecord } from "../../../../shared/aios/aios-contract";

export interface AIOSHomeScreenProps {
  onNavigate: (view: View) => void;
}

export function AIOSHomeScreen({ onNavigate }: AIOSHomeScreenProps): React.JSX.Element {
  const { t } = useTranslation("aiosHome");
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [services, setServices] = useState<RuntimeServiceRecord[]>([]);

  const refreshStatus = useCallback(async () => {
    try {
      const snapshot = await window.hermesAPI.getAiOsRuntimeSnapshot();
      setServices(snapshot.services);
      setReady(snapshot.ready);
    } catch {
      setReady(false);
    } finally {
      setLoading(false);
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
        void refreshStatus();
      });
      return unsub;
    } catch {
      return undefined;
    }
  }, [refreshStatus]);

  const gatewayRecord = services.find((s) => s.service_id === "hermes-gateway");
  const gatewayStatus =
    gatewayRecord?.status === "running"
      ? "running"
      : gatewayRecord?.status === "error"
        ? "error"
        : "stopped";

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <RuntimeStatusBar services={services} loading={loading} />
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden">
        <div className="flex h-[90%] w-full max-h-full min-h-0 flex-col overflow-hidden">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Spinner size={24} className="animate-spin text-zinc-500" />
              <span className="sr-only">{t("loadingRuntime")}</span>
            </div>
          ) : ready ? (
            <WebContentsHost layerId="aios-home" className="h-full w-full" />
          ) : (
            <RuntimeGuard gatewayStatus={gatewayStatus} onNavigate={onNavigate} onStarted={refreshStatus} />
          )}
        </div>
      </div>
    </div>
  );
}
