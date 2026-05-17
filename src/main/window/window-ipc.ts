import { BrowserWindow, ipcMain } from "electron";

let registered = false;
let mainBrowserWindow: BrowserWindow | null = null;

function resolveTargetWindow(): BrowserWindow | null {
  const focused = BrowserWindow.getFocusedWindow();
  if (focused && !focused.isDestroyed()) {
    return focused;
  }

  if (mainBrowserWindow && !mainBrowserWindow.isDestroyed()) {
    return mainBrowserWindow;
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
    if (!win) return;
    win.minimize();
  });

  ipcMain.handle("window:maximize-or-restore", () => {
    const win = resolveTargetWindow();
    if (!win) return;

    if (win.isMaximized()) {
      win.unmaximize();
      return;
    }

    win.maximize();
  });

  ipcMain.handle("window:close", () => {
    const win = resolveTargetWindow();
    if (!win) return;
    win.close();
  });

  ipcMain.handle("window:is-maximized", () => {
    const win = resolveTargetWindow();
    if (!win) return false;
    return win.isMaximized();
  });
}
