import { BrowserWindow, ipcMain } from "electron";

let registered = false;
let mainBrowserWindow: BrowserWindow | null = null;

function resolveTargetWindow(): BrowserWindow | null {
  if (mainBrowserWindow && !mainBrowserWindow.isDestroyed()) {
    return mainBrowserWindow;
  }

  const focused = BrowserWindow.getFocusedWindow();
  if (focused && !focused.isDestroyed()) {
    return focused;
  }

  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      return win;
    }
  }

  return null;
}

/** Bind the primary app window for frameless window controls (Windows/Linux). */
export function bindMainBrowserWindow(win: BrowserWindow | null): void {
  mainBrowserWindow = win;
}

export function registerWindowIpc(): void {
  if (registered) return;
  registered = true;

  ipcMain.handle("window:minimize", () => {
    const win = resolveTargetWindow();
    if (!win) {
      console.warn("[WINDOW-IPC] minimize: no target window found");
      return;
    }
    win.minimize();
  });

  ipcMain.handle("window:maximize-or-restore", () => {
    const win = resolveTargetWindow();
    if (!win) {
      console.warn("[WINDOW-IPC] maximize-or-restore: no target window found");
      return;
    }

    if (win.isMaximized()) {
      win.unmaximize();
      return;
    }

    win.maximize();
  });

  ipcMain.handle("window:close", () => {
    const win = resolveTargetWindow();
    if (!win) {
      console.warn("[WINDOW-IPC] close: no target window found");
      return;
    }
    win.close();
  });

  ipcMain.handle("window:is-maximized", () => {
    const win = resolveTargetWindow();
    if (!win) {
      console.warn("[WINDOW-IPC] is-maximized: no target window found");
      return false;
    }
    return win.isMaximized();
  });
}
