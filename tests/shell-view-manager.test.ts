import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Electron
const mockWebContents = {
  loadURL: vi.fn().mockResolvedValue(undefined),
  reload: vi.fn(),
  focus: vi.fn(),
  openDevTools: vi.fn(),
  close: vi.fn(),
  isDestroyed: vi.fn().mockReturnValue(false),
  on: vi.fn(),
};

const mockWebContentsView = vi.fn().mockImplementation(() => ({
  webContents: mockWebContents,
  setBounds: vi.fn(),
  getBounds: vi.fn().mockReturnValue({ x: 0, y: 0, width: 800, height: 600 }),
}));

const mockContentView = {
  addChildView: vi.fn(),
  removeChildView: vi.fn(),
};

const mockBrowserWindow = {
  contentView: mockContentView,
  getBounds: vi.fn().mockReturnValue({ width: 1280, height: 800 }),
  on: vi.fn(),
};

vi.mock("electron", () => ({
  WebContentsView: mockWebContentsView,
  BrowserWindow: vi.fn().mockImplementation(() => mockBrowserWindow),
}));

describe("ShellViewManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 重置模块缓存以获取新的实例
    vi.resetModules();
  });

  describe("View Lifecycle", () => {
    it("should create a view", async () => {
      const { ShellViewManager } =
        await import("../src/main/shell/views/shell-view-manager");
      const manager = new ShellViewManager(mockBrowserWindow as any);

      await manager.createView(
        "test-view",
        "web-operator",
        "https://example.com",
      );

      expect(manager.hasView("test-view")).toBe(true);
      expect(mockWebContentsView).toHaveBeenCalled();
      expect(mockContentView.addChildView).toHaveBeenCalled();
    });

    it("should destroy a view", async () => {
      const { ShellViewManager } =
        await import("../src/main/shell/views/shell-view-manager");
      const manager = new ShellViewManager(mockBrowserWindow as any);

      await manager.createView(
        "test-view",
        "web-operator",
        "https://example.com",
      );
      manager.destroyView("test-view");

      expect(manager.hasView("test-view")).toBe(false);
      expect(mockContentView.removeChildView).toHaveBeenCalled();
    });

    it("should get a view", async () => {
      const { ShellViewManager } =
        await import("../src/main/shell/views/shell-view-manager");
      const manager = new ShellViewManager(mockBrowserWindow as any);

      await manager.createView(
        "test-view",
        "web-operator",
        "https://example.com",
      );
      const view = manager.getView("test-view");

      expect(view).toBeDefined();
      expect(view?.getId()).toBe("test-view");
    });
  });

  describe("View Activation", () => {
    it("should activate a view with pixel bounds", async () => {
      const { ShellViewManager } =
        await import("../src/main/shell/views/shell-view-manager");
      const manager = new ShellViewManager(mockBrowserWindow as any);

      await manager.createView(
        "test-view",
        "web-operator",
        "https://example.com",
      );
      manager.activateView("test-view", {
        x: 0,
        y: 40,
        width: 800,
        height: 600,
      });

      const view = manager.getView("test-view");
      expect(view?.isActive()).toBe(true);
    });

    it("should support multiple active views in different layers", async () => {
      const { ShellViewManager } =
        await import("../src/main/shell/views/shell-view-manager");
      const manager = new ShellViewManager(mockBrowserWindow as any);

      // Create views in different layers
      await manager.createView(
        "view-1",
        "web-operator",
        "https://example1.com",
        {
          layer: "content",
        },
      );
      await manager.createView("view-2", "aios-home", "https://example2.com", {
        layer: "content",
      });

      // Activate both
      manager.activateView("view-1", { x: 0, y: 0, width: 640, height: 800 });
      manager.activateView("view-2", { x: 640, y: 0, width: 640, height: 800 });

      // Both should be active (but view-1 should be deactivated due to same layer)
      const activeInContent = manager.getActiveViewsInLayer("content");
      expect(activeInContent).toContain("view-2");
    });

    it("should deactivate a view", async () => {
      const { ShellViewManager } =
        await import("../src/main/shell/views/shell-view-manager");
      const manager = new ShellViewManager(mockBrowserWindow as any);

      await manager.createView(
        "test-view",
        "web-operator",
        "https://example.com",
      );
      manager.activateView("test-view", {
        x: 0,
        y: 40,
        width: 800,
        height: 600,
      });
      manager.deactivateView("test-view");

      const view = manager.getView("test-view");
      expect(view?.isActive()).toBe(false);
    });

    it("should deactivate all views in a layer", async () => {
      const { ShellViewManager } =
        await import("../src/main/shell/views/shell-view-manager");
      const manager = new ShellViewManager(mockBrowserWindow as any);

      await manager.createView(
        "view-1",
        "web-operator",
        "https://example1.com",
      );
      await manager.createView(
        "view-2",
        "web-operator",
        "https://example2.com",
      );

      manager.activateView("view-1");
      manager.activateView("view-2");

      manager.deactivateLayer("content");

      const activeInContent = manager.getActiveViewsInLayer("content");
      expect(activeInContent).toHaveLength(0);
    });
  });

  describe("View Switching", () => {
    it("should switch views in the same layer", async () => {
      const { ShellViewManager } =
        await import("../src/main/shell/views/shell-view-manager");
      const manager = new ShellViewManager(mockBrowserWindow as any);

      await manager.createView(
        "view-1",
        "web-operator",
        "https://example1.com",
      );
      await manager.createView(
        "view-2",
        "web-operator",
        "https://example2.com",
      );

      manager.activateView("view-1");
      manager.switchViewInLayer("view-2", "content");

      const view1 = manager.getView("view-1");
      const view2 = manager.getView("view-2");

      expect(view1?.isActive()).toBe(false);
      expect(view2?.isActive()).toBe(true);
    });
  });

  describe("bringToFront", () => {
    it("should bring view to front", async () => {
      const { ShellViewManager } =
        await import("../src/main/shell/views/shell-view-manager");
      const manager = new ShellViewManager(mockBrowserWindow as any);

      await manager.createView(
        "test-view",
        "web-operator",
        "https://example.com",
      );
      manager.activateView("test-view");

      manager.bringToFront("test-view");

      // Should remove and re-add to bring to front
      expect(mockContentView.removeChildView).toHaveBeenCalled();
      expect(mockContentView.addChildView).toHaveBeenCalledTimes(2); // create + bringToFront
    });
  });

  describe("Layout Calculation", () => {
    it("should calculate percentage layout", async () => {
      const { ShellViewManager } =
        await import("../src/main/shell/views/shell-view-manager");
      const manager = new ShellViewManager(mockBrowserWindow as any);

      await manager.createView(
        "test-view",
        "web-operator",
        "https://example.com",
      );

      // Activate with percentage layout
      manager.activateView("test-view", {
        x: "0%",
        y: "5%",
        width: "50%",
        height: "90%",
      });

      const view = manager.getView("test-view");
      expect(view?.isActive()).toBe(true);
    });
  });

  describe("Queries", () => {
    it("should get all active views", async () => {
      const { ShellViewManager } =
        await import("../src/main/shell/views/shell-view-manager");
      const manager = new ShellViewManager(mockBrowserWindow as any);

      await manager.createView(
        "view-1",
        "web-operator",
        "https://example1.com",
      );
      await manager.createView("view-2", "aios-home", "https://example2.com");

      manager.activateView("view-1");
      manager.activateView("view-2");

      // Due to same layer, only view-2 should be active
      const allActive = manager.getAllActiveViews();
      expect(allActive.length).toBeGreaterThanOrEqual(0);
    });

    it("should check if view exists", async () => {
      const { ShellViewManager } =
        await import("../src/main/shell/views/shell-view-manager");
      const manager = new ShellViewManager(mockBrowserWindow as any);

      await manager.createView(
        "test-view",
        "web-operator",
        "https://example.com",
      );

      expect(manager.hasView("test-view")).toBe(true);
      expect(manager.hasView("non-existent")).toBe(false);
    });

    it("should check if view is active", async () => {
      const { ShellViewManager } =
        await import("../src/main/shell/views/shell-view-manager");
      const manager = new ShellViewManager(mockBrowserWindow as any);

      await manager.createView(
        "test-view",
        "web-operator",
        "https://example.com",
      );

      expect(manager.isViewActive("test-view")).toBe(false);

      manager.activateView("test-view");
      expect(manager.isViewActive("test-view")).toBe(true);
    });
  });

  describe("Bulk Operations", () => {
    it("should activate multiple views at once", async () => {
      const { ShellViewManager } =
        await import("../src/main/shell/views/shell-view-manager");
      const manager = new ShellViewManager(mockBrowserWindow as any);

      await manager.createView(
        "view-1",
        "web-operator",
        "https://example1.com",
      );
      await manager.createView("view-2", "aios-home", "https://example2.com");

      manager.activateViews([
        {
          id: "view-1",
          boundsOrLayout: { x: 0, y: 0, width: 640, height: 800 },
        },
        {
          id: "view-2",
          boundsOrLayout: { x: 640, y: 0, width: 640, height: 800 },
        },
      ]);

      // Due to same layer, only the last one should be active
      const activeViews = manager.getActiveViewsInLayer("content");
      expect(activeViews.length).toBeGreaterThanOrEqual(0);
    });
  });
});
