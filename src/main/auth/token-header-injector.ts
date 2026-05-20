import { session } from "electron";
import { readEncryptedSession } from "./token-store";
import {
  shouldInjectTokenForUrl,
  TOKEN_INJECT_PARTITIONS,
} from "./token-inject-url";

/**
 * Injects Authorization for local AI-OS frontend/backend only.
 * Does NOT attach to web-operator or external-browser partitions.
 */
export function installTokenHeaderInjector(): void {
  for (const partition of TOKEN_INJECT_PARTITIONS) {
    const ses = session.fromPartition(partition);
    ses.webRequest.onBeforeSendHeaders((details, callback) => {
      if (!shouldInjectTokenForUrl(details.url)) {
        callback({ requestHeaders: details.requestHeaders });
        return;
      }

      const internal = readEncryptedSession();
      const token = internal?.accessToken;
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
