import { readAuthEndpointConfig } from "../auth/auth-endpoint-config-store";
import {
  readBootstrapState,
  readLocalBootstrapConfig,
} from "../user-config/user-config-store";
import { getDefaultAuthEndpointConfig } from "../../shared/auth/auth-url";

/**
 * Resolve AI-OS Home URL for WebContentsView load.
 * Priority: applied bootstrap config → saved endpoint config → default.
 */
export function resolveAiosHomeUrl(): string {
  const local = readLocalBootstrapConfig();
  if (local?.aios.aiosHomeUrl) {
    return local.aios.aiosHomeUrl;
  }
  if (local?.aios.frontendUrl) {
    return local.aios.frontendUrl;
  }

  const endpoint = readAuthEndpointConfig();
  if (endpoint?.aiosHomeUrl) {
    return endpoint.aiosHomeUrl;
  }

  return getDefaultAuthEndpointConfig().aiosHomeUrl;
}

export function resolveAiosBackendUrl(): string {
  const endpoint = readAuthEndpointConfig();
  const bootstrap = readBootstrapState();
  const local = readLocalBootstrapConfig();

  // Before bootstrap completes, always use the endpoint saved at login time.
  if (!bootstrap.initialized && endpoint?.backendUrl) {
    return endpoint.backendUrl;
  }

  if (local?.aios.backendUrl) {
    return local.aios.backendUrl;
  }
  if (endpoint?.backendUrl) {
    return endpoint.backendUrl;
  }
  return getDefaultAuthEndpointConfig().backendUrl;
}
