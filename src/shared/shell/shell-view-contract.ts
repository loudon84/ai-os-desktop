import type {
  ShellViewBounds,
  ShellViewKind,
  ShellViewLayer,
  ShellViewOptions,
  ShellViewState,
} from "./view-contract";

export const ShellViewChannels = {
  CREATE: "shell:view:create",
  ACTIVATE: "shell:view:activate",
  SET_BOUNDS: "shell:view:set-bounds",
  LOAD_URL: "shell:view:load-url",
  FOCUS: "shell:view:focus",
  HIDE: "shell:view:hide",
  DESTROY: "shell:view:destroy",
  GET_STATE: "shell:view:get-state",
  GET_ALL: "shell:view:get-all",
} as const;

export type ShellViewBoundsIPC = ShellViewBounds;

export interface ShellViewCreateRequest {
  layerId: string;
  kind: ShellViewKind;
  url: string;
  options?: Partial<ShellViewOptions>;
}

export interface ShellViewActivateRequest {
  layerId: string;
}

export interface ShellViewSetBoundsRequest {
  layerId: string;
  bounds: ShellViewBoundsIPC;
}

export interface ShellViewLoadUrlRequest {
  layerId: string;
  url: string;
}

export interface ShellViewFocusRequest {
  layerId: string;
}

export interface ShellViewHideRequest {
  layerId: string;
}

export interface ShellViewDestroyRequest {
  layerId: string;
}

export interface ShellViewSnapshot {
  id: string;
  kind: ShellViewKind;
  layer: ShellViewLayer;
  state: ShellViewState;
  bounds: ShellViewBounds;
  url: string;
  active: boolean;
}

export type ShellViewResponse = void;
