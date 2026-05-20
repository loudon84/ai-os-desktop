/** Canonical web-operator session partition (see view-registry). */
export const WEB_OPERATOR_PARTITION = "persist:aios-external-web";

/** AI-OS home partition (token injection target). */
export const AIOS_HOME_PARTITION = "persist:aios-desktop";

const EXTERNAL_PREFIX = "external-browser:";

/**
 * Per-tab external browser partition.
 * layerId: external-browser:{uuid} → persist:external-browser-{uuid}
 */
export function externalBrowserPartition(layerId: string): string {
  const suffix = layerId.startsWith(EXTERNAL_PREFIX)
    ? layerId.slice(EXTERNAL_PREFIX.length)
    : layerId;
  return `persist:external-browser-${suffix}`;
}
