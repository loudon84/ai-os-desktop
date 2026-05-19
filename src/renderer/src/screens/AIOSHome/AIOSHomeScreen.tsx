import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { RuntimeGuard } from "../../components/runtime/RuntimeGuard";
import { RuntimeStatusBar } from "../../components/runtime/RuntimeStatusBar";
import { WebContentsHost } from "../../components/shell/WebContentsHost";
import type { View } from "../../types/desktop-shell";
import type { RuntimeServiceRecord } from "../../../../shared/aios/aios-contract";

export interface AIOSHomeScreenProps {
  onNavigate: (view: View) => void;
}

export function AIOSHomeScreen({ onNavigate }: AIOSHomeScreenProps): React.JSX.Element {
  const { t } = useTranslation("aiosHome");
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<RuntimeServiceRecord[]>([]);
  const [statusError, setStatusError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      const snapshot = await window.aiosRuntime.getRuntimeSnapshot();
      setServices(snapshot.services);
      setStatusError(null);
    } catch (err) {
      console.warn("[AIOSHome] Failed to refresh AI-OS runtime snapshot:", err);
      setStatusError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
    const interval = setInterval(() => {
      void refreshStatus();
    }, 10_000);
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
  const frontendRecord = services.find((s) => s.service_id === "aios-frontend");

  const gatewayStatus =
    gatewayRecord?.status === "running"
      ? "running"
      : gatewayRecord?.status === "error"
        ? "error"
        : "stopped";

  const frontendKnownDown =
    !loading &&
    statusError === null &&
    services.length > 0 &&
    frontendRecord?.status !== "running";

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <RuntimeStatusBar services={services} loading={loading} />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {frontendKnownDown ? (
          <RuntimeGuard
            gatewayStatus={gatewayStatus}
            onNavigate={onNavigate}
            onStarted={refreshStatus}
          />
        ) : (
          <WebContentsHost
            layerId="aios-home"
            className="h-full w-full min-h-0"
          />
        )}
      </div>
    </div>
  );
}
