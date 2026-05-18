import { WebContentsView, BrowserWindow } from "electron";
import { join } from "path";
import type {
  ShellViewKind,
  ShellViewLayer,
  ShellViewState,
  ShellViewBounds,
  ShellViewOptions,
} from "../../../shared/shell/view-contract";
import { viewRegistry } from "./view-registry";
import { viewEventBus } from "./view-events";

/**
 * 托管的 WebContentsView
 *
 * 封装单个 WebContentsView 的完整生命周期。
 */
export class ManagedWebContentsView {
  private view: WebContentsView | null = null;
  private state: ShellViewState = "creating";
  private id: string;
  private kind: ShellViewKind;
  private layer: ShellViewLayer;
  private parent: BrowserWindow;
  private currentBounds: ShellViewBounds = { x: 0, y: 0, width: 0, height: 0 };

  constructor(
    id: string,
    kind: ShellViewKind,
    parent: BrowserWindow,
    layer?: ShellViewLayer,
  ) {
    this.id = id;
    this.kind = kind;
    this.parent = parent;

    // 从注册表获取默认 layer
    const registryEntry = viewRegistry.get(kind);
    this.layer = layer ?? registryEntry?.defaultLayer ?? "content";
  }

  /**
   * 创建 WebContentsView 并加载 URL
   */
  async create(
    url: string,
    options?: Partial<ShellViewOptions>,
  ): Promise<void> {
    if (this.view && !this.view.webContents.isDestroyed()) {
      // View 已存在，直接导航
      await this.load(url);
      return;
    }

    this.setState("creating");

    const registryEntry = viewRegistry.get(this.kind);

    // 合并选项（优先级：传入 > 注册表 > 默认值）
    const sandbox = options?.sandbox ?? registryEntry?.defaultSandbox ?? true;
    const nodeIntegration =
      options?.nodeIntegration ??
      registryEntry?.defaultNodeIntegration ??
      false;
    const contextIsolation =
      options?.contextIsolation ??
      registryEntry?.defaultContextIsolation ??
      true;
    const partition =
      options?.partition ?? registryEntry?.defaultPartition ?? undefined;
    const preload =
      options?.preload ?? registryEntry?.defaultPreload ?? undefined;

    // 创建 WebContentsView
    const webPreferences: Electron.WebPreferences = {
      sandbox,
      nodeIntegration,
      contextIsolation,
    };

    if (partition) {
      webPreferences.partition = partition;
    }

    if (preload) {
      webPreferences.preload = preload;
    }

    this.view = new WebContentsView({ webPreferences });

    // 添加到父窗口
    this.parent.contentView.addChildView(this.view);

    // 初始隐藏（等待 activate）
    this.view.setBounds({ x: 0, y: 0, width: 0, height: 0 });

    // 绑定事件
    this.bindViewEvents();

    // 加载 URL
    this.setState("loading");
    await this.view.webContents.loadURL(url);
    this.setState("ready");

    // 触发事件
    viewEventBus.emitViewCreated(this.id, this.kind, this.layer);
  }

  /**
   * 加载新 URL
   */
  async load(url: string): Promise<void> {
    if (!this.view || this.view.webContents.isDestroyed()) {
      throw new Error(`View ${this.id} is not created or destroyed`);
    }

    this.setState("loading");
    await this.view.webContents.loadURL(url);
    this.setState("ready");
  }

  /**
   * 重新加载
   */
  reload(): void {
    if (!this.view || this.view.webContents.isDestroyed()) return;
    this.view.webContents.reload();
  }

  /**
   * 显示 View（设置 bounds）
   */
  show(bounds: ShellViewBounds): void {
    if (!this.view || this.view.webContents.isDestroyed()) return;

    this.currentBounds = bounds;
    this.view.setBounds(bounds);

    if (this.state !== "active") {
      this.setState("active");
      viewEventBus.emitViewActivated(this.id, this.kind, this.layer);
    }

    viewEventBus.emitViewBoundsChanged(this.id, this.kind, bounds);
  }

  /**
   * 隐藏 View（bounds 设为 0）
   */
  hide(): void {
    if (!this.view || this.view.webContents.isDestroyed()) return;

    this.view.setBounds({ x: 0, y: 0, width: 0, height: 0 });

    if (this.state === "active") {
      this.setState("hidden");
      viewEventBus.emitViewDeactivated(this.id, this.kind, this.layer);
    }
  }

  /**
   * 更新 bounds（保持 active 状态）
   */
  updateBounds(bounds: ShellViewBounds): void {
    if (!this.view || this.view.webContents.isDestroyed()) return;

    this.currentBounds = bounds;
    this.view.setBounds(bounds);

    viewEventBus.emitViewBoundsChanged(this.id, this.kind, bounds);
  }

  /**
   * 获取当前 bounds
   */
  getBounds(): ShellViewBounds {
    return { ...this.currentBounds };
  }

  /**
   * 聚焦
   */
  focus(): void {
    if (!this.view || this.view.webContents.isDestroyed()) return;
    this.view.webContents.focus();
  }

  /**
   * 打开开发者工具
   */
  openDevTools(): void {
    if (!this.view || this.view.webContents.isDestroyed()) return;
    this.view.webContents.openDevTools({ mode: "detach" });
  }

  /**
   * 销毁 View
   */
  destroy(): void {
    if (!this.view) return;

    const previousState = this.state;

    if (!this.view.webContents.isDestroyed()) {
      this.parent.contentView.removeChildView(this.view);
      this.view.webContents.close();
    }

    this.view = null;
    this.setState("destroyed");

    viewEventBus.emitViewDestroyed(this.id, this.kind, this.layer);
  }

  /**
   * 是否已就绪
   */
  isReady(): boolean {
    return this.view !== null && !this.view.webContents.isDestroyed();
  }

  /**
   * 是否处于 active 状态
   */
  isActive(): boolean {
    return this.state === "active";
  }

  /**
   * 获取 WebContents
   */
  getWebContents(): Electron.WebContents | null {
    if (!this.view || this.view.webContents.isDestroyed()) return null;
    return this.view.webContents;
  }

  /**
   * 获取状态
   */
  getState(): ShellViewState {
    return this.state;
  }

  /**
   * 获取 ID
   */
  getId(): string {
    return this.id;
  }

  /**
   * 获取 Kind
   */
  getKind(): ShellViewKind {
    return this.kind;
  }

  /**
   * 获取 Layer
   */
  getLayer(): ShellViewLayer {
    return this.layer;
  }

  /**
   * 获取底层 WebContentsView（供 ShellViewManager 操作 z-index）
   */
  getNativeView(): WebContentsView | null {
    return this.view;
  }

  /**
   * 设置状态
   */
  private setState(newState: ShellViewState): void {
    const previousState = this.state;
    this.state = newState;
    viewEventBus.emitViewStateChanged(this.id, newState, previousState);
  }

  /**
   * 绑定 View 事件
   */
  private bindViewEvents(): void {
    if (!this.view) return;

    this.view.webContents.on(
      "did-fail-load",
      (_event, errorCode, errorDescription) => {
        console.error(
          `[VIEW:${this.id}] Load failed:`,
          errorCode,
          errorDescription,
        );
      },
    );

    this.view.webContents.on("render-process-gone", (_event, details) => {
      console.error(
        `[VIEW:${this.id}] Renderer process gone:`,
        details.reason,
        details.exitCode,
      );
    });
  }
}
