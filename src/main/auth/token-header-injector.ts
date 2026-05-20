import { session } from "electron";
import { getCachedAccessToken } from "./token-store";
import { shouldInjectTokenForUrl, TOKEN_INJECT_PARTITIONS } from "./token-inject-url";

/**
 * Injects Authorization for aios-home partition only, on whitelisted origins.
 * Does NOT attach to web-operator, external-browser, office, or aios-workspace.
 */
export function installTokenHeaderInjector(): void {
  for (const partition of TOKEN_INJECT_PARTITIONS) {
    const ses = session.fromPartition(partition);
    ses.webRequest.onBeforeSendHeaders((details, callback) => {
      if (!shouldInjectTokenForUrl(details.url)) {
        callback({ requestHeaders: details.requestHeaders });
        return;
      }

      const token = getCachedAccessToken();
      if (!token) {
        callback({ requestHeaders: details.requestHeaders });
        return;
      }

      const headers = { ...details.requestHeaders };
      headers.Authorization = `Bearer ${token}`;
      callback({ requestHeaders: headers });
    });
  }

  console.log("[auth] Token header injector installed for aios-home partition");
}

export async function beforeLoadAiosHome(): Promise<void> {
  const { readAuthEndpointConfig } = await import("./auth-endpoint-config-store");
  const { readStoredSession, hydrateTokenStore } = await import("./token-store");
  const { updateTokenInjectionPolicy } = await import("./token-injection-policy");

  await hydrateTokenStore();
  const endpointConfig = readAuthEndpointConfig();
  const session = await readStoredSession();
  updateTokenInjectionPolicy(endpointConfig, Boolean(session?.accessToken));
}
