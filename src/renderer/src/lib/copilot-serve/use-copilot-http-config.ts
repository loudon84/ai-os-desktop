import { useCallback, useEffect, useState } from "react";
import type { CopilotServeHttpConfig } from "./http-client";

export function useCopilotHttpConfig(): {
  config: CopilotServeHttpConfig | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const [config, setConfig] = useState<CopilotServeHttpConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let status = await window.copilotServe.getStatus();
      if (status.status !== "running") {
        status = await window.copilotServe.start();
      }
      const connection = await window.copilotServe.getConnection();
      if (!connection) {
        throw new Error(status.lastError ?? "copilot-serve 未连接");
      }
      setConfig({ baseUrl: connection.baseUrl, token: connection.token });
    } catch (err) {
      setConfig(null);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { config, loading, error, refresh };
}
