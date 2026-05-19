import { ipcRenderer } from "electron";
import type {
  ShellViewBoundsIPC,
  ShellViewCreateRequest,
  ShellViewSnapshot,
} from "../shared/shell/shell-view-contract";
import { ShellViewChannels } from "../shared/shell/shell-view-contract";
import type { ShellViewKind, ShellViewOptions } from "../shared/shell/view-contract";

export const shellViewApi = {
  create: (
    layerId: string,
    kind: ShellViewKind,
    url: string,
    options?: Partial<ShellViewOptions>,
  ): Promise<void> =>
    ipcRenderer.invoke(ShellViewChannels.CREATE, {
      layerId,
      kind,
      url,
      options,
    } satisfies ShellViewCreateRequest),

  activate: (layerId: string): Promise<void> =>
    ipcRenderer.invoke(ShellViewChannels.ACTIVATE, layerId),

  setBounds: (layerId: string, bounds: ShellViewBoundsIPC): Promise<void> =>
    ipcRenderer.invoke(ShellViewChannels.SET_BOUNDS, layerId, bounds),

  loadUrl: (layerId: string, url: string): Promise<void> =>
    ipcRenderer.invoke(ShellViewChannels.LOAD_URL, { layerId, url }),

  focus: (layerId: string): Promise<void> =>
    ipcRenderer.invoke(ShellViewChannels.FOCUS, layerId),

  hide: (layerId: string): Promise<void> =>
    ipcRenderer.invoke(ShellViewChannels.HIDE, layerId),

  destroy: (layerId: string): Promise<void> =>
    ipcRenderer.invoke(ShellViewChannels.DESTROY, layerId),

  getState: (layerId: string): Promise<ShellViewSnapshot | null> =>
    ipcRenderer.invoke(ShellViewChannels.GET_STATE, layerId),

  getAll: (): Promise<ShellViewSnapshot[]> =>
    ipcRenderer.invoke(ShellViewChannels.GET_ALL),
};
