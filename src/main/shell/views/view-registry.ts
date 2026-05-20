import type {
  ShellViewKind,
  ViewRegistryEntry,
} from "../../../shared/shell/view-contract";
import {
  AIOS_HOME_PARTITION,
  WEB_OPERATOR_PARTITION,
} from "../../../shared/shell/browser-partitions";

/**
 * ShellView session partition strategy (V3.2.1):
 *
 * - aios-home: persist:aios-home (+ token header injection on whitelisted origins)
 * - web-operator: persist:web-operator (no token injection)
 * - external-browser:*: persist:external-browser-{uuid} per tab (required at create; no token)
 */
export class ViewRegistry {
  private entries: Map<ShellViewKind, ViewRegistryEntry> = new Map();

  constructor() {
    this.registerDefaults();
  }

  register(kind: ShellViewKind, entry: ViewRegistryEntry): void {
    this.entries.set(kind, entry);
  }

  get(kind: ShellViewKind): ViewRegistryEntry | undefined {
    return this.entries.get(kind);
  }

  has(kind: ShellViewKind): boolean {
    return this.entries.has(kind);
  }

  getAllKinds(): ShellViewKind[] {
    return Array.from(this.entries.keys());
  }

  private registerDefaults(): void {
    this.register("web-operator", {
      kind: "web-operator",
      defaultLayer: "content",
      defaultPartition: WEB_OPERATOR_PARTITION,
      defaultSandbox: true,
      defaultPreload: undefined,
    });

    this.register("aios-home", {
      kind: "aios-home",
      defaultLayer: "content",
      defaultPartition: AIOS_HOME_PARTITION,
      defaultSandbox: true,
      defaultContextIsolation: true,
      defaultPreload: undefined,
    });

    // Per-tab partition required at create — see externalBrowserPartition()
    this.register("external-browser", {
      kind: "external-browser",
      defaultLayer: "content",
      defaultSandbox: true,
    });

    // renderer-root 不纳入 ShellViewManager 管理
  }
}

export const viewRegistry = new ViewRegistry();
