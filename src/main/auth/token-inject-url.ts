import { SHELL_PARTITIONS } from "../../shared/shell/browser-partitions";
import { isAllowedUrl } from "../../shared/auth/auth-url";
import { getTokenInjectionPolicy } from "./token-injection-policy";

/** Partitions that receive Authorization header injection (aios-home only). */
export const TOKEN_INJECT_PARTITIONS = [SHELL_PARTITIONS.AIOS_HOME] as const;

/** Whether to attach Authorization for aios-home partition requests. */
export function shouldInjectTokenForUrl(url: string): boolean {
  const policy = getTokenInjectionPolicy();
  if (!policy.enabled) return false;
  return isAllowedUrl(url, policy.allowedOrigins);
}
