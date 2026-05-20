/** Canonical shell session partitions (V3.3). */
export const SHELL_PARTITIONS = {
  AIOS_HOME: "persist:aios-home",
  AIOS_WORKSPACE: "persist:aios-workspace",
  WEB_OPERATOR: "persist:web-operator",
  OFFICE: "persist:office",
  EXTERNAL_BROWSER_PREFIX: "persist:external-browser-",
} as const;

/** AI-OS home partition (token injection target). */
export const AIOS_HOME_PARTITION = SHELL_PARTITIONS.AIOS_HOME;

/** Web Operator partition (no token injection). */
export const WEB_OPERATOR_PARTITION = SHELL_PARTITIONS.WEB_OPERATOR;

const EXTERNAL_LAYER_PREFIX = "external-browser:";

/**
 * Per-tab external browser partition.
 * layerId: external-browser:{uuid} → persist:external-browser-{uuid}
 */
export function externalBrowserPartition(layerId: string): string {
  const suffix = layerId.startsWith(EXTERNAL_LAYER_PREFIX)
    ? layerId.slice(EXTERNAL_LAYER_PREFIX.length)
    : layerId;
  return `${SHELL_PARTITIONS.EXTERNAL_BROWSER_PREFIX}${suffix}`;
}

/** @deprecated Use externalBrowserPartition */
export const externalBrowserPartitionLegacy = externalBrowserPartition;
