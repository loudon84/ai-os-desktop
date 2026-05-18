import { ipcRenderer } from "electron";
import type { ShellViewBoundsIPC } from "../shared/shell/shell-view-contract";
import { ShellViewChannels } from "../shared/shell/shell-view-contract";

export const shellViewApi = {
  activate: (layerId: string): Promise<void> =>
    ipcRenderer.invoke(ShellViewChannels.ACTIVATE, layerId),

  setBounds: (
    layerId: string,
    bounds: ShellViewBoundsIPC,
  ): Promise<void> =>
    ipcRenderer.invoke(ShellViewChannels.SET_BOUNDS, layerId, bounds),

  hide: (layerId: string): Promise<void> =>
    ipcRenderer.invoke(ShellViewChannels.HIDE, layerId),
};
