import { BrowserWindow, ipcMain } from "electron";

let registered = false;

function getMainWindow(): BrowserWindow | null {
  const windows = BrowserWindow.getAllWindows();
  return windows.length > 0 ? windows[0] : null;
}

export function registerWindowIpc(): void {
  if (registered) return;
  registered = true;

  ipcMain.handle("window:minimize", () => {
    const win = getMainWindow();
    if (!win || win.isDestroyed()) return;
    win.minimize();
  });

  ipcMain.handle("window:maximize-or-restore", () => {
    const win = getMainWindow();
    if (!win || win.isDestroyed()) return;

    if (win.isMaximized()) {
      win.unmaximize();
      return;
    }

    win.maximize();
  });

  ipcMain.handle("window:close", () => {
    const win = getMainWindow();
    if (!win || win.isDestroyed()) return;
    win.close();
  });

  ipcMain.handle("window:is-maximized", () => {
    const win = getMainWindow();
    if (!win || win.isDestroyed()) return false;
    return win.isMaximized();
  });
}
