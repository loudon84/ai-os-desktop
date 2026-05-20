import type {
  ShellViewKind,
  ViewRegistryEntry,
} from "../../../shared/shell/view-contract";

/**
 * View 注册表
 *
 * 管理各种 View 类型的默认配置。
 */
export class ViewRegistry {
  private entries: Map<ShellViewKind, ViewRegistryEntry> = new Map();

  constructor() {
    this.registerDefaults();
  }

  /**
   * 注册 View 类型
   */
  register(kind: ShellViewKind, entry: ViewRegistryEntry): void {
    this.entries.set(kind, entry);
  }

  /**
   * 获取 View 类型配置
   */
  get(kind: ShellViewKind): ViewRegistryEntry | undefined {
    return this.entries.get(kind);
  }

  /**
   * 检查是否已注册
   */
  has(kind: ShellViewKind): boolean {
    return this.entries.has(kind);
  }

  /**
   * 获取所有已注册类型
   */
  getAllKinds(): ShellViewKind[] {
    return Array.from(this.entries.keys());
  }

  /**
   * 注册默认配置
   */
  private registerDefaults(): void {
    // Web Operator
    this.register("web-operator", {
      kind: "web-operator",
      defaultLayer: "content",
      defaultPartition: "persist:browser",
      defaultSandbox: true,
      defaultPreload: undefined,
    });

    // AI-OS Home
    this.register("aios-home", {
      kind: "aios-home",
      defaultLayer: "content",
      defaultPartition: "persist:aios-desktop",
      defaultSandbox: true,
      defaultContextIsolation: true,
      defaultPreload: undefined,
    });

    // External Browser
    this.register("external-browser", {
      kind: "external-browser",
      defaultLayer: "content",
      defaultSandbox: true,
    });

    // renderer-root 不纳入 ShellViewManager 管理
    // 因此不在注册表中
  }
}

// 全局单例
export const viewRegistry = new ViewRegistry();
