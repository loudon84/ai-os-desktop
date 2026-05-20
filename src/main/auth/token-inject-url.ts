import { getAiOsEnvConfig } from "../aios/aios-config";
import { AIOS_HOME_PARTITION } from "../../shared/shell/browser-partitions";

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost"]);

export function getTokenInjectPorts(): Set<number> {
  const config = getAiOsEnvConfig();
  return new Set([config.frontendPort, config.backendPort]);
}

/** Whether to attach Authorization for aios-home partition requests. */
export function shouldInjectTokenForUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!LOCAL_HOSTS.has(parsed.hostname)) return false;
    const port = parsed.port
      ? Number(parsed.port)
      : parsed.protocol === "https:"
        ? 443
        : 80;
    return getTokenInjectPorts().has(port);
  } catch {
    return false;
  }
}

export const TOKEN_INJECT_PARTITIONS = [AIOS_HOME_PARTITION] as const;
